<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Start every test on a clean set of scoped container instances.
     *
     * Scoped services (App\Services\WebsitePages) memoize per-request state, and
     * Octane clears them at the start of each request — but a test boots the app
     * once and then drives requests through it, so instances created while
     * routes/web.php registered would otherwise answer the whole test from a map
     * resolved before the test's GraphQL fake was in place.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->app->forgetScopedInstances();
    }
}
