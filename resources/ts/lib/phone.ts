/**
 * The demo trades in the United States only, so its phone fields take a US number
 * and send it to Gorilla Dash in E.164. Returns null when the number is not a
 * 10 digit US number.
 */
export function toUsE164(input: string): string | null {
  const digits = input.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '')

  return digits.length === 10 ? `+1${digits}` : null
}
