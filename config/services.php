<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Google Maps browser JS API key. Shared to the frontend at runtime via
    // HandleInertiaRequests (per-country, from each deployment's config.env) —
    // NOT a build-time VITE_ var, so a single image can serve every country.
    'google_maps' => [
        'key' => env('GOOGLE_MAP_API_KEY'),
        // Required by AdvancedMarkerElement. When unset the frontend falls back to
        // Google's DEMO_MAP_ID so markers still render (see resources/ts/components/google/GoogleMap.vue).
        'map_id' => env('GOOGLE_MAP_ID'),
    ],

    // reCAPTCHA v3, for whatever public form a client site grows. Nothing in the
    // starter reads these — they are here so the PLACEMENT is decided once:
    //
    // The site key is per-DOMAIN, so it is a runtime value a country's config.env
    // supplies and HandleInertiaRequests shares with the browser, exactly like the
    // Google Maps key. It must NOT become a build-time `VITE_RECAPTCHA_SITE_KEY`
    // (what most Laravel examples use): one image serves every country, so a baked-in
    // key is wrong for all but the country that happened to build it.
    //
    // The secret is a credential: k8s Secret, never the ConfigMap, and never shared
    // to the browser through the `config` prop.
    'recaptcha' => [
        'site_key' => env('RECAPTCHA_SITE_KEY'),
        'secret' => env('RECAPTCHA_SECRET_KEY'),
        // Below this Google thinks the submitter is a bot. 0.5 is Google's default.
        'score_threshold' => (float) env('RECAPTCHA_SCORE_THRESHOLD', 0.5),
    ],

    'tolgee' => [
        'api_url' => env('TOLGEE_API_URL'),
        'api_key' => env('TOLGEE_API_KEY'),
        'cdn_url' => env('TOLGEE_CDN_URL'),
    ],

    // Cloudflare edge cache in front of this deployment. Used to purge cached HTML
    // by Cache-Tag (e.g. on CMS publish — see App\Http\EdgeCacheGrant for the
    // header that stamps them); deploy/cloudflare/apply-rules.sh reads the token to
    // push the cache rules. A purge names the zone, not a service. Note there is no
    // soft purge here: Cloudflare evicts rather than revalidating, so a broad purge
    // sends the next request for every affected page back to origin at once.
    // Production canonical copy lives in Secret Manager, like the other credentials.
    'cloudflare' => [
        'key' => env('CLOUDFLARE_API_TOKEN'),
        'zone_id' => env('CLOUDFLARE_ZONE_ID'),
    ],

];
