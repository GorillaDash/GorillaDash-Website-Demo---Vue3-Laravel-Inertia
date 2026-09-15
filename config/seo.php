<?php

return [

    /*
    |--------------------------------------------------------------------------
    | robots.txt
    |--------------------------------------------------------------------------
    |
    | Served by App\Http\Controllers\RobotsController (routes/web.php), not as a
    | static public/robots.txt: one Docker image serves every country (see
    | deploy/k8s/overlays), so the contents can only be decided at runtime. Set
    | these per deployment in deploy/k8s/overlays/<country>/config.env.
    |
    */

    'robots' => [

        // Whether crawlers may index this deployment. Defaults to false so a new
        // host is un-indexable until someone opts in — a staging domain can never
        // be crawled by forgetting to set this, only by setting it wrong.
        'indexable' => (bool) env('ROBOTS_INDEXABLE', false),

        // Crawlers let in regardless of `indexable` — an SEO auditor pointed at a
        // staging host, typically. Each gets its OWN group in robots.txt, and a
        // crawler obeys exactly one group: the most specific match for its token
        // (RFC 9309 2.2.1). So a named bot reads its `Allow: /` and never sees the
        // blanket `Disallow: /` in the `User-agent: *` group. Comma-separated, to
        // fit a ConfigMap value: e.g. "SiteAuditBot,AhrefsSiteAudit".
        'allowed_bots' => array_values(array_filter(
            array_map(trim(...), explode(',', (string) env('ROBOTS_ALLOWED_BOTS', ''))),
            fn (string $token) => $token !== '',
        )),

        // Absolute URL, emitted as a `Sitemap:` line when set. Nothing serves a
        // sitemap yet; leave blank until one exists.
        'sitemap' => env('ROBOTS_SITEMAP'),

    ],

];
