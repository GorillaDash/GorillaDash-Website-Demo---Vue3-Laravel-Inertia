<?php

namespace App\Services\Catalogue;

use GorillaDash\WebsiteSdk\Facades\GorillaDash;
use GraphQL\Query;
use GraphQL\RawObject;
use GraphQL\Variable;

/**
 * Answers one question for `/menu/{section}/{item}`: does either demo food menu
 * have this card in this section?
 *
 * Reads the whole menu rather than asking `foodMenuListItem` directly, because that
 * query answers "Internal server error" for an unknown slug, which cannot be told
 * apart from an outage. A menu that fails to load lets the request through.
 */
class FoodMenuCatalogue
{
    /** The menus the site links item pages from. */
    public const MENUS = ['Website Menu', 'Catering Menu'];

    public function exists(string $section, string $item): bool
    {
        if (trim($section) === '' || trim($item) === '') {
            return false;
        }

        return rescue(function () use ($section, $item): bool {
            $answered = false;

            foreach (self::MENUS as $name) {
                $menu = GorillaDash::graphql($this->query(), ['name' => $name])['foodMenu'] ?? null;

                if (! is_array($menu)) {
                    continue;
                }

                $answered = true;

                foreach ($menu['foodMenuSections'] ?? [] as $menuSection) {
                    if (($menuSection['slug'] ?? null) === $section
                        && collect($menuSection['foodMenuListItems'] ?? [])->pluck('slug')->contains($item)) {
                        return true;
                    }
                }
            }

            return ! $answered;
        }, true, report: false);
    }

    private function query(): Query
    {
        return (new Query('foodMenu'))
            ->setVariables([new Variable('name', 'String', true)])
            ->setArguments(['name' => new RawObject('$name')])
            ->setSelectionSet([
                (new Query('foodMenuSections'))->setSelectionSet([
                    'slug',
                    (new Query('foodMenuListItems'))->setSelectionSet(['slug']),
                ]),
            ]);
    }
}
