import { computed } from 'vue'
import { getTribes } from '@/api/tribes'
import { SupportCountryName, useCountryLimitsStore } from '@/stores/countryLimits'
import type { StoreLocation } from '@/constants/locations'

// CMS tribe-type name per market. USA is the fallback (every market resolves to it).
const TRIBE_TYPE_BY_COUNTRY = new Map<SupportCountryName, string>([
  [SupportCountryName.USA, 'Juniper Table Restaurants']
])

// "New Hampshire" → "new-hampshire" for the {state} URL segment.

/**
 * Map a tribe/store (anything carrying these fields — getTribes or searchStores
 * results) to the map + list marker shape used by GoogleMap and the store list.
 */
export function toStoreLocation(
  store: {
    slug?: string | null
    name?: string | null
    address_1?: string | null
    address_2?: string | null
    locality?: string | null
    postal_code?: string | null
    latitude?: string | null
    longitude?: string | null
  },
  index = 0
): StoreLocation {
  return {
    id: store.slug ?? String(index),
    name: store.name ?? '',
    distanceMi: 0,
    addressLine1: [store.address_1, store.address_2].filter(Boolean).join(', '),
    addressLine2: [store.locality, store.postal_code].filter(Boolean).join(' '),
    lat: Number(store.latitude ?? 0),
    lng: Number(store.longitude ?? 0)
  }
}

/** The CMS tribe-type name for the active market (USA is the fallback). */
export function useTribeType(): string {
  const countryStore = useCountryLimitsStore()
  return (
    TRIBE_TYPE_BY_COUNTRY.get(countryStore.state.country) ??
    TRIBE_TYPE_BY_COUNTRY.get(SupportCountryName.USA)!
  )
}

/**
 * Loads every store (tribe) for the active market. `states` groups them for the
 * The live store list for the locations directory (map + list).
 */
export function useLocationsService() {
  const { result, loading } = getTribes({ tribeType: useTribeType(), order: ['name'] })

  const tribes = computed(() => result.value?.tribes ?? [])

  return { tribes, loading }
}
