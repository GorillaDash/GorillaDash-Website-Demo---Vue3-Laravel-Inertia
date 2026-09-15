# New-client onboarding checklist

> 中文版:[NEW-CLIENT-CHECKLIST.zh-TW.md](NEW-CLIENT-CHECKLIST.zh-TW.md). Keep the
> two files in sync when editing either one.

Everything a new client site needs beyond cloning this repo. The repo-side rename
is one command; most of the rest lives in systems the repo can't see (GD CMS,
Tolgee, GCP, Cloudflare), so tick them off explicitly.

## 1. Repo

- [ ] Create the client repo from the template and clone it:
      `gh repo create GorillaDash/<Client>-inertiajs --private --template=GorillaDash/gd-client-inertia-starter --clone`
- [ ] Rename the placeholder brand:
      `bin/new-client.sh --slug <slug> --name "<Display Name>" --domain <domain>`
- [ ] Baseline still green: `composer setup && composer ci:check`; commit + push
      the rename.
- [ ] `.env.example`: confirm `VITE_GCS_STATIC_URL` ends in this client's GCS
      prefix — `static/clients/<camelCaseSlug>_` (bucket and naming rule in
      [§4 · Assets](#4-assets)). **Build-time value** — Vite inlines it from
      `.env.example` inside `deploy/Dockerfile`; the k8s `config.env` copy is only
      a record.
- [ ] `package.json` → `static:upload` targets the same GCS prefix. Grep once for
      any other prefix left behind: `bin/new-client.sh` only rewrites `hungryGorilla_`.
- [ ] Replace placeholder UI copy/components (`resources/ts/components/{home,menu,location}`)
      per the client's design. Keep links on `<LocaleLink>` + `usePagePaths()`
      (see the `gd-locale-links` skill).
- [ ] Adding an API route (a contact form is the usual first one)? Install the
      response layer before writing the controller — it is not shipped, and on
      Laravel 13 it needs a VCS pin because upstream caps at 12:
      `composer config repositories.laravel-responder vcs https://github.com/laravel-shift/laravel-responder.git`
      then `composer require "flugger/laravel-responder:dev-l13-compatibility"`.
      Full recipe, including the two traps (publishing moves `langPath()`; the
      envelope must never swallow validation's 422) in
      [`docs/api-responses.md`](api-responses.md).

## 2. GorillaDash CMS

- [ ] Website created; note **org id + website id** → overlay `config.env`
      (`GD_ORG_ID`, `GD_WEBSITE_ID`).
- [ ] OAuth client-credentials pair for the website → `GD_WEBSITE_CLIENT_ID` /
      `GD_WEBSITE_CLIENT_SECRET` (secret side goes in the k8s Secret, not config.env).
- [ ] Every website page has `vue_route_name` populated (the `{page}` routing and
      menu "Internal Url" items depend on it).
- [ ] Cache-clear webhook pointed at this site; `GD_WEBSITE_PUBLIC_KEY` set.

## 3. Tolgee (i18n)

Three of these fail _silently_ — the site renders its inline English defaults either
way, so nothing looks wrong until a translator asks where the strings are.

- [ ] Tolgee project created for THIS client; translations published → CDN URL into
      `TOLGEE_CDN_URL` (per-country `config.env`). Copy an existing client's
      content-delivery settings: JSON + ICU, auto-publish, states
      TRANSLATED/REVIEWED.
- [ ] **`.tolgeerc` → `projectId` changed to this client's project.** It ships
      carrying another client's id, so any `tolgee` command run before you change it
      creates this site's keys inside THAT project — it succeeds, prints nothing
      unusual, and the mess is only visible from the other client's Tolgee. Delete
      the line while you wait for the project to exist: with no id the CLI refuses to
      run and says so, which is the safe state.
- [ ] The project's language **tag** matches `APP_LOCALES` exactly — `en-US`, not the
      `en` a new project defaults to. Tolgee's `BackendFetch` asks the CDN for
      `<tag>.json`, so a mismatch answers 404 for every key. Rename the tag rather
      than adding a second language: a rename keeps the translations, add-then-delete
      loses them.
- [ ] `APP_LOCALES` set per country (first entry = default). Adding a language is
      data-only — follow the `add-locale` skill.
- [ ] Source strings pushed: `tolgee sync --yes`. (`tolgee compare` is the dry run,
      but it crashes on a project with zero keys, so the first push has to be a
      `sync`.)
- [ ] `tolgee sync` ended with **0 warnings**. A warning is not cosmetic: every
      ``Expected source of `t` function`` marks a string the extractor skipped, which no
      translator will ever see. If a pure module takes the translate function as a
      parameter, the parameter must be named `$t` — see the i18n section of
      CLAUDE.md.

## 4. Assets

- [ ] Brand fonts licensed; subset masters to woff2/woff (keep masters in
      `fonts-src/`), wire `local(...)` entries in `vite.config.ts` `fonts:` and
      extend the `--font-*` tokens + fallback metrics in `resources/css/app.css`.
- [ ] Images into `public/static/images/{icon,logo,bg,menu}/`, then
      `pnpm run static:upload` (needs gcloud auth). Dev hits the CDN too —
      nothing renders until uploaded.

  Where they go — identical for every client, none of it is per-site config:
  - **Bucket:** `gs://gorilladash-static-files`, shared by every client (there is
    no per-client bucket). GCP project `gorilla-dash-178800` ("Gorilla Dash",
    number 646282229388), region `US-WEST1`, objects public-read.
  - **CDN:** `https://cdn.gorilladash.com/` — Fastly in front of that bucket, same
    path; responses carry `cache-control: max-age=31536000`.
  - **Client folder:** `static/clients/<camelCaseSlug>_/` — the camelCased slug
    plus a trailing underscore (`great-burger` → `greatBurger_`,
    `the-great-greek` → `theGreatGreek_`). This is the value `bin/new-client.sh`
    writes into `VITE_GCS_STATIC_URL` and `static:upload`.
  - **Layout under it:** `images/{icon,logo,bg,menu}/` and `fonts/` —
    `public/static/` mirrored as-is.
  - A rebuild of an existing client gets a **new** underscore folder beside the
    legacy site's (`theGreatGreek/` → `theGreatGreek_/`, `GrazeCraze/` →
    `grazeCraze_/`). Never upload into the legacy folder: its layout differs and
    the old site still serves from it. Look first:
    `gcloud storage ls gs://gorilladash-static-files/static/clients/`.
  - Auth: `gcloud auth login` (tokens expire — a stale one fails with
    "Reauthentication failed"), then `gcloud config set project gorilla-dash-178800`.
  - Uploads are additive (`rsync --recursive`, nothing is deleted) and the CDN
    caches for a year, so change an asset by giving it a new file name, never by
    overwriting the old one.
  - Verify: `curl -sI https://cdn.gorilladash.com/static/clients/<prefix>/images/logo/<file>`
    → `HTTP/2 200` with the expected `content-type`.

- [ ] Favicon on the CDN; restore the commented `<link rel=icon>` block in
      `resources/views/app.blade.php`.

## 5. GCP (once per client)

Follow `deploy/README.md` "First-time go-live checklist" for the full ordered
version. Summary:

- [ ] Artifact Registry repo (auto-created by `deploy/build-and-push.sh`).
- [ ] Nothing to create for static assets — every client shares the
      `gorilladash-static-files` bucket ([§4 · Assets](#4-assets)).
- [ ] Cloud SQL database + user; instance name into overlay `config.env`
      (`CLOUD_SQL_INSTANCE`, `DB_DATABASE`).
- [ ] Workload Identity: `make wi-gsa` (once per GCP project) + `make wi-bind`
      (per country/namespace).
- [ ] Global static IP per country (`gcloud compute addresses create <slug>-usa-ip --global`).
- [ ] Cloud Armor origin lockdown: `deploy/setup-cloud-armor.sh` (the
      `refresh-edge-ips` workflow keeps it current; check its env block).
- [ ] GitHub deploy credentials (WIF, no keys): `make ci-sa` (once per GCP
      project) + `make ci-bind` (once per **repo** — `make bootstrap` runs it).
      `ci-bind` admits this repo to the shared OIDC provider, binds it to the
      deployer SA, and checks that `GCP_WIF_PROVIDER` + `GCP_SA_EMAIL` (org
      secrets) are visible here. Without it the first `deploy.yml` run dies on
      _Authenticate to Google Cloud_. Details: `deploy/README.md` (CI section).

## 6. Cloudflare (once per country)

- [ ] DNS record for the host, **proxied** (orange cloud), origin = the country's
      static IP over HTTP. SSL mode Flexible, or Full (strict) with an Origin CA
      certificate installed via `make origin-tls` + a `spec.tls` block in the overlay.
- [ ] `CLOUDFLARE_ZONE_ID` + `CLOUDFLARE_HOSTS` into overlay `config.env` (both the
      `cloudflare-rules` workflow and `deploy.sh` discover hosts from the overlays).
- [ ] API token scoped to **Cache Settings Write + Zone Read** on this client's zones
      → Secret Manager (`<slug>-cloudflare-api-token`), GitHub repo secret
      `CLOUDFLARE_API_TOKEN`, and the k8s Secret.
- [ ] Cache rules applied: `CLOUDFLARE_API_TOKEN=... deploy/cloudflare/apply-rules.sh <host>`
      (or push to main and let the workflow converge). It verifies itself against the
      live host and rolls back if a bypass rule doesn't match.
- [ ] Purge webhook from GD on content publish (see `deploy/cloudflare/README.md`).

## 7. k8s overlay (per country)

- [ ] `deploy/k8s/overlays/<country>/config.env` — fill every empty value.
- [ ] `secret.example.yaml` → `secret.yaml` (gitignored), fill, `kubectl apply`,
      back up in Secret Manager.
- [ ] If the site has a public form: a reCAPTCHA v3 key pair for **this country's
      domain** (the keys are per-domain, so each country needs its own). Public
      `RECAPTCHA_SITE_KEY` → `config.env`; `RECAPTCHA_SECRET_KEY` → the k8s Secret,
      never the ConfigMap. Both blank = no captcha.
- [ ] `ingress.yaml` host + static-ip annotation match this country.
- [ ] Second country? Copy `overlays/usa`, swap names/domain/DB, add it to the
      `deploy` workflow's `country` options.

## 8. Verify

- [ ] `make ship COUNTRY=<country>` (or the `deploy` workflow), then work through
      `deploy/CHECKLIST.md`.
- [ ] `deploy/smoke-origin-lockdown.sh` — origin only answers the edge.
- [ ] An anonymous page answers `cf-cache-status: HIT` (`deploy/cloudflare/verify-rules.sh <host>`).
- [ ] Lighthouse pass (`lighthouse-pagespeed` skill) before launch.
