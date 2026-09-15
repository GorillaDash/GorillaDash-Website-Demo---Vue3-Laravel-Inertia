<?php

/*
 * robots.txt is generated, not a file in public/: one image is deployed to every
 * country, so the only place the answer can differ is that deployment's config.
 * These lock in the two things that make that work — the contents follow config,
 * and the route stays at the root ahead of the CMS-driven `{page}` route.
 */

/*
 * config/seo.php reads whatever ROBOTS_* the machine running the suite happens to
 * have — a developer's .env, or CI's copy of .env.example. What is asserted below
 * is the RENDERING, so pin its inputs: a machine that had set these would
 * otherwise fail a suite that is not about that machine's deployment.
 */
beforeEach(fn () => config([
    'seo.robots.indexable' => false,
    'seo.robots.allowed_bots' => [],
    'seo.robots.sitemap' => null,
]));

test('a deployment that has not opted in is closed to crawlers', function () {
    $response = $this->get('/robots.txt');

    $response->assertOk();
    $response->assertHeader('Content-Type', 'text/plain; charset=UTF-8');

    expect($response->getContent())->toBe("User-agent: *\nDisallow: /\n");
});

test('a deployment marked indexable is open to crawlers', function () {
    config(['seo.robots.indexable' => true]);

    expect($this->get('/robots.txt')->getContent())
        ->toBe("User-agent: *\nAllow: /\n");
});

/*
 * The `Sitemap:` line is opt-in per deployment too, and absent until something
 * actually serves one — pointing crawlers at a 404 is worse than saying nothing.
 */
test('a configured sitemap is announced, and only then', function () {
    config(['seo.robots.indexable' => true, 'seo.robots.sitemap' => 'https://example.com/sitemap.xml']);

    expect($this->get('/robots.txt')->getContent())
        ->toBe("User-agent: *\nAllow: /\n\nSitemap: https://example.com/sitemap.xml\n");

    config(['seo.robots.sitemap' => null]);

    expect($this->get('/robots.txt')->getContent())->not->toContain('Sitemap:');
});

/*
 * A crawler obeys exactly one group — the most specific match for its token — and
 * ignores every other one (RFC 9309 2.2.1). That is what makes an exemption
 * possible at all: SiteAuditBot reads its own `Allow: /` and never sees the
 * blanket `Disallow: /` meant for everyone else.
 */
test('a named bot is exempted from a closed deployment by its own group', function () {
    config(['seo.robots.indexable' => false, 'seo.robots.allowed_bots' => ['SiteAuditBot']]);

    expect($this->get('/robots.txt')->getContent())->toBe(
        "User-agent: SiteAuditBot\nAllow: /\n\nUser-agent: *\nDisallow: /\n"
    );
});

test('each exempted bot gets its own group', function () {
    config(['seo.robots.indexable' => false, 'seo.robots.allowed_bots' => ['SiteAuditBot', 'AhrefsSiteAudit']]);

    expect($this->get('/robots.txt')->getContent())->toBe(
        "User-agent: SiteAuditBot\nAllow: /\n\n".
        "User-agent: AhrefsSiteAudit\nAllow: /\n\n".
        "User-agent: *\nDisallow: /\n"
    );
});

/*
 * `{page}` matches any single segment, dots included, so a robots.txt registered
 * after it would be handed to the CMS page lookup and 404. It also must not pick
 * up the `/{locale}` prefix a multilingual deployment adds — crawlers only ever
 * fetch /robots.txt.
 */
test('the CMS page route never swallows robots.txt, in either deployment shape', function (array $locales) {
    registerRoutesWithLocales($locales);
    fakeWebsitePages(['locations' => 'locations']);

    $this->get('/robots.txt')
        ->assertOk()
        ->assertHeader('Content-Type', 'text/plain; charset=UTF-8');
})->with([
    'monolingual' => [['en-US']],
    'multilingual' => [['en-US', 'ar-EG']],
]);

/*
 * Identical for every visitor and changed about once a year, so the edge holds it
 * an hour rather than a page's two minutes. `html` keeps it in the blanket purge
 * deploy.sh already runs.
 */
test('the edge may hold robots.txt far longer than a page', function () {
    $response = $this->get('/robots.txt');

    $response->assertHeader('Cloudflare-CDN-Cache-Control', 'max-age=3600');
    $response->assertHeader('Cache-Tag', 'html,robots');
});
