<script setup lang="ts">
import { computed } from 'vue'
import LocaleLink from '@/components/core/LocaleLink.vue'

/**
 * Pill-shaped CTA used across marketing sections (Figma "Button" component).
 * Renders a <LocaleLink> (Inertia's <Link>, locale-prefixed) for internal hrefs, a
 * plain anchor for external — and for an empty href, since Inertia's <Link> resolves
 * "" to "/" on the client but leaves it "" during SSR, which hydration-mismatches;
 * a plain <a> renders the attribute verbatim on both sides. Both render an <a>, so
 * the node type is stable.
 *
 * An absolute URL (https:, mailto:, tel:, …) is always a plain <a>, same tab — an
 * Inertia <Link> cannot visit another origin, so any off-site CTA (a store's ordering
 * URL, a franchise site) has to bypass it. `external` additionally opens a new tab.
 *
 * Omit `href` altogether for a <button> and bind @click — a CTA that opens something
 * rather than navigating. Passing "" instead renders <a href="">, which reloads the
 * current page on click.
 */
const props = withDefaults(
    defineProps<{
        href?: string | null;
        variant?: 'primary' | 'light';
        external?: boolean;
    }>(),
    { href: undefined, variant: 'primary', external: false },
);

const variantClasses = {
    primary: 'bg-brand-accent text-white hover:bg-brand-accent-600',
    light: 'bg-white text-brand-primary hover:bg-brand-tint',
};

const isAbsolute = (url: string | null) => url && /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url);

const tag = computed(() => {
    if (props.href === undefined) {
        return 'button';
    }

    return props.external || !props.href || isAbsolute(props.href) ? 'a' : LocaleLink;
});
</script>

<template>
    <component
        :is="tag"
        :href="tag === 'button' ? undefined : href"
        :type="tag === 'button' ? 'button' : undefined"
        v-bind="external ? { target: '_blank', rel: 'noopener noreferrer' } : {}"
        :class="[
            'inline-flex cursor-pointer items-center justify-center gap-3 rounded-full px-8 py-3.5 text-base font-serif font-bold tracking-wider whitespace-nowrap transition-colors sm:px-10 sm:py-4 sm:text-lg',
            variantClasses[variant],
        ]"
    >
        <slot />
    </component>
</template>
