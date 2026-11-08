import type { Page } from '@inertiajs/core'

/**
 * Asks origin for a fresh `graphqlToken` prop after Gorilla Dash refused the token the Apollo
 * client had.
 *
 * It is an Inertia partial reload of the current URL asking for the `graphqlToken` prop
 * alone. The component and version come from Inertia's CURRENT page, which the caller passes
 * in, never from the DOM: Inertia v3 writes the first page into `<script data-page="app">`,
 * so a `div[data-page]` lookup finds nothing and throws before any request goes out.
 *
 * Kept apart from plugins/apolloClient.ts so it runs under node in tests/js.
 */
export async function fetchFreshGraphqlToken(
  url: string,
  page: Pick<Page, 'component' | 'version'>,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const response = await fetchImpl(url, {
    headers: {
      'X-Inertia': 'true',
      'X-Inertia-Version': page.version ?? '',
      'X-Inertia-Partial-Component': page.component,
      'X-Inertia-Partial-Data': 'graphqlToken'
    }
  })

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`)
  }

  const data = (await response.json()) as { props?: { graphqlToken?: string | null } }

  return data.props?.graphqlToken ?? ''
}
