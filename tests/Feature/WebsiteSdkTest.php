<?php

use GorillaDash\WebsiteSdk\Facades\GorillaDash;
use GorillaDash\WebsiteSdk\TokenManager;
use GorillaDash\WebsiteSdk\WebsiteClient;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia;
use Mockery\MockInterface;

/*
 * What this site takes from gorilladash/laravel-website-sdk beyond server reads: the
 * routes the package registers (config/website-sdk.php) and the token the browser's
 * Apollo client is given.
 *
 * The browser sends its queries AND its mutations (enquiries, cart, bookings) straight
 * to Gorilla Dash with the `graphqlToken` prop. The read-only browser token cannot run
 * a mutation, so the prop stays the website token until those move server-side.
 */

test('the package GraphQL proxy is not registered', function () {
    expect(Route::has('gd-website.graphql'))->toBeFalse();

    $this->postJson('/graphql', ['query' => '{ __typename }'])->assertNotFound();
});

test('the cache-clear webhook flushes on the website public key only', function () {
    config(['website-sdk.public_key' => 'public-key']);

    expect(Route::has('gd-website.clear-cache'))->toBeTrue();

    $this->get('/gorilla-dash/clear-cache?key=public-key')->assertOk()->assertExactJson(['cleared' => true]);
    $this->get('/gorilla-dash/clear-cache?key=wrong-key')->assertNotFound();
});

test('graphqlToken is the website token, on the page and on the refresh the browser asks for', function () {
    fakeWebsitePages(['homepage' => null]);

    $this->mock(TokenManager::class, function (MockInterface $tokenManager) {
        $tokenManager->shouldReceive('getToken')->andReturn('website-token');
        $tokenManager->shouldNotReceive('getBrowserToken');
    });

    $this->get('/')->assertInertia(
        fn (AssertableInertia $page) => $page->component('Home')->where('graphqlToken', 'website-token')
    );

    partialReload('graphqlToken', 'Home')
        ->assertOk()
        ->assertJsonPath('props.graphqlToken', 'website-token');
});

/*
 * Gorilla Dash answers a revoked or expired website token on /graphql with a 404, not
 * a 401. The first server read that meets it mints a new token into the same cache
 * entry the TokenManager bound in AppServiceProvider reads, so the browser's next
 * `graphqlToken` refresh is handed the new token rather than the refused one.
 */
test('a website token refused with a 404 is replaced, and the browser refresh is handed the new one', function () {
    config(['website-sdk.client_id' => 'client-id', 'website-sdk.client_secret' => 'client-secret']);
    app()->forgetInstance(WebsiteClient::class);
    GorillaDash::clearResolvedInstances();

    Http::fake([
        '*/oauth/token' => Http::sequence()
            ->push(['access_token' => 'refused-token', 'expires_in' => 3600])
            ->push(['access_token' => 'new-token', 'expires_in' => 3600]),
        '*/graphql' => fn (Request $request) => $request->hasHeader('Authorization', 'Bearer new-token')
            ? Http::response(['data' => ['websitePages' => []]])
            : Http::response('', 404),
    ]);

    expect(app(TokenManager::class)->getToken())->toBe('refused-token');

    expect(GorillaDash::graphqlWithMeta('{ websitePages { slug } }')['data'])->toBe(['websitePages' => []]);

    partialReload('graphqlToken', 'Home')
        ->assertOk()
        ->assertJsonPath('props.graphqlToken', 'new-token');

    $mints = Http::recorded(fn (Request $request) => str_ends_with($request->url(), '/oauth/token'));

    expect($mints)->toHaveCount(2);
});
