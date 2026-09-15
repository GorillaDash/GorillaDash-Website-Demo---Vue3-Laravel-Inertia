<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { openStatus, type OpenStatus } from '@/services/tribeHoursService'

/**
 * "Open until 3pm" in the tribe's own timezone. Rendered after mount only: the
 * answer depends on the clock, and a server-rendered one would not match the browser.
 */
const props = defineProps<{
  hours: unknown
  timezone: string | null | undefined
  openingSoon?: boolean
}>()

const status = ref<OpenStatus | null>(null)

onMounted(() => {
  status.value = openStatus(props.hours, props.timezone)
})
</script>

<template>
  <span
    v-if="openingSoon"
    class="inline-flex items-center gap-1.5 rounded-full bg-brand-secondary/15 px-2.5 py-1 text-xs font-semibold text-brand-primary"
  >
    <span class="size-1.5 rounded-full bg-brand-secondary" />
    Opening soon
  </span>
  <span
    v-else-if="status"
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
    :class="status.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'"
  >
    <span
      class="size-1.5 rounded-full"
      :class="status.isOpen ? 'bg-emerald-600' : 'bg-stone-500'"
    />
    {{ status.label }}
  </span>
  <span
    v-else
    class="inline-block h-6 w-28 animate-pulse rounded-full bg-brand-tint"
    aria-hidden="true"
  />
</template>
