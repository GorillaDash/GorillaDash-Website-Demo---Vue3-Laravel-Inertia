<?php

use App\Http\Middleware\DropEmptyGuestSession;
use App\Http\Middleware\EdgeCacheGuestPage;
use App\Http\Middleware\EnsureWebsitePage;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RedirectToDefaultLocale;
use App\Http\Middleware\SetLocale;
use App\Services\BoundLocation;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // First in, last out: its post-processing runs after EncryptCookies has queued
        // the session cookie, which is the only place it can be taken back off.
        $middleware->web(prepend: [
            DropEmptyGuestSession::class,
        ]);

        $middleware->web(append: [
            // Ahead of HandleInertiaRequests, which shares the resolved locale.
            SetLocale::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'edge-cache' => EdgeCacheGuestPage::class,
            // Gates a {page}-prefixed route on the segment resolving to a CMS page
            // (`page:locations` on sub-routes, bare `page` on the top-level route).
            'page' => EnsureWebsitePage::class,
        ]);

        // Resolve the page BEFORE deciding to redirect a bare canonical URL: a path
        // the CMS doesn't know must stay a plain 404 (as it was when unknown paths
        // simply matched no route), not a redirect hop into one. Route middleware
        // order alone can't express this — RedirectToDefaultLocale sits on the
        // group, ahead of each route's own `page:*` entry.
        $middleware->appendToPriorityList(
            SubstituteBindings::class,
            EnsureWebsitePage::class,
        );
        $middleware->appendToPriorityList(EnsureWebsitePage::class, RedirectToDefaultLocale::class);

        // The bound-store cookie is written by the browser, so Laravel must not expect
        // it to be encrypted. It carries a public store slug and nothing else.
        $middleware->encryptCookies(except: [
            BoundLocation::COOKIE,
        ]);

        // Requests arrive Fastly (TLS terminated there) -> GKE Ingress -> pod,
        // all over HTTP internally. Trust X-Forwarded-For so the real client IP
        // survives the hops. Note the scheme is NOT recoverable from
        // X-Forwarded-Proto here: the GCE L7 LB overwrites it with "http" for the
        // Fastly->origin HTTP leg, so https is forced separately via
        // APP_FORCE_HTTPS (see AppServiceProvider).
        //
        // ONLY those two. Laravel's default also trusts X-Forwarded-Host, -Port and
        // -Prefix, and an edge and the LB pass a visitor's own copies of those through
        // untouched — a visitor can set them. They feed the root URL that every
        // absolute URL is built from, the Vite asset tags included. On GrazeCraze
        // staging (Cloudflare, whose cache key does not carry X-Forwarded-Port,
        // 2026-10-10) one request with `X-Forwarded-Port: 4443` was stored at the edge
        // and served to the next plain visitor with every stylesheet and script
        // pointing at :4443. This app serves its pages at the host the edge asked for,
        // so none of the three has a legitimate value to carry. See
        // docs/edge-html-cache.md.
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_PROTO,
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // Edge-cached pages are served without an XSRF-TOKEN cookie, so a stale
        // or missing token can 419. Redirecting back re-primes the session and,
        // for Inertia, replaces the raw error modal with a reload (the Inertia-
        // recommended handling; flash a shared `message` prop to surface it).
        $exceptions->respond(function (Response $response) {
            if ($response->getStatusCode() === 419) {
                return back()->with(['message' => 'The page expired, please try again.']);
            }

            return $response;
        });
    })->create();
