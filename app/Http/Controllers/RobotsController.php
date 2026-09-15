<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;

class RobotsController extends Controller
{
    /**
     * Serve robots.txt from config instead of a file in public/.
     *
     * The same image is deployed to every country, so a baked-in file cannot say
     * different things per host — and it must: a staging domain has to stay out
     * of the index while a live one has to be in it. config/seo.php reads the
     * answer from each deployment's config.env, like the other per-country
     * runtime values.
     */
    public function __invoke(): Response
    {
        // Named bots first, each in its own group. A crawler obeys the single most
        // specific group matching its token and ignores every other one, so these
        // are exemptions from the catch-all below rather than additions to it.
        $groups = array_map(
            fn (string $bot) => ['User-agent: '.$bot, 'Allow: /'],
            (array) config('seo.robots.allowed_bots'),
        );

        $groups[] = config('seo.robots.indexable')
            ? ['User-agent: *', 'Allow: /']
            : ['User-agent: *', 'Disallow: /'];

        $body = implode("\n\n", array_map(
            fn (array $lines) => implode("\n", $lines),
            $groups,
        ));

        // Not part of any group: `Sitemap` is a global directive, so it sits on its
        // own at the end rather than inside whichever group happens to be last.
        $sitemap = config('seo.robots.sitemap');

        if (is_string($sitemap) && $sitemap !== '') {
            $body .= "\n\nSitemap: ".$sitemap;
        }

        return response($body."\n")
            ->header('Content-Type', 'text/plain; charset=UTF-8');
    }
}
