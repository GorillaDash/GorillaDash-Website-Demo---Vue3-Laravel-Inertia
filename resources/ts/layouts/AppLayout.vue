<script setup lang="ts">
import { TolgeeProvider } from '@tolgee/vue'
import { computed, onMounted } from 'vue'
import DemoToolbar from '@/components/demo/DemoToolbar.vue'
import DevicePreview from '@/components/demo/DevicePreview.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import { useDemoControls } from '@/composables/useDemoControls'

/**
 * TolgeeProvider wraps the app because it owns the i18n client lifecycle: its
 * onBeforeMount is the only thing that calls `tolgee.run()`. It renders nothing of
 * its own.
 *
 * In the tablet and mobile previews the page is not drawn here. DevicePreview loads
 * it again inside a device-sized iframe, and the copy inside that iframe renders
 * normally with its own demo control hidden.
 */
const { device, embedded, init } = useDemoControls()

const previewing = computed(() => device.value !== 'desktop' && !embedded.value)

onMounted(init)
</script>

<template>
  <TolgeeProvider>
    <DevicePreview v-if="previewing" />
    <div
      v-else
      class="flex min-h-screen flex-col bg-surface text-ink"
    >
      <AppHeader />

      <main class="flex-1">
        <slot />
      </main>

      <AppFooter />
    </div>
    <DemoToolbar v-if="!embedded" />
  </TolgeeProvider>
</template>
