<?php

namespace App\Http\Controllers;

use App\Services\Catalogue\TribeDirectory;
use Inertia\Inertia;
use Inertia\Response;

class LocationController extends Controller
{
    /**
     * One tribe's page. The tribe's content is fetched client-side; this only checks
     * the slug is a tribe the finder lists (see TribeDirectory).
     */
    public function show(string $slug, TribeDirectory $tribes): Response
    {
        abort_unless($tribes->exists($slug), 404);

        return Inertia::render('LocationDetail', [
            'slug' => $slug,
        ]);
    }
}
