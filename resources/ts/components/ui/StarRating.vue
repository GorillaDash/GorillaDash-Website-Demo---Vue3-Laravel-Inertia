<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ rating: number; size?: string }>(), { size: 'size-4' })

const stars = computed(() =>
  Array.from({ length: 5 }, (_, index) => Math.max(0, Math.min(1, props.rating - index)))
)
</script>

<template>
  <span
    class="inline-flex items-center gap-0.5 text-brand-accent"
    :aria-label="`${rating.toFixed(1)} out of 5 stars`"
    role="img"
  >
    <svg
      v-for="(fill, index) in stars"
      :key="index"
      :class="size"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <defs>
        <linearGradient :id="`star-${index}-${Math.round(rating * 10)}`">
          <stop
            :offset="`${fill * 100}%`"
            stop-color="currentColor"
          />
          <stop
            :offset="`${fill * 100}%`"
            stop-color="currentColor"
            stop-opacity="0.25"
          />
        </linearGradient>
      </defs>
      <path
        :fill="`url(#star-${index}-${Math.round(rating * 10)})`"
        d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z"
      />
    </svg>
  </span>
</template>
