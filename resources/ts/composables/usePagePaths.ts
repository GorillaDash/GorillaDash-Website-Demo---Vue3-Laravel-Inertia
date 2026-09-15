import { useLocale } from '@/composables/useLocale'
import {
  cmsRoute,
  matchCmsRoute,
  pagePath,
  type CmsRouteMatch,
  type PageKey
} from '@/lib/pagePaths'
import type { CmsRouteParams } from '@/types/cmsRoutes'

/**
 * The CMS-page path builders, bound to the request's locale (read SSR-safely via
 * useLocale → useSharedProps). This is what pages and components use in place of
 * the Wayfinder helpers for the CMS-driven routes — see @/lib/pagePaths for why.
 *
 * Returned paths are locale-free; pass them to <LocaleLink> / localizedUrl exactly
 * like a Wayfinder URL. Call inside <script setup> only (it injects); a component
 * rendered detached must use @/lib/pagePaths directly with a localeCode prop.
 */
export function usePagePaths() {
  const { localeCode } = useLocale()

  return {
    pagePath: (key: PageKey): string => pagePath(key, localeCode.value),
    // Every CMS sub-route, by route name; names and param shapes are the GENERATED
    // CmsRouteParams (php artisan cms-routes:types), so vue-tsc checks both.
    cmsRoute: <N extends keyof CmsRouteParams>(name: N, params: CmsRouteParams[N]): string =>
      cmsRoute(name, params, localeCode.value),
    // The reverse: classify an app URL back to { name, params }; null when not CMS-driven.
    matchCmsRoute: (url: string): CmsRouteMatch | null => matchCmsRoute(url, localeCode.value)
  }
}
