<?php

/*
 * Inertia's `usePage()` reads a module-level ref (@inertiajs/vue3), and its SSR server
 * — a plain http.createServer(async …) — does not serialize requests. Every page in this
 * app awaits inside its render (useQuery's onServerPrefetch hits GraphQL), and during
 * that await a concurrent request's App setup overwrites the module ref. The first
 * request then finishes rendering with the second one's props.
 *
 * Measured before the fix: ~50% of anonymous homepage renders contained a concurrent
 * visitor's locked store, in HTML that EdgeCacheGuestPage had (correctly, from PHP's
 * point of view) granted to the edge as the shared anonymous copy.
 *
 * @/composables/useSharedProps is the only safe reader: it takes the app-scoped
 * per-request snapshot under SSR, and the live page in the browser. This test keeps
 * `usePage()` from creeping back in anywhere else. (tsFilesMatching: tests/Pest.php.)
 */

it('reads Inertia page props only through useSharedProps', function () {
    $importsUsePage = "/import\s*\{[^}]*\busePage\b[^}]*\}\s*from\s*'@inertiajs\/vue3'/";

    expect(tsFilesMatching($importsUsePage))->toBe(['composables/useSharedProps.ts']);
});

/*
 * Inertia installs a `$page` global as a getter over the same module-level ref, so a
 * template reading it evaluates during that component's render — after this request's
 * awaits — and can pick up a concurrent request's user. Its type declaration is removed
 * from types/global.d.ts so vue-tsc rejects the usage; these two keep it that way.
 * (global.d.ts itself is excluded from the usage scan: it explains the ban.)
 */
it('never reaches for the Inertia page global', function () {
    $offenders = array_values(array_diff(tsFilesMatching('/\$page\b/'), ['types/global.d.ts']));

    expect($offenders)->toBe([]);
});

it('does not re-declare the Inertia page global on Vue components', function () {
    expect(tsFilesMatching('/^\s*\$page\s*:/m'))->toBe([]);
});
