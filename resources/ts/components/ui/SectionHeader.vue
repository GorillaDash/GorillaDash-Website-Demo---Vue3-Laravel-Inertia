<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string
    title: string
    caption?: string
    align?: 'left' | 'center'
    inverted?: boolean
  }>(),
  { eyebrow: '', caption: '', align: 'left', inverted: false }
)
</script>

<template>
  <div
    class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
    :class="align === 'center' && 'items-center text-center md:flex-col md:items-center'"
  >
    <div
      class="max-w-2xl"
      :class="align === 'center' && 'mx-auto'"
    >
      <p
        v-if="eyebrow"
        class="mb-3 text-sm font-semibold tracking-widest uppercase"
        :class="inverted ? 'text-brand-tint-strong' : 'text-brand-accent-ink'"
      >
        {{ eyebrow }}
      </p>
      <h2
        class="heading-display text-3xl leading-tight sm:text-4xl lg:text-5xl"
        :class="inverted ? 'text-white' : 'text-brand-primary'"
      >
        {{ title }}
      </h2>
      <p
        v-if="caption"
        class="mt-4 text-lg leading-relaxed"
        :class="inverted ? 'text-white/80' : 'text-muted'"
      >
        {{ caption }}
      </p>
    </div>
    <div
      v-if="$slots.action"
      class="shrink-0"
    >
      <slot name="action" />
    </div>
  </div>
</template>
