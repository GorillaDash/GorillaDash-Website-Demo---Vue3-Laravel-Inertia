<?php

use App\Enums\Locale;
use Inertia\Testing\AssertableInertia;

/*
 * The `/{locale}` URL prefix exists only on deployments that serve more than one
 * locale — see routes/web.php. Since the route table is built at boot from
 * config('i18n.supported'), setting the config alone proves nothing: these tests
 * rebuild the routes under the locale set they want (registerRoutesWithLocales,
 * tests/Pest.php), exactly as a differently configured country's deployment
 * would at startup.
 */

describe('a monolingual deployment', function () {
    beforeEach(fn () => registerRoutesWithLocales(['en-US']));

    it('serves pages at their bare, unprefixed URLs', function () {
        $this->get('/locations')->assertOk();
    });

    it('does not invent a locale-prefixed URL', function () {
        $this->get('/en/locations')->assertNotFound();
    });

    it('still reports its single locale to the frontend', function () {
        $this->get('/')->assertInertia(
            fn (AssertableInertia $page) => $page
            ->where('locale.value', 'en-US')
            ->where('locale.code', 'en')
            ->has('config.locales', 1)
        );
    });
});

describe('a multilingual deployment', function () {
    beforeEach(fn () => registerRoutesWithLocales(['en-US', 'ja-JP']));

    it('serves every locale under its own prefix, including the default', function () {
        $this->get('/en/locations')->assertOk();
        $this->get('/jp/locations')->assertOk();
    });

    it('resolves the locale from the URL segment', function () {
        $this->get('/jp/locations')->assertInertia(
            fn (AssertableInertia $page) => $page
            ->where('locale.value', 'ja-JP')
            ->where('locale.code', 'jp')
        );
    });

    it('sends the bare root to the default locale, and lets the edge cache the hop', function () {
        $this->get('/')
            ->assertRedirect('/en')
            ->assertHeader('Cloudflare-CDN-Cache-Control', 'max-age=3600');
    });

    it('sends an unprefixed page URL to the default locale', function () {
        $this->get('/locations')->assertRedirect('/en/locations');
    });

    it('keeps the query string across that redirect', function () {
        $this->get('/locations?debug=1')->assertRedirect('/en/locations?debug=1');
    });

    it('404s a missing page under a real locale', function () {
        $this->get('/jp/nope')->assertNotFound();
    });

    it('404s a locale it does not serve', function () {
        $this->get('/de/locations')->assertNotFound();
    });

    /*
     * The canonical, locale-free routes stay in the table even here — Wayfinder bakes
     * their URIs into the frontend bundle at build time, and one image serves every
     * country, so the shape must not shift with APP_LOCALES. A `{locale}` prefix on
     * these turned `locationsShow.url()` into `locationsShow.url({ locale })` and crashed every page
     * that called it under SSR.
     */
    it('keeps the canonical locale-free route names pointing at unprefixed URLs', function () {
        expect(route('page', ['page' => 'locations'], absolute: false))->toBe('/locations')
            ->and(route('locale.page', ['locale' => 'jp', 'page' => 'locations'], absolute: false))->toBe('/jp/locations');
    });

    it('offers the whole locale set to the frontend', function () {
        $this->get('/jp/locations')->assertInertia(
            fn (AssertableInertia $page) => $page
            ->has('config.locales', 2)
            ->where('config.locales.1.value', 'ja-JP')
            ->where('config.locales.1.code', 'jp')
            ->where('config.locales.1.label', '日本語')
        );
    });

    it('still names routes for the edge purge key', function () {
        $this->get('/jp/locations')->assertHeader('Cache-Tag', 'html,locations');
    });
});

describe('the Locale enum', function () {
    it('maps language tags to short URL segments', function () {
        expect(Locale::JaJp->code())->toBe('jp')
            ->and(Locale::EnUs->code())->toBe('en')
            ->and(Locale::EnAu->code())->toBe('en');
    });

    it('resolves a URL segment only against the supported set', function () {
        config(['i18n.supported' => ['en-US']]);

        expect(Locale::fromCode('en'))->toBe(Locale::EnUs)
            ->and(Locale::fromCode('jp'))->toBeNull();
    });

    it('is monolingual until a second locale is configured', function () {
        config(['i18n.supported' => ['en-US']]);
        expect(Locale::isMultilingual())->toBeFalse();

        config(['i18n.supported' => ['en-US', 'ja-JP']]);
        expect(Locale::isMultilingual())->toBeTrue();
    });
});
