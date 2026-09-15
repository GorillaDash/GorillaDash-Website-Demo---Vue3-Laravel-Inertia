import { computed } from 'vue'
import { usePagePaths } from '@/composables/usePagePaths'
import { useSharedProps } from '@/composables/useSharedProps'
import type { BoundLocationInfo } from '@/types/locations'

/**
 * The session-bound store ("locked" location), read from the shared
 * `page.props.boundLocation` prop that HandleInertiaRequests resolves server-side
 * (see App\Services\BoundLocation).
 *
 * The server is the single source of truth for the *resolved* store, so the binding is
 * present on the first paint (SSR included) with no hydration flash. Nothing writes
 * here — the pages set/clear the `gd_store` cookie after mount via @/lib/boundLocation,
 * so their GET renders stay pure reads the edge can cache.
 *
 * Read through useSharedProps, never usePage: this prop is exactly the one that leaked
 * across concurrent SSR renders, putting one visitor's locked store into another's
 * edge-cached HTML.
 *
 * Intentionally basic (name, slug, address, email, phone) — it's the identity shown
 * on shared surfaces (header/footer/home). Pages needing richer per-store data fetch
 * the full tribe themselves by slug.
 */
export function useBoundLocation() {
  const { props } = useSharedProps()
  const { cmsRoute } = usePagePaths()
  const info = computed<BoundLocationInfo | null>(
    () => (props.value.boundLocation as BoundLocationInfo | null) ?? null
  )

  /** Whether a store is currently locked in. */
  const lockedStore = computed(() => !!info.value?.slug)

  const name = computed(() => info.value?.name ?? null)
  const slug = computed(() => info.value?.slug ?? null)
  const email = computed(() => info.value?.email ?? null)
  const phone = computed(() => info.value?.phone ?? null)

  /** The bound store's detail-page URL, or null when nothing is bound. */
  const href = computed(() =>
    info.value?.slug ? cmsRoute('locations.show', { slug: info.value.slug }) : null
  )

  const address = computed(() => ({
    address_1: info.value?.address_1 ?? null,
    address_2: info.value?.address_2 ?? null,
    locality: info.value?.locality ?? null,
    state: info.value?.state ?? null,
    country: info.value?.country ?? null,
    postal_code: info.value?.postal_code ?? null
  }))

  return {
    info,
    lockedStore,
    name,
    slug,
    email,
    phone,
    address,
    href
  }
}
