<script setup lang="ts">
/**
 * "Find your Acme Diner" search card above a live map. Type an address → Google
 * Places autocomplete → on select, search the closest stores (within radius) and
 * show them both in the dropdown and on the map. "Use My Location" pans the map to
 * the visitor. Ported from the old StoreLocator's search flow.
 */
import { useTranslate } from '@tolgee/vue'
import { computed, ref } from 'vue'
import { router } from '@inertiajs/vue3'
import { onClickOutside } from '@vueuse/core'
import { useLocale } from '@/composables/useLocale'
import { usePagePaths } from '@/composables/usePagePaths'
import GoogleMap from '@/components/google/GoogleMap.vue'
import GoogleAutocomplete from '@/components/google/GoogleAutocomplete.vue'
import StoreSearchResults from '@/components/location/StoreSearchResults.vue'
import IconMapPin from '@/components/icons/IconMapPin.vue'
import IconSearch from '@/components/icons/IconSearch.vue'
import type { StoreLocation } from '@/constants/locations'
import { useLocationsService, toStoreLocation } from '@/services/locationsService'
import { useSearchStores, type SearchStore, type SearchPoint } from '@/services/searchStoreService'

defineProps<{
  headerTitle: string
  searchPlaceholder: string
}>()

const { t } = useTranslate()
const { localizedUrl } = useLocale()
const { cmsRoute } = usePagePaths()

const address = ref<string | null | undefined>('')
const { stores, showResultList, search, hideResults } = useSearchStores()
// Every store in the market — shown on the map before any search runs.
const { tribes } = useLocationsService()

const locating = ref(false)
const activeId = ref<string | null>(null)
const searchArea = ref<HTMLElement | null>(null)
const mapRef = ref<{ panTo: (point: { lat: number; lng: number }, zoom?: number) => void } | null>(
  null
)

onClickOutside(searchArea, () => hideResults())

// The map shows the search results once a search runs; before that, every store.
const displayLocations = computed<StoreLocation[]>(() => {
  const source: SearchStore[] = stores.value?.length ? stores.value : tribes.value
  return source.map(toStoreLocation)
})

const onPlaceChange = (place: SearchPoint) => {
  search(place)
  mapRef.value?.panTo({ lat: place.lat, lng: place.lng }, 11)
}

// Selecting a result opens that store's detail page (/locations/{slug}).
const onSelectStore = (store: SearchStore) => {
  if (store.slug) {
    router.visit(localizedUrl(cmsRoute('locations.show', { slug: store.slug })))
  }
}

const useMyLocation = () => {
  if (!navigator.geolocation) {
    return
  }

  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      locating.value = false
      mapRef.value?.panTo({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      })
    },
    () => {
      locating.value = false
    },
    { enableHighAccuracy: true, timeout: 8000 }
  )
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <!-- Search card -->
    <div class="rounded-3xl bg-brand-tint/90 p-8 sm:p-10">
      <h2
        class="font-condensed text-3xl leading-none font-medium tracking-wider text-brand-primary uppercase sm:text-4xl lg:text-5xl"
      >
        {{ headerTitle }}
      </h2>

      <div class="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          ref="searchArea"
          class="relative flex-1"
        >
          <div class="flex items-center gap-3 border-b border-brand-secondary/40 pb-3">
            <IconSearch class="h-5 w-5 shrink-0 text-brand-secondary" />
            <GoogleAutocomplete
              v-model:address="address"
              class="w-full bg-transparent font-serif font-bold tracking-wider text-brand-primary placeholder:text-brand-primary/60 focus:outline-none"
              :placeholder="searchPlaceholder"
              @change="onPlaceChange"
              @start="hideResults"
            />
          </div>

          <div
            v-if="showResultList"
            class="absolute inset-x-0 top-full z-20 mt-2"
          >
            <StoreSearchResults
              :stores="stores"
              :address="address ?? ''"
              @select="onSelectStore"
            />
          </div>
        </div>

        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-brand-secondary px-8 py-3.5 font-serif text-base font-bold tracking-wider whitespace-nowrap text-brand-secondary transition-colors hover:bg-brand-secondary hover:text-white disabled:opacity-60"
          :disabled="locating"
          @click="useMyLocation"
        >
          <IconMapPin class="h-5 w-5" />
          {{
            locating ? t('Locating', 'Locating') + '...' : t('Use My Location', 'Use My Location')
          }}
        </button>
      </div>
    </div>

    <!-- Map -->
    <div class="overflow-hidden rounded-3xl">
      <GoogleMap
        ref="mapRef"
        :locations="displayLocations"
        :active-id="activeId"
        class="h-96 lg:h-100"
        @marker-click="activeId = $event"
      />
    </div>
  </div>
</template>
