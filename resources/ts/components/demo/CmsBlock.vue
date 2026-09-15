<script setup lang="ts">
import { useDemoControls } from '@/composables/useDemoControls'
import type { StructureInfo } from '@/constants/structure'

/**
 * Wraps one section of a page. Invisible normally; with Structure view on it draws a
 * dashed outline and a label naming the Gorilla Dash module, the GraphQL query and
 * where the content is edited. `detail` overrides the query line for a block whose
 * arguments are only known at runtime (a tribe slug, say).
 */
withDefaults(
  defineProps<{
    info: StructureInfo
    detail?: string
    as?: string
    labelPosition?: 'top' | 'bottom'
  }>(),
  { detail: undefined, as: 'div', labelPosition: 'top' }
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
      class="pointer-events-none absolute left-3 z-40 max-w-[calc(100%-1.5rem)]"
      :class="labelPosition === 'top' ? 'top-3' : 'bottom-3'"
    >
      <div
        class="pointer-events-auto inline-flex flex-col gap-1 rounded-lg bg-[#231a6e] px-3 py-2 text-left font-sans text-xs leading-snug text-white normal-case shadow-lg ring-1 ring-white/20"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="rounded bg-[#d81f26] px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-wide uppercase"
          >
            {{ info.scope }}
          </span>
          <span class="font-semibold">{{ info.module }}</span>
        </div>
        <code class="font-mono text-[0.6875rem] break-all text-white/85">{{
          detail ?? info.query
        }}</code>
        <span class="text-white/70">Edit in {{ info.edit }}</span>
      </div>
    </div>
  </component>
</template>
