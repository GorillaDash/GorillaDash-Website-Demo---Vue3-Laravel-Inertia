<?php

use App\Models\User;
use App\Services\BoundLocation;
use Illuminate\Support\MessageBag;
use Illuminate\Support\ViewErrorBag;

/*
 * EdgeCacheGuestPage grants the CDN edge a shared copy of a public page — but only
 * when the render is provably identical for every visitor: an anonymous, unbound,
 * flash-free, full-document 200. Everything else must stay per-request. The grant
 * rides on the headers EdgeCacheGrant emits (consumed by the edge, never reaching
 * browsers); Cache-Control stays no-cache/private throughout.
 *
 * Withholding the grant is only HALF the protection on Cloudflare, which ignores
 * `Vary` outside Accept-Encoding: the bypass rules in deploy/cloudflare/rules.sh are
 * what actually keep a personalized response out of the shared cache. These pin the
 * origin's half of that contract.
 */

test('an anonymous, unbound page render grants the edge a shared copy', function () {
    $response = $this->get('/');

    $response->assertOk();
    $response->assertHeader('Cloudflare-CDN-Cache-Control', 'max-age=120');
    $response->assertHeader('Cache-Tag', 'html,home');
    $response->assertHeader('Cache-Control', 'no-cache, private');
});

/*
 * Every URL of a route used to share one purge key, so publishing a single store dropped
 * every store's page from the cache and sent them all back to origin to re-render. The
 * keys widen from the specific to the general, and a purge picks its blast radius.
 */
test('a page is purgeable by route and by each of its parameters', function (string $uri, string $keys) {
    fakeTribe('vestavia-hills-al');

    $this->get($uri)->assertHeader('Cache-Tag', $keys);
})->with([
    'no parameters' => ['/locations', 'html,locations'],
    'one parameter' => [
        '/locations/vestavia-hills-al',
        'html,locations.show,locations.show:vestavia-hills-al',
    ],
]);

test('a parameter that cannot be a cache-key token is dropped, not escaped', function () {
    // Whitespace would be dropped by Cloudflare at storage time — silently, so the page
    // would cache under fewer tags than intended and the purge meant to clear it would
    // do nothing. The route-name key still covers this page.
    fakeTribe('new york');

    $this->get('/locations/new%20york')
        ->assertOk()
        ->assertHeader('Cache-Tag', 'html,locations.show');
});

/*
 * The bound store is a deferred prop, so it never reaches the HTML — a visitor who has
 * locked one gets the same shared copy as everyone else, and fills their store in with a
 * partial reload after mount. Before this, locking a store cost them the edge cache on
 * every page for the rest of the visit; the grant below is the whole point of that work.
 */
test('a visitor with a bound store still gets the shared, cacheable copy', function () {
    fakeTribe('vestavia-hills-al');

    $response = $this->withUnencryptedCookie(BoundLocation::COOKIE, 'vestavia-hills-al')->get('/');

    $response->assertOk();
    $response->assertHeader('Cloudflare-CDN-Cache-Control', 'max-age=120');
    $response->assertDontSee('Vestavia Hills', escape: false);
});

test('an authenticated user gets a per-request render', function () {
    $response = $this->actingAs(User::factory()->create())->get('/');

    $response->assertOk();
    $response->assertHeaderMissing('Cloudflare-CDN-Cache-Control');
});

test('an Inertia (XHR) response is never granted to the edge', function () {
    $response = $this->get('/', ['X-Inertia' => 'true']);

    $response->assertHeaderMissing('Cloudflare-CDN-Cache-Control');
});

test('a 404 is not granted to the edge', function () {
    fakeTribe(null);

    $response = $this->get('/locations/does-not-exist');

    $response->assertNotFound();
    $response->assertHeaderMissing('Cloudflare-CDN-Cache-Control');
});

test('?debug=1 bypasses the grant — the cache-bypass switch', function () {
    $response = $this->get('/?debug=1');

    $response->assertOk();
    $response->assertHeaderMissing('Cloudflare-CDN-Cache-Control');
});

test('a render with flashed validation errors is not granted to the edge', function () {
    $errors = (new ViewErrorBag())->put('default', new MessageBag(['email' => ['Required.']]));

    $response = $this->withSession(['errors' => $errors])->get('/');

    $response->assertOk();
    $response->assertHeaderMissing('Cloudflare-CDN-Cache-Control');
});

test('the csrf-cookie prime responds 204 with the XSRF cookie, ungranted', function () {
    $response = $this->get('/csrf-cookie');

    $response->assertNoContent();
    $response->assertCookie('XSRF-TOKEN');
    $response->assertHeaderMissing('Cloudflare-CDN-Cache-Control');
});
