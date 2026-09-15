# Routing & Wayfinder

**Scope:** Inertia + Wayfinder cover **page routing and Laravel-backed posts**
(navigation, auth, the occasional server action). **Business data and mutations
do not go through here** — they go through GraphQL/Apollo (see
`pages-and-data.md`). So use Wayfinder for `<Link>` hrefs and any Laravel form
posts; use the `api/` GraphQL layer for everything data-related.

## Server side: mapping a URL to a page

Two ways, depending on whether the page needs data.

**No data — use `Route::inertia`.** It's a shortcut for "render this component
with these (optional static) props":

```php
Route::inertia('/', 'Welcome')->name('home');
Route::inertia('/about', 'About')->name('about');
```

**Needs data — use a controller** returning `Inertia::render`:

```php
Route::get('/users', [UserController::class, 'index'])->name('users.index');

// UserController
public function index(): Response
{
    return Inertia::render('Users/Index', [
        'users' => User::query()->paginate(),
    ]);
}
```

The component string is the page name relative to `resources/ts/pages/`, so
`'Users/Index'` → `resources/ts/pages/Users/Index.vue`.

**Always name routes** (`->name(...)`). Wayfinder and `route()` rely on names,
and named routes survive URL changes.

## Frontend side: call routes through Wayfinder, not string URLs

Wayfinder generates typed TS functions from the Laravel routes/controllers into
`resources/ts/{actions,routes,wayfinder}/` (gitignored, regenerated on build).
Import them via the `@` alias and use them instead of hardcoding `/users/1`:

```ts
// controller actions
import { show, store, update } from '@/actions/App/Http/Controllers/UserController';
// or named routes
import { show as userShow } from '@/routes/user';

show(1)          // { url: '/users/1', method: 'get' }
show.url(1)      // '/users/1'
store.post()     // { url: '/users', method: 'post' }
show(1, { query: { tab: 'profile' } })  // url with ?tab=profile
```

Prefer **named imports** (`import { show }`) over default imports so unused
routes tree-shake out of the bundle.

### With links and forms

```vue
<script setup lang="ts">
import { Link, Form } from '@inertiajs/vue3';
import { show, store } from '@/actions/App/Http/Controllers/UserController';
</script>

<template>
  <Link :href="show.url(1)">View user</Link>

  <Form v-bind="store.form()">
    <input name="name" />
    <button type="submit">Create</button>
  </Form>
</template>
```

`store.form()` returns `{ action, method }` already wired for the `<Form>`
component — this is why we enable `formVariants: true` in the Wayfinder plugin
config.

## Regenerating

The Vite plugin regenerates on every `npm run dev` / `npm run build`, so you
normally never run it by hand. If you need to force it (CI without Vite, or to
inspect output):

```bash
php artisan wayfinder:generate --with-form
```

## Gotchas

- Output goes to `resources/ts/` (set via the plugin's `path` option). If
  generated files land in `resources/ts/`, the `path` option is missing or
  wrong — fix `vite.config.ts`.
- Don't import generated files with deep relative paths; use `@/actions/...`.
- After adding or renaming a route, restart/rebuild so the types regenerate
  before you rely on them in the frontend.
