# TCOS portfolio: server API plan

The plan for the Express server that the Next.js client calls. The data model is in [DATABASE.md](DATABASE.md) and [tcos_schema.mongodb.js](../tcos_schema.mongodb.js). Values not decided yet are `<...>`.

## Parts

| Part | Stack | Talks to |
| --- | --- | --- |
| client | Next.js: the public site | the server's public API |
| admin | For now, direct calls to the admin API (curl, Postman). A separate admin interface comes later | the server's admin API |
| server | Express.js on Cloudflare Workers, with the official `mongodb` driver (6.15 or later), not Mongoose | MongoDB, Cloudflare R2 (through a binding) |

- The server is the only part with database and R2 credentials.
- The server applies every visibility rule before data leaves it:
  - only `is_shown: true` documents and items;
  - `photo` only where `is_photo_allowed` is true;
  - `logo` only where `logo_permission` is true.

  Hidden data about minors is never sent to the browser, not even to be hidden there.
- Next.js calls the public API from the server side (server components), so pages render with their data. The client never calls the admin API.

## Hosting: Cloudflare Workers

- **Express on Workers:** the Express app runs on Workers through Cloudflare's Node.js compatibility, handed requests by `httpServerHandler` from `cloudflare:node`. List `nodejs_compat` in `compatibility_flags` explicitly, even where the compatibility date turns it on by default. Check Cloudflare's current "Express on Workers" docs for the exact setup.
- **Database driver:** the official `mongodb` driver (6.15 or later), not Mongoose. Mongoose needs a patch to run on Workers and is the part most likely to break. The database's `$jsonSchema` validators already enforce the schema, so code-side schemas are not needed. See [Database access](#database-access).
- **Connections:** one connection per request is fine to start. It adds about 300 ms, but visitors are served from Next.js's cache and the API is only called when a page refreshes or an admin writes. If that becomes too slow, keep one connection open in a Durable Object.
- **Plan:** use the paid Workers plan. The free plan's CPU time per request is likely too short for connecting to MongoDB and filling in data blocks. Check Cloudflare's current limits.
- **Atlas network access:** Workers do not use fixed outgoing addresses, so Atlas has to allow all addresses unless Cloudflare offers a fixed-IP option (check first). Use a strong password and a database user limited to the `tcos` database.
- **No disk and no memory between requests:** uploads stream straight to R2, and nothing is kept in memory from one request to the next.
- **JWT:** checked with `jose` (Web Crypto), not `jsonwebtoken`.
- **Deploy:** `npx wrangler deploy` from the server folder, or Cloudflare's Git integration (deploy on push).

## Environment

Server values are Worker settings: **secrets** are set with `npx wrangler secret put <NAME>` (and `.dev.vars` for local runs, never committed); **vars** and **bindings** live in the Wrangler config.

| Name | Where | Kind | What |
| --- | --- | --- | --- |
| `MONGODB_URI` | server | secret | `<...>` |
| `JWT_SECRET` | server | secret | Signs and checks admin tokens |
| `REVALIDATE_SECRET` | server | secret | Sent with calls to Next.js's `/api/revalidate` |
| `MEDIA_BUCKET` | server | R2 binding | The site media bucket (see [Uploads](#uploads)). No R2 access keys are needed |
| `MEDIA_BASE_URL` | server | var | Public URL of that bucket, e.g. a custom domain `<...>`. Set in the Cloudflare dashboard, not in `wrangler.jsonc` |
| `REVALIDATE_URL` | server | var | Where to tell Next.js a page changed. Set in the Cloudflare dashboard, not in `wrangler.jsonc` |
| `API_URL` | client | env | The server's base URL (the Worker's URL) |
| `REVALIDATE_SECRET` | client | env | Checks calls to `/api/revalidate` |
| `MEDIA_BASE_URL` | client | env | The same bucket URL, allowed for `next/image` (read at build time: a build variable in the Cloudflare dashboard) |
| `API_URL` | editor | env | The server's base URL, for the admin API (see [EDITOR.md](EDITOR.md)) |
| `ADMIN_TOKEN` | editor | secret | A hand-made admin JWT, kept on the editor's server |
| `SITE_URL` | editor | env | The public site's base URL, for "View on site" links |
| `USE_FIXTURES` | editor | env | `true` edits the editor's in-memory fixtures instead of calling `API_URL` |
| `USE_FIXTURES` | client | env | `true` serves the client's fixtures instead of calling `API_URL` (see FRONTEND.md "Developing before the server is ready") |

The client (Next.js) also runs on Cloudflare Workers, through OpenNext (`@opennextjs/cloudflare`). Its values are Worker secrets and vars too, and `.env.local` / `.dev.vars` for local runs.

## Database access

The server uses the official `mongodb` driver. Its queries are MongoDB's own (the same `find`, `$set`, `$push`, aggregation as in Mongoose), with these differences for developers used to Mongoose:

- **One helper file, `db.ts`:** opens the connection and exports one typed handle per collection (`projects`, `tracks`, `apply`, `pages`). Routes use these instead of models. It also has:
  - `toObjectId(id)`: turns a string into an ObjectId, and answers `400` when it is not one;
  - `withId(item)`: adds `_id: new ObjectId()` to a new list item.
- **Lists:** `find()` and `aggregate()` return cursors; call `.toArray()`.
- **No automatic conversion:** convert ids with `toObjectId` and dates with `new Date(...)` before querying. A string where an ObjectId or Date is expected matches nothing, silently.
- **New list items need `_id`:** the schema requires it on team members, sponsors, highlights, achievements, positions and timeline events. Every `$push` uses `withId`.
- **Validation errors:** a document the database rejects throws a MongoDB error with code `121` ("Document failed validation"). Answer `400` with the failing field where the error gives it.
- **Request bodies:** check them with `zod` before writing, so bad input fails with a clear `400` before it reaches the database.
- **No hooks or timestamps:** set `pages.updated_at` with `$set: { updated_at: new Date() }` on every page write.

## Auth

- Tokens are JWTs made by hand with `JWT_SECRET` (for example, a one-off script) and given to whoever calls the admin API. There is no login endpoint.
- Every `/api/admin/*` request needs `Authorization: Bearer <token>`. The server checks the signature with `jose` (and `exp`, if the token has one), and answers `401` otherwise.
- For now, admins call the API directly (curl, Postman). Keep the token out of shared files and chat.
- The admin interface ([EDITOR.md](EDITOR.md)) keeps the token on its own server, never in the browser.
- To revoke every token, change `JWT_SECRET` and make new tokens.

## Public API

No token. Read-only. Shown items only. A hidden or missing document returns `404`.

| Endpoint | Used by | Returns |
| --- | --- | --- |
| `GET /api/pages/home` | Home | `pages{key:"home"}`: `title` and shown `blocks`, with each data block filled in |
| `GET /api/projects` | `/projects` bookshelf | Shown projects, newest first by `start_date`: `slug`, `name`, `start_date`, `pics[0]`. The year filter and the reverse toggle run in the browser |
| `GET /api/projects/:slug` | Project page | Fixed header: `name`, `start_date`, `end_date`, `venue`, `pics[0]`, `is_yearbook_shown`. Then shown `blocks`, with each data block filled in |
| `GET /api/projects/:slug/yearbook` | Yearbook | `name`, `pics[0]`, and shown `team` grouped by `dept_key` (`dept_name`, `name`, `nickname`, `position`, `photo` only where allowed). `404` unless `is_yearbook_shown` |
| `GET /api/tracks` | `/tracks` list | Shown tracks by `order`: `key`, `display_name`, `desc` |
| `GET /api/tracks/:key` | Track popup | `display_name`, `desc`, `pics`, shown `achievements` (`year`, `text`, `pics`, project `name` as text). An achievement whose project is not shown is left out |
| `GET /api/join` | `/join` | Rounds open today (`is_shown` and `opens_at` ≤ now ≤ `extended_to` or `closes_at`), closing soonest first: `title`, `poster`, dates, `qualifications`, shown `positions` and `timeline`, `apply_url`, project `name` |

### Filling in data blocks

`/api/pages/home` and `/api/projects/:slug` replace each data block's pointer with its data. That way a page is one call and the components never fetch. Content blocks pass through unchanged.

| Block | Filled with |
| --- | --- |
| `projects` | The same list as `GET /api/projects`, up to `limit` |
| `tracks` | The same list as `GET /api/tracks`, plus `pics[0]` |
| `yearbook` | Shown projects with `is_yearbook_shown`, newest first, up to `limit`: `slug`, `name`, `pics[0]` |
| `join` | Open rounds as in `GET /api/join`. On a project page (`project_slug: null`), only that project's rounds |
| `team` | That project's shown team, filtered by `dept_keys`, plus `org_chart_image` when `show_org_chart` |
| `sponsors` | Shown sponsors filtered by `tiers`. On Home, across all shown projects |
| `highlights` | Shown highlights, up to `limit`. On Home, across all shown projects |

### Response shapes

The exact JSON of each public response. The client's `types/api.ts` follows this section.

**Rules for every public response**

- The body is the data itself, with no wrapper. Errors are `{ "error": "<message>" }` with the status code.
- Dates are ISO 8601 strings, e.g. `"2025-06-28T00:00:00.000Z"`.
- Field names are the schema's. Response-only keys are marked *(response)* below.
- **Left out of every public response:** `_id` (documents and list items), `is_shown`, `is_photo_allowed`, `logo_permission`. Only shown things are sent, so the flags carry no information.
- `photo` is `null` unless `is_photo_allowed`, and `logo` is `null` unless `logo_permission`.
- **`pics[0]`** is sent as `pics` with at most one item (`[]` when the project has none), so the field keeps its schema name.
- An optional field the document does not have is sent as `null` (strings, dates, numbers) or `[]` (lists).

**Shared pieces**

```ts
ProjectCard   = { slug, name, start_date, pics }          // pics: at most one
TrackCard     = { key, display_name, desc, pics }         // pics: at most one
YearbookCard  = { slug, name, pics }                      // pics: at most one
Member        = { name, nickname, position, photo }
Department    = { dept_key, dept_name, members: Member[] } // (response) grouping
Sponsor       = { name, logo, tier }
Highlight     = { event_name, date, venue, desc, pics }
Round         = { title, poster, opens_at, closes_at, extended_to,
                  qualifications: { age_min, age_max, age_note, items },
                  positions: Position[], timeline: TimelineEvent[],
                  apply_url,
                  project_name }                          // (response) the project's name, null when project_slug is null
Position      = { dept_key, dept_name, unit_name, title, description, requirements,
                  portfolio_required, onsite_required,
                  audition: { clip_required, clip_brief, clip_max_minutes, clip_file_name,
                              clip_upload, pieces, onsite } | null }
TimelineEvent = { start_date, end_date, event_name, event_description, location }
```

Departments are sorted by `dept_name`, as in the yearbook query in DATABASE.md. Members keep their order in `team`.

**Endpoints**

| Endpoint | Body |
| --- | --- |
| `GET /api/pages/home` | `{ key, title, blocks: Block[] }` |
| `GET /api/projects` | `ProjectCard[]`, newest first |
| `GET /api/projects/:slug` | `{ slug, name, start_date, end_date, venue, pics, is_yearbook_shown, blocks: Block[] }` (`pics`: at most one) |
| `GET /api/projects/:slug/yearbook` | `{ slug, name, pics, departments: Department[] }` (`pics`: at most one) |
| `GET /api/tracks` | `{ key, display_name, desc }[]`, by `order` |
| `GET /api/tracks/:key` | `{ key, display_name, desc, pics, achievements: { year, text, pics, project_name }[] }` (`project_name` *(response)*: the project's name as text) |
| `GET /api/join` | `Round[]`, closing soonest first |

**Blocks.** Every block keeps its stored fields (`id`, `type`, `title` and its own fields, without `is_shown`). Content blocks are sent as stored. Each data block also gets one *(response)* key with its data:

| `type` | Added key(s) |
| --- | --- |
| `projects` | `projects: ProjectCard[]` |
| `tracks` | `tracks: TrackCard[]` |
| `yearbook` | `projects: YearbookCard[]` |
| `join` | `rounds: Round[]` |
| `team` | `departments: Department[]`, and `org_chart_image` (a URL, or `null` unless `show_org_chart`) |
| `sponsors` | `sponsors: Sponsor[]` |
| `highlights` | `highlights: Highlight[]` |

For example, a filled `team` block:

```json
{
  "id": "team",
  "type": "team",
  "title": null,
  "project_slug": null,
  "dept_keys": [],
  "show_org_chart": true,
  "layout": "list",
  "org_chart_image": "<...>",
  "departments": [
    {
      "dept_key": "<track to confirm>",
      "dept_name": "ทีมโฆษณา (Advertising)",
      "members": [{ "name": "<first name surname>", "nickname": "กานต์", "position": "<...>", "photo": null }]
    }
  ]
}
```

## Admin API

Needs the token. It returns hidden documents and items too, so editors can see and change them. "CRUD x" means:
- `GET` (list)
- `POST` (create)
- `GET /:id`
- `PUT /:id` (replace) or `PATCH /:id` (change some fields)
- `DELETE /:id`

| Endpoint | Notes |
| --- | --- |
| CRUD `projects` | `/api/admin/projects`, by `slug` |
| CRUD project `team` items | `/api/admin/projects/:slug/team`, by item `_id` |
| CRUD project `sponsors` items | `/api/admin/projects/:slug/sponsors`, by item `_id` |
| CRUD project `highlights` items | `/api/admin/projects/:slug/highlights`, by item `_id` |
| `GET`, `PUT /api/admin/projects/:slug/blocks` | The whole `blocks` array in one save: reorder, add, remove, hide |
| CRUD `tracks` | `/api/admin/tracks`, by `key` |
| CRUD track `achievements` items | `/api/admin/tracks/:key/achievements`, by item `_id` |
| CRUD `apply` rounds | `/api/admin/apply`, by `_id` |
| CRUD round `positions` items | `/api/admin/apply/:id/positions`, by item `_id` |
| CRUD round `timeline` items | `/api/admin/apply/:id/timeline`, by item `_id` |
| CRUD `pages` | `/api/admin/pages`, by `key` |
| `GET`, `PUT /api/admin/pages/:key/blocks` | The whole `blocks` array, as for projects |
| `POST /api/admin/uploads` | Multipart upload to R2; returns `{ key, url }` for `pics`, `photo`, `logo`, `poster`, `slides`, `media_url` and so on |
| `DELETE /api/admin/uploads/:key` | Deletes one file from R2 |

### Checks on every write

MongoDB's validator rejects wrong shapes. The server also checks what the validator cannot:

- **Blocks:** `id`s are unique within a page's `blocks`.
- **References:**
  - every `dept_key` of a team member or a block matches a `tracks.key` (a position's `dept_key` is free text, not checked);
  - every `project_slug` (blocks, achievements, `apply`) matches a project;
  - `project_slug` in a data block may be `null`.
- **Deleting a project or track:** refused (`409`) while `tracks.achievements`, `apply` or blocks (for a track: team members or blocks) still point to it.
- **Renaming a `slug` or `key`:** updates those references in the same request.
- **Photo consent withdrawn:** when `is_photo_allowed` is set to false, the server unsets `photo` and deletes the file from R2 in the same request.
- **Media removed:** a write that removes or replaces a media URL deletes the file from R2, unless another document still uses it (see [Uploads](#uploads)).
- **Item `_id`:** the server adds one to every new list item (`withId`, see [Database access](#database-access)).

### After a write

The server calls `POST <REVALIDATE_URL>` (a Next.js route handler, checked with `REVALIDATE_SECRET`) with the paths that changed, so those pages refresh without a rebuild:

```http
POST <REVALIDATE_URL>
Authorization: Bearer <REVALIDATE_SECRET>
Content-Type: application/json

{ "paths": ["/", "/projects", "/projects/tcos-2-the-hidden-saloon"] }
```

It answers `200 { "revalidated": [...paths] }`, `401` without the right secret, and `400` when `paths` is not a list of paths starting with `/`.

| Write to | Paths to refresh |
| --- | --- |
| A project | `/`, `/projects`, `/projects/<slug>`, `/projects/<slug>/yearbook`, `/join`, and `/tracks/<key>` for each track with an achievement on that project (the project name, or hiding the achievement) |
| A track | `/`, `/tracks`, `/tracks/<key>` |
| An apply round | `/`, `/join`, and its project page |
| A page | Its path (`/` for `home`) |

## Uploads

- **Bucket:** a second R2 bucket for site media only, `<bucket name>`. It is separate from the finance tracking bucket, because site media must be publicly readable and finance files must not be.
- **Public access:** the bucket is read through `MEDIA_BASE_URL`. Only the server writes, through the `MEDIA_BUCKET` binding.
- **Streaming:** Workers have no disk, so uploads stream from the request straight into R2. No middleware that saves to disk first.
- **Object keys:** `<collection>/<slug or key>/<random id>.<ext>`, e.g. `projects/tcos-2-the-hidden-saloon/<id>.webp`. Names are random, so a file's URL does not reveal a person's name.
- **Allowed file types:** JPEG, PNG, GIF, WebP and AVIF pictures, and MP4 or WebM video for the hero's `media_url`, recognised from the file's bytes. **Maximum size:** `FILE_SIZE_LIMIT` MB. See [question 1](#open-questions).
- **Removing:** every admin write that removes or replaces a media URL (a field, a list item, a block, a whole document) takes that file off the site in the same request, after the pages refresh, unless another document still uses it. The file moves to `trash/<key>`, so a picture removed by mistake can be copied back. Team photos (`team.photo`) are deleted outright, never kept: they are personal data under consent. A failed cleanup is logged and never fails the write. `DELETE /api/admin/uploads/:key` deletes one file by hand, and refuses (`409`) while any document still uses it.
- **Trash, set up in the Cloudflare dashboard:** an R2 lifecycle rule on the bucket deletes objects under the `trash/` prefix 30 days after they are created. The bucket is public, so block `/trash/*` on its public URL too (a WAF custom rule on the custom domain, and the `r2.dev` URL off).

## Client components and what they read

Data blocks arrive filled in, so only the pages and the track popup call the API.

| Next.js route | Calls | Components |
| --- | --- | --- |
| `/` | `GET /api/pages/home` | `Nav`, `BlockRenderer`, then one component per block type |
| `/projects` | `GET /api/projects` | `Nav`, `Shelf` (with year filter and reverse toggle) |
| `/projects/[slug]` | `GET /api/projects/:slug` | `Nav`, `ProjectHeader` (Yearbook button when `is_yearbook_shown`), `BlockRenderer` |
| `/projects/[slug]/yearbook` | `GET /api/projects/:slug/yearbook` | `Nav`, `YearbookGrid` |
| `/tracks` | `GET /api/tracks` | `Nav`, `TrackList` |
| `/tracks/[key]` (the track popup, over `/tracks`) | `GET /api/tracks/:key` | `TrackPopup` |
| `/join` | `GET /api/join` | `Nav`, `RoundCard` |

**Block components:**
- **Content:** `Hero` (image, video or slideshow), `Article`, `ImageBlock`, `Quote`, `Gallery`, `Video`, `ButtonBlock`, `Stats`.
- **Data:** `Highlights`, `Team`, `Sponsors`, `Join`, `Shelf` (the `projects` block, the same component as `/projects` without filters), `TrackCards`, `YearbookCards`.

## Open questions

1. **Uploads:**
   - Which file types: decided, pictures and MP4/WebM video for the hero (see [Uploads](#uploads)).
   - What maximum size?
2. **Token expiry:** should hand-made tokens carry an `exp`, and if so, how long?
3. **R2 media bucket:** its name, and its public URL (a custom domain or the `r2.dev` URL).
