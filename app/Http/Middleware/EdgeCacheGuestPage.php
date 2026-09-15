<?php

namespace App\Http\Middleware;

use App\Http\EdgeCacheGrant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Marks public pages as cacheable by the CDN edge for anonymous traffic.
 *
 * For a visitor with no auth, no bound store, and no flashed session state these
 * pages render identically, so the edge may serve one shared copy instead of
 * round-tripping to origin + SSR per request. EdgeCacheGrant spells that grant for
 * the CDN in front of this origin, while Cache-Control stays no-cache/private so
 * browsers and other intermediaries never store a copy. With no edge in front (local
 * dev, tests) the grant headers are inert.
 *
 * The edge side of the contract lives in deploy/cloudflare/rules.sh, as two halves:
 *  - a BYPASS rule matching requests that are personalized (a session cookie, the
 *    X-Inertia header, ?debug=1) so they always reach origin;
 *  - an ELIGIBLE-FOR-CACHE rule for everything else, which respects the grant above.
 *
 * The request-side half carries more weight on Cloudflare than the same idea does on a
 * VCL edge, because **Cloudflare ignores `Vary` outside Accept-Encoding**. Withholding
 * the grant is therefore NOT on its own enough to keep a personalized page out of the
 * cache — the bypass rules are. Never rely on this middleware alone.
 *
 * The keys carry "html", the route name, and one key per route parameter, so a purge
 * can be as wide or as narrow as the change: everything, one route, or one store
 * (purge Cache-Tag `locations.show:vestavia-hills-al` after a CMS publish). See
 * cacheKeys().
 */
class EdgeCacheGuestPage
{
    /**
     * Request attribute overriding the route name in cacheKeys().
     *
     * The dynamic `{page}` route (see routes/web.php) serves every CMS-driven page
     * under one route name, and its URL segment is whatever the CMS says today — so
     * neither is a stable purge key. WebsitePageController sets this attribute to the
     * page's logical key (`locations`, `menu`), keeping purge keys byte-identical to
     * the old hardcoded routes' — stable across slug renames and across locales.
     */
    public const LOGICAL_NAME_ATTRIBUTE = 'edge-cache.logical-name';

    /** A route parameter value safe to embed in a cache-key token. */
    private const KEY_SAFE_VALUE = '/^[A-Za-z0-9._-]+$/';

    public function handle(Request $request, Closure $next, int $ttl = 120): Response
    {
        $response = $next($request);

        if ($this->cacheable($request, $response)) {
            $response->headers->add(
                EdgeCacheGrant::headers($ttl, $this->cacheKeys($request)),
            );
        }

        return $response;
    }

    /**
     * The keys a purge can name this page by, widest first.
     *
     * `html` clears every cached page (what deploy.sh runs). The bare route name clears
     * one route across all its URLs. Then one key per route parameter, cumulative, so a
     * single store can be purged on its own — and a multi-parameter sub-route gets one
     * key per prefix of its parameters:
     *
     *   /locations/vestavia-hills-al
     *     → ['html', 'locations.show', 'locations.show:vestavia-hills-al']
     *   /events/2026/summer-tasting  (a two-parameter sub-route)
     *     → ['html', 'events.show', 'events.show:2026', 'events.show:2026:summer-tasting']
     *
     * Without the parameter keys, publishing one store would purge every store's page.
     *
     * @return list<string>
     *
     * The `locale.` prefix a multilingual deployment adds to its `/{locale}`-prefixed
     * routes is stripped, and the `locale` parameter skipped, so a purge names the same
     * key in every country and clears every language of that page at once.
     */
    private function cacheKeys(Request $request): array
    {
        $route = $request->route();
        $name = $request->attributes->get(self::LOGICAL_NAME_ATTRIBUTE)
            ?? Str::after($route?->getName() ?? '', 'locale.');

        if ($route === null || $name === '') {
            return ['html'];
        }

        $keys = ['html', $name];
        $segments = [];

        // parameterNames(), not parameters(): the latter also carries a route's defaults,
        // and Route::inertia() stashes the page component in there.
        // `page` is skipped like `locale`: both are localized aliases of the same
        // logical page, so a purge must not fork per slug or per language.
        foreach ($route->parameterNames() as $parameter) {
            $value = $route->parameter($parameter);

            if (in_array($parameter, ['locale', 'page'], true) || ! is_scalar($value)) {
                continue;
            }

            // A key is a bare token — Cache-Tag separates them with commas (and
            // Surrogate-Key, if a second edge is ever added, with spaces), so a value
            // containing either would split into two keys and a purge of the fragment
            // would clear pages nobody asked about. A parameter that can't be a token is
            // dropped rather than escaped; the route-name key still purges it.
            if (preg_match(self::KEY_SAFE_VALUE, (string) $value) !== 1) {
                break;
            }

            $segments[] = (string) $value;
            $keys[] = $name.':'.implode(':', $segments);
        }

        return $keys;
    }

    /**
     * Only a full-document 200 rendered for an anonymous visitor with no flashed session
     * state (e.g. validation errors after a redirect-back) is byte-identical across
     * visitors — anything else must stay per-request.
     *
     * The bound store used to disqualify a render too. It no longer appears in the HTML:
     * it is a deferred prop, fetched after mount in a partial reload. So a visitor with a
     * locked store now gets the same shared copy as everyone else, which is the whole
     * point — before this, locking a store cost them the edge cache on every page.
     *
     * X-Inertia (partial reload / SPA navigation) responses are excluded: their shape
     * varies with the requested props, and the edge bypasses them anyway. ?debug=1 is the
     * explicit cache-bypass switch (the edge bypasses it too; withholding the grant here
     * keeps every environment consistent, edge rules or not).
     */
    private function cacheable(Request $request, Response $response): bool
    {
        return $request->isMethodCacheable()
            && ! $request->headers->has('X-Inertia')
            && ! $request->boolean('debug')
            && $response->getStatusCode() === 200
            && $request->user() === null
            && ! $request->session()->has('errors')
            && $request->session()->get('_flash.old', []) === []
            && $request->session()->get('_flash.new', []) === [];
    }
}
