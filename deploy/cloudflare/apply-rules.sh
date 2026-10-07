#!/usr/bin/env bash
#
# Converge a Cloudflare zone's cache rules onto the shared GD rules (rules.sh), with
# the given hosts in their host set.
#
# Usage:
#   CLOUDFLARE_API_TOKEN=xxxx ./apply-rules.sh <host> [<host> ...]
#   CLOUDFLARE_API_TOKEN=xxxx ./apply-rules.sh --dry-run <host>
#   CLOUDFLARE_API_TOKEN=xxxx ./apply-rules.sh --remove <host>   # decommission a host
#
# The token needs "Cache Settings Write" on the zone. The zone id is discovered from
# the host, so there is nothing per-country to configure here. Writing also needs
# gcloud with write access to the lock bucket (below); --dry-run needs neither.
#
# Drift-aware, idempotent, safe to run on every deploy. Four properties matter more
# here than they would on a VCL edge, because Cloudflare's model is coarser:
#
# MERGE, DON'T REPLACE. The cache-rules entrypoint ruleset is ZONE-wide and there is no
# per-hostname ruleset. gorilladashstaging.com carries other sites, so a plain PUT of
# our rules would delete theirs. Rules whose ref is not a GD one are read back and
# rewritten untouched, in their original order.
#
# ADD TO THE SET, NEVER REPLACE IT. The four GD rules are shared by every GD host on
# the zone (see rules.sh for why). The host set is read back from the zone and this
# run's hosts are added to it; a host is only ever dropped by --remove. A host that
# still carries the old per-host rules (all four `gd_<host>_*` refs) is folded into
# the set and those rules are deleted — that is the whole migration, and it happens on
# whichever repo's run gets there first.
#
# ONE WRITER AT A TIME. Every GD client repo runs this against the same zone, and the
# write is read-modify-write of the whole ruleset: two runs that overlap would each
# write back the set they read, and the later one would silently drop the host the
# earlier one added. GitHub's `concurrency` cannot prevent that — it is per repo. So
# each run holds a lock: an object in GCS created with `--if-generation-match=0`, which
# only one of two simultaneous creators can win. A lock older than LOCK_STALE_SECONDS
# is a run that died holding it, and is broken.
#
# VERIFY, THEN KEEP. Applying is not the risky part — a bypass expression that never
# matches is. Nothing reports that: the API accepts it, the dashboard renders it, and
# the only symptom is a logged-in render quietly becoming the copy every visitor gets.
# So after writing, this runs verify-rules.sh against every host whose rules changed
# and ROLLS BACK to the previous ruleset if any probe fails.
set -euo pipefail

API="https://api.cloudflare.com/client/v4"
PHASE="http_request_cache_settings"
HERE="$(cd "$(dirname "$0")" && pwd)"

# Any bucket every deployer (people and the CI service account) can write to. The
# Cloud Build staging bucket already is one, so there is nothing extra to grant.
LOCK_BUCKET="${CLOUDFLARE_LOCK_BUCKET:-gorilla-dash-178800_cloudbuild}"
LOCK_STALE_SECONDS="${CLOUDFLARE_LOCK_STALE_SECONDS:-600}"
LOCK_WAIT_SECONDS="${CLOUDFLARE_LOCK_WAIT_SECONDS:-300}"

# shellcheck source=rules.sh
source "${HERE}/rules.sh"

DRY_RUN=0
REMOVE=0
while [[ "${1:-}" == --* ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    --remove) REMOVE=1 ;;
    *) echo "unknown option $1" >&2; exit 1 ;;
  esac
  shift
done

[[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] || { echo "CLOUDFLARE_API_TOKEN is required" >&2; exit 1; }
[[ $# -ge 1 ]] || { echo "usage: CLOUDFLARE_API_TOKEN=... $0 [--dry-run] [--remove] <host> [...]" >&2; exit 1; }
command -v jq >/dev/null || { echo "jq is required" >&2; exit 1; }
if [[ ${DRY_RUN} -eq 0 ]]; then
  command -v gcloud >/dev/null || { echo "gcloud is required for the write lock (or pass --dry-run)" >&2; exit 1; }
fi

# Call the API, print `.result`, and fail loudly with Cloudflare's own error text.
# Cloudflare answers 200 with {"success": false} for some failures, so the body is
# checked as well as the status code.
cf_api() {
  local out code body
  out=$(curl -sS -w '\n%{http_code}' \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" "$@")
  code=${out##*$'\n'}
  body=${out%$'\n'*}
  if [[ "${code}" != 2* ]] || [[ "$(jq -r '.success' <<<"${body}" 2>/dev/null)" != "true" ]]; then
    echo "Cloudflare API ${code}: $(jq -c '.errors // .' <<<"${body}" 2>/dev/null || echo "${body}")" >&2
    return 1
  fi
  jq '.result' <<<"${body}"
}

# The zone serving $1, found by walking off labels: tgg-usa.gorilladashstaging.com is
# not itself a zone, gorilladashstaging.com is.
zone_id_for() {
  local name="$1" id
  while [[ "${name}" == *.* ]]; do
    id=$(cf_api "${API}/zones?name=${name}" | jq -r '.[0].id // empty')
    [[ -n "${id}" ]] && { printf '%s' "${id}"; return 0; }
    name="${name#*.}"
  done
  return 1
}

# ── The lock ─────────────────────────────────────────────────────────────────
LOCK_URL=""
LOCK_GENERATION=""

lock_release() {
  [[ -n "${LOCK_GENERATION}" ]] || return 0
  # Only our own lock: if it was broken as stale and someone else holds a new one,
  # its generation differs and this is refused.
  gcloud storage rm "${LOCK_URL}" --if-generation-match="${LOCK_GENERATION}" >/dev/null 2>&1 \
    || echo "  !! could not release ${LOCK_URL} (already broken as stale?)" >&2
  LOCK_GENERATION=""
}
trap lock_release EXIT

lock_acquire() {
  LOCK_URL="gs://${LOCK_BUCKET}/locks/cloudflare-cache-rules/$1.lock"
  local holder deadline created age generation
  holder=$(jq -cn --arg who "${GITHUB_REPOSITORY:-$(whoami)@$(hostname -s)}" \
    --arg run "${GITHUB_RUN_ID:-local}" '{holder: $who, run: $run}')
  deadline=$(($(date +%s) + LOCK_WAIT_SECONDS))

  while true; do
    if printf '%s' "${holder}" | gcloud storage cp - "${LOCK_URL}" --if-generation-match=0 >/dev/null 2>&1; then
      LOCK_GENERATION=$(gcloud storage objects describe "${LOCK_URL}" --format='value(generation)')
      echo "  lock ${LOCK_URL} acquired"
      return 0
    fi

    # Lost the race, or the bucket is unreachable. Tell the two apart, and break a
    # lock whose holder died: only its exact generation, so a lock someone else has
    # just taken over cannot be deleted by mistake.
    if ! generation=$(gcloud storage objects describe "${LOCK_URL}" --format='value(generation)' 2>/dev/null); then
      gcloud storage ls "gs://${LOCK_BUCKET}" >/dev/null || {
        echo "  cannot reach the lock bucket gs://${LOCK_BUCKET} — check gcloud auth" >&2
        return 1
      }
      continue # released between our create and our describe; try again at once
    fi
    created=$(gcloud storage objects describe "${LOCK_URL}" --format='value(creation_time)' 2>/dev/null || true)
    age=$(($(date +%s) - $(jq -rn --arg t "${created}" '$t | sub("\\+0000$"; "Z") | fromdateiso8601? // now | floor')))
    if [[ ${age} -gt ${LOCK_STALE_SECONDS} ]]; then
      echo "  !! breaking a stale lock (${age}s old): $(gcloud storage cat "${LOCK_URL}" 2>/dev/null || true)"
      gcloud storage rm "${LOCK_URL}" --if-generation-match="${generation}" >/dev/null 2>&1 || true
      continue
    fi
    if [[ $(date +%s) -ge ${deadline} ]]; then
      echo "  gave up waiting ${LOCK_WAIT_SECONDS}s for ${LOCK_URL}, held by: $(gcloud storage cat "${LOCK_URL}" 2>/dev/null || echo '?')" >&2
      return 1
    fi
    echo "  waiting for the lock, held by: $(gcloud storage cat "${LOCK_URL}" 2>/dev/null || echo '?')"
    sleep 5
  done
}

# ── Group the hosts by zone ───────────────────────────────────────────────────
# One lock and one write per zone, however many of its hosts were asked for.
PAIRS=""
for HOST in "$@"; do
  ZONE_ID=$(zone_id_for "${HOST}") || { echo "no Cloudflare zone found for ${HOST}" >&2; exit 1; }
  PAIRS+="${ZONE_ID} ${HOST}"$'\n'
done

for ZONE_ID in $(printf '%s' "${PAIRS}" | awk '{print $1}' | sort -u); do
  ASKED=$(printf '%s' "${PAIRS}" | awk -v z="${ZONE_ID}" '$1 == z {print $2}' | sort -u)
  echo "==> zone ${ZONE_ID}: $(tr '\n' ' ' <<<"${ASKED}")$([[ ${REMOVE} -eq 1 ]] && echo '(remove)')"

  [[ ${DRY_RUN} -eq 1 ]] || lock_acquire "${ZONE_ID}"

  # A zone that has never had a cache rule has no entrypoint ruleset for this phase
  # at all — the GET answers 10003 rather than an empty list, and PUTting to a
  # ruleset that does not exist fails the same way. So remember which case we are in:
  # the first write has to CREATE the ruleset, every later one updates it.
  ENTRYPOINT_EXISTS=1
  if ! CURRENT=$(cf_api "${API}/zones/${ZONE_ID}/rulesets/phases/${PHASE}/entrypoint" 2>/dev/null); then
    ENTRYPOINT_EXISTS=0
    CURRENT='{"rules":[]}'
    echo "  no cache-rules ruleset on this zone yet — it will be created"
  fi
  CURRENT_RULES=$(jq -c '.rules // []' <<<"${CURRENT}")
  CREATED_RULESET_ID=""

  # Hosts still on the old per-host rules: those carrying ALL FOUR of them. A host with
  # only some is not a shape this script ever wrote, so it is somebody else's and stays.
  LEGACY=$(jq -r --arg shared "${GD_SHARED_PREFIX}" --argjson n "${#GD_RULE_SUFFIXES[@]}" \
    --argjson sfx "$(printf '%s\n' "${GD_RULE_SUFFIXES[@]}" | jq -R . | jq -sc .)" '
    [.[] | select((.ref // "") | startswith("gd_") and (startswith($shared) | not))
         | (.expression | capture("^http\\.host eq \"(?<h>[^\"]+)\"") | .h) as $h
         | select(.ref as $r | $sfx | any(. as $s | $r == ("gd_" + ($h | gsub("[.-]"; "_")) + "_" + $s)))
         | $h]
    | group_by(.) | map(select(length == $n) | .[0]) | .[]' <<<"${CURRENT_RULES}")
  LEGACY_REFS=$(jq -c -n --arg hosts "${LEGACY}" --argjson sfx "$(printf '%s\n' "${GD_RULE_SUFFIXES[@]}" | jq -R . | jq -sc .)" '
    [$hosts | split("\n")[] | select(. != "") | gsub("[.-]"; "_") as $p | $sfx[] | "gd_" + $p + "_" + .]')

  SHARED=$(gd_shared_hosts <<<"${CURRENT_RULES}")
  if [[ ${REMOVE} -eq 1 ]]; then
    HOSTS=$(printf '%s\n%s\n' "${SHARED}" "${LEGACY}" | sed '/^$/d' | sort -u | grep -vxF -f <(printf '%s\n' "${ASKED}") || true)
    CHANGED=""
  else
    HOSTS=$(printf '%s\n%s\n%s\n' "${SHARED}" "${LEGACY}" "${ASKED}" | sed '/^$/d' | sort -u)
    # Verify every host whose rules this run changes: the ones it adds, and the ones it
    # migrates (their rules move from per-host refs to the shared set).
    CHANGED=$({ grep -vxF -f <(printf '%s\n' "${SHARED}") <<<"${HOSTS}" || true; printf '%s\n' "${LEGACY}"; } | sed '/^$/d' | sort -u)
  fi
  [[ -n "${LEGACY}" ]] && echo "  migrating from per-host rules: $(tr '\n' ' ' <<<"${LEGACY}")"

  # Everything not ours, in the order the zone already has it, then our block last so
  # our bypasses win the stacking against our own general rule. A foreign rule placed
  # after ours could still override us, so say so rather than silently losing to it.
  FOREIGN=$(jq -c --arg shared "${GD_SHARED_PREFIX}" --argjson legacy "${LEGACY_REFS}" '
    [.[] | select(((.ref // "") | startswith($shared) | not) and ((.ref // "") as $r | $legacy | index($r) | not))]' <<<"${CURRENT_RULES}")
  FOREIGN_COUNT=$(jq 'length' <<<"${FOREIGN}")
  if [[ "${FOREIGN_COUNT}" -gt 0 ]]; then
    echo "  preserving ${FOREIGN_COUNT} rule(s) owned by something else on this zone"
    while IFS= read -r H; do
      [[ -n "${H}" ]] || continue
      jq -r --arg h "${H}" '.[] | select(.expression | contains($h)) |
        "  !! foreign rule \(.ref // .id) also matches \($h) — it may override ours"' <<<"${FOREIGN}"
    done <<<"${HOSTS}"
  fi

  if [[ -n "${HOSTS}" ]]; then
    # shellcheck disable=SC2086 # one host per word, on purpose
    OURS=$(gd_cache_rules ${HOSTS})
  else
    OURS='[]'
  fi
  DESIRED=$(jq -c -n --argjson foreign "${FOREIGN}" --argjson ours "${OURS}" '$foreign + $ours')

  # Drift check ignores the fields Cloudflare owns, so a routine run is a no-op.
  #
  # `enabled` is normalized rather than deleted, and that is the difference between
  # this converging and never converging: a stored rule always comes back carrying
  # `enabled: true`, which no rule we send has, so comparing the two raw would report
  # drift forever — rewriting an identical ruleset on every deploy and every merge,
  # bumping the ruleset version each time. Defaulting it on BOTH sides also keeps a
  # deliberately disabled rule (`enabled: false`) meaningful.
  STRIP='[.[] | del(.id, .version, .last_updated, .ref_id) | .enabled = (.enabled // true)]'
  if [[ "$(jq -cS "${STRIP}" <<<"${CURRENT_RULES}")" == "$(jq -cS "${STRIP}" <<<"${DESIRED}")" ]]; then
    echo "  in sync — nothing to do"
    lock_release
    continue
  fi

  echo "  drift detected; GD host set: $(tr '\n' ' ' <<<"${HOSTS:-<empty>}")"
  echo "  rules to write:"
  jq -r --arg shared "${GD_SHARED_PREFIX}" '.[] |
    "    \(if (.ref // "") | startswith($shared) then "gd " else "   " end)\(.ref // .id // "?")"' <<<"${DESIRED}"

  if [[ ${DRY_RUN} -eq 1 ]]; then
    echo "  --dry-run: not writing"
    continue
  fi

  if [[ ${ENTRYPOINT_EXISTS} -eq 1 ]]; then
    cf_api -X PUT "${API}/zones/${ZONE_ID}/rulesets/phases/${PHASE}/entrypoint" \
      --data "$(jq -c -n --argjson rules "${DESIRED}" '{rules: $rules}')" >/dev/null
  else
    CREATED_RULESET_ID=$(cf_api -X POST "${API}/zones/${ZONE_ID}/rulesets" \
      --data "$(jq -c -n --arg phase "${PHASE}" --argjson rules "${DESIRED}" \
        '{name: "Zone-level cache rules", kind: "zone", phase: $phase, rules: $rules}')" \
      | jq -r '.id')
    echo "  created ruleset ${CREATED_RULESET_ID}"
  fi
  echo "  applied $(jq 'length' <<<"${DESIRED}") rule(s)"

  # Rule changes propagate in seconds, but not instantly; give the edge a moment
  # before asking it to prove itself.
  VERIFY_FAILED=0
  if [[ -n "${CHANGED}" ]]; then
    sleep 10
    while IFS= read -r H; do
      "${HERE}/verify-rules.sh" "${H}" || VERIFY_FAILED=1
    done <<<"${CHANGED}"
  fi

  if [[ ${VERIFY_FAILED} -eq 0 ]]; then
    lock_release
    continue
  fi

  echo "!! Verification FAILED — rolling zone ${ZONE_ID} back to the previous ruleset."
  if [[ -n "${CREATED_RULESET_ID}" ]]; then
    # There was nothing here before, and a ruleset cannot be emptied — the way back
    # to "this zone has no cache rules" is to delete what we just created.
    cf_api -X DELETE "${API}/zones/${ZONE_ID}/rulesets/${CREATED_RULESET_ID}" >/dev/null
    echo "   Deleted the ruleset we created; the zone has no cache rules again."
  else
    cf_api -X PUT "${API}/zones/${ZONE_ID}/rulesets/phases/${PHASE}/entrypoint" \
      --data "$(jq -c -n --argjson rules "${CURRENT_RULES}" '{rules: $rules}')" >/dev/null
    echo "   Rolled back to the previous ruleset."
  fi
  echo "   Fix the expression and re-run."
  exit 1
done
