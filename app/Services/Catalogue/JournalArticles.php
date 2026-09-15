<?php

namespace App\Services\Catalogue;

use GorillaDash\WebsiteSdk\Facades\GorillaDash;
use GraphQL\Query;
use GraphQL\RawObject;
use GraphQL\Variable;

/**
 * Answers one question for `/blog/{slug}`: is this a published article?
 *
 * `article(slug:)` answers null for an unknown slug, so it is its own existence
 * check. A blank slug is rejected before it reaches Gorilla Dash, where an empty
 * slug is a wildcard that returns the newest article.
 */
class JournalArticles
{
    public function exists(string $slug): bool
    {
        if (trim($slug) === '') {
            return false;
        }

        return rescue(function () use ($slug): bool {
            $response = GorillaDash::graphql($this->query(), ['slug' => $slug]);

            if (! array_key_exists('article', $response)) {
                return true;
            }

            return is_array($response['article']);
        }, true, report: false);
    }

    private function query(): Query
    {
        return (new Query('article'))
            ->setVariables([new Variable('slug', 'String', true)])
            ->setArguments(['slug' => new RawObject('$slug'), 'status' => 'Published'])
            ->setSelectionSet(['slug']);
    }
}
