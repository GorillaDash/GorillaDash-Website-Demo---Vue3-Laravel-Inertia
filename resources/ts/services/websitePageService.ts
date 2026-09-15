import { computed } from 'vue'
import { getWebsitePage } from '@/api/websitePages'

// Reads `result` directly via computed so it works under SSR (a `watch` latch
// doesn't — Vue watchers don't fire during render-to-string). useQuery keeps the
// last data across a refetch's loading, so no extra latch is needed to avoid blanking.
export function useWebsitePageService({ slug }: { slug: string }) {
  const { result, refetch } = getWebsitePage(slug)

  const page = computed(() => result.value?.websitePage ?? null)
  const ready = computed(() => page.value !== null)

  return { page, ready, refetch }
}
