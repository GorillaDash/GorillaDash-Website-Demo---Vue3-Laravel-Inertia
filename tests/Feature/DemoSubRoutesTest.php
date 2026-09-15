<?php

use Inertia\Testing\AssertableInertia;

/*
 * The Hungry Gorilla demo's open sub-route parameters: a tribe slug, a menu section and
 * item, an Our Work post and a journal article. Each is checked against Gorilla Dash
 * before the page renders (App\Services\Catalogue\*), with the two failure modes kept
 * apart: a definitive miss 404s, a lookup that fails lets the page through, so a
 * Gorilla Dash outage never turns a whole catalogue into 404s.
 */

describe('tribe pages', function () {
    it('serves a tribe the directory lists, Opening Soon included', function () {
        fakeGraphql(['tribes' => ['tribes' => [['slug' => 'boise-downtown']]]]);

        $this->get('/locations/boise-downtown')->assertOk()->assertInertia(
            fn (AssertableInertia $page) => $page->component('LocationDetail')->where('slug', 'boise-downtown')
        );
    });

    it('404s a slug the directory does not list', function () {
        fakeGraphql(['tribes' => ['tribes' => [['slug' => 'boise-downtown']]]]);

        $this->get('/locations/nowhere')->assertNotFound();
    });

    it('serves the page when the directory cannot be read', function () {
        fakeGraphql([]);

        $this->get('/locations/boise-downtown')->assertOk();
    });
});

describe('menu item pages', function () {
    $menu = [
        'foodMenu' => [
            'foodMenu' => [
                'foodMenuSections' => [
                    ['slug' => 'bowls', 'foodMenuListItems' => [['slug' => 'harvest-bowl']]],
                ],
            ],
        ],
    ];

    it('serves an item in its section', function () use ($menu) {
        fakeGraphql($menu);

        $this->get('/menu/bowls/harvest-bowl')->assertOk()->assertInertia(
            fn (AssertableInertia $page) => $page->component('MenuItem')->where('section', 'bowls')->where('item', 'harvest-bowl')
        );
    });

    it('404s an item that is not in that section', function () use ($menu) {
        fakeGraphql($menu);

        $this->get('/menu/bakery/harvest-bowl')->assertNotFound();
        $this->get('/menu/bowls/nothing')->assertNotFound();
    });

    it('serves the page when neither menu can be read', function () {
        fakeGraphql([]);

        $this->get('/menu/bowls/harvest-bowl')->assertOk();
    });
});

describe('Our Work posts', function () {
    $posts = ['organisationOurWorks' => ['organisationOurWorks' => ['data' => [['slug' => 'charity-gala']]]]];

    it('serves a published post', function () use ($posts) {
        fakeGraphql($posts);

        $this->get('/our-work/charity-gala')->assertOk()->assertInertia(
            fn (AssertableInertia $page) => $page->component('OurWorkDetail')->where('slug', 'charity-gala')
        );
    });

    it('404s a post that is not published', function () use ($posts) {
        fakeGraphql($posts);

        $this->get('/our-work/draft-post')->assertNotFound();
    });

    it('serves the page when the list cannot be read', function () {
        fakeGraphql([]);

        $this->get('/our-work/charity-gala')->assertOk();
    });
});

describe('journal articles', function () {
    it('serves a published article', function () {
        fakeGraphql(['article' => ['article' => ['slug' => 'maple-tahini-dressing-recipe']]]);

        $this->get('/blog/maple-tahini-dressing-recipe')->assertOk()->assertInertia(
            fn (AssertableInertia $page) => $page->component('Article')->where('slug', 'maple-tahini-dressing-recipe')
        );
    });

    it('404s when Gorilla Dash answers with no article', function () {
        fakeGraphql(['article' => ['article' => null]]);

        $this->get('/blog/nothing')->assertNotFound();
    });

    it('serves the page when the lookup fails', function () {
        fakeGraphql([]);

        $this->get('/blog/maple-tahini-dressing-recipe')->assertOk();
    });
});

describe('top-level demo pages', function () {
    it('maps each CMS page key to its Vue page', function (string $uri, string $component) {
        fakeWebsitePages([]);

        $this->get($uri)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->component($component));
    })->with([
        ['/about', 'About'],
        ['/menu', 'Menu'],
        ['/order', 'Order'],
        ['/catering', 'Catering'],
        ['/book', 'Book'],
        ['/our-work', 'OurWork'],
        ['/blog', 'Blog'],
        ['/franchise', 'Franchise'],
        ['/contact', 'Contact'],
        ['/faq', 'Faq'],
    ]);
});
