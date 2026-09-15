import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { runtimeConfig } from '@/runtimeConfig'

let configured = false

/**
 * Configure the Google Maps JS API on first use, in the browser only. The
 * loader touches `window`, so calling it at module load crashes SSR. The
 * loader caches per-library, so repeated imports return the same promise.
 *
 * The API key comes from runtime config (Inertia shared props, set at boot in
 * app.ts) — per-deployment/per-country, NOT a build-time VITE_ var — so a single
 * image serves every country with its own key.
 */
export const loadLibrary: typeof importLibrary = (...args) => {
  if (!configured) {
    setOptions({
      key: runtimeConfig().googleMapApiKey ?? '',
      v: 'weekly',
      libraries: ['maps']
    })
    configured = true
  }
  return importLibrary(...args)
}
