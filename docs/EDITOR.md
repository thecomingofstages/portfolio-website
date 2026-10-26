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
| `/api/upload` | Not a page: image uploads from the forms, passed on with the token | `POST /api/admin/uploads` |

**Project fields it edits:** `slug`, `name`, `type`, `status`, `start_date`, `end_date`, `venue`, `summary`, `pics`, `org_chart_image`, `is_yearbook_shown`, `is_shown`.

**Blocks:** add (any of the 15 types), remove, reorder, hide (`is_shown`), change `id`, and edit every field of the block's type in [tcos_schema.mongodb.js](../tcos_schema.mongodb.js). A save sends the whole `blocks` array, as the Admin API expects. A new block starts hidden (`is_shown: false`), so a half-made block never shows on the site. A data block edits only its pointer fields (`project_slug`, `limit`, `dept_keys`, `tiers` ...); its data is edited where it lives.

**Dates** take an optional time, shown and entered in Bangkok time. A date without a time is sent as `YYYY-MM-DD` (stored as midnight UTC, shown without a time on the site); with a time it is sent with its zone, `YYYY-MM-DDTHH:MM:00+07:00`, as the server asks.

**Images:** every image field (`pics`, `org_chart_image`, `media_url`, `slides`, `image`, `url`, `background_image`) takes a URL or an upload. The browser sends the file to the editor's own `/api/upload`, which passes it on as a stream to `POST /api/admin/uploads` with the token, filed under the page's key or the project's slug. The server checks the type (images only) and the size. A new project can take uploads once it is created.

**Blocks the site does not show yet:** the editor marks block types the client has no component for yet ("Not on the site yet"). They save as usual. The list follows `apps/client/components/blocks/index.ts`, and a test fails when the two drift apart.

**Not in the editor yet:**
- `team`, `sponsors` and `highlights` items, with their consent flags (`is_photo_allowed`, `logo_permission`). They are changed through the admin API for now.
- `tracks` and `apply` rounds.
- Deleting a project (the server answers `409` while it is referenced), and deleting uploaded files.

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
| `SITE_URL` | env | The public site's base URL, for the preview and the "Open on the site" links. Optional |
| `USE_FIXTURES` | env | `true` uses the editor's fixtures, kept in memory, instead of `API_URL` |

**The editor has no sign-in of its own.** Anyone who can open it can change the site with its token. Run it only on your own machine, or behind access control set up outside the app: `TODO(editor access)`, for example Cloudflare Access. Where it is hosted is `TODO(editor hosting)`.

## Preview

Pages with a public path (Home, and each project) show the public site beside the forms, in a phone-width frame (`SITE_URL` + the path). It is the client itself, so it uses the site's real components and never drifts from them. It shows what is saved and shown: after each save the frame reloads, once the server has refreshed the site's page. A hidden page or project shows a note instead, since the site answers "not found". The client must keep allowing itself to be framed by the editor (it sends no `X-Frame-Options` or `frame-ancestors` today).

## Fixtures

With `USE_FIXTURES=true`, the editor reads and writes an in-memory copy of its fixtures (`apps/editor/fixtures/`) instead of the admin API, built from the [DATABASE.md](DATABASE.md) examples in their stored shape (`is_shown` on every block and item). Saves last until the dev server restarts. The fixture store copies the server's checks the editor relies on: unique block `id`s, a unique `slug`, and `404` for a missing page or project. Uploads need the real admin API.

**Admin responses:** documents as stored, sent as JSON: `_id` as a hex string and dates as ISO 8601 strings in UTC. Errors are `{ "error": "<message>" }`, shown in the form. After a write the editor reads the document again, so it does not depend on what a write answers.

## Design

The editor uses the client's colour tokens, fonts and corner sizes ([FRONTEND.md](FRONTEND.md) "Design"), copied into `apps/editor/app/globals.css`. As on the client, every colour, font family and font size comes only from that file. It needs no background picture, and its width is not limited to 80%: forms use the full width up to a readable maximum, with the preview beside them on wide screens.

It is a quiet work tool in the site's look ([thecomingofstages.com](https://thecomingofstages.com)): pure black, a floating rounded bar for the nav and for saving, gold kept for the Save button, the current nav link and the "shown" mark. A hidden block is dimmed; the open block sits in a soft spotlight, the one decorative touch. Dates show in the site's Thai format (`lib/dates.ts`, a copy of the client's, kept identical by a test).
