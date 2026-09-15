# Deploy / ops shortcuts for Juniper Table on GKE.
# Most ops targets take COUNTRY (default usa).
# Override any var inline: `make build TAG=abc1234`.

PROJECT_ID ?= gorilla-dash-178800
REGION     ?= us-west1
REPO       ?= juniper-table
CLUSTER    ?= gorilladash-cluster
COUNTRY    ?= usa
REPLICAS   ?= 2
TAG        ?= $(shell git rev-parse --short HEAD)

NS       := juniper-table-$(COUNTRY)
CONTEXT  := gke_$(PROJECT_ID)_$(REGION)_$(CLUSTER)
GSA_NAME ?= k8s-sql
GSA      := $(GSA_NAME)@$(PROJECT_ID).iam.gserviceaccount.com

# The CI deployer — what GitHub Actions impersonates over OIDC. A DIFFERENT
# identity from GSA above: that one is the in-cluster Cloud SQL client, this one
# submits Cloud Builds and rolls out to GKE, and it is shared by every client
# repo in the project rather than created per client.
CI_SA_NAME ?= github-deployer
CI_SA      := $(CI_SA_NAME)@$(PROJECT_ID).iam.gserviceaccount.com

# The Ingress references this by NAME (global-static-ip-name), so it must match
# overlays/<COUNTRY>/ingress.yaml. GKE silently leaves the Ingress without an IP
# when the name doesn't resolve, so a typo here is a slow, quiet failure.
IP_NAME  ?= juniper-table-$(COUNTRY)-ip
# Source for `origin-tls-copy` (which namespace to lift the cert from). FROM names
# another COUNTRY of this client; FROM_NS/FROM_SECRET override that outright, which is
# how you copy the shared *.gorilladashstaging.com wildcard from a DIFFERENT client on
# the zone — e.g. FROM_NS=greatgreek-usa FROM_SECRET=greatgreek-origin-tls. That is the
# normal path on a first go-live, when no namespace of this client has a certificate
# yet. A Cloudflare Origin CA certificate is trusted on the origin leg only and by no
# browser, so sharing one across the zone's clients is the intended use, not a smell.
FROM        ?= usa
FROM_NS     ?= juniper-table-$(FROM)
FROM_SECRET ?= juniper-table-origin-tls

# Every kubectl below is pinned to the target cluster's context. Do NOT drop
# this: `deploy.sh` pins itself the same way, so a bare `kubectl` here would act
# on whatever your current-context happens to be — which is how a namespace and
# a live Secret can end up in the wrong cluster while `deploy.sh` reports the
# Secret as missing.
KUBECTL  := kubectl --context=$(CONTEXT)

# Picked up by deploy/*.sh from the environment.
export PROJECT_ID REGION REPO CLUSTER TAG

.DEFAULT_GOAL := help

help: ## Show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) \
	  | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

# ── Cluster context ──────────────────────────────────────────────────────────
context: ## Point kubectl at the target GKE cluster
	gcloud container clusters get-credentials $(CLUSTER) --region $(REGION) --project $(PROJECT_ID)

check-context: ## Show current vs expected kubectl context
	@echo "current : $$(kubectl config current-context 2>/dev/null)"
	@echo "expected: $(CONTEXT)"

# ── Build & deploy ───────────────────────────────────────────────────────────
build: ## Build + push web/ssr images to Artifact Registry (auto-creates the repo)
	./deploy/build-and-push.sh

deploy: ## Deploy one country (COUNTRY=<country>)
	COUNTRY=$(COUNTRY) ./deploy/deploy.sh

deploy-usa: ## Deploy USA
	@$(MAKE) deploy COUNTRY=usa

ship: build deploy ## Build + push, then deploy (COUNTRY=<country>)

rollback: ## Roll a country back to TAG=<sha> (COUNTRY=<country> TAG=abc1234)
	@test "$(TAG)" != "" || { echo "set TAG=<git-sha>"; exit 1; }
	COUNTRY=$(COUNTRY) TAG=$(TAG) ./deploy/deploy.sh

build-cloud: ## Build + push via Cloud Build (native amd64 on GCP, no local Docker)
	gcloud builds submit --region=$(REGION) --project=$(PROJECT_ID) \
	  --config=deploy/cloudbuild.yaml \
	  --substitutions=_REGION=$(REGION),_REPO=$(REPO),_TAG=$(TAG) .

ship-cloud: build-cloud deploy ## Cloud Build + deploy (COUNTRY=<country>)

# ── Workload Identity / Cloud SQL ────────────────────────────────────────────
wi-gsa: ## One-time: create the Cloud SQL GSA + grant roles/cloudsql.client
	gcloud services enable sqladmin.googleapis.com --project=$(PROJECT_ID)
	@gcloud iam service-accounts describe $(GSA) --project=$(PROJECT_ID) >/dev/null 2>&1 \
	  || gcloud iam service-accounts create $(GSA_NAME) --project=$(PROJECT_ID) \
	       --display-name="Kubernetes Cloud SQL client"
	gcloud projects add-iam-policy-binding $(PROJECT_ID) \
	  --member="serviceAccount:$(GSA)" --role="roles/cloudsql.client" --condition=None

wi-bind: ## Bind this country's KSA to the GSA via Workload Identity (COUNTRY=<country>)
	gcloud iam service-accounts add-iam-policy-binding $(GSA) --project=$(PROJECT_ID) \
	  --role="roles/iam.workloadIdentityUser" \
	  --member="serviceAccount:$(PROJECT_ID).svc.id.goog[$(NS)/juniper-table]"

# ── CI deploy credentials (GitHub Actions → GCP over OIDC) ─────────────────────
# Same split as wi-gsa/wi-bind above: the service account is once per PROJECT,
# admitting a repo to it is once per REPO. Skipping the second one is what makes
# a new client's first `deploy.yml` run die on "Authenticate to Google Cloud".
ci-sa: ## One-time per PROJECT: create the CI deployer SA + grant its roles
	@gcloud iam service-accounts describe $(CI_SA) --project=$(PROJECT_ID) >/dev/null 2>&1 \
	  || gcloud iam service-accounts create $(CI_SA_NAME) --project=$(PROJECT_ID) \
	       --display-name="GitHub Actions deployer"
	@# Submit Cloud Builds, roll out to GKE, push images, stage build source.
	@# add-iam-policy-binding is idempotent, so this is safe to re-run.
	@for role in roles/cloudbuild.builds.editor roles/container.developer \
	             roles/artifactregistry.writer roles/storage.admin \
	             roles/iam.serviceAccountUser; do \
	  gcloud projects add-iam-policy-binding $(PROJECT_ID) \
	    --member="serviceAccount:$(CI_SA)" --role="$$role" --condition=None >/dev/null \
	    && echo "   $$role"; \
	done

ci-bind: ## One-time per REPO: let THIS repo's Actions deploy via OIDC (no keys)
	@PROJECT_ID=$(PROJECT_ID) SA=$(CI_SA) ./deploy/ci-bind.sh

# ── Operations (per country: COUNTRY=<country>) ─────────────────────────────────
# ── Per-country bring-up ─────────────────────────────────────────────────────
reserve-ip: ## Reserve this country's global static IP (COUNTRY=usa) and print it
	@# Idempotent: ingress.yaml references the address by NAME, and GKE silently
	@# leaves the Ingress without an IP if it can't find it — so this must be
	@# safe to re-run as part of `bootstrap` without failing on an existing one.
	@gcloud compute addresses describe $(IP_NAME) --global --project=$(PROJECT_ID) >/dev/null 2>&1 \
	  || gcloud compute addresses create $(IP_NAME) --global --project=$(PROJECT_ID)
	@echo "$(IP_NAME): $$(gcloud compute addresses describe $(IP_NAME) --global \
	  --project=$(PROJECT_ID) --format='value(address)')  <- the origin address the CDN points at"

ns: ## Create the namespace in the TARGET cluster (context-pinned)
	$(KUBECTL) apply -f deploy/k8s/overlays/$(COUNTRY)/namespace.yaml

apply-secret: ## Apply overlays/<COUNTRY>/secret.yaml to the TARGET cluster (context-pinned)
	@test -f deploy/k8s/overlays/$(COUNTRY)/secret.yaml \
	  || { echo "deploy/k8s/overlays/$(COUNTRY)/secret.yaml not found — copy secret.example.yaml and fill it in"; exit 1; }
	$(KUBECTL) apply -f deploy/k8s/overlays/$(COUNTRY)/secret.yaml

origin-tls: ## Install an origin certificate as the Ingress TLS secret (CERT=... KEY=...)
	@# Not used until an overlay sets spec.tls: the CDN terminates TLS and the
	@# origin leg is plain HTTP. Reach for this when a host needs an authenticated
	@# origin — Cloudflare's Full (strict) mode, served by a Cloudflare Origin CA
	@# certificate. Adding one also means referencing juniper-table-origin-tls from that
	@# overlay's ingress.yaml, or nothing will present it.
	@test -n "$(CERT)" -a -n "$(KEY)" \
	  || { echo "usage: make origin-tls COUNTRY=$(COUNTRY) CERT=origin.pem KEY=origin.key"; exit 1; }
	@test -f "$(CERT)" || { echo "no such file: $(CERT)"; exit 1; }
	@test -f "$(KEY)"  || { echo "no such file: $(KEY)";  exit 1; }
	$(KUBECTL) -n $(NS) create secret tls juniper-table-origin-tls \
	  --cert="$(CERT)" --key="$(KEY)" --dry-run=client -o yaml | $(KUBECTL) apply -f -
	@echo ">> juniper-table-origin-tls installed. Re-apply the Ingress if it was created before this: make deploy COUNTRY=$(COUNTRY)"

origin-tls-copy: ## Copy an origin cert into this namespace (FROM=usa COUNTRY=nz, or FROM_NS=<ns> FROM_SECRET=<name>) — only if it covers the TLS hosts
	@# One wildcard certificate can serve every host on a shared domain, but the
	@# Secret is per-namespace and must be created once per country. Guarded on
	@# the SAN: installing a cert that doesn't cover the host fails the origin
	@# handshake rather than erroring at apply time.
	@#
	@# The hosts to check are the ones under spec.tls, NOT every host in spec.rules.
	@# An origin can front several edges at once and only some of those legs are
	@# TLS — a host answered over plain :80 is SUPPOSED not to be covered by the
	@# certificate, so checking spec.rules would reject a correct one.
	@test "$(FROM_NS)" != "$(NS)" || { echo "source and target namespace must differ (set FROM, or FROM_NS)"; exit 1; }
	@hosts="$$(awk '/^[[:space:]]*(-[[:space:]]+)?hosts:[[:space:]]*$$/{f=1;next} f&&/^[[:space:]]*-[[:space:]]/{sub(/^[[:space:]]*-[[:space:]]*/,"");print;next} f{f=0}' \
	  deploy/k8s/overlays/$(COUNTRY)/ingress.yaml)"; \
	test -n "$$hosts" || { echo "!! overlays/$(COUNTRY)/ingress.yaml declares no spec.tls — add one before copying a certificate into $(NS)"; exit 1; }; \
	$(KUBECTL) -n $(FROM_NS) get secret $(FROM_SECRET) -o jsonpath='{.data.tls\.crt}' \
	  | base64 -d > /tmp/origin-copy-$(COUNTRY).crt; \
	for h in $$hosts; do \
	  openssl x509 -in /tmp/origin-copy-$(COUNTRY).crt -noout -checkhost "$$h" | grep -q "does match" \
	    || { echo "!! $(FROM_NS)/$(FROM_SECRET) does not cover $$h — issue a new one and use 'make origin-tls'"; rm -f /tmp/origin-copy-$(COUNTRY).crt; exit 1; }; \
	  echo "   covers $$h"; \
	done; \
	rm -f /tmp/origin-copy-$(COUNTRY).crt; \
	echo ">> $(FROM_NS)/$(FROM_SECRET) covers every TLS host of $(COUNTRY) — copying into $(NS)"
	@$(KUBECTL) -n $(FROM_NS) get secret $(FROM_SECRET) -o json \
	  | jq '{apiVersion, kind, type, data, metadata: {name: "juniper-table-origin-tls", namespace: "$(NS)"}}' \
	  | $(KUBECTL) apply -f -

# ci-bind is per-REPO, not per-country, so on the second country it is a no-op —
# it is in here anyway because the cost of re-running it is nothing and the cost
# of forgetting it is a red deploy on a day you wanted to ship.
bootstrap: ci-bind reserve-ip ns wi-bind apply-secret ## Per-country bring-up: everything automatable (COUNTRY=nz)
	@echo ""
	@echo "======== $(COUNTRY) bootstrap done ========"
	@echo "  CI deploy credentials, reserved IP, namespace $(NS), Workload Identity binding, juniper-table-secret"
	@echo ""
	@echo "  Still manual — see deploy/CHECKLIST.md:"
	@echo "   1. Cloud SQL:  CREATE DATABASE $$(grep '^DB_DATABASE=' deploy/k8s/overlays/$(COUNTRY)/config.env | cut -d= -f2);"
	@echo "   2. Ingress:    set global-static-ip-name to $(IP_NAME) in overlays/$(COUNTRY)/ingress.yaml"
	@echo "   3. Cloudflare: origin -> the IP above; DNS -> proxied through Cloudflare"
	@echo "   4. Deploy:     make ship-cloud COUNTRY=$(COUNTRY)"
	@echo "=========================================="

# ── Operations (per country) ─────────────────────────────────────────────────
pods: ## List pods
	$(KUBECTL) -n $(NS) get pods

status: ## Deploys + ingress + cert status
	$(KUBECTL) -n $(NS) get deploy,ingress
	@$(KUBECTL) -n $(NS) describe managedcertificate juniper-table-cert 2>/dev/null | grep -E "Status|Domains" || true

logs-web: ## Tail web logs
	$(KUBECTL) -n $(NS) logs -f deploy/juniper-table -c web

logs-ssr: ## Tail SSR logs
	$(KUBECTL) -n $(NS) logs -f deploy/juniper-table -c ssr

logs-worker: ## Tail queue worker logs
	$(KUBECTL) -n $(NS) logs -f deploy/juniper-table-worker

logs-scheduler: ## Tail scheduler logs
	$(KUBECTL) -n $(NS) logs -f deploy/juniper-table-scheduler

restart: ## Restart all deploys (pick up config.env changes)
	$(KUBECTL) -n $(NS) rollout restart deploy

scale-worker: ## Scale queue workers (REPLICAS=3)
	$(KUBECTL) -n $(NS) scale deploy/juniper-table-worker --replicas=$(REPLICAS)

migrate: ## Run DB migrations in a running web pod
	$(KUBECTL) -n $(NS) exec deploy/juniper-table -c web -- php artisan migrate --force

shell: ## Shell into the web container
	$(KUBECTL) -n $(NS) exec -it deploy/juniper-table -c web -- bash

secret: ## Print the decoded Secret
	$(KUBECTL) -n $(NS) get secret juniper-table-secret \
	  -o go-template='{{range $$k,$$v := .data}}{{$$k}}={{$$v | base64decode}}{{"\n"}}{{end}}'

# ── Local ────────────────────────────────────────────────────────────────────
test: ## Run the Pest suite
	php artisan test --compact

.PHONY: help context check-context build deploy deploy-usa ship rollback \
        build-cloud ship-cloud wi-gsa wi-bind ci-sa ci-bind \
        pods status logs-web logs-ssr logs-worker logs-scheduler restart scale-worker \
        migrate shell secret test
