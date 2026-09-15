<script setup lang="ts">
/**
 * Franchising call-to-action at the foot of the Locations page: a food-photo
 * backdrop with a light wash, headline + blurb on the left, magenta CTA on the
 * right. A backdrop image with a colour overlay, like HomeHero.
 */
import FastlyOptimizedImage from '@/components/core/FastlyOptimizedImage.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { bgPath } from '@/lib/gcs'
import { bannerSizes, photoOptions } from '@/lib/imagePresets'
import type { OpenLocationContent } from '@/types/locations'

const appBg = `${bgPath}/app-bg.jpg`

defineProps<{ content: OpenLocationContent }>()
</script>

<template>
  <section class="relative overflow-hidden">
    <div
      class="absolute inset-0"
      aria-hidden="true"
    >
      <FastlyOptimizedImage
        :src="appBg"
        alt=""
        class-name="h-full w-full object-cover"
        :responsive-sizes="bannerSizes"
        :optimization-options="photoOptions"
      />
      <div class="absolute inset-0 bg-brand-tint/85"></div>
    </div>

    <div
      class="relative container flex flex-col gap-8 py-16 lg:flex-row lg:items-center lg:justify-between lg:py-20"
    >
      <div class="max-w-3xl">
        <h2
          class="font-condensed text-4xl leading-none font-medium tracking-wider text-brand-primary uppercase sm:text-5xl lg:text-6xl"
        >
          {{ content.title }}
        </h2>
        <p
          class="mt-5 font-serif text-base leading-relaxed font-bold tracking-wide text-brand-primary sm:text-lg"
        >
          {{ content.description }}
        </p>
      </div>

      <AppButton
        :href="content.cta.href"
        class="shrink-0"
        >{{ content.cta.label }}</AppButton
      >
    </div>
  </section>
</template>
