<?php

namespace App\Services\Catalogue;

use App\Enums\Locale;
use App\Services\WebsitePages;
use GorillaDash\WebsiteSdk\Facades\GorillaDash;
use GraphQL\Query;
use GraphQL\RawObject;
use GraphQL\Variable;

/**
 * Every public page of the demo site, read from Gorilla Dash, for sitemap.xml and
 * llms.txt: the CMS pages, each cafe, each menu item, blog article and Our Work post.
 *
 * Reads go through the SWR-cached GorillaDash::graphql like the page routes do. Each
 * list degrades to empty on a failed read, so one unavailable query leaves the other
 * sections of the index intact rather than failing the whole file.
 */
class SiteIndex
{
    private const LIST_SIZE = 100;

    public function __construct(private readonly WebsitePages $pages)
    {
    }

    /**
     * The top-level CMS pages, homepage first.
     *
     * @return list<array{key: string, name: string, url: string}>
     */
    public function pages(): array
    {
        $locale = Locale::default();
        $names = collect($this->pages->all($locale))->pluck('name', 'key');

        return collect($this->pages->paths($locale))
            ->map(fn (string $path, string $key) => [
                'key' => $key,
                'name' => (string) ($names[$key] ?? str($key)->headline()),
                'url' => $this->url($path),
            ])
            ->values()
            ->all();
    }

    /**
     * Trading and Opening Soon cafes, the same list the location finder shows.
     *
     * @return list<array{name: string, url: string, place: string, status: string}>
     */
    public function cafes(): array
    {
        $tribes = $this->read(
            (new Query('tribes'))
                ->setVariables([new Variable('tribeType', 'String')])
                ->setArguments(['name' => new RawObject('$tribeType'), 'status' => 'launch'])
                ->setSelectionSet(['name', 'slug', 'status', 'locality', 'state_abbreviated']),
            ['tribeType' => TribeDirectory::TRIBE_TYPE],
            'tribes',
        );

        return collect($tribes)
            ->filter(fn (array $tribe) => filled($tribe['slug'] ?? null))
            ->map(fn (array $tribe) => [
                'name' => (string) ($tribe['name'] ?? $tribe['slug']),
                'url' => $this->url($this->path('locations').'/'.$tribe['slug']),
                'place' => collect([$tribe['locality'] ?? null, $tribe['state_abbreviated'] ?? null])->filter()->implode(', '),
                'status' => (string) ($tribe['status'] ?? ''),
            ])
            ->values()
            ->all();
    }

    /**
     * Menu item pages from the menus the site links.
     *
     * @return list<array{name: string, url: string, menu: string}>
     */
    public function menuItems(): array
    {
        $items = [];

        foreach (FoodMenuCatalogue::MENUS as $menuName) {
            $menu = $this->read(
                (new Query('foodMenu'))
                    ->setVariables([new Variable('name', 'String', true)])
                    ->setArguments(['name' => new RawObject('$name')])
                    ->setSelectionSet([
                        (new Query('foodMenuSections'))->setSelectionSet([
                            'slug',
                            (new Query('foodMenuListItems'))->setSelectionSet(['name', 'slug']),
                        ]),
                    ]),
                ['name' => $menuName],
                'foodMenu',
            );

            foreach ($menu['foodMenuSections'] ?? [] as $section) {
                foreach ($section['foodMenuListItems'] ?? [] as $item) {
                    if (blank($section['slug'] ?? null) || blank($item['slug'] ?? null)) {
                        continue;
                    }

                    $items[] = [
                        'name' => (string) ($item['name'] ?? $item['slug']),
                        'url' => $this->url($this->path('menu').'/'.$section['slug'].'/'.$item['slug']),
                        'menu' => $menuName,
                    ];
                }
            }
        }

        return $items;
    }

    /**
     * Published blog articles.
     *
     * @return list<array{name: string, url: string, summary: string}>
     */
    public function articles(): array
    {
        $page = $this->read(
            (new Query('articlesPagination'))
                ->setVariables([new Variable('itemsPerPage', 'Int', true)])
                ->setArguments(['status' => 'Published', 'page' => 1, 'itemsPerPage' => new RawObject('$itemsPerPage')])
                ->setSelectionSet([(new Query('data'))->setSelectionSet(['slug', 'heading', 'abstract'])]),
            ['itemsPerPage' => self::LIST_SIZE],
            'articlesPagination',
        );

        return collect($page['data'] ?? [])
            ->filter(fn (array $article) => filled($article['slug'] ?? null))
            ->map(fn (array $article) => [
                'name' => (string) ($article['heading'] ?? $article['slug']),
                'url' => $this->url($this->path('blog').'/'.$article['slug']),
                'summary' => (string) ($article['abstract'] ?? ''),
            ])
            ->values()
            ->all();
    }

    /**
     * Our Work posts.
     *
     * @return list<array{name: string, url: string}>
     */
    public function ourWork(): array
    {
        $page = $this->read(
            (new Query('organisationOurWorks'))
                ->setVariables([new Variable('itemsPerPage', 'Int', true)])
                ->setArguments(['page' => 1, 'itemsPerPage' => new RawObject('$itemsPerPage')])
                ->setSelectionSet([(new Query('data'))->setSelectionSet(['slug', 'heading'])]),
            ['itemsPerPage' => self::LIST_SIZE],
            'organisationOurWorks',
        );

        return collect($page['data'] ?? [])
            ->filter(fn (array $post) => filled($post['slug'] ?? null))
            ->map(fn (array $post) => [
                'name' => (string) ($post['heading'] ?? $post['slug']),
                'url' => $this->url($this->path('our-work').'/'.$post['slug']),
            ])
            ->values()
            ->all();
    }

    /**
     * Every URL above, for the sitemap.
     *
     * @return list<string>
     */
    public function urls(): array
    {
        return collect([...$this->pages(), ...$this->cafes(), ...$this->menuItems(), ...$this->articles(), ...$this->ourWork()])
            ->pluck('url')
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $variables
     * @return array<mixed>
     */
    private function read(Query $query, array $variables, string $root): array
    {
        return rescue(function () use ($query, $variables, $root): array {
            $data = GorillaDash::graphql($query, $variables)[$root] ?? null;

            return is_array($data) ? $data : [];
        }, [], report: false);
    }

    private function path(string $key): string
    {
        return $this->pages->paths(Locale::default())[$key] ?? '/'.(WebsitePages::FALLBACK[$key] ?? $key);
    }

    private function url(string $path): string
    {
        return rtrim((string) config('app.url'), '/').($path === '/' ? '/' : $path);
    }
}
