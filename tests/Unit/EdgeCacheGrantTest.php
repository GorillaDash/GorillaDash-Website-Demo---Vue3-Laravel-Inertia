<?php

use App\Http\EdgeCacheGrant;

/*
 * The grant is one token list rendered into the edge's vocabulary, and the rendering
 * has a failure mode that reports nothing: Cloudflare splits Cache-Tag on commas and
 * DISCARDS any tag containing a space, silently. A response would still be cached,
 * just under fewer tags than intended, and the purge that was supposed to clear it
 * would quietly do nothing. So the separator is pinned here rather than inferred from
 * whichever caller happens to be under test.
 */

test('the key list is spelled for the edge in front of the origin', function () {
    $headers = EdgeCacheGrant::headers(120, ['html', 'locations.show', 'locations.show:vestavia-hills-al']);

    expect($headers)->toBe([
        'Cloudflare-CDN-Cache-Control' => 'max-age=120',
        'Cache-Tag' => 'html,locations.show,locations.show:vestavia-hills-al',
    ]);
});

test('every key survives the rendering, in order', function (int $ttl, array $keys) {
    $headers = EdgeCacheGrant::headers($ttl, $keys);

    expect(explode(',', $headers['Cache-Tag']))->toBe($keys);
    expect($headers['Cloudflare-CDN-Cache-Control'])->toBe("max-age={$ttl}");
})->with([
    'a page' => [120, ['html', 'home']],
    'robots.txt, held far longer' => [3600, ['html', 'robots']],
    'the locale redirect' => [3600, ['html', 'locale-redirect']],
    'a single key' => [120, ['html']],
]);

/*
 * Cache-Control is addressed to browsers, not to the CDN, and must survive the grant
 * untouched — a page granted to the edge is still one no browser may store.
 */
test('the grant never speaks for Cache-Control', function () {
    expect(EdgeCacheGrant::headers(120, ['html']))->not->toHaveKey('Cache-Control');
});
