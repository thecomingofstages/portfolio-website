# TCOS portfolio: task briefs

One brief per task. Hand a developer (or their AI tool) the brief together with [AGENTS.md](../AGENTS.md) and the docs it names.

- **Paths:** client paths are relative to the Next.js app, and server paths to the Express app (the Worker).
- **Sizes:** rough guesses. S is about a day, M two to three days, L about a week.
- **Owner:** fill in when assigning.
- **Shared parts:** marked **shared**. Other tasks build on them, so their owner reviews any change to them.

## Order

1. **Foundation (F1–F7) comes first.** F2 unblocks the most: once its fixtures exist, every client task can run without the server.
2. **Sprint 1 (1.1–1.16):** most of these run in parallel after the foundation.
3. **Sprints 2 and 3:** they share no components, so they can overlap once sprint 1's shared parts are merged.
4. **Server tasks (S1–S10):** run alongside the client. X3 switches each page to the real API when its endpoint is ready.

## Open questions in these briefs

Leave these as `TODO(<question>)` until the project lead answers:

1. **Date format:** for example "28 มิ.ย. 2568" (Thai calendar) or "28 Jun 2025". Affects F6, 1.13, 1.9, 2.3, 2.4.
2. **Page titles and link previews:** a title per page, and `pics[0]` as the image when a link is shared. Not planned yet; no task below.
3. **Uploads:** allowed file types and maximum size (docs/API.md, open questions). Affects S8.
4. **Wording still `<...>`:** the `/join` empty-state message, and the sponsor-benefits text.

---

## Foundation

### F1. Project setup
- **Size:** S · **Depends on:** none · **Owner:** `<...>` · **shared**
- **Read:** FRONTEND.md "Design" (all of it), "Environment"
- **Files:** project config, `app/layout.tsx` shell, global styles and design tokens, `next.config`, `.env.example`
- **Do:**
  - Set up Next.js (App Router) with Tailwind CSS.
  - Add the colour tokens from FRONTEND.md "Colours", dark only, with no light mode, plus the background picture and page width from FRONTEND.md "Design".
  - Load Prompt (headings) and Sarabun (body) with `next/font/google`, using the `thai` and `latin` subsets.
  - Allow `MEDIA_BASE_URL` in `images.remotePatterns`.
- **Done when:**
  - The app builds, and lint and type checks run.
  - A test page shows h1–h3 in Prompt and body text in Sarabun, on `#000`.
  - Add the lint, type check and test commands to AGENTS.md.

### F2. API types, client and fixtures
- **Size:** M · **Depends on:** F1 · **Owner:** `<...>` · **shared**
- **Read:** API.md "Public API", "Filling in data blocks"; DATABASE.md "Blocks", "Full document examples"; FRONTEND.md "API client", "Developing before the server is ready"
- **Files:** `types/api.ts`, `lib/api.ts`, `fixtures/`
- **Do:**
  - Write a type for each public endpoint's response, including every block type with data blocks filled in.
  - In `lib/api.ts`, write one function per endpoint. It runs on the server only and reads `API_URL`.
  - An environment flag switches between the fixtures and the real API.
  - Build fixtures from the DATABASE.md examples, keeping `<...>` as is. Include at least:
    - a hidden project, for the 404 page;
    - a project with `is_yearbook_shown: false`;
    - no open rounds, and some open rounds;
    - a track whose achievement points to a hidden project. The fixture already leaves that achievement out, as the server would.
- **Done when:** every endpoint function returns typed fixture data, and a `404` from the API surfaces as a value the page can turn into `notFound()`.

### F3. Layout and Nav
- **Size:** S · **Depends on:** F1 · **Owner:** `<...>`
- **Read:** FRONTEND.md "Shared (sprint 1)", "How the enrollment site's parts map to this site", "Paths"
- **Files:** `app/layout.tsx`, `components/Nav.tsx`, `public/` (the logo file is added by the project lead)
- **Do:**
  - Logo on the left, linking to `/`. Then Projects, Tracks and Join.
  - The current page's link is light grey (`--accent`) and underlined.
  - All four links show from sprint 1; `/tracks` and `/join` show the 404 page until they exist.
- **Done when:** the Nav works at phone width and with the keyboard.

### F4. Not-found and error pages
- **Size:** S · **Depends on:** F1 · **Owner:** `<...>`
- **Read:** FRONTEND.md "API client"
- **Files:** `app/not-found.tsx`, `app/error.tsx`
- **Done when:** a missing path shows the 404 page, and a thrown error shows the error page. Neither page shows details about the data.

### F5. BlockRenderer
- **Size:** S · **Depends on:** F2 · **Owner:** `<...>` · **shared**
- **Read:** FRONTEND.md "Components", "Blocks from later sprints"; DATABASE.md "Blocks"
- **Files:** `components/BlockRenderer.tsx`, `components/blocks/index.ts`
- **Do:**
  - Map each block `type` to its component.
  - Render nothing for unknown types and for types whose component does not exist yet.
  - Use the block's `id` as its `#anchor`.
- **Done when:** Home's fixture renders without errors, even with sprint 2 and 3 blocks in it.

### F6. Shared helpers
- **Size:** S · **Depends on:** F1 · **Owner:** `<...>` · **shared**
- **Read:** FRONTEND.md "Images"; DATABASE.md "article"
- **Files:** `components/Media.tsx`, `lib/markdown.tsx`, `lib/dates.ts`
- **Do:**
  - **`Media`:** wraps `next/image`, with `alt` required.
  - **Markdown:** renders without raw HTML.
  - **Dates:** one formatting function, for single dates and for ranges (`start_date`–`end_date`). The format is `TODO(date format)`.
- **Done when:** each helper has a test; the Markdown test checks that raw HTML is not rendered.

### F7. Revalidate route
- **Size:** S · **Depends on:** F1 · **Owner:** `<...>`
- **Read:** FRONTEND.md "Keeping pages fresh"; API.md "After a write"
- **Files:** `app/api/revalidate/route.ts`
- **Do:** accept `POST` with a list of paths, check `REVALIDATE_SECRET`, and call `revalidatePath` for each path.
- **Done when:** it answers `401` without the secret, and refreshes the paths with it.

---

## Sprint 1: Home and Project

### 1.1 Hero
- **Size:** M · **Depends on:** F2, F6 · **Owner:** `<...>`
- **Read:** DATABASE.md "hero"; FRONTEND.md "Content blocks"
- **Files:** `components/blocks/Hero.tsx`
- **Do:**
  - `media_kind` decides what to show: an image, a video, or a slideshow.
  - A slideshow shows `media_url`, then each of `slides`, for `slide_seconds` each, or 5 seconds when that is `null`.
  - With reduced motion, show `media_url` only.
  - Put `title`, `subtitle` and `buttons` on top.
- **Done when:** all three kinds render, and reduced motion stops the slideshow.

### 1.2 Article
- **Size:** S · **Depends on:** F6 · **Owner:** `<...>`
- **Read:** DATABASE.md "article"
- **Files:** `components/blocks/Article.tsx`
- **Done when:**
  - `body` renders as Markdown.
  - `image` sits on `image_side` (left, right or top), or is left out when `null`.
  - On a phone, the image stacks above the text.

### 1.3 ImageBlock
- **Size:** S · **Depends on:** F6 · **Owner:** `<...>`
- **Read:** DATABASE.md "image"
- **Files:** `components/blocks/ImageBlock.tsx`
- **Done when:** `size: "large"` runs full width (the team photo), `normal` does not, and `caption` and `credit` show under the image.

### 1.4 Quote
- **Size:** S · **Depends on:** F6 · **Owner:** `<...>`
- **Read:** DATABASE.md "quote"
- **Files:** `components/blocks/Quote.tsx`
- **Done when:** `text`, `who` and `role` show over `background_image` or `background_color`, and the text stays readable on both.

### 1.5 Gallery
- **Size:** S · **Depends on:** F6 · **Owner:** `<...>`
- **Read:** DATABASE.md "gallery"
- **Files:** `components/blocks/Gallery.tsx`
- **Done when:** each item shows its image and `desc`. The Artwork gallery uses the same component.

### 1.6 Video
- **Size:** M · **Depends on:** F2 · **Owner:** `<...>`
- **Read:** DATABASE.md "video"; FRONTEND.md "Embeds"
- **Files:** `components/blocks/Video.tsx`
- **Do:** one embed per `videos[]` item, by `provider` (youtube, tiktok, instagram, drive). Load each only when it scrolls into view. Several videos show as a list, with `title` and `caption`.
- **Done when:** all four providers embed, and no embed loads before it is near the screen.

### 1.7 ButtonBlock
- **Size:** S · **Depends on:** F1 · **Owner:** `<...>`
- **Read:** DATABASE.md "button"; FRONTEND.md "Shapes"
- **Files:** `components/blocks/ButtonBlock.tsx`
- **Done when:**
  - `primary` is light grey (`--accent`) with black text, and `secondary` is the outline style.
  - `align` works.
  - `mailto:` and external links work.

### 1.8 Stats
- **Size:** S · **Depends on:** F1 · **Owner:** `<...>`
- **Read:** DATABASE.md "stats"
- **Files:** `components/blocks/Stats.tsx`
- **Done when:** each item shows `value` (a number or text), `label` and `note`.

### 1.9 Highlights
- **Size:** S · **Depends on:** F6 · **Owner:** `<...>`
- **Read:** DATABASE.md "highlights"; API.md "Filling in data blocks"
- **Files:** `components/blocks/Highlights.tsx`
- **Done when:** each highlight shows `event_name`, `date`, `venue`, `desc` and `pics`, using F6's date format.

### 1.10 Team (list layout)
- **Size:** M · **Depends on:** F6 · **Owner:** `<...>`
- **Read:** DATABASE.md "team", "`team[]`"; API.md "Filling in data blocks"
- **Files:** `components/blocks/Team.tsx`
- **Do:** for `layout: "list"`, group members by department (`dept_name`), each with `name`, `nickname` and `position`. Show `org_chart_image` above when the API sends it. Leave `layout: "yearbook"` to task 3.9.
- **Done when:** the TCOS 2 fixture renders grouped by department.

### 1.11 Sponsors
- **Size:** S · **Depends on:** F6 · **Owner:** `<...>`
- **Read:** DATABASE.md "sponsors", "`sponsors[]`"
- **Files:** `components/blocks/Sponsors.tsx`
- **Done when:**
  - Each sponsor shows its name, plus its logo only when the API sends one.
  - Sponsors are grouped by `tier` when one is set.
  - It works on Home ("Past partners") and on a project page.

### 1.12 Shelf
- **Size:** L · **Depends on:** F2, F6 · **Owner:** `<...>` · **shared**
- **Read:** FRONTEND.md "Shared (sprint 1)" (Shelf); DATABASE.md "projects" block, "Pages and their queries" (Project list); the Project list section of `tcos_ui_flow.drawio`
- **Files:** `components/Shelf.tsx`, `components/blocks/ProjectsBlock.tsx`
- **Do:**
  - One spine per project, using `pics[0]`, newest first by `start_date`.
  - The selected project shows larger in the middle, with its `name` and year. ← and → move the selection, and clicking opens `/projects/<slug>`.
  - Options:
    - the year filter, built from `start_date`;
    - the reverse toggle, which only reorders on screen;
    - a "See all" link to `/projects`.
  - On `/projects` the filter and toggle are on. In the Home `projects` block they are off, with "See all" on.
- **Done when:**
  - The filter and toggle work.
  - Arrow keys and Tab work.
  - With reduced motion, there is no sliding animation.
  - It works at phone width.

### 1.13 ProjectHeader
- **Size:** S · **Depends on:** F6 · **Owner:** `<...>`
- **Read:** FRONTEND.md "Shared (sprint 1)"; API.md `GET /api/projects/:slug`
- **Files:** `components/ProjectHeader.tsx`
- **Done when:** it shows `name`, the date range (or a single date when there is no `end_date`), `venue` when set, and `pics[0]`. The Yearbook button comes in task 3.8.

### 1.14 Page: Home
- **Size:** S · **Depends on:** F3, F5 · **Owner:** `<...>`
- **Files:** `app/page.tsx`
- **Done when:** it renders `GET /api/pages/home` through `BlockRenderer`, and shows 404 when the page is not shown.

### 1.15 Page: Project list
- **Size:** S · **Depends on:** 1.12 · **Owner:** `<...>`
- **Files:** `app/projects/page.tsx`
- **Done when:** it renders `GET /api/projects` as the Shelf with the filter and toggle on. With no projects, it shows an empty shelf, not an error.

### 1.16 Page: Project
- **Size:** S · **Depends on:** 1.13, F5 · **Owner:** `<...>`
- **Files:** `app/projects/[slug]/page.tsx`
- **Done when:** it renders `ProjectHeader`, then the `blocks` from `GET /api/projects/:slug`. A missing or hidden slug shows 404.

---

## Sprint 2: Apply info

### 2.1 Qualifications
- **Size:** S · **Depends on:** F2 · **Owner:** `<...>`
- **Read:** DATABASE.md "`qualifications`"
- **Files:** `components/join/Qualifications.tsx`
- **Done when:** it shows `age_min`–`age_max` (or only the one that is set), `age_note` and `items`.

### 2.2 PositionList
- **Size:** M · **Depends on:** F2 · **Owner:** `<...>`
- **Read:** DATABASE.md "`positions[]`", "`positions[].audition`"
- **Files:** `components/join/PositionList.tsx`
- **Done when:**
  - Each position shows `dept_name`, `unit_name`, `title`, `description` and `requirements`.
  - The portfolio and onsite flags show.
  - When there is an `audition`, it shows the clip brief, maximum minutes, file name, upload method, `pieces` and onsite round.

### 2.3 Timeline
- **Size:** S · **Depends on:** F2 · **Owner:** `<...>`
- **Read:** DATABASE.md "`timeline[]`"
- **Files:** `components/join/Timeline.tsx`
- **Done when:** each event shows its dates (with the time when it has one), `event_name`, `event_description`, and `location` or "online" when `null`.

### 2.4 RoundCard
- **Size:** M · **Depends on:** 2.1–2.3 · **Owner:** `<...>` · **shared**
- **Read:** FRONTEND.md "Sprint 2: Apply info", "How the enrollment site's parts map to this site"; DATABASE.md "`apply`"
- **Files:** `components/join/RoundCard.tsx`
- **Done when:**
  - It shows `poster`, `title` and the project name.
  - It shows `opens_at`–`closes_at`, or `extended_to` instead of `closes_at` when set.
  - It includes 2.1–2.3, and an Apply button to `apply_url`.
  - It matches the enrollment site's card style.

### 2.5 Join block
- **Size:** S · **Depends on:** 2.4 · **Owner:** `<...>`
- **Files:** `components/blocks/Join.tsx`
- **Done when:** it lists the rounds the API sends as RoundCards, or the block's own `empty_text` when there are none.

### 2.6 Page: Join
- **Size:** S · **Depends on:** 2.4 · **Owner:** `<...>`
- **Read:** FRONTEND.md "Sprint 2: Apply info", "Keeping pages fresh"
- **Files:** `app/join/page.tsx`
- **Do:**
  - Show the open rounds from `GET /api/join`, in the order sent (closing soonest first).
  - When there are none, show the empty-state message: one constant at the top of the `Join` component (`components/blocks/Join.tsx`, task 2.5), imported here, set to `<...>` until the wording is decided.
  - Refresh once a day (`revalidate = 86400`).
- **Done when:** both states render, and an empty list never looks like an error.

---

## Sprint 3: Track and Yearbook

### 3.1 TrackList and page `/tracks`
- **Size:** S · **Depends on:** F2 · **Owner:** `<...>`
- **Files:** `components/TrackList.tsx`, `app/tracks/page.tsx`
- **Done when:** there is one row per track (`display_name` and the first line of `desc`), in the order sent, and each row links to `/tracks/<key>`.

### 3.2 TrackCards
- **Size:** S · **Depends on:** F6 · **Owner:** `<...>`
- **Files:** `components/blocks/TrackCards.tsx`
- **Done when:** the Home `tracks` block shows one card per track (`display_name`, `pics[0]`), each linking to `/tracks`.

### 3.3 TrackPopup
- **Size:** M · **Depends on:** F6 · **Owner:** `<...>`
- **Read:** FRONTEND.md "Sprint 3: Track, Yearbook"; DATABASE.md "`tracks`", "Pages and their queries" (Track popup)
- **Files:** `components/TrackPopup.tsx`
- **Done when:**
  - It shows `display_name`, `pics` and `desc`.
  - Each achievement shows `year`, `text`, `pics`, and the project name as plain text, never a link.
  - There is no team list and no open positions.

### 3.4 Popup routes
- **Size:** M · **Depends on:** 3.1, 3.3 · **Owner:** `<...>`
- **Read:** FRONTEND.md "Routes", "Why the track popup has its own route"
- **Files:** `app/tracks/[key]/page.tsx`, `app/tracks/@modal/(.)[key]/page.tsx`, the matching layout and default files
- **Done when:**
  - Clicking a row opens the popup over `/tracks`, at the address `/tracks/<key>`.
  - Back and ✕ close it.
  - A direct link or a refresh shows the same content as a full page.
  - A missing or hidden key shows 404.
  - Focus stays inside the popup while it is open.

### 3.5 YearbookGrid
- **Size:** M · **Depends on:** F6 · **Owner:** `<...>` · **shared**
- **Read:** DATABASE.md "Yearbook"
- **Files:** `components/YearbookGrid.tsx`
- **Done when:**
  - Members are grouped by department (`dept_name`).
  - Each shows `photo`, or a blank avatar when there is no photo, plus `name`, `nickname` and `position`.
  - It works at phone width.

### 3.6 Page: Yearbook
- **Size:** S · **Depends on:** 3.5 · **Owner:** `<...>`
- **Files:** `app/projects/[slug]/yearbook/page.tsx`
- **Done when:** it shows the project `name` and `pics[0]`, then the YearbookGrid. It shows 404 unless the API returns the yearbook.

### 3.7 YearbookCards
- **Size:** S · **Depends on:** F6 · **Owner:** `<...>`
- **Files:** `components/blocks/YearbookCards.tsx`
- **Done when:** the Home `yearbook` block shows one card per project (`name`, `pics[0]`), each linking to `/projects/<slug>/yearbook`.

### 3.8 Yearbook button
- **Size:** S · **Depends on:** 1.13 · **Owner:** `<...>`
- **Files:** `components/ProjectHeader.tsx` (with the 1.13 owner)
- **Done when:** the button shows only when `is_yearbook_shown` is true, and links to `/projects/<slug>/yearbook`.

### 3.9 Team: yearbook layout
- **Size:** S · **Depends on:** 3.5, 1.10 · **Owner:** `<...>`
- **Files:** `components/blocks/Team.tsx` (with the 1.10 owner)
- **Done when:** `layout: "yearbook"` renders through `YearbookGrid`, and `dept_keys` limits the departments shown.

---

## Across all sprints

### X1. Phone width check
- **Size:** S per sprint · **Read:** FRONTEND.md "Done for each sprint"
- **Done when:** every page from that sprint works at phone width and matches its section on `tcos_ui_flow.drawio`.

### X2. Accessibility check
- **Size:** S per sprint
- **Done when:**
  - Every image has `alt`.
  - The Shelf, the track popup and the Nav work with the keyboard.
  - Reduced motion stops the slideshow and the shelf animation.
  - Text contrast passes on the dark background.

### X3. Switch to the real API
- **Size:** S per page · **Depends on:** the page's server endpoint (S3, S4)
- **Done when:** the page renders from the real API with the fixture flag off, and hidden data never appears.

### X4. Tests
- **Size:** M
- **Done when:** tests cover:
  - the Shelf's year filter and reverse toggle;
  - the `/join` empty state;
  - the popup routes (click, direct link, refresh, 404);
  - BlockRenderer skipping unknown types.

---

## Server

### S1. Setup and database helpers
- **Size:** M · **Depends on:** none · **Owner:** `<...>` · **shared** (`db.ts`)
- **Read:** API.md "Parts", "Hosting: Cloudflare Workers", "Environment", "Database access"; DATABASE.md (top)
- **Files:** the Wrangler config, the Worker entry point, `src/app.ts` (Express), `src/db.ts`, `.dev.vars.example`
- **Do:**
  - Set up Express on Workers with `httpServerHandler`, with `nodejs_compat` listed explicitly.
  - Declare the `MEDIA_BUCKET` binding and the vars; list the secrets in `.dev.vars.example` with empty values.
  - Write `db.ts` with the official `mongodb` driver (6.15 or later): the connection, one typed handle per collection, `toObjectId` and `withId`. Types come from the schema, not from `tocs-schema.js`.
  - Run `tcos_schema.mongodb.js` against the database.
- **Done when:**
  - `npx wrangler dev` starts the server locally, and a health route reads from MongoDB.
  - `toObjectId` answers `400` on a bad id, and `withId` adds an `_id`; both have tests.

### S2. Visibility filter
- **Size:** M · **Depends on:** S1 · **Owner:** `<...>` · **shared**
- **Read:** API.md "Parts"; DATABASE.md "Conventions", "`team[]`", "`sponsors[]`"
- **Done when:** one module removes hidden documents and items, `photo` unless `is_photo_allowed`, and `logo` unless `logo_permission`. Every public endpoint uses it, and tests cover each rule.

### S3. Public endpoints
- **Size:** M · **Depends on:** S2 · **Owner:** `<...>`
- **Read:** API.md "Public API"; DATABASE.md "Pages and their queries", "Yearbook"
- **Done when:**
  - All 7 endpoints return the documented shapes.
  - Hidden or missing documents return `404`.
  - `GET /api/join` sorts by the real closing date (`extended_to`, else `closes_at`).
  - The track popup leaves out achievements whose project is hidden.

### S4. Filling in data blocks
- **Size:** M · **Depends on:** S3 · **Owner:** `<...>`
- **Read:** API.md "Filling in data blocks"
- **Done when:**
  - `/api/pages/home` and `/api/projects/:slug` replace every data block with its data.
  - `project_slug: null` means this project on a project page, and all shown projects on Home.

### S5. Admin auth
- **Size:** S · **Depends on:** S1 · **Owner:** `<...>`
- **Read:** API.md "Auth"
- **Done when:**
  - Every `/api/admin/*` route needs a valid JWT signed with `JWT_SECRET` (and not expired, if it has `exp`), checked with `jose`, and answers `401` otherwise.
  - A script makes tokens by hand, also with `jose`.
  - Token expiry is `TODO(token expiry)`.

### S6. Admin CRUD
- **Size:** L · **Depends on:** S5 · **Owner:** `<...>`
- **Read:** API.md "Admin API"
- **Done when:**
  - Every route in the Admin API table works, including the list items by `_id`.
  - `blocks` arrays save whole.
  - Hidden documents and items are returned too.

### S7. Write checks
- **Size:** M · **Depends on:** S6 · **Owner:** `<...>`
- **Read:** API.md "Checks on every write"
- **Done when:** tests cover each check:
  - block `id`s are unique within a page;
  - references point to things that exist;
  - deleting something still referenced returns `409`;
  - renaming a slug or key updates its references;
  - withdrawing photo consent removes `photo` and deletes the file from R2.

### S8. Uploads
- **Size:** M · **Depends on:** S5 · **Owner:** `<...>`
- **Read:** API.md "Uploads"
- **Done when:**
  - Uploads stream through the `MEDIA_BUCKET` binding into the site media bucket (not the finance one), with no disk step and random file names, and return `{ key, url }`.
  - Deleting a file works.
  - File types and size limit are `TODO(uploads)`.

### S9. Revalidate calls
- **Size:** S · **Depends on:** S6, F7 · **Owner:** `<...>`
- **Read:** API.md "After a write"
- **Done when:** every successful write calls `REVALIDATE_URL` with the paths from the table in API.md.

### S10. Deploy to Cloudflare Workers
- **Size:** S · **Depends on:** S1 · **Owner:** `<...>`
- **Read:** API.md "Hosting: Cloudflare Workers", "Environment"
- **Do:**
  - Use the paid Workers plan.
  - Set the secrets with `npx wrangler secret put`.
  - Create the site media bucket and bind it.
  - Set up Atlas network access and a database user limited to `tcos`, as in API.md.
  - Deploy with `npx wrangler deploy`, or connect the repo for deploy on push.
- **Done when:**
  - The deployed Worker answers the public endpoints, and an admin call without a token gets `401`.
  - Add the deploy command to AGENTS.md.
