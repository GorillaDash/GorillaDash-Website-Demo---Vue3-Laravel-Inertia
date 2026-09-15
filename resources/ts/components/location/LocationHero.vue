<script setup lang="ts">
/**
 * `locations/:slug` hero: a live map of the store on the left, and the store's
 * name, service badges, blurb, address + hours, and an Order Now CTA on the
 * right. Reuses the finder's GoogleMap (single marker → neighbourhood zoom).
 */
import GoogleMap from '@/components/google/GoogleMap.vue'
import IconBag from '@/components/icons/IconBag.vue'
import IconCar from '@/components/icons/IconCar.vue'
import IconConcierge from '@/components/icons/IconConcierge.vue'
import IconUtensils from '@/components/icons/IconUtensils.vue'
import AppButton from '@/components/ui/AppButton.vue'
import type { StoreLocation } from '@/constants/locations'
import type { LocationDetailContent } from '@/types/locations'
import { useTranslate } from '@tolgee/vue'

defineProps<{ content: LocationDetailContent; store: StoreLocation }>()

const { t } = useTranslate()
const serviceMeta = {
  delivery: { label: 'Delivery', icon: IconCar },
  pickup: { label: 'Order PickUp', icon: IconBag },
  'dine-in': { label: 'Dine In', icon: IconUtensils },
  catering: { label: 'Catering', icon: IconConcierge }
} as const
</script>

<template>
  <section class="bg-white">
    <div class="container lg:flex lg:items-stretch lg:gap-12">
      <!-- Map — flush to the top and bottom of the hero, full height alongside the info -->
      <div class="h-72 sm:h-96 lg:h-auto lg:w-xl lg:shrink-0">
        <GoogleMap :locations="[store]" />
      </div>

      <div class="flex min-w-0 flex-1 flex-col py-10 lg:py-14">
        <h1
          class="font-condensed text-3xl leading-tight font-medium tracking-wider text-brand-primary uppercase sm:text-4xl lg:text-5xl"
        >
          {{ content.name }}
        </h1>

        <ul class="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-brand-accent">
          <li
            v-for="service in content.services"
            :key="service"
            class="flex items-center gap-2"
          >
            <component
              :is="serviceMeta[service].icon"
              class="h-5 w-5"
            />
            <span class="font-display text-lg font-normal tracking-wider uppercase">
              {{ serviceMeta[service].label }}
            </span>
          </li>
        </ul>

        <p class="mt-5 max-w-2xl font-serif text-base leading-relaxed font-bold text-brand-primary">
          {{ content.description }}
        </p>

        <hr class="my-6 border-brand-primary/15" />

        <div class="grid gap-8 sm:grid-cols-2">
          <div>
            <h2 class="font-condensed text-4xl tracking-wider text-brand-primary uppercase">
              {{ t('Location', 'Location') }}:
            </h2>
            <div
              class="mt-4 space-y-5 font-serif text-lg leading-relaxed font-bold text-brand-primary"
            >
              <address class="not-italic">
                <p
                  v-for="line in content.addressLines"
                  :key="line"
                >
                  {{ line }}
                </p>
              </address>
              <a
                :href="`tel:${content.phone.replace(/[^+\d]/g, '')}`"
                class="block text-brand-secondary transition-colors hover:text-brand-primary"
              >
                {{ content.phone }}
              </a>
              <a
                :href="content.directionsHref"
                class="block text-brand-secondary underline transition-colors hover:text-brand-primary"
              >
                {{ t('Get Directions', 'Get Directions') }}
              </a>
            </div>
          </div>

          <div>
            <h2 class="font-condensed text-4xl tracking-wider text-brand-primary uppercase">
              {{ t('Hours', 'Hours') }}:
            </h2>
            <dl class="mt-4 font-serif text-lg font-bold text-brand-primary">
              <div
                v-for="entry in content.hours"
                :key="entry.day"
                class="flex gap-x-4 leading-8"
              >
                <dt class="w-36 shrink-0">{{ entry.day }}:</dt>
                <dd>{{ entry.hours }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <AppButton
          :href="content.orderHref"
          class="mt-8 self-start"
        >
          <IconUtensils class="h-5 w-5" />
          {{ t('Order Now', 'Order Now') }}
        </AppButton>
      </div>
    </div>
  </section>
</template>
