import { runtimeConfig } from '@/runtimeConfig'

/**
 * Prefix an app-relative URL with the active locale, e.g. `/menu` → `/jp/menu`.
 *
 * Wayfinder generates its route helpers at build time, and one image serves every
 * country, so `menu.url()` can only ever produce the canonical, locale-free path.
 * A multilingual deployment registers those same routes under a `/{locale}` prefix
 * (routes/web.php), so the prefix has to be re-attached here, at runtime, from the
 * locale the server resolved for this request.
 *
 * On a monolingual deployment — every country today — this is the identity function
 * and the URLs are byte-identical to what they were before locales existed.
 *
 * Prefer the bound `localizedUrl` from @/composables/useLocale, which supplies the
 * code from the current page's props. Reach for this directly only where there is no
 * app context to read props from (e.g. MapInfoWindow, rendered detached into a
 * Google InfoWindow).
 */
export function localizedUrl(url: string, code: string): string {
  const { locales } = runtimeConfig()

  if (locales.length < 2) {
    return url
  }

  // Absolute URLs, `mailto:`, bare `#anchor` — not ours to rewrite.
  if (!url.startsWith('/')) {
    return url
  }

  // Already prefixed: a caller that localized once and passed the result on.
  const [firstSegment] = url.slice(1).split(/[/?#]/, 1)
  if (locales.some((locale) => locale.code === firstSegment)) {
    return url
  }

  return url === '/' ? `/${code}` : `/${code}${url}`
}

/**
 * The inverse: drop a leading locale segment, leaving the canonical path.
 *
 * Used to rebuild the current page's URL under a different locale — strip, then
 * re-prefix. Leaves a URL that isn't locale-prefixed untouched.
 */
export function stripLocalePrefix(url: string): string {
  const { locales } = runtimeConfig()

  if (locales.length < 2 || !url.startsWith('/')) {
    return url
  }

  const [firstSegment] = url.slice(1).split(/[/?#]/, 1)
  if (!locales.some((locale) => locale.code === firstSegment)) {
    return url
  }

  // `/en` → `/`, `/en/menu?x=1` → `/menu?x=1`, `/en?x=1` → `/?x=1`
  const rest = url.slice(1 + firstSegment.length)

  return rest.startsWith('/') ? rest : `/${rest}`
}
