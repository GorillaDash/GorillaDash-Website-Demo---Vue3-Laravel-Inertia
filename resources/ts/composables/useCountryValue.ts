import { SupportCountryName, useCountryLimitsStore, type ByCountry } from '@/stores/countryLimits'

// Resolves per-market values (CMS menu/component field names, …) for the active
// country (VITE_COUNTRY), falling back to USA. Call inside <script setup>; it returns
// a resolver you can reuse for several maps.
export function useCountryValue() {
  const { state } = useCountryLimitsStore()

  return <T>(byCountry: ByCountry<T>): T =>
    byCountry.get(state.country) ?? byCountry.get(SupportCountryName.USA)!
}
