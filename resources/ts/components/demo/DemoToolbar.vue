<script setup lang="ts">
import { onMounted } from 'vue'
import { DEMO_THEMES, useDemoControls } from '@/composables/useDemoControls'

/**
 * The floating control a presenter uses at the stand: switch Structure view on and
 * off (also the S key) and re-skin the site with one of three themes. It carries the
 * Gorilla Dash wordmark, so visitors can see whose platform the site is built on.
 * The logo is the one gorilladash.com itself loads from the Gorilla Dash CDN.
 */
const GORILLA_DASH_LOGO = 'https://cdn.gorilladash.com/images/media/6109953/GorillaDash.png'

const { structureView, theme, init, toggleStructureView, setTheme } = useDemoControls()

onMounted(init)
</script>

<template>
  <div
    class="fixed bottom-4 left-4 z-50 flex items-stretch overflow-hidden rounded-full font-sans text-sm shadow-xl ring-1 ring-[#2A1968]/15"
    role="region"
    aria-label="Gorilla Dash demo controls"
  >
    <a
      href="https://gorilladash.com"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center gap-2 bg-white py-2 pr-3 pl-4 hover:bg-[#F5F5F8]"
      title="Built on Gorilla Dash"
    >
      <img
        :src="GORILLA_DASH_LOGO"
        alt="Gorilla Dash"
        width="1016"
        height="216"
        class="h-4 w-auto sm:h-6"
      />
      <span
        class="hidden rounded-full bg-[#BF161B] px-2 py-0.5 text-[0.625rem] font-bold tracking-wider text-white uppercase sm:inline"
        >Demo</span
      >
    </a>

    <div class="flex items-center gap-3 bg-[#2A1968] py-2 pr-3 pl-2 text-white">
      <button
        type="button"
        role="switch"
        :aria-checked="structureView"
        class="flex cursor-pointer items-center gap-2 rounded-full px-1 py-1 hover:bg-white/10"
        title="Structure view (S)"
        @click="toggleStructureView"
      >
        <span
          class="relative h-5 w-9 rounded-full transition-colors"
          :class="structureView ? 'bg-[#BF161B]' : 'bg-white/25'"
        >
          <span
            class="absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform"
            :class="structureView && 'translate-x-4'"
          />
        </span>
        <span class="hidden font-medium sm:inline">Structure view</span>
      </button>

      <span
        class="h-5 w-px bg-white/20"
        aria-hidden="true"
      />

      <div
        class="flex items-center gap-1.5"
        role="radiogroup"
        aria-label="Theme"
      >
        <button
          v-for="option in DEMO_THEMES"
          :key="option.value"
          type="button"
          role="radio"
          :aria-checked="theme === option.value"
          :title="`${option.label} theme`"
          class="size-6 cursor-pointer rounded-full ring-2 ring-offset-2 ring-offset-[#2A1968] transition"
          :class="theme === option.value ? 'ring-white' : 'ring-transparent hover:ring-white/40'"
          :style="{ backgroundColor: option.swatch }"
          @click="setTheme(option.value)"
        >
          <span class="sr-only">{{ option.label }} theme</span>
        </button>
      </div>
    </div>
  </div>
</template>
