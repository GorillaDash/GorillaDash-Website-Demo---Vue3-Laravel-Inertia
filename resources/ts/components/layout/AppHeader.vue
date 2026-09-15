<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { router } from '@inertiajs/vue3'
import { useTranslate } from '@tolgee/vue'
import LocaleLink from '@/components/core/LocaleLink.vue'
import CmsBlock from '@/components/demo/CmsBlock.vue'
import IconBag from '@/components/icons/IconBag.vue'
import IconChevronDown from '@/components/icons/IconChevronDown.vue'
import IconClose from '@/components/icons/IconClose.vue'
import IconMapPin from '@/components/icons/IconMapPin.vue'
import IconMenu from '@/components/icons/IconMenu.vue'
import BrandLogo from '@/components/layout/BrandLogo.vue'
import FranchiseBanner from '@/components/layout/FranchiseBanner.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useBoundLocation } from '@/composables/useBoundLocation'
import { useCart } from '@/composables/useCart'
import { usePagePaths } from '@/composables/usePagePaths'
import type { NavLink } from '@/constants/navigation'
import { STRUCTURE } from '@/constants/structure'
import type { WebsiteMenuItemType } from '@/services/websiteMenus/transformer'
import { useWebsiteMenuService } from '@/services/websiteMenus/websiteMenuService'

const { t } = useTranslate()
const { pagePath } = usePagePaths()
const { lockedStore, name: storeName, href: storeHref, slug: boundSlug } = useBoundLocation()
const { count: cartCount, init: initCart } = useCart()

// The bound tribe arrives as a deferred prop after mount; it fills an empty cafe choice.
watch(boundSlug, (slug) => {
  if (slug) {
    void initCart(slug)
  }
})
const { data, loading } = useWebsiteMenuService()

const toNavLink = (item: WebsiteMenuItemType): NavLink => ({
  label: item.label,
  href: item.type === 'Internal Url' ? item.path || '#' : item.url || item.path || '#',
  children: item.children.length ? item.children.map(toNavLink) : undefined
})

const primaryNav = computed<NavLink[]>(() => data.value?.children.map(toNavLink) ?? [])

/** "Hungry Gorilla Austin South Congress" → "Austin South Congress". */
const shortStoreName = computed(() => (storeName.value ?? '').replace(/^Hungry Gorilla\s+/i, ''))

const mobileOpen = ref(false)
const openSubmenu = ref<string | null>(null)

const closeMobile = () => {
  mobileOpen.value = false
  openSubmenu.value = null
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeMobile()
  }
}

let removeNavigateListener: (() => void) | undefined

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  removeNavigateListener = router.on('navigate', closeMobile)
  void initCart(boundSlug.value)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  removeNavigateListener?.()
})
</script>

<template>
  <div class="sticky top-0 z-40">
    <FranchiseBanner />

    <header
      class="border-b border-brand-tint-strong bg-surface/95 text-brand-primary backdrop-blur"
    >
      <div class="container flex h-18 items-center justify-between gap-3 sm:gap-6">
        <BrandLogo />

        <CmsBlock
          :info="STRUCTURE.mainMenu"
          as="nav"
          label-position="below"
          class="hidden flex-1 justify-center lg:flex"
          :aria-label="t('Primary', 'Primary')"
        >
          <ul class="flex items-center gap-1">
            <template v-if="loading && !primaryNav.length">
              <li
                v-for="index in 5"
                :key="index"
                class="mx-3 h-3 w-16 animate-pulse rounded bg-brand-tint-strong"
                aria-hidden="true"
              />
            </template>
            <li
              v-for="item in primaryNav"
              v-else
              :key="item.label"
              class="group relative"
            >
              <LocaleLink
                :href="item.href"
                class="inline-flex items-center gap-1 rounded-full px-4 py-2 text-[0.9375rem] font-medium transition-colors hover:bg-brand-tint"
              >
                {{ item.label }}
                <IconChevronDown
                  v-if="item.children"
                  class="size-3 transition-transform group-hover:rotate-180"
                />
              </LocaleLink>

              <div
                v-if="item.children"
                class="invisible absolute top-full left-0 min-w-56 translate-y-1 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
              >
                <ul class="rounded-card border border-brand-tint-strong bg-white p-2 shadow-xl">
                  <li
                    v-for="child in item.children"
                    :key="child.label"
                  >
                    <LocaleLink
                      :href="child.href"
                      class="block rounded-lg px-3 py-2 text-sm hover:bg-brand-tint"
                    >
                      {{ child.label }}
                    </LocaleLink>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </CmsBlock>

        <div class="flex items-center gap-2">
          <LocaleLink
            :href="lockedStore && storeHref ? storeHref : pagePath('locations')"
            class="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium hover:bg-brand-tint md:inline-flex"
          >
            <IconMapPin class="size-4 text-brand-accent-ink" />
            <span v-if="lockedStore">{{ shortStoreName }}</span>
            <span v-else>{{ t('Find a cafe', 'Find a cafe') }}</span>
          </LocaleLink>

          <LocaleLink
            :href="pagePath('order')"
            class="relative inline-flex rounded-full p-2 hover:bg-brand-tint"
            :aria-label="t('header.cart', 'Your order, {count} items', { count: cartCount })"
          >
            <IconBag class="size-6" />
            <span
              v-if="cartCount"
              class="absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-brand-accent text-[0.6875rem] font-bold text-brand-on-accent"
              >{{ cartCount }}</span
            >
          </LocaleLink>

          <span class="hidden sm:inline-flex">
            <AppButton
              :href="pagePath('menu')"
              size="sm"
            >
              {{ t('Order online', 'Order online') }}
            </AppButton>
          </span>

          <button
            type="button"
            class="inline-flex rounded-full p-2 hover:bg-brand-tint lg:hidden"
            :aria-expanded="mobileOpen"
            aria-controls="mobile-menu"
            :aria-label="mobileOpen ? t('Close menu', 'Close menu') : t('Open menu', 'Open menu')"
            @click="mobileOpen = !mobileOpen"
          >
            <IconClose
              v-if="mobileOpen"
              class="size-6"
            />
            <IconMenu
              v-else
              class="size-6"
            />
          </button>
        </div>
      </div>

      <nav
        v-show="mobileOpen"
        id="mobile-menu"
        class="max-h-[calc(100dvh-7rem)] overflow-y-auto border-t border-brand-tint-strong bg-surface lg:hidden"
        :aria-label="t('Mobile', 'Mobile')"
      >
        <ul class="container flex flex-col gap-1 py-4">
          <li
            v-for="item in primaryNav"
            :key="item.label"
          >
            <LocaleLink
              v-if="!item.children"
              :href="item.href"
              class="block rounded-lg px-3 py-3 text-lg font-medium hover:bg-brand-tint"
            >
              {{ item.label }}
            </LocaleLink>
            <template v-else>
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-lg px-3 py-3 text-lg font-medium hover:bg-brand-tint"
                :aria-expanded="openSubmenu === item.label"
                @click="openSubmenu = openSubmenu === item.label ? null : item.label"
              >
                {{ item.label }}
                <IconChevronDown
                  class="size-4 transition-transform"
                  :class="openSubmenu === item.label && 'rotate-180'"
                />
              </button>
              <ul
                v-show="openSubmenu === item.label"
                class="ml-4 border-l-2 border-brand-tint-strong pl-3"
              >
                <li
                  v-for="child in item.children"
                  :key="child.label"
                >
                  <LocaleLink
                    :href="child.href"
                    class="block rounded-lg px-3 py-2 hover:bg-brand-tint"
                  >
                    {{ child.label }}
                  </LocaleLink>
                </li>
              </ul>
            </template>
          </li>
          <li class="mt-3 flex flex-col gap-2 border-t border-brand-tint-strong pt-4">
            <AppButton :href="pagePath('menu')">{{ t('Order online', 'Order online') }}</AppButton>
            <AppButton
              :href="pagePath('locations')"
              variant="outline"
            >
              {{ t('Find a cafe', 'Find a cafe') }}
            </AppButton>
          </li>
        </ul>
      </nav>
    </header>
  </div>
</template>
