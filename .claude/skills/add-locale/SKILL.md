---
name: add-locale
description: >-
  Add a new language/locale to this site, or enable an existing one for a country.
  Activate when the user says anything like "add Japanese", "support Spanish", "新增語系",
  "enable ar-EG", "this country needs two languages", or asks which locales are
  available. Covers App\Enums\Locale, config/i18n.php, APP_LOCALES, the TypeScript
  locale enum, the Tolgee CDN and GD CMS prerequisites, and how to verify the result
  end to end. Do NOT hand-edit routes, LocaleLink, or the Tolgee plugin — adding a
  locale is data, not new machinery.
metadata:
  author: casper
---

# Adding a locale

Adding a language is a **data** change. The routing, link prefixing, `<html lang>`,
switcher and GraphQL `locale` argument all derive from the locale set — do not touch
`routes/web.php`, `localizedUrl.ts` or `plugins/tolgee.ts`.

## Ask for three things first

|                  | Example  | Where it's used                                                                                               |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| **Language tag** | `ja-JP`  | Tolgee language, GD GraphQL `locale` argument, `<html lang>`. It is the enum's backing value.                 |
| **URL segment**  | `jp`     | `/jp/locations`. Deliberately _not_ the tag — the user picks it, and it need not be valid BCP-47 (`ja-JP` → `jp`). |
| **Native label** | `日本語` | What the language switcher shows. In the language itself, never in English.                                   |

Then: **which deployments get it?** A locale in the enum is not enabled anywhere until a
country's `config.env` lists it.

## Prerequisites — check before writing code

```bash
# 1. Does Tolgee publish this language? 200 = yes.
curl -s -o /dev/null -w '%{http_code}\n' "$TOLGEE_CDN_URL/ja-JP.json"
```

A 403/404 means the language exists in Tolgee but is not published. Nothing breaks — every
`t()` key falls back to its inline English default — but the site will look untranslated.
Say so rather than shipping it silently.

The GD CMS is the second half: `websitePage`, `websiteMenu`, `foodMenu` etc. take a
`locale` argument and **return the default language for an unknown locale, without an
error**. So a missing CMS translation is also silent. Verify with the client that content
exists for the tag.

## The edits

**1. `app/Enums/Locale.php`** — the single source of truth.

```php
case JaJp = 'ja-JP';   // backing value = the language tag
```

Then add the case to `code()` and `label()`. Both are `match ($this)` with no `default`,
so a forgotten arm throws `\UnhandledMatchError` on the first request rather than
silently defaulting. Two locales may share a `code()` (`en-US` and `en-AU` both use `en`)
as long as no single deployment serves both — `AppServiceProvider::assertLocalesAreValid()`
fails the boot if they collide.

**2. `resources/ts/constants/i18nLocales.ts`** — add the matching enum member:

```ts
jaJP = 'ja-JP'
```

This is types only. The _active_ set reaches the frontend at runtime as
`page.props.config.locales`, so nothing here enumerates what a deployment serves.

**3. Enable it per deployment** — in that country's `config.env` (not `.env.example`,
which stays `en-US`):

```
APP_LOCALES=en-US,ja-JP
```

Comma-separated; **the first entry is the default locale**. One entry means the deployment
is monolingual: no `/{locale}` prefix, no switcher, URLs unchanged. Two or more turns both
on. An entry that isn't an enum value fails the boot loudly, by design.

**4. Tests** — extend the enum expectations in `tests/Feature/LocaleRoutingTest.php`
(`maps language tags to short URL segments`). The routing tests are locale-agnostic and
need no change.

## Verify

```bash
# Local: pretend to be the multilingual deployment.
perl -pi -e 's{^APP_LOCALES=.*}{APP_LOCALES=en-US,ja-JP}' .env
php artisan config:clear && npm run build:ssr
php artisan inertia:start-ssr &
```

Then confirm, in order:

```bash
# / redirects to the default locale, and the edge may cache the hop
curl -sk -o /dev/null -D - https://gd-client-inertia-starter.test/ | grep -i 'location\|surrogate'

# the new locale renders, in the right language
curl -sk https://gd-client-inertia-starter.test/jp/locations | grep -o 'lang="[^"]*"' | head -1

# SSR HTML is not blank (a cold Tolgee cache used to blank it — see plugins/tolgee.ts)
curl -sk https://gd-client-inertia-starter.test/jp/locations | grep -c '<main'   # want 1

# every link is prefixed, none leak
curl -sk https://gd-client-inertia-starter.test/jp/locations | grep -c 'href="/locations"'   # want 0

# CMS content is fetched in the new locale — Apollo's cache key holds the query args,
# and the SSR page inlines that cache as window.__APOLLO_STATE__
curl -sk https://gd-client-inertia-starter.test/jp/locations \
  | grep -o '\\"locale\\":\\"[a-zA-Z-]*\\"' | sort | uniq -c    # want only ja-JP
```

Finish with `php artisan test --compact && npm run types:check`, and **restore `.env`**
to the deployment's real value.

## Things that will bite you

- **Right-to-left languages** (`ar`, `he`, `fa`, `ur`) are not supported yet. `<html dir>`
  is never set and the Tailwind classes are physical (`pl-*`, `left-*`), not logical. The
  page will render, mirrored wrong. Tell the user this is its own project; don't bolt it on.
- **Never add `{locale}` to the canonical route group** in `routes/web.php`. Wayfinder
  bakes route URIs into the frontend bundle at build time, and one image serves every
  country — a `{locale}` parameter there turns `menu.url()` into `menu.url({ locale })`
  and every page crashes under SSR. The prefixed group is registered _in addition_, under
  a `locale.` name prefix.
- **`phpunit.xml` pins `APP_LOCALES=en-US`.** Routes are registered at boot, so without
  the pin a developer's bilingual `.env` turns every page assertion into a 302. Leave it.
- **`foodMenuListItem` and `tribes` take no `locale` argument** in GD's schema. A single
  menu item's detail page renders the default language. That's an API gap, not a bug here.
- Store names, addresses and phone numbers are never translated — `App\Services\BoundLocation`
  deliberately omits `locale` so its SWR cache isn't fragmented per language.

## Related

`add a link` → the `gd-locale-links` skill. Architecture lives in `app/Enums/Locale.php`,
`config/i18n.php`, `app/Http/Middleware/SetLocale.php`, `routes/web.php`,
`resources/ts/composables/useLocale.ts`, `resources/ts/plugins/tolgee.ts`.
