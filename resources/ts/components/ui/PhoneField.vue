<script setup lang="ts">
/** A US phone number field with its country shown beside it. */
defineProps<{ label: string; required?: boolean }>()
const model = defineModel<string>({ default: '' })
</script>

<template>
  <label class="block text-sm font-medium">
    {{ label }}
    <span class="mt-1 flex">
      <span class="inline-flex items-center rounded-l-lg border border-r-0 border-brand-tint-strong bg-brand-tint px-3 text-sm whitespace-nowrap">🇺🇸 +1</span>
      <input
        v-model.trim="model"
        type="tel"
        :required="required"
        autocomplete="tel-national"
        placeholder="(512) 555-0123"
        class="field rounded-l-none"
      />
    </span>
  </label>
</template>
