import { buildClientSchema, getIntrospectionQuery } from 'graphql'

// Schema loader for graphql-codegen. Authenticates with the GD API using
// client_credentials, then introspects the schema. Requires env (same names the
// app uses at runtime):
//   GD_WEBSITE_CLIENT_ID (client_id), GD_WEBSITE_CLIENT_SECRET (client_secret),
//   GD_API_GRAPHQL_URL (optional OAuth/introspection base; defaults below).
const GD_API_URL = process.env.GD_API_GRAPHQL_URL ?? 'https://api.gorilladash.com'
const GD_API_AUTH_URL = `${GD_API_URL}/oauth/token`
const GD_API_GRAPHQL_URL = `${GD_API_URL}/graphql`

export default async () => {
  try {
    // 1. Get the access token
    const resp = await fetch(GD_API_AUTH_URL, {
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' }),
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: process.env.GD_WEBSITE_CLIENT_ID,
        client_secret: process.env.GD_WEBSITE_CLIENT_SECRET,
        scope: ''
      })
    })

    const authData = await resp.json()
    if (!resp.ok) {
      console.error('Auth failed:', resp.status, authData)
      throw new Error(`Auth request failed with status ${resp.status}`)
    }

    const { token_type, access_token } = authData

    // 2. Introspect the schema with the token
    const ghqResp = await fetch(GD_API_GRAPHQL_URL, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `${token_type} ${access_token}`
      }),
      body: JSON.stringify({ query: getIntrospectionQuery() })
    })

    const data = await ghqResp.json()

    if (data.errors) {
      console.error('GraphQL introspection errors:', JSON.stringify(data.errors, null, 2))
    }
    if (!data.data) {
      throw new Error('Introspection query returned no data')
    }

    return buildClientSchema(data.data)
  } catch (e) {
    console.error(e)
    throw e
  }
}
