<?php

/*
|--------------------------------------------------------------------------
| Supported Locales
|--------------------------------------------------------------------------
|
| The locales this deployment serves, as a comma-separated list of
| App\Enums\Locale values in the country's config.env — e.g.
| `APP_LOCALES=en-US,ja-JP`. The FIRST entry is the default: the locale served
| when a URL carries no locale segment.
|
| Exactly one entry (today's case for every country) means the deployment is
| monolingual: routes register with no `/{locale}` prefix, localizedUrl() is a
| no-op on the frontend, and no language switcher renders. Nothing about the
| existing single-language sites changes until a second locale is listed here.
|
| This is deliberately not `APP_LOCALE` (config/app.php): that one still drives
| Laravel's own `lang/` lookups and stays a plain `en`, while these are Tolgee
| language tags. AppServiceProvider validates the list at boot, so a typo in a
| config.env fails loudly instead of silently dropping a language.
|
*/

$supported = array_values(array_filter(array_map(
    trim(...),
    explode(',', (string) env('APP_LOCALES', 'en-US'))
)));

return [

    'supported' => $supported,

    'default' => $supported[0] ?? 'en-US',

];
