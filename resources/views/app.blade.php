<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"  @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- No `crossorigin`: this host serves only <img>/favicon fetches, which use
             the default (credentialed) connection pool. A crossorigin preconnect warms
             the CORS pool instead — nothing here uses it, so the LCP hero image was
             paying full DNS+TCP+TLS setup despite the hint. --}}
        <link rel="preconnect" href="https://cdn.gorilladash.com">
        {{-- TODO: favicon.png not yet available on the CDN (path 404s). Restore these
             once the image file is uploaded to images/logos/favicon.png. --}}
        {{-- <link rel="apple-touch-icon" href="https://cdn.gorilladash.com/static/clients/juniperTable_/images/logos/favicon.png">
        <link rel="apple-touch-icon" sizes="128x128" href="https://cdn.gorilladash.com/static/clients/juniperTable_/images/logos/favicon.png">
        <link rel="icon" type="image/png" href="https://cdn.gorilladash.com/static/clients/juniperTable_/images/logos/favicon.png">
        <link rel="icon" sizes="192x192" type="image/png" href="https://cdn.gorilladash.com/static/clients/juniperTable_/images/logos/favicon.png">
        <link rel="shortcut icon" href="https://cdn.gorilladash.com/static/clients/juniperTable_/images/logos/favicon.png"> --}}
        <meta name="msapplication-TileColor" content="#FFFFFF">
        {{-- <meta name="msapplication-TileImage" content="https://cdn.gorilladash.com/static/clients/juniperTable_/images/logos/favicon.png"> --}}
        <meta name="theme-color" content="#064d7b">

        @fonts

        @vite(['resources/css/app.css', 'resources/ts/app.ts', "resources/ts/pages/{$page['component']}.vue"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
