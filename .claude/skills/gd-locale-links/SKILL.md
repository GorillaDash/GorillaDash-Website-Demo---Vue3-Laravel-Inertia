---
name: gd-locale-links
description: >-
  How to write an internal link or a programmatic navigation in this app's Vue code.
  ALWAYS use <LocaleLink> (@/components/core/LocaleLink.vue) instead of Inertia's
  <Link>, and localizedUrl() instead of a bare router.visit() — otherwise the link
  breaks on multilingual deployments. Links to the CMS pages (locations, menu, and
  their sub-routes) must additionally build their path from usePagePaths() /
  @/lib/pagePaths, never from Wayfinder or a hardcoded string — the CMS renames those
  paths at runtime. Activate whenever you add, move, or edit an anchor, a nav item, a
  card that links somewhere, a button with an href, a router.visit / router.get call,
  or anything importing `Link` from '@inertiajs/vue3' or a helper from '@/routes/*'
  or '@/actions/*'. Also activate when reviewing a .vue diff that touches links, and
  walk the "Double-checks when touching links" list before finishing. The bugs this
  prevents are invisible on the US site.
metadata:
  author: casper
---

# Internal links must be locale-aware — and CMS pages must be path-aware

Every internal link has two runtime-resolved parts, handled by two separate layers:

1. **What the path is** — for CMS pages the first segment is whatever the CMS says
   today (`/locations` may be `/stores` tomorrow, and differ per locale). Resolved by
   `usePagePaths()` / `@/lib/pagePaths` from the `pages` shared prop.
2. **Whether it carries a `/{locale}` prefix** — resolved by `<LocaleLink>` /
   `localizedUrl()`, exactly as before.

The pagePaths helpers return unprefixed paths (the same contract Wayfinder URLs have),
so their output flows into `<LocaleLink>` / `localizedUrl()` unchanged.

## The rule — where the href comes from

| What you're linking to                                | Build the path with                                              |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| A CMS page (the locations directory, or any page added since) | `usePagePaths().pagePath('locations')`                   |
| Store detail (`/{locations-slug}/{slug}`)             | `usePagePaths().cmsRoute('locations.show', { slug })`            |
| Any other CMS sub-route                               | `usePagePaths().cmsRoute('route.name', { params })`              |
| The homepage                                          | `'/'` (its URL never moves; only its content slug is CMS-driven) |
| A CMS-menu-driven nav/footer entry                    | the `menu_json` item's `path`/`url`, as the menu services return |
| A genuinely static route (`/csrf-cookie`, form POSTs) | Wayfinder helpers from `@/routes/*` / `@/actions/*`              |

**Never** import `@/routes/locations` or `@/routes/menu` — those URIs are baked at
build time and go stale the moment the CMS renames a slug. `PagePathsUsageTest`
(tests/Unit) fails the suite if one creeps back in. Hardcoded strings like
`href="/menu"` are the same bug in cheaper clothes.

## The rule — how the href is rendered

| What you're doing                            | Use                                                                                                                                            |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| A page in this app                           | `<LocaleLink :href="...">` — `@/components/core/LocaleLink.vue`                                                                                |
| A page, programmatically                     | `router.visit(localizedUrl(url))` — `localizedUrl` from `useLocale()`                                                                          |
| A page, from a component with no app context | `localizedUrl(pathFn(..., localeCode), localeCode)` — pure fns from `@/lib/localizedUrl` + `@/lib/pagePaths`, `localeCode` passed in as a prop |
| **Another locale** (the language switcher)   | a plain `<a href>` — never `<Link>`                                                                                                            |
| External URL, `mailto:`, `tel:`, `#anchor`   | a plain `<a>`, or `<AppButton external>`                                                                                                       |

`import { Link } from '@inertiajs/vue3'` belongs in exactly one file — `LocaleLink.vue`
itself. Anywhere else it is a bug.

## Double-checks when touching links

Four traps survive type-checking and look fine on the US site (audited clean
2026-07-11; the greps under "Check your work" re-verify). Walk this list for every
link you add or move — and for every link a diff you're reviewing touches:

1. **No double-wrapping.** `<LocaleLink>` calls `localizedUrl()` on its href
   internally — never hand it an already-localized string. `localizedUrl()` belongs
   in exactly two places: around a `router.visit()` URL, and in detached components.
   (A double wrap happens to be harmless — `localizedUrl` passes an already-prefixed
   URL through, `lib/localizedUrl.ts` — but that guard is defense, not an API.)

2. **Absolute URLs silently skip localization.** `localizedUrl()` leaves anything not
   starting with `/` untouched (absolute http(s), `mailto:`, `#`). Feeding an absolute
   same-site URL (`https://site.com/menu`) to `<LocaleLink>` raises no error and adds
   no prefix — the visitor silently drops out of their locale. Internal links must be
   app-relative paths, always.

3. **CMS menu items must be mapped type-aware.** A menu item carries both `path` and
   `url`; which one is the href depends on `item.type`:
   `item.type === 'Internal Url' ? item.path : item.url` — `AppHeader.vue`'s
   `toNavLink` is the reference. A url-first mapping (`item.url || item.path`) hands
   LocaleLink an absolute URL the moment GD populates both fields — trap 2 with extra
   steps. **Known divergences to fix on next touch:** `footerMenuService.ts` maps
   url-first, and `AppFooter`'s legal links render as plain `<a target="_blank">` —
   correct only while every Bottom-group item is external.

4. **External items must not render through LocaleLink.** `<LocaleLink>` is Inertia's
   `<Link>` — an SPA visit. An external URL needs a plain `<a>` (or
   `<AppButton external>`), honoring the item's `url_target`. Nav/footer loops that
   render every CMS menu item through LocaleLink are only correct while the menu
   contains no external entries — re-check when menu data changes.

## Why

**Locale prefix**: Wayfinder generates its route helpers at **build time**, and one
Docker image serves every country. So a generated URL can only ever be the canonical,
locale-free path. A multilingual deployment serves that page at `/jp/menu` (see
`routes/web.php`), and the frontend re-attaches the prefix at **runtime** — that is
all `localizedUrl()` does.

**CMS paths**: the same build-time-vs-runtime split, one level deeper. The locations
and menu routes' first segment is a `{page}` parameter resolved per request against
the GD `websitePages` list (`App\Services\WebsitePages`), so the CMS can rename
`/locations` → `/stores` — per locale — with no deploy. The server shares the current
map as the `pages` Inertia prop; `@/lib/pagePaths` mirrors it at runtime the same way
`localizedUrl` mirrors the locale. A Wayfinder helper (or hardcoded string) freezes
whatever slug existed at build time — and the Docker builder has no CMS access at all,
so it would bake fallbacks even on day one.

An unwrapped `<Link href="/menu">` still "works": `RedirectToDefaultLocale` 302s it.
But it costs an extra round trip, it hands crawlers the wrong URL, and it silently
drops the visitor out of the locale they were reading in. A stale-slug link is worse:
after a rename it is a plain 404.

**On a monolingual deployment with default slugs — every country today — both layers
are identity functions** and the URLs are byte-identical to what they always were.
That is why these bugs are invisible on the US site and why you cannot catch them by
clicking around locally with the default `.env`.

## The reverse direction — URL → route name

`matchCmsRoute(url)` (bound in `usePagePaths()`; the pure form takes a `localeCode`)
classifies an app URL back to `{ name, params }` — the inverse of `cmsRoute`/`pagePath`.
It mirrors the server's matching order, follows CMS renames, detects a `/{locale}`
prefix (multilingual only, like `localizedUrl`'s guard), and returns null for anything
not CMS-driven. The result is a discriminated union over the generated route names, so
`switch (match.name)` narrows `params`. For the top-level `page` route, `params.page`
is the logical key — `pagePath(params.page)` round-trips it. Prefer the shared props
(`usePage().component`, `locale`) when you only need to know what the CURRENT page is;
reach for `matchCmsRoute` when classifying an arbitrary URL (a CMS menu item's path,
a stored href).

## Cross-locale links are full page loads

Never route between locales with `<Link>` or `router.visit()`. The Tolgee instance is
built once per boot with a fixed language (`setupApp` in `resources/ts/inertiaApp.ts`),
and `<html lang>` is rendered by the server — an Inertia visit would swap the props and
leave both stale. `LocaleSwitcher.vue` uses plain `<a>` for exactly this reason.

`useLocale().switchUrl(code)` already maps the current page across per-locale slugs
(it runs the path through `translatePagePath` before re-prefixing) — use it rather
than rebuilding switch URLs by hand.

## Components rendered outside the app

`useLocale()` and `usePagePaths()` read `app.provide()`d values, so they only work
inside `setup()` of a component mounted in the Inertia app. A component rendered
detached — e.g. `MapInfoWindow.vue`, which `render(h(...))`s into a Google InfoWindow —
must take `localeCode` as a prop from a parent that does have context, and call the
standalone pure functions: `localizedUrl(cmsRoute('locations.show', { slug }, localeCode), localeCode)`
from `@/lib/localizedUrl` + `@/lib/pagePaths`.

## Adding a new CMS page

Three PHP-side places must agree on the logical key: `WebsitePages::FALLBACK`,
`WebsitePageController::COMPONENTS`, and the Vue page itself. The frontend needs no
hand edit — the `PageKey` union and both fallback constants are generated into
`resources/ts/types/cmsRoutes.ts` from those PHP constants (regenerate or build), and
`pagePath('yourkey')` works everywhere. Only renames are deploy-free; a new page is a
deploy.

A new **sub-route** (a keyed `page:` route in `routes/web.php`) needs no hand-written
frontend path code: its URI template rides the `cmsRoutes` shared prop straight from
the route table (`App\Services\CmsRoutes`), so `cmsRoute('your.route', { params })`
builds it immediately. The route names and param shapes vue-tsc checks are generated
into `resources/ts/types/cmsRoutes.ts` — gitignored and regenerated by vite on every
dev/build exactly like the Wayfinder output; run `php artisan cms-routes:types` to
refresh it mid-session after editing these routes. `cmsRoute` is the single entry
point for every sub-route; there are no per-route helper functions to add or maintain.

## Check your work

```bash
# 1) Only LocaleLink.vue may name-import Inertia's <Link>. Exactly one hit, or it's a bug.
#    (Don't grep for the bare word `Link` — it also matches "Banner CTA Link" in CMS
#    content keys and the word <Link> in explanatory comments.)
grep -rn "import {[^}]*\bLink\b[^}]*} from '@inertiajs/vue3'" resources/ts

# 2) Nothing may import the CMS-driven Wayfinder helpers (PagePathsUsageTest enforces this).
grep -rn "@/routes/locations\|@/routes/menu" resources/ts --include='*.vue' --include='*.ts'

# 3) Every programmatic navigation must go through localizedUrl — directly, or via a
#    computed href that already did. Read each hit; there is no purely mechanical test.
grep -rn "router\.\(visit\|get\)(" resources/ts

# 4) Every localizedUrl call site must be a router.visit() argument or a detached
#    component — NEVER a value that flows into <LocaleLink> (it localizes internally;
#    see double-check 1).
grep -rn "localizedUrl(" resources/ts --include='*.vue' --include='*.ts' \
  | grep -v 'lib/localizedUrl.ts\|composables/useLocale.ts\|LocaleLink.vue'

# 5) Hardcoded internal hrefs — the path layer must build them (double-check 2 covers
#    the absolute-URL variant, which no grep catches; read the href *sources*).
#    The trailing filter drops docblock lines that merely mention an href.
grep -rn 'href="/' resources/ts --include='*.vue' | grep -v 'href="#"' | grep -v ':[[:space:]]*\*'
```

At the time of writing, (1) returns only `LocaleLink.vue`, (2) returns nothing outside
the gitignored `resources/ts/routes/` build output, (3) returns `LocationFinder.vue`
and `MapInfoWindow.vue`, whose hrefs already ran through `localizedUrl`, (4) returns
those same two files, and (5) returns only `BrandLogo.vue`'s `href="/"` on a
LocaleLink — the homepage is the one path allowed as a literal.

To actually see a missing prefix, put the app into a multilingual state:

```bash
# .env  (local only; phpunit.xml pins en-US so the suite is unaffected)
APP_LOCALES=en-US,ar-EG
```

then `npm run build:ssr && php artisan inertia:start-ssr` and check that no unprefixed
link survives:

```bash
curl -sk https://gd-client-inertia-starter.test/ar/menu | grep -c 'href="/menu"'   # want 0
```

## Related

`resources/ts/composables/useLocale.ts` (`localizedUrl`, `switchUrl`, `isMultilingual`),
`resources/ts/composables/usePagePaths.ts`, `resources/ts/lib/pagePaths.ts`
(`translatePagePath`, the module-scope `pages` map), `resources/ts/lib/localizedUrl.ts`,
`routes/web.php`, `App\Services\WebsitePages`, `App\Services\CmsRoutes`. To add a
language, use the `add-locale`
skill.
