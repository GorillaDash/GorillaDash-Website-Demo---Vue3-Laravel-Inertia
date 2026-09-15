<?php

use Inertia\Testing\AssertableInertia;

/*
 * Page paths are CMS-driven: the routes' first segment is a `{page}` parameter
 * resolved per request against the GD `websitePages` list (routes/web.php,
 * App\Services\WebsitePages, WebsitePageController, EnsureWebsitePage). Renaming a
 * page's slug in the CMS moves the page and its sub-routes with no deploy; the
 * page's identity survives the rename through `vue_route_name`.
 */

describe('with the default CMS slugs', function () {
    beforeEach(fn () => fakeWebsitePages(['homepage' => null, 'locations' => null]));

    it('serves each page at its slug, passing the slug as a prop', function (string $uri, string $component, string $slug) {
        $this->get($uri)->assertOk()->assertInertia(
            fn (AssertableInertia $page) => $page
            ->component($component)
            ->where('slug', $slug)
        );
    })->with([
        'home' => ['/', 'Home', 'homepage'],
        'locations' => ['/locations', 'Locations', 'locations'],
    ]);

    it('404s a path the CMS has no page for', function () {
        $this->get('/catering')->assertNotFound();
    });

    it('404s the homepage slug as a path — the homepage canonically lives at /', function () {
        $this->get('/homepage')->assertNotFound();
    });

    it('shares the page-path map with the frontend, all locales included', function () {
        $this->get('/')->assertInertia(
            fn (AssertableInertia $page) => $page
            ->where('pages.en.homepage', '/')
            ->where('pages.en.locations', '/locations')
        );
    });

    // Exactly the keyed `page:` routes: no keyless {page} route (its segment IS the
    // lookup key — pagePath()'s job), no `home`, no locale.* duplicates.
    it('shares the sub-route URI templates, so the frontend builds their URLs by route name', function () {
        $this->get('/')->assertInertia(
            fn (AssertableInertia $page) => $page
            ->where('cmsRoutes', [
                'locations.show' => ['uri' => '/{page}/{slug}', 'page' => 'locations'],
                'menu.item' => ['uri' => '/{page}/{section}/{item}', 'page' => 'menu'],
                'ourWork.show' => ['uri' => '/{page}/{work}', 'page' => 'our-work'],
                'blog.show' => ['uri' => '/{page}/{article}', 'page' => 'blog'],
            ])
        );
    });
});

describe('after the CMS renames locations to stores', function () {
    // vue_route_name carries the page's identity once the slug no longer matches it.
    $renamed = ['homepage' => null, 'stores' => 'locations'];

    it('follows live on the top level; sub-routes carry the baked pattern until a reload', function () use ($renamed) {
        fakeWebsitePages($renamed);

        $this->get('/stores')->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->component('Locations'));

        // The accepted cost of baking (see WebsitePages::slugPattern + routes/web.php): the
        // renamed sub-routes 404 until the routes re-register.
        $this->get('/stores/vestavia-hills-al')->assertNotFound();
    });

    it('serves the page and its sub-routes under the new slug once the routes re-register', function (string $uri, string $component) use ($renamed) {
        fakeGraphql(['websitePages' => websitePagesData($renamed), 'tribe' => ['tribe' => ['name' => 'Vestavia Hills', 'slug' => 'vestavia-hills-al']]]);

        // What route:cache rebuild + reload does in production: the baked patterns
        // recompute with the fake (= renamed CMS) in place.
        registerRoutesWithLocales(['en-US']);

        $this->get($uri)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->component($component));
    })->with([
        'directory' => ['/stores', 'Locations'],
        'store detail' => ['/stores/vestavia-hills-al', 'LocationDetail'],
    ]);

    it('passes the RENAMED slug to the page, so the content fetch follows the CMS', function () use ($renamed) {
        fakeWebsitePages($renamed);

        $this->get('/stores')->assertInertia(
            fn (AssertableInertia $page) => $page
            ->component('Locations')
            ->where('slug', 'stores')
        );
    });

    it('404s the old path', function () use ($renamed) {
        fakeWebsitePages($renamed);

        $this->get('/locations')->assertNotFound();
        // The stale baked pattern still MATCHES the old slug; `page:locations` rejects it.
        $this->get('/locations/vestavia-hills-al')->assertNotFound();
    });

    it('keeps the purge keys the rename-proof logical names', function () use ($renamed) {
        fakeGraphql(['websitePages' => websitePagesData($renamed), 'tribe' => ['tribe' => ['name' => 'Vestavia Hills', 'slug' => 'vestavia-hills-al']]]);
        registerRoutesWithLocales(['en-US']);

        $this->get('/stores')->assertHeader('Cache-Tag', 'html,locations');
        $this->get('/stores/vestavia-hills-al')
            ->assertHeader('Cache-Tag', 'html,locations.show,locations.show:vestavia-hills-al');
    });

    it('shares the renamed path with the frontend link builders', function () use ($renamed) {
        fakeWebsitePages($renamed);

        $this->get('/stores')->assertInertia(
            fn (AssertableInertia $page) => $page
            ->where('pages.en.locations', '/stores')
        );
    });
});

/*
 * A sub-route belongs to exactly ONE logical page. Another CMS page must not be able
 * to serve it just because `{page}` would match the segment — and TWO gates enforce
 * that, in this order:
 *
 *  1. the baked allowlist (`->where('page', $locationsPattern)`), which is what the
 *     ROUTER matches on, before any middleware runs. A two-segment URL under another
 *     page matches no route at all. This is the gate a same-shape sub-route for a
 *     second page depends on — `page:` could never separate them, because Laravel
 *     picks one route and 404s, it does not fall through to the next candidate.
 *  2. the keyed `page:locations` middleware, the per-request guard: it 404s a locale
 *     mismatch and, after an un-reloaded CMS rename, the now-stale baked slugs.
 *
 * Both break first when a new sub-route is added wrong — the allowlist when it reuses
 * $pagePattern, the middleware when the key is missing. See the `add-cms-route` skill.
 *
 * (In this suite the baked patterns are FALLBACK's slugs: the boot registration runs
 * before any fake, and phpunit.xml points the SDK at an unreachable URI.
 * registerRoutesWithLocales() re-registers with a fake in place.)
 */
describe('sub-route ownership', function () {
    // `catering` is a CMS page with no COMPONENTS entry — enough to prove the
    // segment exists in the CMS, so a 404 below is ownership and not "no such page".
    beforeEach(fn () => fakeWebsitePages(['homepage' => null, 'locations' => null, 'catering' => null]));

    it('404s a locations sub-route under another CMS page', function () {
        $this->get('/catering/vestavia-hills-al')->assertNotFound();
    });

    it('404s a sub-route depth the routes do not define', function () {
        $this->get('/locations/alabama/vestavia-hills-al')->assertNotFound();
    });
});

describe('when the CMS cannot be read', function () {
    it('serves the default paths — an outage degrades, it does not 404 the site', function () {
        fakeGraphql(['websitePages' => fn () => throw new RuntimeException('GD is down')]);

        $this->get('/')->assertOk();
        $this->get('/locations')->assertOk();
    });

    it('treats an empty page list as a misconfiguration and falls back too', function () {
        fakeWebsitePages([]);

        $this->get('/locations')->assertOk();
    });
});

describe('reserved paths', function () {
    it('never swallows the health check or the CSRF prime', function () {
        fakeWebsitePages(['up' => null, 'csrf-cookie' => null]);

        // Even if the CMS declared pages at these slugs, the routes must not claim them.
        $this->get('/up')->assertOk();
        $this->get('/csrf-cookie')->assertNoContent();
    });
});

/*
 * Per-locale slugs: the same logical page may live at a different slug per locale.
 * The route table is rebuilt multilingual exactly as LocaleRoutingTest does, and the
 * page map is faked per the `locale` variable the service passes through.
 */
describe('on a multilingual deployment with per-locale slugs', function () {
    beforeEach(function () {
        registerRoutesWithLocales(['en-US', 'ar-EG']);

        fakeWebsitePages(fn (array $variables) => websitePagesData(match ($variables['locale']) {
            'ar-EG' => ['homepage' => null, 'almataajir' => 'locations'],
            default => ['homepage' => null, 'locations' => null],
        }));
    });

    it('serves each locale at its own slug', function () {
        $this->get('/en/locations')->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->component('Locations'));
        $this->get('/ar/almataajir')->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->component('Locations'));
    });

    it("404s one locale's slug under another locale", function () {
        $this->get('/ar/locations')->assertNotFound();
        $this->get('/en/almataajir')->assertNotFound();
    });

    it('redirects a bare canonical URL that resolves in the default locale', function () {
        $this->get('/locations')->assertRedirect('/en/locations');
    });

    it('404s a bare URL that resolves to nothing — no redirect hop into a 404', function () {
        $this->get('/nope')->assertNotFound();
        $this->get('/de/locations')->assertNotFound();
    });

    it('shares both locales’ paths, so the language switcher can map slugs', function () {
        $this->get('/en/locations')->assertInertia(
            fn (AssertableInertia $page) => $page
            ->where('pages.en.locations', '/locations')
            ->where('pages.ar.locations', '/almataajir')
        );
    });

    it('purges every language of a page with one key', function () {
        $this->get('/en/locations')->assertHeader('Cache-Tag', 'html,locations');
        $this->get('/ar/almataajir')->assertHeader('Cache-Tag', 'html,locations');
    });

    // Templates stay locale-free, like every path the frontend builds: the locale.*
    // route duplicates must not add names or leak a {locale} segment into a URI.
    it('shares the same canonical route templates as a monolingual deployment', function () {
        $this->get('/en/locations')->assertInertia(
            fn (AssertableInertia $page) => $page
            ->where('cmsRoutes', [
                'locations.show' => ['uri' => '/{page}/{slug}', 'page' => 'locations'],
                'menu.item' => ['uri' => '/{page}/{section}/{item}', 'page' => 'menu'],
                'ourWork.show' => ['uri' => '/{page}/{work}', 'page' => 'our-work'],
                'blog.show' => ['uri' => '/{page}/{article}', 'page' => 'blog'],
            ])
        );
    });
});
