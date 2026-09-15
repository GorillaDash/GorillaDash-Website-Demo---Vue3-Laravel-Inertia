<?php

use Symfony\Component\Process\Process;

/*
 * The SEO helpers (resources/ts/lib/seo.ts — absolute URLs, hreflang alternates and
 * the JSON-LD serialisation behind SeoHead) are pure TypeScript with real logic and
 * no Vue in them. This repo has no JS test runner, so their behaviour suite is plain
 * node:assert checks in tests/js/seo.test.ts, executed here through the repo's own
 * tsx binary — the same arrangement as FrontendPagePathsTest — so `composer test`
 * and CI go red when a helper regresses.
 *
 * CI installs node_modules before Pest runs (Build Assets precedes Tests); a
 * composer-only checkout skips rather than fails.
 */

it('passes the frontend SEO helper behavior suite (tests/js/seo.test.ts)', function () {
    $root = dirname(__DIR__, 2);
    $tsx = $root.'/node_modules/.bin/tsx';

    if (! is_file($tsx)) {
        $this->markTestSkipped('node_modules not installed — run pnpm install to enable this suite');
    }

    $process = new Process([$tsx, $root.'/tests/js/seo.test.ts'], $root);
    $process->run();

    if (! $process->isSuccessful()) {
        $this->fail("tsx behavior suite failed:\n".$process->getOutput().$process->getErrorOutput());
    }

    expect($process->isSuccessful())->toBeTrue();
});
