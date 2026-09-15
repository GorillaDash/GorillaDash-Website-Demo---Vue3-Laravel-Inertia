import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, Observable } from '@apollo/client/core'
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev'
import { ServerError } from '@apollo/client/errors'
import { ErrorLink } from '@apollo/client/link/error'
import { PersistedQueryLink } from '@apollo/client/link/persisted-queries'
import { print } from '@apollo/client/utilities'
import { sha256 } from 'crypto-hash'
import { runtimeConfig } from '@/runtimeConfig'

if (import.meta.env.DEV) {
  loadDevMessages()
  loadErrorMessages()
}

let currentToken = ''
let tokenRefreshPromise: Promise<string> | null = null

export function setGraphqlToken(token: string) {
  currentToken = token
}

/**
 * Fetch a fresh graphqlToken from origin via an Inertia partial-reload request.
 * Concurrent auth failures coalesce into a single fetch.
 */
function refreshToken(): Promise<string> {
  if (tokenRefreshPromise) return tokenRefreshPromise

  tokenRefreshPromise = fetch(window.location.href, {
    headers: {
      'X-Inertia': 'true',
      'X-Inertia-Version': (document.querySelector('div[data-page]') as HTMLElement | null)?.dataset
        .page
        ? JSON.parse((document.querySelector('div[data-page]') as HTMLElement).dataset.page!)
            .version
        : '',
      'X-Inertia-Partial-Data': 'graphqlToken',
      'X-Inertia-Partial-Component': JSON.parse(
        (document.querySelector('div[data-page]') as HTMLElement).dataset.page!
      ).component
    }
  })
    .then((res) => {
      if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
      return res.json()
    })
    .then((data: { props?: { graphqlToken?: string } }) => {
      const fresh = data.props?.graphqlToken ?? ''
      currentToken = fresh
      return fresh
    })
    .finally(() => {
      tokenRefreshPromise = null
    })

  return tokenRefreshPromise
}

/**
 * Builds the Apollo client for the external GD GraphQL API.
 *
 * The auth token is passed in — sourced from Inertia shared props in app.ts
 * (see HandleInertiaRequests::share) — rather than read off `window`. That keeps
 * this module free of browser globals, so it runs unchanged under SSR.
 *
 * On the client, an auth failure from the GraphQL API triggers an automatic
 * token refresh via an Inertia partial reload, then retries the failed operation
 * once. The GD gateway answers 401 when a token is rejected and 404 when it is
 * missing/empty (`Bearer ` — verified by probing graphql.gorilladash.com), so
 * both are treated as auth failures. This covers the edge case where a
 * edge-cached page carries a stale or blank token by the time the client
 * hydrates.
 *
 * `debug` (from ?debug=1 on the page URL — see setupApp) turns APQ off, so every
 * query goes out as a plain POST that the GraphQL Cloud CDN never caches —
 * pairing with the edge-HTML-cache bypass for a fully uncached debugging view.
 */
export function createApolloClient(graphqlURL: string, graphqlToken: string, debug = false) {
  currentToken = graphqlToken

  // Automatic persisted queries (GET) shrink request size in production.
  const persistedQueriesLink = new PersistedQueryLink({
    generateHash(query) {
      // Per-country org/website from runtime config (set in app.ts before this
      // client is built), not build-time VITE_ vars — so one build serves every
      // country while keeping the hash suffix country-scoped.
      const { orgId, websiteId } = runtimeConfig()

      return sha256(print(query) + `${orgId}_${websiteId}`)
    },
    useGETForHashedQueries: true
  })

  // Inject the current token dynamically so retries after a refresh use the new one.
  const authLink = new ApolloLink((operation, forward) => {
    operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
      headers: {
        ...headers,
        Authorization: `Bearer ${currentToken}`,
        ...(import.meta.env.SSR
          ? {
              'User-Agent': 'GD-SSR/1.0 (juniper-table)',
              ...(process.env.GD_SSR_EDGE_KEY
                ? { 'x-gd-edge-key': process.env.GD_SSR_EDGE_KEY }
                : {})
            }
          : {})
      }
    }))
    return forward(operation)
  })

  // Client-only: on an auth failure, fetch a fresh token from origin and retry
  // once. The gateway returns 401 (token rejected) or 404 (token missing/empty —
  // e.g. an edge-cached page hydrated with a blank graphqlToken); Apollo surfaces
  // both as a ServerError since the 404 body is non-JSON. The __tokenRetried
  // guard bounds it to a single retry, so a still-empty token can't loop.
  const retryOnAuthErrorLink = !import.meta.env.SSR
    ? new ErrorLink(({ error, operation, forward }) => {
        if (
          ServerError.is(error) &&
          (error.statusCode === 401 || error.statusCode === 404) &&
          !operation.getContext().__tokenRetried
        ) {
          return new Observable((observer) => {
            refreshToken()
              .then(() => {
                operation.setContext({ __tokenRetried: true })
                forward(operation).subscribe(observer)
              })
              .catch((err) => observer.error(err))
          })
        }
      })
    : null

  const httpLink = new HttpLink({
    uri: `${graphqlURL}/graphql`
  })

  const cache = new InMemoryCache({
    // resultCaching memoises cache READS (the @wry/optimism Trie). It pays off when
    // one long-lived client reads the same query repeatedly — i.e. on the client.
    // Under SSR ssr.ts builds a client per request and every query is read exactly
    // once, so those memo structures are built and thrown away.
    //
    // Turning it off changes nothing about what is STORED, so client.extract() and
    // the browser's cache.restore() are unaffected. Verified by rendering a real
    // page 60x against its staging payload under both settings: the body was
    // byte-identical (22,224 bytes) and __APOLLO_STATE__ compared equal (79,191
    // bytes, 5 ROOT_QUERY fields) — only the serialised key ORDER shifts, which
    // restore() does not care about.
    resultCaching: !import.meta.env.SSR,
    typePolicies: {
      // Add per-type cache policies here as queries grow.
    }
  })

  // On the client, replay the SSR-extracted cache (injected by ssr.ts into
  // window.__APOLLO_STATE__) so hydration matches the server render and useQuery
  // resolves from cache instead of refetching. No-op under SSR and when absent.
  if (!import.meta.env.SSR && typeof window !== 'undefined' && window.__APOLLO_STATE__) {
    cache.restore(window.__APOLLO_STATE__)
  }

  const useApq = import.meta.env.PROD && !debug

  const links: ApolloLink[] = []
  if (retryOnAuthErrorLink) links.push(retryOnAuthErrorLink)
  links.push(authLink)
  if (useApq) links.push(persistedQueriesLink)
  links.push(httpLink)

  return new ApolloClient({
    link: ApolloLink.from(links),
    cache,
    // Lets Apollo skip defensive deep-copies of query results, on the promise that
    // nothing mutates them. Nothing here does: results are read by Vue components
    // during render and never written back. Safe on the client for the same reason,
    // so it is not gated on import.meta.env.SSR.
    assumeImmutableResults: true
  })
}
