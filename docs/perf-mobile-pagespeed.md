# Mobile PageSpeed — render-path optimization

The mobile Lighthouse score for `juniper-table-usa` was held down by the **critical
rendering path**: render-blocking requests and a late-discovered LCP image were
pushing First Contentful Paint (FCP) and Largest Contentful Paint (LCP) out past
5–7 seconds on a simulated Slow-4G phone. This note records what we changed, the
measured effect, and the one lever that remains.

> **TL;DR** — Four changes (font async, pattern lazy/resize, LCP `fetchpriority`,
> inline CSS) cleared **every** render-blocking item. Mobile LCP dropped **7.5s →
> 3.1s** and the score went **73 → 80** (warm). What's left is server-side: the
> HTML is uncached, so a cold SSR render is now the only thing that moves the
> number. That's the edge-HTML-cache work, tracked separately.

## How we measure

Run the **`lighthouse-pagespeed` skill** (Claude Code) or `npx lighthouse`
directly with the PSI-equivalent mobile throttling (Slow 4G, Moto G Power, 4×
CPU) — the exact flags live in `.claude/skills/lighthouse-pagespeed/SKILL.md`.

- Use **local Lighthouse**, not the PSI web UI (transient "Oops! Something went
  wrong" RPC errors) or the PSI REST API (low per-day quota → HTTP 429).
- Lighthouse has run-to-run variance — **run 2–3× and take the median**.
- The score is lab-only. It ≈ PSI but is not identical, because PSI observes
  Google's own server→origin TTFB, which a local run can't reproduce.

## What we changed

| #   | Change                                                                                                                                                                 | File(s)                                                                                          | Why it helps                                                                                                                                                                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Font async** — bunny.net Oswald/Pacifico loaded via `preload as=style` + `onload→rel=stylesheet` (+ `<noscript>`)                                                    | `resources/views/app.blade.php`                                                                  | The cross-origin font CSS was render-blocking. `display=swap` shows a fallback face until it loads (FOUT, never invisible text). Preconnect kept for a fast fetch. We **don't** self-host — that would add CDN traffic for no LCP gain.                                         |
| 2   | **Pattern image (A)** — `pattern.png` overlays now render through `FastlyOptimizedImage` with a capped `patternSizes` (≤512px) and `patternOptions` (lazy by default)  | _(components since removed with the brand sections; kept here for the technique)_ | The decorative pattern was a heavy full-size PNG. Fastly IO **can't** lossy-compress this PNG (quality is a no-op, no AVIF), so shrinking the delivered dimensions + lazy-loading below-the-fold is the only lever. Do **not** give it `bannerSizes` (1920px) — that regresses. |
| 3   | **LCP `fetchpriority` (C)** — the hero background (the LCP element) gets `fetch-priority="high"` and eager loading; `FastlyOptimizedImage` grew a `fetchPriority` prop | `HomeHero.vue`, `components/core/FastlyOptimizedImage.vue`                                       | Tells the browser to fetch the LCP image ahead of other resources, so LCP is discovered and painted sooner.                                                                                                                                                                     |
| 4   | **Inline CSS** — the compiled `app.css` (~11KB gzip, the last render-blocking request) is inlined into `<head>`; dev keeps `@vite` for HMR                             | `resources/views/app.blade.php`                                                                  | Removes a full network round-trip before first paint. See the pattern below.                                                                                                                                                                                                    |

### The inline-CSS pattern

```blade
@php($vite = app(\Illuminate\Foundation\Vite::class))
@if ($vite->isRunningHot())
    {{-- dev: Vite HMR serves + hot-reloads the stylesheet --}}
    @vite(['resources/css/app.css', 'resources/ts/app.ts', "resources/ts/pages/{$page['component']}.vue"])
@else
    {{-- prod: inline the built CSS, drop it from @vite --}}
    <style>{!! $vite->content('resources/css/app.css') !!}</style>
    @vite(['resources/ts/app.ts', "resources/ts/pages/{$page['component']}.vue"])
@endif
```

Why this is safe and correct:

- `app.ts` does **not** import `app.css` — it's a standalone Vite entry whose
  manifest chunk has `css: null`. So dropping it from the `@vite` array cleanly
  removes the only `<link rel=stylesheet>`; nothing else re-emits it.
- We inline the **whole** stylesheet rather than loading it async. The app's main
  CSS **must not** be async — that causes a flash of unstyled content (FOUC) and
  layout shift. It's small enough (~11KB over the wire) that inlining wins.
- Trade-off: the CSS is re-sent inline with each full HTML document instead of
  being cached as a separate file. This is negligible at 11KB, and Inertia
  navigations don't refetch the shell. When edge HTML caching lands, the inline
  CSS is cached together with the HTML.

## Results (mobile, median of 3 runs)

| Metric                | Baseline | After A+C     | After inline-CSS |
| --------------------- | -------- | ------------- | ---------------- |
| Score                 | 73       | 64            | **80**           |
| FCP                   | —        | 5.1s          | **2.2s**         |
| LCP                   | 7.5s     | 6.3s          | **3.1s**         |
| TBT                   | —        | 0 ms          | 0 ms             |
| CLS                   | —        | 0             | 0                |
| Render-blocking items | —        | 1 (`app.css`) | **0**            |

> The A+C step targeted image delivery / LCP specifically, so its win shows up in
> LCP, not the overall score. Inlining the CSS is what cleared the last
> render-blocking item and dropped FCP.

## What's left: SSR TTFB

Runs are now **bimodal** — e.g. a 65 next to two 80s — and the difference is
entirely **cold-vs-warm SSR time to first byte**. The document is served
`cache-control: no-cache, private` (it sets a session cookie), so the edge always
MISSes and Laravel re-renders the Inertia SSR shell on every request. Measured
document TTFB swings **0.48s – 0.93s**, and that variance maps straight onto the
FCP/LCP variance.

Every **client-side** render-path blocker is now cleared. The remaining ceiling
is server-side: **edge HTML caching** for anonymous visitors (cache the shell at
the edge, bypass personalized requests) would flatten the cold-TTFB tail and hold
the score at 80+. That work is `docs/edge-html-cache.md`.

> **Update (2026-07)** — the edge HTML cache landed; the document now serves from
> the edge (`cf-cache-status: HIT`, TTFB ~40–120ms) and this section's cold-TTFB
> analysis is historical. Mobile now sits at **88–92**, and LCP is no longer bandwidth-bound.

## The brand pattern: why `quality` was a no-op, and what actually worked

Change #2 above concluded that "Fastly IO can't lossy-compress this PNG (quality
is a no-op)" and treated **dimension** as the only lever. That observation was
right and the explanation was missing, so it's worth writing down — the same trap
will catch the next transparent overlay.

`pattern.png` is **pure white everywhere**; its entire shape lives in the alpha
channel. **WebP always encodes alpha losslessly** — `quality` only ever touches
RGB — so a flat-white transparent source ignores every compression setting Fastly
offers. Measured against the CDN at 320w:

| source        | `quality=10` | `quality=45` | `quality=90` |
| ------------- | ------------ | ------------ | ------------ |
| `hero-bg.jpg` | 2.8 KB       | 9 KB         | 60 KB        |
| `pattern.png` | 87.3 KB      | 87.3 KB      | 87.3 KB      |

`format=webply` (lossy WebP) came back **larger**; `format=avif` was ignored.
Posterizing the master's alpha doesn't help either — Fastly resamples on the way
down and LANCZOS smooths the steps back into a gradient (86.4KB → **92.5KB**).

### The fix: move the shape into a channel that compresses

`pattern-mask.jpg` carries the same silhouette as grayscale **luma**, and
`mix-blend-mode: screen` reconstructs the overlay. This is an algebraic identity,
not an approximation:

- white at per-pixel alpha `s`, element opacity `a` → `b + a·s·(1−b)`
- grayscale layer `s` screened at opacity `a` → `b + a·s·(1−b)`

| candidate | before      | after       |
| --------- | ----------- | ----------- |
| 240w      | 54.6 KB     | 21.3 KB     |
| **320w**  | **86.4 KB** | **30.8 KB** |
| 480w      | 143.2 KB    | 51.6 KB     |
| 512w      | 155.0 KB    | 55.2 KB     |

Total page weight went 766,523 → 701,139 bytes. Fidelity: mean deviation
**0.43/255** on the encoded round trip, **0.05/255** across the rendered hero
(0.01% of pixels off by >5/255). Chromium, WebKit and Firefox render the pattern
region identically (luminance mean 207.1 / 207.0 / 206.8, std 37.3 / 37.2 / 37.3).

Each overlay needs `mix-blend-screen`, and its nearest positioned ancestor needs
`isolate` to bound the blend group. Every usage sits on a coloured backdrop at
opacity 0.2–0.6; **over white, `screen` is a no-op** and this technique cannot be
used.

### Cost: 4ms, not what Lighthouse's numbers suggest

Lighthouse's `elementRenderDelay` for the LCP element moved 13ms → 26–52ms after
this change, which looks like a blend cost of ~110ms once scaled by the 4× CPU
throttle. **It isn't.** A controlled A/B against the live page — same URL, same
bytes, 4× CPU + Slow 4G, only the blend toggled, n=6 each — gives:

| variant                         | LCP median |
| ------------------------------- | ---------- |
| `blend` (shipped)               | 1196 ms    |
| `normal` (same image, no blend) | 1192 ms    |
| `hidden` (overlay not painted)  | 1176 ms    |

The blend costs **~4ms**; the whole overlay costs ~20ms. Lighthouse's simulated
LCP on this page is bimodal with a ~1.3s spread, so single-run deltas below a few
hundred ms carry no information. Don't re-litigate this from a Lighthouse diff.

### Browser support and the failure mode we accepted

`screen` is fully supported everywhere that matters. caniuse marks Safari and iOS
Safari "partial (#2)", and note #2 reads: _"Partial in Safari refers to not
supporting the `hue`, `saturation`, `color`, and `luminosity` blend modes."_ —
`screen` is not on that list.

The one browser with no blending at all is **Opera Mini** (`caniuse-lite`
1.0.30001797 puts its global share at literally `0`).

**The failure mode is loud, not graceful.** `pattern-mask.jpg` is opaque RGB, so
a browser that ignores `mix-blend-mode` paints a hard-edged dark grey rectangle
over the right of the hero — not a missing pattern. We shipped without a guard
because Opera Mini's share is zero. **If anyone ever reports that rectangle**, or
if some future mode disables blending (high-contrast, print, a reduced-effects
setting), the fix is a feature query — hide by default, reveal on support:

```css
.brand-pattern {
  display: none;
}
@supports (mix-blend-mode: screen) {
  .brand-pattern {
    display: block;
  }
}
```

Write it in that direction, **not** as `@supports not (...)`: a browser too old
to understand `@supports` would skip a `not` block entirely and still show the
rectangle. Opera Mini does support `@supports`, so this guard reaches it.
