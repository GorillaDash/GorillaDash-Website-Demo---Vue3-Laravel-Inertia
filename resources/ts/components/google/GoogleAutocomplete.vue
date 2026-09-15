<script setup lang="ts">
/* global google */
/**
 * Google Places (new API) autocomplete input. Ported from the old site's
 * GoogleAutocomplete, trimmed to what the store search needs: it emits `change`
 * with { lat, lng, address } when a place is picked. Differences from the original:
 * loads Maps in onMounted via this app's SSR-safe loader, and scopes predictions to
 * the active market's region (from the country store) instead of a VITE_ env var.
 */
import { onMounted, ref, watch } from 'vue'
import { onClickOutside, useFocus, watchDebounced } from '@vueuse/core'
import IconMapPin from '@/components/icons/IconMapPin.vue'
import { loadLibrary } from '@/services/google/googleLoader'
import { useCountryLimitsStore } from '@/stores/countryLimits'

defineOptions({ inheritAttrs: false })

const address = defineModel<string | null | undefined>('address', { required: true })
const model = defineModel<google.maps.LatLngLiteral | null | undefined>()

const emit = defineEmits<{
  change: [value: { lat: number; lng: number; address: string }]
  start: []
}>()

type PlacePrediction = {
  mainText: string | undefined | null
  secondaryText: string | undefined | null
  text: string | undefined | null
  place: google.maps.places.Place
  placeId: string | undefined
}

const countryStore = useCountryLimitsStore()
const includedRegionCodes = [countryStore.state.country.toLowerCase()]

const items = ref<PlacePrediction[]>([])
const showList = ref(false)
const searchValue = ref<string | null | undefined>(null)
const autocompleteInput = ref<HTMLInputElement | null>(null)
const autocompleteLists = ref<HTMLElement | null>(null)
const selectedItem = ref<PlacePrediction | null>(null)
const isSetSearchValue = ref(false)

let session: google.maps.places.AutocompleteSessionToken | null = null
let placesLib: google.maps.PlacesLibrary | null = null
const { focused } = useFocus(autocompleteInput)

const newSession = () => {
  session = new google.maps.places.AutocompleteSessionToken()
}

const focus = () => {
  if (items.value.length > 0) {
    showList.value = true
  }
}

// Arrow-key highlight, wrapping at both ends.
const moveDirection = (direction: 'UP' | 'DOWN') => {
  if (items.value.length === 0) {
    return
  }
  const head = items.value[0]
  const last = items.value[items.value.length - 1]
  if (last === head) {
    selectedItem.value = head ?? null
    return
  }
  if (selectedItem.value === null || selectedItem.value === (direction === 'UP' ? head : last)) {
    selectedItem.value = (direction === 'UP' ? last : head) ?? null
  } else {
    const step = direction === 'UP' ? -1 : 1
    const index = items.value.findIndex((item) => item.placeId === selectedItem.value?.placeId)
    selectedItem.value = items.value[index + step] ?? null
  }
}

const keydownEnter = () => {
  const place = selectedItem.value ?? items.value[0] ?? null
  if (place) {
    selectPlace(place)
  }
}

const selectPlace = async (place: PlacePrediction) => {
  if (!place.place) {
    return
  }
  await resolvePlace(place)
  showList.value = false
  items.value = []
  isSetSearchValue.value = true
  searchValue.value = place.text
}

const resolvePlace = async (place: PlacePrediction) => {
  try {
    await place.place.fetchFields({ fields: ['formattedAddress', 'location'] })
    const location = place.place.location!
    model.value = { lat: location.lat(), lng: location.lng() }
    address.value = place.place.formattedAddress
    emit('change', {
      lat: location.lat(),
      lng: location.lng(),
      address: place.place.formattedAddress!
    })
    newSession()
  } catch (e) {
    console.error(e)
  }
}

const searchPlace = async (text: string) => {
  try {
    emit('start')
    if (!placesLib || !session || text === '') {
      return
    }
    const { suggestions } = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: text,
      sessionToken: session,
      includedRegionCodes
    })
    const predictions: PlacePrediction[] = []
    for (const item of suggestions) {
      const prediction = item.placePrediction
      if (!prediction) {
        continue
      }
      predictions.push({
        text: prediction.text.text,
        mainText: prediction.mainText?.text,
        secondaryText: prediction.secondaryText?.text,
        place: prediction.toPlace(),
        placeId: prediction.placeId
      })
    }
    items.value = predictions
    showList.value = true
  } catch (e) {
    console.error(e)
  }
}

onClickOutside(autocompleteLists, () => {
  if (!focused.value) {
    showList.value = false
  }
})

watchDebounced(
  searchValue,
  (value) => {
    // Skip the echo from programmatically setting the input after a selection.
    if (isSetSearchValue.value) {
      isSetSearchValue.value = false
      return
    }
    if (value) {
      searchPlace(value)
    } else {
      items.value = []
    }
  },
  { debounce: 500 }
)

// Parent cleared the address → reset everything.
watch(address, (next, prev) => {
  if (!next && prev) {
    searchValue.value = null
    items.value = []
    model.value = null
    selectedItem.value = null
    showList.value = false
    isSetSearchValue.value = false
  }
})

// Browser-only: the loader touches `window`, so never run it during SSR.
onMounted(async () => {
  try {
    await loadLibrary('maps')
    placesLib = await loadLibrary('places')
    newSession()
  } catch (e) {
    console.error(e)
  }
})
</script>

<template>
  <div class="relative grow">
    <input
      ref="autocompleteInput"
      v-bind="$attrs"
      v-model="searchValue"
      type="text"
      autocomplete="off"
      @keydown.enter.self="keydownEnter"
      @keydown.down.prevent="moveDirection('DOWN')"
      @keydown.up.prevent="moveDirection('UP')"
      @focus.prevent="focus"
    />
    <div
      v-if="showList && items.length"
      ref="autocompleteLists"
      class="absolute top-full left-0 z-30 mt-2 w-full overflow-hidden rounded-xl border border-brand-primary/15 bg-white shadow-xl"
    >
      <button
        v-for="(place, key) in items"
        :key="`${place.placeId}_${key}`"
        type="button"
        class="flex w-full items-center gap-3 border-b border-brand-primary/10 px-4 py-2.5 text-left text-base last:border-none hover:bg-brand-tint/40"
        :class="{ 'bg-brand-tint/40': selectedItem?.placeId === place.placeId }"
        @click="selectPlace(place)"
      >
        <IconMapPin class="h-4 w-4 shrink-0 text-brand-secondary" />
        <span class="truncate">
          <span class="text-brand-secondary">{{ place.mainText }}</span>
          <span class="text-brand-primary/60"> {{ place.secondaryText }}</span>
        </span>
      </button>
    </div>
  </div>
</template>
