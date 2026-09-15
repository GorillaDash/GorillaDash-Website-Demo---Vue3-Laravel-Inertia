/**
 * When the demo's welcome panel is due. It opens once per two-hour session: shown,
 * then left closed until two hours have passed since it was last shown.
 *
 * The window is fixed from the moment the panel opens rather than extended by
 * activity. A demo laptop at a stand is in constant use, so a sliding window would
 * never let the panel appear for the next visitor.
 */
export const WELCOME_SESSION_MS = 2 * 60 * 60 * 1000

export const WELCOME_STORAGE_KEY = 'hg-demo-welcome-shown-at'

export function welcomeIsDue(lastShownAt: number | null, now: number): boolean {
  if (lastShownAt === null || !Number.isFinite(lastShownAt)) {
    return true
  }

  // A timestamp from the future means the clock was changed; start a new session.
  if (lastShownAt > now) {
    return true
  }

  return now - lastShownAt >= WELCOME_SESSION_MS
}

/** Reads a stored timestamp, treating anything unreadable as never shown. */
export function parseShownAt(stored: string | null): number | null {
  if (stored === null || stored.trim() === '') {
    return null
  }

  const value = Number(stored)

  return Number.isFinite(value) ? value : null
}
