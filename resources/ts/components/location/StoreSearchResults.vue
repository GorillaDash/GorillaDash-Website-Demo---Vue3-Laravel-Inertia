<script setup lang="ts">
/**
 * The "closest stores" dropdown for the location search — the result list from the
 * old StoreListResult, as a presentational component. Each row emits `select`; the
 * parent decides what selecting does (the final destination isn't wired yet).
 */
import { useTranslate } from '@tolgee/vue'
import type { SearchStore } from '@/services/searchStoreService'

defineProps<{
  stores: SearchStore[] | null
  /** The searched address, shown in the header. */
  address: string
}>()

const emit = defineEmits<{ select: [store: SearchStore] }>()

const { t } = useTranslate()
</script>

<template>
  <div class="max-h-100 overflow-y-auto rounded-3xl bg-white shadow-xl">
    <p class="border-b border-brand-primary/15 px-5 py-3 font-serif text-sm text-brand-primary/70">
      {{ t('Closest stores to', 'Closest stores to') }}
      <strong
        v-if="address"
        class="text-brand-primary"
        >{{ address }}</strong
      >
    </p>

    <ul
      v-if="stores && stores.length"
      class="divide-y divide-brand-primary/10"
    >
      <li
        v-for="store in stores"
        :key="store.slug ?? store.name ?? ''"
      >
        <button
          type="button"
          class="flex w-full cursor-pointer flex-col px-5 py-4 text-left transition-colors hover:bg-brand-tint/40"
          @click="emit('select', store)"
        >
          <span class="font-serif font-bold tracking-wide text-brand-secondary">
            {{ store.name }}
          </span>
          <span class="mt-1 font-serif text-sm text-brand-primary/80">
            <span
              v-if="store.address_1"
              class="block"
              >{{ store.address_1 }}</span
            >
            <span
              v-if="store.address_2"
              class="block"
              >{{ store.address_2 }}</span
            >
            <span class="block">{{ store.locality }} {{ store.postal_code }}</span>
          </span>
        </button>
      </li>
    </ul>

    <p
      v-else
      class="px-5 py-6 text-center font-serif text-brand-primary/70"
    >
      {{ t('No locations found', 'No locations found') + '.' }}
    </p>
  </div>
</template>
