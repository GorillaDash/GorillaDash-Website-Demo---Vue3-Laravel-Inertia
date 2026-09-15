#!/usr/bin/env bash
#
# Converge a Cloudflare zone's cache rules onto the ones this repo owns (rules.sh).
#
# Usage:
#   CLOUDFLARE_API_TOKEN=xxxx ./apply-rules.sh <host> [<host> ...]
#   CLOUDFLARE_API_TOKEN=xxxx ./apply-rules.sh --dry-run <host>
#
# The token needs "Cache Settings Write" on the zone. The zone id is discovered from
# the host, so there is nothing per-country to configure here.
#
# Drift-aware, idempotent, safe to run on every deploy. Two properties matter more
# here than they would on a VCL edge, because Cloudflare's model is coarser:
#
# MERGE, DON'T REPLACE. The cache-rules entrypoint ruleset is ZONE-wide and there is no
# per-hostname ruleset. gorilladashstaging.com carries other GorillaDash sites, so a
# plain PUT of our rules would delete theirs. Every rule we own is tagged with a `ref`
# derived from the host; rules carrying any other ref are read back and rewritten
# untouched, in their original order.
#
# VERIFY, THEN KEEP. Applying is not the risky part — a bypass expression that never
# matches is. Nothing reports that: the API accepts it, the dashboard renders it, and
# the only symptom is a logged-in render quietly becoming the copy every visitor gets.
# So after writing, this runs verify-rules.sh against the live host and ROLLS BACK to
# the previous ruleset if any probe fails.
set -euo pipefail

API="https://api.cloudflare.com/client/v4"
PHASE="http_request_cache_settings"
HERE="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=rules.sh
source "${HERE}/rules.sh"

DRY_RUN=0
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
  shift
fi

[[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] || { echo "CLOUDFLARE_API_TOKEN is required" >&2; exit 1; }
[[ $# -ge 1 ]] || { echo "usage: CLOUDFLARE_API_TOKEN=... $0 [--dry-run] <host> [...]" >&2; exit 1; }
command -v jq >/dev/null || { echo "jq is required" >&2; exit 1; }

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

for HOST in "$@"; do
  echo "==> ${HOST}"

  ZONE_ID=$(zone_id_for "${HOST}") || { echo "  no Cloudflare zone found for ${HOST}" >&2; exit 1; }
  echo "  zone ${ZONE_ID}"

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
  PREFIX=$(gd_ref_prefix "${HOST}")
  OURS=$(gd_cache_rules "${HOST}")

  # Everything not ours, in the order the zone already has it, then our block last so
  # our bypasses win the stacking against our own general rule. A foreign rule placed
  # after ours could still override us, so say so rather than silently losing to it.
  FOREIGN=$(jq -c --arg p "${PREFIX}" '[.[] | select((.ref // "") | startswith($p) | not)]' <<<"${CURRENT_RULES}")
  FOREIGN_COUNT=$(jq 'length' <<<"${FOREIGN}")
  if [[ "${FOREIGN_COUNT}" -gt 0 ]]; then
    echo "  preserving ${FOREIGN_COUNT} rule(s) owned by something else on this zone"
    jq -r --arg h "${HOST}" '.[] | select(.expression | contains($h)) |
      "  !! foreign rule \(.ref // .id) also matches \($h) — it may override ours"' <<<"${FOREIGN}"
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
    continue
  fi

  echo "  drift detected; rules to write:"
  jq -r --arg p "${PREFIX}" '.[] |
    "    \(if (.ref // "") | startswith($p) then "gd " else "   " end)\(.ref // .id // "?")"' <<<"${DESIRED}"

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
  sleep 10

  if "${HERE}/verify-rules.sh" "${HOST}"; then
    continue
  fi

  echo "!! Verification FAILED — rolling ${HOST} back to the previous ruleset."
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
