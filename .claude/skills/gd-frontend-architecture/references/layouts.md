# Layouts — advanced

The SKILL.md covers the everyday cases (default, switch, none, create). This file
covers the rest.

## Nested layouts

Pass an array to `layout` to wrap a page in multiple frames, outer-to-inner. The
outer layout's `<slot />` renders the inner layout, whose `<slot />` renders the
page.

```vue
<script setup lang="ts">
import SiteLayout from '@/layouts/SiteLayout.vue';
import SettingsLayout from '@/layouts/SettingsLayout.vue';
defineOptions({ layout: [SiteLayout, SettingsLayout] });
</script>
```

Use this for sections that share sub-navigation (e.g. a settings area sitting
inside the global chrome) without duplicating the outer frame on every page.

## Static props to a layout

Give a layout fixed props with a tuple. These are set once and don't change
between visits:

```vue
<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
defineOptions({ layout: [AppLayout, { title: 'Dashboard' }] });
</script>
```

The layout declares them normally:

```vue
<script setup lang="ts">
defineProps<{ title?: string }>();
</script>
```

## Dynamic layout props (`setLayoutProps`)

When a page needs to push data *up* into the persistent layout at runtime (a
per-page header title, a breadcrumb), use `setLayoutProps` — an Inertia v3
feature. The layout stays mounted, so this updates it in place.

```vue
<!-- page -->
<script setup lang="ts">
import { setLayoutProps } from '@inertiajs/vue3';
setLayoutProps({ title: 'About us' });
</script>
```

```vue
<!-- layout -->
<script setup lang="ts">
withDefaults(defineProps<{ title?: string }>(), { title: 'GD' });
</script>
<template>
  <header>{{ title }}</header>
  <main><slot /></main>
</template>
```

## Why layout-on-page instead of wrapping in the template

Inertia keeps the layout component instance alive across page navigations and
only swaps the page in the `<slot />`. That persistence is the whole point:
state held in the layout (an expanded sidebar, scroll position, a websocket
connection, a media player) survives when you move between pages. If you instead
put `<AppLayout>...</AppLayout>` inside each page's template, the layout would
unmount and remount on every visit and lose that state. So: **set the layout via
`defineOptions`, keep page templates layout-free.**

## Choosing the default vs per-page

- Most pages share one frame → keep that frame as the default in `app.ts`
  (`?? AppLayout`) and let pages stay silent.
- A page is genuinely different (auth screens, full-bleed marketing, print
  views) → override it with `defineOptions({ layout: ... })` or `layout: null`.
- Two large families of pages (e.g. app vs admin) → consider a second default by
  branching in `app.ts`'s resolve on the page name, or just set the admin layout
  explicitly on admin pages. Prefer the explicit version unless the branching
  earns its keep.
