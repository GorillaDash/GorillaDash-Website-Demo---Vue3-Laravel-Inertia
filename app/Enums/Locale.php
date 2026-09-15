<?php

namespace App\Enums;

/**
 * Every locale this codebase knows how to render.
 *
 * The backing value is the Tolgee language tag — what the translation CDN and the
 * Tolgee API are keyed on. The URL segment is deliberately a *different*, shorter
 * identifier (`en-US` lives at `/en`, `ja-JP` at `/jp`), so the tag stays an
 * implementation detail of the translation backend instead of leaking into links.
 *
 * A deployment enables a subset of these through `APP_LOCALES` (see config/i18n.php),
 * which AppServiceProvider validates at boot. This enum is the source of truth; the
 * frontend receives the active subset as an Inertia prop rather than hardcoding it
 * (resources/ts/constants/i18nLocales.ts holds only the matching TypeScript types).
 */
enum Locale: string
{
    case EnUs = 'en-US';
    case EnAu = 'en-AU';
    case JaJp = 'ja-JP';
    case ArEg = 'ar-EG';

    /**
     * This locale's URL segment.
     *
     * Unique only *within* a deployment's supported set — `en-US` and `en-AU`
     * deliberately share `en`, since no single deployment serves both.
     */
    public function code(): string
    {
        return match ($this) {
            self::EnUs, self::EnAu => 'en',
            self::JaJp => 'jp',
            self::ArEg => 'ar',
        };
    }

    /** The language's own name, for a language switcher. */
    public function label(): string
    {
        return match ($this) {
            self::EnUs, self::EnAu => 'English',
            self::JaJp => '日本語',
            self::ArEg => 'العربية',
        };
    }

    /**
     * The locales this deployment serves, in config order.
     *
     * @return list<self>
     */
    public static function supported(): array
    {
        return array_map(self::from(...), config('i18n.supported'));
    }

    /** The locale served when a URL carries no locale segment. */
    public static function default(): self
    {
        return self::from(config('i18n.default'));
    }

    /**
     * Whether this deployment serves more than one locale.
     *
     * The single switch behind the whole feature: it decides whether routes carry a
     * `/{locale}` prefix (routes/web.php) and whether the frontend prefixes links
     * and renders a language switcher.
     */
    public static function isMultilingual(): bool
    {
        return count(self::supported()) > 1;
    }

    /**
     * URL segments of the supported locales, for route constraints.
     *
     * @return list<string>
     */
    public static function codes(): array
    {
        return array_map(fn (self $locale): string => $locale->code(), self::supported());
    }

    /** Resolve a URL segment against the supported set. Null when unknown or not enabled here. */
    public static function fromCode(string $code): ?self
    {
        foreach (self::supported() as $locale) {
            if ($locale->code() === $code) {
                return $locale;
            }
        }

        return null;
    }

    /**
     * The supported set, shaped for `page.props.config.locales`.
     *
     * @return list<array{value: string, code: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(fn (self $locale): array => [
            'value' => $locale->value,
            'code' => $locale->code(),
            'label' => $locale->label(),
        ], self::supported());
    }
}
