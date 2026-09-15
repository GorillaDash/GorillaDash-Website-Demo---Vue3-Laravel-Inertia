import type { ApolloClient, OperationVariables } from '@apollo/client/core'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import {
  inject,
  onScopeDispose,
  onServerPrefetch,
  ref,
  shallowRef,
  watch,
  type InjectionKey
} from 'vue'

/**
 * App-wide Apollo client provide/inject key.
 * Replaces @vue/apollo-composable's `DefaultApolloClient`.
 */
export const APOLLO_CLIENT = Symbol('apollo-client') as InjectionKey<ApolloClient>

type Variables<V> = V | (() => V)

/**
 * Minimal, SSR-correct replacement for @vue/apollo-composable's `useQuery`.
 *
 * Why hand-rolled: the composable's built-in SSR (`onServerPrefetch`) is broken
 * under Apollo Client v4 — v4 emits a "loading, no data" result first, and the
 * composable resolved its prefetch promise on it, so `renderToString` rendered
 * empty data. See docs/ssr-graphql-apollo-findings.md.
 *
 * - **SSR**: `onServerPrefetch` awaits an imperative `client.query()`, so the
 *   server renders real data and the cache is populated for transfer (ssr.ts
 *   serializes `client.extract()` into `window.__APOLLO_STATE__`; createApolloClient
 *   restores it on the client).
 * - **Client**: seeds `result` synchronously from the restored cache so the first
 *   hydration render matches the server HTML, then `watchQuery` + subscribe for
 *   reactivity; refetch when a getter variables source changes.
 *
 * Returns `{ result, loading, error }` — the subset the app consumes.
 */
export function useQuery<TData, TVars extends OperationVariables>(
  document: TypedDocumentNode<TData, TVars>,
  variables?: Variables<TVars>
) {
  const client = inject(APOLLO_CLIENT)
  if (!client) {
    throw new Error('useQuery: no Apollo client provided. Provide APOLLO_CLIENT in app.ts.')
  }

  const result = shallowRef<TData>()
  const loading = ref(true)
  const error = shallowRef<unknown>()
  let refetch: (vars?: TVars) => Promise<unknown> = () => Promise.resolve()

  const readVars = () =>
    (typeof variables === 'function' ? (variables as () => TVars)() : variables) as TVars

  // SSR only (Vue no-ops this hook on the client).
  onServerPrefetch(async () => {
    try {
      const { data } = await client.query<TData, TVars>({ query: document, variables: readVars() })
      result.value = data as TData
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  })

  if (!import.meta.env.SSR) {
    const observable = client.watchQuery<TData, TVars>({ query: document, variables: readVars() })
    refetch = (vars?: TVars) => observable.refetch(vars)

    // Seed synchronously from the SSR-restored cache so the first hydration
    // render already has data and matches the server HTML — avoids a hydration
    // mismatch and a redundant refetch. Falls through to the network on a miss.
    try {
      const cached = client.readQuery<TData, TVars>({ query: document, variables: readVars() })
      if (cached != null) {
        result.value = cached as TData
        loading.value = false
      }
    } catch {
      // partial/empty cache — the subscription below will fetch and fill it
    }

    const subscription = observable.subscribe({
      next: (next) => {
        if (next.data !== undefined) {
          result.value = next.data as TData
        }
        loading.value = next.loading
      },
      error: (e) => {
        error.value = e
        loading.value = false
      }
    })
    onScopeDispose(() => subscription.unsubscribe())

    // Getter variables (e.g. reactive locale): refetch when they change.
    if (typeof variables === 'function') {
      watch(variables, (vars) => observable.refetch(vars))
    }
  }

  return { result, loading, error, refetch }
}
