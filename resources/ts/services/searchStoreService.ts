import { inject, ref } from 'vue'
import { APOLLO_CLIENT } from '@/composables/useQuery'
import { searchStoresQuery, type SearchStoresResult } from '@/api/tribes'
import { useTribeType } from '@/services/locationsService'

/** A single store in the search result list. */
export type SearchStore = NonNullable<SearchStoresResult['searchStores']>[number]

// Search radius in miles — matches the value the previous (vue-router) site used.
const SEARCH_RADIUS = 80

export type SearchPoint = { address: string; lat: number; lng: number }

/**
 * Address → nearby stores, ranked by distance. Ported from the old StoreLocator's
 * useGoogleSearch. There's no useLazyQuery in this app, so the query is run
 * imperatively via the Apollo client (injected the same way useQuery does it).
 */
export function useSearchStores() {
  const client = inject(APOLLO_CLIENT)
  if (!client) {
    throw new Error('useSearchStores: no Apollo client provided. Provide APOLLO_CLIENT in app.ts.')
  }

  const tribeType = useTribeType()

  const stores = ref<SearchStore[] | null>(null)
  const loading = ref(false)
  const showResultList = ref(false)

  const search = async ({ address, lat, lng }: SearchPoint) => {
    loading.value = true
    try {
      const { data } = await client.query({
        query: searchStoresQuery,
        variables: { tribe_type: tribeType, address, lat, lng, radius: SEARCH_RADIUS }
      })
      // Cap the list — the backend ranks by distance, we show the closest handful.
      stores.value = (data?.searchStores ?? []).slice(0, 10)
      showResultList.value = true
    } finally {
      loading.value = false
    }
  }

  const hideResults = () => {
    showResultList.value = false
  }

  const clear = () => {
    stores.value = null
    showResultList.value = false
  }

  return { stores, loading, showResultList, search, hideResults, clear }
}
