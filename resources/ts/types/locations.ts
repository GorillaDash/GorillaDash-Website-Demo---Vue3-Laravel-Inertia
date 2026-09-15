/**
 * Prop contracts for the Locations page sections.
 *
 * The bound store shape shared by the header and tribe pages.
 */

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
