<script setup lang="ts">
import { computed } from 'vue'
import {
  generateResponsiveImage,
  type ImageOptimizationOptions,
  type ResponsiveImageSizes
} from '@services/imageOptimizationService'

interface Props {
  src: string
  alt: string
  className?: string
  responsiveSizes?: ResponsiveImageSizes
  optimizationOptions?: Omit<ImageOptimizationOptions, 'width'>
  /**
   * Standard HTML `sizes` attribute describing the rendered width
   * (e.g. `(min-width: 1024px) 33vw, 100vw`). When omitted the image is
   * assumed to be full-width (100vw). Applied to every `<source>`/`<img>`;
   * the per-breakpoint `media` gates keep each candidate selection correct.
   */
  sizes?: string
  lazy?: boolean
  /**
   * `fetchpriority` hint for the underlying `<img>`. Set `'high'` on the LCP
   * image so the browser prioritizes it (Lighthouse's LCP-discovery audit wants
   * this on the largest element). Leave unset for everything else.
   */
  fetchPriority?: 'high' | 'low' | 'auto'
  /**
   * Intrinsic (natural) pixel dimensions of the source asset, emitted as the
   * img width/height attributes. Required for any image whose CSS leaves one
   * axis auto (e.g. `w-full` with auto height): without the ratio hint it lays
   * out at 0 height and shifts everything below when the file arrives. CSS
   * still controls the rendered size; after load the natural ratio wins, so a
   * stale value can't distort the image — it only weakens the reservation.
   */
  width?: number
  height?: number
}

const {
  responsiveSizes = undefined,
  optimizationOptions = undefined,
  sizes = undefined,
  lazy = true,
  fetchPriority = undefined,
  width = undefined,
  height = undefined,
  className = '',
  src,
  alt
} = defineProps<Props>()

const emit = defineEmits<{
  load: [event: Event]
}>()

const optimizedImage = computed(() => {
  if (!src) return null

  return generateResponsiveImage(src, responsiveSizes, optimizationOptions)
})

const handleImageLoad = (event: Event) => {
  emit('load', event)
}
</script>

<template>
  <picture
    v-if="optimizedImage"
    class="contents"
  >
    <!-- Mobile -->
    <source
      :srcset="optimizedImage.srcsetMobile"
      :sizes="sizes || optimizedImage.sizes.mobile"
      media="(max-width: 767px)"
    />
    <!-- Tablet -->
    <source
      :srcset="optimizedImage.srcsetTablet"
      :sizes="sizes || optimizedImage.sizes.tablet"
      media="(min-width: 768px) and (max-width: 1023px)"
    />
    <!-- Desktop -->
    <img
      :src="optimizedImage.src"
      :srcset="optimizedImage.srcset"
      :sizes="sizes || optimizedImage.sizes.desktop"
      :alt="alt"
      :class="className"
      :width="width"
      :height="height"
      :loading="lazy ? 'lazy' : 'eager'"
      :fetchpriority="fetchPriority"
      @load="handleImageLoad"
    />
  </picture>
  <img
    v-else
    :src="src"
    :alt="alt"
    :class="className"
    :width="width"
    :height="height"
    :loading="lazy ? 'lazy' : 'eager'"
    :fetchpriority="fetchPriority"
    @load="handleImageLoad"
  />
</template>
