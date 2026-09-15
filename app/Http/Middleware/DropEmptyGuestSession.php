<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Don't hand a session cookie to a visitor who has no session state.
 *
 * Laravel's StartSession sets its cookie on every `web` response, even when the session
 * holds nothing but the CSRF token and the previous URL. The edge's bypass rule sends
 * any request carrying that cookie straight to origin (deploy/cloudflare/rules.sh) — so
 * a guest who merely clicked one SPA link (an X-Inertia response, which is never granted
 * a shared copy and so keeps its Set-Cookie) left the edge cache for the rest of their
 * visit, on every page.
 *
 * Prepended to the `web` group, so its post-processing runs after EncryptCookies has
 * already queued the cookie: removing it by name is the last word.
 *
 * A visitor who actually needs a session still gets one:
 *  - authenticated requests are untouched;
 *  - anything flashed or written to the session (validation errors, a redirect-back)
 *    counts as state and keeps the cookie;
 *  - GET /csrf-cookie is the explicit opt-in — a form is about to be submitted, and
 *    that visitor is deliberately trading the edge cache for a usable CSRF token.
 */
class DropEmptyGuestSession
{
    /**
     * Keys Laravel writes for every visitor. None of them means "this visitor has state".
     *
     * @var list<string>
     */
    private const HOUSEKEEPING = ['_token', '_previous', '_flash'];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $this->shouldDropSession($request)) {
            return $response;
        }

        $path = config('session.path') ?? '/';
        $domain = config('session.domain');

        $response->headers->removeCookie((string) config('session.cookie'), $path, $domain);
        // Useless without the session it signs, and one less reason for a cache to vary.
        $response->headers->removeCookie('XSRF-TOKEN', $path, $domain);

        return $response;
    }

    private function shouldDropSession(Request $request): bool
    {
        if ($request->user() !== null || $request->routeIs('csrf-cookie')) {
            return false;
        }

        if (! $request->hasSession()) {
            return false;
        }

        $state = collect($request->session()->all())->except(self::HOUSEKEEPING);

        return $state->isEmpty() && ! $this->hasFlashedData($request);
    }

    private function hasFlashedData(Request $request): bool
    {
        return $request->session()->get('_flash.old', []) !== []
            || $request->session()->get('_flash.new', []) !== [];
    }
}
