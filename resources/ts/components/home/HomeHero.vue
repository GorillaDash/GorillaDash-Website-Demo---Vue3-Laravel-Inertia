<script setup lang="ts">
import { computed } from 'vue'
import FastlyOptimizedImage from '@/components/core/FastlyOptimizedImage.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { bgPath } from '@/lib/gcs'
import { bannerSizes, photoOptions } from '@/lib/imagePresets'
import type { HeroContent } from '@/types/home'

/**
 * Full-bleed hero: one background image behind a scrim, with the heading,
 * subheading and CTA the CMS supplies. Deliberately plain — it exists to show
 * the pattern (CMS text over a CDN-served, Fastly-optimized image), not a look.
 *
 * The background is the CMS `Banner Image` when set, falling back to the
 * starter's own asset so a fresh checkout with no CMS credentials still renders.
 */
const props = defineProps<{ content: HeroContent }>()

const fallbackBg = `${bgPath}/hero-bg.jpg`

const background = computed(() => props.content.image || fallbackBg)
</script>

<template>
  <section class="relative isolate flex min-h-104 items-center overflow-hidden lg:min-h-136">
    <!-- Decorative: the heading below carries the meaning. Eager + high priority
         because this is the LCP element on the homepage — lazy-loading it costs
         seconds on throttled mobile. -->
    <FastlyOptimizedImage
      :src="background"
      alt=""
      class-name="absolute inset-0 -z-10 h-full w-full object-cover"
      :responsive-sizes="bannerSizes"
      :optimization-options="photoOptions"
      :lazy="false"
      fetch-priority="high"
    />

    <!-- Scrim: keeps the text readable whatever the client's image turns out to be. -->
    <div
      class="absolute inset-0 -z-10 bg-brand-primary/60"
      aria-hidden="true"
    ></div>

    <div class="container flex flex-col items-start gap-6 py-16 text-white lg:py-24">
      <h1 class="max-w-3xl">
        <span
          class="block font-condensed text-4xl leading-none font-medium tracking-wider uppercase sm:text-5xl lg:text-6xl xl:text-7xl"
        >
          {{ content.heading }}
        </span>
        <span
          v-if="content.subheading"
          class="mt-4 block max-w-xl text-lg leading-relaxed text-white/90"
        >
          {{ content.subheading }}
        </span>
      </h1>

      <AppButton
        v-if="content.cta.label"
        :href="content.cta.href"
        >{{ content.cta.label }}</AppButton
      >
    </div>
  </section>
</template>
