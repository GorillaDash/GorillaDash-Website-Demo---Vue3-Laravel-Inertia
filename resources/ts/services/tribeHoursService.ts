import { formatTime } from '@/lib/format'

/**
 * Opening hours as Gorilla Dash stores them on a tribe (`opening_hours_array`):
 * `{ Monday: [{ open: "07:00", close: "15:00" }], …, Sunday: [{ open: "Closed", close: "Closed" }] }`,
 * in the tribe's own timezone.
 */
export type OpeningHoursArray = Record<
  string,
  Array<{ open?: string | null; close?: string | null }>
>

export const WEEK_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
] as const

export type DayHours = { day: string; slots: Array<{ open: string; close: string }>; label: string }

const isClosed = (value: string | null | undefined): boolean =>
  !value || value.toLowerCase() === 'closed'

/**
 * Gorilla Dash answers `opening_hours_array` in the tribe's display format ("6:30 am"
 * for a 12 hour tribe, "06:30" for a 24 hour one). Normalise to "HH:MM" so times
 * compare as strings.
 */
export function toTwentyFourHour(value: string): string {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i)
  if (!match) {
    return value
  }
  let hour = Number(match[1])
  const meridiem = match[3]?.toLowerCase()
  if (meridiem === 'pm' && hour < 12) {
    hour += 12
  }
  if (meridiem === 'am' && hour === 12) {
    hour = 0
  }

  return `${String(hour).padStart(2, '0')}:${match[2]}`
}

export function parseOpeningHours(raw: unknown): OpeningHoursArray {
  if (raw && typeof raw === 'object') {
    return raw as OpeningHoursArray
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as OpeningHoursArray
    } catch {
      return {}
    }
  }

  return {}
}

export function weekHours(raw: unknown): DayHours[] {
  const hours = parseOpeningHours(raw)

  return WEEK_DAYS.map((day) => {
    const slots = (hours[day] ?? [])
      .filter((slot) => !isClosed(slot.open) && !isClosed(slot.close))
      .map((slot) => ({
        open: toTwentyFourHour(slot.open as string),
        close: toTwentyFourHour(slot.close as string)
      }))

    return {
      day,
      slots,
      label: slots.length
        ? slots.map((slot) => `${formatTime(slot.open)} – ${formatTime(slot.close)}`).join(', ')
        : 'Closed'
    }
  })
}

/** The weekday and "HH:MM" wall-clock time right now in a timezone. */
export function localNow(
  timezone: string | null | undefined,
  now = new Date()
): { day: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || 'America/Chicago',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(now)

  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''

  return { day: part('weekday'), time: `${part('hour')}:${part('minute')}` }
}

export type OpenStatus = { isOpen: boolean; label: string }

/**
 * "Open until 3pm" / "Opens 7am tomorrow" / "Closed today". Time-dependent, so
 * callers render it after mount only — server and client clocks differ.
 */
export function openStatus(
  raw: unknown,
  timezone: string | null | undefined,
  now = new Date()
): OpenStatus {
  const week = weekHours(raw)
  const { day, time } = localNow(timezone, now)
  const todayIndex = WEEK_DAYS.indexOf(day as (typeof WEEK_DAYS)[number])
  const today = week[todayIndex]

  const current = today?.slots.find((slot) => time >= slot.open && time < slot.close)
  if (current) {
    return { isOpen: true, label: `Open until ${formatTime(current.close)}` }
  }

  const later = today?.slots.find((slot) => time < slot.open)
  if (later) {
    return { isOpen: false, label: `Opens at ${formatTime(later.open)}` }
  }

  for (let offset = 1; offset <= 7; offset++) {
    const next = week[(todayIndex + offset) % 7]
    if (next?.slots.length) {
      const when = offset === 1 ? 'tomorrow' : next.day
      return { isOpen: false, label: `Opens ${formatTime(next.slots[0]!.open)} ${when}` }
    }
  }

  return { isOpen: false, label: 'Hours not available' }
}

export function todayName(timezone: string | null | undefined): string {
  return localNow(timezone).day
}
