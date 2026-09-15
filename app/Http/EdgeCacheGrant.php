<?php

namespace App\Http;

/**
 * The one place that spells a cache grant for the CDN in front of this origin.
 *
 * That CDN is Cloudflare (see deploy/cloudflare/), which consumes
 * Cloudflare-CDN-Cache-Control/Cache-Tag and strips both before the response reaches
 * the browser. With no edge in front (local dev, tests) they are inert.
 *
 * It is a class rather than two `->headers->set()` calls in the middleware because the
 * key list has a shape contract that fails SILENTLY when it is broken, and because a
 * second edge is a real possibility (this is a template): every CDN spells the same
 * grant differently, and putting a second one in front of a client site should be one
 * edit here, not a hunt through the middleware. For reference, Fastly's spelling of
 * the identical grant is
 *
 *   Surrogate-Control: max-age=120
 *   Surrogate-Key:     html locations.show locations.show:vestavia-hills-al   (spaces)
 *
 * against Cloudflare's
 *
 *   Cloudflare-CDN-Cache-Control: max-age=120
 *   Cache-Tag:                    html,locations.show,locations.show:vestavia-hills-al   (commas)
 *
 * — and the separator is the trap. A Cache-Tag value containing a space is not an
 * error: Cloudflare drops the invalid tag at storage time and caches the response
 * under whatever tags remain, with no way to detect which were discarded. A purge then
 * quietly clears nothing. Building every header from one token list is what keeps that
 * from drifting.
 */
final class EdgeCacheGrant
{
    /**
     * Headers granting the edge a shared, purgeable copy for `$ttl` seconds.
     *
     * `Cache-Control` is deliberately NOT touched. It stays no-cache/private so that
     * browsers and any intermediary that is not our edge never store a copy — the
     * grant is addressed to the CDN alone.
     *
     * Note that Cloudflare may still decline: its documented BYPASS conditions list a
     * bare `private` in Cache-Control as blocking, and do not name
     * Cloudflare-CDN-Cache-Control among the exceptions, even though the header
     * precedence table says the CDN-specific header wins. Which behaviour is real has
     * to be settled by observation once the zone has Cache Rules; if it does block, the
     * fix belongs at the edge (a Cache Rule Edge TTL override, or a Cache Response Rule
     * dropping the directive before the cache decision) rather than here — weakening
     * Cache-Control would hand the page to browsers too.
     *
     * @param  list<string>  $keys  Purge keys, widest first. Each must be a printable
     *                              ASCII token with no whitespace and no comma.
     * @return array<string, string>
     */
    public static function headers(int $ttl, array $keys): array
    {
        return [
            'Cloudflare-CDN-Cache-Control' => "max-age={$ttl}",
            'Cache-Tag' => implode(',', $keys),
        ];
    }
}
