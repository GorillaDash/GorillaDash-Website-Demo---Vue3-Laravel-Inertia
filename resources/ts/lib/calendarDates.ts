/**
 * Calendar dates as "YYYY-MM-DD" strings. Pickup and booking days belong to the
 * tribe's timezone, so "today" is read there once and every later day is plain
 * calendar arithmetic in UTC, which has no daylight-saving jumps. Adding 24 hours to
 * a timestamp instead repeats or skips a date on the nights the clocks change.
 */
export function todayIn(timezone: string | null | undefined, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now)
}

const toUtcDate = (ymd: string): Date => new Date(`${ymd}T12:00:00Z`)

export function addDays(ymd: string, days: number): string {
  const date = toUtcDate(ymd)
  date.setUTCDate(date.getUTCDate() + days)

  return date.toISOString().slice(0, 10)
}

export function formatCalendarDate(ymd: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(toUtcDate(ymd))
}

export function weekdayOf(ymd: string): string {
  return formatCalendarDate(ymd, { weekday: 'long' })
}
