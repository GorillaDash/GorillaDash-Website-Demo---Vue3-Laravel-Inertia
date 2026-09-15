<script setup lang="ts">
import { TolgeeProvider } from '@tolgee/vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

/**
 * TolgeeProvider wraps the app because it owns the i18n client lifecycle: its
 * onBeforeMount is the only thing that calls `tolgee.run()`, which starts the CDN
 * fetch and the in-context DevTools, and its onMounted ends the `enableSSR` initial
 * render (see setupApp). No `ssr` prop is needed — the instance is already built with
 * the translations as `staticData`, which is all that prop does.
 *
 * It renders nothing of its own, so this file still has one root element. Any page
 * that opts out of AppLayout via defineOptions({ layout }) must wrap itself.
 */
</script>

<template>
  <TolgeeProvider>
    <div class="flex min-h-screen flex-col bg-white text-gray-800">
      <AppHeader />

      <main class="flex-1">
        <slot />
      </main>

      <AppFooter />
    </div>
  </TolgeeProvider>
</template>
