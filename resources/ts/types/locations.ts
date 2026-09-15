/**
 * Prop contracts for the Locations page sections.
 *
 * Like `types/home.ts`, these mirror the Figma content so the sections stay
 * presentational and the page can swap fake constants for server props later.
 */
import type { StoreLocation } from '@/constants/locations'
import type { CtaLink } from './home'

export interface OpenLocationContent {
  title: string
  description: string
  cta: CtaLink
}

/**
 * The session-bound store ("locked" location), resolved server-side by
 * App\Services\BoundLocation and shared on every page as page.props.boundLocation.
 * Null when no store is bound (e.g. after visiting the /locations index). Read it
 * through the useBoundLocation() composable rather than the raw prop.
 *
 * Intentionally minimal — just the basics shared surfaces (header/footer/home)
 * need. Pages that need richer per-store data (hours, map, ordering, SEO) fetch
 * the full tribe themselves by slug.
 */
export interface BoundLocationInfo {
  name: string | null
  slug: string | null
  email: string | null
  phone: string | null
  address_1: string | null
  address_2: string | null
  locality: string | null
  state: string | null
  country: string | null
  postal_code: string | null
}

/** A service offered at a store — drives the badge row on the detail hero. */
export type LocationService = 'delivery' | 'pickup' | 'dine-in' | 'catering'

export interface LocationHours {
  /** Day label ("Monday"). */
  day: string
  /** Hours for that day ("11:00 am - 9:00 pm") or "Closed". */
  hours: string
}

/** Content for the `locations/:slug` detail hero. */
export interface LocationDetailContent {
  name: string
  services: LocationService[]
  description: string
  /** Street + city/state/zip lines. */
  addressLines: string[]
  phone: string
  directionsHref: string
  hours: LocationHours[]
  orderHref: string
}

/** A row in the `locations/:slug/nearby` list: store geo data + its services. */
export interface NearbyStore extends StoreLocation {
  services: LocationService[]
  /** When true, show "Coming Soon!" instead of the service tags. */
  comingSoon?: boolean
  orderHref: string
}
