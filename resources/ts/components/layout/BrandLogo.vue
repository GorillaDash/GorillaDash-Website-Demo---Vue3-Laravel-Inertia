<script setup lang="ts">
import { useTranslate } from '@tolgee/vue'
import LocaleLink from '@/components/core/LocaleLink.vue'

/**
 * The Juniper Table wordmark: a juniper sprig and the name, drawn in currentColor
 * with the theme's display face, so it re-skins with the demo themes. The caption
 * underneath tells visitors the brand is a Gorilla Dash demonstration.
 */
withDefaults(defineProps<{ class?: string }>(), { class: '' })

const { t } = useTranslate()
</script>

<template>
  <LocaleLink
    href="/"
    :class="['inline-flex shrink-0 items-center gap-2.5', $props.class]"
    aria-label="Juniper Table home"
  >
    <svg
      viewBox="0 0 40 40"
      class="size-8 shrink-0 sm:size-9"
      aria-hidden="true"
    >
      <circle
        cx="20"
        cy="20"
        r="19"
        class="fill-brand-accent"
      />
      <path
        d="M20 31V11M20 16l-5-4M20 16l5-4M20 22l-6-4M20 22l6-4M20 28l-6-4M20 28l6-4"
        stroke="var(--color-brand-on-accent)"
        stroke-width="2.2"
        stroke-linecap="round"
        fill="none"
      />
    </svg>
    <span class="flex flex-col">
      <span class="heading-display text-lg leading-none whitespace-nowrap sm:text-2xl"
        >Juniper Table</span
      >
      <span
        class="mt-1 font-sans text-[0.625rem] leading-none font-medium tracking-wide whitespace-nowrap normal-case opacity-70 sm:text-[0.6875rem]"
        >{{ t('brand.caption', 'A Gorilla Dash demonstration website') }}</span
      >
    </span>
  </LocaleLink>
</template>
