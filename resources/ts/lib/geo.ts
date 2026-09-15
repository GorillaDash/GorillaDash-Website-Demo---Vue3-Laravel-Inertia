/** Great-circle distance in miles between two points. */
export function milesBetween(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const earthRadiusMiles = 3958.8
  const deltaLat = toRadians(to.lat - from.lat)
  const deltaLng = toRadians(to.lng - from.lng)
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(deltaLng / 2) ** 2

  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(a))
}

/** A Google Maps embed for one point. Needs no API key. */
export function mapEmbedUrl(lat: number | string, lng: number | string, zoom = 14): string {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`
}

export function directionsUrl(lat: number | string, lng: number | string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}
