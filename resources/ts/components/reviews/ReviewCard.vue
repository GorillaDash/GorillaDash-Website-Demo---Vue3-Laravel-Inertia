<script setup lang="ts">
import StarRating from '@/components/ui/StarRating.vue'
import type { ReviewResult } from '@/api/reviews'
import { initials } from '@/lib/format'

withDefaults(defineProps<{ review: ReviewResult; showTribe?: boolean }>(), { showTribe: true })
</script>

<template>
  <figure
    class="flex h-full flex-col gap-4 rounded-card border border-brand-tint-strong bg-white p-6"
  >
    <StarRating :rating="review.rating ?? 5" />
    <blockquote class="flex-1 leading-relaxed text-ink">“{{ review.review }}”</blockquote>
    <figcaption class="flex items-center gap-3 border-t border-brand-tint pt-4">
      <span
        class="grid size-10 place-items-center rounded-full bg-brand-primary text-sm font-semibold text-white"
      >
        {{ initials(review.name ?? 'Guest') }}
      </span>
      <span class="text-sm">
        <span class="block font-semibold text-brand-primary">{{ review.name }}</span>
        <span
          v-if="showTribe && review.tribe?.name"
          class="text-muted"
          >{{ review.tribe.name.replace(/^Juniper Table\s+/i, '') }}</span
        >
      </span>
    </figcaption>
  </figure>
</template>
