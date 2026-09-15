import { readonly, ref } from 'vue'
import { WELCOME_STORAGE_KEY, parseShownAt, welcomeIsDue } from '@/lib/demoWelcome'

/**
 * The welcome panel's open state, shared by the panel and the demo control's
 * "About this demo" button. Module scope so both see one value; the server never
 * mutates it, so SSR always renders the panel closed.
 */
const open = ref(false)
let initialised = false

const readShownAt = (): number | null => {
  try {
    return parseShownAt(localStorage.getItem(WELCOME_STORAGE_KEY))
  } catch {
    return null
  }
}

const recordShown = (): void => {
  try {
    localStorage.setItem(WELCOME_STORAGE_KEY, String(Date.now()))
  } catch {
    // Blocked storage: the panel may open again next visit, which is harmless.
  }
}

export function useWelcomePanel() {
  /**
   * Opens the panel on arrival when this browser has not seen it in the last two
   * hours. Skipped inside the device preview's iframe, where the outer page already
   * shows it.
   */
  const init = (): void => {
    if (initialised || typeof window === 'undefined' || window.self !== window.top) {
      return
    }
    initialised = true

    if (!welcomeIsDue(readShownAt(), Date.now())) {
      return
    }

    recordShown()
    // A beat after first paint, so the page is visible behind the panel as it slides in.
    window.setTimeout(() => {
      open.value = true
    }, 600)
  }

  const show = (): void => {
    open.value = true
  }

  const close = (): void => {
    open.value = false
  }

  return { open: readonly(open), init, show, close }
}
