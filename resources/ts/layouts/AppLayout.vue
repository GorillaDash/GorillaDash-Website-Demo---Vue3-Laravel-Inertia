<script setup lang="ts">
import { TolgeeProvider } from '@tolgee/vue'
import { computed, onMounted } from 'vue'
import DemoToolbar from '@/components/demo/DemoToolbar.vue'
import DevicePreview from '@/components/demo/DevicePreview.vue'
import WelcomePanel from '@/components/demo/WelcomePanel.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import { useDemoControls } from '@/composables/useDemoControls'

/**
 * TolgeeProvider wraps the app because it owns the i18n client lifecycle: its
 * onBeforeMount is the only thing that calls `tolgee.run()`. It renders nothing of
 * its own.
 *
 * DevicePreview covers the page in the tablet and mobile previews rather than
 * replacing it. Inertia hands this layout the page as a persistent slot, and a
 * slot vnode that has been unmounted cannot be mounted a second time: taking the
 * page out of the tree with v-else left the main area empty on the way back to
 * desktop. Covering it keeps the page mounted, so returning to desktop is just the
 * overlay going away.
 */
const { device, embedded, init } = useDemoControls()

const previewing = computed(() => device.value !== 'desktop' && !embedded.value)

onMounted(init)
</script>

<template>
  <TolgeeProvider>
    <div
      class="flex min-h-screen flex-col bg-surface text-ink"
      :inert="previewing"
      :aria-hidden="previewing || undefined"
    >
      <AppHeader />

      <main class="flex-1">
        <slot />
      </main>

      <AppFooter />
    </div>
    <DevicePreview v-if="previewing" />
    <DemoToolbar v-if="!embedded" />
    <WelcomePanel v-if="!embedded" />
  </TolgeeProvider>
</template>
