/**
 * Pure helpers behind SeoHead: absolute URLs, hreflang alternates and the
 * serialisation of a JSON-LD document.
 *
 * No Vue, no aliases and no runtime config in here — the composable layer passes
 * everything in — so the module runs under plain tsx and its behaviour suite
 * (tests/js/seo.test.ts) executes inside Pest without a build.
 *
 * ⚠ What is deliberately NOT here: the schema.org BUILDERS. A `Restaurant` with its
 * opening hours, a `Menu`, a `NewsArticle` — those are one client's vocabulary, and
 * the starter would only make the next client delete them. `SeoHead`'s `jsonLd` is a
 * prop, so a client assembles its own document in its own module and passes it in;
 * `JsonLd` below is the shape to return. TheGreatGreek's `resources/ts/lib/seo.ts` is
 * the worked example (restaurant + menu + article), typed with `schema-dts` so a
 * property that does not exist on a type fails vue-tsc instead of shipping quietly.
 */
import type { Graph } from 'schema-dts'

/**
 * A schema.org document as SeoHead takes it: a `@graph`, or one node with its
 * `@context`. Deliberately not `WithContext<Thing>` — that union of every
 * schema.org type is too large for Vue's defineProps to resolve. A client's
 * builders return the precise `WithContext<RestaurantLeaf>` etc., which narrow to this.
 */
export type JsonLd = Graph | { readonly '@context': 'https://schema.org'; readonly '@type': string }

/** The two things the `<head>` needs from each locale for `rel="alternate"`. */
export type HreflangLink = {
  hreflang: string
  href: string
}

/**
 * `https://site.com` + `/menu` → `https://site.com/menu`. Passes an absolute URL
 * through untouched, and yields the bare path when no site URL is known (a
 * unit-test render) rather than a broken `null/menu`.
 */
export function absoluteUrl(siteUrl: string | null | undefined, path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const base = (siteUrl ?? '').replace(/\/+$/, '')

  if (!base) {
    return path
  }

  return path === '/' ? `${base}/` : `${base}${path.startsWith('/') ? path : `/${path}`}`
}

/** Drop the query string and fragment: `/menu?x=1#top` → `/menu`. */
export function pathOnly(url: string): string {
  return url.split(/[?#]/, 1)[0] || '/'
}

/**
 * One `rel="alternate"` per locale plus `x-default` for the deployment's default
 * (its first locale), each pointing at this page under that locale. Empty on a
 * monolingual deployment, where there is nothing to alternate between.
 */
export function hreflangLinks(
  siteUrl: string | null | undefined,
  locales: ReadonlyArray<{ value: string; code: string }>,
  urlForLocale: (code: string) => string
): HreflangLink[] {
  if (locales.length < 2) {
    return []
  }

  const links = locales.map((locale) => ({
    hreflang: locale.value,
    href: absoluteUrl(siteUrl, pathOnly(urlForLocale(locale.code)))
  }))

  return [...links, { hreflang: 'x-default', href: links[0].href }]
}

/** `en-US` → `en_US`, the form Open Graph wants for `og:locale`. */
export function openGraphLocale(languageTag: string): string {
  return languageTag.replace('-', '_')
}

/**
 * JSON for an inline `<script type="application/ld+json">`. `<` is escaped so a
 * `</script>` inside CMS copy can never close the tag early — the same guard
 * ssr.ts applies to the state it inlines.
 */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
