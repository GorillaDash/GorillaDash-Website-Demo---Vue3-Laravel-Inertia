<script setup lang="ts">
import { useDemoControls } from '@/composables/useDemoControls'
import type { StructureInfo } from '@/constants/structure'

/**
 * Wraps one section of a page. Invisible normally; with Structure view on it draws a
 * dashed outline and a one-line label naming the scope, the Gorilla Dash module and
 * the GraphQL query. Hovering the label adds where the content is edited. `detail`
 * overrides the query line for a block whose arguments are only known at runtime.
 */
withDefaults(
  defineProps<{
    info: StructureInfo
    detail?: string
    as?: string
    labelPosition?: 'top' | 'below'
    labelAlign?: 'start' | 'end'
  }>(),
  { detail: undefined, as: 'div', labelPosition: 'top', labelAlign: 'start' }
)

const { structureView } = useDemoControls()
</script>

<template>
  <component
    :is="as"
    data-cms-block
    class="relative"
  >
    <slot />

    <div
      v-if="structureView"
      class="pointer-events-none absolute z-40 flex max-w-[calc(100%-1rem)]"
      :class="[
        labelPosition === 'top' ? 'top-1.5' : 'top-full mt-1',
        labelAlign === 'start' ? 'left-2' : 'right-2 justify-end'
      ]"
    >
      <div
        class="group pointer-events-auto flex max-w-full flex-col rounded-md bg-[#2A1968] px-2 py-1 text-left font-sans text-[0.6875rem] leading-snug font-normal tracking-normal text-white normal-case shadow-lg ring-1 ring-white/20"
      >
        <div class="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
          <span
            class="shrink-0 rounded-sm bg-[#BF161B] px-1 text-[0.5625rem] font-semibold tracking-wide uppercase"
            >{{ info.scope }}</span
          >
          <span class="shrink-0 font-semibold">{{ info.module }}</span>
          <code class="truncate font-mono text-white/80">{{ detail ?? info.query }}</code>
        </div>
        <span class="hidden pt-0.5 text-white/70 group-hover:block">Edit in {{ info.edit }}</span>
      </div>
    </div>
  </component>
</template>
