<?php

namespace App\Http\Middleware;

use App\Enums\Locale;
use App\Services\BoundLocation;
use App\Services\CmsRoutes;
use App\Services\WebsitePages;
use Closure;
use GorillaDash\WebsiteSdk\TokenManager;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Middleware;
use Inertia\Support\Header;
use Symfony\Component\HttpFoundation\Response;

class HandleInertiaRequests extends Middleware
{
    /**
     * The request headers that select which props a response serializes.
     *
     * Inertia only sends `Vary: X-Inertia`, which separates the HTML document from the
     * SPA's JSON — but not one JSON body from another. Every header below is a GET-time
     * prop filter: two requests to the same URL, alike except for one of these, come back
     * with different props. To a cache that only varies on X-Inertia they are the same
     * entry, and whichever answered last is replayed for the rest.
     *
     * That is not hypothetical. `boundLocation` is an Inertia::defer() prop, so every page
     * load fires a partial reload of its own URL carrying X-Inertia-Partial-Data; its body
     * holds that one prop and nothing else. An edge rule once handed those responses a
     * year of `immutable`, and the browser served the deferred prop's body as the next
     * navigation's page props — pages mounted with no props at all.
     *
     * The rule is gone and Inertia responses are `no-cache, private` again, so nothing
     * stores them today. This header is what makes that a property of the response
     * rather than of one CDN's config.
     *
     * @var list<string>
     */
    private const VARY_HEADERS = [
        Header::INERTIA,
        Header::PARTIAL_COMPONENT,
        Header::PARTIAL_ONLY,
        Header::PARTIAL_EXCEPT,
        Header::RESET,
        Header::EXCEPT_ONCE_PROPS,
        Header::INFINITE_SCROLL_MERGE_INTENT,
    ];

    /**
     * Widen the `Vary` header the parent middleware sets to every prop-selecting header.
     *
     * Set after the parent, which unconditionally overwrites `Vary` with `X-Inertia`
     * alone. Applies to the HTML document too: that is the response a shared cache is
     * most likely to store, and it must not be confusable with any JSON body for the
     * same URL.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = parent::handle($request, $next);

        $response->headers->set('Vary', implode(', ', self::VARY_HEADERS));

        return $response;
    }

    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    public function __construct(
        private readonly TokenManager $tokenManager,
        private readonly BoundLocation $boundLocation,
        private readonly WebsitePages $websitePages,
        private readonly CmsRoutes $cmsRoutes,
    ) {
    }

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * On an asset-version mismatch, send the stale client to the same URL with a
     * `__fresh=<current-version>` cache-buster instead of the bare URL. Inertia
     * turns the 409 into a full navigation to it; the edge's bypass-debug rule
     * (deploy/cloudflare/rules.sh) sends any `__fresh` request straight to origin, so
     * the recovery reload can't be re-served the same stale cached HTML — which would
     * just re-trigger the 409. The marker is stripped from the address bar after boot
     * (see resources/ts/app.ts).
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function onVersionChange(Request $request, Response $response): Response
    {
        if ($request->hasSession()) {
            $request->session()->reflash();
        }

        return Inertia::location($this->freshReloadUrl($request));
    }

    /**
     * The current URL with a `__fresh=<version>` cache-buster, replacing any
     * marker already present so a rolling-deploy bounce can't stack the param.
     */
    private function freshReloadUrl(Request $request): string
    {
        $query = $request->query();
        unset($query['__fresh']);
        $query['__fresh'] = (string) $this->version($request);

        return $request->url().'?'.http_build_query($query);
    }

    /** `APP_URL` without a trailing slash, so paths join onto it cleanly. */
    private function siteUrl(): string
    {
        return rtrim((string) config('app.url'), '/');
    }

    /** The request path under this deployment's public origin, query string dropped. */
    private function canonicalUrl(Request $request): string
    {
        return $this->siteUrl().$request->getPathInfo();
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $locale = Locale::tryFrom(app()->getLocale()) ?? Locale::default();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            // The request's locale, resolved from the URL by SetLocale. Per-request,
            // so it lives here rather than in `config` below — the frontend's
            // runtimeConfig is module scope and shared across concurrent SSR renders,
            // which would race. Read it via usePage() (see @/composables/useLocale).
            // `value` is the Tolgee language tag, `code` the URL segment.
            'locale' => [
                'value' => $locale->value,
                'code' => $locale->code(),
            ],
            'auth' => [
                'user' => $request->user(),
            ],
            // The page's canonical URL, for `<link rel="canonical">` (SeoHead). Built
            // from APP_URL rather than the request host so a CDN or LB hostname never
            // leaks into it, and from the path alone so `?debug=1`, tracking params
            // and the like never split a page's ranking across URL variants. On a
            // multilingual deployment the request path already carries `/{locale}`
            // — the bare routes only ever redirect — so the prefixed URL is the
            // canonical one. Per-request, so it lives here rather than in `config`.
            'canonicalUrl' => $this->canonicalUrl($request),
            // GD GraphQL bearer token for the client-side Apollo client. Read on
            // the frontend via page.props (see resources/ts/app.ts) instead of a
            // window global. TokenManager caches the token (and throws when no
            // credentials are configured, so rescue() keeps it null in that case).
            'graphqlToken' => rescue(fn () => $this->tokenManager->getToken(), null, report: false),

            'graphqlURL' => config('website-sdk.base_uri'),
            // The bound store ("locked" location), resolved from the visitor's gd_store
            // cookie. Deferred: it is the one per-visitor thing on an otherwise identical
            // page, so keeping it out of the initial render is what lets the edge serve one
            // shared copy to everyone. Inertia fetches it right after mount, in a partial
            // reload the edge passes through. Null when nothing is bound.
            // See App\Services\BoundLocation and App\Http\Middleware\EdgeCacheGuestPage.
            'boundLocation' => Inertia::defer(
                fn () => rescue(fn () => $this->boundLocation->current(), null, report: false)
            ),
            // Where each CMS page lives, per locale: { en: { locations: '/stores', ... }, ... }.
            // The frontend builds every internal link from this instead of Wayfinder's
            // build-time URIs, so a CMS slug rename moves the links with the page. All
            // locales are carried (not just the request's) so the value is identical
            // across concurrent SSR renders and module scope may hold it — see
            // resources/ts/lib/pagePaths.ts. Not deferred: the nav needs it on first
            // paint. WebsitePages is total (falls back to the default map), no rescue.
            'pages' => $this->websitePages->pathsByLocale(),
            // The CMS-driven routes' URI templates: route name => uri + logical page
            // key. What lets the frontend build a sub-route URL by route NAME —
            // cmsRoute() in resources/ts/lib/pagePaths.ts — with `{page}` filled from
            // `pages` above at call time. Deployment-constant (the templates are the
            // route table's; only the {page} value is CMS data), so identical across
            // concurrent SSR renders and module scope may hold it.
            'cmsRoutes' => $this->cmsRoutes->templates(),
            // Per-country public frontend config, injected at runtime from this
            // deployment's config.env. Add new per-country frontend values here;
            // the frontend reads them from page.props.config (resources/ts/runtimeConfig),
            // so a single image serves every country and changes need no rebuild.
            'config' => [
                // The public origin, for the absolute URLs hreflang and JSON-LD need.
                'siteUrl' => $this->siteUrl(),
                'googleMapApiKey' => config('services.google_maps.key'),
                'googleMapId' => config('services.google_maps.map_id'),
                'orgId' => config('gorilladash.web.org_id'),
                'websiteId' => config('gorilladash.web.website_id'),
                'country' => config('gorilladash.web.country'),
                // Every locale this deployment serves. A deployment constant (unlike
                // `locale` above), so runtimeConfig may hold it. More than one entry
                // is what turns on URL prefixes and the language switcher.
                'locales' => Locale::options(),
                // The PUBLIC half of the reCAPTCHA pair. Its secret must never appear
                // here — see App\Services\Recaptcha. Null means no captcha.
                'recaptchaSiteKey' => config('services.recaptcha.site_key'),
                'tolgeeApiUrl' => config('services.tolgee.api_url'),
                'tolgeeApiKey' => config('services.tolgee.api_key'),
                'tolgeeCdnUrl' => config('services.tolgee.cdn_url'),
            ],
        ];
    }
}
