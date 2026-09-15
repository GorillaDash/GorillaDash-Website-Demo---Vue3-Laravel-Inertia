<script setup lang="ts">
import { useTranslate } from '@tolgee/vue'
import LocaleLink from '@/components/core/LocaleLink.vue'

/**
 * The Hungry Gorilla wordmark: a gorilla face on the accent colour and the name in
 * the theme's display face, so both re-skin with the demo themes. The caption
 * underneath tells visitors the brand is a Gorilla Dash demonstration.
 */
withDefaults(defineProps<{ class?: string }>(), { class: '' })

const { t } = useTranslate()
</script>

<template>
  <LocaleLink
    href="/"
    :class="['inline-flex shrink-0 items-center gap-2.5', $props.class]"
    aria-label="Hungry Gorilla home"
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
      <g fill="var(--color-brand-on-accent)">
        <circle
          cx="10"
          cy="21"
          r="2.9"
        />
        <circle
          cx="30"
          cy="21"
          r="2.9"
        />
        <path
          d="M20 5.8c-4.8 0-8.6 3.6-9.2 9.2-.4 2.4-.8 4.8-.8 7.6 0 6.4 4.5 11.2 10 11.2s10-4.8 10-11.2c0-2.8-.4-5.2-.8-7.6-.6-5.6-4.4-9.2-9.2-9.2Z"
        />
      </g>
      <path
        class="fill-brand-accent"
        d="M20 15.4c-2.3-1.9-6.8-1.7-6.8 2.5 0 2 1 3.2 1.7 4.4-1.4 1.4-1.9 2.9-1.9 4.3 0 3.3 3 5.1 7 5.1s7-1.8 7-5.1c0-1.4-.5-2.9-1.9-4.3.7-1.2 1.7-2.4 1.7-4.4 0-4.2-4.5-4.4-6.8-2.5Z"
      />
      <g fill="var(--color-brand-on-accent)">
        <circle
          cx="16.8"
          cy="18.7"
          r="1.25"
        />
        <circle
          cx="23.2"
          cy="18.7"
          r="1.25"
        />
        <ellipse
          cx="20"
          cy="23.5"
          rx="2.7"
          ry="1.6"
        />
      </g>
      <g class="fill-brand-accent">
        <circle
          cx="18.9"
          cy="23.7"
          r="0.6"
        />
        <circle
          cx="21.1"
          cy="23.7"
          r="0.6"
        />
      </g>
      <path
        d="M16.9 27.9c2 1.4 4.2 1.4 6.2 0"
        stroke="var(--color-brand-on-accent)"
        stroke-width="1.4"
        stroke-linecap="round"
        fill="none"
      />
    </svg>
    <span class="flex flex-col">
      <span class="heading-display text-lg leading-none whitespace-nowrap sm:text-2xl"
        >Hungry Gorilla</span
      >
      <span
        class="mt-1 font-sans text-[0.625rem] leading-none font-medium tracking-wide whitespace-nowrap normal-case opacity-70 sm:text-[0.6875rem]"
        >{{ t('brand.caption', 'A Gorilla Dash demonstration website') }}</span
      >
    </span>
  </LocaleLink>
</template>
