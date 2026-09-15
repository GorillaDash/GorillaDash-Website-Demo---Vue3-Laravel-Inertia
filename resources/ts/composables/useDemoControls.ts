import { router } from '@inertiajs/vue3'
import { readonly, ref } from 'vue'

/**
 * The trade-show demo's controls: Structure view (label every section with the
 * Gorilla Dash module and query behind it), the theme switcher, and the preview
 * size (desktop, tablet or mobile).
 *
 * Module scope on purpose so the header, toolbar and every CmsBlock share one
 * state. It is safe under SSR because the server never mutates it: every value
 * renders as its default and the visitor's saved choice is applied after mount.
 *
 * Tablet and mobile previews load the site again inside an iframe of that width,
 * because Tailwind's breakpoints follow the viewport and only a real narrower
 * viewport shows the real phone and tablet layouts. The framed copy hides its own
 * toolbar and keeps Structure view and the theme in step with the outer page
 * through postMessage, in both directions.
 */
export type DemoTheme = 'cafe' | 'trade' | 'retail'
export type DemoDevice = 'desktop' | 'tablet' | 'mobile'

export const DEMO_THEMES: ReadonlyArray<{ value: DemoTheme; label: string; swatch: string }> = [
  { value: 'cafe', label: 'Cafe', swatch: '#1f3a32' },
  { value: 'trade', label: 'Trade', swatch: '#0f1b2d' },
  { value: 'retail', label: 'Retail', swatch: '#2b1b3f' }
]

/** Screen sizes in CSS pixels: an iPad Air in portrait and an iPhone 15. */
export const DEMO_DEVICES: ReadonlyArray<{
  value: DemoDevice
  label: string
  width: number
  height: number
}> = [
  { value: 'desktop', label: 'Desktop', width: 0, height: 0 },
  { value: 'tablet', label: 'Tablet', width: 820, height: 1180 },
  { value: 'mobile', label: 'Mobile', width: 390, height: 844 }
]

const STORAGE_KEY = 'jt-demo-controls'
const MESSAGE_TYPE = 'jt-demo-controls'

type ControlsMessage =
  | { type: typeof MESSAGE_TYPE; kind: 'state'; structureView: boolean; theme: DemoTheme }
  | { type: typeof MESSAGE_TYPE; kind: 'ready' }
  | { type: typeof MESSAGE_TYPE; kind: 'url'; url: string }

const structureView = ref(false)
const theme = ref<DemoTheme>('cafe')
const device = ref<DemoDevice>('desktop')
/** True inside the device preview's iframe. */
const embedded = ref(false)
/** The page the device preview is showing, so Desktop can return to it. */
const frameUrl = ref<string | null>(null)
let initialised = false

const isTheme = (value: unknown): value is DemoTheme =>
  DEMO_THEMES.some((option) => option.value === value)

const isDevice = (value: unknown): value is DemoDevice =>
  DEMO_DEVICES.some((option) => option.value === value)

const currentUrl = (): string =>
  window.location.pathname + window.location.search + window.location.hash

const persist = (): void => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        structureView: structureView.value,
        theme: theme.value,
        device: device.value
      })
    )
  } catch {
    // Private windows and blocked storage: the controls still work for this visit.
  }
}

const apply = (): void => {
  const root = document.documentElement
  root.classList.toggle('structure-view', structureView.value)

  if (theme.value === 'cafe') {
    delete root.dataset.theme
  } else {
    root.dataset.theme = theme.value
  }
}

/**
 * Sends to the other side of the preview: the parent from inside the iframe, or
 * every same-origin frame from the outer page. The target origin is our own, so
 * a third-party embed such as a map never receives it.
 */
const post = (message: ControlsMessage): void => {
  if (embedded.value) {
    window.parent.postMessage(message, window.location.origin)

    return
  }

  for (let index = 0; index < window.frames.length; index++) {
    window.frames[index].postMessage(message, window.location.origin)
  }
}

const broadcastState = (): void => {
  post({
    type: MESSAGE_TYPE,
    kind: 'state',
    structureView: structureView.value,
    theme: theme.value
  })
}

const receive = (event: MessageEvent): void => {
  if (event.origin !== window.location.origin) {
    return
  }

  const message = event.data as Partial<ControlsMessage> | null
  if (message?.type !== MESSAGE_TYPE) {
    return
  }

  if (message.kind === 'state') {
    structureView.value = message.structureView === true
    if (isTheme(message.theme)) {
      theme.value = message.theme
    }
    // Applied without posting back, so the two windows never ping-pong.
    apply()
  } else if (message.kind === 'ready' && !embedded.value) {
    broadcastState()
  } else if (message.kind === 'url' && !embedded.value && typeof message.url === 'string') {
    frameUrl.value = message.url
  }
}

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

const toggleStructureView = (): void => {
  structureView.value = !structureView.value
  apply()
  persist()
  broadcastState()
}

const setTheme = (value: DemoTheme): void => {
  theme.value = value
  apply()
  persist()
  broadcastState()
}

const setDevice = (value: DemoDevice): void => {
  if (value === device.value) {
    return
  }

  const enteringPreview = device.value === 'desktop'
  const leavingPreview = value === 'desktop'
  device.value = value
  persist()

  // Return to whatever page the visitor had clicked through to inside the preview.
  if (leavingPreview && frameUrl.value && frameUrl.value !== currentUrl()) {
    router.visit(frameUrl.value)
  }
  if (enteringPreview) {
    frameUrl.value = currentUrl()
  }
}

export function useDemoControls() {
  const init = (): void => {
    if (initialised || typeof window === 'undefined') {
      return
    }
    initialised = true
    embedded.value = window.self !== window.top

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as {
        structureView?: boolean
        theme?: DemoTheme
        device?: DemoDevice
      }
      structureView.value = saved.structureView === true
      if (isTheme(saved.theme)) {
        theme.value = saved.theme
      }
      if (!embedded.value && isDevice(saved.device)) {
        device.value = saved.device
      }
    } catch {
      // Unreadable storage falls back to the defaults.
    }

    const params = new URLSearchParams(window.location.search)
    if (params.has('structure')) {
      structureView.value = params.get('structure') !== '0'
    }
    const themeParam = params.get('theme')
    if (isTheme(themeParam)) {
      theme.value = themeParam
    }
    const deviceParam = params.get('device')
    if (!embedded.value && isDevice(deviceParam)) {
      device.value = deviceParam
    }

    if (device.value !== 'desktop') {
      frameUrl.value = currentUrl()
    }

    apply()

    window.addEventListener('message', receive)
    window.addEventListener('keydown', (event) => {
      if (event.key?.toLowerCase() === 's' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (!isTyping(event.target)) {
          toggleStructureView()
        }
      }
    })

    if (embedded.value) {
      // Ask the outer page for its state, in case storage is blocked, and report
      // every page the visitor opens inside the preview.
      post({ type: MESSAGE_TYPE, kind: 'ready' })
      post({ type: MESSAGE_TYPE, kind: 'url', url: currentUrl() })
      router.on('navigate', () => post({ type: MESSAGE_TYPE, kind: 'url', url: currentUrl() }))
    }
  }

  return {
    structureView: readonly(structureView),
    theme: readonly(theme),
    device: readonly(device),
    embedded: readonly(embedded),
    frameUrl: readonly(frameUrl),
    init,
    toggleStructureView,
    setTheme,
    setDevice
  }
}
