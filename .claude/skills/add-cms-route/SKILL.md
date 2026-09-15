---
name: add-cms-route
description: >-
  Interview-driven procedure for adding a route or page to this app. Activate when
  the user wants to add a new page, a new URL, a new route, a sub-route under
  locations, or says anything like "add a route", "new page", "加一個 route",
  "新增路由", "新增頁面", "加頁面". DON'T start editing from memory: interview the
  user for the missing facts (AskUserQuestion), validate the slug/params against the
  CURRENT reserved list and route table, then make the scenario's edits and run the
  regeneration + test steps. Covers the three kinds — top-level CMS page, CMS
  sub-route, and static (non-CMS) route — and the collision rules that make a wrong
  first segment or param name break routing in ways that are invisible on the US site.
metadata:
  author: casper
---

# Adding a route — interview, validate, wire

Routing here is CMS-driven (see `routes/web.php`, `App\Services\WebsitePages`,
`App\Services\CmsRoutes`): the first URL segment of the CMS page family is a
`{page}` parameter the CMS renames at runtime, and the frontend's route names, param
types, and fallbacks are all GENERATED. Adding a route is therefore mostly answering
questions correctly — the wiring is small, but a wrong slug or param name collides
with the machinery. Never skip the interview or the validation gates.

## Step 1 — classify the request

Three kinds; infer from the user's words and confirm (AskUserQuestion) when unclear:

| Kind                                                    | Example                             |
| ------------------------------------------------------- | ----------------------------------- |
| **A. Top-level CMS page** — CMS decides its path        | `/catering`                         |
| **B. Sub-route under a CMS page** — tail after `{page}` | `/{locations-slug}/gallery/{photo}` |
| **C. Static route** — fixed path, not CMS-renamable     | `/csrf-cookie`, form POST endpoints |

## Step 2 — interview (ask, don't guess)

**For A (top-level page):**

- Logical key (stable identity, e.g. `catering`)?
- Default slug (usually = the key)?
- Inertia component name (`resources/ts/pages/<Name>.vue` — new or existing)?
- Does the GD CMS already have the `websitePage` record? (Required in production —
  the FALLBACK only serves when the CMS is unreachable.)

**For B (sub-route):**

- Parent page key (`locations` / `menu` / a new one → do A first)?
- URL tail after the page segment — literals and `{params}` (e.g. `gallery/{photo}`)?
- Route name (parent-prefixed: `locations.gallery`)?
- Controller + method (new method on the existing controller, or a new controller)?
- Which params does the page need as props? (Controller must pass them — the route
  params reach the controller positionally AFTER `page` is forgotten.)

**For C (static):** the path, method(s), and handler. Note it will use Wayfinder on
the frontend, not `cmsRoute`.

## Step 3 — validation gates (run BEFORE editing)

1. **Reserved first segment.** For A and C, the first segment must not collide with
   the `$reserved` list in `routes/web.php` — READ THE CURRENT LIST, don't trust any
   doc — nor with a locale code:

   ```bash
   grep -n 'reserved =' routes/web.php
   php artisan tinker --execute 'print_r(App\Enums\Locale::codes());'
   ```

   For A additionally: the key must not already exist in `WebsitePages::FALLBACK`.
   For C: the new first segment must be ADDED to `$reserved`, or a CMS page slugged
   the same would fight it (and `{page}` could swallow sub-paths of it).

2. **Param names.** Never `{page}` and never `{locale}` — both are taken by the
   machinery (`{page}` is the CMS segment; `{locale}` is the multilingual prefix
   group's parameter and would collide on prefixed registrations). Plain `\w+` names.

3. **Route name is free.**

   ```bash
   php artisan route:list --name=<the-new-name>
   ```

4. **Shape collision and ordering.** Laravel picks a route by compiled URI BEFORE
   any middleware runs — `page:` can only 404 a mismatch, never fall through to the
   next candidate. Every keyed sub-route therefore matches ONLY its own page's slugs,
   via a BAKED allowlist: `WebsitePages::slugPattern('<key>')` resolves the page's
   per-locale slugs ONCE, when `routes/web.php` runs (`route:cache` at container
   start / worker boot). A new sub-route uses
   `->where('page', $locationsPattern)` — never `$pagePattern` (that is the keyless
   top-level route's, and it matches EVERY page). The signed contract this buys:
   renaming a SUB-ROUTED page's slug only lands after a route-cache rebuild +
   reload; top-level paths rename live.

   With the allowlists in place, two same-shape routes for DIFFERENT pages can
   coexist (`{page}/{slug}` for stores and `{page}/{articleId}` for news) — register
   the pair so the union that could swallow the other comes first, since across
   locales two unions could in principle share a slug and first wins. Literal middle
   segments (`states/`, `item/`) remain free extra insurance when the URL design
   allows one, and a route with more literal segments still wins on segment count
   regardless of order. Everything registers before the final keyless `{page}` route.

## Step 4 — the edits

**A. Top-level CMS page** (never touch `routes/web.php` — the keyless `{page}` route
already serves it):

1. `WebsitePages::FALLBACK` — add `'key' => 'slug'`.
2. `WebsitePageController::COMPONENTS` — add `'key' => 'Component'` (homepage is
   deliberately absent; don't "fix" that).
3. `resources/ts/pages/<Component>.vue` — the page (slug arrives as the `slug` prop).
4. Remind the user: GD must hold the CMS record, and must populate `vue_route_name`
   before any slug rename, or the page loses its identity.

**B. Sub-route:**

1. If this is the FIRST sub-route of its page, bake that page's allowlist next to the
   existing ones, above the `$pages` closure in `routes/web.php`, and add it to the
   closure's `use (...)` list:

   ```php
   $newsPattern = $websitePages->slugPattern('news');
   ```

   (`slugPattern()` falls back to `WebsitePages::FALLBACK[$key]`, so the key must
   exist there — which it will, since a sub-route's page is a CMS page.)

2. In the `$pages` closure, at the position Step 3.4 determined:

   ```php
   Route::get('{page}/gallery/{photo}', [LocationController::class, 'gallery'])
       ->where('page', $locationsPattern)   // baked allowlist, per Step 3.4 — NOT $pagePattern
       ->middleware('page:locations')       // keyed middleware = the per-request guard
       ->name('locations.gallery');
   ```

3. The controller method (+ Vue page if new). Pass route params through as props.

4. **Validate every OPEN param in that controller — this is not optional.** `{page}` is
   the only parameter the route pattern constrains; `{slug}`, `{topic}`, `{newsId}`,
   `{section}` match ANY segment. Without a check the route renders an empty page at
   200, Google indexes it, and the edge caches that soft 404 under the URL. So:

   ```php
   // App\Services\<Thing>: one question — does this exist — asked as cheaply as
   // possible, bound `scoped` in AppServiceProvider so a newly published record is
   // routable on the next request (and asked at most once per request).
   abort_unless($this->things->exists($slug, $locale), 404);
   ```

   **Split the two failure modes: a definitive miss 404s, a lookup FAILURE is let
   through** (`rescue(..., report: false)` returning "exists"). A CMS outage must never
   404 a whole catalogue — `App\Services\BoundLocation` + `LocationController::show`
   is the worked example in this repo; `TheGreatGreek-inertiajs` / `GrazeCraze-inertiajs`
   have `Articles` (a `{newsId}`) and `FoodMenu` (a `{section}/{item}`) to copy.

   Three GD traps, each costing a silent wrong answer:

   - **Not every single-record query can be the check.** `article(slug:)` answers
     `null` for an unknown slug, so it IS its own existence check. `foodMenuListItem`
     answers *"Internal server error"* instead — a miss and an outage become
     indistinguishable, and the fail-open rule then makes it useless. Read the parent
     LIST (`foodMenu` → sections → item slugs) and match in PHP.
   - **A blank value can be a wildcard.** `article(slug: "")` returns the newest
     published article. Reject an empty/whitespace param before it reaches GD.
   - **Ask with the same arguments the page's own query uses** (locale, `status`), or
     the allowlist won't be the set of URLs the listing page LINKS to and a linked
     record will 404.

   The CONTENT still comes from Apollo client-side, on this route like every other:
   Inertia hands the SSR renderer a page object and takes back `{ head, body }`, so Vue
   cannot set an HTTP status — a frontend "no data, therefore 404" is a soft 404, and
   SSR may be off or unreachable anyway.

**C. Static route:** register outside the `$pages` closure, add the first segment to
`$reserved`, and note a GD-side follow-up (GD's slug validation should reject it).

## Step 5 — regenerate and verify

```bash
php artisan cms-routes:types      # or any build/dev — the vite hook runs it too
vendor/bin/pint --dirty --format agent
php artisan test --compact        # DynamicPageRoutingTest / CmsRouteTypesTest /
                                  # FrontendPagePathsTest must all stay green
npm run types:check
```

Add feature tests mirroring `DynamicPageRoutingTest`'s sections for the new route:
serves under the default slug, follows a CMS rename, 404s under the wrong page key,
and (for A) never swallows reserved paths.

For B, pin the open param's check as well — four tests, and the last two are the ones
that get forgotten: a value the CMS HAS serves; a value it does NOT have 404s; a
lookup that THROWS serves (outage tolerance); an answered-but-empty reply 404s (a
definitive miss). `fakeGraphql()` (tests/Pest.php) drives all four — an unfaked root
returns `[]`, which the service must read as a failure and let through.

Frontend usage needs zero new infrastructure — `cmsRoute('locations.gallery',
{ photo })` (typed after regeneration) for B, `pagePath('key')` for A, Wayfinder for
C — but every link you then write must follow the `gd-locale-links` skill (LocaleLink
/ localizedUrl, and its double-check list). Activate it before touching any `.vue`.

## Reminders to surface at the end

- A new page or route is a **deploy**; only CMS slug renames are deploy-free.
- Purge keys derive from the logical route name automatically (`EdgeCacheGuestPage`);
  no cache wiring needed.
- If the parent page key is new (B on top of A), do A first and re-run Step 5.
