# Static images & responsive optimization

How static image assets are stored, served, and rendered in GD Inertia apps.
The headline rule: **static images are NOT Vite-bundled** — they live in the
bucket and are served from the CDN, referenced by URL. Do **not** write
`import logo from '@/assets/...'`; that path no longer exists.

## Where the files live

Source files are committed under `public/static/`, organized by kind:

```
public/static/images/
├── icon/   # small UI icons (dietary badges, utensils, …)
├── logo/   # brand wordmarks
├── bg/     # full-bleed backdrops, textures, patterns
└── menu/   # content/product photos
```

`npm run static:upload` rsyncs that tree to Cloud Storage, preserving structure:

```
public/static/images/bg/hero-bg.jpg
  → gs://gorilladash-static-files/static/clients/acme_/images/bg/hero-bg.jpg
  → served at https://cdn.gorilladash.com/static/clients/acme_/images/bg/hero-bg.jpg
```

The command needs `gcloud auth login` + bucket write access. It's incremental
(only changed files upload) and never deletes remote orphans (old hashed assets
stay cached for in-flight pages). **An image must be uploaded before it shows —
dev hits the CDN too**, so a file that's only local will 404 in the browser.

The bucket is shared by every client: `gorilladash-static-files` in GCP project
`gorilla-dash-178800` (`US-WEST1`, public-read), with `cdn.gorilladash.com` being
Fastly in front of it on the same path, cached for a year — so change an asset by
giving it a new file name, never by overwriting. The client folder is
`static/clients/<camelCaseSlug>_/` (`the-great-greek` → `theGreatGreek_`); a rebuild
of an existing client gets its own underscore folder beside the legacy site's, never
the legacy folder itself. Full rules and the verification steps:
`docs/NEW-CLIENT-CHECKLIST.md` §4.

## Referencing an image: `@/lib/gcs`

Never hardcode the CDN URL. Build paths from the helpers in `lib/gcs.ts`:

```ts
import { iconPath, logoPath, bgPath, menuPath } from '@/lib/gcs'
// each is `${STATIC_SOURCES_URL}/images/<kind>`, e.g.
// menuPath → https://cdn.gorilladash.com/static/clients/acme_/images/menu
```

`STATIC_SOURCES_URL` reads `VITE_GCS_STATIC_URL` (falls back to the production
CDN). Add the env var to `.env` / `.env.example` per project. Need a new top-level
folder (e.g. `videos/`)? Add a `videoRootPath = mergePath(STATIC_SOURCES_URL, 'videos')`
export alongside the existing ones.

## Rendering: `FastlyOptimizedImage`

`@/components/core/FastlyOptimizedImage.vue` renders a responsive `<picture>` that
asks the CDN (Fastly IO) for a resized/reformatted image per device. Prefer it
over a raw `<img>` for **photos** (content shots, full-bleed backdrops).

```vue
<script setup lang="ts">
import FastlyOptimizedImage from '@/components/core/FastlyOptimizedImage.vue'
import { menuPath } from '@/lib/gcs'
import { cardSizes, cardSizesAttr, photoOptions } from '@/lib/imagePresets'
</script>

<template>
  <FastlyOptimizedImage
    :src="`${bgPath}/hero-bg.jpg`"
    alt="Acme Diner Gyro"
    class-name="aspect-square w-full object-cover"
    :responsive-sizes="cardSizes"
    :optimization-options="photoOptions"
    :sizes="cardSizesAttr"
  />
</template>
```

### Props (and the gotchas that bite)

| Prop                    | Purpose                                                                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src` / `alt`           | image URL (a `gcs` path) and alt text (`""` for decorative)                                                                                                                               |
| `class-name`            | **classes go here, NOT `class`.** The template root is a `<picture>`/`<img>` fragment, so a `class` attribute does **not** fall through — it's silently dropped. Always use `class-name`. |
| `:responsive-sizes`     | the candidate widths (a `ResponsiveImageSizes` ladder) the CDN is asked to generate                                                                                                       |
| `:optimization-options` | `Omit<ImageOptimizationOptions,'width'>` — mainly `{ quality }`                                                                                                                           |
| `:sizes`                | standard HTML `sizes` string = how wide it actually renders. Omit → assumes `100vw`                                                                                                       |
| `:lazy`                 | defaults `true` (`loading="lazy"`). Pass `:lazy="false"` for above-the-fold/LCP images                                                                                                    |

The component sets `class="contents"` on its `<picture>` so the inner `<img>`
lays out exactly as a bare `<img>` would (without it, the inline `<picture>` box
breaks `w-full` / `object-cover` / `mx-auto` / `absolute`). Keep that.

### Don't convert these — leave them as `<img>`

- **Tiny icons** (dietary badges ~20px): no benefit, and they often need
  unsupported attrs like `:title`.
- **`w-auto` decorative patterns** (height-driven): width-descriptor `srcset` is
  semantically wrong for them.
- **The logo** (small wordmark, often a `:class` array binding).

## Presets: `@/lib/imagePresets`

Don't hand-tune width ladders / quality / `sizes` at each call site. Pick a
preset. Three axes:

- **`responsive-sizes`** (candidate width ladders): `bannerSizes` (full-bleed
  ~100vw), `panelSizes` (~43% side panels), `cardSizes` (grid cards).
- **`optimization-options`** (quality): `photoOptions` (75), `heroOptions` (80),
  `textureOptions` (45, for faint decorative textures).
- **`sizes`** (rendered-width hints): `cardSizesAttr`, `panelSizesAttr`.
  Full-bleed banners need none — `100vw` is the default.

Mapping used in the app:

| Image kind                   | responsive-sizes | optimization-options | sizes            |
| ---------------------------- | ---------------- | -------------------- | ---------------- |
| Full-bleed backdrop/photo    | `bannerSizes`    | `photoOptions`       | _(none — 100vw)_ |
| Faint texture (opacity ~0.3) | `bannerSizes`    | `textureOptions`     | _(none)_         |
| Grid card (sm:2 / lg:3)      | `cardSizes`      | `photoOptions`       | `cardSizesAttr`  |
| ~43% side panel              | `panelSizes`     | `heroOptions`        | `panelSizesAttr` |

## Why `sizes` matters (the mental model)

The browser picks a `srcset` candidate **before CSS is applied**, so it can't
measure the element — it trusts `sizes`. The default `100vw` makes a card image
fetch a far-larger file than its ~⅓-column slot needs. `sizes` tells the truth
("`(min-width:1024px) 33vw`") so the browser picks a smaller candidate.
`responsive-sizes` caps which widths exist; `sizes` picks among them. Measured on
a 1440px desktop, a menu card dropped from 81 KB (no `sizes`) → 43 KB (`33vw`) →
36 KB (WebP via `auto`). Set `sizes` to match the real layout; leave it off only
when the image truly is 100vw.

## Underlying service & the `@services` alias

The component delegates to `@services/imageOptimizationService` — `generateResponsiveImage`, `optimizeImageUrl`, browser
WebP/AVIF detection, etc. It's framework-agnostic and self-contained (browser
APIs only, with SSR guards), so it's safe under Inertia SSR. You rarely import it
directly; use the component.

`@services` is its own alias (`resources/ts/services/`), configured in **both**
`vite.config.ts` (`resolve.alias`) and `tsconfig.json` (`paths`) — same two-place
rule as `@`. If a `@services/...` import type-checks but fails the build (or vice
versa), one of those two is missing it.

The optimization only happens if the CDN honors Fastly IO query params
(`?width=…&auto=webp`). `cdn.gorilladash.com` does; a different CDN may ignore
them (image still renders, just unoptimized).
