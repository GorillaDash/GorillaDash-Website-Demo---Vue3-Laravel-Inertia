<script setup lang="ts">
import { computed } from 'vue'
import LocaleLink from '@/components/core/LocaleLink.vue'
import SmartImage from '@/components/ui/SmartImage.vue'
import { usePagePaths } from '@/composables/usePagePaths'
import { formatPrice } from '@/lib/format'
import type { MenuCard } from '@/services/foodMenuService'

const props = defineProps<{ card: MenuCard }>()

const { cmsRoute } = usePagePaths()

const href = computed(() =>
  cmsRoute('menu.item', { section: props.card.sectionSlug, item: props.card.slug })
)
</script>

<template>
  <LocaleLink
    :href="href"
    class="group flex h-full flex-col overflow-hidden rounded-card border border-brand-tint-strong bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
  >
    <div class="aspect-4/3 overflow-hidden">
      <SmartImage
        :src="card.image"
        :alt="card.name"
        class="size-full transition duration-500 group-hover:scale-105"
      />
    </div>
    <div class="flex flex-1 flex-col gap-2 p-5">
      <p class="text-xs font-semibold tracking-widest text-brand-accent uppercase">
        {{ card.sectionName }}
      </p>
      <h3 class="heading-display text-lg leading-snug text-brand-primary">{{ card.name }}</h3>
      <p class="line-clamp-2 text-sm leading-relaxed text-muted">{{ card.description }}</p>
      <div class="mt-auto flex items-center justify-between pt-3">
        <span class="font-semibold text-brand-primary">
          <span
            v-if="card.hasVariants"
            class="text-sm font-normal text-muted"
            >From
          </span>
          {{ formatPrice(card.fromPrice) }}
        </span>
        <span
          class="rounded-full bg-brand-tint px-3 py-1 text-sm font-semibold text-brand-primary group-hover:bg-brand-accent group-hover:text-brand-on-accent"
        >
          Add +
        </span>
      </div>
    </div>
  </LocaleLink>
</template>
