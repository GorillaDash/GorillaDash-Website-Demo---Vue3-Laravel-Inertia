<?php

use Symfony\Component\Process\Process;

/*
 * The frontend path layer (resources/ts/lib/pagePaths.ts — cmsRoute, matchCmsRoute,
 * pagePath, the fallbacks) is pure TypeScript with real logic: template filling,
 * reverse matching in route-registration order, locale-prefix detection. This repo
 * has no JS test runner, so its behavior suite is plain node:assert checks in
 * tests/js/pagePaths.test.ts, executed here through the repo's own tsx binary —
 * `composer test` and every CI matrix job go red when the path logic regresses.
 *
 * CI installs node_modules before Pest runs (Build Assets precedes Tests); a
 * composer-only checkout skips rather than fails.
 */

it('passes the frontend path-layer behavior suite (tests/js/pagePaths.test.ts)', function () {
    $root = dirname(__DIR__, 2);
    $tsx = $root.'/node_modules/.bin/tsx';

    if (! is_file($tsx)) {
        $this->markTestSkipped('node_modules not installed — run pnpm install to enable this suite');
    }

    // pagePaths.ts imports the generated module at runtime; a checkout that has
    // never built is missing it (gitignored), so generate before running.
    if (! is_file($root.'/resources/ts/types/cmsRoutes.ts')) {
        (new Process([PHP_BINARY, 'artisan', 'cms-routes:types'], $root))->run();
    }

    $process = new Process([$tsx, $root.'/tests/js/pagePaths.test.ts'], $root);
    $process->run();

    if (! $process->isSuccessful()) {
        $this->fail("tsx behavior suite failed:\n".$process->getOutput().$process->getErrorOutput());
    }

    expect($process->isSuccessful())->toBeTrue();
});
