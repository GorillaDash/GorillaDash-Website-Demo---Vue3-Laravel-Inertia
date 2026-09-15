# GKE deployment — Juniper Table (Laravel + Inertia SSR, multi-country)

One codebase, one set of images, **many countries**. Each country is a Kustomize
overlay (its own namespace, config, domain, database). Images are built **once**
and are country-agnostic — never bake a `.env.usa` into an image; inject config
at runtime.

> **Quick start:** run `make help` (from the repo root) to see every deploy/ops
> shortcut. First deploy: `make context && make ship COUNTRY=usa`. Step-by-step
> bring-up is in [`CHECKLIST.md`](./CHECKLIST.md).

## Per-pod layout (sidecar)

```
┌──────────────────────────────── Pod ────────────────────────────────┐
│  web (FrankenPHP + Octane worker mode, :8080) ─127.0.0.1:13714─▶ ssr │
└──────────────────────────────────────────────────────────────────────┘
        ▲ web + ssr share one image tag → no version skew
```

The `web` container runs **Laravel Octane on FrankenPHP** (worker mode): the app
boots once and stays in memory, so each request skips the framework bootstrap.
Started by the image CMD (`octane:frankenphp --workers=4 --max-requests=500`);
Octane generates its own Caddyfile (no custom one needed). See the `--workers`
↔ memory note in `base/deployment.yaml`.

Per namespace there are also `juniper-table-scheduler` (1 replica, `schedule:work`)
and `juniper-table-worker` (`queue:work`, scale as needed).

## Layout

```
deploy/k8s/
├── base/                     # shared, country-agnostic
│   ├── deployment.yaml        # web + ssr sidecar
│   ├── service.yaml  backendconfig.yaml  hpa.yaml
│   ├── scheduler.yaml         # schedule:work (1 replica)
│   ├── worker.yaml            # queue:work
│   ├── migrate-job.yaml       # one-shot per release (not in kustomize)
│   └── kustomization.yaml
└── overlays/
    ├── usa/
    │   ├── kustomization.yaml   # namespace + images + configMapGenerator
    │   ├── namespace.yaml       # the juniper-table-usa Namespace (declarative)
    │   ├── config.env           # ← this IS your ".env.usa" (non-secret)
    │   ├── ingress.yaml         # HTTP-only GKE Ingress (TLS is at Cloudflare)
    │   └── secret.example.yaml  # copy -> secret.yaml (gitignored), then apply
    └── <country>/               # add per country: same files, that country's values
```

`config.env` maps 1:1 to your `.env.<country>` mental model — APP_NAME, APP_URL,
DB host/name, timezone, etc. **Secrets stay out of it** (APP_KEY, DB credentials
go in a per-namespace Secret, ideally a different APP_KEY per country).

## Defaults

The scripts ship with these baked-in defaults (override any via env var):

| Var          | Default               | Set in                           |
| ------------ | --------------------- | -------------------------------- |
| `PROJECT_ID` | `gorilla-dash-178800` | `build-and-push.sh`, `deploy.sh` |
| `REGION`     | `us-west1`            | `build-and-push.sh`, `deploy.sh` |
| `REPO`       | `juniper-table`                | both                             |
| Cluster      | `gorilladash-cluster` | you pass it to `get-credentials` |
| `COUNTRY`    | _(required)_          | `deploy.sh`                      |

Per-country values you still edit by hand: domain (`overlays/<c>/ingress.yaml` +
`config.env` `APP_URL`), DB host/name (`config.env`), and the `Secret` (APP_KEY +
DB creds) in the `juniper-table-<c>` namespace.

## First-time go-live checklist

Run top to bottom. Steps A–C are once per project, C2 is once per repo, and
D–H repeat per country (`usa` shown — swap names/domain/DB for each additional
country).

**A. Project + APIs** _(once)_

- [ ] `gcloud config set project gorilla-dash-178800`
- [ ] `gcloud services enable artifactregistry.googleapis.com container.googleapis.com sqladmin.googleapis.com compute.googleapis.com servicenetworking.googleapis.com`

**B. Artifact Registry** _(once)_ — this is where the Docker images land

- [ ] `gcloud artifacts repositories create juniper-table --repository-format=docker --location=us-west1`

**C. Cluster access** _(once)_

- [ ] `gcloud container clusters get-credentials gorilladash-cluster --region us-west1 --project gorilla-dash-178800`
- [ ] `kubectl get nodes` returns the cluster's nodes

**C2. CI deploy credentials** _(A2 once per project, C2 once per repo)_

- [ ] `make ci-sa` — the `github-deployer` service account and its roles. Already
      done on an existing project; shared by every client repo.
- [ ] `make ci-bind` — admits THIS repo to the shared OIDC provider and binds it
      to that account. `make bootstrap` runs it, and without it the repo's first
      `deploy.yml` run fails on _Authenticate to Google Cloud_. See
      [CI deploy](#ci-deploy-github-actions--make-ship-cloud) for the two gates
      and why the provider's condition must never be written from a template.

**D. Cloud SQL** _(per country)_

- [ ] Create a MySQL instance (USA → `us-west1`) with **Private IP** on the cluster's VPC. Private IP needs **Private Service Access** on that VPC (the `servicenetworking` API in step A) — otherwise use the cloud-sql-proxy sidecar (commented in `base/deployment.yaml`).
- [ ] Create database `juniperTable_usa` and a DB user.
- [ ] Note the instance **private IP** → goes in `config.env` `DB_HOST`.

**E. Domain + static IP** _(per country)_

- [ ] `make reserve-ip COUNTRY=usa` — reserves `juniper-table-usa-ip` if it isn't there yet and
      prints the address. Idempotent, so `make bootstrap` can re-run it.
- [ ] Point your DNS **A record** (`juniper-table-usa.example.com`) at that IP.
- [ ] In `overlays/usa/ingress.yaml`: set the domain (2 places) and uncomment `global-static-ip-name: juniper-table-usa-ip`.

**F. Namespace + Secret + config** _(per country)_

- [ ] `make ns COUNTRY=usa` — the make targets pin `--context` at the target
      cluster; a bare `kubectl` applies to whatever your current-context is.
- [ ] Create the Secret (unique APP_KEY per country) — declarative file:
  ```bash
  cp deploy/k8s/overlays/usa/secret.example.yaml deploy/k8s/overlays/usa/secret.yaml
  # edit secret.yaml: APP_KEY (php artisan key:generate --show), DB_PASSWORD
  make apply-secret COUNTRY=usa   # context-pinned; namespace is in the file
  ```
- [ ] Edit `overlays/usa/config.env`: `APP_URL`, `DB_HOST` (private IP), `DB_DATABASE`.

**F2. Origin certificate** _(per country)_

- [ ] `make origin-tls-copy COUNTRY=usa FROM_NS=<other-client-ns> FROM_SECRET=<their>-origin-tls`
      — the zone is Full (strict); see [Origin certificate](#origin-certificate).

**G. Build + deploy**

- [ ] `./deploy/build-and-push.sh` (builds + pushes web/ssr images to Artifact Registry)
- [ ] `COUNTRY=usa ./deploy/deploy.sh` (migrates, then rolls out)

**H. Verify**

- [ ] `kubectl -n juniper-table-usa get pods` — web/ssr/scheduler/worker all Ready
- [ ] Origin lockdown: `./deploy/setup-cloud-armor.sh` ran + `backendconfig.yaml` deployed; Cloudflare holds the public cert, the origin presents its Origin CA cert to Cloudflare
- [ ] Smoke: `COUNTRY=usa ./deploy/smoke-origin-lockdown.sh` — direct IP → `403`, through the edge → `200` (use `SKIP_EDGE_CHECK=1` before Cloudflare is wired)
- [ ] Edge cache rules: `./deploy/cloudflare/verify-rules.sh <host>` — anonymous page cacheable, session/Inertia/`?debug=1` bypassed
- [ ] SSR check: `curl -s https://juniper-table-usa.example.com | grep -o 'id="app">..*' | head -1` is non-empty
- [ ] Assets load over https (DevTools → Network: `/build/assets/*` are `https` 200)
- [ ] `juniper-table-scheduler` / `juniper-table-worker` Running (idle until you add scheduled tasks/jobs)

## Deploy (subsequent releases)

```bash
./deploy/build-and-push.sh                 # build + push images ONCE
COUNTRY=usa ./deploy/deploy.sh             # migrate + roll out USA (repeat per country)
```

`deploy.sh` applies the country's ConfigMap, runs the migrate Job against that
country's DB, then `kubectl apply -k overlays/<country>` and waits for web +
scheduler + worker. Roll back with `TAG=<old-sha> COUNTRY=usa ./deploy/deploy.sh`.

> Config-only change (edited `config.env`)? Re-run `deploy.sh`, then
> `kubectl -n juniper-table-<c> rollout restart deploy` so pods re-read it.

### Add a new country (e.g. NZ)

```bash
cp -r deploy/k8s/overlays/usa deploy/k8s/overlays/nz
# edit overlays/nz/{kustomization.yaml (namespace), config.env, ingress.yaml}
kubectl create namespace juniper-table-nz && kubectl -n juniper-table-nz create secret ...
COUNTRY=nz ./deploy/deploy.sh
```

> **Latency / data residency:** namespace-per-country on one cluster is simplest.
> If a country's users need a local-region cluster (or its data must stay
> in-region), spin up a second GKE cluster there and run the _same_ overlay
> against it — just
> switch `kubectl` context first. The overlay structure is identical either way.

## Scheduler & queue (per country)

- **Scheduler:** `base/scheduler.yaml` runs `php artisan schedule:work` as a
  single-replica Deployment (`strategy: Recreate` so two never overlap). It runs
  `schedule:run` internally every minute — no per-minute pod churn. Define tasks
  in `routes/console.php` with `Schedule::command('...')->daily()` etc. Each
  namespace gets its own scheduler bound to its own DB.
  _(Alternative: a k8s `CronJob` calling `schedule:run` every minute with
  `concurrencyPolicy: Forbid` — heavier on pod churn; the Deployment is simpler.)_
- **Worker:** `base/worker.yaml` runs `php artisan queue:work` (graceful SIGTERM,
  finishes in-flight jobs). Scale via `replicas`; the `database` queue locks rows
  so workers don't double-process. Bump to Redis/Memorystore for high throughput.

## SSR specifics

- `ssr` container runs `bootstrap/ssr/ssr.js` (`createServer()` binds `0.0.0.0:13714`,
  health at `/health`) — what `inertia:start-ssr` does, without PHP in the image.
- `vite.config.ts` pins the SSR entry (`resources/ts/ssr.ts`) to `bootstrap/ssr/ssr.js`.
- `INERTIA_SSR_ENSURE_BUNDLE_EXISTS=false` because the web container ships no
  bundle (per the [Inertia v3 docs](https://inertiajs.com/docs/v3/advanced/server-side-rendering)).
- SSR load is mostly **bots** (humans only SSR the first load; SPA after). HPA
  scales `ssr` on CPU; cache public SSR HTML to cut bot-driven CPU.

## Recovering / rotating secrets

A Kubernetes Secret is only **base64-encoded, not encrypted** — if you forget the
values, read them straight back from the cluster (you don't lose them):

```bash
# one key
kubectl -n juniper-table-usa get secret juniper-table-secret \
  -o jsonpath='{.data.APP_KEY}' | base64 -d; echo

# all keys, decoded
kubectl -n juniper-table-usa get secret juniper-table-secret \
  -o go-template='{{range $k,$v := .data}}{{$k}}={{$v | base64decode}}{{"\n"}}{{end}}'
```

⚠️ The one thing you can't recover is a **deleted** APP_KEY. If the Secret is
gone and you kept no copy, a new key invalidates every existing encrypted cookie,
session, and `encrypted`-cast column. So keep a durable source of truth:

- Simplest: your filled-in `overlays/<c>/secret.yaml` is gitignored — back it up
  in a password manager.
- Production: store secrets in **Google Secret Manager** (durable, versioned,
  readable any time) and sync into the cluster with the **External Secrets
  Operator**, instead of applying YAML by hand.

To rotate a value: edit `secret.yaml`, `kubectl apply -f` it, then
`kubectl -n juniper-table-<c> rollout restart deploy` so pods pick it up.

## Origin certificate

Cloudflare reaches this origin over TLS **and validates it** — the shared staging
zone is on SSL mode "Full (strict)", a zone-wide switch shared with every other
client on it. So the Ingress has to present a certificate Cloudflare trusts: a
**Cloudflare Origin CA** one, named by the overlay's `spec.tls` and held in
`juniper-table-origin-tls`. Without it every request through the edge answers **525**,
while the cluster reads healthy from the inside.

```bash
# The normal path: copy the zone's shared wildcard from a namespace that has it.
make origin-tls-copy COUNTRY=usa FROM_NS=<other-client-ns> FROM_SECRET=<their>-origin-tls
```

Sharing one `*.<zone>` certificate across the zone's clients is deliberate. An
Origin CA certificate is trusted on the origin leg only and by no browser, so a
stolen key is worth nothing to anyone who cannot also make Cloudflare connect to
their server — and one certificate is one thing to rotate instead of one per
client. `make origin-tls-copy` refuses a certificate that does not cover the
overlay's `spec.tls` hosts, so a wrong source fails there rather than as a
handshake error later.

Issue a per-host certificate instead (Cloudflare dashboard → SSL/TLS → Origin
Server → Create Certificate, then `make origin-tls CERT=… KEY=…`) only for a zone
where one client must not hold a certificate valid for its neighbours.

Replacing the Secret is the whole operation: the GKE Ingress controller re-syncs
the load balancer's certificate from it within a minute or two, with no downtime
and no Ingress edit.

## Hardening checklist

- Trust the proxies for the real client IP: `->trustProxies(at: '*')` in `bootstrap/app.php`.
- Force https so asset/URL generation stays off `http://` (TLS is at Cloudflare, the
  LB resets `X-Forwarded-Proto` to http): `APP_FORCE_HTTPS=true` in each `config.env`.
- Lock the http origin to the edge only: `deploy/setup-cloud-armor.sh` builds an
  `edge-only` Cloud Armor policy (default deny, allow the published edge IPs of
  everything in `EDGE_PROVIDERS`), attached via `backendconfig.yaml`. Run it BEFORE
  attaching the policy; it's re-run weekly by
  `.github/workflows/refresh-edge-ips.yml`. One-time: grant `github-deployer`
  `roles/compute.securityAdmin`.
- Run containers as non-root; add `PodDisruptionBudget` + per-namespace `ResourceQuota`.
- Manage Secrets via Google Secret Manager + External Secrets Operator instead of `kubectl create secret`.

## CI deploy (GitHub Actions → `make ship-cloud`)

`.github/workflows/deploy.yml` is a manual (`workflow_dispatch`) job: pick a
country from the dropdown and it runs the two halves of `make ship-cloud` —
Cloud Build, then the GKE deploy — on a GitHub-hosted runner. Auth is
**Workload Identity Federation**; no service-account keys are stored in the
repo.

The image tag is the commit sha and carries no country, so every country shares
one build. Deploying a second country from the same commit finds `web:<sha>`
and `ssr:<sha>` already in Artifact Registry and skips Cloud Build — about four
minutes off the run. Tick **force_build** to rebuild anyway; you want it if the
tag's content is no longer what the commit would produce today.

To deploy an already-built image by hand, name the tag and no build happens at
all:

```bash
make deploy COUNTRY=<c> TAG=<sha>
```

### One-time GCP setup

Two idempotent `make` targets. The split is the point: the deployer service
account is once per **GCP project**, admitting a repo to it is once per **repo**
— same shape as `wi-gsa` / `wi-bind` for the Cloud SQL identity.

```bash
make ci-sa     # once per GCP project: creates github-deployer + grants its roles
make ci-bind   # once per client repo: admits THIS repo, then checks the secrets
```

`ci-bind` reads `owner/name` from the `origin` remote — that string is exactly
what GitHub puts in the OIDC token's `repository` claim, which is what both
gates below match on — and `make bootstrap` runs it, so a client that follows
the per-country bring-up never has to remember this page. Run it again after
renaming a repo on GitHub; the old name is what is bound.

> ⚠ **The pool and its provider are shared by every client repo in the
> project.** `ci-bind` only ever _appends_ this repo to the provider's attribute
> condition. Never write that condition from a template: `--attribute-condition`
> naming one repo **replaces** the whole list, and every other client's deploys
> then fail at their next run with nothing changed on their side. An earlier
> version of this section told you to do exactly that.

#### The two gates, and which error means which

A deploy has to clear both, in this order:

| Where it fails                                                                                                        | What is missing                                                                  |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| _Authenticate to Google Cloud_ — `unauthorized_client`: "The given credential is rejected by the attribute condition" | the repo is not in the **provider's attribute condition**                        |
| a later step — `PERMISSION_DENIED` on `iam.serviceAccounts.getAccessToken`                                            | the repo is not a **`roles/iam.workloadIdentityUser` member** on the deployer SA |

Clearing the first says nothing about the second. `google-github-actions/auth`
performs only the federated token exchange and writes a credential file; the
impersonation it describes is not attempted until the first `gcloud` call, which
is why a repo can authenticate "successfully" and then die in Cloud Build. IAM
edits also take up to ~2 minutes to propagate, so a deploy fired straight after
`ci-bind` can still show the second error — re-run it once before looking for a
cause.

Read the live state of both gates:

```bash
gcloud iam workload-identity-pools providers describe github-oidc \
  --project=gorilla-dash-178800 --location=global --workload-identity-pool=github \
  --format='value(attributeCondition)'

gcloud iam service-accounts get-iam-policy \
  github-deployer@gorilla-dash-178800.iam.gserviceaccount.com \
  --project=gorilla-dash-178800
```

#### The two secrets

`deploy.yml` reads `GCP_WIF_PROVIDER` and `GCP_SA_EMAIL`. On GorillaDash both
are **organisation** secrets, so a repo in the org normally inherits them and
there is nothing to set — but an org secret is only visible to the repos it
selects, so `ci-bind` checks rather than assumes and prints the `gh secret set`
commands, pre-filled, when either is out of reach. Prefer fixing that at the org
level: one place to rotate beats one per client.

Their values, if you ever need them by hand:

```
GCP_WIF_PROVIDER  projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github/providers/github-oidc
GCP_SA_EMAIL      github-deployer@gorilla-dash-178800.iam.gserviceaccount.com
```

> Cloud Build itself pushes the images, so its own SA (the project's default
> compute SA, or `<NUMBER>@cloudbuild.gserviceaccount.com` on older projects)
> still needs `roles/artifactregistry.writer` — already required by
> `make build-cloud`.

### Adding a new country to the deploy

`usa` ships with the starter; every other market is generated:

```bash
bin/new-country.sh --country au --domain au.example.com --tz Australia/Sydney
```

That copies `overlays/usa` → `overlays/au`, rewrites the per-country values
(namespace, static-IP name, Ingress host, `APP_URL`, `APP_NAME`, `COUNTRY`,
`DB_DATABASE`, `APP_LOCALES`, timezone), **blanks** the per-country credentials
so a filled-in overlay never leaks its GD/Tolgee/Maps/Cloudflare ids into a new
market, and adds the country to the `inputs.country` dropdown in
`.github/workflows/deploy.yml`.

The flags cover three identifiers that are easy to conflate:

| Flag        | Sets                       | Notes                                                                                                                                                                                                                                                |
| ----------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--country` | overlay dir, namespace, DB | The deploy-time id — what you pass as `COUNTRY=`.                                                                                                                                                                                                    |
| `--code`    | `config.env`'s `COUNTRY`   | The app-level code; must match a `SupportCountryName` value. Differs from `--country` for the USA (`usa` / `US`), so it is required unless `--country` is already a 2-letter code.                                                                   |
| `--locales` | `APP_LOCALES`              | The languages this market serves, as `App\Enums\Locale` tags, first one default. This is what turns on the `/{locale}` prefix and the switcher. `APP_LOCALE` (Laravel's `lang/` lookups) is derived from it and is **not** what makes a site French. |

A tag with no `App\Enums\Locale` case is reported rather than written silently —
the app throws on boot until you add it (use the `add-locale` skill). Omit
`--domain` to get the staging convention `<slug>-<country>.gorilladashstaging.com`.

It then prints what it can't do for you — the frontend market maps, the static IP

- DNS, the Cloud SQL database, the per-namespace Secret, `make wi-bind`, and the
  Cloudflare zone. Work through that list, then `make ship-cloud COUNTRY=<c>`.
