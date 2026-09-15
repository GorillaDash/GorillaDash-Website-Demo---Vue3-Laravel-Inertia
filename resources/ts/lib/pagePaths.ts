/**
 * Where each CMS page lives, per locale — the frontend's runtime replacement for
 * Wayfinder on the CMS-driven routes.
 *
 * Wayfinder bakes URIs into the bundle at build time, but these pages' paths are
 * whatever the GD CMS says today (rename the locations page's slug to `stores` and
 * `/locations` becomes `/stores`, per locale, with no rebuild — see routes/web.php
 * and App\Services\WebsitePages). So links to them are built here instead, from two
 * Inertia shared props: `pages` — `{ en: { homepage: '/', locations: '/stores', ... } }`
 * — and `cmsRoutes`, the sub-routes' URI templates straight from the server's route
 * table (App\Services\CmsRoutes), which cmsRoute() resolves by route name.
 *
 * Holding the map in module scope is SSR-safe for the same reason runtimeConfig is:
 * the prop carries EVERY locale (not the request's), so concurrent SSR renders all
 * set an identical value. That is a load-bearing property — do not slim the prop
 * down to the current locale, or renders will read each other's paths.
 *
 * Paths are locale-free, exactly like Wayfinder URLs: LocaleLink / localizedUrl
 * attach the `/{locale}` prefix. Prefer the bound helpers from
 * @/composables/usePagePaths, which supply the code from the current page's props;
 * call these directly only without app context (e.g. MapInfoWindow, rendered
 * detached into a Google InfoWindow).
 */

// The generated module (php artisan cms-routes:types): the CmsRouteParams types AND
// the two fallback constants, all rendered from the server's route table + PHP
// constants — nothing here is hand-mirrored anymore. Imported RELATIVELY on purpose:
// this is a runtime import, and the relative path resolves identically under vite,
// vue-tsc, and the tsx-run behavior suite (tests/js) with no alias machinery.
import {
  CMS_ROUTE_FALLBACK,
  PAGE_PATH_FALLBACK,
  type CmsRouteParams,
  type PageKey
} from '../types/cmsRoutes'

export type { PageKey }

/** locale code → logical page key → locale-free path. */
export type PagePathsByLocale = Record<string, Record<string, string>>

/** route name → URI template + the logical page whose current slug fills `{page}`. */
export type CmsRouteTemplates = Record<string, { uri: string; page: string }>

let byLocale: PagePathsByLocale = {}

let routeTemplates: CmsRouteTemplates = {}

/** Copy the `pages` shared prop into module scope. Called once per boot/SSR request. */
export function setPagePaths(map: PagePathsByLocale | undefined): void {
  byLocale = map ?? {}
}

/** Copy the `cmsRoutes` shared prop into module scope. Called once per boot/SSR request. */
export function setCmsRoutes(map: CmsRouteTemplates | undefined): void {
  routeTemplates = map ?? {}
}

/** A top-level page's current path, e.g. `pagePath('locations', 'en')` → `/stores`. */
export function pagePath(key: PageKey, code: string): string {
  return byLocale[code]?.[key] ?? PAGE_PATH_FALLBACK[key]
}

/**
 * A CMS sub-route's current path, by route name: `cmsRoute('locations.show',
 * { slug: 'vestavia-hills-al' }, 'en')` → `/stores/vestavia-hills-al`. Templates come
 * from the `cmsRoutes` shared prop (the server's route table), so a route added to
 * routes/web.php is buildable here with no hand-written frontend code. `{page}` is
 * filled from the page-path map — the part a CMS rename moves; every other
 * placeholder comes from params, and vue-tsc checks both the name and the param
 * shape against the GENERATED CmsRouteParams (`php artisan cms-routes:types`). The
 * runtime throws stay as a second net for anything the types can't see.
 */
export function cmsRoute<N extends keyof CmsRouteParams>(
  name: N,
  params: CmsRouteParams[N],
  code: string
): string {
  const template = routeTemplates[name] ?? CMS_ROUTE_FALLBACK[name]

  if (template === undefined) {
    throw new Error(`cmsRoute: "${name}" is not a CMS-driven route (see the cmsRoutes shared prop)`)
  }

  return template.uri.replace(/\{(\w+)\}/g, (_, param: string) => {
    if (param === 'page') {
      return pagePath(template.page as PageKey, code).replace(/^\//, '')
    }

    const value = (params as Record<string, string>)[param]
    if (value === undefined) {
      throw new Error(`cmsRoute: "${name}" needs a "${param}" parameter`)
    }

    return value
  })
}

/**
 * A URL matched back to its route: a sub-route name with its captured params, the
 * top-level `page` route, or `home`. For `page`, params.page is the LOGICAL key
 * (`'locations'`, not the slug) — `pagePath(params.page)` round-trips it.
 */
export type CmsRouteMatch =
  | { [N in keyof CmsRouteParams]: { name: N; params: CmsRouteParams[N] } }[keyof CmsRouteParams]
  | { name: 'page'; params: { page: string } }
  | { name: 'home'; params: Record<string, never> }

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * The reverse of cmsRoute()/pagePath(): classify an app URL back to `{ name, params }`
 * — `matchCmsRoute('/stores/vestavia-hills-al', 'en')` →
 * `{ name: 'locations.show', params: { slug: 'vestavia-hills-al' } }`.
 *
 * Mirrors the server's matching: templates are tried in routes/web.php registration
 * order (multi-segment routes first, the keyless `{page}` route last, `/` = home),
 * with `{page}` resolved through the CMS map — so renames follow, per locale. A
 * `/{locale}` prefix is detected against the pages map (only when the deployment is
 * multilingual, exactly like localizedUrl's guard) and overrides `code`: that
 * locale's slugs are the ones the URL was built with. Query/hash are ignored.
 * Returns null for anything that is not a CMS-driven URL — absolute/external,
 * `mailto:`, `#anchor`, reserved paths like `/csrf-cookie`.
 */
export function matchCmsRoute(url: string, code: string): CmsRouteMatch | null {
  if (!url.startsWith('/')) {
    return null
  }

  const [withoutQuery = url] = url.split(/[?#]/, 1)
  let path = withoutQuery
  let locale = code

  const [first = ''] = path.slice(1).split('/', 1)
  if (Object.keys(byLocale).length > 1 && first !== '' && byLocale[first] !== undefined) {
    locale = first
    path = path.slice(1 + first.length) || '/'
  }

  if (path.length > 1) {
    path = path.replace(/\/+$/, '') || '/'
  }

  if (path === '/') {
    return { name: 'home', params: {} }
  }

  const templates = Object.keys(routeTemplates).length > 0 ? routeTemplates : CMS_ROUTE_FALLBACK

  for (const [name, template] of Object.entries(templates)) {
    const slug = pagePath(template.page as PageKey, locale).replace(/^\//, '')
    const paramNames: string[] = []
    const source = template.uri
      .replace('{page}', slug)
      .split(/(\{\w+\})/)
      .map((part) => {
        const param = part.match(/^\{(\w+)\}$/)
        if (param) {
          paramNames.push(param[1] as string)
          return '([^/]+)'
        }
        return escapeRegExp(part)
      })
      .join('')

    const captured = path.match(new RegExp(`^${source}$`))
    if (captured) {
      const params: Record<string, string> = {}
      paramNames.forEach((param, index) => {
        params[param] = captured[index + 1] as string
      })
      return { name, params } as CmsRouteMatch
    }
  }

  const paths: Record<string, string> = { ...PAGE_PATH_FALLBACK, ...byLocale[locale] }
  const key = Object.keys(paths).find((k) => paths[k] === path)

  return key === undefined ? null : { name: 'page', params: { page: key } }
}

/**
 * Rebuild a locale-free path under another locale's slugs, for the language
 * switcher: `/stores/vestavia-hills-al` under `ar` becomes the ar slug of the
 * locations page plus the same tail. Only the first segment is localized — the
 * `{slug}`/`{state}`/`{section}`/`{item}` tails are locale-invariant CMS slugs.
 * A path that isn't a CMS page's (`/`, `/csrf-cookie`, ...) is returned unchanged,
 * which is exactly the old strip-then-reprefix behavior.
 */
export function translatePagePath(path: string, fromCode: string, toCode: string): string {
  if (!path.startsWith('/')) {
    return path
  }

  const [firstSegment] = path.slice(1).split(/[/?#]/, 1)
  if (firstSegment === '') {
    return path
  }

  const fromPaths = byLocale[fromCode] ?? {}
  const key = Object.keys(fromPaths).find((k) => fromPaths[k] === `/${firstSegment}`)
  if (key === undefined) {
    return path
  }

  const toPath = byLocale[toCode]?.[key]
  if (toPath === undefined || toPath === '/') {
    return path
  }

  return `${toPath}${path.slice(1 + firstSegment.length)}`
}
