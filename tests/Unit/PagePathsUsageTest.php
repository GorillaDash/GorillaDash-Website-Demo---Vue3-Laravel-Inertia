<?php

/*
 * The locations routes' first URL segment is CMS-driven (routes/web.php): the
 * CMS decides what path each page lives at, per locale. Wayfinder bakes URIs into
 * the bundle at build time, so its generated helpers for these routes would emit
 * whatever slug existed when the image was built — wrong after any CMS rename, and
 * built without CMS access in the first place (the Docker builder runs against a
 * throwaway .env).
 *
 * Links to these pages must come from the runtime page-path map instead:
 * usePagePaths() (@/composables/usePagePaths) inside components, or the pure
 * @/lib/pagePaths functions in detached ones. Wayfinder stays correct — and in
 * use — for genuinely static routes. (tsFilesMatching: tests/Pest.php.)
 */

it('builds CMS page links from the runtime page-path map, never from Wayfinder', function () {
    $importsDynamicRouteHelpers = "/from\s*'@\/routes\/(locations)/";

    expect(tsFilesMatching($importsDynamicRouteHelpers))->toBe([]);
});
