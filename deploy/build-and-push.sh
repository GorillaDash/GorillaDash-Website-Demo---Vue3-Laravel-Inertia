#!/usr/bin/env bash
# Build the web + ssr images from a single source build and push them to
# Artifact Registry. Both share the SAME tag (git SHA) so they deploy together.
#
# Optional (defaults baked in): PROJECT_ID (gorilla-dash-178800),
#   REGION (us-west1), REPO (hungry-gorilla), TAG (git short SHA)
#
#   ./deploy/build-and-push.sh                 # uses defaults
#   PROJECT_ID=other REGION=asia-east1 ./deploy/build-and-push.sh   # override
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-gorilla-dash-178800}"
REGION="${REGION:-us-west1}"
REPO="${REPO:-hungry-gorilla}"
TAG="${TAG:-$(git rev-parse --short HEAD)}"
REG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}"
# GKE nodes are amd64. Build for that even on an Apple Silicon (arm64) Mac,
# otherwise pods fail with "no match for platform in manifest". Override for
# Arm node pools with PLATFORM=linux/arm64.
PLATFORM="${PLATFORM:-linux/amd64}"

# Build context is the repo root (one dir up from this script).
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

echo ">> Authenticating Docker to ${REGION}-docker.pkg.dev"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

echo ">> Ensuring Artifact Registry repo '${REPO}' exists in ${REGION}"
gcloud artifacts repositories describe "${REPO}" \
  --location="${REGION}" --project="${PROJECT_ID}" >/dev/null 2>&1 \
  || gcloud artifacts repositories create "${REPO}" \
       --repository-format=docker --location="${REGION}" --project="${PROJECT_ID}"

echo ">> Building web image (${PLATFORM}) -> ${REG}/web:${TAG}"
docker build --platform "${PLATFORM}" -f deploy/Dockerfile --target web \
  -t "${REG}/web:${TAG}" -t "${REG}/web:latest" .

echo ">> Building ssr image (${PLATFORM}) -> ${REG}/ssr:${TAG}"
docker build --platform "${PLATFORM}" -f deploy/Dockerfile --target ssr \
  -t "${REG}/ssr:${TAG}" -t "${REG}/ssr:latest" .

echo ">> Pushing"
docker push "${REG}/web:${TAG}"
docker push "${REG}/web:latest"
docker push "${REG}/ssr:${TAG}"
docker push "${REG}/ssr:latest"

echo ">> Done. Images:"
echo "   ${REG}/web:${TAG}"
echo "   ${REG}/ssr:${TAG}"
echo ">> Deploy with:  PROJECT_ID=${PROJECT_ID} REGION=${REGION} TAG=${TAG} ./deploy/deploy.sh"
