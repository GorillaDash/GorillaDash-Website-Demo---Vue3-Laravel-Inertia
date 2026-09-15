import type { Page } from '@inertiajs/core'
import type { ApolloClient } from '@apollo/client/core'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { createPinia } from 'pinia'
import type { App, DefineComponent } from 'vue'
import { T, VueTolgee } from '@tolgee/vue'
import { APOLLO_CLIENT } from '@/composables/useQuery'
import { INITIAL_PAGE } from '@/composables/useSharedProps'
import AppLayout from '@/layouts/AppLayout.vue'
import { createApolloClient } from '@/plugins/apolloClient'
import { createTolgee, type TolgeeRecords } from '@/plugins/tolgee'
import { defaultLocale } from '@/constants/i18nLocales'
import {
  setCmsRoutes,
  setPagePaths,
  type CmsRouteTemplates,
  type PagePathsByLocale
} from '@/lib/pagePaths'
import { runtimeConfig, setRuntimeConfig, type RuntimeConfig } from '@/runtimeConfig'

/**
 * Shared Inertia wiring used by BOTH entries — the client entry (`app.ts`,
 * via `withApp`) and the SSR entry (`ssr.ts`, via a manual `setup`). Keeping
 * resolve/title/app-setup here means the GraphQL token, runtime config, and
 * layout logic have a single source of truth across client and server.
 */

/** Resolve a page component and apply the default AppLayout when none is declared. */
export const resolvePage = (name: string) =>
  resolvePageComponent<DefineComponent>(
    `./pages/${name}.vue`,
    import.meta.glob<DefineComponent>('./pages/**/*.vue')
  ).then((module) => {
    module.default.layout = module.default.layout ?? AppLayout

    return module
  })

/**
 * Copy the per-country deployment constants out of Inertia's shared props into
 * module scope. Idempotent, and safe to call before setupApp — the SSR entry does
 * exactly that, because it must know the deployment's Tolgee CDN before it can
 * preload translations for the request's language.
 */
export function applyRuntimeConfig(page: Page): void {
  setRuntimeConfig({
    appName: (page.props.name as string) ?? 'Laravel',
    ...(page.props.config as Partial<RuntimeConfig>)
  })

  // The CMS page-path map and route templates ride the same lifecycle: near-constant
  // (the map carries every locale, the templates are the route table's, so concurrent
  // SSR renders set identical values) and needed before render.
  setPagePaths(page.props.pages as PagePathsByLocale | undefined)
  setCmsRoutes(page.props.cmsRoutes as CmsRouteTemplates | undefined)
}

/** The request's Tolgee language tag, resolved from the URL server-side by SetLocale. */
export function pageLanguage(page: Page): string {
  return (page.props.locale as { value: string } | undefined)?.value ?? defaultLocale
}

/** Page title from per-country runtime config (the `name` shared prop), not a build-time VITE_ var. */
export const appTitle = (title: string): string => {
  const { appName } = runtimeConfig()

  return title ? `${title} - ${appName}` : appName
}

/**
 * Per-app wiring run once per app instance (per client boot / per SSR request):
 * runtime config from Inertia props, the Apollo client (provided app-wide), and
 * a fresh Pinia. Returns the Apollo client so the SSR entry can `extract()` its
 * cache after render for transfer to the client.
 */
export function setupApp(app: App, page: Page, translations?: TolgeeRecords): ApolloClient {
  // Must run before createApolloClient — the APQ hash suffix and the stores read it.
  applyRuntimeConfig(page)

  // This request's page object, app-scoped. Everything that reads Inertia props goes
  // through useSharedProps() and lands here under SSR, because Inertia's own `page` is a
  // module-level ref that a concurrent SSR render will overwrite mid-await.
  app.provide(INITIAL_PAGE, page)

  const graphqlToken = (page.props.graphqlToken as string | null) ?? ''
  // The browser must reach GD's public GraphQL endpoint (shared via Inertia props).
  // Under SSR the renderer runs server-side in-cluster (same region as the GD API),
  // so point it at the API's direct Cloud Run URL to skip the public LB + Cloud Armor.
  // import.meta.env.SSR is statically false in the client build, so this branch — and
  // the process.env reference — is tree-shaken out of the browser bundle.
  let graphqlURL = (page.props.graphqlURL as string | null) ?? ''
  if (import.meta.env.SSR && process.env.GD_GRAPHQL_SSR_URL) {
    graphqlURL = process.env.GD_GRAPHQL_SSR_URL
  }
  // ?debug=1 on the page URL = uncached debugging view: the edge already passes
  // these requests (see deploy/cloudflare/); here it turns APQ off so GraphQL goes
  // out as plain POSTs the CDN never caches. Read from page.url (not window) so
  // it works identically on client boot and per SSR request. The flag is fixed
  // per app instance — SPA navigations keep it until a full page load drops it.
  const debug = /[?&]debug=1(&|$)/.test(page.url)
  const client = createApolloClient(graphqlURL, graphqlToken, debug)
  app.provide(APOLLO_CLIENT, client)
  // Fresh Pinia per app instance so SSR requests never share store state.
  app.use(createPinia())
  // Tolgee i18n (built from runtimeConfig, so AFTER setRuntimeConfig above) +
  // global <T> component so templates use it without per-file imports. Under SSR the
  // caller has already fetched the request language's translations and passes them in;
  // in the browser createTolgee picks the same records up from window.__TOLGEE_STATE__.
  // Either way the cache is warm before the first render, which is what TolgeeProvider's
  // `ssr` prop would otherwise do (it just calls addStaticData + changeLanguage).
  //
  // enableSSR makes the first render use the unwrapped `t`, matching what the server
  // produced; <TolgeeProvider> in AppLayout flips that back after mount, and is also
  // what calls tolgee.run() — nothing else does, so without it the CDN is never read.
  app.use(VueTolgee, { tolgee: createTolgee(pageLanguage(page), translations), enableSSR: true })
  app.component('T', T)

  return client
}
