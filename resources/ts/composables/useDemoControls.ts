import { readonly, ref } from 'vue'

/**
 * The trade-show demo's two controls: Structure view (label every section with the
 * Gorilla Dash module and query behind it) and the theme switcher.
 *
 * Module scope on purpose so the header, toolbar and every CmsBlock share one
 * state. It is safe under SSR because the server never mutates it: both values
 * render as their defaults and the visitor's saved choice is applied after mount.
 */
export type DemoTheme = 'cafe' | 'trade' | 'retail'

export const DEMO_THEMES: ReadonlyArray<{ value: DemoTheme; label: string; swatch: string }> = [
  { value: 'cafe', label: 'Cafe', swatch: '#1f3a32' },
  { value: 'trade', label: 'Trade', swatch: '#0f1b2d' },
  { value: 'retail', label: 'Retail', swatch: '#2b1b3f' }
]

const STORAGE_KEY = 'jt-demo-controls'

const structureView = ref(false)
const theme = ref<DemoTheme>('cafe')
let initialised = false

const persist = (): void => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ structureView: structureView.value, theme: theme.value })
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

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

export function useDemoControls() {
  const init = (): void => {
    if (initialised || typeof window === 'undefined') {
      return
    }
    initialised = true

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as {
        structureView?: boolean
        theme?: DemoTheme
      }
      structureView.value = saved.structureView === true
      if (DEMO_THEMES.some((option) => option.value === saved.theme)) {
        theme.value = saved.theme as DemoTheme
      }
    } catch {
      // Unreadable storage falls back to the defaults.
    }

    const params = new URLSearchParams(window.location.search)
    if (params.has('structure')) {
      structureView.value = params.get('structure') !== '0'
    }
    const themeParam = params.get('theme')
    if (DEMO_THEMES.some((option) => option.value === themeParam)) {
      theme.value = themeParam as DemoTheme
    }

    apply()

    window.addEventListener('keydown', (event) => {
      if (event.key?.toLowerCase() === 's' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (!isTyping(event.target)) {
          toggleStructureView()
        }
      }
    })
  }

  const toggleStructureView = (): void => {
    structureView.value = !structureView.value
    apply()
    persist()
  }

  const setTheme = (value: DemoTheme): void => {
    theme.value = value
    apply()
    persist()
  }

  return {
    structureView: readonly(structureView),
    theme: readonly(theme),
    init,
    toggleStructureView,
    setTheme
  }
}
