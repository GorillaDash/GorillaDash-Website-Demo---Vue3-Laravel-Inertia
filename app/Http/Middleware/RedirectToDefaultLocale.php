<?php

namespace App\Http\Middleware;

use App\Enums\Locale;
use App\Http\EdgeCacheGrant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * On a multilingual deployment, sends a locale-free page URL to the default locale.
 *
 * The canonical routes are always registered without a prefix (routes/web.php), because
 * they are the shape Wayfinder bakes into the frontend bundle. A multilingual deployment
 * serves the real pages under `/{locale}` instead, so those canonical URLs exist only to
 * redirect: `/menu` → `/en/menu`, `/` → `/en`. Monolingual deployments serve them
 * directly and this middleware does nothing.
 *
 * 302, not 301: the default locale is a config value, and a browser that cached the hop
 * permanently would ignore a later change. The edge grant is set by hand because
 * EdgeCacheGuestPage only grants it on a 200 — and `/` is the single most-requested URL
 * here, far too hot to round-trip to origin on every visit. It goes through
 * EdgeCacheGrant rather than naming headers inline so this hop stays cacheable by every
 * edge, not just whichever one the constant was written for.
 */
class RedirectToDefaultLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Locale::isMultilingual()) {
            return $next($request);
        }

        $uri = $request->getRequestUri();

        return redirect('/'.Locale::default()->code().($uri === '/' ? '' : $uri))
            ->withHeaders(EdgeCacheGrant::headers(3600, ['html', 'locale-redirect']));
    }
}
