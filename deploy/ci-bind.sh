#!/usr/bin/env bash
# One-time per REPO: let THIS GitHub repository's Actions mint GCP credentials
# for the deployer service account over OIDC (Workload Identity Federation).
#
# Run it before the repo's first `deploy.yml` run — `make bootstrap` does.
# Without it the workflow dies on its third step, and which of the two gates is
# missing decides which error you get:
#
#   unauthorized_client: "The given credential is rejected by the attribute
#   condition"                 -> the repo is not in the PROVIDER's condition
#   PERMISSION_DENIED on iam.serviceAccounts.getAccessToken
#                              -> the repo is not bound to the deployer SA
#
# Both gates are per-repo and both are set below, so a fresh client repo needs
# no hand-written gcloud.
#
# The pool and its provider are SHARED by every GorillaDash client repo. This
# only ever ADDS this repo to the condition that is already there; it never
# rewrites the others out of it, which is the one way this script could take a
# whole fleet's deploys offline at once.
#
# Optional (defaults baked in): PROJECT_ID (gorilla-dash-178800), SA
#   (github-deployer@<project>), POOL (github), PROVIDER (github-oidc),
#   GH_REPO (read from the origin remote)
#
#   ./deploy/ci-bind.sh
#   GH_REPO=GorillaDash/some-other-repo ./deploy/ci-bind.sh
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-gorilla-dash-178800}"
POOL="${POOL:-github}"
PROVIDER="${PROVIDER:-github-oidc}"
SA="${SA:-github-deployer@${PROJECT_ID}.iam.gserviceaccount.com}"

# owner/name of this checkout's GitHub remote. That string is exactly what
# GitHub puts in the OIDC token's `repository` claim, which is what both gates
# below match on — so a repo renamed on GitHub has to be re-run through here.
GH_REPO="${GH_REPO:-$(git remote get-url origin 2>/dev/null \
  | sed -E 's#^(git@github\.com:|https://github\.com/)##; s#\.git$##')}"

[[ "${GH_REPO}" =~ ^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$ ]] \
  || { echo "!! could not read owner/name from the 'origin' remote — pass GH_REPO=owner/name"; exit 1; }

PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
POOL_PATH="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}"
MEMBER="principalSet://iam.googleapis.com/${POOL_PATH}/attribute.repository/${GH_REPO}"
CLAUSE="assertion.repository=='${GH_REPO}'"

echo ">> repo    ${GH_REPO}"
echo ">> project ${PROJECT_ID} (${PROJECT_NUMBER})"
echo ">> deployer ${SA}"

# 1) The deployer SA is once per PROJECT, not per repo — `make ci-sa` creates it
#    and grants its roles. Refuse rather than create it here with no roles.
gcloud iam service-accounts describe "${SA}" --project="${PROJECT_ID}" >/dev/null 2>&1 \
  || { echo "!! ${SA} does not exist — run 'make ci-sa' first (once per GCP project)"; exit 1; }

# 2) Pool.
if ! gcloud iam workload-identity-pools describe "${POOL}" \
     --project="${PROJECT_ID}" --location=global >/dev/null 2>&1; then
  echo ">> creating workload identity pool '${POOL}'"
  gcloud iam workload-identity-pools create "${POOL}" \
    --project="${PROJECT_ID}" --location=global --display-name="GitHub Actions"
fi

# 3) Provider, and its attribute condition — the first gate.
if ! gcloud iam workload-identity-pools providers describe "${PROVIDER}" \
     --project="${PROJECT_ID}" --location=global --workload-identity-pool="${POOL}" >/dev/null 2>&1; then
  echo ">> creating OIDC provider '${PROVIDER}', admitting ${GH_REPO}"
  gcloud iam workload-identity-pools providers create-oidc "${PROVIDER}" \
    --project="${PROJECT_ID}" --location=global --workload-identity-pool="${POOL}" \
    --display-name="GitHub OIDC" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition="${CLAUSE}"
else
  CONDITION="$(gcloud iam workload-identity-pools providers describe "${PROVIDER}" \
    --project="${PROJECT_ID}" --location=global --workload-identity-pool="${POOL}" \
    --format='value(attributeCondition)')"

  # No condition at all means the provider admits EVERY repo on GitHub, and the
  # SA binding is the only thing standing between a stranger's workflow and this
  # project. Writing one from here would be right, but it would also lock out
  # whichever repos are relying on the open door, and this script cannot know
  # who they are. Report it.
  if [ -z "${CONDITION}" ]; then
    cat <<MSG
!! provider '${PROVIDER}' has NO attribute condition: any GitHub repository can
   present a token to it. Setting one from here would lock out every repo that
   relies on that today, so write the full list by hand:

     gcloud iam workload-identity-pools providers update-oidc ${PROVIDER} \\
       --project=${PROJECT_ID} --location=global --workload-identity-pool=${POOL} \\
       --attribute-condition="${CLAUSE} || assertion.repository=='OWNER/OTHER-REPO'"
MSG
    exit 1
  fi

  # Compare with whitespace and quote style normalised, so a hand-written
  # `assertion.repository == "x"` is recognised rather than appended twice.
  norm() { printf '%s' "$1" | tr -d '[:space:]' | tr '"' "'"; }
  if printf '%s' "$(norm "${CONDITION}")" | grep -qF "$(norm "${CLAUSE}")"; then
    echo ">> provider condition already admits ${GH_REPO}"
  else
    echo ">> adding ${GH_REPO} to the provider condition"
    echo "   before: ${CONDITION}"
    echo "   after : ${CONDITION} || ${CLAUSE}"
    gcloud iam workload-identity-pools providers update-oidc "${PROVIDER}" \
      --project="${PROJECT_ID}" --location=global --workload-identity-pool="${POOL}" \
      --attribute-condition="${CONDITION} || ${CLAUSE}" --quiet
  fi
fi

# 4) Impersonation — the second gate. Idempotent; the policy dump is noise.
echo ">> binding ${GH_REPO} -> ${SA} (roles/iam.workloadIdentityUser)"
gcloud iam service-accounts add-iam-policy-binding "${SA}" --project="${PROJECT_ID}" \
  --role=roles/iam.workloadIdentityUser --member="${MEMBER}" >/dev/null

# 5) The workflow reads two secrets. On GorillaDash they are ORG secrets, so a
#    repo in the org usually inherits both and there is nothing to do — but an
#    org secret is only visible to the repos it selects, so check rather than
#    assume. `actions/organization-secrets` lists exactly the org secrets THIS
#    repo can read; `actions/secrets` lists its own.
PROVIDER_PATH="${POOL_PATH}/providers/${PROVIDER}"
if command -v gh >/dev/null 2>&1; then
  VISIBLE="$( { gh api "repos/${GH_REPO}/actions/secrets" --jq '.secrets[].name' 2>/dev/null || true; \
                gh api "repos/${GH_REPO}/actions/organization-secrets" --jq '.secrets[].name' 2>/dev/null || true; } \
              | sort -u )"
  MISSING=""
  for s in GCP_WIF_PROVIDER GCP_SA_EMAIL; do
    if printf '%s\n' "${VISIBLE}" | grep -qx "$s"; then
      echo "   secret ${s}: available"
    else
      echo "   secret ${s}: MISSING"
      MISSING="yes"
    fi
  done
  if [ -n "${MISSING}" ]; then
    cat <<MSG

   Set what is missing on the repo (org-level is preferred — one place to rotate):
     gh secret set GCP_WIF_PROVIDER --repo "${GH_REPO}" --body "${PROVIDER_PATH}"
     gh secret set GCP_SA_EMAIL     --repo "${GH_REPO}" --body "${SA}"
MSG
  fi
else
  cat <<MSG
   gh not installed — confirm by hand that the repo can read these two secrets:
     GCP_WIF_PROVIDER = ${PROVIDER_PATH}
     GCP_SA_EMAIL     = ${SA}
MSG
fi

cat <<MSG

>> ${GH_REPO} can now deploy.
   IAM changes take up to ~2 minutes to propagate, and the federated token
   exchange starts passing BEFORE the impersonation does — so a deploy fired
   straight after this can still die further in, on
   "PERMISSION_DENIED ... iam.serviceAccounts.getAccessToken". Re-run it;
   nothing is wrong with the setup.
MSG
