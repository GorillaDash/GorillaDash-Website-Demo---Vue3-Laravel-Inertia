<?php

use Inertia\Support\Header;

/*
 * Inertia sends `Vary: X-Inertia`, which tells a cache that the HTML document and the
 * SPA's JSON are different responses for one URL. It does not tell it that two JSON
 * bodies for that URL can differ too.
 *
 * They can. A partial reload — the mechanism Inertia::defer() uses to fetch
 * `boundLocation` after every mount — asks for a subset of props by sending
 * X-Inertia-Partial-Data, and gets back only those. Sharing a cache entry with the full
 * page response means the deferred prop's skinny body can be replayed as a page's props.
 *
 * So the response must name every header that selects what it serializes.
 */

beforeEach(function () {
    // A deterministic, non-null asset version, so an Inertia visit is answered rather
    // than 409'd into a version-skew reload. Mirrors InertiaVersionSkewTest.
    config(['app.asset_url' => 'https://cdn.example.test/build']);
    $this->version = hash('xxh128', 'https://cdn.example.test/build');
});

test('the full-page response and a partial reload of the same URL vary on the header that separates them', function () {
    $full = $this->get('/locations/vestavia-hills-al', [
        Header::INERTIA => 'true',
        Header::VERSION => $this->version,
    ]);

    $partial = $this->get('/locations/vestavia-hills-al', [
        Header::INERTIA => 'true',
        Header::VERSION => $this->version,
        Header::PARTIAL_COMPONENT => 'LocationDetail',
        Header::PARTIAL_ONLY => 'boundLocation',
    ]);

    // The two bodies genuinely differ: only the full response carries the page's own prop.
    expect($full->json('props'))->toHaveKey('slug')
        ->and($partial->json('props'))->not->toHaveKey('slug');

    // …so a cache must be told the request header that distinguishes them.
    foreach ([$full, $partial] as $response) {
        expect($response->headers->get('Vary'))->toContain(Header::PARTIAL_ONLY);
    }
});

/*
 * The HTML document is the response a shared cache is most likely to store, so it must
 * carry the same Vary — it must never be confusable with a JSON body for the same URL.
 */
test('every prop-selecting header is named in Vary, on JSON and on the HTML document alike', function (string $uri) {
    $expected = [
        Header::INERTIA,
        Header::PARTIAL_COMPONENT,
        Header::PARTIAL_ONLY,
        Header::PARTIAL_EXCEPT,
        Header::RESET,
        Header::EXCEPT_ONCE_PROPS,
        Header::INFINITE_SCROLL_MERGE_INTENT,
    ];

    $document = $this->get($uri);
    $json = $this->get($uri, [
        Header::INERTIA => 'true',
        Header::VERSION => $this->version,
    ]);

    foreach ([$document, $json] as $response) {
        $vary = $response->headers->get('Vary');

        foreach ($expected as $header) {
            expect($vary)->toContain($header);
        }
    }
})->with(['/', '/locations']);

/*
 * Widening Vary must not disturb the edge-cache grant: the HTML is still a shareable
 * anonymous render, and Cache-Control still keeps browsers from storing any of it.
 */
test('widening Vary leaves the edge grant and the browser-facing Cache-Control intact', function () {
    $this->get('/')
        ->assertOk()
        ->assertHeader('Cloudflare-CDN-Cache-Control', 'max-age=120')
        ->assertHeader('Cache-Control', 'no-cache, private');
});
