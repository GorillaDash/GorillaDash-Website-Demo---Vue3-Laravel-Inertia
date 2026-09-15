#!/usr/bin/env bash
# Lock the GKE Ingress origin down to our CDN edge with a Cloud Armor policy.
#
# POLICY defaults to the project-wide `cloudflare-only` policy that the other
# client sites already attach — converging it refreshes THEIR allowlist too,
# which is the point: one policy, one weekly refresh, no stale duplicate.
#
# Why: TLS is terminated at the CDN and the CDN->origin leg is plain HTTP, so the
# GCE L7 load balancer serves http to anyone who hits the static IP directly,
# bypassing the edge (its cache, WAF, and https). This policy makes the LB return
# 403 to everyone EXCEPT the published edge ranges of the CDNs in EDGE_PROVIDERS.
#
# It is IDEMPOTENT — safe to re-run. First run creates the policy + rules; later
# runs (incl. the weekly GitHub Action) just refresh the allowed CIDRs, because
# every CDN rotates its ranges over time.
#
# ORDER MATTERS on first setup: run THIS first (so the allow rules exist), THEN
# apply the BackendConfig that references the policy (deploy/k8s/base/
# backendconfig.yaml -> spec.securityPolicy.name). Otherwise the default-deny
# rule blocks real traffic until the allow rules land.
#
# One-time IAM (grant the actor running this the rights to edit the policy):
#   # for the GitHub Actions deployer SA used by the refresh workflow:
#   gcloud projects add-iam-policy-binding gorilla-dash-178800 \
#     --member="serviceAccount:github-deployer@gorilla-dash-178800.iam.gserviceaccount.com" \
#     --role="roles/compute.securityAdmin"
#
# Requires: gcloud (authenticated), curl, jq.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-gorilla-dash-178800}"
POLICY="${POLICY:-cloudflare-only}"
# Every edge's allow rules share this priority band (10 CIDRs per rule — Cloud
# Armor's per-rule limit — so we chunk and manage the whole band together). The
# chunks are cut across the concatenated list, so one rule can straddle two
# providers; the band as a whole is what is converged, never a per-CDN slice.
ALLOW_START="${ALLOW_START:-1000}"
CHUNK_SIZE=10
# Which edges may reach this origin, comma-separated. Cloudflare fronts this app
# (deploy/cloudflare/); the fetcher for a second CDN is kept below so putting one
# in front of a client site is a one-word change here rather than a rewrite.
#
# ORDER MATTERS for a zero-gap rollout: chunks are cut across the concatenated
# list, so an incumbent provider listed FIRST keeps its existing rules
# byte-identical and the newcomer is appended as fresh rules. Put a new edge
# LAST and adding it can never momentarily drop a CIDR the live edge is using.
EDGE_PROVIDERS="${EDGE_PROVIDERS:-cloudflare}"
# Where each CDN publishes its edge IP ranges (IPv4 + IPv6). Both are public and
# need no credentials.
CLOUDFLARE_IP_URL="${CLOUDFLARE_IP_URL:-https://api.cloudflare.com/client/v4/ips}"
FASTLY_IP_URL="${FASTLY_IP_URL:-https://api.fastly.com/public-ip-list}"
# GCP health-check + LB source ranges. Health probes actually bypass Cloud Armor,
# but allowing them explicitly is a harmless safety belt.
GCP_LB_RANGES="35.191.0.0/16,130.211.0.0/22"
GCP_LB_PRIORITY=900

for bin in gcloud curl jq; do
  command -v "$bin" >/dev/null 2>&1 || { echo "!! '$bin' not found on PATH"; exit 1; }
done

gc() { gcloud --project="${PROJECT_ID}" "$@"; }

echo ">> Project=${PROJECT_ID}  Policy=${POLICY}"

# 1) Ensure the (global) security policy exists.
if ! gc compute security-policies describe "${POLICY}" >/dev/null 2>&1; then
  echo ">> Creating security policy ${POLICY}"
  gc compute security-policies create "${POLICY}" \
    --description "Allow only CDN edge IPs to reach the Hungry Gorilla origin (TLS is at the edge)."
fi

# 1b) Keep the description current even on a policy created by an earlier run, so a
# reader in the console can see which edges the allowlist is supposed to cover.
gc compute security-policies update "${POLICY}" \
  --description "Allow only CDN edge IPs (${EDGE_PROVIDERS}) to reach the Hungry Gorilla origin (TLS is at the edge)." >/dev/null

# 2) Default rule -> deny 403 (the auto-created default is 'allow'; flip it).
echo ">> Setting default rule (2147483647) to deny-403"
gc compute security-policies rules update 2147483647 \
  --security-policy "${POLICY}" --action "deny-403" >/dev/null

# 3) Allow GCP LB / health-check ranges (safety belt).
if gc compute security-policies rules describe "${GCP_LB_PRIORITY}" --security-policy "${POLICY}" >/dev/null 2>&1; then
  gc compute security-policies rules update "${GCP_LB_PRIORITY}" --security-policy "${POLICY}" \
    --src-ip-ranges "${GCP_LB_RANGES}" --action allow >/dev/null
else
  gc compute security-policies rules create "${GCP_LB_PRIORITY}" --security-policy "${POLICY}" \
    --description "GCP LB / health-check ranges" \
    --src-ip-ranges "${GCP_LB_RANGES}" --action allow >/dev/null
fi

# 4) Fetch every enabled edge's current ranges (IPv4 + IPv6, one CIDR per line).
#
# Each provider is fetched and counted on its OWN: an empty or malformed answer
# from one must abort the run rather than quietly shrink the allowlist to the
# other edge's ranges — that would 403 every request arriving through the CDN
# whose fetch failed, which is a full outage on that host.
EDGE_IPS="$(mktemp)"
PROVIDER_IPS="$(mktemp)"
trap 'rm -f "${EDGE_IPS}" "${PROVIDER_IPS}"' EXIT

for provider in ${EDGE_PROVIDERS//,/ }; do
  case "${provider}" in
    cloudflare)
      # {"result":{"ipv4_cidrs":[...],"ipv6_cidrs":[...]},"success":true}
      ip_url="${CLOUDFLARE_IP_URL}"
      ip_filter='.result.ipv4_cidrs[], .result.ipv6_cidrs[]'
      ;;
    fastly)
      # {"addresses":[...],"ipv6_addresses":[...]}
      ip_url="${FASTLY_IP_URL}"
      ip_filter='.addresses[], .ipv6_addresses[]'
      ;;
    *)
      echo "!! Unknown edge provider '${provider}' in EDGE_PROVIDERS (want: cloudflare, fastly)"; exit 1
      ;;
  esac

  echo ">> Fetching ${provider} IP ranges from ${ip_url}"
  # Two steps, not one pipeline into the counter: under `pipefail` a `|| true`
  # on the count would also swallow a failed curl/jq and read as "0 CIDRs".
  curl -fsSL "${ip_url}" | jq -r "${ip_filter}" > "${PROVIDER_IPS}"
  count="$(grep -c . "${PROVIDER_IPS}" || true)"
  [ "${count}" -gt 0 ] || { echo "!! Got 0 CIDRs from ${provider} — refusing to write a partial allowlist"; exit 1; }
  echo "   ${count} CIDRs"
  cat "${PROVIDER_IPS}" >> "${EDGE_IPS}"
done

# Portable read loop (macOS ships bash 3.2, which has no `mapfile`).
CIDRS=()
while IFS= read -r line; do
  [ -n "${line}" ] && CIDRS+=("${line}")
done < "${EDGE_IPS}"
[ "${#CIDRS[@]}" -gt 0 ] || { echo "!! Got 0 edge CIDRs — refusing to wipe the allowlist"; exit 1; }
echo ">> ${#CIDRS[@]} edge CIDRs total (${EDGE_PROVIDERS}) -> chunks of ${CHUNK_SIZE}"

# 5) Upsert one allow rule per chunk of ${CHUNK_SIZE} CIDRs. Update-in-place (no
#    gap where the allowlist is empty), then prune any leftover higher rules.
chunk_index=0
for ((i = 0; i < ${#CIDRS[@]}; i += CHUNK_SIZE)); do
  priority=$((ALLOW_START + chunk_index))
  ranges="$(IFS=,; echo "${CIDRS[*]:i:CHUNK_SIZE}")"
  if gc compute security-policies rules describe "${priority}" --security-policy "${POLICY}" >/dev/null 2>&1; then
    gc compute security-policies rules update "${priority}" --security-policy "${POLICY}" \
      --src-ip-ranges "${ranges}" --action allow >/dev/null
  else
    gc compute security-policies rules create "${priority}" --security-policy "${POLICY}" \
      --description "CDN edge (chunk ${chunk_index})" \
      --src-ip-ranges "${ranges}" --action allow >/dev/null
  fi
  echo "   rule ${priority}: $(echo "${ranges}" | tr ',' ' ' | wc -w | tr -d ' ') CIDRs"
  chunk_index=$((chunk_index + 1))
done

# 6) Prune stale allow rules from previous (larger) lists, above the last chunk.
prune=$((ALLOW_START + chunk_index))
while gc compute security-policies rules describe "${prune}" --security-policy "${POLICY}" >/dev/null 2>&1; do
  echo ">> Pruning stale rule ${prune}"
  gc compute security-policies rules delete "${prune}" --security-policy "${POLICY}" --quiet
  prune=$((prune + 1))
done

echo ">> Done. Ensure deploy/k8s/base/backendconfig.yaml references securityPolicy '${POLICY}',"
echo "   then re-deploy so the BackendConfig attaches the policy to the LB backend."
