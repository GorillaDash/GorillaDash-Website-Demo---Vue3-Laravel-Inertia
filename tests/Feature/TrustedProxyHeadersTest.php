<?php

use Illuminate\Support\Facades\Route;

/*
 * Every proxy is trusted (`at: '*'`), so which X-Forwarded-* HEADERS are trusted is
 * the whole of the policy. The edge and the load balancer pass a visitor's own
 * X-Forwarded-Host / -Port / -Prefix through untouched, and all three feed the root
 * URL that absolute URLs — the Vite asset tags included — are built from. On
 * GrazeCraze staging, whose edge cache key does not carry X-Forwarded-Port, one
 * request stored a page whose assets all pointed at :4443 and the edge served it to
 * the next plain visitor (2026-10-10). See bootstrap/app.php.
 */

beforeEach(function () {
    // Under `up/`, a reserved first segment (the health check's) with nothing beneath
    // it: anywhere else the CMS `{page}` routes, registered first, could claim the path.
    Route::get('/up/__proxy-probe', fn () => [
        'url' => url('/build/assets/app.css'),
        'ip' => request()->ip(),
    ]);
});

/** A request as the load balancer hands it to the pod: from a private address. */
function viaProxy(array $headers): array
{
    return test()
        ->withServerVariables(['REMOTE_ADDR' => '10.8.0.1'])
        ->get('/up/__proxy-probe', $headers)
        ->assertOk()
        ->json();
}

test('the client IP still comes from X-Forwarded-For', function () {
    expect(viaProxy(['X-Forwarded-For' => '203.0.113.7'])['ip'])->toBe('203.0.113.7');
});

test('a forwarded header a visitor can set does not move the URLs the page is built from', function (string $header, string $value) {
    $plain = viaProxy([])['url'];

    expect(viaProxy([$header => $value])['url'])
        ->toBe($plain)
        ->not->toContain($value);
})->with([
    'host' => ['X-Forwarded-Host', 'attacker.example'],
    'port' => ['X-Forwarded-Port', '4443'],
    'prefix' => ['X-Forwarded-Prefix', '/injected-prefix'],
]);
