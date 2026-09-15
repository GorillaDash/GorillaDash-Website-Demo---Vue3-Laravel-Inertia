<?php

namespace App\Services;

use App\Enums\Locale;
use GorillaDash\WebsiteSdk\Facades\GorillaDash;
use GraphQL\Query;
use GraphQL\RawObject;
use GraphQL\Variable;
use Illuminate\Support\Collection;

/**
 * The CMS page directory: which website pages exist and what path each lives at.
 *
 * This is what makes page paths CMS-driven. Routes no longer hardcode `/locations`;
 * their first segment is a `{page}` parameter resolved here per request against the
 * GD `websitePages` list (see routes/web.php and WebsitePageController). Renaming a
 * page's slug in the CMS moves the page — and its sub-routes — with no deploy.
 *
 * Each page's *logical key* is `vue_route_name ?? slug`. The slug is the URL segment
 * and may be renamed (and differ per locale); `vue_route_name` is the stable identity
 * the code maps to a Vue component. Today's CMS records carry a null `vue_route_name`,
 * so the slug doubles as the key — which matches FALLBACK exactly. Before a client
 * renames a slug, GD must populate `vue_route_name`, or the page loses its identity.
 *
 * Reads go through GorillaDash::graphql (SWR-cached: 60s fresh, stale up to a day,
 * flushed by the /gorilla-dash/clear-cache webhook on CMS publish), so resolving a
 * request costs a local cache read, not a GraphQL round trip. Every public method is
 * total: on a fetch failure or an empty CMS result it falls back to FALLBACK rather
 * than throw — a CMS outage must degrade to the default paths, never 404 the site.
 */
class WebsitePages
{
    /**
     * Logical key => slug served when the CMS can't be read (or returns no pages).
     * Mirrors today's live CMS records — and resources/ts/lib/pagePaths.ts, which
     * carries the same map for the frontend's first render.
     */
    public const FALLBACK = [
        'homepage' => 'homepage',
        'about' => 'about',
        'menu' => 'menu',
        'order' => 'order',
        'catering' => 'catering',
        'book' => 'book',
        'locations' => 'locations',
        'our-work' => 'our-work',
        'blog' => 'blog',
        'franchise' => 'franchise',
        'contact' => 'contact',
        'faq' => 'faq',
    ];

    /**
     * Per-locale page lists grouped for slugPattern(), fetched once per instance.
     *
     * @var Collection<string, Collection<int, string>>|null
     */
    private ?Collection $slugsByKey = null;

    /**
     * Resolved page lists, memoized per locale for the life of this instance.
     *
     * The service is bound `scoped` (AppServiceProvider), so that life is one
     * request: three call sites ask for the same map on a typical page request
     * — EnsureWebsitePage resolving the `{page}` segment, the controller reading
     * the record, HandleInertiaRequests sharing `pages` — and each would
     * otherwise be its own cache round trip against a `database` cache store.
     *
     * @var array<string, list<array{key: string, slug: string, name: ?string}>>
     */
    private array $pagesByLocale = [];

    /**
     * Every website page for a locale: `['key' => ..., 'slug' => ..., 'name' => ...]`.
     *
     * @return list<array{key: string, slug: string, name: ?string}>
     */
    public function all(Locale $locale): array
    {
        return $this->pagesByLocale[$locale->value] ??= $this->resolve($locale);
    }

    /**
     * all() without the memo: the CMS list for a locale, or the defaults when the
     * fetch fails or the CMS has no pages.
     *
     * @return list<array{key: string, slug: string, name: ?string}>
     */
    private function resolve(Locale $locale): array
    {
        $pages = rescue(fn (): array => $this->fetch($locale), []);

        return $pages === [] ? $this->fallbackPages() : $pages;
    }

    /**
     * The page living at a URL segment, or null when the locale has none there.
     *
     * @return array{key: string, slug: string, name: ?string}|null
     */
    public function findBySlug(string $slug, Locale $locale): ?array
    {
        return collect($this->all($locale))->firstWhere('slug', $slug);
    }

    /**
     * A logical page's record in a locale, or null when the CMS no longer has it.
     *
     * @return array{key: string, slug: string, name: ?string}|null
     */
    public function findByKey(string $key, Locale $locale): ?array
    {
        return collect($this->all($locale))->firstWhere('key', $key);
    }

    /**
     * A route `where()` pattern for a sub-routed page: its CURRENT slug in every
     * supported locale, preg-quoted and joined (`'stores|almataajir'`), backed by
     * FALLBACK when the CMS lacks the page.
     *
     * Callers bake the result into route definitions — routes/web.php calls this
     * while registering, so the value is resolved when THAT file runs (route:cache
     * at container start / worker boot), not per request; the rename contract this
     * implies is documented there. The per-locale page lists are memoized on the
     * instance: a failing fetch costs real wall time, so asking for several patterns
     * must never fetch several times.
     */
    public function slugPattern(string $key): string
    {
        $this->slugsByKey ??= collect(Locale::supported())
            ->flatMap(fn (Locale $locale): array => $this->all($locale))
            ->groupBy('key')
            ->map(fn (Collection $pages): Collection => $pages->pluck('slug')->unique());

        return $this->slugsByKey
            ->get($key, collect([self::FALLBACK[$key]]))
            ->map(preg_quote(...))
            ->implode('|');
    }

    /**
     * Logical key => locale-free path (`['homepage' => '/', 'locations' => '/stores', ...]`).
     *
     * The homepage is pinned to `/` — its slug names its CMS content, not its URL.
     */
    public function paths(Locale $locale): array
    {
        $paths = ['homepage' => '/'];

        foreach ($this->all($locale) as $page) {
            if ($page['key'] !== 'homepage') {
                $paths[$page['key']] = '/'.$page['slug'];
            }
        }

        return $paths;
    }

    /**
     * paths() for every supported locale, keyed by URL segment — the shape of the
     * `pages` Inertia shared prop. Carrying ALL locales (not just the request's) is
     * what lets the frontend keep the map in module scope: the value is identical
     * across concurrent SSR renders. See resources/ts/lib/pagePaths.ts.
     */
    public function pathsByLocale(): array
    {
        $byLocale = [];

        foreach (Locale::supported() as $locale) {
            $byLocale[$locale->code()] = $this->paths($locale);
        }

        return $byLocale;
    }

    /**
     * The `websitePages(locale: $locale)` list, mapped to key/slug/name records.
     * Pages without a usable slug are dropped rather than allowed to break routing.
     *
     * @return list<array{key: string, slug: string, name: ?string}>
     */
    private function fetch(Locale $locale): array
    {
        $pages = GorillaDash::graphql($this->pagesQuery(), ['locale' => $locale->value])['websitePages'] ?? [];

        return collect($pages)
            ->filter(fn ($page): bool => is_array($page) && is_string($page['slug'] ?? null) && $page['slug'] !== '')
            ->map(fn (array $page): array => [
                'key' => is_string($page['vue_route_name'] ?? null) && $page['vue_route_name'] !== ''
                    ? $page['vue_route_name']
                    : $page['slug'],
                'slug' => $page['slug'],
                'name' => $page['name'] ?? null,
            ])
            ->values()
            ->all();
    }

    /** FALLBACK shaped like fetch() output, so callers never see two shapes. */
    private function fallbackPages(): array
    {
        return collect(self::FALLBACK)
            ->map(fn (string $slug, string $key): array => ['key' => $key, 'slug' => $slug, 'name' => null])
            ->values()
            ->all();
    }

    /** The list query, built with the php-graphql-client builder like BoundLocation's. */
    private function pagesQuery(): Query
    {
        return (new Query('websitePages'))
            ->setVariables([new Variable('locale', 'String')])
            ->setArguments(['locale' => new RawObject('$locale')])
            ->setSelectionSet(['name', 'slug', 'vue_route_name']);
    }
}
