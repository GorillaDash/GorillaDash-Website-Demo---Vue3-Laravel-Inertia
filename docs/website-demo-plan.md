# Gorilla Dash Website Demo — plan

**Goal.** A demo franchise website we can put in front of prospects at trade shows. It shows how
Gorilla Dash structures a franchise website: a national brand site, a page for every tribe, online
ordering, blog, Our Work, appointment booking and a franchise sales page. All content comes from the
Gorilla Dash GraphQL API. Nothing is hard-coded in the site.

**Status (15 September 2026).**

- The repository `GorillaDash/WebsiteDemo-inertiajs` has been created from `gd-client-inertia-starter`, with the placeholder brand renamed.
- The Gorilla Dash seeding command is written and has been run on the local database only.
- Production has not been touched.
- The design decision below needs a yes before any page is built.

A **tribe** is one location inside a franchise organisation. This document uses that word for the
demo brand's cafés, because that is what a prospect will see in the Gorilla Dash admin.

---

## 1. What the reference sites taught us

Five live or staging sites were reviewed: signarama.com, fullypromoted.com, grazecraze.com,
The Great Greek staging (tgg-usa.gorillastaging.com) and Black Optix Tint staging
(botx-us.gorilladashstaging.com).

| Pattern | Seen on | Take into the demo |
|---|---|---|
| Franchise banner above the header ("Own your own franchise") and an "Own a franchise" block in the footer | Signarama, Fully Promoted, Graze Craze | Yes. It shows that franchise sales sit on every page. |
| Store finder that searches first: postcode, city or "use my location", then a state list | Fully Promoted, Great Greek, Black Optix Tint | Yes. Search, then grouped by state, then "Set as my tribe". |
| Tribe micro-site that mirrors the national site under `/locations/{tribe}/…`, with its own About, Our Work, Team, Reviews and Contact pages | Signarama | Yes. This is the strongest single argument for Gorilla Dash, so the demo makes it obvious. |
| Tribe cards showing opening hours today, rating and review count, with Book, Quote and Shop page buttons | Black Optix Tint | Yes. It is the cleanest version of the finder. |
| National stats band (number of tribes, states, review score) | Black Optix Tint | Yes, calculated live from the `tribes` and `reviews` queries. |
| Menu with categories, featured dishes and an item page with pairings and JSON-LD | Great Greek | Yes, but with a working cart. Great Greek hands off to Toast, so its "Add to Bag" button goes nowhere. |
| Our Work posts as cards, each with its own page | Fully Promoted (national), Signarama (per tribe) | Yes, at both national and tribe level. |
| Blog with categories and an author line for each tribe | Signarama | Yes. |
| Multi-step booking wizard (service, then shop, then time, then details) | Black Optix Tint | Yes. This becomes the appointment stepper. |

**Things to avoid.**

- Signarama's home page is long and repeats the industry grid twice.
- Graze Craze uses a carousel for its main message.
- Fully Promoted's finder shows an empty page until the visitor types something.

A trade-show visitor gives the site about ten seconds, so every page leads with one clear action.

---

## 2. The fictional brand

**Working name: Juniper Table**, a seasonal café and catering franchise. The name is a placeholder.
Before anything is printed, check it against USPTO and a web search, then rename it with
`bin/new-client.sh` and the brand constant in the seeding command.

A café and catering brand is the only kind of franchise that genuinely needs every feature on your
list at once:

| Feature | Why a café and catering brand needs it |
|---|---|
| Online ordering | Breakfast, bowls, sandwiches and coffee for pickup, plus catering boards ordered ahead |
| Our Work | Events the tribes have catered: weddings, office lunches, launches |
| Appointment stepper | Book a catering consultation or a tasting |
| Franchise sales | Investment range, territories open, steps to own a Juniper Table |
| Tribe pages | Ten tribes: eight open and two marked Opening Soon, so the franchise page can show growth |

Prospects who are not in food (sign, print, auto and services brands) still recognise the structure.
Section 3 explains how the demo shows that directly.

---

## 3. Design: wireframe or fully designed?

**Recommendation: fully designed, built on a small design system instead of a bespoke brand, plus a
"Structure view" switch.**

A wireframe is the wrong choice for a trade show, for three reasons:

- Visitors compare the demo with their own live site in seconds. Grey boxes read as "unfinished", and the first question becomes "can it look good?" instead of "how does it work?".
- The sites we already run (Black Optix Tint and Great Greek) set the bar. The demo has to look at least that finished.
- The extra cost is small. The starter already ships the layout, SEO, finder, map and data layer. The visual layer is mostly tokens and a dozen section components.

A wireframe does leave one thing out that you need: showing *how the site is structured*. Instead of
giving up polish, we add that as a feature:

- **Structure view toggle** (a floating button, and the `S` key). When it is on, every section gets an outline and a label saying three things: the Gorilla Dash module it comes from, the GraphQL query that feeds it, and where a franchisor edits it. For example: "Tribe page · `tribe(slug)` · Tribes › Sydney › Page Content". This is the conversation starter at the stand.
- **Theme switcher** with three looks (café, trade/service, retail) that change only colours, type and imagery. The same pages and data re-skin live, which answers "would this work for *my* brand?" without a second demo.

**Suggested process.**

1. One day on a page-flow wireframe of the six key templates, for sign-off on structure only: Home, Tribe Finder, Tribe Page, Menu Item, Franchise and the Booking Stepper.
2. Design directly in code on the Tailwind tokens. Skip a full Figma pass unless marketing wants one for print.

---

## 4. Sitemap and data sources

Every row is one Inertia page in `resources/ts/pages/`. "Query" is the Gorilla Dash GraphQL
operation that feeds the page.

| URL | Page | Query | Gorilla Dash module |
|---|---|---|---|
| `/` | Home: hero, stats band, featured menu, Our Work strip, finder, reviews, franchise banner | `websitePage`, `tribes`, `foodMenu`, `organisationOurWorks(featured)`, `reviews(featured)` | Website, Tribes, Food, Our Work, Reviews |
| `/about` | Brand story | `websitePage` | Website |
| `/menu` | Online ordering index: categories, featured items, "order from" tribe picker | `foodMenu(name)`, `foodStoreSetting` | Food |
| `/menu/{section}/{item}` | Menu item: modifiers, price at the bound tribe, pairings, add to cart | `foodMenuListItem`, `addFoodMenuItemToShoppingCart` | Food |
| `/order` | Cart and checkout: pickup or delivery, time slot, customer details | `foodShoppingCart`, `foodTribeAvailableTime`, `submitFoodShoppingCart` | Food ordering |
| `/catering` | Catering landing page: boards, boxed lunches, and a "Book a consultation" button that opens the stepper | `websitePage`, `foodMenu("Catering Menu")` | Website, Food |
| `/book` | **Appointment stepper**: what you want, then where you are, then when, then your details, then confirm | `searchStores`, `appointmentAvailableTime`, `submitAppointment` | Appointments |
| `/locations` | Tribe finder: search, use my location, grouped by state, tribe cards | `searchStores`, `tribes` | Tribes |
| `/locations/states/{state}` | Tribes in one state, with a map | `tribes` | Tribes |
| `/locations/{tribe}` | Tribe page: hero, hours today, order and book buttons, menu highlights, reviews, team, map | `tribe(slug)`, `reviews(tribe_slug)` | Tribes, Reviews, Team |
| `/locations/{tribe}/our-work` and `/{slug}` | That tribe's catered events | `ourWorks(tribe_slug)`, `ourWork` | Our Work |
| `/locations/{tribe}/team` | Team members | `tribe.teamMembers` | Organisation Chart |
| `/locations/{tribe}/reviews` | All reviews, plus a "Leave a review" form | `reviews`, `submitReview` | Reviews |
| `/locations/{tribe}/book` | Stepper with "where" already chosen | as `/book` | Appointments |
| `/our-work` and `/our-work/{slug}` | National Our Work | `organisationOurWorks`, `organisationOurWork` | Our Work |
| `/blog`, `/blog/{slug}` | Blog index by category, and article pages | `articlesPagination`, `articleCategories`, `article` | Articles |
| `/franchise` | **Franchise sales page**: why Juniper Table, investment table, support, Opening Soon tribes, territories available, FAQ, enquiry form | `websitePage`, `tribes(status: "opening soon")`, `websiteFaq`, `submitEnquiry("franchise-enquiry")` | Website, Tribes, FAQ, Enquiries |
| `/contact` | Contact form sent to the chosen tribe | `submitEnquiry("contact-us")` | Enquiries |
| `/faq` | Frequently asked questions | `websiteFaq` | Website FAQ |

Header, footer and the franchise banner come from `websiteMenu("Main Menu")`,
`websiteMenu("Footer Menu")` and `websiteSection("Franchise Banner")`.

### Appointment stepper

Five steps, one decision each, with a progress bar and a Back button on every step:

1. **What do you need?** Cards for the three appointment types: Catering Consultation (30 min), Tasting Session (45 min) and Event Walkthrough (60 min). These are Gorilla Dash appointment types, so the names come from Gorilla Dash.
2. **Where are you?** "Use my location" or a postcode search runs `searchStores` and shows the three nearest tribes with today's hours. This step is skipped when a tribe is already bound or the visitor came from a tribe page.
3. **When?** A date strip for the next 14 days. Time slots come from `appointmentAvailableTime`, which builds them from the tribe's opening hours, and booked slots are greyed out.
4. **Your details.** First name, last name, email, a phone number with a country selector, and event notes.
5. **Review and confirm** calls `submitAppointment`. The confirmation screen offers an add-to-calendar file.

The booking appears straight away in Gorilla Dash under the tribe's appointments, with the visitor
created or matched as a person. Showing that screen on a second device at the stand is the demo's
best moment.

---

## 5. Gorilla Dash data: organisation and commands

Organisation: **Gorilla Dash Website Demo** (slug `gorilla-dash-website-demo`).

All demo data is written by an idempotent Artisan command in the Gorilla Dash repository, on branch
`feat/website-demo-organisation`. Content lives in `database/content/website-demo/`. Re-running the
command updates records in place, so staging and production always match what is in git.

```bash
herd php artisan website-demo:seed                      # dry run: lists what it would create or update
herd php artisan website-demo:seed --apply              # writes it
herd php artisan website-demo:seed --apply --owner-email=anthony@gorilladash.com
```

What `website-demo:seed` writes today:

| Area | Records |
|---|---|
| Organisation | Created through `OrganisationService`, so roles, applications and theme initialise as for a real customer. Report emails and billing reminders are switched off so the demo never mails anyone. |
| Website | "Juniper Table Website", with its OAuth client (client credentials grant) and all tribes connected |
| Tribes | 10 tribes with a tribe type: address, coordinates, phone, email, weekly hours in each tribe's own timezone, social links, intro copy. 8 are Active and 2 are Opening Soon. Enquiry notification emails are switched off, because the example.com inboxes would bounce. |
| Appointment types | Catering Consultation, Tasting Session, Event Walkthrough |
| Enquiry forms | Contact Us, Catering Quote, Franchise Enquiry (with fields) |
| Food | "Website Menu" (6 sections, with modifier groups) and "Catering Menu" |
| Blog | 3 categories and 8 published articles |
| Our Work | 4 national posts and 2 posts for each Active tribe |
| Reviews | 3 to 5 public reviews per Active tribe, some marked featured |
| Team | A manager and a catering lead for each Active tribe |
| FAQ | General, Ordering and Franchising categories |

Still to write, because each one depends on the design sign-off:

1. **`website-demo:seed-pages`** writes page templates, pages, sections and menus. The content field names must match the components we build, so this comes after the templates are fixed.
2. **`website-demo:seed-media {directory}`** uploads a licensed image set (stock or generated) into the media library and attaches it to tribes, menu items, articles, Our Work and pages. The seeding command writes no images today. Until this runs, the site shows its placeholder imagery.
3. **`website-demo:reset-activity`** deletes the orders, carts, enquiries, appointments, reviews and people created by visitors after a show. It only touches this organisation, and it asks for confirmation before deleting.

### Running it in production

The site reads the production GraphQL API, so the organisation has to exist in production before the
demo can go live. **Nothing has been run in production.** After the branch is merged, the command
to approve is:

```bash
php artisan website-demo:seed --apply --force --owner-email=anthony@gorilladash.com
```

It runs once on the queue server (`queue.gorilladash.com`).

When running it locally, point TimescaleDB at localhost first. The local environment file names a remote TimescaleDB host, and the review live-feed insert waits on it:

```bash
PG_TIMESCALE_DB_HOST=127.0.0.1 herd php artisan website-demo:seed --apply
```

---

## 6. Build phases

Estimates are working days for one developer with agent help. They are an estimate, not a quote.

| Phase | Work | Estimate |
|---|---|---|
| 0 | This plan, the repository, organisation seeding (done locally) | done |
| 1 | Design sign-off: wireframe the six templates, pick the tokens, source the image set | 2 |
| 2 | Shell: header, footer, franchise banner, Structure view, theme switcher, `seed-pages`, `seed-media` | 3 |
| 3 | Home, About, tribe finder, state page, tribe page and its sub-pages | 4 |
| 4 | Menu, menu item, cart and checkout (Stripe test mode), catering page | 4 |
| 5 | Appointment stepper, contact and franchise enquiry forms (Precognition + reCAPTCHA, as `docs/public-forms.md` describes) | 3 |
| 6 | Blog, Our Work, FAQ, franchise page | 2 |
| 7 | Deploy to `demo.gorilladash.com` (subdomain to confirm), trade-show kiosk checks, `reset-activity` | 2 |

---

## 7. Trade-show practicalities

- **Kiosk mode.** A `?kiosk=1` flag hides the cookie banner, stops analytics and returns to the home page after 90 seconds idle.
- **Bad venue wi-fi.** Edge-cached HTML plus the SDK's stale-while-revalidate cache mean pages already visited keep working through a dropout. For a fully offline stand, the site also runs from a laptop through Herd, with `GD_WEBSITE_MAX_STALE_AGE` raised to a week and the cache warmed the night before.
- **Take it home.** A QR code on the stand opens the same site on the visitor's phone. That is also the easiest way to show it is responsive.
- **Two screens.** One shows the website. The other is logged in to the Gorilla Dash organisation, so a booking or order placed on the site appears in the admin moments later.

---

## 8. Open questions and known gaps

1. **Design.** Do you agree with "fully designed + Structure view + theme switcher" (section 3)?
2. **Brand name.** Keep "Juniper Table" once it has been checked, or choose another?
3. **Payments.** Checkout needs a Stripe **test-mode** payment provider on each Active demo tribe, or the checkout has to be limited to "pay at pickup". The keys have to be entered by you in Gorilla Dash under each tribe's store payment settings. The command does not set them.
4. **Franchise leads.** The Franchise Development module has no website API. The franchise page therefore submits the "Franchise Enquiry" enquiry form. Routing those enquiries into the Franchise Development pipeline would be a separate Gorilla Dash feature.
5. **Appointment slots.** `appointmentAvailableTime` compares UTC appointment start times with local slot times, so a booked slot may grey out the wrong hour for tribes outside UTC. Confirm on the first booking test and fix it in Gorilla Dash if it is wrong.
6. **Reviews.** The `reviews` query has no status filter, so every review row in the organisation is public. The seed data only writes public reviews, but reviews visitors leave at the stand appear on the site straight away. `reset-activity` clears them.
7. **The demo organisation is a real, Active organisation.** It may appear wherever Gorilla Dash lists or compares organisations, such as admin lists, billing and review benchmarks. Check whether an internal or demo flag should be set before running the command in production.
8. **Subdomain and hosting.** Deploy on GKE like Great Greek (the starter's default), or on the Forge client fleet? A Tolgee project is also needed per the starter checklist, or the demo can be pinned to English only.
