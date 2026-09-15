import type { Auth } from '@/types/auth'
import type { BoundLocationInfo } from '@/types/locations'
import type { NormalizedCacheObject } from '@apollo/client/core'

declare global {
  interface Window {
    // Dehydrated Apollo cache injected by ssr.ts; restored on the client (plugins/apolloClient.ts).
    __APOLLO_STATE__?: NormalizedCacheObject
  }

  // Minimal typing for the SSR renderer's runtime env reads (inertiaApp.ts,
  // plugins/apolloClient.ts). `process` only exists under Node during SSR, so
  // every usage MUST stay behind an `import.meta.env.SSR` guard (which also
  // tree-shakes it out of the client bundle). Deliberately not @types/node —
  // the full Node surface should not look available in browser-context code.
  const process: { env: Record<string, string | undefined> }
}

// Extend ImportMeta interface for Vite...
declare module 'vite/client' {
  interface ImportMetaEnv {
    // Build-time, country-agnostic constants only (baked from .env.example).
    // Per-country values are runtime instead — see resources/ts/runtimeConfig.
    readonly VITE_GCS_STATIC_URL?: string
    [key: string]: string | boolean | undefined
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
    readonly glob: <T>(pattern: string) => Record<string, () => Promise<T>>
  }
}

declare module '@inertiajs/core' {
  export interface InertiaConfig {
    sharedPageProps: {
      name: string
      auth: Auth
      sidebarOpen: boolean
      graphqlToken: string | null
      // The session-bound store, resolved server-side (HandleInertiaRequests →
      // App\Services\BoundLocation). Null when nothing is bound. Read via useBoundLocation().
      boundLocation: BoundLocationInfo | null
      // Per-country public frontend config (HandleInertiaRequests::share),
      // consumed via resources/ts/runtimeConfig. Add new per-country values here.
      config: {
        googleMapApiKey: string | null
        orgId: string | null
        websiteId: string | null
        country: string | null
      }
    }
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $inertia: typeof Router
    // `$page` is deliberately NOT declared. Inertia installs it as a getter over its
    // module-level page ref, so reading `$page.props.x` in a template evaluates during
    // that component's render — after this request's GraphQL awaits, by which time a
    // concurrent SSR render may have replaced the ref. Use useSharedProps() instead.
    // Page props received through defineProps are safe: Inertia resolves them once, in
    // the App component's synchronous render pass, before any child awaits.
    $headManager: ReturnType<typeof createHeadManager>
  }
}
