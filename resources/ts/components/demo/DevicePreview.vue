<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { DEMO_DEVICES, useDemoControls } from '@/composables/useDemoControls'

/**
 * The tablet and mobile previews: the site loaded again in an iframe with that
 * device's real screen width, drawn inside a device bezel and scaled down when the
 * presenter's screen is too short to show it at full size.
 *
 * The iframe source is captured once, when the preview opens. Switching between
 * tablet and mobile only resizes the frame, so the visitor keeps their place, and
 * links clicked inside the preview never reload it from the outside.
 */
const BEZEL = 14
/** Room kept clear around the frame: the caption above and the demo control below. */
const GUTTER_X = 32
const GUTTER_TOP = 56
const GUTTER_BOTTOM = 96

const { device, frameUrl } = useDemoControls()

const src = frameUrl.value ?? '/'
const viewport = ref({ width: 1440, height: 900 })

const spec = computed(
  () => DEMO_DEVICES.find((option) => option.value === device.value) ?? DEMO_DEVICES[2]
)
const outerWidth = computed(() => spec.value.width + BEZEL * 2)
const outerHeight = computed(() => spec.value.height + BEZEL * 2)
const scale = computed(() =>
  Math.min(
    1,
    (viewport.value.width - GUTTER_X * 2) / outerWidth.value,
    (viewport.value.height - GUTTER_TOP - GUTTER_BOTTOM) / outerHeight.value
  )
)
const scalePercent = computed(() => Math.round(scale.value * 100))

const measure = (): void => {
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
}

onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
})

onBeforeUnmount(() => window.removeEventListener('resize', measure))
</script>

<template>
  <div
    class="fixed inset-0 z-40 flex flex-col items-center overflow-hidden bg-[#E8E8EF] font-sans"
    :style="{
      backgroundImage: 'radial-gradient(#2A196822 1px, transparent 1px)',
      backgroundSize: '18px 18px',
      paddingTop: `${GUTTER_TOP}px`
    }"
  >
    <p
      class="absolute top-4 flex items-center gap-2 text-xs font-medium text-[#5B5B66]"
      aria-live="polite"
    >
      <span class="font-semibold text-[#2A1968]">{{ spec.label }} preview</span>
      <span aria-hidden="true">·</span>
      <span>{{ spec.width }} × {{ spec.height }}</span>
      <template v-if="scalePercent < 100">
        <span aria-hidden="true">·</span>
        <span>shown at {{ scalePercent }}%</span>
      </template>
    </p>

    <div
      class="transition-[width,height] duration-300 ease-out"
      :style="{ width: `${outerWidth * scale}px`, height: `${outerHeight * scale}px` }"
    >
      <div
        class="origin-top-left bg-[#15151A] shadow-2xl ring-1 ring-black/40 transition-[width,height,border-radius] duration-300 ease-out"
        :class="device === 'mobile' ? 'rounded-[3.25rem]' : 'rounded-[2.5rem]'"
        :style="{
          width: `${outerWidth}px`,
          height: `${outerHeight}px`,
          padding: `${BEZEL}px`,
          transform: `scale(${scale})`
        }"
      >
        <iframe
          :src="src"
          title="Juniper Table website preview"
          class="block size-full bg-white"
          :class="device === 'mobile' ? 'rounded-[2.5rem]' : 'rounded-[1.75rem]'"
        />
      </div>
    </div>
  </div>
</template>
