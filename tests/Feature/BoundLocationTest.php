<?php

use App\Services\BoundLocation;
use Inertia\Testing\AssertableInertia;

/*
 * The bound ("locked") store lives in the `gd_store` cookie, which the browser writes
 * itself (see resources/ts/lib/boundLocation.ts). There is no endpoint: the page GETs
 * stay pure reads.
 *
 * It is also a DEFERRED prop, so it never appears in the rendered HTML — that is what
 * lets the edge serve one shared copy of every page to every visitor, bound or not (see
 * EdgeCacheGuestPageTest). Inertia fetches it right after mount, in a partial reload the
 * edge passes through to origin. Tests must therefore ask for it explicitly.
 *
 * It used to live in the Laravel session, reached through POST/DELETE beacons whose CSRF
 * prime handed the visitor a session cookie — and the edge sends every request carrying
 * one straight to origin, on every page, for the rest of the visit.
 */

test('the bound store is absent from the initial render', function () {
    fakeTribe('vestavia-hills-al');

    $response = $this->withUnencryptedCookie(BoundLocation::COOKIE, 'vestavia-hills-al')->get('/');

    $response->assertOk();
    $response->assertInertia(
        fn (AssertableInertia $page) => $page
            ->component('Home')
            ->missing('boundLocation')
    );
});

test('the bound store is resolved from the cookie on the deferred fetch', function () {
    fakeTribe('vestavia-hills-al');

    $this->withUnencryptedCookie(BoundLocation::COOKIE, 'vestavia-hills-al');

    partialReload('boundLocation', 'Home')
        ->assertOk()
        ->assertJsonPath('props.boundLocation.slug', 'vestavia-hills-al')
        ->assertJsonPath('props.boundLocation.name', 'Vestavia Hills')
        ->assertJsonPath('props.boundLocation.phone', '(205) 555-0100');
});

test('with no cookie, the deferred prop resolves to null', function () {
    partialReload('boundLocation', 'Home')
        ->assertOk()
        ->assertJsonPath('props.boundLocation', null);
});

test('a cookie naming no store resolves to null rather than failing', function () {
    fakeTribe(null);

    $this->withUnencryptedCookie(BoundLocation::COOKIE, 'does-not-exist');

    partialReload('boundLocation', 'Home')
        ->assertOk()
        ->assertJsonPath('props.boundLocation', null);
});

/*
 * The cookie is browser-written, so it is excluded from EncryptCookies and arrives
 * verbatim. Anything that isn't a plausible slug is rejected before it reaches the API:
 * a tampered value should cost a null render, not a GraphQL round trip on junk.
 */
test('a cookie that is not a plausible slug is ignored', function (string $value) {
    fakeTribe('vestavia-hills-al');

    $this->withUnencryptedCookie(BoundLocation::COOKIE, $value);

    partialReload('boundLocation', 'Home')
        ->assertOk()
        ->assertJsonPath('props.boundLocation', null);
})->with([
    'empty' => '',
    'uppercase' => 'Vestavia-Hills-AL',
    'path traversal' => '../admin',
    'query injection' => 'a") { __typename } #',
    'leading hyphen' => '-vestavia',
    'too long' => 'a-'.str_repeat('x', 130),
]);

test('the bound store is reachable from every page, not just the one that set it', function () {
    fakeTribe('vestavia-hills-al');

    $this->withUnencryptedCookie(BoundLocation::COOKIE, 'vestavia-hills-al');

    partialReload('boundLocation', 'Locations', '/locations')
        ->assertOk()
        ->assertJsonPath('props.boundLocation.slug', 'vestavia-hills-al');
});

test('a location detail page is a pure read — it binds nothing server-side', function () {
    fakeTribe('vestavia-hills-al');

    $response = $this->get('/locations/vestavia-hills-al');

    $response->assertOk();
    $response->assertCookieMissing(BoundLocation::COOKIE);
    $response->assertInertia(
        fn (AssertableInertia $page) => $page
            ->component('LocationDetail')
            ->where('slug', 'vestavia-hills-al')
            ->missing('boundLocation')
    );
});

test('a slug with no matching store 404s', function () {
    fakeTribe(null);

    $this->get('/locations/does-not-exist')->assertNotFound();
});

test('the locations index leaves the cookie alone (the browser clears it)', function () {
    fakeTribe('vestavia-hills-al');

    $response = $this->withUnencryptedCookie(BoundLocation::COOKIE, 'vestavia-hills-al')->get('/locations');

    $response->assertOk();
    $response->assertCookieMissing(BoundLocation::COOKIE);
    $response->assertInertia(fn (AssertableInertia $page) => $page->component('Locations'));
});

test('the beacon endpoints the cookie replaced are gone', function () {
    // 405, not 404: the URI shape now matches the GET-only `{page}` route
    // (routes/web.php), so the router answers method-not-allowed. Either way,
    // nothing serves these writes anymore.
    $this->post('/bound-location', ['slug' => 'vestavia-hills-al'])->assertMethodNotAllowed();
    $this->delete('/bound-location')->assertMethodNotAllowed();
});
