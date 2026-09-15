import { runtimeConfig } from '@/runtimeConfig'

/**
 * reCAPTCHA v3, for the public forms.
 *
 * v3 has no challenge — it scores the visitor in the background and hands back a
 * short-lived token the server verifies (App\Services\Recaptcha). So the only thing
 * this has to do is load Google's script and mint a token at submit time.
 *
 * NOTHING USES THIS YET: a fresh client site has no form. It is here as the browser
 * half of the server's verification, so the first form that lands is a `prepare()` on
 * first interaction and an `execute()` at submit, not a week of plumbing.
 *
 * **Loaded lazily, on first interaction with the form.** The script is ~80KB of
 * third-party JavaScript that runs on every page it is included on, and these pages
 * are edge-cached marketing pages whose LCP matters. Loading it when someone actually
 * starts filling a form in keeps it off the critical path for the 99% who never do.
 * v3 scores on behavioural signals gathered from load, so loading at first keystroke
 * rather than at submit still gives Google something to work with.
 *
 * **Not configured means not loaded.** With no site key — every local checkout, and
 * any country whose keys have not been issued — `execute()` resolves to null and the
 * form submits without a token, which the server accepts because its secret is blank
 * too. The two halves fail open together, and neither can be turned on alone.
 *
 * ⚠ Google's floating badge pins itself bottom-right. Hiding it is allowed ONLY if the
 * page shows their disclosure text instead ("This site is protected by reCAPTCHA and
 * the Google Privacy Policy and Terms of Service apply", linking both). Whoever adds
 * the first form picks one — leave the badge alone, or hide it in app.css AND render
 * the disclosure under the submit button. The two are a pair; never ship half of it.
 */

/** Google's v3 API, as it appears on `window` once the script has run. */
type Grecaptcha = {
  ready: (callback: () => void) => void
  execute: (siteKey: string, options: { action: string }) => Promise<string>
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha
  }
}

const SCRIPT_ID = 'recaptcha-v3'

let loader: Promise<Grecaptcha | null> | null = null

/**
 * Load the script once per page and resolve when Google is ready — or to null when
 * there is no site key, or the script fails (a blocked or offline third party must
 * not take the form down with it; the server treats a missing token as a fail only
 * when it has a secret to check against).
 */
function load(siteKey: string): Promise<Grecaptcha | null> {
  if (loader) {
    return loader
  }

  loader = new Promise<Grecaptcha | null>((resolve) => {
    if (window.grecaptcha) {
      resolve(window.grecaptcha)

      return
    }

    const existing = document.getElementById(SCRIPT_ID)
    const script =
      existing instanceof HTMLScriptElement ? existing : document.createElement('script')

    script.id = SCRIPT_ID
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`
    script.async = true
    script.defer = true
    script.addEventListener('load', () => {
      const api = window.grecaptcha

      if (!api) {
        resolve(null)

        return
      }

      api.ready(() => resolve(api))
    })
    script.addEventListener('error', () => resolve(null))

    if (!existing) {
      document.head.appendChild(script)
    }
  })

  return loader
}

export function useRecaptcha() {
  const siteKey = () => runtimeConfig().recaptchaSiteKey

  /** Start loading Google's script. Safe to call repeatedly; loads once. */
  const prepare = (): void => {
    const key = siteKey()

    if (key && !import.meta.env.SSR) {
      void load(key)
    }
  }

  /**
   * A token for `action`, or null when there is no captcha on this deployment (or
   * Google could not be reached). The action is checked server-side, so it has to
   * match what the request verifies against.
   */
  const execute = async (action: string): Promise<string | null> => {
    const key = siteKey()

    if (!key || import.meta.env.SSR) {
      return null
    }

    const api = await load(key)

    if (!api) {
      return null
    }

    try {
      return await api.execute(key, { action })
    } catch {
      return null
    }
  }

  return { prepare, execute, enabled: () => Boolean(siteKey()) }
}
