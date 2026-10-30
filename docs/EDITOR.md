# TCOS portfolio: editor plan

The editor (`apps/editor`) is the separate admin interface that [DATABASE.md](DATABASE.md) "Open decisions" and [API.md](API.md) "Auth" leave for later. It lets the team change the Home page and each project page without calling the admin API by hand.

It is a Next.js (App Router) app. It talks only to the server's [Admin API](API.md#admin-api), never to MongoDB, so every write goes through the server's checks and its page refresh.

## What it edits

| Editor path | What | Admin API calls |
| --- | --- | --- |
| `/` | Lists pages, projects, recruitment rounds and tracks, hidden ones too | `GET /api/admin/pages`, `/projects`, `/apply`, `/tracks` |
| `/pages/[key]` | A page's `title`, `is_shown`, and its `blocks` | `GET /api/admin/pages/:key`, `PATCH /api/admin/pages/:key`, `PUT /api/admin/pages/:key/blocks` |
| `/new/project` | A new project: the required fields only. Create pages live under `/new/`, so no slug or key (such as `new`) can clash with them | `POST /api/admin/projects` |
| `/projects/[slug]` | A project's own fields (below), and its `blocks` | `GET /api/admin/projects/:slug`, `PATCH /api/admin/projects/:slug`, `PUT /api/admin/projects/:slug/blocks` |
| `/new/track` | A new track: `key` and `display_name` | `POST /api/admin/tracks` |
| `/tracks/[key]` | A whole track: its fields and its `achievements` | `GET /api/admin/tracks/:key`, `PUT /api/admin/tracks/:key` |
| `/new/round` | A new recruitment round: `title`, `opens_at`, `closes_at` | `POST /api/admin/apply` |
| `/apply/[id]` | A whole round: its fields, `qualifications`, `positions` (with `audition`) and `timeline` | `GET /api/admin/apply/:id`, `PUT /api/admin/apply/:id` |
| `/api/upload` | Not a page: image uploads from the forms, passed on with the token | `POST /api/admin/uploads` |

**Project fields it edits:** `slug`, `name`, `type`, `status`, `start_date`, `end_date`, `venue`, `summary`, `pics`, `org_chart_image`, `is_yearbook_shown`, `is_shown`.

**Blocks:** add (any of the types the site shows, below), remove, reorder, hide (`is_shown`), and edit every field of the block's type in [tcos_schema.mongodb.js](../tcos_schema.mongodb.js). A save sends the whole `blocks` array, as the Admin API expects. A new block gets a UUID v7 `id`, which the editor does not show or change; blocks saved before keep their ids. A new block starts hidden (`is_shown: false`), so a half-made block never shows on the site, except on the home page.

**The home page is always shown:** the editor has no "Shown on the site" switch for the home page or its blocks, and a new home block starts shown. A home block hidden before this stays hidden and is marked "Hidden" in the panel's list. Elsewhere, "Shown on the site" is a switch: for a project, a track or a round, in the line under its name; for a page, at the top left of its fields; for a block, at the top left of its panel; for a list item (a position, a timeline event, an achievement), in the item's top row.

**The home banner:** on the home page, a Hero as the first block is the banner ([FRONTEND.md](FRONTEND.md) "Content blocks", `hero`). It stays first: it cannot be moved or removed, and nothing is added or moved above it. Its `subtitle` is the slogan under the logo.

**A project's header** on the page follows the panel's unsaved fields (name, dates, venue, pictures) as they are typed. A data block edits only its pointer fields (`project_slug`, `limit`, `dept_keys`, `tiers` ...); its data is edited where it lives.

**Tracks and rounds** are one form each, saved whole with `PUT`: list items keep their `_id`, and new ones get theirs from the server. The server checks that achievements point to real projects and positions to real track keys. A new `key` renames the track, and the server updates the rounds that point to it. New tracks, rounds and list items start hidden. The round form has no field for a position's track key (`dept_key`): saved positions keep theirs, and a new position cannot be saved until it has one. The round form has no fields for an audition's `clip_upload` and `pieces` either; saved values stay. Text lists (requirements, qualifications) show each line as a bullet that cannot be deleted on its own. The round form's labels and buttons are in Thai.

**Dates** take an optional time, shown and entered in Bangkok time. A date without a time is sent as `YYYY-MM-DD` (stored as midnight UTC, shown without a time on the site); with a time it is sent with its zone, `YYYY-MM-DDTHH:MM:00+07:00`, as the server asks.

**Images:** every image field (`pics`, `org_chart_image`, `media_url`, `slides`, `image`, `url`, `background_image`) shows its picture with a button that opens a popup; the editor has no text box for picture URLs. The popup takes a file to upload, or a link: a Google Drive share link (shared with "Anyone with the link"), which the editor's server downloads from Drive and uploads to the media bucket, or a link already in the media bucket (`NEXT_PUBLIC_MEDIA_BASE_URL`). Other links are refused: the site shows pictures only from the bucket ([FRONTEND.md](FRONTEND.md) "Images"). The hero's `media_url` also takes an MP4 or WebM video when `media_kind` is `video`. The browser sends the file (or the Drive link) to the editor's own `/api/upload`, which passes it on as a stream to `POST /api/admin/uploads` with the token, filed under the page's key, the project's slug, the track's key or the round's id. The server checks the type and the size. A new project can take uploads once it is created.

**Freeing space:** a picture removed or replaced in a field, or in a removed block, leaves the site when the change is saved: the server moves it to the bucket's `trash/`, emptied after 30 days, as part of the save ([API.md](API.md) "Uploads"). It keeps a file that any document still uses, so a picture shared with another page stays. A file uploaded and then discarded before saving stays in the bucket.

**Blocks the site does not show yet:** "Add a block" does not offer block types the client has no component for yet. Blocks of those types already on a page are marked ("ตอนนี้เว็บยังไม่แสดงบล็อกแบบนี้") and save as usual. The list follows `apps/client/components/blocks/index.ts`, and a test fails when the two drift apart.

**Not in the editor yet:**
- `team`, `sponsors` and `highlights` items, with their consent flags (`is_photo_allowed`, `logo_permission`). They are changed through the admin API for now.
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
| `SITE_URL` | env | The public site's base URL, for editing on the page and the "Open on the site" links. Optional |
| `USE_FIXTURES` | env | `true` uses the editor's fixtures, kept in memory, instead of `API_URL` |
| `NEXT_PUBLIC_MEDIA_BASE_URL` | env | The R2 media bucket's public URL, the same as the client's `MEDIA_BASE_URL`. Not a secret |

**The editor has no sign-in of its own.** Anyone who can open it can change the site with its token. Run it only on your own machine, or behind access control set up outside the app: `TODO(editor access)`, for example Cloudflare Access. Where it is hosted is `TODO(editor hosting)`.

## Editing on the page

Home and each project are edited on the page itself: the client's edit mode ([FRONTEND.md](FRONTEND.md) "Edit mode", `SITE_URL` + `/edit?page=home` or `?project=<slug>`) in a frame, with a panel beside it. The page uses the site's own components, so it looks as the site will.

- **Text:** click a heading, caption, quote or button label and type. An article's text opens in a box, in Markdown. Empty fields show a dim hint, such as "Section heading", which is never saved.
- **Pictures:** click a picture, or the empty space over a background picture, to upload one, give a URL, or (where the field allows) remove it.
- **Blocks:** point at a block for its toolbar: move up, move down, all fields, remove. "Add a block here" sits between blocks. The panel lists every block in order, hidden ones too, and the same controls work there.
- **All fields:** the selected block's full form is in the panel, for what the page cannot show: links, sizes, alignment, video URLs, data-block settings and "Shown on the site". Without a block selected, the panel shows the page's or project's own fields.
- **Saving:** nothing reaches the site until Save; Discard goes back to the last save.

The editor accepts from the page only the fields the client marks for that block type (`PAGE_FIELDS` in `lib/blocks.ts`, kept equal to the markers by a test), and only from `SITE_URL`'s origin and the framed window. The client must set `EDITOR_ORIGIN` to the editor's origin. Without `SITE_URL`, the panel alone edits the blocks.

## Fixtures

With `USE_FIXTURES=true`, the editor reads and writes an in-memory copy of its fixtures (`apps/editor/fixtures/`) instead of the admin API, built from the [DATABASE.md](DATABASE.md) examples in their stored shape (`is_shown` on every block and item). Saves last until the dev server restarts. The fixture store copies the server's checks the editor relies on: unique block `id`s, a unique `slug`, and `404` for a missing page or project. Uploads need the real admin API.

**Admin responses:** documents as stored, sent as JSON: `_id` as a hex string and dates as ISO 8601 strings in UTC. Errors are `{ "error": "<message>" }`, shown in the form. After a write the editor reads the document again, so it does not depend on what a write answers.

## Design

The editor uses the client's colour tokens, fonts and corner sizes ([FRONTEND.md](FRONTEND.md) "Design"), copied into `apps/editor/app/globals.css`. As on the client, every colour, font family and font size comes only from that file. It needs no background picture, and its width is not limited to 80%: the page being edited takes the width, with the panel beside it on wide screens and below it on phones.

It is a quiet work tool in the site's look ([thecomingofstages.com](https://thecomingofstages.com)): pure black, a floating rounded bar for the nav and for saving, gold kept for the Save button, the current nav link and the "shown" mark. A hidden block is dimmed; the selected block is outlined in gold on the page, and its panel sits in a soft spotlight, the one decorative touch. Dates show in the site's Thai format (`lib/dates.ts`, a copy of the client's, kept identical by a test).
