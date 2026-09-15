<?php

namespace App\Services;

use RuntimeException;

/**
 * Composes the repository `.env` for one country, so a local dev session can be
 * pointed at any deployment's site without hand-editing env files.
 *
 * Three layers, lowest precedence first:
 *
 *  1. `.env.local.shared` — every local-only value that is the same whichever
 *     country you are working on (APP_ENV, APP_KEY, local DB credentials, mail,
 *     Octane, `INERTIA_SSR_ENABLED=false`).
 *  2. `deploy/k8s/overlays/<country>/config.env`, filtered through
 *     {@see self::IDENTITY_REQUIRED} + {@see self::IDENTITY_OPTIONAL}. This is an
 *     allowlist and NOT a merge on purpose: the rest of that file describes how
 *     the country is *deployed* — production `APP_URL`, `SESSION_SECURE_COOKIE`,
 *     the Cloud SQL instance, the SSR sidecar, `LOG_CHANNEL=stderr` — and every
 *     one of those breaks or silently misleads a local machine.
 *  3. `.env.local.<country>` — the per-country values that are still wrong
 *     locally even inside the allowlist (the Herd host, the local database) plus
 *     the per-country secrets that must never sit in the tracked overlay.
 */
class CountryEnv
{
    /**
     * Overlay keys that define *which site this is*. A country whose overlay is
     * missing any of these cannot produce a usable local env: `COUNTRY` would
     * fall back to `US` and `GD_WEBSITE_ID` to null, which is a site quietly
     * serving another country's content rather than an error.
     *
     * @var list<string>
     */
    public const IDENTITY_REQUIRED = [
        'APP_NAME',
        'APP_TIMEZONE',
        'APP_LOCALE',
        'APP_LOCALES',
        'COUNTRY',
        'GD_ORG_ID',
        'GD_WEBSITE_ID',
        'GD_WEBSITE_CLIENT_ID',
        'GD_WEBSITE_CLIENT_SECRET',
    ];

    /**
     * Also pulled from the overlay, but a local session degrades rather than
     * breaks without them — an unset map key renders a blank map, an unset
     * Tolgee CDN falls back to the source strings.
     *
     * @var list<string>
     */
    public const IDENTITY_OPTIONAL = [
        'GOOGLE_MAP_API_KEY',
        'GOOGLE_MAP_ID',
        'TOLGEE_CDN_URL',
        'TOLGEE_API_URL',
        'TOLGEE_API_KEY',
        'RECAPTCHA_SITE_KEY',
        'CLOUDFLARE_ZONE_ID',
        'CLOUDFLARE_HOSTS',
        'ROBOTS_INDEXABLE',
        'ROBOTS_ALLOWED_BOTS',
    ];

    /**
     * Keys layer 3 must supply, because the overlay's answer is a production one
     * and no sensible default exists for a developer's machine.
     *
     * @var list<string>
     */
    public const LOCAL_REQUIRED = [
        'APP_URL',
        'DB_DATABASE',
    ];

    public function __construct(private readonly string $root)
    {
    }

    /**
     * The countries that can be switched to: an overlay directory is a country
     * when it carries a `config.env`. That filter is also what keeps variant
     * overlays such as `usa-cache` — a Secret only — out of the list.
     *
     * @return list<string>
     */
    public function countries(): array
    {
        $countries = array_map(
            fn (string $path): string => basename(dirname($path)),
            glob($this->root.'/deploy/k8s/overlays/*/config.env') ?: []
        );

        sort($countries);

        return array_values($countries);
    }

    /**
     * The country the current `.env` was generated for, read from the marker
     * this class writes into its header. Null when `.env` is absent or was
     * written by hand.
     */
    public function currentCountry(): ?string
    {
        $env = $this->root.'/.env';

        if (! is_file($env)) {
            return null;
        }

        return preg_match('/^#\s*env:use\s+country=(\S+)/m', (string) file_get_contents($env), $matches) === 1
            ? $matches[1]
            : null;
    }

    public function overlayPath(string $country): string
    {
        return $this->root."/deploy/k8s/overlays/{$country}/config.env";
    }

    public function sharedPath(): string
    {
        return $this->root.'/.env.local.shared';
    }

    public function countryPath(string $country): string
    {
        return $this->root."/.env.local.{$country}";
    }

    /**
     * Create a layer file from its tracked `.example` template when it does not
     * exist yet. Returns the path when one was created, null when it was already
     * there, and throws when there is no template to copy.
     */
    public function ensureLayer(string $path): ?string
    {
        if (is_file($path)) {
            return null;
        }

        $example = $path.'.example';

        if (! is_file($example)) {
            throw new RuntimeException(
                basename($path).' does not exist and there is no '.basename($example).' to copy from.'
            );
        }

        copy($example, $path);

        return $path;
    }

    /**
     * Merge the three layers into the body of a `.env`.
     *
     * @return array{
     *     body: string,
     *     values: array<string, string>,
     *     missingIdentity: list<string>,
     *     missingLocal: list<string>,
     *     absent: list<string>,
     *     carriedAppKey: bool,
     * }
     */
    public function compose(string $country): array
    {
        $overlay = $this->parse($this->overlayPath($country));
        $shared = $this->parse($this->sharedPath());
        $local = $this->parse($this->countryPath($country));

        $missingIdentity = array_values(array_filter(
            self::IDENTITY_REQUIRED,
            fn (string $key): bool => ! array_key_exists($key, $overlay) && ! array_key_exists($key, $local)
        ));

        $missingLocal = array_values(array_filter(
            self::LOCAL_REQUIRED,
            fn (string $key): bool => ! array_key_exists($key, $local)
        ));

        $identity = array_intersect_key(
            $overlay,
            array_flip([...self::IDENTITY_REQUIRED, ...self::IDENTITY_OPTIONAL])
        );

        $absent = array_values(array_filter(
            self::IDENTITY_OPTIONAL,
            fn (string $key): bool => ! array_key_exists($key, $overlay) && ! array_key_exists($key, $local)
        ));

        // A regenerated APP_KEY would invalidate every session and every
        // encrypted column, so an existing one outlives the switch. Layer 1 is
        // where it belongs; this only covers the checkout that has not put it
        // there yet.
        $carriedAppKey = false;

        if (($shared['APP_KEY'] ?? '') === '') {
            $previous = $this->parse($this->root.'/.env')['APP_KEY'] ?? '';

            if ($previous !== '') {
                $shared['APP_KEY'] = $previous;
                $carriedAppKey = true;
            }
        }

        return [
            'body' => $this->render($country, $identity, $shared, $local),
            'values' => [...$shared, ...$identity, ...$local],
            'missingIdentity' => $missingIdentity,
            'missingLocal' => $missingLocal,
            'absent' => $absent,
            'carriedAppKey' => $carriedAppKey,
        ];
    }

    /**
     * What composing this country would change in the current `.env`.
     *
     * @param  array<string, string>  $values
     * @return array{added: list<string>, changed: list<string>, removed: list<string>}
     */
    public function diff(array $values): array
    {
        $current = $this->parse($this->root.'/.env');

        return [
            'added' => array_values(array_diff(array_keys($values), array_keys($current))),
            'changed' => array_values(array_filter(
                array_keys($values),
                fn (string $key): bool => array_key_exists($key, $current) && $current[$key] !== $values[$key]
            )),
            'removed' => array_values(array_diff(array_keys($current), array_keys($values))),
        ];
    }

    /**
     * Write the composed body to `.env`, backing up the outgoing file first.
     * Returns the backup path, or null when there was no `.env` to keep.
     */
    public function write(string $body): ?string
    {
        $env = $this->root.'/.env';
        $backup = null;

        if (is_file($env)) {
            $backup = $this->root.'/.env.backup';
            copy($env, $backup);
        }

        file_put_contents($env, $body);

        return $backup;
    }

    /**
     * @param  array<string, string>  $identity
     * @param  array<string, string>  $shared
     * @param  array<string, string>  $local
     */
    private function render(string $country, array $identity, array $shared, array $local): string
    {
        // Later layers win, so a key appears exactly once — in the section of
        // the layer that supplied the surviving value.
        $sections = [
            [
                "2  country identity — deploy/k8s/overlays/{$country}/config.env",
                array_diff_key($identity, $local),
            ],
            [
                '1  local defaults — .env.local.shared',
                array_diff_key($shared, $identity, $local),
            ],
            [
                "3  local overrides — .env.local.{$country}",
                $local,
            ],
        ];

        $layers = [
            ['1', '.env.local.shared', 'local defaults, every country'],
            ['2', "deploy/k8s/overlays/{$country}/config.env", 'country identity (allowlisted)'],
            ['3', ".env.local.{$country}", 'local per-country overrides'],
        ];

        $width = max(array_map(fn (array $layer): int => strlen($layer[1]), $layers));

        $index = implode("\n", array_map(
            fn (array $layer): string => sprintf('#   %s  %s   %s', $layer[0], str_pad($layer[1], $width), $layer[2]),
            $layers,
        ));

        $out = <<<HEADER
            # ════════════════════════════════════════════════════════════════════════
            # GENERATED FILE — do not edit by hand; the next country switch wipes it.
            # env:use country={$country}
            #
            # Written by `php artisan env:use {$country}`. Edit a layer and re-run:
            {$index}
            #
            # Sections are emitted identity-first so a \${VAR} reference in a later
            # section can resolve a country value such as APP_NAME. The outgoing .env
            # was copied to .env.backup.
            # ════════════════════════════════════════════════════════════════════════

            HEADER;

        foreach ($sections as [$title, $values]) {
            if ($values === []) {
                continue;
            }

            $out .= "\n# ── {$title} ──\n";

            foreach ($values as $key => $value) {
                $out .= "{$key}={$value}\n";
            }
        }

        return $out;
    }

    /**
     * Read an env-shaped file into raw KEY => value pairs, values kept verbatim
     * so quoting and `${VAR}` references round-trip untouched. Deliberately as
     * simple as deploy.sh's own reader: no `export` prefixes and no multi-line
     * quoted values, neither of which this repo's env files use.
     *
     * @return array<string, string>
     */
    private function parse(string $path): array
    {
        if (! is_file($path)) {
            return [];
        }

        $values = [];

        foreach (file($path, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
            if (preg_match('/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/', $line, $matches) === 1) {
                $values[$matches[1]] = rtrim($matches[2]);
            }
        }

        return $values;
    }
}
