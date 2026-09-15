<?php

use App\Services\CountryEnv;

/**
 * CountryEnv is pure filesystem work over a root it is handed, so these run
 * against a temp directory shaped like the repo — never the real .env.
 */
beforeEach(function () {
    $this->root = sys_get_temp_dir().'/country-env-'.bin2hex(random_bytes(6));

    mkdir($this->root.'/deploy/k8s/overlays/usa', recursive: true);
    mkdir($this->root.'/deploy/k8s/overlays/au', recursive: true);

    // A variant overlay carrying only a Secret, like usa-cache: not a country.
    mkdir($this->root.'/deploy/k8s/overlays/usa-cache', recursive: true);
    file_put_contents($this->root.'/deploy/k8s/overlays/usa-cache/secret.yaml', "kind: Secret\n");
});

afterEach(function () {
    exec('rm -rf '.escapeshellarg($this->root));
});

function writeOverlay(string $root, string $country, array $extra = []): void
{
    $identity = [
        'APP_NAME' => "'Hungry Gorilla ".strtoupper($country)."'",
        'APP_TIMEZONE' => 'America/New_York',
        'APP_LOCALE' => 'en',
        'APP_LOCALES' => 'en-US',
        'COUNTRY' => 'US',
        'GD_ORG_ID' => '74',
        'GD_WEBSITE_ID' => '82',
        'GD_WEBSITE_CLIENT_ID' => '81',
        'GD_WEBSITE_CLIENT_SECRET' => 'shhh',
        'TOLGEE_CDN_URL' => 'https://localization.example.com/abc',
        'GOOGLE_MAP_API_KEY' => 'maps-key',
        'RECAPTCHA_SITE_KEY' => 'site-key',
    ];

    // The deployment half of the same file, none of which may reach a local .env.
    $deployment = [
        'APP_ENV' => 'production',
        'APP_DEBUG' => 'false',
        'APP_URL' => 'https://tgg-usa.example.com',
        'APP_FORCE_HTTPS' => 'true',
        'LOG_CHANNEL' => 'stderr',
        'SESSION_SECURE_COOKIE' => 'true',
        'INERTIA_SSR_ENABLED' => 'true',
        'DB_DATABASE' => 'hungry_gorilla_usa_k8s',
        'CLOUD_SQL_INSTANCE' => 'project:region:instance',
    ];

    $lines = ['# a comment', ''];

    foreach ([...$identity, ...$deployment, ...$extra] as $key => $value) {
        $lines[] = "{$key}={$value}";
    }

    file_put_contents($root."/deploy/k8s/overlays/{$country}/config.env", implode("\n", $lines)."\n");
}

function writeLayers(string $root, string $country, array $shared = [], array $local = []): void
{
    $shared = [
        'APP_ENV' => 'local',
        'APP_DEBUG' => 'true',
        'APP_KEY' => 'base64:sharedkey',
        'SESSION_SECURE_COOKIE' => 'false',
        'INERTIA_SSR_ENABLED' => 'false',
        'MAIL_FROM_NAME' => '"${APP_NAME}"',
        ...$shared,
    ];

    $local = [
        'APP_URL' => "http://hungry-gorilla-{$country}.test",
        'DB_DATABASE' => "hungryGorilla_{$country}",
        ...$local,
    ];

    $render = fn (array $values): string => implode('', array_map(
        fn (string $key, string $value): string => "{$key}={$value}\n",
        array_keys($values),
        $values,
    ));

    file_put_contents($root.'/.env.local.shared', $render($shared));
    file_put_contents($root."/.env.local.{$country}", $render($local));
}

it('lists only overlay directories that carry a config.env', function () {
    writeOverlay($this->root, 'usa');
    writeOverlay($this->root, 'au');

    expect((new CountryEnv($this->root))->countries())->toBe(['au', 'usa']);
});

it('keeps every deployment-only key out of the composed env', function () {
    writeOverlay($this->root, 'usa');
    writeLayers($this->root, 'usa');

    $values = (new CountryEnv($this->root))->compose('usa')['values'];

    // Taken from the overlay, because they say which site this is.
    expect($values)
        ->toHaveKey('COUNTRY', 'US')
        ->toHaveKey('GD_WEBSITE_ID', '82')
        ->toHaveKey('TOLGEE_CDN_URL', 'https://localization.example.com/abc');

    // Never taken from the overlay: these describe the deployment and would
    // variously point local dev at production, drop the session cookie on http,
    // and hide every error.
    expect($values)
        ->toHaveKey('APP_ENV', 'local')
        ->toHaveKey('APP_DEBUG', 'true')
        ->toHaveKey('SESSION_SECURE_COOKIE', 'false')
        ->toHaveKey('INERTIA_SSR_ENABLED', 'false')
        ->toHaveKey('APP_URL', 'http://hungry-gorilla-usa.test')
        ->toHaveKey('DB_DATABASE', 'hungryGorilla_usa')
        ->not->toHaveKey('CLOUD_SQL_INSTANCE')
        ->not->toHaveKey('APP_FORCE_HTTPS')
        ->not->toHaveKey('LOG_CHANNEL');
});

it('lets each layer override the one below it', function () {
    writeOverlay($this->root, 'usa');
    writeLayers(
        $this->root,
        'usa',
        shared: ['TOLGEE_API_KEY' => 'from-shared'],
        local: ['TOLGEE_API_KEY' => 'from-country', 'GD_WEBSITE_ID' => '999'],
    );

    $values = (new CountryEnv($this->root))->compose('usa')['values'];

    expect($values)
        ->toHaveKey('TOLGEE_API_KEY', 'from-country')
        ->toHaveKey('GD_WEBSITE_ID', '999');
});

it('reports an overlay missing a key the site cannot run without', function () {
    writeOverlay($this->root, 'au');
    writeLayers($this->root, 'au');

    // The shape of today's AU overlay: no site identifiers at all.
    $path = $this->root.'/deploy/k8s/overlays/au/config.env';
    file_put_contents($path, preg_replace(
        '/^(COUNTRY|GD_ORG_ID|GD_WEBSITE_ID)=.*$\n/m',
        '',
        (string) file_get_contents($path)
    ));

    $plan = (new CountryEnv($this->root))->compose('au');

    expect($plan['missingIdentity'])->toBe(['COUNTRY', 'GD_ORG_ID', 'GD_WEBSITE_ID']);
});

it('reports a country layer missing a key with no safe local default', function () {
    writeOverlay($this->root, 'usa');
    writeLayers($this->root, 'usa');
    file_put_contents($this->root.'/.env.local.usa', "RECAPTCHA_SECRET_KEY=x\n");

    $plan = (new CountryEnv($this->root))->compose('usa');

    expect($plan['missingLocal'])->toBe(['APP_URL', 'DB_DATABASE']);
});

it('names the optional overlay keys a country has not set', function () {
    writeOverlay($this->root, 'au');
    writeLayers($this->root, 'au');

    $plan = (new CountryEnv($this->root))->compose('au');

    expect($plan['missingIdentity'])->toBe([])
        ->and($plan['absent'])->toContain('GOOGLE_MAP_ID', 'CLOUDFLARE_ZONE_ID')
        ->and($plan['absent'])->not->toContain('GOOGLE_MAP_API_KEY');
});

it('writes values verbatim so quoting and ${VAR} references survive', function () {
    writeOverlay($this->root, 'usa');
    writeLayers($this->root, 'usa');

    $body = (new CountryEnv($this->root))->compose('usa')['body'];

    expect($body)
        ->toContain("APP_NAME='Hungry Gorilla USA'")
        ->toContain('MAIL_FROM_NAME="${APP_NAME}"');
});

it('emits the country section first so a later ${VAR} can resolve it', function () {
    writeOverlay($this->root, 'usa');
    writeLayers($this->root, 'usa');

    $body = (new CountryEnv($this->root))->compose('usa')['body'];

    expect(strpos($body, 'APP_NAME='))->toBeLessThan(strpos($body, 'MAIL_FROM_NAME='));
});

it('carries an existing APP_KEY across the switch when the shared layer has none', function () {
    writeOverlay($this->root, 'usa');
    writeLayers($this->root, 'usa', shared: ['APP_KEY' => '']);
    file_put_contents($this->root.'/.env', "APP_KEY=base64:theonefromthelastswitch\n");

    $plan = (new CountryEnv($this->root))->compose('usa');

    expect($plan['carriedAppKey'])->toBeTrue()
        ->and($plan['values']['APP_KEY'])->toBe('base64:theonefromthelastswitch');
});

it('prefers the shared layer APP_KEY over the outgoing one', function () {
    writeOverlay($this->root, 'usa');
    writeLayers($this->root, 'usa');
    file_put_contents($this->root.'/.env', "APP_KEY=base64:stale\n");

    $plan = (new CountryEnv($this->root))->compose('usa');

    expect($plan['carriedAppKey'])->toBeFalse()
        ->and($plan['values']['APP_KEY'])->toBe('base64:sharedkey');
});

it('backs up the outgoing .env and marks the new one with its country', function () {
    writeOverlay($this->root, 'usa');
    writeLayers($this->root, 'usa');
    file_put_contents($this->root.'/.env', "APP_KEY=base64:previous\n");

    $env = new CountryEnv($this->root);
    $backup = $env->write($env->compose('usa')['body']);

    expect($backup)->toBe($this->root.'/.env.backup')
        ->and(file_get_contents((string) $backup))->toBe("APP_KEY=base64:previous\n")
        ->and($env->currentCountry())->toBe('usa');
});

it('has no country for a .env it did not write', function () {
    file_put_contents($this->root.'/.env', "APP_ENV=local\n");

    expect((new CountryEnv($this->root))->currentCountry())->toBeNull();
});

it('creates a missing layer from its example and refuses without one', function () {
    $env = new CountryEnv($this->root);

    file_put_contents($this->root.'/.env.local.shared.example', "APP_ENV=local\n");

    expect($env->ensureLayer($env->sharedPath()))->toBe($this->root.'/.env.local.shared')
        ->and($env->ensureLayer($env->sharedPath()))->toBeNull();

    expect(fn () => $env->ensureLayer($env->countryPath('au')))
        ->toThrow(RuntimeException::class, '.env.local.au does not exist');
});
