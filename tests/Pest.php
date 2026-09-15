<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Routing\RouteCollection;
use Illuminate\Support\Facades\Route;
use Illuminate\Testing\TestResponse;
use Symfony\Component\Finder\Finder;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

/**
 * Hand-written frontend sources whose contents match a pattern — the scanner behind
 * the usage-ban tests (SharedPropsUsageTest, PagePathsUsageTest). Generated output
 * (codegen types, Wayfinder routes/actions) is excluded: it is not ours to police,
 * and the Wayfinder dirs are gitignored — absent on CI, where Pest runs unbuilt.
 *
 * Unit tests don't boot Laravel, so no resource_path() here.
 *
 * @param  non-empty-string  $pattern
 * @return list<string>
 */
function tsFilesMatching(string $pattern): array
{
    $files = Finder::create()
        ->files()
        ->in(dirname(__DIR__).'/resources/ts')
        ->name(['*.ts', '*.vue'])
        ->exclude(['__generated__', 'routes', 'actions', 'wayfinder']);

    $offenders = [];

    foreach ($files as $file) {
        if (preg_match($pattern, (string) $file->getContents()) === 1) {
            $offenders[] = $file->getRelativePathname();
        }
    }

    sort($offenders);

    return $offenders;
}

/**
 * Rebuild the route table under a different locale set, exactly as a differently
 * configured country's deployment would at startup. The `/{locale}` prefix exists
 * only when more than one tag is given — see routes/web.php.
 */
function registerRoutesWithLocales(array $tags): void
{
    config(['i18n.supported' => $tags, 'i18n.default' => $tags[0]]);

    // A restart re-resolves the services too: the scoped WebsitePages memoizes its
    // page lists (and the slug patterns it bakes) per locale set.
    app()->forgetScopedInstances();

    app('router')->setRoutes(new RouteCollection());
    Route::middleware('web')->group(base_path('routes/web.php'));
    app('router')->getRoutes()->refreshNameLookups();
}

/**
 * The asset version Inertia expects on a partial reload; a mismatch 409s instead.
 */
function inertiaVersion(): ?string
{
    return app(HandleInertiaRequests::class)
        ->version(Request::create('/'));
}

/**
 * Fetch a deferred prop the way Inertia's client does right after mount.
 *
 * `boundLocation` is deferred so it stays out of the edge-cacheable HTML — it only
 * exists in this second, partial request. Tests that assert on it must ask for it.
 */
function partialReload(string $prop, string $component, string $uri = '/'): TestResponse
{
    return test()->get($uri, [
        'X-Inertia' => 'true',
        'X-Inertia-Version' => inertiaVersion(),
        'X-Inertia-Partial-Component' => $component,
        'X-Inertia-Partial-Data' => $prop,
    ]);
}

/**
 * Fake every GD GraphQL call in the request, routed by query root field.
 *
 * One Mockery expectation covers all calls — two stacked `shouldReceive('graphql')`
 * expectations would NOT work, the first (unconstrained) swallows everything. Each
 * entry maps a root field name to the `data` array graphql() should return when the
 * built query mentions it, or to a closure receiving the call's variables (for
 * per-locale fakes). A query matching no entry gets [] — services treat that as a
 * miss/failure and fall back, exactly like a test with no fake at all.
 *
 * Call once per test; a second call stacks a dead expectation.
 *
 * @param  array<string, array<string, mixed>|Closure>  $roots
 */
function fakeGraphql(array $roots): void
{
    // The fake replaces the data source, so drop anything resolved from the old one:
    // scoped services memoize per request (App\Services\WebsitePages), and a test may
    // register its routes — which reads the page map — before faking.
    app()->forgetScopedInstances();

    GorillaDash\WebsiteSdk\Facades\GorillaDash::shouldReceive('graphql')
        ->andReturnUsing(function ($query, array $variables = []) use ($roots) {
            foreach ($roots as $root => $data) {
                if (str_contains((string) $query, $root)) {
                    return $data instanceof Closure ? $data($variables) : $data;
                }
            }

            return [];
        });
}

/**
 * Fake the `websitePages` list the dynamic page routes resolve against
 * (App\Services\WebsitePages), as [slug => vue_route_name] pairs — or a closure
 * over the call's variables for per-locale slugs. Composable with a tribe via
 * fakeGraphql() directly when a test needs both.
 *
 * @param  array<string, ?string>|Closure  $pages
 */
function fakeWebsitePages(array|Closure $pages): void
{
    fakeGraphql(['websitePages' => $pages instanceof Closure ? $pages : websitePagesData($pages)]);
}

/**
 * Shape [slug => vue_route_name] pairs like the GD `websitePages` response.
 *
 * @param  array<string, ?string>  $pages
 * @return array{websitePages: list<array<string, mixed>>}
 */
function websitePagesData(array $pages): array
{
    return [
        'websitePages' => collect($pages)
            ->map(fn (?string $key, string $slug) => [
                'name' => str($slug)->headline()->toString(),
                'slug' => $slug,
                'vue_route_name' => $key,
            ])
            ->values()
            ->all(),
    ];
}

/**
 * Fake a GD GraphQL tribe response for the given slug (or a null tribe to
 * simulate "no such store"). graphql() returns the GraphQL `data` array directly,
 * and this covers every call in the request — the page-map lookup matches no root
 * here and falls back to the default slugs, so /locations etc. resolve as usual.
 */
function fakeTribe(?string $slug): void
{
    $tribe = $slug === null ? null : [
        'name' => 'Vestavia Hills',
        'slug' => $slug,
        'public_email' => 'vestavia@example.com',
        'main_telephone' => '(205) 555-0100',
        'address_1' => '1234 Montgomery Hwy',
        'address_2' => null,
        'locality' => 'Vestavia Hills',
        'state' => 'AL',
        'country' => 'US',
        'postal_code' => '35216',
    ];

    // `tribes` first: the directory query also contains the word `tribe`. The store page
    // checks its slug against that list (App\Services\Catalogue\TribeDirectory), the
    // bound-store lookup reads the single tribe.
    fakeGraphql([
        'tribes' => ['tribes' => $slug === null ? [] : [['slug' => $slug]]],
        'tribe' => ['tribe' => $tribe],
    ]);
}
