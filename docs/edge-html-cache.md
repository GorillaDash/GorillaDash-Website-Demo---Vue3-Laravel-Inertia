# Edge HTML caching

The SSR render is the single biggest lever on both PageSpeed and capacity: without an
edge cache every request pays a full Inertia SSR render (document TTFB ~0.5–0.9s, a
throughput ceiling of a few RPS per pod). This is how that render is skipped for the
visitors who don't need a personalized one — which is nearly all of them.

**The edge is Cloudflare.** Its half of the contract — the Cache Rules, how they stack,
how they are applied and verified — is `deploy/cloudflare/README.md`. This document is
the origin's half: which responses are shareable, and why the app is shaped so that
almost all of them are.

> Do not confuse this with the CDN that serves images. `cdn.gorilladash.com` is
> GorillaDash's shared static-asset CDN (Fastly, with Image Optimizer) and is unrelated
> to the HTML edge — see `resources/ts/services/imageOptimizationService.ts`.

## The design: one shared copy for everyone

Every public route is a `GET` that only reads. There is no auth, no form, no session
write on a page render — so an anonymous visitor's HTML is byte-identical to every other
anonymous visitor's, and the edge can serve one copy.

Two things had to move for that to be true:

- **The bound store** ("locked location") is a `Inertia::defer()` prop, so it is not in
  the initial HTML at all. A visitor who has locked a store gets the same shared copy as
  everyone else and fills their store in with a partial reload after mount. (The earlier
  design baked it into the SSR HTML and bypassed the cache for those visitors — which
  cost the whole session's page views, not just the one. See
  `docs/session-bound-location.md`.)
- **The session cookie** is withheld from guests whose session holds nothing
  (`DropEmptyGuestSession`). Laravel's `StartSession` otherwise sets one on every `web`
  response, and the edge treats its presence as "personalized, go to origin" — so a
  guest who clicked a single SPA link would have left the cache for the rest of their
  visit.

## The origin's half

| Piece                                        | Role                                                                                   |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `App\Http\Middleware\EdgeCacheGuestPage`      | Decides per response whether a render is shareable, and stamps the grant + purge keys  |
| `App\Http\EdgeCacheGrant`                     | The one place that spells that grant in the edge's header vocabulary                   |
| `App\Http\Middleware\DropEmptyGuestSession`   | Keeps an ordinary guest cookie-free so the edge's bypass rule never matches them        |
| `App\Http\Middleware\RedirectToDefaultLocale` | Grants the `/` → `/{locale}` hop its own (longer) TTL — it is a 302, so the above skips it |
| `App\Http\Controllers\RobotsController`       | `robots.txt`, granted an hour rather than a page's two minutes                          |

A response is granted a shared copy only when it is a full-document `200` `GET`, for a
visitor with no auth and no flashed session state, without `X-Inertia` and without
`?debug=1`. Everything else is silently ungranted — see `EdgeCacheGuestPage::cacheable()`
and `tests/Feature/EdgeCacheGuestPageTest.php`, which pins each of those cases.

**Withholding the grant is only half the protection.** Cloudflare ignores `Vary` outside
`Accept-Encoding`, so the edge's own bypass rules are what actually keep a personalized
response out of the shared cache. Never treat `EdgeCacheGuestPage` as sufficient on its
own; if you add a personalized response shape, add the matching bypass in
`deploy/cloudflare/rules.sh`.

## Purge keys

Each cacheable response carries keys from widest to narrowest: `html`, the logical route
name, then one key per route parameter, cumulative.

```
/locations/vestavia-hills-al
  -> html, locations.show, locations.show:vestavia-hills-al
```

So a purge can be as wide or as narrow as the change: everything (what `deploy.sh` runs
after a rollout), one route, or one store after a CMS publish. The keys are
rename-invariant and locale-invariant — a CMS slug rename or a second language does not
change them, because the route's logical name is used rather than its URL. See
`docs/cms-dynamic-page-paths.md`.

## Deploys and the version-skew window

A deploy changes the asset hashes the HTML references, so cached pre-deploy HTML would
send visitors to JS that no longer exists. `deploy.sh` purges the `html` key right after
the rollout for exactly that reason, and reports loudly when it could not.

The recovery path still has to exist for the window in between: an Inertia GET whose
asset version is stale `409`s, and `HandleInertiaRequests::onVersionChange` sends the
client to the same URL with `?__fresh=<version>`. The edge's `bypass_debug` rule sends
that request to origin, so the recovery reload cannot be answered with the same stale
HTML that caused the 409. `tests/Feature/InertiaVersionSkewTest.php` pins this.

## CMS publishes

The GD content webhook (`/gorilla-dash/clear-cache`) flushes the app's SWR cache today.
When a CMS publish should also drop the edge's copy, it should purge the NARROW per-page
tag rather than `html`: Cloudflare has no soft purge, so a broad purge evicts and sends
the next request for every affected page back to origin as a full SSR render at once.
