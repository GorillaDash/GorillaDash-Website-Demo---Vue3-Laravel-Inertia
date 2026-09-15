<?php

namespace App\Services\Catalogue;

use GorillaDash\WebsiteSdk\Facades\GorillaDash;
use GraphQL\Query;
use GraphQL\RawObject;
use GraphQL\Variable;

/**
 * Answers one question for the `/locations/{slug}` route: is this a tribe the site
 * links to? The finder lists trading and Opening Soon tribes of the Hungry Gorilla
 * tribe type (the `tribes` query's `launch` status filter: Active and Opening Soon), so the check reads that same list.
 *
 * A definitive miss (the list came back and the slug is not in it) is `false`; a
 * lookup that failed or answered nothing is `true`, so a Gorilla Dash outage never
 * turns every tribe page into a 404.
 */
class TribeDirectory
{
    public const TRIBE_TYPE = 'Hungry Gorilla Cafes';

    public function exists(string $slug): bool
    {
        if (trim($slug) === '') {
            return false;
        }

        return rescue(function () use ($slug): bool {
            $response = GorillaDash::graphql($this->query(), ['tribeType' => self::TRIBE_TYPE]);

            if (! is_array($response['tribes'] ?? null)) {
                return true;
            }

            return collect($response['tribes'])->pluck('slug')->contains($slug);
        }, true, report: false);
    }

    private function query(): Query
    {
        return (new Query('tribes'))
            ->setVariables([new Variable('tribeType', 'String')])
            ->setArguments(['name' => new RawObject('$tribeType'), 'status' => 'launch'])
            ->setSelectionSet(['slug']);
    }
}
