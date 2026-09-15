<?php

use Symfony\Component\Process\Process;

/*
 * resources/ts/lib/dates.ts formats a GD CMS timestamp as a CALENDAR date, which has
 * to survive being rendered twice in different timezones — once by SSR in the server's
 * zone, once by hydration in the viewer's. Getting that wrong is not a wrong-looking
 * date, it is a Vue hydration mismatch.
 *
 * This repo has no JS test runner, so the behavior suite is plain node:assert checks in
 * tests/js/cmsDate.test.ts, executed here through the repo's own tsx binary — the same
 * pattern as FrontendPagePathsTest, so `composer test` and every CI matrix job go red
 * when it regresses.
 *
 * CI installs node_modules before Pest runs (Build Assets precedes Tests); a
 * composer-only checkout skips rather than fails.
 */

it('passes the frontend CMS-date behavior suite (tests/js/cmsDate.test.ts)', function () {
    $root = dirname(__DIR__, 2);
    $tsx = $root.'/node_modules/.bin/tsx';

    if (! is_file($tsx)) {
        $this->markTestSkipped('node_modules not installed — run pnpm install to enable this suite');
    }

    $process = new Process([$tsx, $root.'/tests/js/cmsDate.test.ts'], $root);
    $process->run();

    if (! $process->isSuccessful()) {
        $this->fail("tsx behavior suite failed:\n".$process->getOutput().$process->getErrorOutput());
    }

    expect($process->isSuccessful())->toBeTrue();
});
