# TCOS portfolio: editor plan

The editor (`apps/editor`) is the separate admin interface that [DATABASE.md](DATABASE.md) "Open decisions" and [API.md](API.md) "Auth" leave for later. It lets the team change the Home page and each project page without calling the admin API by hand.

It is a Next.js (App Router) app. It talks only to the server's [Admin API](API.md#admin-api), never to MongoDB, so every write goes through the server's checks and its page refresh.

## What it edits

| Editor path | What | Admin API calls |
| --- | --- | --- |
| `/` | Lists pages and projects, hidden ones too | `GET /api/admin/pages`, `GET /api/admin/projects` |
| `/pages/[key]` | A page's `title`, `is_shown`, and its `blocks` | `GET /api/admin/pages/:key`, `PATCH /api/admin/pages/:key`, `PUT /api/admin/pages/:key/blocks` |
| `/projects/new` | A new project: the required fields only | `POST /api/admin/projects` |
| `/projects/[slug]` | A project's own fields (below), and its `blocks` | `GET /api/admin/projects/:slug`, `PATCH /api/admin/projects/:slug`, `PUT /api/admin/projects/:slug/blocks` |

**Project fields it edits:** `slug`, `name`, `type`, `status`, `start_date`, `end_date`, `venue`, `summary`, `pics`, `org_chart_image`, `is_yearbook_shown`, `is_shown`.

**Blocks:** add (any of the 15 types), remove, reorder, hide (`is_shown`), change `id`, and edit every field of the block's type in [tcos_schema.mongodb.js](../tcos_schema.mongodb.js). A save sends the whole `blocks` array, as the Admin API expects. A new block starts hidden (`is_shown: false`), so a half-made block never shows on the site. A data block edits only its pointer fields (`project_slug`, `limit`, `dept_keys`, `tiers` ...); its data is edited where it lives.

**Not in the editor yet:**
- `team`, `sponsors` and `highlights` items, with their consent flags (`is_photo_allowed`, `logo_permission`). These need the photo-removal check from task S7.
- `tracks` and `apply` rounds.
- Deleting a project (the server answers `409` while it is referenced).
- File uploads (task S8). Image fields are URL text inputs until then.

## Checks in the editor

The server is the one that checks writes ([API.md](API.md) "Checks on every write"). The editor checks the same shapes first with `zod`, so a mistake shows next to the form instead of as a `400`:
- each block matches its type's shape exactly, with no extra fields;
- block `id`s are unique within the page, not empty, and without spaces (an id is also the `#anchor`);
- project fields match the `projects` schema; dates are `YYYY-MM-DD`;
- a `slug` is lowercase letters, digits and single hyphens, e.g. `tcos-2-the-hidden-saloon`.

It shows the server's answer for `400`, `401`, `404` and `409` in words.

**Fresh data wins over a stale form.** Next.js keeps visited editor pages mounted in the background. When a page comes back with different data from the server (for example, a slug rename rewrote a `project_slug` in Home's blocks), the form reloads that data, so a later save cannot send an older copy.

## Auth and settings

The editor keeps the admin token on its own server, never in the browser ([API.md](API.md) "Auth"). The browser talks only to the editor's own Next.js server (server components and server actions); that server adds `Authorization: Bearer <ADMIN_TOKEN>` to each Admin API call.

| Name | Kind | What |
| --- | --- | --- |
| `API_URL` | env | The server's base URL (the Worker's URL) |
| `ADMIN_TOKEN` | secret | A hand-made admin JWT ([API.md](API.md) "Auth") |
| `SITE_URL` | env | The public site's base URL, for the "View on site" links. Optional |
| `USE_FIXTURES` | env | `true` uses the editor's fixtures, kept in memory, instead of `API_URL` |

**The editor has no sign-in of its own.** Anyone who can open it can change the site with its token. Run it only on your own machine, or behind access control set up outside the app: `TODO(editor access)`, for example Cloudflare Access. Where it is hosted is `TODO(editor hosting)`.

## Developing before the admin API exists

Tasks S5 and S6 are not done yet. With `USE_FIXTURES=true`, the editor reads and writes an in-memory copy of its fixtures (`apps/editor/fixtures/`), built from the [DATABASE.md](DATABASE.md) examples in their stored shape (`is_shown` on every block and item). Saves last until the dev server restarts. The fixture store copies the server's checks the editor relies on: unique block `id`s, a unique `slug`, and `404` for a missing page or project.

**Admin response shapes:** API.md does not give them yet: `TODO(admin response shapes)`. The editor expects documents as stored, sent as JSON: `_id` as a hex string and dates as ISO 8601 strings. After a write it reads the document again, so it does not depend on what a write answers.

## Design

The editor uses the client's colour tokens, fonts and corner sizes ([FRONTEND.md](FRONTEND.md) "Design"), copied into `apps/editor/app/globals.css`. As on the client, every colour, font family and font size comes only from that file. It needs no background picture, and its width is not limited to 80%: forms use the full width up to a readable maximum.
