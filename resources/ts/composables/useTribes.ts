import { computed } from 'vue'
import { getTribes } from '@/api/tribes'
import type { GetTribesQuery } from '@/api/tribes.generated'

export type TribeSummary = GetTribesQuery['tribes'][number]

/** The Gorilla Dash tribe type every Hungry Gorilla cafe belongs to. */
export const TRIBE_TYPE = 'Hungry Gorilla Cafes'

export function useTribes() {
  const { result, loading } = getTribes({ tribeType: TRIBE_TYPE, order: ['tribe_sort_order'] })

  const all = computed<TribeSummary[]>(() => result.value?.tribes ?? [])
  const trading = computed(() => all.value.filter((tribe) => tribe.status === 'Active'))
  const openingSoon = computed(() => all.value.filter((tribe) => tribe.status === 'Opening Soon'))
  const states = computed(() => new Set(all.value.map((tribe) => tribe.state).filter(Boolean)).size)

  return { all, trading, openingSoon, states, loading }
}
