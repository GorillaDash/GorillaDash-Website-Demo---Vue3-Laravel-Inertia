#!/usr/bin/env bash
# Smoke-test the CDN origin lockdown for one country.
#
#   1) DIRECT to the origin LB IP over HTTP  -> must be 403 (Cloud Armor denies
#      anyone who is not the edge). This proves the lockdown is active.
#   2) THROUGH the edge over HTTPS           -> must be 200 + SSR HTML present.
#      (Skippable with SKIP_EDGE_CHECK=1 while the edge/DNS is not wired yet.)
#
# Cloud Armor attaches to the LB asynchronously (minutes) after a deploy, so
# check 1 polls until it flips to 403 (or RETRIES run out).
#
# Usage:
#   COUNTRY=usa ./deploy/smoke-origin-lockdown.sh
#   COUNTRY=usa SKIP_EDGE_CHECK=1 ./deploy/smoke-origin-lockdown.sh
# Overrides: DOMAIN, ORIGIN_IP (skip auto-detection), RETRIES, SLEEP.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-gorilla-dash-178800}"
: "${COUNTRY:?Set COUNTRY (e.g. usa, au)}"
REGION="${REGION:-us-west1}"
CLUSTER="${CLUSTER:-gorilladash-cluster}"
NAMESPACE="${NAMESPACE:-hungry-gorilla-${COUNTRY}}"
RETRIES="${RETRIES:-30}" # 30 * 10s = up to 5 min for LB propagation
SLEEP="${SLEEP:-10}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OVERLAY="${ROOT}/deploy/k8s/overlays/${COUNTRY}"
[ -d "${OVERLAY}" ] || { echo "No overlay at ${OVERLAY}"; exit 1; }

# Pin every kubectl call to the intended cluster without touching the global
# current-context (same approach as deploy.sh).
EXPECTED_CONTEXT="${KUBE_CONTEXT:-gke_${PROJECT_ID}_${REGION}_${CLUSTER}}"
kubectl() { command kubectl --context="${EXPECTED_CONTEXT}" "$@"; }

# DOMAIN: from the overlay's config.env APP_URL unless overridden.
if [ -z "${DOMAIN:-}" ]; then
  DOMAIN="$(grep -E '^APP_URL=' "${OVERLAY}/config.env" | head -1 | cut -d= -f2- | sed -E 's#^https?://##; s#/.*$##')"
fi
[ -n "${DOMAIN}" ] || { echo "!! Could not determine DOMAIN (set DOMAIN=...)"; exit 1; }

# ORIGIN_IP: the Ingress LB VIP, unless overridden.
if [ -z "${ORIGIN_IP:-}" ]; then
  ORIGIN_IP="$(kubectl -n "${NAMESPACE}" get ingress hungry-gorilla \
    -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)"
fi
[ -n "${ORIGIN_IP}" ] || { echo "!! Could not determine ORIGIN_IP (LB not ready? set ORIGIN_IP=...)"; exit 1; }

echo ">> Country=${COUNTRY}  Domain=${DOMAIN}  OriginIP=${ORIGIN_IP}"

# HTTP status of a request straight to the origin IP (Cloud Armor sees OUR IP).
origin_status() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 10 \
    -H "Host: ${DOMAIN}" "http://${ORIGIN_IP}/" || echo "000"
}

# --- Check 1: direct origin must be 403 (poll for LB propagation) ------------
echo ">> [1/2] Direct origin http://${ORIGIN_IP}/ should be 403 (non-edge denied)"
code=""
for ((n = 1; n <= RETRIES; n++)); do
  code="$(origin_status)"
  [ "${code}" = "403" ] && break
  echo "   attempt ${n}/${RETRIES}: got ${code}, waiting ${SLEEP}s for Cloud Armor to attach..."
  sleep "${SLEEP}"
done
if [ "${code}" != "403" ]; then
  echo "!! FAIL: origin returned ${code}, expected 403. Cloud Armor policy not active."
  echo "   Did you run deploy/setup-cloud-armor.sh AND deploy the BackendConfig?"
  exit 1
fi
echo "   PASS: origin denies direct access (403)."

# --- Check 2: through the edge must be 200 + SSR HTML --------------------------
if [ "${SKIP_EDGE_CHECK:-0}" = "1" ]; then
  echo ">> [2/2] Skipped (SKIP_EDGE_CHECK=1)."
  echo ">> Lockdown smoke passed."
  exit 0
fi

echo ">> [2/2] Through the edge https://${DOMAIN}/ should be 200 + SSR content"
fcode=""
for ((n = 1; n <= RETRIES; n++)); do
  fcode="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://${DOMAIN}/" || echo "000")"
  [ "${fcode}" = "200" ] && break
  echo "   attempt ${n}/${RETRIES}: got ${fcode}, waiting ${SLEEP}s (edge/DNS ready?)..."
  sleep "${SLEEP}"
done
if [ "${fcode}" != "200" ]; then
  echo "!! FAIL: https://${DOMAIN}/ returned ${fcode}, expected 200."
  echo "   Cloudflare not configured/pointing at the origin yet? Re-run with SKIP_EDGE_CHECK=1 to ignore."
  exit 1
fi
if ! curl -s --max-time 15 "https://${DOMAIN}/" | grep -q 'id="app"'; then
  echo "!! FAIL: 200 OK but no Inertia SSR markup (id=\"app\") — SSR/app may be broken."
  exit 1
fi
echo "   PASS: served through the edge (200) with SSR content."
echo ">> Lockdown smoke passed."
