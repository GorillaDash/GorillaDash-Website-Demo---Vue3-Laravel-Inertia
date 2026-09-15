<script setup lang="ts">
import LocaleLink from '@/components/core/LocaleLink.vue'
import { useTranslate } from '@tolgee/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import IconChevronDown from '@/components/icons/IconChevronDown.vue'
import IconClose from '@/components/icons/IconClose.vue'
import IconMapPin from '@/components/icons/IconMapPin.vue'
import IconMenu from '@/components/icons/IconMenu.vue'
import BrandLogo from '@/components/layout/BrandLogo.vue'
import LocaleSwitcher from '@/components/layout/LocaleSwitcher.vue'
import type { NavLink } from '@/constants/navigation'
import { useBoundLocation } from '@/composables/useBoundLocation'
import { useWebsiteMenuService } from '@/services/websiteMenus/websiteMenuService'
import type { WebsiteMenuItemType } from '@/services/websiteMenus/transformer'

const { t } = useTranslate()

// The locked store chip (store name is CMS data — not translated), linking back
// to the bound store's detail page. Currently `hidden` (display:none) pending
// design sign-off — it still enters the DOM when a store is bound, so DevTools
// shows the binding state; drop the `hidden` class to make it visible.
const { lockedStore, name: storeName, href: storeHref } = useBoundLocation()

const { data, loading } = useWebsiteMenuService()

// Map the API menu into the NavLink shape the template already consumes.
// children must be undefined (not []) for leaves, or the `v-if="item.children"`
// dropdown would render for an empty array (truthy in JS).
const toNavLink = (item: WebsiteMenuItemType): NavLink => {
  return {
    label: item.label,
    href: item.type === 'Internal Url' ? item.path || '#' : item.url || item.path || '#',
    children: item.children.length ? item.children.map(toNavLink) : undefined
  }
}

const primaryNav = computed<NavLink[]>(() => data.value?.children.map(toNavLink) ?? [])

// Placeholder bar widths shown while the menu loads.
const navSkeletonWidths = ['w-12', 'w-16', 'w-20', 'w-14', 'w-16', 'w-12']

const mobileOpen = ref(false)

// Which mobile submenus are expanded (accordion; multiple may be open).
const openMobileSubmenus = ref<string[]>([])

const toggleMobileSubmenu = (label: string) => {
  openMobileSubmenus.value = openMobileSubmenus.value.includes(label)
    ? openMobileSubmenus.value.filter((item) => item !== label)
    : [...openMobileSubmenus.value, label]
}

const closeMobile = () => {
  mobileOpen.value = false
  openMobileSubmenus.value = []
}

// Close the mobile menu on Escape for keyboard users.
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeMobile()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <header class="bg-brand-primary text-white">
    <div class="container flex items-center justify-between gap-4 py-3 sm:py-4 lg:gap-8">
      <!-- Brand -->
      <BrandLogo class="h-8 sm:h-9 lg:h-10" />

      <!-- Desktop primary nav -->
      <nav
        class="hidden flex-1 items-center justify-center gap-6 lg:flex xl:gap-9"
        :aria-label="t('Primary', 'Primary')"
      >
        <!-- Skeleton placeholders while the menu loads -->
        <template v-if="loading && !primaryNav.length">
          <span
            v-for="width in navSkeletonWidths"
            :key="width"
            class="h-4 animate-pulse rounded bg-white/20"
            :class="width"
            aria-hidden="true"
          />
        </template>

        <div
          v-for="item in primaryNav"
          v-else
          :key="item.label"
          class="group relative"
        >
          <LocaleLink
            :href="item.href"
            class="inline-flex items-center gap-1 font-display text-sm tracking-wider text-white/90 uppercase transition-colors hover:text-white"
            :aria-haspopup="item.children ? 'true' : undefined"
          >
            {{ item.label }}
            <IconChevronDown
              v-if="item.children"
              class="h-3 w-3 transition-transform group-focus-within:rotate-180 group-hover:rotate-180"
            />
          </LocaleLink>

          <!-- Second-level dropdown (opens on hover / keyboard focus) -->
          <div
            v-if="item.children"
            class="invisible absolute top-full left-1/2 z-50 min-w-48 -translate-x-1/2 border-t-4 border-brand-tint-strong bg-white py-2 opacity-0 shadow-lg transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
          >
            <LocaleLink
              v-for="child in item.children"
              :key="child.label"
              :href="child.href"
              class="block px-4 py-1 font-display text-lg leading-7 tracking-wider whitespace-nowrap text-brand-primary uppercase transition-colors hover:text-brand-accent"
            >
              {{ child.label }}
            </LocaleLink>
          </div>
        </div>
      </nav>

      <!-- Actions -->
      <div class="flex items-center gap-2 sm:gap-4 lg:gap-6">
        <!-- Locked store (desktop) — hidden for now; in the DOM when bound (debug) -->
        <LocaleLink
          v-if="lockedStore"
          :href="storeHref ?? '#'"
          data-debug="bound-location"
          class="hidden items-center gap-1.5 font-display text-sm tracking-wider text-brand-tint-strong uppercase transition-colors hover:text-white"
        >
          <IconMapPin class="h-5 w-5" />
          {{ storeName }}
        </LocaleLink>

        <!-- Language (desktop) — renders nothing when the deployment serves one locale -->
        <LocaleSwitcher class="hidden lg:block" />

        <!-- Hamburger (mobile + tablet) -->
        <button
          type="button"
          class="inline-flex p-1 text-white lg:hidden"
          :aria-expanded="mobileOpen"
          aria-controls="mobile-menu"
          :aria-label="mobileOpen ? t('Close menu', 'Close menu') : t('Open menu', 'Open menu')"
          @click="mobileOpen = !mobileOpen"
        >
          <IconClose
            v-if="mobileOpen"
            class="h-7 w-7"
          />
          <IconMenu
            v-else
            class="h-7 w-7"
          />
        </button>
      </div>
    </div>

    <!-- Mobile / tablet menu -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-2 opacity-0"
    >
      <nav
        v-show="mobileOpen"
        id="mobile-menu"
        class="border-t border-brand-primary-700 bg-brand-primary lg:hidden"
        :aria-label="t('Mobile', 'Mobile')"
      >
        <div class="container flex flex-col gap-1 py-3">
          <!-- Locked store (mobile) — hidden for now; in the DOM when bound (debug) -->
          <LocaleLink
            v-if="lockedStore"
            :href="storeHref ?? '#'"
            data-debug="bound-location"
            class="hidden items-center gap-2 rounded-md px-2 py-3 font-display text-lg tracking-wider text-brand-tint-strong uppercase transition-colors hover:bg-brand-primary-700 hover:text-white"
            @click="closeMobile"
          >
            <IconMapPin class="h-5 w-5" />
            {{ storeName }}
          </LocaleLink>

          <template
            v-for="item in primaryNav"
            :key="item.label"
          >
            <!-- Leaf item -->
            <LocaleLink
              v-if="!item.children"
              :href="item.href"
              class="rounded-md px-2 py-3 font-display text-lg tracking-wider text-white/90 uppercase transition-colors hover:bg-brand-primary-700 hover:text-white"
              @click="closeMobile"
            >
              {{ item.label }}
            </LocaleLink>

            <!-- Item with submenu (accordion) -->
            <div v-else>
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-md px-2 py-3 font-display text-lg tracking-wider text-white/90 uppercase transition-colors hover:bg-brand-primary-700 hover:text-white"
                :aria-expanded="openMobileSubmenus.includes(item.label)"
                @click="toggleMobileSubmenu(item.label)"
              >
                {{ item.label }}
                <IconChevronDown
                  class="h-4 w-4 transition-transform"
                  :class="openMobileSubmenus.includes(item.label) && 'rotate-180'"
                />
              </button>
              <div
                v-show="openMobileSubmenus.includes(item.label)"
                class="mt-1 ml-3 flex flex-col border-l-2 border-brand-tint-strong pl-3"
              >
                <LocaleLink
                  v-for="child in item.children"
                  :key="child.label"
                  :href="child.href"
                  class="rounded-md px-2 py-2 font-display tracking-wider text-white/80 uppercase transition-colors hover:bg-brand-primary-700 hover:text-white"
                  @click="closeMobile"
                >
                  {{ child.label }}
                </LocaleLink>
              </div>
            </div>
          </template>

          <!-- Language (mobile) — a flat row; the desktop dropdown needs hover -->
          <LocaleSwitcher variant="mobile" />
        </div>
      </nav>
    </Transition>
  </header>
</template>
