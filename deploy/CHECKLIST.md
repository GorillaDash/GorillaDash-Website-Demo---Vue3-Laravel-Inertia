# Go-live checklist — Juniper Table on GKE

Printable, tick-as-you-go checklist. **Part 1** is once per project; **Part 2–3**
repeat per country. Full background is in [`README.md`](./README.md).

Baked-in defaults (override with env vars if needed):

|                        | Value                              |
| ---------------------- | ---------------------------------- |
| Project                | `gorilla-dash-178800`              |
| Region                 | `us-west1`                         |
| Cluster                | `gorilladash-cluster`              |
| Artifact Registry repo | `juniper-table`                             |
| Namespace              | `juniper-table-<country>` (e.g. `juniper-table-usa`) |

---

## Part 0 — Local tools

- [ ] `gcloud` authenticated: `gcloud auth login` and `gcloud auth configure-docker us-west1-docker.pkg.dev`
- [ ] `kubectl` installed (`gcloud components install kubectl` or system package)
- [ ] `kustomize` installed (`kubectl version` ships a built-in; standalone optional)
- [ ] `docker` running locally (used by `build-and-push.sh`)

---

## Part 1 — Project bootstrap (once)

**A. Project + APIs**

- [ ] `gcloud config set project gorilla-dash-178800`
- [ ] Enable APIs:
  ```bash
  gcloud services enable \
    artifactregistry.googleapis.com \
    container.googleapis.com \
    sqladmin.googleapis.com \
    compute.googleapis.com \
    servicenetworking.googleapis.com
  ```

**A2. CI deploy credentials** _(once per project)_ — what `deploy.yml` authenticates as

- [ ] `make ci-sa` — creates `github-deployer` and grants it Cloud Build / GKE /
      Artifact Registry / staging-bucket roles. Shared by every client repo in
      the project, so on an existing project this is already done.

**B. Artifact Registry** — where the Docker images live

- [ ] `build-and-push.sh` **auto-creates** this repo on first run. To create it up front instead:
  ```bash
  gcloud artifacts repositories create juniper-table \
    --repository-format=docker --location=us-west1
  ```
- [ ] Images will be: `us-west1-docker.pkg.dev/gorilla-dash-178800/juniper-table/{web,ssr}`

**C. Cluster access** _(this project has several clusters — pick the right one!)_

- [ ] Point kubectl at it:
  ```bash
  gcloud container clusters get-credentials gorilladash-cluster \
    --region us-west1 --project gorilla-dash-178800
  ```
- [ ] Confirm the **active context** is this cluster (not n8n/mcp/prerender/etc.):
  ```bash
  kubectl config current-context
  # expect: gke_gorilla-dash-178800_us-west1_gorilladash-cluster
  ```
- [ ] `kubectl get nodes` lists the cluster's nodes
- [ ] GKE node service account has `roles/artifactregistry.reader` (default compute SA usually does)

> `deploy.sh` re-checks this context on every run and **refuses to deploy** if it's
> wrong. Override a renamed context with `KUBE_CONTEXT=<name>`.

---

## Part 2 — Bring up a country (example: `usa`)

**D. Cloud SQL + Workload Identity** _(via the Auth Proxy — see Gotchas: the
cluster and DB are on different VPCs, so a DB private IP just times out)_

- [ ] Create / locate the MySQL instance; note its **connection name**
      `PROJECT:REGION:INSTANCE` (e.g. `gorilla-dash-178800:us-west1:gorilladash-client-v2`)
- [ ] Create the database (e.g. `juniper_table_usa_k8s`) and a DB user
- [ ] Once per project: `make wi-gsa` (creates the `k8s-sql` GSA + grants `roles/cloudsql.client`)
- [ ] Per country: `make wi-bind COUNTRY=usa` (lets `juniper-table-usa`'s KSA impersonate the GSA)

**D2. CI deploy credentials** _(once per REPO — not per country)_

- [ ] `make ci-bind` — admits this repo to the shared OIDC provider, binds it to
      `github-deployer`, and checks the two org secrets are visible here.
      `make bootstrap` runs it; re-run it after renaming the repo on GitHub.
      Skipping it is what makes a new client's first `deploy.yml` run fail on
      _Authenticate to Google Cloud_ with `unauthorized_client`.
- [ ] Never hand-write the provider's `--attribute-condition` from a template —
      it replaces the list and takes every other client's deploy offline. See
      `deploy/README.md` → CI deploy.

**E. Domain + static IP**

- [ ] `make reserve-ip COUNTRY=usa` — reserves `juniper-table-usa-ip` if it isn't there yet and
      prints the address. Idempotent, so `make bootstrap` can re-run it.
- [ ] DNS **A record**: `juniper-table-usa.example.com` → that IP
- [ ] In `deploy/k8s/overlays/usa/ingress.yaml`: set the domain (2 places) and uncomment
      `global-static-ip-name: juniper-table-usa-ip`

**F. Config (the ".env.usa")**

- [ ] Edit `deploy/k8s/overlays/usa/config.env`: `APP_URL`, `DB_DATABASE`, and
      `CLOUD_SQL_INSTANCE` (the connection name from D). Leave `DB_HOST=127.0.0.1`
      — the app talks to the Auth Proxy sidecar on localhost.

**F2. Origin certificate** _(per country — the step whose absence answers 525)_

- [ ] Know the zone's SSL mode before you deploy. `gorilladashstaging.com` is
      **Full (strict)**, zone-wide and shared with every other client on it, so
      Cloudflare validates the origin's certificate and an overlay serving only
      :80 answers **525** on every request through the edge.
- [ ] Copy the zone's shared `*.gorilladashstaging.com` Cloudflare Origin CA
      certificate from a namespace that already holds it — it checks the SAN
      against this overlay's `spec.tls` hosts and refuses one that misses them:
  ```bash
  make origin-tls-copy COUNTRY=usa FROM_NS=<other-client-ns> FROM_SECRET=<their>-origin-tls
  ```
- [ ] Confirm `overlays/<country>/ingress.yaml` still has its `spec.tls` block
      naming `juniper-table-origin-tls` — the Secret on its own does nothing without it.

**G. Namespace + Secret (declarative)**

- [ ] `make ns COUNTRY=usa` — the make targets pin `--context` at the target
      cluster; a bare `kubectl` applies to whatever your current-context is.
- [ ] Create the Secret (unique APP_KEY per country):
  ```bash
  cp deploy/k8s/overlays/usa/secret.example.yaml deploy/k8s/overlays/usa/secret.yaml
  # edit secret.yaml — APP_KEY: php artisan key:generate --show ; DB_PASSWORD
  make apply-secret COUNTRY=usa   # context-pinned; namespace is in the file
  ```
- [ ] Back up the filled `secret.yaml` somewhere durable (it's gitignored)

**H. Build + deploy**

- [ ] Active context is `gorilladash-cluster` (step C) — otherwise switch with
      `kubectl config use-context gke_gorilla-dash-178800_us-west1_gorilladash-cluster`
- [ ] `./deploy/build-and-push.sh` (auto-creates the Artifact Registry repo if missing, then pushes)
- [ ] `COUNTRY=usa ./deploy/deploy.sh` (aborts if the context isn't `gorilladash-cluster`)

---

## Part 3 — Verify (`usa`)

- [ ] `kubectl -n juniper-table-usa get pods` — `juniper-table`, `juniper-table-scheduler`, `juniper-table-worker` all Ready
- [ ] Origin lockdown built: `./deploy/setup-cloud-armor.sh` ran, and `backendconfig.yaml`
      (with `securityPolicy: edge-only`) is deployed. Cloudflare holds the cert for
      `<domain>` and its origin = the LB static IP over http.
- [ ] Smoke it (waits for Cloud Armor to attach): `COUNTRY=usa ./deploy/smoke-origin-lockdown.sh`
      — direct origin IP → `403`, through the edge → `200` + SSR markup. (Before
      Cloudflare is wired, `SKIP_EDGE_CHECK=1` checks only the 403.)
- [ ] Edge cache rules applied + verified: `CLOUDFLARE_API_TOKEN=... ./deploy/cloudflare/apply-rules.sh <host>`
      (it probes the live host and rolls itself back if a bypass rule doesn't match).
- [ ] **Assets load over https**: open the site, DevTools → Network — `/build/assets/*.css|js`
      are `https` + `200` (if `http` → mixed-content/503, `APP_FORCE_HTTPS` is missing; see Gotchas)
- [ ] `juniper-table-scheduler` / `juniper-table-worker` pods Running (they idle until you
      define scheduled tasks in `routes/console.php` / dispatch queue jobs)

> Adding a second country: copy overlays/usa to overlays/<country>, swap names/domain/DB,
> then repeat Part 2–3 for it.

---

## Part 4 — Subsequent releases

- [ ] `./deploy/build-and-push.sh`
- [ ] `COUNTRY=usa ./deploy/deploy.sh`
- [ ] Roll back if needed: `TAG=<old-git-sha> COUNTRY=usa ./deploy/deploy.sh`

---

## Gotchas & lessons learned

Each is already handled in the manifests/scripts — know them when debugging or
onboarding a new environment.

- **Build for amd64.** GKE nodes are amd64; an Apple-Silicon `docker build` makes
  arm64 → pods fail `no match for platform in manifest`. `build-and-push.sh` forces
  `--platform linux/amd64` (override with `PLATFORM`).

- **Cross-VPC Cloud SQL → Auth Proxy, not private IP.** The cluster (`default` VPC)
  and the DB (`gorilladash-clients-vpc`) are on different VPCs, so the DB private IP
  **times out** (`SQLSTATE[HY000] [2002] Connection timed out`). Every DB-using pod
  (web/scheduler/worker/migrate) runs the **Cloud SQL Auth Proxy** sidecar (Google
  APIs + IAM, VPC-independent); `DB_HOST=127.0.0.1`, `CLOUD_SQL_INSTANCE` names the
  instance. Needs Workload Identity (`make wi-gsa` + `make wi-bind`).

- **Force https or assets break (two-proxy scheme trap).** TLS is terminated at
  Cloudflare, which reaches the origin over http. The GKE/GCE L7 LB then **overwrites**
  `X-Forwarded-Proto` with `http` (it reflects the edge→origin leg, discarding
  what Cloudflare sent), so `trustProxies` alone can't recover the scheme — Laravel
  would emit `http://` asset URLs that get blocked as mixed content on the https
  page. Fixed by `APP_FORCE_HTTPS=true` (→ `URL::forceScheme('https')` in
  `AppServiceProvider`). `trustProxies(at: '*')` stays on for `X-Forwarded-For`
  (real client IP). Secure cookies still work because `SESSION_SECURE_COOKIE=true`
  is set explicitly (independent of the request scheme).

- **"TLS is at the edge" does not mean the origin can be plain http.** Cloudflare's
  SSL mode decides that, it is set per ZONE, and the shared staging zone is on
  **Full (strict)**. An overlay without `spec.tls` answers 525 through the edge
  while reading perfectly healthy from inside the cluster — `/up` 200 on a
  port-forward, backends HEALTHY, pods Ready — which is exactly how it presents on
  a first go-live. Fix it with the origin certificate (step F2), never by lowering
  the zone's SSL mode: that switch is shared with every other client on the zone.

- **A brand-new Workload Identity binding takes minutes to mint tokens.** The
  first deploy after `make wi-bind` can see the migrate Job fail with `MySQL
server has gone away` / `Error while reading greeting packet` and succeed on a
  later attempt. That is not the Cloud SQL proxy starting slowly — it is a native
  sidecar gated on its own startup probe, and PDO reaching `127.0.0.1:3306` at all
  proves it was listening. It is the proxy's per-connection dial failing for want
  of an IAM token. Run `wi-bind` before deploying (`make bootstrap` does), and
  read an `Error` pod beside a `Completed` one on a first deploy as propagation.
  `backoffLimit: 3` is what absorbs it.

- **TLS lives at Cloudflare now.** No ManagedCertificate on the cluster. DNS for
  `<domain>` is **proxied through Cloudflare**; the origin is the reserved
  `global-static-ip-name` (so the LB IP never changes) over **http on :80** — i.e.
  SSL mode "Flexible". For "Full (strict)" instead, add a `spec.tls` block to the
  overlay's ingress and install a Cloudflare Origin CA certificate with
  `make origin-tls`. Either way, lock the origin down so it isn't reachable except
  through the edge (see below).

- **Lock the HTTP origin to the edge (Cloud Armor).** With TLS gone, the LB serves
  plain http to anyone who hits the static IP directly, bypassing the edge (its
  cache, WAF, https). `deploy/setup-cloud-armor.sh` creates an `edge-only`
  security policy (default deny-403, allow the CDN's published edge IPs) and
  `backendconfig.yaml` attaches it. **Order:** run the script FIRST (so the allow
  rules exist), then deploy the BackendConfig — otherwise default-deny blocks
  everything. Every CDN rotates its ranges, so
  `.github/workflows/refresh-edge-ips.yml` re-runs the (idempotent) script weekly. One-time: grant `github-deployer` the
  `roles/compute.securityAdmin` role (see the script header).

- **Service selector must be `role: web`.** A bare `app: juniper-table` selector also
  grabs scheduler/worker pods (same `app` label) → they get a NEG readiness gate
  they can't satisfy (stuck `0/1`, LB could route web traffic to them → 502). The
  Service selects `app: juniper-table, role: web`.

- **ServiceAccount before the migrate Job.** The migrate Job uses
  `serviceAccountName: juniper-table`, so `deploy.sh` applies the ServiceAccount before
  running it (else `error looking up service account … not found`).

- **SSR cluster forks by NODE cores, not your CPU limit.** Inertia's `cluster`
  option forks `os.availableParallelism()` workers — on Autopilot (CFS-quota CPU
  limits, no cpuset pinning) that's the node's core count. It's `false` by default;
  enable it only together with bigger ssr cpu/memory limits.

- **SSR bundle filename must match the Dockerfile CMD.** `vite build --ssr` names
  the bundle after the Vite SSR entry's basename — `laravel({ ssr: 'resources/ts/app.ts' })`
  → `bootstrap/ssr/app.js`. The `ssr` image runs `CMD ["node", "bootstrap/ssr/app.js"]`.
  If you **rename or re-point the SSR entry**, update the Dockerfile CMD (and its
  header comments) to match, or the ssr container CrashLoops with
  `Cannot find module '…app.js' … MODULE_NOT_FOUND` and the rollout hangs forever
  while the old revision keeps serving. (This bit us once: entry was renamed
  `app.ts` → `ssr.ts` but the CMD still said `app.js`.)

- **`VITE_*` vars are build-time, baked from `.env.example` — NOT `config.env`.**
  Vite inlines `import.meta.env.VITE_*` into the JS bundle during `pnpm run build:ssr`,
  and the Docker `builder` stage does `cp .env.example .env` first. So any `VITE_*`
  you set in a country's `config.env` is **inert for the frontend** — it only lands
  as runtime container env, which a compiled SPA never reads. To change a `VITE_*`
  value (e.g. `VITE_GCS_STATIC_URL`), set it in `.env.example` and **rebuild the
  image**; a `rollout restart` does nothing. And because the image is built **once
  for all countries**, baked `VITE_*` values can't differ per country — so keep
  only country-agnostic constants as `VITE_*`.
  **Anything per-country goes through a runtime Inertia shared prop**: put the
  value in each `config.env`, expose it via `HandleInertiaRequests::share()` under
  the `config` bag, and read it on the frontend from `resources/ts/runtimeConfig`
  (which both entries set from `page.props` at boot). See `googleMapApiKey`,
  `orgId`, `websiteId`, `country`. One image, per-country values, changes need
  only a `rollout restart` — no rebuild. (Non-`VITE_` runtime vars like
  `APP_*`/`DB_*` already come from `config.env`.)

## Common operations

| Task                     | Command (replace `usa`)                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Check current cluster    | `kubectl config current-context`                                                                                                 |
| Switch to this cluster   | `kubectl config use-context gke_gorilla-dash-178800_us-west1_gorilladash-cluster`                                                |
| Read a secret back       | `kubectl -n juniper-table-usa get secret juniper-table-secret -o jsonpath='{.data.APP_KEY}' \| base64 -d`                                          |
| Read all secrets         | `kubectl -n juniper-table-usa get secret juniper-table-secret -o go-template='{{range $k,$v := .data}}{{$k}}={{$v\|base64decode}}{{"\n"}}{{end}}'` |
| Apply config-only change | edit `config.env` → `COUNTRY=usa ./deploy/deploy.sh` → `kubectl -n juniper-table-usa rollout restart deploy`                              |
| Tail web logs            | `kubectl -n juniper-table-usa logs -f deploy/juniper-table`                                                                                        |
| Tail SSR logs            | `kubectl -n juniper-table-usa logs -f deploy/juniper-table -c ssr`                                                                                 |
| Scale workers            | `kubectl -n juniper-table-usa scale deploy/juniper-table-worker --replicas=3`                                                                      |
| Run migrations only      | re-run `deploy.sh` (it runs the migrate Job), or apply `base/migrate-job.yaml` with the image substituted                        |
| Open a shell in web      | `kubectl -n juniper-table-usa exec -it deploy/juniper-table -c web -- bash`                                                                        |
