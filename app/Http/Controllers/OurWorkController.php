<?php

namespace App\Http\Controllers;

use App\Services\Catalogue\OurWorkPosts;
use Inertia\Inertia;
use Inertia\Response;

class OurWorkController extends Controller
{
    /** One organisation-level Our Work post. */
    public function show(string $work, OurWorkPosts $posts): Response
    {
        abort_unless($posts->exists($work), 404);

        return Inertia::render('OurWorkDetail', [
            'slug' => $work,
        ]);
    }
}
