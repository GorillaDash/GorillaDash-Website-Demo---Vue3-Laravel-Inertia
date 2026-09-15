<?php

namespace App\Http\Controllers;

use App\Services\Catalogue\JournalArticles;
use Inertia\Inertia;
use Inertia\Response;

class ArticleController extends Controller
{
    /** One journal article. */
    public function show(string $article, JournalArticles $articles): Response
    {
        abort_unless($articles->exists($article), 404);

        return Inertia::render('Article', [
            'slug' => $article,
        ]);
    }
}
