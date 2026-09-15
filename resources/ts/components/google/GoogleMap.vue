<script setup lang="ts">
/* global google */
/**
 * Google map for the location finder. Markers are AdvancedMarkerElement (the classic
 * google.maps.Marker is deprecated — see the Maps JS libraries docs); clicking one
 * opens a brand-styled InfoWindow. Google keeps its own internal state, so the map,
 * markers and InfoWindow are plain (non-reactive) variables.
 */
import { h, onMounted, ref, render, watch } from 'vue'
import type { StoreLocation } from '@/constants/locations'
import { loadLibrary } from '@/services/google/googleLoader'
import { runtimeConfig } from '@/runtimeConfig'
import { useLocale } from '@/composables/useLocale'
import MapInfoWindow from '@/components/google/MapInfoWindow.vue'

const { locations, activeId } = defineProps<{
  locations: StoreLocation[]
  /** Highlighted location (e.g. the hovered/selected list row) — map pans to it. */
  activeId?: string | null
}>()

const emit = defineEmits<{ markerClick: [id: string] }>()

// MapInfoWindow renders detached from this app, so it can't read page props itself —
// the locale for its store link has to be handed down.
const { localeCode } = useLocale()

// South Florida — fallback before fitBounds runs / if there are no locations.
const DEFAULT_CENTER = { lat: 26.27, lng: -80.18 }
// AdvancedMarkerElement requires a Map ID. Falls back to Google's DEMO id when none
// is configured (GOOGLE_MAP_ID → runtime config) so pins still render.
//
// `||`, not `??`: a `.env` line that is PRESENT but blank (`GOOGLE_MAP_ID=`) reaches
// here as an empty string, which `??` passes straight through — Google then logs
// "The map is initialized without a valid Map ID" once per marker and renders none of
// them, with the "This page can't load Google Maps correctly" dialog on top. Same rule
// as the CMS URL fields: '' means unset. Note the demo id is a stopgap — set a real
// Map ID (Google Cloud console → Maps → Map management) for any real deployment.
const MAP_ID = runtimeConfig().googleMapId || 'DEMO_MAP_ID'
// Pin colours, from the design tokens in resources/css/app.css @theme. PinElement
// accepts any CSS colour string; var() resolves because @theme emits these onto
// :root and custom properties inherit into the marker's DOM (incl. its shadow root).
const PIN_BACKGROUND = 'var(--color-map-pin)'
const PIN_BORDER = 'var(--color-map-pin-border)'

const mapEl = ref<HTMLElement | null>(null)
let map: google.maps.Map | null = null
let markers: google.maps.marker.AdvancedMarkerElement[] = []
let infoWindow: google.maps.InfoWindow | null = null
let infoContainer: HTMLElement | null = null

const fitToMarkers = () => {
  if (!map || !markers.length) {
    return
  }

  // A single store has no extent to fit — center on it at neighbourhood zoom.
  if (markers.length === 1) {
    map.setCenter({ lat: locations[0].lat, lng: locations[0].lng })
    map.setZoom(14)

    return
  }

  const bounds = new google.maps.LatLngBounds()
  locations.forEach((l) => bounds.extend({ lat: l.lat, lng: l.lng }))
  map.fitBounds(bounds, 64)
}

// Render the Vue InfoWindow content into a detached node and open it on the marker.
const openInfoWindow = (
  marker: google.maps.marker.AdvancedMarkerElement,
  location: StoreLocation
) => {
  infoWindow?.close()
  // Unmount the previous content before reusing a fresh container.
  if (infoContainer) {
    render(null, infoContainer)
  }
  infoContainer = document.createElement('div')
  render(h(MapInfoWindow, { location, localeCode: localeCode.value }), infoContainer)

  infoWindow ??= new google.maps.InfoWindow()
  infoWindow.setContent(infoContainer)
  infoWindow.open({ anchor: marker, map })
}

const renderMarkers = async () => {
  if (!map) {
    return
  }

  const { AdvancedMarkerElement, PinElement } = await loadLibrary('marker')

  markers.forEach((m) => (m.map = null))
  markers = locations.map((loc) => {
    const pin = new PinElement({
      background: PIN_BACKGROUND,
      borderColor: PIN_BORDER,
      glyphColor: 'white'
    })
    const marker = new AdvancedMarkerElement({
      map,
      // The PinElement itself, not `pin.element` — that property is deprecated, and
      // PinElement extends HTMLElement so it IS the node `content` wants.
      position: { lat: loc.lat, lng: loc.lng },
      content: pin,
      title: loc.name,
      gmpClickable: true
    })
    // `addEventListener('gmp-click')`, not `addListener('click')`: AdvancedMarkerElement
    // is a custom element, so it dispatches real DOM events and the old MVCObject
    // listener API is deprecated on it. `gmpClickable` above is what emits this event.
    marker.addEventListener('gmp-click', () => {
      emit('markerClick', loc.id)
      openInfoWindow(marker, loc)
    })

    return marker
  })
  fitToMarkers()
}

onMounted(async () => {
  await loadLibrary('maps')

  if (!mapEl.value) {
    return
  }

  map = new google.maps.Map(mapEl.value, {
    center: DEFAULT_CENTER,
    zoom: 10,
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    mapId: MAP_ID
  })
  renderMarkers()
})

watch(() => locations, renderMarkers, { deep: true })

watch(
  () => activeId,
  (id) => {
    const loc = locations.find((l) => l.id === id)

    if (loc && map) {
      map.panTo({ lat: loc.lat, lng: loc.lng })
    }
  }
)

defineExpose({
  panTo(point: google.maps.LatLngLiteral, zoom = 12) {
    if (map) {
      map.panTo(point)
      map.setZoom(zoom)
    }
  }
})
</script>

<template>
  <div
    ref="mapEl"
    class="h-full min-h-72 w-full"
  ></div>
</template>
