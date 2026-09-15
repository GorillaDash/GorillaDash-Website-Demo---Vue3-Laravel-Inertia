/**
 * Gorilla Dash stores money as integer cents, but its food GraphQL fields answer in
 * dollars, so this formats a dollar amount.
 */
export function formatPrice(dollars: number | null | undefined): string {
  const amount = dollars ?? 0

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(amount)
}

/** "Rachel Kim" → "RK", for avatar fallbacks. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

/** "HH:MM" (24 hour) → "7am" / "7:30pm". */
export function formatTime(value: string): string {
  const [hourText = '0', minuteText = '00'] = value.split(':')
  const hour = Number(hourText)
  const suffix = hour >= 12 ? 'pm' : 'am'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12

  return minuteText === '00' ? `${displayHour}${suffix}` : `${displayHour}:${minuteText}${suffix}`
}

/** A CMS timestamp ("2026-06-14 15:00:00") as "June 14, 2026", without timezone conversion. */
export function formatDate(value: string | null | undefined): string {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) {
    return ''
  }
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]

  return `${months[Number(match[2]) - 1]} ${Number(match[3])}, ${match[1]}`
}
