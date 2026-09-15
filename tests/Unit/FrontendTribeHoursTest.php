<?php

use Symfony\Component\Process\Process;

/*
 * resources/ts/services/tribeHoursService.ts turns a tribe's opening hours into the
 * "Open until 4pm" badge and the weekly hours table. Gorilla Dash answers those hours
 * in the tribe's display format ("6:30 am"), so string comparison is wrong unless the
 * times are normalised first.
 *
 * The behavior suite is plain node:assert checks in tests/js/tribeHours.test.ts,
 * executed through the repo's own tsx binary, the same pattern as
 * FrontendCmsDateTest. A composer-only checkout skips rather than fails.
 */

it('passes the frontend tribe opening hours behavior suite (tests/js/tribeHours.test.ts)', function () {
    $root = dirname(__DIR__, 2);
    $tsx = $root.'/node_modules/.bin/tsx';

    if (! is_file($tsx)) {
        $this->markTestSkipped('node_modules not installed — run pnpm install to enable this suite');
    }

    $process = new Process([$tsx, $root.'/tests/js/tribeHours.test.ts'], $root);
    $process->run();

    if (! $process->isSuccessful()) {
        $this->fail("tsx behavior suite failed:\n".$process->getOutput().$process->getErrorOutput());
    }

    expect($process->isSuccessful())->toBeTrue();
});
