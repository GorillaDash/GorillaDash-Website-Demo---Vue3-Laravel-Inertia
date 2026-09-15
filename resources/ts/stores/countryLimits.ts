import { defineStore } from 'pinia'
import { reactive, readonly } from 'vue'
import { runtimeConfig } from '@/runtimeConfig'

export enum SupportCountryName {
  USA = 'US',
  CANADA = 'CA',
  EGYPT = 'EG',
  GUYANA = 'GY'
}

// A value that differs per market (e.g. a CMS menu/field name). USA is the fallback,
// so every map must include a USA entry. Resolve with useCountryValue().
export type ByCountry<T> = Map<SupportCountryName, T>

export const useCountryLimitsStore = defineStore('countryLimits', () => {
  // Active market for this deployment, from runtime config (Inertia shared props,
  // set at boot) — per-country without a rebuild. Falls back to USA.
  const COUNTRY = (runtimeConfig().country as SupportCountryName) ?? SupportCountryName.USA

  const state = reactive({
    country: COUNTRY,
    isUSA: COUNTRY === SupportCountryName.USA,
    isCA: COUNTRY === SupportCountryName.CANADA,
    isEG: COUNTRY === SupportCountryName.EGYPT,
    isGY: COUNTRY === SupportCountryName.GUYANA
  })

  return {
    state: readonly(state)
  }
})
