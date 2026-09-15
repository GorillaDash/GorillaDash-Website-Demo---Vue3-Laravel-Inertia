# CMS-driven page paths

A page's URL path is whatever the GD CMS says it is. Rename the locations page's slug
from `locations` to `stores` in the CMS and `/stores` — **and its sub-routes**
(`/stores/vestavia-hills-al`, `/stores/states/alabama`) — start serving, with **no code
change and no deploy**. On a multilingual deployment each locale may carry its own slug,
so the same logical page can live at `/en/locations` and `/ar/<arabic-slug>`.

> **TL;DR** — The page routes' first segment is a `{page}` parameter (`routes/web.php`),
> resolved per request against the GD `websitePages` list (`App\Services\WebsitePages`,
> SWR-cached). Route _definitions_ stay static, so `route:cache` at container start and
> Octane's boot-once workers are untouched — only the lookup is dynamic. A page's stable
> identity is `vue_route_name ?? slug`; the slug is a renamable URL skin. The frontend
> stops trusting Wayfinder's build-time URIs for these routes and builds links from a
> `pages` shared prop at runtime (`resources/ts/lib/pagePaths.ts`), the same way
> `localizedUrl` re-attaches the locale prefix. Edge purge keys stay byte-identical
> across renames and locales.

## Why not just register the paths at boot?

The obvious alternative — pull every page into a cache once and register literal routes
in `routes/web.php` from it — loses the whole point in _this_ deployment, because route
registration is a **boot-time** event:

- **`route:cache` freezes it.** `deploy/docker/web-entrypoint.sh` runs
  `php artisan route:cache` on every container start; the route table is serialized to a
  file. A later CMS slug change can't be seen — the table is never re-read.
- **Octane workers never re-register.** The app boots once and serves hundreds of
  requests; recycling a worker (`--max-requests=500`) just re-reads the same compiled
  cache. A CMS rename would only take effect after every pod rolls, i.e. a
  publish-webhook → K8s rollout pipeline, minutes of lag, and a CMS outage that blocks
  boots.
- **Wayfinder bakes URIs at build time anyway.** Its generated helpers are compiled into
  the JS bundle during the Docker build (against a throwaway `.env` with no CMS access).
  So even a boot-time backend registration wouldn't help the _frontend_ links — they
  need runtime resolution regardless. Once the frontend has to resolve at runtime, a
  boot-time backend snapshot buys nothing.

So resolution moved from boot to **request**: the route shape is static (`{page}`
parameter), and the slug → page match is a local read against an SWR-cached list.

## The logical key: `vue_route_name ?? slug`

Every page has a **logical key** that code maps to a Vue component, independent of the
renamable slug:

- **Today** the three CMS records carry a null `vue_route_name`, so the key falls back
  to the slug (`homepage`, `locations`). This is exactly `WebsitePages::FALLBACK`,
  so current behavior is unchanged and needs no CMS action.
- **Once GD populates `vue_route_name`** the key is fixed and the slug becomes freely
  renamable.

The key is the single contract five layers align on:

| Uses the logical key for                            | Where                                       |
| --------------------------------------------------- | ------------------------------------------- |
| key → Vue component (`locations` → `Locations.vue`) | `WebsitePageController::COMPONENTS`         |
| sub-route ownership (`page:locations`)              | `EnsureWebsitePage` middleware argument     |
| Edge purge key (rename- and locale-invariant)       | `EdgeCacheGuestPage` logical-name attribute |
| frontend link building (`pagePath('locations')`)    | the `pages` shared prop key                 |
| language switcher crossing per-locale slugs         | `translatePagePath` (shared key both sides) |

> **Ordering matters.** GD must populate `vue_route_name` **before** a client renames a
> slug. Do it the other way and the key becomes the new slug (`stores`), `COMPONENTS`
> can't map it, and the page 404s.

## Data flow

```
Every request  HandleInertiaRequests::share()
               └ WebsitePages::pathsByLocale()  → GorillaDash::graphql(websitePages by locale, SWR-cached)
                 → shares page.props.pages = { en: { homepage:'/', locations:'/stores' }, ar: {…} }

GET /stores            {page} route  → EnsureWebsitePage('page')            → WebsitePageController@show
GET /stores/{slug}     {page}/{slug} → EnsureWebsitePage('page:locations')  → LocationController@show
   └ resolve slug → logical key → Inertia component + pass slug as a prop

Frontend  any component
          └ usePagePaths() reads the `pages` prop → pagePath('locations') / cmsRoute('locations.show', …)
            → <LocaleLink> / localizedUrl() adds the /{locale} prefix
```

The server is the single source of truth for the path map; the frontend only reads it.

## Backend

- **`app/Services/WebsitePages.php`** — the CMS page directory. `all(locale)` fetches
  `websitePages(locale:)` (fields `name`, `slug`, `vue_route_name`) via
  `GorillaDash::graphql()` (SWR-cached, like `BoundLocation`), mapping each row to
  `['key' => vue_route_name ?: slug, 'slug', 'name']`. `findBySlug` / `findByKey`,
  `paths(locale)` (`homepage` pinned to `/`), and `pathsByLocale()` (the shared-prop
  shape). **Every method is total**: a fetch failure or an empty result falls back to
  `FALLBACK` (the default pages) — a CMS outage degrades to the default paths, it
  never 404s the site.
- **`routes/web.php`** — the `$pages` closure registers `/` plus the `{page}`-prefixed
  routes. `{page}` is constrained by a negative-lookahead pattern excluding reserved
  first segments (`up`, `csrf-cookie`, `graphql`, `gorilla-dash`, `storage`, `_boost`,
  `build`, `static`, and every locale code). The exclusion — not registration order — is
  the guard against shadowing: `/csrf-cookie` and the package routes register _after_
  this file's groups, and on a multilingual deployment a bare `{page}` would otherwise
  capture the `/{locale}` prefix and loop `/en` → `/en/en`. Route **names** are unchanged
  (`home`, `locations.show`) plus a new `page`, so `route()` and edge purge keys hold.
  Adding a sub-route with more literal segments? Register it BEFORE `{page}/{slug}`,
  or that two-segment route swallows it (see the `add-cms-route` skill).
- **`app/Http/Middleware/EnsureWebsitePage.php`** (alias `page`) — resolves the `{page}`
  segment in the request's locale. With a key (`page:locations`) it must be that logical
  page; keyless (the top-level route) it's an existence check. Then
  `forgetParameter('page')` — Laravel fills scalar controller parameters **positionally**,
  so a leftover `page` value would land in the controller's first argument (`$slug`,
  `$state`, …); forgetting it keeps the controllers identical to when their first segment
  was hardcoded.
- **`app/Http/Controllers/WebsitePageController.php`** — `home()` renders `Home` with the
  homepage slug as a prop; `show()` resolves the slug, maps the key through
  `COMPONENTS` (`locations` → `Locations`; `homepage` deliberately absent
  so `/homepage` stays 404 — its canonical URL is `/`), stamps the logical key into the
  edge-cache attribute, and renders with the slug as a prop. An unmapped key (e.g. a
  future `catering`) is a `Log::notice` + 404.
- **`app/Http/Controllers/LocationController.php`** — and every future sub-route
  controller: **only `{page}` is constrained by the route pattern.** `{slug}` (and a
  `{topic}`, `{newsId}`, `{section}` you add later) is CMS *data*, not a CMS *path* —
  baking it would mean a newly published record needed a redeploy to be reachable — so
  the controller asks a small service whether the value exists and 404s a miss. Without
  that check the URL renders an empty page at **200**, Google indexes it, and the edge
  caches the soft 404. The rule the services follow: **a definitive miss 404s, a lookup
  FAILURE is let through** (`rescue(fn () => $boundLocation->find($slug), false, report: false)`
  — a CMS outage must not 404 the whole catalogue). The page's CONTENT still comes from
  Apollo client-side, because Inertia's SSR renderer returns `{ head, body }` and cannot
  set an HTTP status. See the `add-cms-route` skill for the per-param checklist and the
  GD queries that can and can't answer "does this exist".
- **`app/Http/Middleware/EdgeCacheGuestPage.php`** — new `LOGICAL_NAME_ATTRIBUTE`; the
  controller sets it and `surrogateKeys()` prefers it over the route name, and the `page`
  parameter is skipped alongside `locale`. Result: `/stores` still emits
  `Surrogate-Key: html locations`, byte-identical to the old hardcoded route — stable
  across renames **and** across locales, so one purge key clears every language.
- **`bootstrap/app.php`** — registers the `page` alias, and puts `EnsureWebsitePage`
  ahead of `RedirectToDefaultLocale` in the middleware priority list. That order keeps a
  path the CMS doesn't know a **plain 404**, not a redirect hop into one (when hardcoded
  routes were the resolver, an unknown path simply matched no route).
- **`app/Http/Middleware/SetLocale.php`** — now `forgetParameter('locale')` after
  consuming it. This fixes a **latent positional-injection bug**: on a `/{locale}`-prefixed
  route the `locale` value would have landed in the controller's first argument (the store
  slug!) on any multilingual deployment. Never seen because no multilingual deployment
  exists yet.

## Frontend

Wayfinder generates its route helpers at **build time**, and one image serves every
country, so a generated URL freezes whatever slug existed at build. The CMS-driven
links are therefore built at runtime instead — the exact split `localizedUrl` already
uses for the locale prefix, one level deeper.

- **`resources/ts/lib/pagePaths.ts`** — pure, module-scope, detached-safe (explicit
  `code` argument, no inject). `setPagePaths(map)` copies the `pages` prop into module
  scope; `pagePath(key, code)` and `cmsRoute(name, params, code)` build
  locale-free paths; `translatePagePath(path, from, to)` swaps the first segment through
  the map for the language switcher. Holding the map in module scope is SSR-safe for the
  **same reason `runtimeConfig` is**: the prop carries every locale, so concurrent SSR
  renders set an identical value. _Do not slim the prop to the current locale_ — that
  invariant is load-bearing.
- **`resources/ts/composables/usePagePaths.ts`** — binds those helpers to the request's
  locale (via `useLocale` → `useSharedProps`, SSR-safe). Returns unprefixed paths that
  flow into `<LocaleLink>` / `localizedUrl()` exactly like a Wayfinder URL did.
- **`resources/ts/inertiaApp.ts`** — `applyRuntimeConfig()` calls `setPagePaths()`
  alongside `setRuntimeConfig()`, same lifecycle (per client boot / per SSR request,
  before render).
- **`resources/ts/composables/useLocale.ts`** — `switchUrl()` now runs the path through
  `translatePagePath` before re-prefixing, so the switcher crosses per-locale slugs.
- **Call sites migrated** off `@/routes/locations`: `useBoundLocation`, `LocationFinder`,
  `locationsService`, and the detached `MapInfoWindow` (pure functions + a `localeCode`
  prop). Wayfinder stays for genuinely static routes.
- **Pages take their slug as a prop**: `Home.vue` and `Locations.vue` read
  `defineProps<{ slug }>()` and pass it to `useWebsitePageService`, so the content fetch
  follows a rename too.

See the **`gd-locale-links`** skill for the full "where the path comes from / how it's
prefixed" rules every internal link now follows.

## Adding a new CMS page (still a deploy)

Only _renames_ are deploy-free. A genuinely new page needs four places to agree on its
logical key, then a Vue component:

1. `WebsitePages::FALLBACK` (PHP) — key ⇒ default slug.
2. `WebsitePageController::COMPONENTS` — key ⇒ component name.
3. `resources/ts/lib/pagePaths.ts` — add to the `PageKey` union and `FALLBACK`.
4. A `resources/ts/pages/<Component>.vue`.

## Tests

- **`tests/Feature/DynamicPageRoutingTest.php`** — default slugs (component + slug prop),
  the rename-to-`stores` scenario (sub-routes follow, renamed slug reaches the page, old
  path 404s, purge keys stay `html locations`), sub-route ownership (a locations
  sub-route 404s under another CMS page), CMS-down and empty-list fallback, reserved
  paths (`/up`, `/csrf-cookie`), the
  shared-prop shape, and per-locale slugs on a rebuilt multilingual route table
  (`/ar/<slug>` serves, `/ar/locations` 404s, unknown paths 404 without a redirect hop).
- **`tests/Unit/PagePathsUsageTest.php`** — fails the suite if anything imports
  `@/routes/locations` again (those URIs are build-time-baked and go stale on a rename). Shares the `tsFilesMatching` scanner with `SharedPropsUsageTest`
  from `tests/Pest.php`.
- **`tests/Pest.php`** — `fakeGraphql(roots)` routes one Mockery expectation by query
  root field (a second `shouldReceive('graphql')` would be swallowed by the first);
  `fakeWebsitePages([slug => vue_route_name])` and `websitePagesData()` shape the list,
  with a closure form for per-locale fakes. `fakeTribe()` is now a thin wrapper.
  Unmocked tests still pass — with no SDK credentials the service rescues to `FALLBACK`.

## GD platform follow-ups (tickets)

1. **Populate `vue_route_name`** on every websitePage record (`homepage`, `locations`,
   and whatever the client adds) — the exact lowercase keys the code expects.
   Prerequisite for any rename (see the ordering note above).
2. **Confirm `websitePages(locale:)` returns per-locale slugs**, and that
   `websitePage(slug, locale)` resolves by that locale's slug (the frontend content query
   depends on it).
3. **Main Menu `menu_json`** items are hand-typed `Internal Url` paths (`/locations`,
   `/catering`, …) — they do **not** follow a slug rename. Migrate them to a
   `Website Page` item type, or admins update them by hand.
4. **Slug validation** CMS-side: URL-safe, and not a reserved first segment or locale
   code (`up`, `csrf-cookie`, `graphql`, `gorilla-dash`, `storage`, `_boost`, `build`,
   `static`, `en`, `ar`, …).

## Known limitation

A renamed page's **old path 404s** (no 301). The edge may serve the old `200` HTML for up
to its TTL (120s); a rename propagates within the SWR window (`cache_ttl` 60s) plus the
edge TTL, or immediately via the existing `/gorilla-dash/clear-cache` webhook + an edge
`html` purge. A future GD-side redirect table could turn the 404 into a 301.
