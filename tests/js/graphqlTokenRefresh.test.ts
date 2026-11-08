/**
 * Behavior suite for lib/graphqlTokenRefresh.ts — the request the Apollo client sends for a
 * fresh `graphqlToken` prop after Gorilla Dash refused the token it had.
 *
 * It runs with no `document` at all: the page it describes comes from Inertia, never from
 * the DOM, where Inertia v3 renders no `div[data-page]`.
 *
 * Runs inside Pest via tests/Unit/FrontendGraphqlTokenRefreshTest.php; standalone with:
 *
 *   node_modules/.bin/tsx tests/js/graphqlTokenRefresh.test.ts
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fetchFreshGraphqlToken } from '@/lib/graphqlTokenRefresh'

interface Sent {
  url: string
  headers: Record<string, string>
}

function fakeFetch(status: number, body: unknown, sent: Sent[]): typeof fetch {
  return (async (url: string, init?: RequestInit) => {
    sent.push({ url, headers: init?.headers as Record<string, string> })

    return new Response(JSON.stringify(body), { status })
  }) as typeof fetch
}

// The request is a partial reload of the current URL for the token alone, named after the
// page Inertia has on screen.
{
  const sent: Sent[] = []
  const token = await fetchFreshGraphqlToken(
    'https://www.example.com/menu#locations',
    { component: 'Menu', version: 'abc123' },
    fakeFetch(200, { component: 'Menu', props: { graphqlToken: 'fresh' } }, sent)
  )

  assert.equal(token, 'fresh')
  assert.equal(sent.length, 1)
  assert.equal(sent[0].url, 'https://www.example.com/menu#locations')
  assert.deepEqual(sent[0].headers, {
    'X-Inertia': 'true',
    'X-Inertia-Version': 'abc123',
    'X-Inertia-Partial-Component': 'Menu',
    'X-Inertia-Partial-Data': 'graphqlToken'
  })
}

// A page with no asset version still sends the header, empty, as Inertia itself does.
{
  const sent: Sent[] = []
  await fetchFreshGraphqlToken(
    '/',
    { component: 'Home', version: null },
    fakeFetch(200, { props: { graphqlToken: 't' } }, sent)
  )

  assert.equal(sent[0].headers['X-Inertia-Version'], '')
}

// No token on the server (no credentials configured) is an empty string: the Apollo client
// retries once with it and lets that failure through, rather than looping.
{
  for (const props of [{ graphqlToken: null }, {}]) {
    const token = await fetchFreshGraphqlToken(
      '/',
      { component: 'Home', version: 'v' },
      fakeFetch(200, { props }, [])
    )

    assert.equal(token, '')
  }
}

// A refused refresh (a 409 after a deploy changed the asset version, a 5xx) rejects, so the
// failed query errors instead of retrying with the token Gorilla Dash already refused.
{
  for (const status of [409, 500]) {
    await assert.rejects(
      fetchFreshGraphqlToken('/', { component: 'Home', version: 'v' }, fakeFetch(status, {}, [])),
      new RegExp(`Token refresh failed: ${status}`)
    )
  }
}

// The Apollo client hands it Inertia's current page, and never reads the page off the DOM.
{
  const client = readFileSync(
    new URL('../../resources/ts/plugins/apolloClient.ts', import.meta.url),
    'utf8'
  )

  assert.doesNotMatch(client, /data-page|dataset\.page/)
  assert.match(client, /const \{ component, version \} = currentBrowserPage\(\)/)
  assert.match(client, /fetchFreshGraphqlToken\(window\.location\.href, \{ component, version \}\)/)
}

console.log('graphqlTokenRefresh: all checks passed')
