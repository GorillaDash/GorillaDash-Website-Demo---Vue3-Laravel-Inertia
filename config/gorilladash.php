<?php

return [
    // Public, per-country values shared to the browser via Inertia
    // (HandleInertiaRequests → page.props.config, read in resources/ts/runtimeConfig).
    // Runtime — set in each country's config.env, no rebuild.
    'web' => [
        'org_id' => env('GD_ORG_ID'),
        'website_id' => env('GD_WEBSITE_ID'),
        'country' => env('COUNTRY', 'US'),
    ],
];
