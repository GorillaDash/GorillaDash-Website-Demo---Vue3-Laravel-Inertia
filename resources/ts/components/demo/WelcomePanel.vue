<script setup lang="ts">
import { useTranslate } from '@tolgee/vue'
import { nextTick, onMounted, ref, useId, watch } from 'vue'
import { useWelcomePanel } from '@/composables/useWelcomePanel'

/**
 * The panel that slides in from the right when someone first opens the demo. It
 * explains that Hungry Gorilla is a fictional franchise and how its website
 * connects to Gorilla Dash, then points at the demo controls.
 *
 * A native <dialog> opened with showModal(), so focus stays inside, the page behind
 * is inert and Escape closes it. Closing plays the slide-out before the dialog is
 * actually closed. Colours are the Gorilla Dash house palette, not the demo theme,
 * because the panel speaks for Gorilla Dash rather than for the fictional brand.
 */
const GORILLA_DASH_LOGO = 'https://cdn.gorilladash.com/images/media/6109953/GorillaDash.png'
const CLOSE_ANIMATION_MS = 220

const { t } = useTranslate()
const { open, init, close } = useWelcomePanel()

const titleId = useId()
const dialog = ref<HTMLDialogElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const closing = ref(false)

const connections = [
  {
    title: () => t.value('welcome.brandTitle', 'One brand website, every location'),
    text: () =>
      t.value(
        'welcome.brandText',
        'Head office manages the brand pages, menus and blog in Gorilla Dash. Each location has its own page with its address, opening hours, team and reviews, kept up to date by that franchise owner.'
      )
  },
  {
    title: () => t.value('welcome.liveTitle', 'Content comes straight from Gorilla Dash'),
    text: () =>
      t.value(
        'welcome.liveText',
        'The website reads everything you see through the Gorilla Dash website API. When head office or a franchise owner makes a change in Gorilla Dash, it appears here without a developer.'
      )
  },
  {
    title: () => t.value('welcome.flowTitle', 'Customers flow back into Gorilla Dash'),
    text: () =>
      t.value(
        'welcome.flowText',
        'Online orders, catering bookings and enquiries made on this site go straight into Gorilla Dash, routed to the right location for that franchise owner to action.'
      )
  },
  {
    title: () => t.value('welcome.agencyTitle', 'Designed with your creative agency'),
    text: () =>
      t.value(
        'welcome.agencyText',
        'We work with your creative agency. They shape the brand, the design and the copy, and Gorilla Dash connects their website to your franchise network, so the look stays theirs and the data stays live.'
      )
  },
  {
    title: () => t.value('welcome.salesTitle', 'Franchise sales in the same place'),
    text: () =>
      t.value(
        'welcome.salesText',
        'Enquiries from the franchise opportunity page arrive in Gorilla Dash for the franchise development team to follow up.'
      )
  }
]

const tips = [
  {
    title: () => t.value('welcome.structureTitle', 'Structure view'),
    text: () =>
      t.value(
        'welcome.structureText',
        'Switch it on in the control at the bottom left, or press S, to label every section with the Gorilla Dash module behind it.'
      )
  },
  {
    title: () => t.value('welcome.themesTitle', 'Themes'),
    text: () =>
      t.value('welcome.themesText', 'See the same pages and data re-skinned for a different brand.')
  },
  {
    title: () => t.value('welcome.devicesTitle', 'Desktop, tablet and mobile'),
    text: () => t.value('welcome.devicesText', 'Preview the website at each screen size.')
  }
]

let returnFocusTo: HTMLElement | null = null
let closeTimer: number | undefined

const finishClosing = (): void => {
  window.clearTimeout(closeTimer)
  closing.value = false
  dialog.value?.close()
  returnFocusTo?.focus()
  returnFocusTo = null
}

watch(open, async (isOpen) => {
  if (!dialog.value) {
    return
  }

  if (isOpen) {
    window.clearTimeout(closeTimer)
    closing.value = false
    returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!dialog.value.open) {
      dialog.value.showModal()
    }
    await nextTick()
    closeButton.value?.focus()

    return
  }

  if (!dialog.value.open) {
    return
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion) {
    finishClosing()

    return
  }

  closing.value = true
  closeTimer = window.setTimeout(finishClosing, CLOSE_ANIMATION_MS)
})

/** Escape: animate out instead of letting the browser close the dialog at once. */
const onCancel = (event: Event): void => {
  event.preventDefault()
  close()
}

/** A click that lands on the dialog element itself is a click on the backdrop. */
const onDialogClick = (event: MouseEvent): void => {
  if (event.target === dialog.value) {
    close()
  }
}

onMounted(init)
</script>

<template>
  <dialog
    ref="dialog"
    :aria-labelledby="titleId"
    class="welcome-panel p-0 font-sans text-[#1A1A1A] shadow-2xl"
    :class="closing && 'is-closing'"
    @cancel="onCancel"
    @click="onDialogClick"
  >
    <div class="flex h-full flex-col bg-white">
      <header class="bg-[#2A1968] px-6 pt-5 pb-6 text-white">
        <div class="flex items-center justify-between gap-4">
          <span class="inline-flex items-center gap-2 rounded-full bg-white py-1.5 pr-2.5 pl-3">
            <img
              :src="GORILLA_DASH_LOGO"
              alt="Gorilla Dash"
              width="1016"
              height="216"
              class="h-4 w-auto"
            />
            <span
              class="rounded-full bg-[#BF161B] px-2 py-0.5 text-[0.625rem] font-bold tracking-wider text-white uppercase"
              >{{ t('welcome.badge', 'Demo') }}</span
            >
          </span>
          <button
            ref="closeButton"
            type="button"
            class="flex size-9 cursor-pointer items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            @click="close"
          >
            <svg
              viewBox="0 0 24 24"
              class="size-5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
            <span class="sr-only">{{ t('welcome.close', 'Close') }}</span>
          </button>
        </div>
        <p class="mt-6 text-xs font-semibold tracking-widest text-white/70 uppercase">
          {{ t('welcome.kicker', 'A Gorilla Dash demonstration website') }}
        </p>
        <h2
          :id="titleId"
          class="mt-2 text-2xl leading-tight font-bold tracking-tight"
        >
          {{ t('welcome.title', 'This is a franchise website connected to Gorilla Dash') }}
        </h2>
        <p class="mt-3 text-sm leading-relaxed text-white/85">
          {{
            t(
              'welcome.intro',
              'Hungry Gorilla is a made-up cafe and catering franchise. Its website shows how a franchise brand’s website connects to Gorilla Dash, the platform that runs the franchise network behind it.'
            )
          }}
        </p>
      </header>

      <div class="flex-1 overflow-y-auto px-6 py-6">
        <h3 class="text-xs font-bold tracking-widest text-[#BF161B] uppercase">
          {{ t('welcome.connectionHeading', 'How the website connects') }}
        </h3>
        <ol class="mt-4 space-y-5">
          <li
            v-for="(item, index) in connections"
            :key="index"
            class="flex gap-4"
          >
            <span
              class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2A1968] text-sm font-bold text-white"
              aria-hidden="true"
              >{{ index + 1 }}</span
            >
            <div>
              <p class="font-semibold text-[#2A1968]">{{ item.title() }}</p>
              <p class="mt-1 text-sm leading-relaxed text-[#5B5B66]">{{ item.text() }}</p>
            </div>
          </li>
        </ol>

        <h3 class="mt-8 text-xs font-bold tracking-widest text-[#BF161B] uppercase">
          {{ t('welcome.tryHeading', 'Try the demo controls') }}
        </h3>
        <ul class="mt-4 space-y-3 rounded-2xl bg-[#F5F5F8] p-4">
          <li
            v-for="(tip, index) in tips"
            :key="index"
            class="text-sm leading-relaxed"
          >
            <span class="font-semibold text-[#2A1968]">{{ tip.title() }}.</span>
            {{ ' ' }}<span class="text-[#5B5B66]">{{ tip.text() }}</span>
          </li>
        </ul>

        <p class="mt-6 text-xs leading-relaxed text-[#5B5B66]">
          {{
            t(
              'welcome.note',
              'Hungry Gorilla and its cafes are fictional. Orders are pay at pickup, so nothing is charged.'
            )
          }}
        </p>
      </div>

      <footer class="flex flex-wrap items-center gap-3 border-t border-[#DCDCE3] px-6 py-4">
        <button
          type="button"
          class="inline-flex cursor-pointer items-center justify-center rounded-full bg-[#BF161B] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          @click="close"
        >
          {{ t('welcome.explore', 'Explore the website') }}
        </button>
        <a
          href="https://gorilladash.com"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm font-semibold text-[#2A1968] underline-offset-4 hover:underline"
        >
          {{ t('welcome.learnMore', 'Learn about Gorilla Dash') }}
        </a>
      </footer>
    </div>
  </dialog>
</template>
