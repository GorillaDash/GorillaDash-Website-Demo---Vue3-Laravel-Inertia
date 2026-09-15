<?php

namespace App\Http\Controllers;

use App\Services\Catalogue\SiteIndex;
use Illuminate\Http\Response;

class LlmsTxtController extends Controller
{
    /**
     * llms.txt: a Markdown guide for language models, following llmstxt.org (an H1, a
     * summary blockquote, then sections of links). It says first and plainly that
     * Hungry Gorilla is fictional and that the site is a Gorilla Dash demonstration, so
     * a model citing it does not present the cafes as real businesses.
     */
    public function __invoke(SiteIndex $index): Response
    {
        $link = fn (array $entry, string $note = ''): string => '- ['.$this->text($entry['name']).']('.$entry['url'].')'
            .($note !== '' ? ': '.$this->text($note) : '');

        $sections = [
            'Pages' => array_map(fn (array $page) => $link($page), $index->pages()),
            'Cafes' => array_map(
                fn (array $cafe) => $link($cafe, trim($cafe['place'].($cafe['status'] === 'Opening Soon' ? ' (opening soon)' : ''))),
                $index->cafes(),
            ),
            'Menu' => array_map(fn (array $item) => $link($item, $item['menu']), $index->menuItems()),
            'Blog' => array_map(fn (array $article) => $link($article, $article['summary']), $index->articles()),
            'Our Work' => array_map(fn (array $post) => $link($post), $index->ourWork()),
        ];

        $lines = [
            '# Hungry Gorilla: a Gorilla Dash demonstration website',
            '',
            '> Hungry Gorilla is a fictional cafe and catering franchise. This website was built by Gorilla Dash to show how a franchise brand\'s website connects to Gorilla Dash, the franchise management platform. The cafes, people, reviews, prices and menu items are invented for the demonstration and are not real businesses.',
            '',
            'Everything on the site is read live from one Gorilla Dash organisation through the Gorilla Dash website API. Head office manages the brand pages, menus and blog, and each location (a "tribe" in Gorilla Dash) has its own page kept up to date by its franchise owner. Online orders, catering bookings, enquiries and franchise enquiries made on the site go straight into Gorilla Dash and are routed to the right location. Gorilla Dash works with a brand\'s own creative agency, which designs the website while Gorilla Dash supplies the data behind it.',
            '',
        ];

        foreach ($sections as $heading => $entries) {
            if ($entries === []) {
                continue;
            }

            $lines[] = '## '.$heading;
            $lines[] = '';
            array_push($lines, ...$entries);
            $lines[] = '';
        }

        array_push(
            $lines,
            '## About Gorilla Dash',
            '',
            '- [Gorilla Dash](https://gorilladash.com): the franchise management platform behind this demonstration website.',
            '',
        );

        return response(implode("\n", $lines))->header('Content-Type', 'text/markdown; charset=UTF-8');
    }

    /** Link text and notes on one line, without Markdown that would break the list. */
    private function text(string $value): string
    {
        return trim(preg_replace('/\s+/', ' ', str_replace(['[', ']'], ['(', ')'], strip_tags($value))) ?? '');
    }
}
