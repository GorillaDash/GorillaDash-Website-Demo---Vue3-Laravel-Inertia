<?php

namespace App\Http\Middleware;

use App\Enums\Locale;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves the request's locale from the `/{locale}` URL segment and applies it.
 *
 * Registered in the `web` group ahead of HandleInertiaRequests, which shares the
 * resolved locale with the frontend. Monolingual deployments have no locale segment
 * (see routes/web.php) and every request simply falls through to the default, so the
 * middleware is inert there. Routes outside the page group (the session beacons,
 * /csrf-cookie) also have no segment and likewise get the default — which matters
 * under Octane, where `app()->setLocale()` would otherwise carry over from whichever
 * request the worker handled last.
 *
 * Deliberately does NOT call `URL::defaults(['locale' => ...])`. Wayfinder's generator
 * greps middleware source for that literal string and tokenizes the array to bake
 * compile-time defaults into the generated TypeScript (GenerateCommand::extractUrlDefaults).
 * It reads a variable's token verbatim, so it would emit `/$locale/menu` as the URL of
 * every route. The frontend adds the prefix at runtime instead — see
 * resources/ts/lib/localizedUrl.ts.
 */
class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = Locale::fromCode((string) $request->route('locale')) ?? Locale::default();

        app()->setLocale($locale->value);

        // Consumed. Laravel fills scalar controller parameters positionally, so on a
        // `/{locale}`-prefixed route a leftover `locale` value would land in the
        // controller's first parameter (`$page`, `$slug`, ...). EdgeCacheGuestPage
        // reads it by name and already treats it as skipped either way.
        $request->route()?->forgetParameter('locale');

        return $next($request);
    }
}
