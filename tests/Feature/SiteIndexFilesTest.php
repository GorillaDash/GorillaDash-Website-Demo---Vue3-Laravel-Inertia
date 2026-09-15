<?php

/*
 * sitemap.xml and llms.txt are built from Gorilla Dash on request. These pin what
 * each lists, that llms.txt says the brand is fictional before anything else, and
 * that one failed Gorilla Dash read leaves the rest of the index in place.
 */

beforeEach(function () {
    config(['app.url' => 'https://demo.gorilladash.com']);
});

function fakeSiteIndex(bool $articlesFail = false): void
{
    fakeGraphql([
        'websitePages' => websitePagesData([
            'homepage' => 'homepage',
            'locations' => 'locations',
            'menu' => 'menu',
            'blog' => 'blog',
            'our-work' => 'our-work',
            'franchise' => 'franchise',
        ]),
        'tribes' => ['tribes' => [
            ['name' => 'Hungry Gorilla Austin South Congress', 'slug' => 'austin-south-congress', 'status' => 'Active', 'locality' => 'Austin', 'state_abbreviated' => 'TX'],
            ['name' => 'Hungry Gorilla Boise', 'slug' => 'boise-downtown', 'status' => 'Opening Soon', 'locality' => 'Boise', 'state_abbreviated' => 'ID'],
        ]],
        'foodMenu' => fn (array $variables) => $variables['name'] === 'Website Menu'
            ? ['foodMenu' => ['foodMenuSections' => [
                ['slug' => 'breakfast', 'foodMenuListItems' => [['name' => 'Silverback Breakfast', 'slug' => 'silverback-breakfast']]],
            ]]]
            : ['foodMenu' => null],
        'articlesPagination' => $articlesFail
            ? fn () => throw new RuntimeException('Gorilla Dash unavailable')
            : ['articlesPagination' => ['data' => [
                ['slug' => 'hungry-gorilla-top-50-emerging-franchise', 'heading' => 'Hungry Gorilla named a top 50 emerging franchise', 'abstract' => 'An award for the network.'],
            ]]],
        'organisationOurWorks' => ['organisationOurWorks' => ['data' => [
            ['slug' => 'feeding-a-500-person-charity-gala', 'heading' => 'Feeding a 500-person charity gala'],
        ]]],
    ]);
}

test('the sitemap lists every page, cafe, menu item, article and Our Work post', function () {
    fakeSiteIndex();

    $response = $this->get('/sitemap.xml');

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/xml; charset=UTF-8');

    expect(simplexml_load_string($response->getContent()))->not->toBeFalse();
    preg_match_all('#<loc>([^<]+)</loc>#', $response->getContent(), $matches);
    $urls = $matches[1];

    expect($urls)->toContain(
        'https://demo.gorilladash.com/',
        'https://demo.gorilladash.com/franchise',
        'https://demo.gorilladash.com/locations/austin-south-congress',
        'https://demo.gorilladash.com/locations/boise-downtown',
        'https://demo.gorilladash.com/menu/breakfast/silverback-breakfast',
        'https://demo.gorilladash.com/blog/hungry-gorilla-top-50-emerging-franchise',
        'https://demo.gorilladash.com/our-work/feeding-a-500-person-charity-gala',
    )->and($urls)->toHaveCount(count(array_unique($urls)));
});

test('llms.txt opens by saying the brand is a fictional Gorilla Dash demonstration', function () {
    fakeSiteIndex();

    $response = $this->get('/llms.txt');

    $response->assertOk();
    $response->assertHeader('Content-Type', 'text/markdown; charset=UTF-8');

    $body = $response->getContent();

    expect($body)->toStartWith("# Hungry Gorilla: a Gorilla Dash demonstration website\n\n> Hungry Gorilla is a fictional cafe and catering franchise.")
        ->and($body)->toContain('are not real businesses')
        ->and($body)->toContain('- [Hungry Gorilla Boise](https://demo.gorilladash.com/locations/boise-downtown): Boise, ID (opening soon)')
        ->and($body)->toContain('- [Silverback Breakfast](https://demo.gorilladash.com/menu/breakfast/silverback-breakfast): Website Menu')
        ->and($body)->toContain('## Our Work')
        ->and($body)->toContain('- [Gorilla Dash](https://gorilladash.com)');
});

test('a failed Gorilla Dash read drops only its own section', function () {
    fakeSiteIndex(articlesFail: true);

    $body = $this->get('/llms.txt')->assertOk()->getContent();

    expect($body)->not->toContain('## Blog')
        ->and($body)->toContain('## Cafes')
        ->and($this->get('/sitemap.xml')->assertOk()->getContent())->toContain('/locations/austin-south-congress');
});
