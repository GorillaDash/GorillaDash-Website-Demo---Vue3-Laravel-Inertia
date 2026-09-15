<?php

namespace App\Services\Catalogue;

use GorillaDash\WebsiteSdk\Facades\GorillaDash;
use GraphQL\Query;
use GraphQL\RawObject;
use GraphQL\Variable;

/**
 * Answers one question for `/our-work/{slug}`: is this a published organisation-level
 * Our Work post? Reads the same list the index page shows, one generous page of it.
 */
class OurWorkPosts
{
    private const PAGE_SIZE = 100;

    public function exists(string $slug): bool
    {
        if (trim($slug) === '') {
            return false;
        }

        return rescue(function () use ($slug): bool {
            $posts = GorillaDash::graphql($this->query(), ['itemsPerPage' => self::PAGE_SIZE])['organisationOurWorks']['data'] ?? null;

            if (! is_array($posts)) {
                return true;
            }

            return collect($posts)->pluck('slug')->contains($slug);
        }, true, report: false);
    }

    private function query(): Query
    {
        return (new Query('organisationOurWorks'))
            ->setVariables([new Variable('itemsPerPage', 'Int', true)])
            ->setArguments(['page' => 1, 'itemsPerPage' => new RawObject('$itemsPerPage')])
            ->setSelectionSet([(new Query('data'))->setSelectionSet(['slug'])]);
    }
}
