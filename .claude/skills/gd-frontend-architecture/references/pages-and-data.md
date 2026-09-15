# Pages, data & state

The mental model is a **split**. Inertia stays the router and page system; the
data layer is GD's GraphQL stack:

- **Inertia props** deliver the data a page needs at first render, and **Inertia
  is the router** (page navigation, any Laravel-backed posts like auth).
- **GraphQL (Apollo)** delivers everything interactive after that — lists that
  refetch, detail panels, on-demand data, and **all business mutations**.
- **Pinia (`stores/`)** holds client-only UI state. **Apollo's cache** holds
  server data — don't duplicate server data into Pinia.

Getting this split right is what keeps the codebase coherent.

## Initial data: Inertia props

When a page needs something on screen immediately, the controller passes it as a
prop and the page reads it with `defineProps`. Keep this to first-paint
essentials; everything else is a GraphQL query.

```vue
<script setup lang="ts">
defineProps<{ projectId: number }>()
</script>
```

### Shared props (auth, UI flags)

Globally shared data injected by Inertia middleware (the authenticated user, UI
flags) is read with `usePage` and typed in `types/global.d.ts`:

```vue
<script setup lang="ts">
import { usePage } from '@inertiajs/vue3'
const page = usePage()
// page.props.auth.user — typed via global.d.ts
</script>
```

## The Apollo client (`plugins/apolloClient.ts`)

The client is created **once** in `plugins/` and provided at boot — never
re-created per component. GD's conventions (from SAR):

```ts
// resources/ts/plugins/apolloClient.ts
import { ApolloClient, HttpLink, InMemoryCache, ApolloLink } from '@apollo/client/core'
import { PersistedQueryLink } from '@apollo/client/link/persisted-queries'
import { print } from '@apollo/client/utilities'
import { sha256 } from 'crypto-hash'

const httpLink = new HttpLink({
  uri: (import.meta.env.VITE_GD_API_GRAPHQL_URL ?? 'https://graphql.gorilladash.com') + '/graphql',
  headers: { Authorization: `Bearer ${window.graphqlToken}` }
})

// Automatic persisted queries (GET) in production to shrink requests
const persistedQueriesLink = new PersistedQueryLink({
  generateHash: (query) =>
    sha256(print(query) + `${import.meta.env.VITE_GD_ORG_ID}_${import.meta.env.VITE_WEBSITE_ID}`),
  useGETForHashedQueries: true
})

export const apolloClient = new ApolloClient({
  link: import.meta.env.PROD
    ? persistedQueriesLink.concat(ApolloLink.from([httpLink]))
    : ApolloLink.from([httpLink]),
  cache: new InMemoryCache({
    /* typePolicies as needed */
  })
})
```

Key points: the GraphQL API is **external** (`VITE_GD_API_GRAPHQL_URL`, default
`graphql.gorilladash.com`) — not this Laravel app; auth is a **Bearer
`window.graphqlToken`**; persisted queries are enabled only in `PROD`.

How `window.graphqlToken` gets there (mirrors SAR): a `DispatchGraphqlToken`
middleware on the web group calls an `App\Services\GraphqlToken` service (OAuth
`client_credentials` → cached token) and injects it via `laracasts/utilities`
`JavaScript::put([...])`, which prepends `<script>window.graphqlToken = "…"</script>`
into a `server-side-variables` partial `@include`d in `app.blade.php`'s `<head>`
(before `@vite`, so it runs before `app.ts`). Credentials come from
`config/gorilladash.php` (`GD_API_WEBSITE_ID`, `GD_API_ACCESS_TOKEN`).

> **Apollo v4 compat shim (required on Vite 8 / Rolldown).** Apollo Client v4
> removed `ApolloError`/`isApolloError`, but `@vue/apollo-composable@4.2.2` still
> imports them from `@apollo/client/core/index.js`. Add a tiny shim
> (`shim/apollo-v4-compat.ts` exporting an `ApolloError` class + `isApolloError`)
> and alias that exact import to it in `vite.config.ts`:
> `'@apollo/client/core/index.js': fileURLToPath(new URL('./resources/ts/shim/apollo-v4-compat.ts', import.meta.url))`.
> Without it the production build fails with a missing-export error.
> (Ref: vuejs/apollo#1597.)

Provide it once in `app.ts` so every `useQuery`/`useMutation` finds it:

```ts
// resources/ts/app.ts — inside createInertiaApp's setup()
import { DefaultApolloClient } from '@vue/apollo-composable';
import { apolloClient } from '@/plugins/apolloClient';

setup({ el, App, props, plugin }) {
  createApp({ render: () => h(App, props), setup: () => provide(DefaultApolloClient, apolloClient) })
    .use(plugin)
    .mount(el);
},
```

## Typed GraphQL with codegen

We use `@graphql-codegen` with the **client preset**. It scans
`resources/ts/**/*.{ts,tsx,vue}` for `graphql()` calls and writes typed
operations + a typed `graphql()` helper to `resources/ts/graphql/__generated__/`.
Config lives in **`codegen.ts`** with a **`graphqlLoader.ts`** schema loader
(introspects the GD API via OAuth). Because this project is `"type": "module"`,
`ts-node` can't load a `.ts` codegen config (ESM + `moduleResolution: bundler`),
so the `codegen` script runs graphql-codegen under **tsx**
(`NODE_OPTIONS="--import tsx"`), which transpiles both the config and the loader.
Note the loader hits `GD_API_GRAPHQL_URL` (the API host, `api.gorilladash.com`)
for introspection — not the runtime `VITE_GD_API_GRAPHQL_URL` edge host.
Regenerate with:

```bash
npm run codegen
```

You write operations with the generated `graphql()` (not raw `gql`), which makes
queries and their results fully typed. `graphql/__generated__/` is generated —
never hand-edit it.

## The `api/` layer — one file per domain entity

GraphQL operations live in **`api/`**, one file per domain (e.g.
`api/products.ts`), exposing composables the components call. This keeps queries
reusable and out of component files.

```ts
// resources/ts/api/products.ts
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '@/graphql/__generated__'
import type { ResultOf } from '@graphql-typed-document-node/core'

export const ProductsQuery = graphql(/* GraphQL */ `
  query Products {
    products {
      id
      name
      slug
    }
  }
`)

export type Product = ResultOf<typeof ProductsQuery>['products'][number]

export function useProducts() {
  const { result, loading, error, refetch } = useQuery(ProductsQuery)
  return { result, loading, error, refetch }
}
```

Consume it in a component — keep templates thin, derive a safe default:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useProducts } from '@/api/products'

const { result, loading } = useProducts()
const products = computed(() => result.value?.products ?? [])
</script>

<template>
  <div
    v-if="loading"
    class="h-6 w-32 animate-pulse rounded bg-gray-200"
  />
  <ul v-else>
    <li
      v-for="p in products"
      :key="p.id"
    >
      {{ p.name }}
    </li>
  </ul>
</template>
```

Pass variables reactively so the query re-runs on change:

```ts
const { result } = useQuery(ProductQuery, () => ({ slug: props.slug }))
```

## Mutations

Also live in `api/`, wrapping `useMutation`. After a mutation, update the Apollo
cache or refetch so the UI reflects the change.

```ts
// resources/ts/api/enquiries.ts
import { useMutation } from '@vue/apollo-composable'
import { graphql } from '@/graphql/__generated__'

export const CreateEnquiry = graphql(/* GraphQL */ `
  mutation CreateEnquiry($input: EnquiryInput!) {
    createEnquiry(input: $input) {
      id
    }
  }
`)

export function useCreateEnquiry() {
  return useMutation(CreateEnquiry, { refetchQueries: ['Enquiries'] })
}
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useCreateEnquiry } from '@/api/enquiries'

const message = ref('')
const { mutate, loading, onDone } = useCreateEnquiry()
onDone(() => {
  message.value = ''
})
</script>

<template>
  <form @submit.prevent="mutate({ input: { message } })">
    <input v-model="message" />
    <button :disabled="loading">Send</button>
  </form>
</template>
```

**Business forms are GraphQL mutations, not Inertia `useForm`.** Bind inputs with
`v-model` + refs and submit through a `useMutation` wrapper. (Inertia's
`useForm`/`<Form>` + Wayfinder are reserved for Laravel-backed posts such as
auth — see `routing-wayfinder.md`.)

## Client state: Pinia (`stores/`)

Setup-style stores, one concern each. Use them for shared _client_ state only —
server data belongs in Apollo's cache. For state that should survive reloads,
back it with VueUse's `useStorage` (this is the SAR pattern).

```ts
// resources/ts/stores/favourites.ts
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export const useFavouritesStore = defineStore('favourites', () => {
  const ids = useStorage<number[]>('favourites', [])
  const add = (id: number) => {
    if (!ids.value.includes(id)) ids.value.push(id)
  }
  const remove = (id: number) => {
    ids.value = ids.value.filter((x) => x !== id)
  }
  return { ids, add, remove }
})
```

Register Pinia once in `app.ts` (`createApp(...).use(createPinia())`).

## Below-the-fold / on-demand data

Prefer a GraphQL query that runs when needed over an eagerly-loaded prop:

- Gate a `useQuery` with its `enabled` option (run only once a panel opens).
- Or trigger loading on scroll with Inertia's `WhenVisible` wrapping the
  component that owns the query.

Always render a skeleton while `loading` is true — a bare `v-if` with an empty
falsy branch makes the page look broken mid-load.

## Navigation

Use `<Link>` from `@inertiajs/vue3` (not `<a>`) for internal navigation so it
stays a client-side Inertia visit; `router.visit(...)` for programmatic moves.
Feed hrefs from Wayfinder (`show.url(id)`), never hardcoded strings — see
`routing-wayfinder.md`.
