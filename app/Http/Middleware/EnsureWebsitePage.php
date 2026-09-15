<?php

namespace App\Http\Middleware;

use App\Enums\Locale;
use App\Services\WebsitePages;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates a route on its `{page}` segment resolving to a CMS page in the request's
 * locale (alias `page` in bootstrap/app.php).
 *
 * With a key — `->middleware('page:locations')` on the sub-routes — the segment
 * must be that logical page: `/stores/vestavia-hills-al` serves the store detail
 * only while the CMS says the locations page lives at `stores`, and
 * `/menu/states/alabama` is a 404 because `menu` is not the locations page.
 *
 * Without a key — the single-segment `{page}` route — it is only an existence
 * check; WebsitePageController resolves the record again and picks the component.
 *
 * Runs after SetLocale (a `web` group middleware), so the app locale already
 * reflects any `{locale}` URL prefix — and BEFORE RedirectToDefaultLocale, via the
 * priority list in bootstrap/app.php. That order is what keeps a URL that resolves
 * to nothing a plain 404 on multilingual deployments: when hardcoded routes were
 * the resolver, `/de/menu` simply matched no route, and a soft-404 redirect hop to
 * `/en/de/menu` would be a behavior change (and hand crawlers a redirect into a 404).
 */
class EnsureWebsitePage
{
    public function __construct(private readonly WebsitePages $pages)
    {
    }

    public function handle(Request $request, Closure $next, ?string $key = null): Response
    {
        $route = $request->route();
        $slug = $route?->parameter('page');
        $locale = Locale::tryFrom(app()->getLocale()) ?? Locale::default();

        $page = is_string($slug) ? $this->pages->findBySlug($slug, $locale) : null;

        abort_if($page === null || ($key !== null && $page['key'] !== $key), 404);

        // Laravel fills scalar controller parameters positionally, so a leftover
        // `page` value would land in the controller's first parameter (`$slug`,
        // `$state`, ...). Forgetting it keeps the controllers identical to when
        // their routes' first segment was hardcoded — and drops it from
        // EdgeCacheGuestPage's per-parameter cache keys as a side effect.
        // Keyless use leaves it in place: WebsitePageController@show consumes it.
        if ($key !== null) {
            $route->forgetParameter('page');
        }

        return $next($request);
    }
}
