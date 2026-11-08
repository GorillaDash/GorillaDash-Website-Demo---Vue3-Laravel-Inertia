<?php

use Symfony\Component\Process\Process;

/*
 * The request the Apollo client sends for a fresh `graphqlToken` prop after Gorilla Dash
 * refused the token it had (resources/ts/lib/graphqlTokenRefresh.ts); its behavior suite is
 * plain node:assert in tests/js/graphqlTokenRefresh.test.ts, run through the repo's tsx
 * binary — same arrangement as FrontendPagePathsTest.
 */

it('passes the frontend GraphQL token refresh behavior suite (tests/js/graphqlTokenRefresh.test.ts)', function () {
    $root = dirname(__DIR__, 2);
    $tsx = $root.'/node_modules/.bin/tsx';

    if (! is_file($tsx)) {
        $this->markTestSkipped('node_modules not installed — run npm install to enable this suite');
    }

    $process = new Process([$tsx, $root.'/tests/js/graphqlTokenRefresh.test.ts'], $root);
    $process->run();

    if (! $process->isSuccessful()) {
        $this->fail("tsx behavior suite failed:\n".$process->getOutput().$process->getErrorOutput());
    }

    expect($process->isSuccessful())->toBeTrue();
});
