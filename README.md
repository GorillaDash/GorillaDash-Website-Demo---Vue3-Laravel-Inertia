# Gorilla Dash Website Demo — Vue 3 + Laravel + Inertia

A working franchise website, built the way Gorilla Dash customers build theirs. Every
word, price, photo reference, opening hour, blog post and menu item on this site is
read at request time from a Gorilla Dash organisation over the GraphQL API. Nothing is
hard-coded. If you change the content in Gorilla Dash, the site changes.

**Live:** <https://demo.gorilladash.com>

The brand on the site, "Hungry Gorilla", is a fictional café and catering franchise
invented for the demo. The locations, people, reviews and blog posts are not real, and
the addresses do not belong to real businesses.

This repository exists so that a developer, an agency or a franchise IT team can read
a complete, running example before deciding how to build against Gorilla Dash. It is a
reference implementation, not a starter template you are expected to fork — although
nothing stops you.

---

## Gorilla Dash API documentation

Gorilla Dash has two developer APIs, and they are not interchangeable. This site uses
the GraphQL one.

|                       | GraphQL API                                                 | REST API                                                   |
| --------------------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| Built for             | Websites that display a Gorilla Dash organisation's content | Integrations between Gorilla Dash and your other systems   |
| Endpoint              | `https://graphql.gorilladash.com/graphql`                   | `https://api.gorilladash.com/api/v1`                       |
| Credentials belong to | One website configured in Gorilla Dash                      | Your organisation, or a single tribe                       |
| Authentication        | OAuth client credentials exchanged for a bearer token       | `GorillaDash-Api-Key` and `GorillaDash-Api-Secret` headers |
| **Documentation**     | **<https://gorilladash.com/graphql>**                       | **<https://docs.gorilladash.com>**                         |

Supporting guides on the Gorilla Dash Help Centre:

- [Which API do I need?](https://gorilladash.com/support/guides/api-rest-and-graphql) — the two APIs side by side
- [API overview](https://gorilladash.com/support/guides/api-overview)
- [Authentication](https://gorilladash.com/support/guides/api-authentication)
- [Responses and errors](https://gorilladash.com/support/guides/api-responses-and-errors)
- [Rate limits and caching](https://gorilladash.com/support/guides/api-rate-limits-and-caching)
- [The whole API guide category](https://gorilladash.com/support) — open the Help Centre and choose **API**

A **tribe** is one location, branch or business unit inside an organisation. Gorilla
Dash uses that word on every screen and in both APIs (`tribe_id`, `tribe_slug`), so
this README uses it too. In this demo, a tribe is one café.

---

## What the demo shows

Each page is a worked example of one thing Gorilla Dash serves to a website.

| Page                         | What it demonstrates                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Home                         | Website sections and components authored in Gorilla Dash, plus live counts pulled from the `tribes` and `reviews` queries |
| Locations                    | A store finder: search by postcode, city or browser geolocation, then a list grouped by state                             |
| Location detail              | A tribe micro-site — its own hours, team, reviews, Our Work and contact form, under `/locations/{tribe}`                  |
| Menu and Menu item           | Food categories, items, modifiers and prices, with per-tribe availability                                                 |
| Order                        | A pickup checkout that builds a real cart and submits a real order back into Gorilla Dash                                 |
| Book                         | A five-step appointment stepper that reads live availability and books a slot                                             |
| Catering, Contact, Franchise | Enquiry forms defined in Gorilla Dash, submitted back as enquiries                                                        |
| Blog and Article             | Articles, categories and author lines                                                                                     |
| Our Work and detail          | Case-study style posts, at both national and tribe level                                                                  |
| About, FAQ                   | Plain CMS pages, to show a page that is only content                                                                      |

### Demo controls

The site carries three controls that a normal customer site would not. They are in the
toolbar at the top, and each also accepts a query parameter so you can link straight to
a configured view.

- **Structure view** (`?structure=1`, or press <kbd>S</kbd>) outlines every section on
  the page and labels it with the scope, the Gorilla Dash module it comes from, the
  GraphQL query that fetched it, and — on hover — where in the Gorilla Dash admin that
  content is edited. This is the fastest way to understand how a page is assembled.
- **Theme switcher** (`?theme=gorilla|cafe|trade|retail`) re-skins the site from CSS
  custom properties defined per `[data-theme]` in `resources/css/app.css`, to show that
  the layout is not tied to one brand's look.
- **Device preview** (`?device=desktop|tablet|mobile`) reloads the site inside an iframe
  at 820 px or 390 px. It has to be a real narrower viewport, because Tailwind
  breakpoints follow the viewport rather than the element.

---

## Architecture

```
Browser ──► Laravel 13 (Octane/FrankenPHP) ──► Inertia page props ──► Vue 3 SPA
                    │                                                    │
                    │  gorilladash/laravel-website-sdk                    │ Apollo
                    └──────────► Gorilla Dash GraphQL API ◄───────────────┘
                                 (server-side OAuth, same-origin /graphql proxy)
```

- **Server-driven SPA.** Inertia v3. Pages live in `resources/ts/pages/`; a controller's
  props are the data contract. There is no client-side router and no REST layer of our
  own.
- **Two ways to reach GraphQL.** The server fetches through
  `gorilladash/laravel-website-sdk`, which holds the OAuth client-credentials grant and
  caches responses stale-while-revalidate. The browser fetches through a same-origin
  `/graphql` proxy on this app, so the website's client secret never reaches the
  browser. Server-side rendering serialises the Apollo cache into `<head>` so the first
  paint needs no round trip.
- **Typed GraphQL documents.** `pnpm run codegen` introspects the live schema and writes
  `resources/ts/graphql/__generated__`. Queries are typed end to end; `vue-tsc` fails the
  build if a component reads a field the query does not select.
- **CMS-renamable page paths.** Top-level routes use a `{page}` parameter rather than a
  literal, so renaming a page in Gorilla Dash from `/locations` to `/stores` changes the
  site's URLs with no code change and no redeploy. The frontend mirrors the same lookup
  at runtime through the `pages` shared prop. Read `docs/cms-dynamic-page-paths.md`
  before adding a route — there are real constraints, particularly around sub-routes.
- **Edge-cacheable HTML.** Anonymous visitors are kept cookie-free so a CDN can serve a
  shared copy of each page; the visitor's chosen tribe lives in a browser-written cookie
  rather than the session. See `docs/edge-html-cache.md` and
  `docs/session-bound-location.md`.
- **Runtime multi-locale.** `APP_LOCALES` selects the locale set per deployment, so one
  build serves every country. The demo runs a single locale, `en-US`.

Stack: PHP 8.3, Laravel 13, Inertia v3, Vue 3.5, TypeScript, Tailwind CSS 4, Vite,
Apollo Client, Pest 4, Octane on FrankenPHP.

---

## Running it locally

You will need PHP 8.3 or newer, Composer, Node 22 and pnpm 11. CI runs the suite on PHP 8.3, 8.4 and 8.5.

```bash
git clone https://github.com/GorillaDash/GorillaDash-Website-Demo---Vue3-Laravel-Inertia.git
cd GorillaDash-Website-Demo---Vue3-Laravel-Inertia
composer setup
```

`composer setup` installs both dependency sets, copies `.env.example` to `.env`,
generates an application key, runs the migrations against SQLite and builds the
frontend once.

Then start everything in one terminal:

```bash
composer dev
```

That runs `php artisan serve`, the queue listener, log tailing and Vite together, and
stops them together. Open <http://localhost:8000>.

### Connecting it to Gorilla Dash

The site boots without Gorilla Dash credentials — content lookups fail soft and you get
an empty shell — but it has nothing to show until you point it at a website. Fill these
in `.env`:

| Variable                   | What it is                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------- |
| `GD_ORG_ID`                | The organisation the site belongs to                                                    |
| `GD_WEBSITE_ID`            | The website record the frontend queries                                                 |
| `GD_WEBSITE_CLIENT_ID`     | OAuth client id, used server-side only                                                  |
| `GD_WEBSITE_CLIENT_SECRET` | OAuth client secret, used server-side only                                              |
| `GD_WEBSITE_BASE_URI`      | Defaults to `https://graphql.gorilladash.com`; override to point at another environment |

In Gorilla Dash you will find all four under **Websites**, then the website, then
**Settings** and the **Website API** section. The
[API authentication guide](https://gorilladash.com/support/guides/api-authentication)
covers how the exchange works.

Two optional keys change what you see: `GOOGLE_MAP_API_KEY` turns on the map on the
locations pages, and `TOLGEE_CDN_URL` turns on translated copy. Both are safe to leave
blank. Every variable is commented in `.env.example`.

### Useful commands

```bash
composer dev         # serve + queue + logs + vite, together
composer ci:check    # the full gate: oxlint, prettier, vue-tsc, Pint, Pest
composer test        # Pest only (PHP suites plus the TypeScript suites under tests/js)
pnpm run codegen     # regenerate typed GraphQL documents from the live schema
pnpm run build       # production frontend build
pnpm run build:ssr   # production build including the SSR bundle
```

`composer ci:check` is exactly what the `lint` and `tests` GitHub Actions workflows run,
so a green local run means a green pull request.

---

## Repository layout

```
app/
  Http/Controllers/     One controller per page type; they fetch and hand props to Inertia
  Http/Middleware/       Edge-cache grants, guest-session dropping, locale redirects, page guards
  Services/              WebsitePages (CMS path resolution), BoundLocation, CmsRoutes, Catalogue
resources/
  ts/pages/              One Vue component per page, matched to a controller
  ts/components/         core, layout, menu, order, tribe, work, journal, reviews, forms, ui
  ts/components/demo/    Structure view, the toolbar, device preview, welcome panel
  ts/graphql/            Queries, and the generated types under __generated__
  ts/lib/                pagePaths, localizedUrl, GCS image helpers, demo imagery
  ts/composables/        useDemoControls and friends
  css/app.css            Design tokens, including the per-theme [data-theme] blocks
routes/web.php           Heavily commented — read it before adding a route
tests/                   Pest feature and unit suites, plus TypeScript suites in tests/js
docs/                    Architecture notes (see below)
deploy/                  Dockerfile, Kustomize manifests, GKE and Cloudflare tooling
```

### Further reading in this repository

| File                             | Covers                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| `docs/website-demo-plan.md`      | Why the demo is shaped this way, including what five live franchise sites taught us |
| `docs/cms-dynamic-page-paths.md` | The `{page}` routing model and its constraints                                      |
| `docs/edge-html-cache.md`        | Keeping HTML on the CDN edge                                                        |
| `docs/session-bound-location.md` | Remembering the visitor's tribe without a session                                   |
| `docs/public-forms.md`           | Public forms that do not break the edge cache                                       |
| `docs/api-responses.md`          | The JSON envelope convention                                                        |
| `docs/perf-mobile-pagespeed.md`  | Fonts, images and the performance budget                                            |
| `deploy/README.md`               | Images, Kustomize overlays, Workload Identity, rollbacks                            |
| `deploy/CHECKLIST.md`            | Bringing up a new deployment from nothing                                           |

---

## Deployment

The demo runs on Google Kubernetes Engine. One multi-stage `Dockerfile` builds two
images from the same commit: `web` (Laravel on Octane/FrankenPHP) and `ssr` (the Node
renderer), deployed as a sidecar pair. Configuration is Kustomize — a base plus one
overlay per country. Non-secret values live in the overlay's `config.env` as a ConfigMap;
credentials live in a `secret.yaml` that is deliberately kept out of `kustomization.yaml`
and out of Git, so a deploy can never overwrite it.

```bash
make help            # every target, with descriptions
make ship COUNTRY=usa
make rollback COUNTRY=usa TAG=<sha>
make status
```

Deploys are triggered by hand, not by pushing. The `deploy` GitHub Actions workflow
is `workflow_dispatch` only: choose a country, and it runs a Cloud Build and a GKE
rollout, authenticating to Google Cloud with OIDC rather than a long-lived
service-account key. Because it accepts any ref, you can deploy a branch to verify it
before merging.

One detail worth knowing if you copy this setup: the GKE container-native load balancer
keeps sending traffic to pods that are already terminating, so every rollout returned
502s for roughly 19 seconds until the containers were given a `preStop` sleep long
enough to outlive the load balancer's own drain. That is in
`deploy/k8s/base/deployment.yaml`, and the comments explain the timings.

---

## Contributing and support

This is a demonstration site maintained by Gorilla Dash, so we may not take feature
pull requests. Issues that point out something inaccurate, broken or misleading about
how the Gorilla Dash APIs are used here are genuinely useful — please open one.

For questions about the APIs themselves rather than this repository, start with the
[Help Centre](https://gorilladash.com/support) and the API documentation linked at the
top of this file.
