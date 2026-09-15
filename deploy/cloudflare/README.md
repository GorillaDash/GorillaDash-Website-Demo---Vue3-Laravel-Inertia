# Edge HTML cache (Cloudflare)

Cloudflare fronts this origin: it terminates TLS, holds a shared copy of anonymous HTML,
and is what keeps SSR off the critical path for most visitors. The origin's half of the
contract is `App\Http\Middleware\EdgeCacheGuestPage` + `App\Http\EdgeCacheGrant`; this
directory is the edge's half.

| Piece        | Where                                                        |
| ------------ | ------------------------------------------------------------ |
| Origin grant | `Cloudflare-CDN-Cache-Control` / `Cache-Tag`                  |
| Edge logic   | Cache Rules (`http_request_cache_settings`)                   |
| Deployed by  | `apply-rules.sh` (deploy step 5c, and the merge workflow)     |
| Purge        | `POST .../purge_cache` `{"tags":["html"]}` (hard, no soft purge) |
| Cache state  | `cf-cache-status: HIT`                                        |

## Deploying

```bash
CLOUDFLARE_API_TOKEN=... ./deploy/cloudflare/apply-rules.sh acme-usa.gorilladashstaging.com
CLOUDFLARE_API_TOKEN=... ./deploy/cloudflare/apply-rules.sh --dry-run <host>   # show, don't write
./deploy/cloudflare/verify-rules.sh <host>                                     # probes only, no token
```

The token needs **Cache Settings Write** on the zone. The zone id is discovered from the
host, so there is nothing per-country to configure.

## The rules, and why they are in that order

`rules.sh` is the single definition, read by both the apply and the verify script so the
rules being written and the rules being checked can never be two different opinions.

**Cache Rules stack — the LAST matching rule wins**, which is the opposite of the
first-match-wins intuition and the single easiest thing to get wrong here:

| #   | `ref` suffix          | What it does                                                                                 |
| --- | --------------------- | -------------------------------------------------------------------------------------------- |
| 1   | `cache_html`          | Makes the host's HTML eligible; `edge_ttl: respect_origin` leaves the decision to the origin |
| 2   | `bypass_personalized` | …except a session cookie or `X-Inertia` — **overrides 1**                                    |
| 3   | `bypass_debug`        | …or `?debug=1` / `?__fresh=` — **overrides 1**                                               |
| 4   | `cache_build_assets`  | …but `/build/` is fingerprinted, so cache a year for everyone — **overrides 2 and 3**        |

`respect_origin` rather than `override_origin` is deliberate. `EdgeCacheGuestPage` decides
per response whether a render is shareable; overriding the origin would cache what it
deliberately refused, and would flatten `robots.txt`'s 3600s onto a page's 120s.

## Two things a VCL edge would let you get away with

**Cloudflare ignores `Vary` outside `Accept-Encoding`.** A VCL edge has two gates —
`vcl_recv` passes personalized requests _and_ `vcl_fetch` only caches what carries the
grant. Here rule 2 is the only gate. Withholding the origin grant does **not** on its own
keep a personalized page out of the cache, so that expression is load-bearing in a way a
VCL counterpart would not be. Never treat `EdgeCacheGuestPage` as sufficient by itself.

**The entrypoint ruleset is zone-wide.** There is no per-hostname ruleset, and a shared
zone like `gorilladashstaging.com` carries other GorillaDash sites, so a plain `PUT` of
our rules would delete theirs. `apply-rules.sh` merges: rules whose `ref` starts with this
host's prefix are ours to replace, everything else is read back and rewritten untouched.
It also warns if a foreign rule's expression mentions our host, since a rule sitting after
ours could override us.

## Verification is part of applying

A bypass expression that never matches fails **silently**: the API accepts it, the
dashboard renders it, and the only symptom is a logged-in or flash-carrying render quietly
becoming the copy every visitor gets. So `apply-rules.sh` runs `verify-rules.sh` against
the live host after writing and **rolls back to the previous ruleset** if any probe fails.

```
anonymous page   -> HIT / MISS / EXPIRED / REVALIDATED    (cacheable at all)
session cookie   -> DYNAMIC / BYPASS
X-Inertia        -> DYNAMIC / BYPASS
?debug=1         -> DYNAMIC / BYPASS
?__fresh=        -> DYNAMIC / BYPASS
```

The first probe runs first on purpose: if the page never caches, every "DYNAMIC" below it
would pass for the wrong reason.

## Settled: `Cloudflare-CDN-Cache-Control` does beat `Cache-Control: private`

The origin sends `Cache-Control: no-cache, private` (for browsers) alongside
`Cloudflare-CDN-Cache-Control: max-age=120` (for the edge), and Cloudflare's docs
disagree with themselves about which wins: the [header precedence
table](https://developers.cloudflare.com/cache/concepts/cdn-cache-control/) says the
CDN-specific header does, while the [BYPASS
conditions](https://developers.cloudflare.com/cache/concepts/cache-responses/#bypass)
list a bare `private` as blocking and name only two exceptions, neither of them that
header.

**Measured on a real zone (2026-09-03): the precedence table is right.** With
`edge_ttl: respect_origin` and no other intervention, the page answers
`cf-cache-status: HIT` with `age` climbing, while the browser still receives
`Cache-Control: no-cache, private` unchanged:

```
cache-control: no-cache, private
age: 29
cf-cache-status: HIT
```

So no Cache Response Rule is needed to strip the directive, and — more importantly —
the origin keeps deciding. `EdgeCacheGuestPage` withholding the grant is what stops a
page being cached. Had this gone the other way, the fix would have been an
`http_response_cache_settings` rule dropping the directive before the cache decision,
never a weaker `Cache-Control` at the origin.

## Known gap

**`/build/` assets get `max-age=31536000` but not `immutable`.** A Cache Rule's
`browser_ttl` emits a max-age and nothing else. The practical cost is a revalidation on
reload. Closing it needs a Response Header Transform Rule, which is a separate phase from
these.

## Where this runs

Three paths, all running the same drift-aware script:

1. **Merge to main** — the `cloudflare-rules` workflow triggers on changes under
   `deploy/cloudflare/` and converges every host declared in any overlay's
   `CLOUDFLARE_HOSTS`. Rule changes ship by PR, no app deploy needed. Needs the
   `CLOUDFLARE_API_TOKEN` repo secret.
2. **Every app deploy** — `deploy.sh` step 5a converges this country's hosts before
   purging (step 5b), so origin and edge cannot drift apart. Non-fatal: an edge never
   blocks a release.
3. **By hand** — the commands above.

A red `cloudflare-rules` run does **not** mean the rules were not applied. It means
they were applied, probed, judged wrong, and reverted — the zone is as it was. Fix the
expression in `rules.sh` and merge again.

Everything is guarded on the credentials resolving, so a fresh clone with no Cloudflare
zone yet skips both deploy steps and makes no API call at all. Run directly with no
token, the scripts exit 1 before their first request rather than half-doing something.
`verify-rules.sh` needs no credential — it only probes the public host.
