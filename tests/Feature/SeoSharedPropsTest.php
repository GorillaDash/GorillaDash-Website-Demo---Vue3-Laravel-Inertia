<?php

use Inertia\Testing\AssertableInertia;

/*
 * SeoHead renders `<link rel="canonical">` and the hreflang alternates from two
 * shared props (HandleInertiaRequests::share): the per-request `canonicalUrl` and
 * the deployment constant `config.siteUrl`. Both come from APP_URL, never from the
 * request's Host — the origin sits behind Cloudflare / a GCE LB and the host it sees
 * is not the public one.
 *
 * Each test installs its own graphql fake rather than sharing one from beforeEach:
 * the fakes are unlimited-call Mockery expectations, so the first one registered
 * answers every query and a second call is dead (see tests/Pest.php).
 */

beforeEach(function () {
    config(['app.url' => 'https://www.example.test/']);
});

/** The CMS page map every test below resolves its routes against. */
function fakeSeoPages(): void
{
    fakeWebsitePages(['homepage' => null, 'locations' => null]);
}

it('shares the deployment origin without a trailing slash', function () {
    fakeSeoPages();

    $this->get('/')->assertInertia(
        fn (AssertableInertia $page) => $page->where('config.siteUrl', 'https://www.example.test')
    );
});

it('shares each page\'s canonical URL under that origin', function (string $uri, string $canonical) {
    fakeSeoPages();

    $this->get($uri)->assertInertia(
        fn (AssertableInertia $page) => $page->where('canonicalUrl', $canonical)
    );
})->with([
    'home' => ['/', 'https://www.example.test/'],
    'a page' => ['/locations', 'https://www.example.test/locations'],
]);

it('shares the canonical URL of a sub-route', function () {
    fakeTribe('vestavia-hills-al');

    $this->get('/locations/vestavia-hills-al')->assertInertia(
        fn (AssertableInertia $page) => $page
            ->component('LocationDetail')
            ->where('canonicalUrl', 'https://www.example.test/locations/vestavia-hills-al')
    );
});

/*
 * `?debug=1`, UTM tags and a bound store's `?gclid=` all serve the same page; the
 * canonical must name one URL for all of them or the ranking splits between variants.
 */
it('drops the query string from the canonical URL', function () {
    fakeSeoPages();

    $this->get('/locations?utm_source=x&debug=1')->assertInertia(
        fn (AssertableInertia $page) => $page->where('canonicalUrl', 'https://www.example.test/locations')
    );
});

it('ignores the request host in favour of APP_URL', function () {
    fakeSeoPages();

    $this->get('http://origin.internal/locations')->assertInertia(
        fn (AssertableInertia $page) => $page->where('canonicalUrl', 'https://www.example.test/locations')
    );
});

/*
 * On a multilingual deployment the bare `/locations` only redirects
 * (RedirectToDefaultLocale); the page is served at `/{locale}/locations`, so that is
 * the URL it must claim as canonical.
 */
it('keeps the locale prefix a multilingual deployment serves the page under', function () {
    registerRoutesWithLocales(['en-US', 'ja-JP']);
    fakeSeoPages();

    $this->get('/jp/locations')->assertInertia(
        fn (AssertableInertia $page) => $page->where('canonicalUrl', 'https://www.example.test/jp/locations')
    );

    $this->get('/en')->assertInertia(
        fn (AssertableInertia $page) => $page->where('canonicalUrl', 'https://www.example.test/en')
    );
});
