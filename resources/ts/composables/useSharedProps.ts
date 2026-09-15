import { computed, inject, type InjectionKey } from 'vue'
import type { Page } from '@inertiajs/core'
import { usePage } from '@inertiajs/vue3'

/**
 * The page object this app instance was created for. Provided once by setupApp.
 *
 * @see useSharedProps
 */
export const INITIAL_PAGE = Symbol('initial-page') as InjectionKey<Page>

/**
 * Inertia's page props and URL, read safely on both the server and the client.
 *
 * **Never call `usePage()` directly.** `@inertiajs/vue3` keeps `page` in a module-level
 * ref, and `@inertiajs/core`'s SSR server is a plain `http.createServer(async …)` — it
 * does not serialize requests. Every page in this app awaits inside its render
 * (useQuery's `onServerPrefetch` hits GraphQL), and during that await a concurrent
 * request's `App` setup overwrites `page.value`. The first request then finishes
 * rendering with the second one's props.
 *
 * That is not a rare race: the await is a GraphQL round trip, i.e. most of every
 * request. Measured on this app, ~50% of anonymous homepage renders picked up a
 * concurrent visitor's bound store — and since EdgeCacheGuestPage correctly judges the
 * *PHP* request to be anonymous, that HTML is handed to the edge as the shared copy.
 *
 * So: under SSR read the frozen per-request snapshot (an `app.provide`, per app
 * instance, exactly like the Apollo client and the Tolgee instance). In the browser
 * there is one app, and props must stay reactive across SPA navigations, so read the
 * live `usePage()`. `import.meta.env.SSR` is statically known, so each build keeps only
 * its own branch.
 */
export function useSharedProps() {
  const initial = inject(INITIAL_PAGE, null)
  const page = import.meta.env.SSR ? null : usePage()

  // setupApp always provides INITIAL_PAGE; the empty fallback only satisfies a component
  // mounted outside the Inertia app (a unit-test render), where there are no props at all.
  const props = computed<Page['props']>(() =>
    import.meta.env.SSR ? (initial?.props ?? ({} as Page['props'])) : page!.props
  )

  const url = computed<string>(() => (import.meta.env.SSR ? (initial?.url ?? '/') : page!.url))

  return { props, url }
}
