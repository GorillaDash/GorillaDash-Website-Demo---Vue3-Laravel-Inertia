# Edge HTML cache (Cloudflare)

Cloudflare fronts this origin: it terminates TLS, holds a shared copy of anonymous HTML,
and is what keeps SSR off the critical path for most visitors. The origin's half of the
contract is `App\Http\Middleware\EdgeCacheGuestPage` + `App\Http\EdgeCacheGrant`; this
directory is the edge's half.

| Piece        | Where                                                            |
| ------------ | ---------------------------------------------------------------- |
| Origin grant | `Cloudflare-CDN-Cache-Control` / `Cache-Tag`                     |
| Edge logic   | Cache Rules (`http_request_cache_settings`)                      |
| Deployed by  | `apply-rules.sh` (deploy step 5c, and the merge workflow)        |
| Purge        | `POST .../purge_cache` `{"tags":["html"]}` (hard, no soft purge) |
| Cache state  | `cf-cache-status: HIT`                                           |

## Deploying

```bash
CLOUDFLARE_API_TOKEN=... ./deploy/cloudflare/apply-rules.sh hungry-gorilla-usa.gorilladashstaging.com
CLOUDFLARE_API_TOKEN=... ./deploy/cloudflare/apply-rules.sh --dry-run <host>   # show, don't write
./deploy/cloudflare/verify-rules.sh <host>                                     # probes only, no token
```

The token needs **Cache Settings Write** on the zone, and writing needs `gcloud` with
write access to the lock bucket (see below) — `--dry-run` needs neither. The zone id is discovered from the
host, so there is nothing per-country to configure.

## The rules, and why they are in that order

`rules.sh` is the single definition of the rules; `verify-rules.sh` checks their
behaviour from outside rather than re-reading them.

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
zone like `gorilladashstaging.com` carries sites that are not GD's, so a plain `PUT` of
our rules would delete theirs. `apply-rules.sh` merges: rules whose `ref` starts with
`gd_shared_` are ours to replace, everything else is read back and rewritten untouched.
It also warns if a foreign rule's expression mentions one of our hosts, since a rule
sitting after ours could override us.

## One set of rules per zone, shared by every GD host

Every GD client gets byte-identical rules — only the host differs — and the zone's plan
caps its cache rules (10 on `gorilladashstaging.com`). With four rules per host that cap
was hit at the third client (`exceeded the maximum number of rules … 13 out of 10`). So
the four rules (`gd_shared_cache_html`, `…_bypass_personalized`, `…_bypass_debug`,
`…_cache_build_assets`) each match a host SET, `http.host in {"a" "b" …}`, and a new
client adds its host to the set instead of four rules to the zone.

- **Adding is the default; removing is explicit.** `apply-rules.sh <host>` reads the set
  back from the zone and adds to it, so it never drops another client's host.
  Decommission a host with `apply-rules.sh --remove <host>`.
- **Migration is automatic.** A host still carrying the old per-host rules (all four
  `gd_<host>_*` refs) is folded into the set and those rules deleted, by whichever repo's
  run gets there first. A host with only some of them is not a shape this script wrote,
  so it is left alone as somebody else's.
- **One writer at a time.** The write is read-modify-write of the whole ruleset, and every
  GD client repo runs it against the same zone — GitHub's `concurrency` cannot serialize
  that, it is per repo. Two overlapping runs would each write back the set they read and
  the later would silently drop the earlier's host. So each run first takes a lock: an
  object at `gs://gorilla-dash-178800_cloudbuild/locks/cloudflare-cache-rules/<zone>.lock`
  created with `--if-generation-match=0`, which only one of two simultaneous creators can
  win. Others wait (up to `CLOUDFLARE_LOCK_WAIT_SECONDS`, 300); a lock older than
  `CLOUDFLARE_LOCK_STALE_SECONDS` (600) is a run that died holding it and is broken.
  `CLOUDFLARE_LOCK_BUCKET` overrides the bucket. Locally that is your `gcloud` login; in
  CI it is `github-deployer` (`roles/storage.admin`), which is why the workflow
  authenticates to Google Cloud.
- **The expression has a ceiling** — 4096 characters, roughly a hundred hosts per zone.

## Verification is part of applying

A bypass expression that never matches fails **silently**: the API accepts it, the
dashboard renders it, and the only symptom is a logged-in or flash-carrying render quietly
becoming the copy every visitor gets. So `apply-rules.sh` runs `verify-rules.sh` against
every host whose rules it changed after writing and **rolls back to the previous ruleset** if any probe fails.

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
