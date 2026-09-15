<script setup lang="ts">
withDefaults(
  defineProps<{
    src: string
    alt: string
    eager?: boolean
    class?: string
  }>(),
  { eager: false, class: '' }
)
</script>

<template>
  <img
    :src="src"
    :alt="alt"
    :loading="eager ? 'eager' : 'lazy'"
    :fetchpriority="eager ? 'high' : undefined"
    decoding="async"
    :class="['bg-brand-tint object-cover', $props.class]"
  />
</template>
