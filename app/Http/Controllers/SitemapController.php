<?php

namespace App\Http\Controllers;

use App\Services\Catalogue\SiteIndex;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    /**
     * sitemap.xml: every public page, cafe, menu item, article and Our Work post, built
     * from Gorilla Dash on request so a page published in the CMS is listed without a
     * deploy.
     */
    public function __invoke(SiteIndex $index): Response
    {
        $entries = collect($index->urls())
            ->map(fn (string $url) => '  <url><loc>'.e($url).'</loc></url>')
            ->implode("\n");

        $body = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
            .'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n"
            .$entries."\n"
            .'</urlset>'."\n";

        return response($body)->header('Content-Type', 'application/xml; charset=UTF-8');
    }
}
