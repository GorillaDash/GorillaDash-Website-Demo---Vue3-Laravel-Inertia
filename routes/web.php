<?php

use App\Enums\Locale;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\RobotsController;
use App\Http\Controllers\WebsitePageController;
use App\Http\Middleware\RedirectToDefaultLocale;
use App\Services\WebsitePages;
use Illuminate\Support\Facades\Route;

/**
 * The public pages. Pure reads (no session writes), so for anonymous, unbound
 * visitors the CDN edge may cache them — EdgeCacheGuestPage grants that
 * per-response (see App\Http\EdgeCacheGrant).
 *
 * Registered exactly once, either bare (monolingual deployment) or under a
 * `/{locale}` prefix (multilingual). The route NAMES are identical either way, so
 * `route()` and the Wayfinder-generated helpers don't care which deployment they
 * are running in. Because the prefix is a real route parameter, Wayfinder would
 * emit `locationsShow.url({ locale })` if it generated against a multilingual config —
 * the frontend must never depend on that, since one Docker image serves every country
 * off a single build. It prefixes URLs at runtime instead (localizedUrl.ts), and
 * generates against the monolingual shape.
 *
 * Their first segment is a `{page}` parameter, not a literal: the CMS decides what
 * path each page lives at (rename `locations` → `stores` in GD and `/stores` — with
 * its sub-routes — just works, per locale). The route DEFINITIONS stay static, so
 * `route:cache` at container start is unaffected; only the per-request lookup is
 * dynamic (WebsitePages, SWR-cached). The frontend mirrors this at runtime through
 * the `pages` shared prop (resources/ts/lib/pagePaths.ts) instead of Wayfinder,
 * whose URIs are baked at build time.
 *
 * One deliberate exception: every keyed sub-route bakes its page's current slugs
 * into its route pattern at registration (WebsitePages::slugPattern, resolved
 * below), applied uniformly so a page's sub-routes freeze and thaw together. A
 * sub-routed page's slug rename therefore needs a route-cache rebuild + reload;
 * top-level paths rename live.
 */

// First segments that must never be swallowed by a `{page}` route. Matching order
// alone cannot protect them — `/csrf-cookie` and package routes register after this
// file's groups, and on a multilingual deployment a bare `{page}` would capture the
// `/{locale}` prefix itself and RedirectToDefaultLocale would loop `/en` → `/en/en`.
// The `(?:/|$)` boundary makes the exclusion per-SEGMENT: `gorilla-dash` is blocked
// as `{page}` even when more segments follow (`/gorilla-dash/clear-cache`).
$reserved = ['up', 'csrf-cookie', 'graphql', 'gorilla-dash', 'storage', '_boost', 'build', 'static', ...Locale::codes()];
$pagePattern = '(?!(?:'.implode('|', array_map(preg_quote(...), $reserved)).')(?:/|$))[^/]+';

// One pattern per sub-routed page: its CURRENT slugs across locales, resolved ONCE
// — when this file runs, i.e. at `php artisan route:cache` (container start) or
// worker boot — and baked into the sub-routes below. This is a deliberate trade-off,
// and the reason a keyed sub-route must never reuse $pagePattern: Laravel picks a
// route by compiled URI BEFORE any middleware runs, so `page:` can only 404 a
// mismatch, never fall through to the next candidate. Give two pages a sub-route of
// the same shape (`{page}/{slug}` for stores and for articles, say) on the generic
// pattern and the first registered swallows both. The signed contract: renaming a
// SUB-ROUTED page's slug in the CMS only lands after a route-cache rebuild +
// octane:reload (in practice: redeploy/restart); the top-level `{page}` route stays
// live and deploy-free. On a fetch failure this bakes FALLBACK, exactly like the
// per-request lookups degrade. The keyed `page:` middleware stays on every sub-route
// as the per-request guard: it 404s locale mismatches (`/en/<ar-slug>/x`) and, after
// an un-reloaded rename, the stale slugs.
$websitePages = app(WebsitePages::class);
$locationsPattern = $websitePages->slugPattern('locations');

$pages = function () use ($pagePattern, $locationsPattern): void {
    Route::get('/', [WebsitePageController::class, 'home'])->name('home');

    // Single-store detail, and the starter's worked example of a CMS SUB-route: the
    // keyed `page:locations` middleware is what marks it CMS-driven, so CmsRoutes
    // picks it up and the frontend can build the URL from the route NAME while the
    // CMS owns the `{page}` segment. It matches only the locations page's baked
    // slugs, so a two-segment URL under any other page matches nothing and 404s at
    // the router. The controller passes {slug} through as a prop so the page has it
    // on first paint (SSR included).
    //
    // Add further sub-routes alongside it — each with its own parent's slugPattern,
    // never $pagePattern. Order still matters between routes of the SAME compiled
    // shape: a `/{page}/states/{state}` route has more literal segments and wins on
    // segment count, but two same-shape routes (this one and, say, an article
    // detail) are separated only by their allowlists, and across locales two unions
    // could in principle share a slug — first registered wins. See the
    // `add-cms-route` skill.
    Route::get('{page}/{slug}', [LocationController::class, 'show'])
        ->where('page', $locationsPattern)
        ->middleware('page:locations')
        ->name('locations.show');

    // Every top-level CMS page (/locations, or whatever the CMS renames it to), resolved and
    // dispatched to its Inertia component by the controller. Registered last in the
    // closure; the multi-segment routes above win on segment count, never on order.
    // The keyless `page` middleware is the existence gate that runs ahead of
    // RedirectToDefaultLocale (see bootstrap/app.php), so unknown paths 404 without
    // a redirect hop; the controller resolves the record again for the component.
    Route::get('{page}', [WebsitePageController::class, 'show'])
        ->where('page', $pagePattern)
        ->middleware('page')
        ->name('page');
};

// robots.txt, generated per deployment from config/seo.php (fed by each country's
// config.env) rather than shipped as a static public/ file — one image serves every
// country, so a baked-in file could not differ between a staging host and a live one.
// Registered AHEAD of the groups below so the `{page}` route cannot swallow it, and
// outside the `/{locale}` prefix so it stays at the root on a multilingual deployment.
// It is identical for every visitor, so the edge may hold it far longer than a page.
Route::get('robots.txt', RobotsController::class)
    ->middleware('edge-cache:3600')
    ->name('robots');

// The canonical, locale-free routes, registered on EVERY deployment. Their URIs are
// what Wayfinder bakes into the frontend bundle at build time, and one image serves
// every country — so this shape must not depend on how many locales are configured.
// (It did once, briefly: adding a `{locale}` prefix here turned `locationsShow.url()`
// into `locationsShow.url({ locale })`, and every page that called it crashed under SSR.)
// On a multilingual deployment these URLs only redirect; see RedirectToDefaultLocale.
Route::middleware(['edge-cache', RedirectToDefaultLocale::class])->group($pages);

// A multilingual deployment additionally serves the real pages under `/{locale}`.
// The `locale.` name prefix keeps these from colliding with the canonical names above;
// nothing references them — the frontend re-attaches the prefix itself, at runtime,
// through localizedUrl(). EdgeCacheGuestPage strips the prefix back off for its
// cache keys, so purge keys stay the same in either deployment.
if (Locale::isMultilingual()) {
    Route::prefix('{locale}')
        ->whereIn('locale', Locale::codes())
        ->middleware('edge-cache')
        ->name('locale.')
        ->group($pages);
}

// The bound store needs no endpoint at all: the pages write its cookie in the browser
// (see resources/ts/lib/boundLocation.ts) and the server reads it back on the next
// render. Binding used to be a POST beacon, whose CSRF prime handed the visitor a
// session cookie — and the edge sends any request carrying one straight to origin.

// CSRF prime: edge-cached pages are served cookie-less, so a visitor's first
// state-changing request must first fetch this (any uncached web response sets the
// XSRF-TOKEN cookie). Nothing calls it today; it is the primitive a real form will need.
// Note that it also starts a session, which costs the caller the edge cache.
Route::get('/csrf-cookie', fn () => response()->noContent())->name('csrf-cookie');
