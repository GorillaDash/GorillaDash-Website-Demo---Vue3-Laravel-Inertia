<script setup lang="ts">
import { onMounted } from 'vue'
import { DEMO_THEMES, useDemoControls } from '@/composables/useDemoControls'

/**
 * The floating control a presenter uses at the stand: switch Structure view on and
 * off (also the S key) and re-skin the site with one of three themes.
 */
const { structureView, theme, init, toggleStructureView, setTheme } = useDemoControls()

onMounted(init)
</script>

<template>
  <div
    class="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-full bg-[#231a6e] py-2 pr-3 pl-2 font-sans text-sm text-white shadow-xl ring-1 ring-white/15"
    role="region"
    aria-label="Demo controls"
  >
    <span
      class="grid size-8 place-items-center rounded-full bg-[#d81f26] text-xs font-bold"
      aria-hidden="true"
      >GD</span
    >

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
        :class="structureView ? 'bg-[#d81f26]' : 'bg-white/25'"
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
        class="size-6 cursor-pointer rounded-full ring-2 ring-offset-2 ring-offset-[#231a6e] transition"
        :class="theme === option.value ? 'ring-white' : 'ring-transparent hover:ring-white/40'"
        :style="{ backgroundColor: option.swatch }"
        @click="setTheme(option.value)"
      >
        <span class="sr-only">{{ option.label }} theme</span>
      </button>
    </div>
  </div>
</template>
