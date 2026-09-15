<?php

namespace App\Console\Commands;

use App\Services\CmsRoutes;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Regenerates resources/ts/types/cmsRoutes.ts — the compile-time types for
 * cmsRoute() (route name => URL parameter names), rendered from the route table
 * by CmsRoutes::typeDeclarations(). The file is gitignored and vite regenerates
 * it on every dev/build (vite.config.ts), like the Wayfinder output; this is the
 * standalone escape hatch, e.g. after editing routes/web.php mid-dev-session.
 */
#[Signature('cms-routes:types')]
#[Description('Regenerate resources/ts/types/cmsRoutes.ts from the CMS-driven routes')]
class GenerateCmsRouteTypes extends Command
{
    public function handle(CmsRoutes $cmsRoutes): int
    {
        file_put_contents(resource_path('ts/types/cmsRoutes.ts'), $cmsRoutes->typeDeclarations());

        $this->components->info('resources/ts/types/cmsRoutes.ts regenerated.');

        return self::SUCCESS;
    }
}
