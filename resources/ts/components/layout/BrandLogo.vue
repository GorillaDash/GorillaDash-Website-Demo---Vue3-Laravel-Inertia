<script setup lang="ts">
import LocaleLink from '@/components/core/LocaleLink.vue'
import { logoPath } from '@/lib/gcs'

const logoWhite = `${logoPath}/logo-white.png`

/**
 * The brand wordmark, linked back to the homepage.
 * Sized by height so the 300×69 source keeps its aspect ratio; pass an
 * `h-*` class to override the default per placement (header vs footer).
 */
withDefaults(defineProps<{ class?: string }>(), { class: 'h-9' })
</script>

<template>
  <LocaleLink
    href="/"
    class="inline-flex shrink-0 items-center"
    aria-label="Acme Diner"
  >
    <img
      :src="logoWhite"
      alt="Acme Diner"
      width="300"
      height="69"
      :class="['w-auto', $props.class]"
    />
  </LocaleLink>
</template>
