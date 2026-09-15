<script setup lang="ts">
import { TolgeeProvider } from '@tolgee/vue'
import DemoToolbar from '@/components/demo/DemoToolbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

/**
 * TolgeeProvider wraps the app because it owns the i18n client lifecycle: its
 * onBeforeMount is the only thing that calls `tolgee.run()`. It renders nothing of
 * its own, so this file still has one root element.
 */
</script>

<template>
  <TolgeeProvider>
    <div class="flex min-h-screen flex-col bg-surface text-ink">
      <AppHeader />

      <main class="flex-1">
        <slot />
      </main>

      <AppFooter />
      <DemoToolbar />
    </div>
  </TolgeeProvider>
</template>
