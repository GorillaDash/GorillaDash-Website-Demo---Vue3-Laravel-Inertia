<?php

namespace App\Http\Controllers;

use App\Services\BoundLocation;
use Inertia\Inertia;
use Inertia\Response;

class LocationController extends Controller
{
    /**
     * The location detail page. The slug is passed as a prop for the page's
     * <Head>/SSR identity. Binding the store to the session happens after mount
     * via the beacon (POST /bound-location) — not here — so this GET stays a pure
     * read that the edge can cache (see EdgeCacheGuestPage).
     *
     * A definitive miss (no such store) is a 404; a lookup failure is tolerated
     * so an API hiccup doesn't block the page.
     */
    public function show(string $slug, BoundLocation $boundLocation): Response
    {
        $office = rescue(fn () => $boundLocation->find($slug), false, report: false);

        abort_if($office === null, 404);

        return Inertia::render('LocationDetail', [
            'slug' => $slug,
        ]);
    }
}
