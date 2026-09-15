<?php

namespace App\Http\Controllers;

use App\Enums\Locale;
use App\Http\Middleware\EdgeCacheGuestPage;
use App\Services\WebsitePages;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Serves the CMS-driven top-level pages: `/` plus every single-segment path the
 * GD CMS declares (`/locations` — or whatever the CMS renames it to).
 *
 * The URL segment is resolved to a page record per request (see WebsitePages), so a
 * CMS slug rename takes effect within the SWR window with no deploy. What still
 * requires a deploy is a genuinely NEW page: it needs a Vue component and an entry
 * in COMPONENTS below — only renames are code-free.
 */
class WebsitePageController extends Controller
{
    /**
     * Logical page key => Inertia page component.
     *
     * `homepage` is deliberately absent: the homepage's canonical URL is `/`
     * (home() below), so its slug must not ALSO serve it at `/homepage`.
     */
    private const COMPONENTS = [
        'about' => 'About',
        'menu' => 'Menu',
        'order' => 'Order',
        'catering' => 'Catering',
        'book' => 'Book',
        'locations' => 'Locations',
        'our-work' => 'OurWork',
        'blog' => 'Blog',
        'franchise' => 'Franchise',
        'contact' => 'Contact',
        'faq' => 'Faq',
    ];

    public function __construct(private readonly WebsitePages $pages)
    {
    }

    /**
     * The homepage. Its slug names its CMS content, not its URL — passed as a prop
     * so Home.vue fetches whatever the CMS currently calls it.
     */
    public function home(): Response
    {
        $page = $this->pages->findByKey('homepage', $this->locale());

        return Inertia::render('Home', [
            'slug' => $page['slug'] ?? WebsitePages::FALLBACK['homepage'],
        ]);
    }

    /** A top-level CMS page by its current URL segment in the request's locale. */
    public function show(Request $request, string $page): Response
    {
        $record = $this->pages->findBySlug($page, $this->locale());

        abort_if($record === null, 404);

        $component = self::COMPONENTS[$record['key']] ?? null;

        if ($component === null) {
            // A CMS page with no component yet (e.g. a freshly-added `catering`).
            // Noticed, not reported: it's a content-team signal, not an app error.
            Log::notice('Website page has no Vue component mapped; served 404.', [
                'key' => $record['key'],
                'slug' => $record['slug'],
            ]);

            abort(404);
        }

        // Purge keys must name the logical page, not the route name (`page`) or the
        // renamable slug — see EdgeCacheGuestPage::LOGICAL_NAME_ATTRIBUTE. Forgetting
        // the parameter keeps the slug out of the per-parameter keys too.
        $request->attributes->set(EdgeCacheGuestPage::LOGICAL_NAME_ATTRIBUTE, $record['key']);
        $request->route()?->forgetParameter('page');

        return Inertia::render($component, [
            'slug' => $record['slug'],
        ]);
    }

    private function locale(): Locale
    {
        return Locale::tryFrom(app()->getLocale()) ?? Locale::default();
    }
}
