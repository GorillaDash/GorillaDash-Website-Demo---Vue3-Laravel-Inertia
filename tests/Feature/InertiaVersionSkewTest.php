<?php

/*
 * Asset-version skew recovery. When a client's page carries an older asset
 * version than the origin (e.g. an edge-cached page served across a deploy), an
 * Inertia GET 409s. HandleInertiaRequests::onVersionChange sends the client to
 * the same URL with a `__fresh=<current-version>` cache-buster so the edge
 * passes the recovery reload to origin instead of re-serving the same stale
 * HTML (which would just re-trigger the 409). See the bypass-debug rule in
 * deploy/cloudflare/rules.sh.
 */

beforeEach(function () {
    // A deterministic, non-null asset version regardless of a built manifest:
    // parent::version() hashes app.asset_url before looking at the manifest.
    config(['app.asset_url' => 'https://cdn.example.test/build']);
    $this->version = hash('xxh128', 'https://cdn.example.test/build');
});

test('a stale Inertia visit 409s to a __fresh cache-busting URL', function () {
    $response = $this->get('/', [
        'X-Inertia' => 'true',
        'X-Inertia-Version' => 'stale-version',
    ]);

    $response->assertStatus(409);
    expect($response->headers->get('X-Inertia-Location'))
        ->toContain('__fresh='.$this->version);
});

test('a matching-version Inertia visit is served normally, no redirect', function () {
    $response = $this->get('/', [
        'X-Inertia' => 'true',
        'X-Inertia-Version' => $this->version,
    ]);

    $response->assertOk();
    $response->assertHeaderMissing('X-Inertia-Location');
});

test('a full-page (non-Inertia) load never 409s, even on a stale version', function () {
    // Without an X-Inertia header the middleware skips the version check entirely,
    // so the initial document load always boots whatever version it is served —
    // only a subsequent SPA navigation can 409.
    $response = $this->get('/', ['X-Inertia-Version' => 'stale-version']);

    $response->assertOk();
    $response->assertHeaderMissing('X-Inertia-Location');
});

test('an existing __fresh marker is replaced, not stacked, on a rolling-deploy bounce', function () {
    $response = $this->get('/?__fresh=older-hash&foo=bar', [
        'X-Inertia' => 'true',
        'X-Inertia-Version' => 'stale-version',
    ]);

    $response->assertStatus(409);

    expect($response->headers->get('X-Inertia-Location'))
        ->toContain('__fresh='.$this->version)
        ->toContain('foo=bar')
        ->not->toContain('older-hash');
});
