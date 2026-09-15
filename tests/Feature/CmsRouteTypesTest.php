<?php

use App\Services\CmsRoutes;

/*
 * cmsRoute()'s compile-time safety is GENERATED: resources/ts/types/cmsRoutes.ts maps
 * route name => URL parameter names, rendered from the route table by
 * `php artisan cms-routes:types`. The file is gitignored and regenerated on every
 * vite dev/build (vite.config.ts), exactly like the Wayfinder output — so these
 * tests pin the generator's behavior, not the file's bytes: which routes get a
 * member, where the params come from, and that the @route docblock resolves
 * `{page}` through the current environment's CMS map.
 */

it('renders a typed member per keyed CMS route, params from the URI template', function () {
    fakeWebsitePages(['homepage' => null, 'locations' => null]);

    expect(app(CmsRoutes::class)->typeDeclarations())
        ->toContain("'locations.show': { slug: string }")
        // The keyless {page} route and the locale.* duplicates stay out.
        ->not->toContain("'page':")
        ->not->toContain('locale.');
});

it('resolves @route through the live CMS map — a rename shows up on regeneration', function () {
    fakeWebsitePages(['homepage' => null, 'stores' => 'locations']);

    expect(app(CmsRoutes::class)->typeDeclarations())
        ->toContain("@route '/stores/{slug}'");
});

// The frontend's boot-time fallbacks are generated too — from PHP CONSTANTS, never
// the CMS: even with the CMS renamed, they keep WebsitePages::FALLBACK's defaults.
it('renders the fallback constants from code, unaffected by CMS state', function () {
    fakeWebsitePages(['homepage' => null, 'stores' => 'locations']);

    expect(app(CmsRoutes::class)->typeDeclarations())
        // Quoted on purpose — a page key is a CMS slug and may not be a valid bare
        // JS identifier. Don't "tidy" the quotes away here or in the generator.
        ->toContain("'locations': '/locations'")
        ->toContain("'homepage': '/'")
        ->toContain('export type PageKey = keyof typeof PAGE_PATH_FALLBACK')
        ->toContain("'locations.show': { uri: '/{page}/{slug}', page: 'locations' }");
});

it('points each member at its controller action', function () {
    fakeWebsitePages(['homepage' => null, 'locations' => null]);

    expect(app(CmsRoutes::class)->typeDeclarations())
        ->toContain('@see \App\Http\Controllers\LocationController::show')
        ->toContain('@see app/Http/Controllers/LocationController.php:');
});
