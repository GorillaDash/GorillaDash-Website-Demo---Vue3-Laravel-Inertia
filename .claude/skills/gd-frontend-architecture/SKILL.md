---
name: gd-frontend-architecture
description: >-
  GD's house frontend architecture for Inertia v3 + Vue 3 apps (the Hungry Gorilla
  / GorillaDash codebase). Prefer this over generic Vue/Inertia skills for any
  work inside a GD Inertia app's resources/ts/ — it encodes GD-specific
  conventions those don't know. Use it when: rendering or optimizing a static
  image (FastlyOptimizedImage, GCS/CDN assets via @/lib/gcs, image presets, the
  @services alias, npm run static:upload); deciding where a file goes
  (pages/layouts/components/api/services/stores/composables); adding or switching
  a layout (default layout, defineOptions({ layout }), nested layouts); fetching
  or mutating data over GraphQL/Apollo (useQuery/useMutation, @vue/apollo-composable,
  where gql documents live, the api/ layer); graphql-codegen (pnpm codegen, the
  typed graphql() helper, the __generated__ folder, empty output); the Apollo
  client setup or the window.graphqlToken auth injection; a Pinia store vs Apollo
  cache decision; Tolgee i18n / translatable text; the @ alias or a resources/ts
  import that resolves in the editor but fails the build; or scaffolding a new
  page/route. Activate even when "Inertia", "GraphQL", or "architecture" aren't
  said — any .vue page/layout edit or resources/ts/** work in a GD repo should
  consult this first. NOT for: backend-only Laravel (controllers, migrations,
  Eloquent, Pest tests), standalone Tailwind styling, — default is a vue-router SPA, and this skill is Inertia-only.
---

# GD Frontend Architecture (Inertia v3 + Vue 3)

This is the shared frontend architecture for GD projects. The goal of this skill
is so that anyone — new teammate or returning one — can add a page, add or
switch a layout, wire up routing, or move data from the server to a Vue page
without having to reverse-engineer how the project is wired. Follow these
conventions so the codebase stays consistent and predictable.

## The stack

| Layer         | What we use                                                           |
| ------------- | --------------------------------------------------------------------- |
| Server        | Laravel 13 + `inertiajs/inertia-laravel` v3                           |
| Client        | Vue 3 (`<script setup lang="ts">`) + `@inertiajs/vue3` v3             |
| Build         | Vite + `@inertiajs/vite` (auto page resolution), `@vitejs/plugin-vue` |
| Typed routes  | Laravel Wayfinder (`@laravel/vite-plugin-wayfinder`)                  |
| Data API      | **GraphQL** via `@apollo/client` + `@vue/apollo-composable`           |
| Typed GraphQL | `@graphql-codegen` (client preset) → `graphql/__generated__/`         |
| State         | **Pinia** (setup-style stores)                                        |
| i18n          | **Tolgee** (`@tolgee/vue` + `@tolgee/format-icu`)                     |
| Styling       | Tailwind CSS v4 (CSS-first, no `tailwind.config.js`)                  |
| Quality       | oxlint + Prettier + `vue-tsc`                                         |

Two ideas drive the architecture, and knowing how they split is the key to not
fighting the codebase:

- **Inertia** owns **routing and the first render**. A Laravel route returns an
  Inertia _page_ (a Vue component name + initial props), and Inertia swaps the
  page component on the client — no client-side router needed.
- **GraphQL (Apollo)** owns **live data and mutations** after that first render.
  This is a deliberate GD choice layered on top of Inertia: Inertia gets the page
  on screen fast with its initial props, then components query and mutate through
  our GraphQL API via `@vue/apollo-composable`.

So: **server props for the initial paint, GraphQL for everything interactive.**
See `references/pages-and-data.md` for exactly where the line falls.

## Where everything lives

All frontend source is TypeScript under **`resources/ts/`** (note: `ts`, not
`js` — see the alias rule below).

The folder taxonomy mirrors GD's established frontend so the two
codebases feel the same:

```
resources/ts/
├── app.ts          # Inertia bootstrap (resolve + default layout + setup); plugins registered here
├── pages/          # one .vue per Inertia page — routed to by component name
├── layouts/        # shared page frames (header/footer/nav)
├── components/     # reusable Vue components (not pages, not layouts)
├── api/            # GraphQL operations per domain — the data-access layer
├── graphql/        # codegen OUTPUT (__generated__) — the typed graphql() fn + types
├── services/       # business logic & cross-cutting helpers (NOT gql documents)
├── stores/         # Pinia stores (setup-style; client/UI state)
├── composables/    # reusable Vue composables (useX)
├── plugins/        # boot-time integrations set up in app.ts (apolloClient, i18n, …)
├── constants/      # shared constant values
├── lib/ or utils/  # framework-agnostic helpers (e.g. cn() for Tailwind)
├── types/          # shared TS types + ambient declarations
├── actions/  ┐
├── routes/   ├─ GENERATED by Wayfinder — gitignored, never edit by hand
└── wayfinder/┘
```

Where things go, in one line each — getting these boundaries right is what keeps
the codebase navigable:

- **pages/** — a screen Inertia routes to. **components/** — anything reusable a
  page or layout composes. **layouts/** — the outer frame around a page.
- **api/** — GraphQL queries/fragments/mutations for a domain entity, plus the
  `useQuery`/`useMutation` wrappers (one file per entity: `api/products.ts`).
- **graphql/`__generated__`** — codegen output. You import the typed `graphql()`
  function and result types from here; you never hand-edit it.
- **services/** — business logic and helpers that aren't GraphQL documents
  (analytics, geo, head/meta, formatting). If you're tempted to put a gql query
  in `services/`, it belongs in `api/` instead.
- **stores/** — Pinia for genuinely shared _client_ state (breakpoints, selected
  filters, favourites). Don't mirror server data here — that's Apollo's cache.
- **plugins/** — things wired once at boot (the Apollo client, i18n, analytics).
- **composables/** — reusable reactive logic; **constants/** — shared constants.

```
resources/css/app.css # Tailwind v4 entry (@import 'tailwindcss' + @theme)
routes/web.php        # URL → Inertia page mapping
resources/views/app.blade.php # the single HTML shell Inertia mounts into
```

### Naming & import conventions — the rules that bite people

- **Source is `resources/ts/`, not `resources/js/`.** The `js/` name is the
  framework default; this project deliberately uses `ts/`. Both the `@` alias and
  Wayfinder's output path are pointed at `ts/`. If you ever see files appear in
  `resources/js/`, a tool was misconfigured — check `vite.config.ts` and
  `tsconfig.json` point at `ts`.
- **Import with the `@` alias.** `@` maps to `resources/ts/`. Use
  `import AppLayout from '@/layouts/AppLayout.vue'`, not deep relative paths.
  The alias is configured in **two** places that must agree: `tsconfig.json`
  (`paths`) for type-checking, and `vite.config.ts` (`resolve.alias`) for
  bundling. If an import type-checks but fails to build (or vice versa), one of
  those two is missing the alias.
- **Pages are PascalCase and addressed by name.** `pages/Welcome.vue` is the
  `'Welcome'` component; nested pages use a path, e.g.
  `pages/Settings/Profile.vue` → `'Settings/Profile'`.
- **Never edit or commit `actions/`, `routes/`, `wayfinder/`.** They're
  regenerated by the Wayfinder Vite plugin on every dev/build and are gitignored.

## Adding a page (the common case)

1. Create `resources/ts/pages/Foo.vue` with `<script setup lang="ts">` and a
   single root element in the template.
2. Add `<Head title="Foo" />` (from `@inertiajs/vue3`) for the tab title.
3. Map a URL to it in `routes/web.php`:
   `Route::inertia('/foo', 'Foo')->name('foo');`
4. Do nothing about layout — the page gets the default `AppLayout` automatically
   (see below). Run the dev server; the page is live.

A page that needs server data uses a controller instead of `Route::inertia` —
see `references/routing-wayfinder.md` and `references/pages-and-data.md`.

## Layouts: default, switching, and none

This is the part teammates ask about most, so here is the whole model.

### How the default layout works

`app.ts` owns Inertia's `resolve`, and after loading each page it assigns a
**default layout** unless the page declared its own:

```ts
// resources/ts/app.ts (the important line)
module.default.layout = module.default.layout ?? AppLayout
```

The consequence: **a page with no layout declaration is wrapped in `AppLayout`
for free.** That's why `pages/Welcome.vue` has no layout code yet still renders
inside the app frame.

> Why we took over `resolve`: the `@inertiajs/vite` plugin normally injects
> `resolve` for you, but it has no hook for a default layout. It detects that we
> already define `resolve` and steps aside, so our version (with the default
> layout) wins. Don't add a second `resolve` — edit the one in `app.ts`.

### Switching a page to a different layout

Declare it in the page with `defineOptions`. This overrides the default:

```vue
<script setup lang="ts">
import GuestLayout from '@/layouts/GuestLayout.vue'
defineOptions({ layout: GuestLayout })
</script>
```

### Rendering a page with no layout (e.g. a bare login screen)

```vue
<script setup lang="ts">
defineOptions({ layout: null })
</script>
```

### The three rules, summarized

| You want                | Write in the page                       |
| ----------------------- | --------------------------------------- |
| The default `AppLayout` | _nothing_                               |
| A different layout      | `defineOptions({ layout: SomeLayout })` |
| No layout at all        | `defineOptions({ layout: null })`       |

### Creating a new layout

1. Add `resources/ts/layouts/MyLayout.vue`. A layout is just a Vue component
   that renders a `<slot />` where the page content goes, plus whatever shared
   chrome (header, nav, footer) you want. Use `<Link>` from `@inertiajs/vue3`
   for navigation so clicks stay client-side.
2. To make it a page's layout, import it and `defineOptions({ layout: MyLayout })`
   in that page. To make it the project-wide default, change the fallback in
   `app.ts` (`?? MyLayout`).

A minimal layout to copy:

```vue
<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="flex gap-4 border-b p-4">
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
    </header>
    <main class="flex-1 p-6"><slot /></main>
    <footer class="border-t p-4 text-center text-sm text-gray-500">© GD</footer>
  </div>
</template>
```

**Persistent layouts are a feature, not a side effect.** Because Inertia keeps
the layout component mounted across page changes, any state inside a layout
(open menus, scroll position, a playing audio element) survives navigation.
This is why we set the layout on the page rather than wrapping content inside
each page. For nested layouts and dynamic layout props (`setLayoutProps`), see
`references/layouts.md`.

## Routing & Wayfinder (short version)

- Simple page with no data → `Route::inertia('/path', 'Component')->name('...')`.
- Page with data → a controller returning `Inertia::render('Component', [...])`.
- From the frontend, **call backend routes through Wayfinder's generated
  functions** (imported from `@/actions/...` or `@/routes/...`) instead of
  hardcoding URL strings — you get types and refactor-safety.

Full patterns (controllers, named routes, Wayfinder usage, regeneration) are in
`references/routing-wayfinder.md`. Read it before wiring forms or links to the
backend.

## Pages, data & state (short version)

The dividing line again, because it's the thing newcomers get wrong:

- **First paint → Inertia props.** The controller may pass initial props the page
  needs immediately (the record being viewed, the current user). Read them with
  `defineProps`. Use this for what must be on screen at first render.
- **Everything interactive → GraphQL via Apollo.** Lists that refetch, detail
  panels, anything loaded on interaction, and **all mutations** go through
  `@vue/apollo-composable` (`useQuery` / `useMutation`). Operations are **typed
  documents** built with the codegen `graphql()` helper and live in `api/`
  (one file per domain entity). Don't fetch business data with `fetch`/axios.
- **Server data is Apollo's cache, not Pinia.** Use Pinia (`stores/`) for client
  UI state (sidebar open, wizard step, selected filters). Don't mirror GraphQL
  results into a Pinia store — it just creates two sources of truth.
- **Shared page props** (auth user, UI flags) come from Inertia and are read with
  `usePage()`; they're typed in `types/global.d.ts`.

Copy-paste patterns for `useQuery`/`useMutation`, where the Apollo client is set
up, and how props and GraphQL coexist on one page are in
`references/pages-and-data.md`. Read it before adding data fetching.

## Styling

Tailwind v4, configured CSS-first in `resources/css/app.css` (`@import
'tailwindcss'` + a `@theme` block) — there is **no `tailwind.config.js`**.
Content detection is automatic for files in the Vite module graph, so classes in
`.vue` files are picked up without a `content` array. Merge
conditional/conflicting classes with the `cn()` helper from `@/lib/utils`.

### Canonical classes — the scale before square brackets

Tailwind v4's spacing scale is `0.25rem × n` for **any** n, border/ring/outline
widths take a bare pixel integer, radii and container widths have named scales,
ratios and negatives have bare forms. An arbitrary value that lands on one of
those is a smell — it hides a real utility behind a bracket:

| Write                    | Not                              |
| ------------------------ | -------------------------------- |
| `min-h-104`, `max-w-348` | `min-h-[26rem]`, `max-w-[87rem]` |
| `max-w-4xl`              | `max-w-[56rem]`                  |
| `-top-28`, `top-[-24%]`  | `-top-[7rem]`, `-top-[24%]`      |
| `border-b-10`            | `border-b-[10px]`                |
| `rounded-3xl`            | `rounded-[1.5rem]`               |
| `aspect-4/5`             | `aspect-[4/5]`                   |
| `bg-white!`              | `!bg-white`                      |

`pnpm run tw:scale` (`bin/tailwind-scale.mjs --fix`) rewrites all of it using
**Tailwind's own `canonicalizeCandidates`**, loaded against `resources/css/app.css`
so it knows the project's theme — the same routine `@tailwindcss/upgrade` and the
`eslint-plugin-tailwind-canonical*` plugins call, minus the ESLint this stack doesn't
run (it reaches `@tailwindcss/node` through `@tailwindcss/vite`, so no new
dependency). It runs inside `pnpm run lint` and on every commit (lint-staged), and
`pnpm run lint:check` — the CI lint job and `composer ci:check` — fails on anything
it would have rewritten. `pnpm run tw:scale:check` previews without writing. Only
quoted strings are scanned, so comments are never rewritten.

px stays px (`w-[317px]`, `leading-[34px]`) unless you opt in with `--rem=16`,
which folds pixels onto the rem scale (`leading-[34px]` → `leading-8.5`). The
canonicaliser only rewrites what has an _exact_ equivalent, though; the house rule
goes further.

**Built-in first, brackets last.** Reach for a square bracket only when nothing in
Tailwind's own vocabulary can say it, and leave a comment saying why when you do.
A rung that is a few px off the design beats an exact bracket — the fonts already
stand in for the design's, so ±4px on a heading is invisible, while every bracket
is a value nobody can find, theme or lint.

| Instead of                                   | Write                                                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `text-[clamp(2rem,3.3vw,3.75rem)]`           | a ladder: `text-3xl sm:text-4xl xl:text-5xl 2xl:text-6xl`                                                                        |
| `text-[1.375rem]`, `text-[2.75rem]`          | the nearest rung (`text-xl`, `text-5xl`); a size the design pins everywhere becomes a `--text-*` token                           |
| `leading-[1.15]` beside a named `text-*`     | nothing — the rung carries its line-height; `leading-tight` when two lines need air                                              |
| `tracking-[1px]`, `tracking-[0.0625rem]`     | `tracking-wider` (0.05em ≈ 1px at 18px); `tracking-wide` for the subtler 0.5px                                                   |
| `left-[84%]`, `w-[19.4%]`, `h-[46%]`         | fractions: `left-5/6`, `w-1/5`, `h-1/2` — any `n/d` works on inset, size, translate, aspect                                      |
| `grid-cols-[57fr_43fr]`                      | `grid-cols-7` + `col-span-4` / `col-span-3` (56/44 is `grid-cols-9`, 5 + 4)                                                      |
| `rounded-[20px]`, `size-[85px]`, `w-[317px]` | the nearest rung: `rounded-3xl`, `size-21`, `w-80`                                                                               |
| `scale-[1.03]`                               | `scale-105`                                                                                                                      |
| `w-[68vw]`                                   | a fraction of the parent: `w-2/3`                                                                                                |
| `min-[1720px]:block`                         | a rung, or a `--breakpoint-*` token for a width the design pins; an arbitrary breakpoint is **rem** (`min-[107.5rem]`), never px |

**Breakpoints are rem, always.** Tailwind v4 cannot order `1560px` against `64rem`,
so it emits every px-valued arbitrary media query in its own block _before_ the rem
ladder: `lg:hidden 2xl:flex` works, `lg:hidden` plus a px-valued `flex` stays hidden
at 1800 because `lg:hidden` is printed later, while a rem one sorts between the
rungs like any other. And the ladder is rem so it scales with the visitor's browser
font size; a lone px gate would not move with it. A width the design pins that no
rung covers becomes a `--breakpoint-*` token in `app.css` (Graze Craze added
`--breakpoint-3xl: 112.5rem`, its 1800px canvas), not a one-off variant.

What still earns a bracket: `clamp()` for a value that must be fluid (try a ladder
first — Graze Craze's homepage ended with none), a grid template no span ratio
expresses, and an off-grid px the design pins _and_ the layout depends on. Repeated
brackets that mean something (the 1400px design well + gutters = `max-w-366`) are
always a hint to add a `@theme` token instead.

## Static images & responsive optimization (short version)

Static images are **not** Vite-bundled — never `import x from '@/assets/...'`.
Source files live in `public/static/images/{icon,logo,bg,menu}/`, sync to Cloud
Storage with `npm run static:upload`, and are served from the CDN. In Vue:

- Build the URL from the `@/lib/gcs` helpers (`iconPath`/`logoPath`/`bgPath`/
  `menuPath`, based at `VITE_GCS_STATIC_URL`) — never hardcode the CDN host.
- Render **photos** with `@/components/core/FastlyOptimizedImage.vue` (responsive
  `<picture>` via Fastly IO), passing presets from `@/lib/imagePresets`. Classes
  go in `class-name`, not `class` (it's a fragment root — `class` is dropped).
- Leave tiny icons, `w-auto` decorative patterns, and the logo as plain `<img>`.

```vue
<FastlyOptimizedImage
  :src="`${bgPath}/hero-bg.jpg`"
  alt="Gyro"
  class-name="aspect-square w-full object-cover"
  :responsive-sizes="cardSizes"
  :optimization-options="photoOptions"
  :sizes="cardSizesAttr"
/>
```

Full details — the upload pipeline, every prop, the preset table, why `sizes`
matters, and the `@services` alias — are in `references/static-images.md`. Read
it before adding or converting images.

## Internationalization (Tolgee)

All user-facing text goes through **Tolgee** (`@tolgee/vue` + `@tolgee/format-icu`)
— never hardcode display strings.

### Wiring (runtime, per-country — like Apollo, not a build-time singleton)

`plugins/tolgee.ts` exports a **factory** `createTolgee()`. It's called in
`inertiaApp.ts` `setupApp()` **after** `setRuntimeConfig()` — so it reads the
per-country values, and each client boot / SSR request gets a fresh instance:

```ts
// inertiaApp.ts (inside setupApp, after setRuntimeConfig)
app.use(VueTolgee, { tolgee: createTolgee() })
app.component('T', T) // <T> registered globally, but t() is the house style
```

Config is **runtime**, not `VITE_*`. It flows
`TOLGEE_CDN_URL`/`TOLGEE_API_URL`/`TOLGEE_API_KEY`
→ `config/services.php` (`services.tolgee.*`)
→ `HandleInertiaRequests` `config` prop → `page.props.config`
→ `runtimeConfig()` (`tolgeeCdnUrl`/`tolgeeApiUrl`/`tolgeeApiKey`).
Set those env vars in `.env` (local) and `deploy/k8s/overlays/*/config.env`
(deploy). `CDN_URL` = the GD localization backend (per-project hash, served via
`BackendFetch`); `API_URL`/`API_KEY` = dev in-context editing only (key blank in
prod). All optional — keys render via their `default` when unset. Locale codes
live in `constants/i18nLocales.ts` (an enum, kept separate to avoid circular
imports); currently **en-US only**.

### Using it — always `useTranslate()`

`t` is a **ref**: in `<template>` it auto-unwraps so call `t(...)`; in `<script>`
call **`t.value(...)`**.

```vue
<script setup lang="ts">
import { useTranslate } from '@tolgee/vue'
const { t } = useTranslate()
const title = computed(() => props.name ?? t.value('Home', 'Home')) // script → t.value
</script>

<template>
  <h1>{{ t('Log In', 'Log In') }}</h1>
  <input :placeholder="t('Search by city, state or zip', 'Search by city, state or zip')" />
</template>
```

### Outside a component — pass it in, and name the parameter `$t`

`useTranslate()` is setup-only: it is built on `getCurrentInstance()`, `inject()`
and `onUnmounted()`, so a plain `.ts` module (a content builder, a formatter)
cannot call it — a `computed()` getter has already left the setup context when it
re-runs. And there is no importable instance to reach for instead: the Tolgee
instance is created per app, and SSR creates one app per request, so a module-scope
singleton would let one request's `changeLanguage` land on another's render.

So such a module takes the function as a parameter — and **must name that
parameter `$t`**:

```ts
// services/aboutContent.ts — runnable under plain node in tests/js
import type { Translate } from '@/types/i18n'

export function aboutContent($t: Translate, links: AboutLinks): AboutContent {
  return { hero: { heading: $t('about.hero.heading', 'Where Good Food Brings People Together') } }
}
```

```vue
// pages/About.vue — it is the page's own t, passed in const { t } = useTranslate() const design =
computed(() => aboutContent(t.value, links()))
```

The name is not cosmetic. Tolgee's extractor only follows a `t` it can trace to a
`useTranslate()` in the same file, which a parameter can never satisfy; `$t` it
treats as the app-global `@tolgee/vue` installs
(`app.config.globalProperties.$t`, registered in the CLI's Vue parser as
`customTCallMerger(['$t', 'this.$t'])`) and extracts from a plain `.ts` module with
no source in sight. Under the name `t` the CLI emits one
``Expected source of `t` function`` warning per call and silently skips every key in the
file — and nothing looks wrong, because each key carries its English default
inline, so the page renders identically whether or not Tolgee has heard of it. Only
a translator finds out. On Graze Craze that cost 258 of 360 keys; it is worth a
scan test (`tests/Unit/TranslateUsageTest.php` there) rather than a comment.

### Key convention (house rules — keep consistent)

- **Short word/phrase, no variable → source-as-key** (English text is both key and
  default): `t('Log In', 'Log In')`, `t('Order Now', 'Order Now')`.
- **A sentence with variable(s) → namespaced key + ICU params**:
  `t('menu.hero.slide', 'Show slide {num}: {title}', { num, title })`,
  `t('footer.copyright', '© {year} Hungry Gorilla. All rights reserved.', { year: String(year) })`.
- **Strip trailing punctuation** (`...` `:` `!` `.`) from the key, append it as a
  literal: `t('Locating', 'Locating') + '...'`, `{{ t('Location', 'Location') }}:`,
  `t('No locations match your search', '…') + '.'`.
- Pass a numeric ICU param as `String(n)` when it can reach ≥1000 (avoids locale
  digit grouping like "2,026").

### Do NOT translate

- **Label/enum maps** — `serviceMeta` (delivery/pickup/…), the Pickup/Delivery
  `modes` toggle, `DietaryTags`' meta (Vegan/Gluten Free/…). Leave as plain
  `{{ map[key].label }}`.
- **CMS content** — anything from `getValueByName(...)` or the `*Service`
  composables (menu items, page copy, franchise/catering blocks). Translate that
  in the CMS, not with keys.
- **Fake/placeholder `// TODO` data**, brand/store names, and numbers/data
  (prices, counts, addresses, phone, hours).

## Before you call it done

Run these — they're the same gates CI uses:

```bash
npm run lint:check     # oxlint
npm run types:check    # vue-tsc --noEmit
npm run build          # production build (catches alias/manifest issues)
```

If the user doesn't see a change in the browser, they likely need `npm run dev`
(or `composer run dev`) running — assets are bundled, not served raw.
