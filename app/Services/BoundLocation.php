<?php

namespace App\Services;

use GorillaDash\WebsiteSdk\Facades\GorillaDash;
use GraphQL\Query;
use GraphQL\RawObject;
use GraphQL\Variable;

/**
 * The bound store ("locked" location).
 *
 * The location detail page binds its store after mount by writing a cookie; the
 * /locations index and state pages clear it the same way. No request to the server
 * is involved, so the page GETs stay pure reads and the edge can cache them (see
 * EdgeCacheGuestPage).
 *
 * The binding used to live in the Laravel session. That worked, but the edge sends
 * every request carrying a session cookie straight to origin, so a visitor who locked
 * a store — or merely primed a CSRF token to do so — never hit the edge again for the
 * rest of their session. An independent cookie the bypass rule ignores keeps the
 * binding without that cost.
 *
 * The server still reads it, so the binding is on the very first render — SSR included
 * — via the shared `boundLocation` Inertia prop (see HandleInertiaRequests). This is
 * what the old localStorage-backed Pinia store could never do.
 *
 * Only the slug is persisted; the office is resolved on demand from the GD
 * GraphQL API (SWR-cached), so it never goes stale.
 *
 * Kept intentionally minimal — just the basics needed to show a locked store
 * site-wide (name, slug, address, email, phone). Richer per-store data (hours,
 * map, ordering, SEO) belongs to the location detail page's own query; add
 * fields here only when a shared surface (header/footer/home) needs them.
 */
class BoundLocation
{
    /**
     * Cookie holding the bound store's slug.
     *
     * Deliberately NOT `*-session`: the edge's bypass rule matches
     * `http.cookie contains "-session="` and sends those straight to origin
     * (deploy/cloudflare/rules.sh), so keeping the binding in the session cost the
     * visitor the edge cache for the rest of their visit — on every page, not just the
     * personalized ones. The name must keep failing that expression.
     *
     * Written by the browser (see resources/ts/lib/boundLocation.ts), so it is excluded
     * from EncryptCookies. The value is only a slug: a tampered one either resolves to
     * some other public store or to nothing, which is what the visitor could have done
     * by clicking anyway.
     */
    public const COOKIE = 'gd_store';

    /** A GD store slug: lowercase alphanumerics and hyphens. Anything else is not ours. */
    private const SLUG_PATTERN = '/^[a-z0-9](?:[a-z0-9-]{0,118}[a-z0-9])?$/';

    /** The basic identity fields shared surfaces need. */
    private const TRIBE_FIELDS = [
        'name',
        'slug',
        'public_email',
        'main_telephone',
        'address_1',
        'address_2',
        'locality',
        'state',
        'country',
        'postal_code',
    ];

    /**
     * The bound slug, or null when nothing is bound.
     *
     * Read from the request each call rather than cached on this instance: under Octane
     * the service may outlive the request that constructed it.
     */
    public function slug(): ?string
    {
        $slug = request()->cookie(self::COOKIE);

        if (! is_string($slug) || preg_match(self::SLUG_PATTERN, $slug) !== 1) {
            return null;
        }

        return $slug;
    }

    /**
     * The currently-bound store, resolved to the office shape, or null when
     * nothing is bound (or the bound slug no longer resolves).
     *
     * @return array<string, mixed>|null
     */
    public function current(): ?array
    {
        $slug = $this->slug();

        return $slug === null ? null : $this->find($slug);
    }

    /**
     * Resolve a store by slug via the GD GraphQL API (SWR-cached) and map it to
     * the office shape. Null when the slug matches no store. Exceptions bubble
     * so callers can tell a definitive miss from a lookup failure.
     *
     * @return array<string, mixed>|null
     */
    public function find(string $slug): ?array
    {
        $tribe = GorillaDash::graphql($this->tribeQuery(), ['slug' => $slug])['tribe'] ?? null;

        return is_array($tribe) ? $this->mapTribe($tribe) : null;
    }

    /**
     * The `tribe(slug: $slug)` query, built with the php-graphql-client Query
     * builder (see the SDK README) rather than a raw string.
     */
    private function tribeQuery(): Query
    {
        return (new Query('tribe'))
            ->setVariables([new Variable('slug', 'String', true)])
            ->setArguments(['slug' => new RawObject('$slug')])
            ->setSelectionSet(self::TRIBE_FIELDS);
    }

    /**
     * Map a raw GraphQL tribe onto the basic office shape shared with the frontend.
     *
     * @param  array<string, mixed>  $tribe
     * @return array<string, mixed>
     */
    private function mapTribe(array $tribe): array
    {
        return [
            'name' => $tribe['name'] ?? null,
            'slug' => $tribe['slug'] ?? null,
            'email' => $tribe['public_email'] ?? null,
            'phone' => $tribe['main_telephone'] ?? null,
            'address_1' => $tribe['address_1'] ?? null,
            'address_2' => $tribe['address_2'] ?? null,
            'locality' => $tribe['locality'] ?? null,
            'state' => $tribe['state'] ?? null,
            'country' => $tribe['country'] ?? null,
            'postal_code' => $tribe['postal_code'] ?? null,
        ];
    }
}
