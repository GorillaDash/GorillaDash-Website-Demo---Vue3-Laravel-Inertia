import { toValue, type MaybeRefOrGetter } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useQuery } from '@/composables/useQuery'
import {
  GetTribeDocument,
  GetTribesDocument,
  SearchStoresDocument,
  TribeInfoFragmentDoc
} from './tribes.generated'
import type { ResultOf } from '@graphql-typed-document-node/core'

// Sources live in ./tribes.graphql. Import the generated consts
// directly instead of the `graphql()` helper — see codegen.ts for why.
export const tribeFragment = TribeInfoFragmentDoc

/** Run imperatively via the Apollo client — see useSearchStores. */
export const searchStoresQuery = SearchStoresDocument

export type TribeInfoResult = ResultOf<typeof tribeFragment>
export type SearchStoresResult = ResultOf<typeof searchStoresQuery>

export type TelephoneUrlTriggerType = {
  name: string
  number: string
  value: string
}

/** Every store for a market (by tribe-type name), ordered server-side. */
export function getTribes(variables: { tribeType: string; order: string[] }) {
  return useQuery(GetTribesDocument, variables)
}

/**
 * The store location for a slug. Pass a getter/ref so the query refetches when the
 * slug changes between /locations/{slug} sub-pages (the layout stays mounted).
 */
export function getTribe(slug: MaybeRefOrGetter<string>) {
  const { locale } = useLocale()

  // TribeInfo carries the store's CMS contents, not just its address, so this one is
  // translatable. `tribes` (the directory list) has no locale argument and needs none —
  // it selects name, address and geo only.
  return useQuery(GetTribeDocument, () => ({ slug: toValue(slug), locale: locale.value }))
}
