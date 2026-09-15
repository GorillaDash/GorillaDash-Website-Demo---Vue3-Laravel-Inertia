import { createInertiaApp, router } from '@inertiajs/vue3'
import { appTitle, resolvePage, setupApp } from '@/inertiaApp'
import { setGraphqlToken } from '@/plugins/apolloClient'

createInertiaApp({
  // App name comes from runtime config (the `name` shared prop, set in setupApp
  // before render) so it's per-country and matches config('app.name').
  title: appTitle,
  // Take over resolve ourselves; the @inertiajs/vite plugin detects this and skips injecting its own.
  resolve: resolvePage,
  // Client-side app setup. SSR is handled by the dedicated `ssr.ts` entry, which
  // serializes the Apollo cache into `window.__APOLLO_STATE__`; here the client
  // restores it (inside createApolloClient) so hydration matches the server
  // render and no refetch is needed. Using withApp (not a manual `setup`) keeps
  // the @inertiajs/vite plugin in charge of app creation + hydration.
  withApp(app, { page }) {
    setupApp(app, page)

    // Keep the Apollo bearer token current on every Inertia response.
    // setupApp only runs once (initial boot); SPA navigations deliver a fresh
    // graphqlToken in shared props without re-running setupApp.
    router.on('navigate', (event) => {
      const token = event.detail.page.props.graphqlToken as string | null
      if (token) setGraphqlToken(token)

      // A version-skew 409 recovery lands on <url>?__fresh=<hash> (the edge's
      // bypass-debug rule sends that request to origin instead of serving stale
      // cached HTML; see HandleInertiaRequests::onVersionChange).
      // The fresh page has now loaded, so strip the marker from the address bar:
      // a bookmarked/shared ?__fresh URL would otherwise bypass the edge cache on
      // every visit. Runs after Inertia's own boot replaceState, so it sticks.
      if (typeof window !== 'undefined' && window.location.search.includes('__fresh=')) {
        const url = new URL(window.location.href)
        url.searchParams.delete('__fresh')
        window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
      }
    })
  },
  progress: {
    color: '#4B5563'
  }
})
