#!/usr/bin/env bash
# Deploy one country's instance to GKE: render its overlay (namespace +
# config.env + domain), run migrations once, then roll out.
#
# Required:  COUNTRY (matches deploy/k8s/overlays/<country>, e.g. usa, au)
# Optional (defaults baked in): PROJECT_ID (gorilla-dash-178800), REGION (us-west1),
#            REPO (acme), TAG (git short SHA), NAMESPACE (acme-<country>),
#            CLUSTER (gorilladash-cluster), KUBE_CONTEXT (auto from project/region/cluster)
#
# Self-targets the expected GKE cluster on every kubectl call (via --context), so
# it never depends on or changes your current kubectl context.
#
# Images are country-agnostic — build/push ONCE with build-and-push.sh, then run
# this per country.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-gorilla-dash-178800}"
: "${COUNTRY:?Set COUNTRY (e.g. usa, au)}"
REGION="${REGION:-us-west1}"
REPO="${REPO:-acme}"
TAG="${TAG:-$(git rev-parse --short HEAD)}"
NAMESPACE="${NAMESPACE:-acme-${COUNTRY}}"
REG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}"
CLUSTER="${CLUSTER:-gorilladash-cluster}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OVERLAY="${ROOT}/deploy/k8s/overlays/${COUNTRY}"
[ -d "${OVERLAY}" ] || { echo "No overlay at ${OVERLAY}"; exit 1; }

# Target the intended GKE cluster explicitly on every kubectl call, so a deploy
# never depends on — or disturbs — your current kubectl context. GKE names
# contexts gke_<project>_<region>_<cluster>; override with KUBE_CONTEXT if you
# renamed it.
EXPECTED_CONTEXT="${KUBE_CONTEXT:-gke_${PROJECT_ID}_${REGION}_${CLUSTER}}"

# Pull credentials into kubeconfig if that context isn't there yet.
if ! kubectl config get-contexts -o name 2>/dev/null | grep -qx "${EXPECTED_CONTEXT}"; then
  echo ">> Context ${EXPECTED_CONTEXT} not in kubeconfig — fetching credentials from GKE..."
  gcloud container clusters get-credentials "${CLUSTER}" --region "${REGION}" --project "${PROJECT_ID}"
fi

# Pin every kubectl call below to that context without changing your global
# current-context (so other terminals/sessions are unaffected).
kubectl() { command kubectl --context="${EXPECTED_CONTEXT}" "$@"; }

# Guard: the image must already exist in Artifact Registry. `make deploy` tags
# with the current git SHA, but a manifest-only change (no rebuild) leaves no
# image at that tag — fail clearly here instead of an ImagePullBackOff later.
#
# Check the registry MANIFEST API directly (curl /v2/.../manifests/<tag>). Do
# NOT use `gcloud artifacts docker images describe`: that reads Artifact
# Registry's metadata index, which is populated ASYNCHRONOUSLY and lags a push by
# seconds-to-minutes, so it reports "not found" for an image that `make
# ship-cloud` just built and is already pullable — which failed real CI deploys
# (Cloud Build SUCCESS, then describe 404 for 25s+). The manifest API reflects
# actual registry state immediately. The short retry only rides out a transient
# token/network blip; override with IMAGE_CHECK_RETRIES / IMAGE_CHECK_DELAY.
image_exists() {
  local token http
  token="$(gcloud auth print-access-token 2>/dev/null)" || return 1
  http="$(curl -sS -o /dev/null -w '%{http_code}' \
    -H "Authorization: Bearer ${token}" \
    -H "Accept: application/vnd.docker.distribution.manifest.v2+json,application/vnd.oci.image.manifest.v1+json,application/vnd.docker.distribution.manifest.list.v2+json,application/vnd.oci.image.index.v1+json" \
    "https://${REGION}-docker.pkg.dev/v2/${PROJECT_ID}/${REPO}/web/manifests/${TAG}" 2>/dev/null)" || return 1
  [ "${http}" = "200" ]
}
IMAGE_CHECK_RETRIES="${IMAGE_CHECK_RETRIES:-3}"
IMAGE_CHECK_DELAY="${IMAGE_CHECK_DELAY:-3}"
image_found=false
for attempt in $(seq 1 "${IMAGE_CHECK_RETRIES}"); do
  if image_exists; then
    image_found=true
    break
  fi
  if [ "${attempt}" -lt "${IMAGE_CHECK_RETRIES}" ]; then
    echo ">> Image ${REG}/web:${TAG} not visible yet (attempt ${attempt}/${IMAGE_CHECK_RETRIES}); waiting ${IMAGE_CHECK_DELAY}s (Artifact Registry lag)..."
    sleep "${IMAGE_CHECK_DELAY}"
  fi
done
if [ "${image_found}" != true ]; then
  echo "!! Image ${REG}/web:${TAG} not found in Artifact Registry after ${IMAGE_CHECK_RETRIES} attempts."
  echo "   Build it first:        make ship COUNTRY=${COUNTRY}   (or make ship-cloud)"
  echo "   Or deploy a built tag: TAG=<built-sha> COUNTRY=${COUNTRY} make deploy"
  exit 1
fi

echo ">> Country=${COUNTRY}  Namespace=${NAMESPACE}  Tag=${TAG}  Context=${EXPECTED_CONTEXT}"
kubectl apply -f "${OVERLAY}/namespace.yaml"

# Per-country Secret (APP_KEY + DB creds) must exist — created out-of-band.
if ! kubectl -n "${NAMESPACE}" get secret acme-secret >/dev/null 2>&1; then
  echo "!! Secret 'acme-secret' not found in ${NAMESPACE}. Create it first (see README). Aborting."
  exit 1
fi

# 1) ConfigMap from this country's config.env first, so the migrate Job sees it.
kubectl -n "${NAMESPACE}" create configmap acme-config \
  --from-env-file="${OVERLAY}/config.env" --dry-run=client -o yaml \
  | kubectl -n "${NAMESPACE}" apply -f -

# 1b) ServiceAccount (Workload Identity) must exist before the migrate Job — and
#     the app pods — reference it via serviceAccountName.
kubectl -n "${NAMESPACE}" apply -f "${ROOT}/deploy/k8s/base/serviceaccount.yaml"

# 2) Migrate once for this release against this country's DB.
kubectl -n "${NAMESPACE}" delete job acme-migrate --ignore-not-found
sed "s#image: app-web#image: ${REG}/web:${TAG}#" "${ROOT}/deploy/k8s/base/migrate-job.yaml" \
  | kubectl -n "${NAMESPACE}" apply -f -
kubectl -n "${NAMESPACE}" wait --for=condition=complete --timeout=300s job/acme-migrate

# 3) Point the overlay at the freshly built images and roll out.
cd "${OVERLAY}"
kustomize edit set image \
  app-web="${REG}/web:${TAG}" \
  app-ssr="${REG}/ssr:${TAG}"
kubectl apply -k .

# Restore the placeholder tag so a deploy doesn't leave kustomization.yaml dirty
# in git (the live tag is only needed for the apply above).
kustomize edit set image \
  app-web="${REG}/web:latest" \
  app-ssr="${REG}/ssr:latest"

# 4) Wait for all three Deployments to become ready.
kubectl -n "${NAMESPACE}" rollout status deployment/acme
kubectl -n "${NAMESPACE}" rollout status deployment/acme-scheduler
kubectl -n "${NAMESPACE}" rollout status deployment/acme-worker
echo ">> ${COUNTRY} deployed."

# Optional origin-lockdown smoke (direct IP -> 403, through the edge -> 200). OFF by
# default: Cloud Armor attaches to the LB asynchronously and edge readiness is
# external, so it must not gate a normal release. Enable with SMOKE_LOCKDOWN=1;
# runs non-fatally so it can never fail the deploy.
if [ "${SMOKE_LOCKDOWN:-0}" = "1" ]; then
  echo ">> Running origin-lockdown smoke (SMOKE_LOCKDOWN=1)..."
  COUNTRY="${COUNTRY}" "${ROOT}/deploy/smoke-origin-lockdown.sh" \
    || echo "!! lockdown smoke did not pass (non-fatal — see output above)."
fi

# 5) Converge + purge the Cloudflare edge in front of this country (both non-fatal —
# the edge must never block an app release; worst case stale HTML expires with the
# cache TTL).
#
# Credentials resolve from, in order: the environment (CI passes the token as a
# secret), this country's overlay config.env (the non-secret per-country ids), and
# the repo .env (the token — local dev convenience). A country with no Cloudflare
# entry simply skips both steps and makes no API call at all.
overlay_value() { grep "^$1=" "${OVERLAY}/config.env" 2>/dev/null | cut -d= -f2- || true; }
env_value() { grep "^$1=" "${ROOT}/.env" 2>/dev/null | cut -d= -f2- || true; }

CLOUDFLARE_ZONE_ID="${CLOUDFLARE_ZONE_ID:-$(overlay_value CLOUDFLARE_ZONE_ID)}"
CLOUDFLARE_HOSTS="${CLOUDFLARE_HOSTS:-$(overlay_value CLOUDFLARE_HOSTS)}"
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-$(env_value CLOUDFLARE_API_TOKEN)}"

# Status of each edge step, surfaced in the deploy summary below. Each is one of
# ok | failed | skipped — they stay "skipped" if credentials don't resolve.
CF_RULES_STATUS="skipped"
CF_PURGE_STATUS="skipped"

if [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && [ -n "${CLOUDFLARE_ZONE_ID:-}" ]; then
  # 5a) Converge this country's hosts onto deploy/cloudflare/rules.sh. Drift-aware,
  # so a routine deploy writes nothing. It also probes the live host afterwards and
  # rolls itself back if a bypass rule stops matching — which is why a failure here
  # is reported but never fatal: the zone is left exactly as it was.
  if [ -n "${CLOUDFLARE_HOSTS:-}" ]; then
    echo ">> Ensuring Cloudflare cache rules match deploy/cloudflare/rules.sh..."
    # shellcheck disable=SC2086 # CLOUDFLARE_HOSTS is a space-separated list, on purpose.
    if CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN}" \
        "${ROOT}/deploy/cloudflare/apply-rules.sh" ${CLOUDFLARE_HOSTS}; then
      CF_RULES_STATUS="ok"
    else
      CF_RULES_STATUS="failed"
      echo "!! Cloudflare rule converge failed (non-fatal — the zone keeps its current rules)."
    fi
  fi

  # 5b) Purge the edge HTML cache so no visitor is served pre-deploy HTML that
  # references asset hashes the new pods no longer have — a stale page 404s its
  # JS/CSS, or version-skews into a 409 that Inertia resolves with a full reload
  # (which can be re-served the same stale HTML) — for up to the cache TTL. Purges
  # the "html" Cache-Tag that EdgeCacheGrant stamps on every cacheable page, so
  # assets and images stay cached.
  #
  # Cloudflare has NO soft purge: this EVICTS rather than marking stale and
  # revalidating, so the next request for every page purged here is a full SSR
  # render at origin. Survivable because the tag is only purged on deploy — which is
  # exactly why nothing more frequent should be wired to it (a CMS-publish webhook
  # should purge the narrow per-page tags instead). -f so an HTTP error (e.g. a dead
  # token) counts as a failure instead of a false "ok".
  echo ">> Purging Cloudflare edge HTML cache (Cache-Tag: html)..."
  if curl -fsS -X POST \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data '{"tags":["html"]}' \
      "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
      | grep -q '"success":true'; then
    CF_PURGE_STATUS="ok"
    echo "   purge accepted."
  else
    CF_PURGE_STATUS="failed"
    echo "!! Cloudflare purge failed (non-fatal — stale HTML expires with the TTL)."
  fi
else
  echo "!! CLOUDFLARE_API_TOKEN / CLOUDFLARE_ZONE_ID not resolvable — skipping the rule"
  echo "   converge + HTML purge (fine before the edge is wired up; cached pages may"
  echo "   reference old asset hashes for up to the cache TTL once it is)."
fi

# 6) Deploy summary. The edge steps are deliberately non-fatal (the edge must
# never block an app release), which makes a skip/failure easy to miss in the
# log noise — so surface it loudly here. An un-purged edge means anon visitors
# on a pre-deploy cached page hit a version-skew 409 that Inertia resolves with
# a FULL PAGE RELOAD, and that reload can be re-served the same stale HTML until
# the ~120s TTL lapses. To close the window, re-run just the purge:
#   curl -fsS -X POST -H "Authorization: Bearer <token>" \
#     -H "Content-Type: application/json" --data '{"tags":["html"]}' \
#     https://api.cloudflare.com/client/v4/zones/<zone-id>/purge_cache
edge_mark() { case "$1" in ok) echo "OK" ;; failed) echo "!! FAILED" ;; skipped) echo "!! SKIPPED (credentials did not resolve)" ;; esac; }
echo ""
echo "======== deploy summary: ${COUNTRY} @ ${TAG} ========"
echo "  rollout           : OK (web + scheduler + worker ready)"
echo "  cloudflare rules  : $(edge_mark "${CF_RULES_STATUS}")"
echo "  cloudflare purge  : $(edge_mark "${CF_PURGE_STATUS}")"
if [ "${CF_PURGE_STATUS}" != "ok" ]; then
  echo "  ^ edge HTML NOT purged — version-skew 409 -> full-reload possible for up to ~120s; re-run the purge (command above)."
fi
echo "===================================================="
