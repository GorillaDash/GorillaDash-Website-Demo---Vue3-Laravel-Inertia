<script setup lang="ts">
import CmsBlock from '@/components/demo/CmsBlock.vue'
import SmartImage from '@/components/ui/SmartImage.vue'
import { STRUCTURE, type StructureInfo } from '@/constants/structure'

/** The heading band at the top of every inner page, fed by the page's CMS fields. */
withDefaults(
  defineProps<{
    eyebrow?: string
    title: string
    subtitle?: string
    image?: string
    info?: StructureInfo
    detail?: string
  }>(),
  { eyebrow: '', subtitle: '', image: '', info: () => STRUCTURE.page, detail: undefined }
)
</script>

<template>
  <CmsBlock
    :info="info"
    :detail="detail"
    as="section"
    class="relative overflow-hidden bg-brand-primary text-white"
  >
    <SmartImage
      v-if="image"
      :src="image"
      alt=""
      eager
      class="absolute inset-0 size-full opacity-35"
    />
    <div
      class="absolute inset-0 bg-linear-to-r from-brand-primary via-brand-primary/85 to-brand-primary/30"
      aria-hidden="true"
    />
    <div class="relative container py-16 sm:py-20 lg:py-24">
      <div class="max-w-3xl">
        <p
          v-if="eyebrow"
          class="mb-4 text-sm font-semibold tracking-widest text-brand-tint-strong uppercase"
        >
          {{ eyebrow }}
        </p>
        <h1 class="heading-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
          <span
            v-if="!title"
            class="inline-block h-12 w-2/3 animate-pulse rounded bg-white/15"
          />
          {{ title }}
        </h1>
        <p
          v-if="subtitle"
          class="mt-5 max-w-2xl text-lg leading-relaxed text-white/85"
        >
          {{ subtitle }}
        </p>
        <div
          v-if="$slots.default"
          class="mt-8"
        >
          <slot />
        </div>
      </div>
    </div>
  </CmsBlock>
</template>
