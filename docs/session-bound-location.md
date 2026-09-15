# Session-bound location — the "locked store"

When a visitor opens a store page (`/locations/{slug}`), that store is **bound** to
their session and stays "locked" site-wide (header, footer, home) until they browse
back out to the directory. The binding lives **server-side in the session**, so it is
present on the very first render — SSR included — with no localStorage and no
hydration flash.

> Replaces an earlier localStorage-backed Pinia store (`stores/location.ts` +
> `layouts/LocationLayout.vue`, both removed). localStorage can't be read during SSR,
> so the locked store never appeared in the first paint. Moving it to the session and
> sharing it as an Inertia prop fixes that.

## Page GETs are pure reads (edge-cache contract)

**Reworked 2026-07-03 for edge caching.** The page GETs no longer write the session —
they are pure reads so the CDN edge can serve one shared, cookie-less copy to
anonymous, unbound visitors (see `App\Http\Middleware\EdgeCacheGuestPage` and
`docs/edge-html-cache.md` / `deploy/cloudflare/README.md`). The session write that used to ride on those
GETs now happens **after mount** through small beacon endpoints:

- `POST /bound-location` — **bind** the visited store (fired by `LocationDetail.vue`).
- `DELETE /bound-location` — **clear** the binding (fired by the browsing pages
  `Locations.vue` (the directory index) — the visitor has stepped
  back out).

Both go through `resources/ts/lib/boundLocationBeacon.ts`, which lazy-primes the CSRF
token via `GET /csrf-cookie` (edge-cached pages are served cookie-less, so the first
write must prime `XSRF-TOKEN` first), uses `fetch(..., { redirect: 'error' })` (web
validation failures redirect-back and must count as failure, not success), and on a
`2xx` calls `router.reload({ only: ['boundLocation'] })` so shared surfaces update
without a full visit. Consequence: the locked-store chip appears **post-mount** on the
first detail-page visit, then is **present on first paint (SSR)** on every later page.

## Data flow

```
Bind    LocationDetail.vue  onMounted → POST   /bound-location {slug}  → session put   (+ 404 if no such store)
Clear   Locations.vue       onMounted → DELETE /bound-location         → session forget
        Locations.vue onMounted → clearBoundLocation()                 → cookie cleared

Every request  HandleInertiaRequests::share()
               └ read session slug → GorillaDash::graphql(tribe by slug, SWR-cached)
                 → shares page.props.boundLocation  (null when nothing is bound)

Frontend  any page (home / header / footer / detail)
          └ useBoundLocation() reads the prop → present on first paint, SSR included
```

The server is the **single source of truth**. The frontend only reads the prop;
nothing writes the binding client-side except by firing the beacons above.

## What the binding holds (intentionally minimal)

Just the basics a shared surface needs to show a locked store:

| Field                                                                   | Source (GraphQL `tribe`) |
| ----------------------------------------------------------------------- | ------------------------ |
| `name`, `slug`                                                          | `name`, `slug`           |
| `email`                                                                 | `public_email`           |
| `phone`                                                                 | `main_telephone`         |
| `address_1`, `address_2`, `locality`, `state`, `country`, `postal_code` | same                     |

Richer per-store data (hours, map geo, online-ordering URL, SEO meta, the ad-source
phone-swap) is **not** in the binding. Pages that need it fetch the full tribe
themselves by slug. Add a field to the binding only when a shared surface needs it —
see `App\Services\BoundLocation::TRIBE_FIELDS`.

## Backend

- **`app/Services/BoundLocation.php`** — the whole binding lifecycle. `bind()` /
  `clear()` / `slug()` (session, key `bound_location`), `find(slug)` (resolve one store
  → basic office array), `current()` (resolve the bound one). The query is built with
  the `GraphQL\Query` builder (per the SDK README) over `TRIBE_FIELDS` and run through
  `GorillaDash::graphql()` (SWR-cached).
- **`app/Http/Controllers/BoundLocationController.php`** — the beacon endpoints.
  `store()` binds (validates via `StoreBoundLocationRequest`; `abort(404)` on a slug
  that resolves to no store; a lookup _error_ is tolerated, not 404'd). `destroy()`
  clears. Both return `204 No Content`.
- **`app/Http/Controllers/LocationController.php`** — `show()` and `state()` are now
  **pure reads**: they render (and `show()` still `abort(404)`s an unknown slug) but do
  **not** touch the session. Binding/clearing is the beacons' job.
- **`routes/web.php`** — the public pages sit in a `Route::middleware('edge-cache')`
  group; `/locations` is back to `Route::inertia` (no session side effect to run). The
  beacons (`POST`/`DELETE /bound-location`) and the CSRF prime (`GET /csrf-cookie`) live
  outside that group.
- **`app/Http/Middleware/HandleInertiaRequests.php`** — shares `boundLocation` as a lazy
  closure prop, `rescue()`d to `null` so an API hiccup never breaks a page.
- **`app/Http/Middleware/EdgeCacheGuestPage.php`** (`edge-cache` alias in
  `bootstrap/app.php`) — grants the edge a shared copy on a full-document `200` GET
  only when the visitor is anonymous, **unbound** (`boundLocation->slug() === null`),
  and has no flashed session state. See "Edge caching" below.
- **`config/inertia.php`** — `pages.paths` corrected from the framework default
  `resources/js/pages` to this project's `resources/ts/pages`, so
  `assertInertia()->component()` can locate page files in tests. (Same class of js→ts
  rename gotcha noted in `CLAUDE.md`.)

## Frontend

- **`resources/ts/lib/boundLocationBeacon.ts`** — `bindBoundLocation(slug)` /
  `clearBoundLocation()`. Plain `fetch` (session plumbing, not business data), lazy CSRF
  prime, `redirect: 'error'`, then `router.reload({ only: ['boundLocation'] })`.
  `clearBoundLocation()` early-returns for cookie-less visitors (they can't have a
  binding, and touching the session would cost them their cacheable status).
- **`resources/ts/composables/useBoundLocation.ts`** — reads `page.props.boundLocation`
  and exposes `name` / `slug` / `email` / `phone` / `address` / `href` / `lockedStore`.
  This is the only way surfaces should read the binding.
- **`resources/ts/types/locations.ts`** — the `BoundLocationInfo` shape.
- **`resources/ts/types/global.d.ts`** — `boundLocation` added to `sharedPageProps`.

### LocationDetail: instant basics, then fill in

`LocationDetail.vue` fetches the **full** tribe (`getTribe(slug)`) for its rich content,
but reads the basics from the share prop so they paint immediately instead of waiting on
that round-trip (noticeable on SPA navigation). The rule is `tribe ?? boundLocation`:

| Rendered from the share prop (instant)                                                 | Fills in when `getTribe` resolves                                                                                                                                             |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name, address lines, phone (`main_telephone`), map-marker identity, meta-template name | description/intro, opening hours, map geo (lat/lng) + directions link, online-ordering URL, real SEO `meta_title`/`meta_description`, ad-source phone-swap / `organic_number` |

Same store in both, so there's no wrong-data flicker — only a basic → full progressive
fill.

## Edge caching & the session cookie (READ THIS before adding stateful features)

The binding lives in the **stock Laravel session**, and the session's cookie is what
gates the edge cache. Getting this wrong silently disables edge caching, so the
mechanics are worth understanding.

**How the edge decides** (the `bypass_personalized` rule in
`deploy/cloudflare/rules.sh`):

```
http.host eq "<host>" and (
  http.cookie contains "-session=" or len(http.request.headers["x-inertia"][0]) > 0
)  ->  cache: false
```

The gate is the **presence of the `<app-slug>-session` cookie** — Laravel's standard
framework session cookie (`config/session.php` → `Str::slug(APP_NAME).'-session'`, e.g.
`acme-diner-usa-session`; `SESSION_DRIVER=database`). It is **not** a custom
cookie, and the edge **cannot see** the `bound_location` value inside the session — only
whether the cookie exists.

**Why pure browsing stays cached.** `DropEmptyGuestSession` withholds the cookie from a
guest whose session holds nothing, so it never reaches the browser from a
home/locations/detail **GET**. A read-only visitor therefore stays cookie-less and
keeps getting edge HITs. The `-session` cookie only sticks via a **non-cacheable**
response: the `GET /csrf-cookie` prime, the `POST`/`DELETE` beacons, or an
authenticated page. In other words, the cookie is minted the moment a visitor first
**writes / interacts**, not when they browse.

**Design rule for any future stateful feature.** A guest's GET / component mount must
**never** touch the session or prime CSRF. Lazy-prime the token only at the moment of
the actual write (as `boundLocationBeacon` does). Anti-patterns that would set the
session cookie for **every visitor on first load** and disable edge caching site-wide:

- fetching `/csrf-cookie` eagerly in `onMounted` "just in case";
- putting `csrf_token()` in shared Inertia props or rendering a CSRF-bearing form on a
  cached page's first paint;
- any controller in the `edge-cache` group writing to the session.

CSRF is session-backed in stock Laravel, so any CSRF-protected write inherently mints
the session cookie — that's acceptable, because a visitor who is writing needs fresh
personalized SSR anyway.

### Known limitation — no edge re-entry after unbinding

`DELETE /bound-location` calls `session()->forget('bound_location')`: it clears the
**locked store** (verified — the `boundLocation` prop returns to `null` and the origin
re-renders the generic page) but does **not** drop the session cookie. Because the edge
gates on cookie _presence_, a visitor who has locked any store (or otherwise minted a
session) keeps carrying the cookie and **passes the edge cache for the rest of the
session, even after unlocking**. `EdgeCacheGuestPage::cacheable()` re-grants
cacheability at origin once unbound, but the edge never reaches that check — its bypass
rule already matched on the cookie.

Impact: an engaged visitor who views one store page gets fresh (uncached) SSR for the
rest of their session. Acceptable today; if we later want writers to **re-enter** the
edge cache after unbinding, we need one of:

- **Plan A (small, fiddly):** on `destroy()`, when the guest session is otherwise
  empty, actually drop the `-session` cookie. Note `session()->invalidate()` alone is
  **not** enough — `StartSession` re-emits a cookie for the new session id; you must
  `Cookie::forget(config('session.cookie'))` in an outer/terminating step that runs
  after `StartSession`.
- **Plan B (cleaner, preferred long-term):** move the locked store out of the Laravel
  session into an **independent, signed `bound_location` cookie**, and narrow the edge's
  bypass rule so it matches only when _that_ cookie is present and non-empty. Clearing becomes a plain
  `Cookie::forget('bound_location')`, fully decoupled from the session and CSRF. SSR
  reads the cookie instead of the session.

_Status: documented, not implemented — revisit if edge re-entry for engaged visitors
becomes a measured priority._

## Tests

`tests/Feature/BoundLocationTest.php` covers the beacons (`POST` binds, 404-on-missing,
validation; `DELETE` clears), the page GETs staying pure reads (detail/index/state do
**not** mutate the session), the shared prop on other pages, and null-when-unbound. The
GD GraphQL layer is faked with `fakeTribe(...)`. Edge-cacheability of the renders is
covered separately by `EdgeCacheGuestPageTest`.
