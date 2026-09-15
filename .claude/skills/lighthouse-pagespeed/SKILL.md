---
name: lighthouse-pagespeed
description: Use whenever the user asks to test / check / measure Google PageSpeed, PageSpeed Insights (PSI), Lighthouse score, a web performance audit, or Core Web Vitals of a URL. ALWAYS run Lighthouse locally via `npx lighthouse` with the PSI-equivalent throttling below — do NOT use the PSI web UI (flaky, transient RPC/"Oops! Something went wrong" errors) or the PSI REST API (per-day quota → HTTP 429). Covers mobile (Slow 4G / Moto G Power / 4× CPU) and desktop runs, plus parsing the JSON into a score + metrics + top opportunities summary.
metadata:
  author: casper
---

# Testing Google PageSpeed with local Lighthouse

When the user asks to test PageSpeed / PSI / Lighthouse / "how fast is the site" /
performance, run **Lighthouse locally via `npx lighthouse`**. It's the same engine
PSI uses, and with the flags below it applies the same device emulation + network
throttling — but it's reliable (the PSI web UI throws transient backend errors and
the PSI API is rate-limited to a low per-day quota).

## Prerequisites

- Google Chrome installed — `chrome-launcher` finds it automatically (macOS:
  `/Applications/Google Chrome.app`). No manual path needed.
- `npx --yes lighthouse` downloads Lighthouse on first use (one-time).
- `jq` for parsing.
- Write reports to a **temp dir, never the repo**: `OUT="$(mktemp -d)"`.

## Mobile run — matches PSI mobile (simulated Slow 4G + Moto G Power + 4× CPU)

```bash
OUT="$(mktemp -d)"; URL="<the url>"
npx --yes lighthouse "$URL" \
  --form-factor=mobile \
  --throttling-method=simulate \
  --throttling.rttMs=150 \
  --throttling.throughputKbps=1638.4 \
  --throttling.requestLatencyMs=562.5 \
  --throttling.downloadThroughputKbps=1474.56 \
  --throttling.uploadThroughputKbps=675 \
  --throttling.cpuSlowdownMultiplier=4 \
  --screenEmulation.mobile \
  --screenEmulation.width=412 \
  --screenEmulation.height=823 \
  --screenEmulation.deviceScaleFactor=1.75 \
  --emulated-user-agent="Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36" \
  --only-categories=performance \
  --output=json --output=html --output-path="$OUT/lh-mobile" \
  --chrome-flags="--headless=new --no-sandbox --disable-gpu" --quiet
# produces: $OUT/lh-mobile.report.json (parse below) + $OUT/lh-mobile.report.html (send to user)
```

These throttling values **are** Lighthouse's `mobileSlow4G` preset = exactly what
PSI mobile uses. Pinning them explicitly makes the run reproducible and immune to
Lighthouse default changes.

## Desktop run — matches PSI desktop

```bash
npx --yes lighthouse "$URL" --preset=desktop --only-categories=performance \
  --output=json --output=html --output-path="$OUT/lh-desktop" \
  --chrome-flags="--headless=new --no-sandbox --disable-gpu" --quiet
```

`--preset=desktop` sets desktop emulation + throttling (RTT 40ms, 10 Mbps, no CPU
slowdown, 1350×940), which is what PSI desktop uses.

## Summarize the result (parse JSON with jq)

```bash
f="$OUT/lh-mobile.report.json"
# score
jq -r '(.categories.performance.score*100)|round | "score = \(.)"' "$f"
# the five metrics
jq -r '.audits | "FCP: \(.["first-contentful-paint"].displayValue)\nLCP: \(.["largest-contentful-paint"].displayValue)\nTBT: \(.["total-blocking-time"].displayValue)\nCLS: \(.["cumulative-layout-shift"].displayValue)\nSI:  \(.["speed-index"].displayValue)"' "$f"
# failing audits + Lighthouse "insight" items (render-blocking / image-delivery / lcp / cache), worst first
jq -r '.audits | to_entries | map(select(.value.score != null and .value.score < 0.9))
  | sort_by(.value.score) | .[]
  | "score=\(.value.score) [\(.key)] \(.value.title)" + (if (.value.displayValue//"")=="" then "" else " — \(.value.displayValue)" end)' "$f"
# which images waste the most bytes (usually the LCP driver)
jq -r '.audits["image-delivery-insight"].details.items[]? | [(.url // .node.snippet), (.wastedBytes // .totalBytes)] | @tsv' "$f"
# LCP element (when present)
jq -r '.audits["largest-contentful-paint-element"].details.items[]?.items[]? | (.node.snippet // .url // .node.nodeLabel)' "$f"
```

Report to the user: the score, the five metrics, and the top opportunities/insights
by savings. Explicitly call out **what's driving LCP** (almost always a large or
late-discovered image). Offer to send the `.report.html` via the file tool so they
can open the full report.

Note: modern Lighthouse (v12+/13) groups many findings as `*-insight` audits
(`render-blocking-insight`, `image-delivery-insight`, `lcp-discovery-insight`,
`cache-insight`, …) rather than the old `opportunity` audits — the "failing audits"
jq above catches both; don't rely only on `details.overallSavingsMs`.

## Caveats — say these to the user

- **Score ≈ PSI but not identical.** PSI runs from Google's own servers, so the
  document **TTFB / origin latency it observes differs from a local run** —
  simulated throttling models the _network path_ to the user, not Google's
  server→origin leg. Expect a few points of difference (e.g. a local 73 vs a PSI
  63). The **opportunities/diagnostics are the same** and are what matter for
  "where's the problem".
- Lighthouse has run-to-run variance; for a stable number run **2–3× and take the
  median**.
- **Field data (CrUX)** — the "real users are experiencing" section — only exists
  in PSI and needs real traffic; local Lighthouse is lab-only.

## Options

- Full PSI-style report (Performance + Accessibility + Best Practices + SEO): drop
  `--only-categories=performance`.
- This is a personal tooling skill (`.claude/skills/`); mirror to `.cursor/` /
  `.junie/` only if the team wants it shared with those tools.
