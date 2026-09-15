<?php

use App\Models\User;
use App\Services\BoundLocation;
use Illuminate\Support\MessageBag;
use Illuminate\Support\ViewErrorBag;

/*
 * The edge's bypass rule (deploy/cloudflare/rules.sh) sends every request carrying a
 * Laravel session cookie straight to origin. StartSession hands one out on every `web`
 * response, even when the session holds nothing but a CSRF token — so a guest who clicked
 * a single SPA link (an X-Inertia response, which is never granted a shared copy and
 * therefore keeps its Set-Cookie) dropped out of the edge cache for the rest of their
 * visit.
 *
 * DropEmptyGuestSession takes that cookie back off, unless the visitor genuinely has a
 * session: authenticated, holding flashed state, or explicitly priming CSRF for a form.
 */

$sessionCookie = fn () => (string) config('session.cookie');

test('a guest gets no session cookie from a page render', function () use ($sessionCookie) {
    $response = $this->get('/');

    $response->assertOk();
    $response->assertCookieMissing($sessionCookie());
    $response->assertCookieMissing('XSRF-TOKEN');
});

test('a guest gets no session cookie from an SPA navigation', function () use ($sessionCookie) {
    // X-Inertia responses are never edge-cacheable, so nothing strips their Set-Cookie —
    // this is the hole a single click used to fall through.
    $response = $this->get('/locations', ['X-Inertia' => 'true']);

    $response->assertCookieMissing($sessionCookie());
});

test('a guest with a bound store still gets no session cookie', function () use ($sessionCookie) {
    fakeTribe('vestavia-hills-al');

    $response = $this->withUnencryptedCookie(BoundLocation::COOKIE, 'vestavia-hills-al')->get('/');

    $response->assertOk();
    $response->assertCookieMissing($sessionCookie());
});

test('an authenticated user keeps their session cookie', function () use ($sessionCookie) {
    $response = $this->actingAs(User::factory()->create())->get('/');

    $response->assertOk();
    $response->assertCookieNotExpired($sessionCookie());
});

test('a visitor with flashed errors keeps their session cookie', function () use ($sessionCookie) {
    $errors = new ViewErrorBag();
    $errors->put('default', new MessageBag(['slug' => 'The slug field is required.']));

    $response = $this->withSession(['errors' => $errors])->get('/');

    $response->assertOk();
    $response->assertCookieNotExpired($sessionCookie());
});

test('priming CSRF is the explicit opt-in and keeps the session', function () use ($sessionCookie) {
    $response = $this->get('/csrf-cookie');

    $response->assertNoContent();
    $response->assertCookieNotExpired($sessionCookie());
    $response->assertCookieNotExpired('XSRF-TOKEN');
});
