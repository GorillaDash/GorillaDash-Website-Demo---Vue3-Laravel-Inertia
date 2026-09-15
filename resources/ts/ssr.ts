import { createInertiaApp } from '@inertiajs/vue3'
import createServer from '@inertiajs/vue3/server'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { applyRuntimeConfig, appTitle, pageLanguage, resolvePage, setupApp } from '@/inertiaApp'
import { preloadTranslations } from '@/plugins/tolgee'

/**
 * Serialize dehydrated state for safe inline injection. Escaping `<` prevents the
 * JSON from breaking out of the surrounding `<script>` (e.g. a `</script>` or `<!--`
 * inside string data).
 */
function serializeState(state: unknown): string {
  return JSON.stringify(state ?? {}).replace(/</g, '\\u003c')
}

createServer(async (page) => {
  // One Apollo client per request; useQuery's onServerPrefetch populates its
  // cache during render so we can extract it afterwards. `extract` is captured
  // in this per-invocation closure, so concurrent SSR requests never clobber it.
  let extractApolloState: () => unknown = () => ({})

  // Translations must be in Tolgee's cache before the first render, or every key
  // falls back to its inline English `default` — and that HTML is what the edge caches
  // for the URL. Needs the deployment's CDN config, hence applyRuntimeConfig first
  // (setupApp calls it again, idempotently). Memoized per language, so this is a
  // network round trip once per language per five minutes, not once per render.
  applyRuntimeConfig(page)
  const translations = await preloadTranslations(pageLanguage(page))

  return createInertiaApp({
    page,
    title: appTitle,
    resolve: resolvePage,
    // renderToString awaits onServerPrefetch (registered by useQuery), so all
    // queries resolve before the markup is produced.
    render: (app) => renderToString(app),
    setup({ App, props, plugin }) {
      const app = createSSRApp({ render: () => h(App, props) })
      app.use(plugin)
      const client = setupApp(app, page, translations)
      extractApolloState = () => client.extract()

      return app
    }
  }).then((result) => {
    // After render, transfer the collected GraphQL cache and the translations that
    // produced this markup to the client via the <head> (NOT inside #app, which would
    // break hydration). The client restores them in plugins/apolloClient.ts and
    // plugins/tolgee.ts respectively.
    result.head.push(
      `<script>window.__APOLLO_STATE__ = ${serializeState(extractApolloState())}</script>`,
      `<script>window.__TOLGEE_STATE__ = ${serializeState(translations)}</script>`
    )

    return result
  })
})
