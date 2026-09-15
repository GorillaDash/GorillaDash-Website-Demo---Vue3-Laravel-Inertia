import inertia from '@inertiajs/vite'
import { wayfinder } from '@laravel/vite-plugin-wayfinder'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import laravel from 'laravel-vite-plugin'
import { fontsource, google } from 'laravel-vite-plugin/fonts'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => {
  // Load VITE_-prefixed vars from the project's .env files so the dev-only
  // devtools `launchEditor` can be overridden per-developer (defaults below).
  const env = loadEnv(mode, process.cwd(), '')

  return {
    server: {
      // Herd derives the site host/TLS cert from the directory name
      // (`gd-client-inertia-starter`), but the browser loads the page from the
      // lowercased host. That casing mismatch breaks the HMR websocket. Pin the
      // HMR host to the lowercase origin the page actually uses; `server.host` is
      // left to the plugin so it still finds Herd's (uppercase) cert — TLS matches
      // case-insensitively. The plugin keeps this via `hmr?.host ?? resolvedHost`.
      // hmr: { host: 'gd-client-inertia-starter.test' }
      hmr: { host: new URL(env.APP_URL).host }
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./resources/ts', import.meta.url)),
        '@services': fileURLToPath(new URL('./resources/ts/services', import.meta.url))
      }
    },
    plugins: [
      laravel({
        input: ['resources/css/app.css', 'resources/ts/app.ts'],
        // Dedicated SSR entry (manual createServer + createInertiaApp) so we can
        // serialize the Apollo cache into <head> after render. Outputs
        // bootstrap/ssr/ssr.js — the first candidate Inertia's BundleDetector /
        // `inertia:start-ssr` probes.
        ssr: 'resources/ts/ssr.ts',
        refresh: true,
        fonts: [
          // Registry faces come from @fontsource/* packages (not bunny): the
          // bunny CSS API ignores its subset param and always ships all 5
          // scripts, while fontsource lets this English-only site emit just
          // the latin subset (default) — fewer @font-face rules and preloads.
          // Instrument Sans: default body face. Preload only weight 400 (body
          // text everywhere above the fold); 500/600 swap in via the
          // metric-matched fallback with zero CLS. Preloading all three had
          // them competing with the LCP hero image on throttled mobile.
          fontsource('Instrument Sans', {
            weights: [400, 500, 600, 700],
            preload: [{ weight: 400 }, { weight: 700 }]
          }),
          // Display faces for the other demo themes: Fraunces (cafe) and Oswald
          // (trade). The default Gorilla Dash theme's headings are Instrument Sans
          // 700, preloaded above, so neither of these is.
          google('Fraunces', { weights: [500, 600], preload: false }),
          fontsource('Oswald', { weights: [500, 600], preload: false })
          // Add the client's display/script faces alongside it — one fontsource()
          // per registry family, and give each a metric-matched fallback in
          // app.css or the swap costs CLS. Preload at most the ONE weight that
          // renders above the fold; more preloads compete with the LCP image for
          // bandwidth on throttled mobile. e.g.
          //
          // fontsource('Oswald', { weights: [400, 500, 700], preload: [{ weight: 400 }] }),
          // fontsource('Pacifico', { weights: [400], preload: false })
          // Self-hosted commercial brand faces go here via `local(...)` (import
          // it from 'laravel-vite-plugin/fonts' next to `fontsource` above).
          // SUBSET the masters to woff2/woff first (keep the .otf masters in a
          // fonts-src/ dir), serve from public/static/fonts/, and never preload
          // them — they'd compete with the LCP hero image. Example:
          //
          // local('Archer', {
          //   variants: [
          //     {
          //       src: [
          //         'public/static/fonts/archer-book.woff2',
          //         'public/static/fonts/archer-book.woff'
          //       ],
          //       weight: 400
          //     }
          //   ],
          //   preload: false
          // })
        ]
      }),
      inertia({
        ssr: {
          // Point the plugin at the SSR entry. Its auto-detection only probes
          // `resources/js/*` and `src/*` candidates — not this project's
          // `resources/ts/`. Without this, the dev-mode SSR endpoint
          // (`/__inertia_ssr`) is never registered, so `pnpm run dev` silently
          // falls back to client-side rendering. (The production `--ssr` build
          // already gets the entry from laravel({ ssr: 'resources/ts/ssr.ts' }).)
          entry: 'resources/ts/ssr.ts',
          // Run the Node SSR renderer in cluster mode (multiple worker
          // processes) to use all CPU cores in the container. Only worth it
          // once the ssr container's CPU limit is raised above 1 core; with
          // a 1-core limit the extra workers just contend for the same CPU.
          cluster: false
        }
      }),
      tailwindcss(),
      vue({
        template: {
          transformAssetUrls: {
            base: null,
            includeAbsolute: false
          }
        }
      }),
      // Vue DevTools overlay — dev-server only, excluded from production builds.
      // Laravel has no index.html, so the devtools client must be appended to
      // the JS entry module instead (https://devtools.vuejs.org/help/faq).
      vueDevTools({
        launchEditor: env.VITE_DEVTOOL_LUNCH_EDITOR || 'cursor',
        appendTo: 'resources/ts/app.ts'
      }),
      wayfinder({
        formVariants: true,
        path: 'resources/ts'
      }),
      // Regenerate cmsRoute()'s typed route names/params the same way wayfinder()
      // regenerates its routes: from artisan, on every dev-server start and build.
      // The output (resources/ts/types/cmsRoutes.ts) is gitignored like Wayfinder's;
      // regenerate standalone with `php artisan cms-routes:types` after editing the
      // CMS-driven routes mid-dev. See App\Services\CmsRoutes.
      {
        name: 'cms-route-types',
        buildStart() {
          execFileSync('php', ['artisan', 'cms-routes:types'], {
            stdio: ['ignore', 'ignore', 'inherit']
          })
        }
      }
    ]
  }
})
