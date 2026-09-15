<?php

namespace App\Http\Controllers;

use App\Services\Catalogue\FoodMenuCatalogue;
use Inertia\Inertia;
use Inertia\Response;

class MenuItemController extends Controller
{
    /** One menu card: its sizes, modifiers and the add-to-order form. */
    public function show(string $section, string $item, FoodMenuCatalogue $menus): Response
    {
        abort_unless($menus->exists($section, $item), 404);

        return Inertia::render('MenuItem', [
            'section' => $section,
            'item' => $item,
        ]);
    }
}
