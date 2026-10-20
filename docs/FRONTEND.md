# TCOS portfolio: client implementation plan

This is the plan for the Next.js client: the public site. The data comes from the server API in [API.md](API.md), and the data model is in [DATABASE.md](DATABASE.md). The page layouts follow the UI flow board "TCOS portfolio – UI flow POC" (`tcos_ui_flow.drawio`, open in diagrams.net). Values not decided yet are `<...>`.

The admin side is out of scope here: for now it is direct calls to the admin API, and a separate admin interface comes later.

**Hosting:** the client runs on Cloudflare Workers through OpenNext (`@opennextjs/cloudflare`). Its environment values are Worker secrets and vars, and `.env.local` / `.dev.vars` for local runs.

## Sprints

| Sprint             | Pages                                                   | Blocks and components                                                                                                    | API                                                                           |
| ------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| 1. Home, Project   | `/`, `/projects`, `/projects/[slug]`                    | Layout, Nav, BlockRenderer, all content blocks, `projects` shelf, `highlights`, `team` (list), `sponsors`, ProjectHeader | `GET /api/pages/home`, `GET /api/projects`, `GET /api/projects/:slug`         |
| 2. Apply info      | `/join`                                                 | `join` block, RoundCard                                                                                                  | `GET /api/join` (plus `join` blocks inside the sprint 1 pages)                |
| 3. Track, Yearbook | `/tracks`, the track popup, `/projects/[slug]/yearbook` | `tracks` and `yearbook` blocks, TrackList, TrackPopup, YearbookGrid, the Yearbook button                                 | `GET /api/tracks`, `GET /api/tracks/:key`, `GET /api/projects/:slug/yearbook` |

`/projects` belongs to sprint 1. The Home shelf and the nav both link to it, and it uses the same Shelf component.

**Blocks from later sprints.** The `join`, `tracks` and `yearbook` blocks may already sit in Home's `blocks` during sprint 1. Until their sprint ships, BlockRenderer renders nothing for them. The rest of the page still works, and nothing in the database has to change.

**Nav links to unbuilt pages.** The Nav shows all four links from sprint 1. `/join` and `/tracks` show the 404 page until their sprints ship.

## Paths

| Path                        | Page                                                                  | Sprint | Calls                              | Not found (404) when                               |
| --------------------------- | --------------------------------------------------------------------- | ------ | ---------------------------------- | -------------------------------------------------- |
| `/`                         | Home                                                                  | 1      | `GET /api/pages/home`              | the `home` page is not shown                       |
| `/projects`                 | Project list (bookshelf)                                              | 1      | `GET /api/projects`                | never; an empty shelf when no project is shown     |
| `/projects/<slug>`          | Project page                                                          | 1      | `GET /api/projects/:slug`          | no project with that `slug`, or it is not shown    |
| `/projects/<slug>/yearbook` | Yearbook                                                              | 3      | `GET /api/projects/:slug/yearbook` | as above, or `is_yearbook_shown` is false          |
| `/join`                     | Apply info (open rounds)                                              | 2      | `GET /api/join`                    | never; shows the empty state when no round is open |
| `/tracks`                   | Track list                                                            | 3      | `GET /api/tracks`                  | never                                              |
| `/tracks/<key>`             | Track popup (over `/tracks`; a full page on a direct link or refresh) | 3      | `GET /api/tracks/:key`             | no track with that `key`, or it is not shown       |
| `/api/revalidate`           | Not a page: the server calls it after a write                         | 1      | (none)                             | (none); answers `401` without `REVALIDATE_SECRET`  |

**Links between pages:**

| From                   | Link                         | To                                              |
| ---------------------- | ---------------------------- | ----------------------------------------------- |
| Nav, on every page     | TCOS, Projects, Tracks, Join | `/`, `/projects`, `/tracks`, `/join`            |
| Home `projects` block  | a spine                      | `/projects/<slug>`                              |
| Home `projects` block  | "See all"                    | `/projects`                                     |
| `/projects`            | a spine                      | `/projects/<slug>`                              |
| Home `tracks` block    | a card                       | `/tracks`                                       |
| Home `join` block      | a round                      | `/join`                                         |
| Home `yearbook` block  | a card                       | `/projects/<slug>/yearbook`                     |
| Project page header    | the Yearbook button          | `/projects/<slug>/yearbook`                     |
| `/tracks`              | a row                        | `/tracks/<key>`                                 |
| Track popup            | ✕                            | `/tracks`                                       |
| Support `button` block | the email button             | `mailto:official_account@thecomingofstages.com` |

`<slug>` is `projects.slug`, and `<key>` is `tracks.key`.

## Routes (Next.js App Router)

```
app/
  layout.tsx                         Nav + page shell
  page.tsx                           /                        sprint 1
  not-found.tsx, error.tsx           404 and error pages      sprint 1
  projects/
    page.tsx                         /projects                sprint 1
    [slug]/
      page.tsx                       /projects/<slug>         sprint 1
      yearbook/page.tsx              /projects/<slug>/yearbook sprint 3
  join/page.tsx                      /join                    sprint 2
  tracks/
    page.tsx                         /tracks                  sprint 3
    [key]/page.tsx                   /tracks/<key>, popup content as a full page (direct link, refresh)  sprint 3
    @modal/(.)[key]/page.tsx         the same, shown as a popup over /tracks  sprint 3
  api/revalidate/route.ts            called by the server after a write  sprint 1
components/
  blocks/                            one component per block type
  ...                                shared components (below)
lib/api.ts                           fetch wrapper for the server API
types/api.ts                         response types, matching API.md
```

**Why the track popup has its own route.** Opening a track goes to `/tracks/<key>`, and Next.js shows it as a popup over the list. Its data is fetched on the Next.js server like every other page:

- the browser never calls the Express server directly, so the server needs no CORS setup;
- a popup can be linked to and survives a refresh.

## Components

### Shared (sprint 1)

| Component       | Does                                                                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Layout`        | Page shell with `Nav`                                                                                                                                                                                                                                  |
| `Nav`           | Static: TCOS (→ `/`), Projects (→ `/projects`), Tracks (→ `/tracks`), Join (→ `/join`)                                                                                                                                                                 |
| `BlockRenderer` | Takes a page's `blocks` and renders the component for each `type`. Skips unknown types and types from sprints not built yet                                                                                                                            |
| `ProjectHeader` | The fixed header on a project page: `name`, `start_date`–`end_date`, `venue`, `pics[0]`. Sprint 3 adds the Yearbook button (only when `is_yearbook_shown`)                                                                                             |
| `Shelf`         | The bookshelf: one spine per project (`pics[0]`), the selected one larger in the middle, ← → to move, click opens the project page. Props turn on the year filter and the reverse toggle (on for `/projects`, off on Home) and a "See all" link (Home) |
| `Media`         | Shows an image from a URL, with `alt`                                                                                                                                                                                                                  |

### Content blocks (sprint 1)

| Block     | Component     | Notes                                                                                                                                                                                                                                                                             |
| --------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hero`    | `Hero`        | `media_kind`: image, video or slideshow. A slideshow runs `media_url` and then `slides`, `slide_seconds` per slide (`null` = the client's default, 5 seconds). When the device asks for reduced motion, it shows `media_url` only. Shows `title`, `subtitle` and `buttons` on top |
| `article` | `Article`     | `body` is Markdown, rendered without raw HTML. `image` goes on `image_side`                                                                                                                                                                                                       |
| `image`   | `ImageBlock`  | `size`: normal, or large (full width, e.g. the team photo). `caption`, `credit`                                                                                                                                                                                                   |
| `quote`   | `Quote`       | `text`, `who`, `role`, `background_image` or `background_color`                                                                                                                                                                                                                   |
| `gallery` | `Gallery`     | `items[]` with `desc` under each. The Artwork gallery uses the same component                                                                                                                                                                                                     |
| `video`   | `Video`       | One embed per `videos[]` item, by `provider` (see [Embeds](#embeds))                                                                                                                                                                                                              |
| `button`  | `ButtonBlock` | `buttons[]` with `style` and `align`; `mailto:` links work as they are                                                                                                                                                                                                            |
| `stats`   | `Stats`       | `items[]`: `value`, `label`, `note`                                                                                                                                                                                                                                               |

### Data blocks

| Block        | Component            | Sprint | Notes                                                                                                                             |
| ------------ | -------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `projects`   | `Shelf`              | 1      | No filters, "See all" → `/projects`                                                                                               |
| `highlights` | `Highlights`         | 1      | `event_name`, `date`, `venue`, `desc`, `pics`                                                                                     |
| `team`       | `Team`               | 1      | `layout: "list"`: grouped by department, with `org_chart_image` when sent. `layout: "yearbook"` reuses `YearbookGrid` in sprint 3 |
| `sponsors`   | `Sponsors`           | 1      | Name, plus the logo when the API sends one                                                                                        |
| `join`       | `Join` + `RoundCard` | 2      | Open rounds. When there are none, the block shows its own `empty_text`                                                            |
| `tracks`     | `TrackCards`         | 3      | `display_name`, `pics[0]` → `/tracks`                                                                                             |
| `yearbook`   | `YearbookCards`      | 3      | `name`, `pics[0]` → `/projects/<slug>/yearbook`                                                                                   |

### Sprint 2: Apply info

| Component    | Does                                                                                                                                                                                                                                                                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RoundCard`  | One open round: `title`, `poster`, `opens_at`–`closes_at` (or `extended_to` when set), project name, `qualifications` (ages, `age_note`, `items`), `positions` (`dept_name`, `unit_name`, `title`, `description`, `requirements`, the portfolio and onsite flags, and `audition` details), `timeline` (`location: null` = online), and the Apply button (`apply_url`) |
| `/join` page | The open rounds, closing soonest first. When none is open, it shows a message written in the client code, kept as one constant at the top of the `Join` component (`components/blocks/Join.tsx`) so it is easy to find and change; the page imports it. (The Home `join` block shows its own `empty_text` instead.) Changing it needs a code change and a deploy                                                                                                                      |

### Sprint 3: Track, Yearbook

| Component       | Does                                                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TrackList`     | `/tracks`: one row per track (`display_name`, first line of `desc`), each opening the popup                                                          |
| `TrackPopup`    | `display_name`, `pics`, `desc`, `achievements` (`year`, `text`, `pics`, project name as plain text, no link). No team list or open positions for now |
| `YearbookGrid`  | Team grouped by department (`dept_name`): photo or a blank avatar, `name`, `nickname`, `position`                                                    |
| Yearbook button | On `ProjectHeader`, only when `is_yearbook_shown`                                                                                                    |

## Integration with the server

### API client

- `lib/api.ts` is one small wrapper around `fetch`.
  - It reads `API_URL` and returns typed data from `types/api.ts`.
  - It runs only on the Next.js server, in server components and route handlers.
  - The browser never calls the Express server.
- A `404` from the API becomes Next.js `notFound()`. That covers hidden projects, and a yearbook that is not turned on.
- Any other error goes to `error.tsx`.
- The client trusts the API's filtering. It never receives hidden items, so it never has to hide anything itself.

### Keeping pages fresh

Home (`/`) renders per request, so it always shows the latest data, and builds need no `API_URL`. The other pages follow the table below.

| What changes                                              | How the client finds out                                                                                                                                                                                         |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| An admin edits data                                       | The server calls `POST /api/revalidate` with the changed paths. The route checks `REVALIDATE_SECRET` and calls `revalidatePath`                                                                                  |
| A round opens or closes (time passes, nothing is written) | `/join`, and pages with a `join` block, also revalidate on a timer: once a day (`revalidate = 86400`). A round that opens or closes during the day can show up to a day late; an admin edit refreshes it at once |

### Environment

| Variable            | What                                                                               |
| ------------------- | ---------------------------------------------------------------------------------- |
| `API_URL`           | The Express server's base URL                                                      |
| `REVALIDATE_SECRET` | The same value as on the server                                                    |
| `MEDIA_BASE_URL`    | The R2 media bucket's public URL, allowed in `next.config` `images.remotePatterns` |
| `USE_FIXTURES`      | `true` serves the fixtures instead of calling `API_URL` (see below)                |

### Images

All uploaded images come from the R2 media bucket at `MEDIA_BASE_URL`. They are shown with `next/image`, so they are resized and lazy-loaded.

### Embeds

| `provider`  | Shown as             |
| ----------- | -------------------- |
| `youtube`   | YouTube embed        |
| `tiktok`    | TikTok embed         |
| `instagram` | Instagram embed      |
| `drive`     | Google Drive preview |

Each one is loaded only when it scrolls into view.

### Developing before the server is ready

API.md is the contract between the two sides.

- **Fixtures:** until an endpoint exists, `lib/api.ts` can return JSON fixtures shaped like its response, built from the examples in DATABASE.md.
- **Placeholders:** fixture values the sources do not give stay `"<...>"`.
- **Switching:** `USE_FIXTURES=true` serves the fixtures; otherwise `lib/api.ts` calls the real `API_URL`.

## Done for each sprint

**Every sprint:**

- Each page renders from the real API, not fixtures.
- Hidden documents return the 404 page.
- Pages work at phone width.
- The page matches its screen on the UI flow board (`tcos_ui_flow.drawio`).

**Sprint 1, Home and Project:**

- Every content block renders.
- The shelf works on Home and on `/projects`, including the year filter and the reverse toggle.
- An admin write refreshes the page through `/api/revalidate`.

**Sprint 2, Apply info:**

- `/join` lists only open rounds, closing soonest first, and shows the empty-state message from the client code when none are open.
- The Home `join` block shows the same rounds.

**Sprint 3, Track and Yearbook:**

- The track popup opens over `/tracks` and also works as a direct link.
- The yearbook shows photos only where the API sends one.
- The Yearbook button appears only when `is_yearbook_shown`.

## Design

**Design rules** (from the project lead, 13 Oct 2026). They come first; the rest of this section spells them out.

- **Fonts:** Prompt for headings, Sarabun for articles and long text.
- **Background:** one picture fills the whole window, behind every page, under a `#000` layer at 75% opacity.
- **Page width:** content is 90% of the viewport width on phones, and 80% from 768px up. No maximum.
- **Text colours:** white and light grey. **Gold** (`#d8b85a`) is the accent: the active nav link, primary buttons and badges.
- **One stylesheet:** every colour, font family and font size is a token in `apps/client/app/globals.css`, and nothing else is used (see AGENTS.md).

Layout, type sizes and shapes are taken from the enrollment site, [enroll.thecomingofstages.com](https://enroll.thecomingofstages.com/), as it rendered on 12 Oct 2026, so both TCOS sites look like one family; including its gold accent. Dark only: no light mode. Greys are Tailwind CSS v4's default palette.

### Colours

| Token             | Value                         | Used for                                                                                 |
| ----------------- | ----------------------------- | ---------------------------------------------------------------------------------------- |
| `--background`    | `#000000`                     | Page background, under the background picture                                            |
| `--overlay`       | `#000000` at 75% opacity      | The layer over the background picture                                                    |
| `--foreground`    | `#ffffff`                     | Main text, headings, card titles                                                         |
| `--accent`        | `#d8b85a` (gold)              | Accent: the active nav link and its underline, primary buttons, badges, secondary button outlines |
| `--accent-hover`  | `#e5b83b`                     | Accent on hover                                                                          |
| `--muted`         | Tailwind `zinc-400` (`#a1a1aa`) | Light grey text: labels, captions, dates, nav links that are not the current page      |
| `--card-bg`       | `#1a1a1a`                     | Cards                                                                                    |
| `--border`        | Tailwind `zinc-800`           | Card borders, dividers                                                                   |
| `--green`         | `#acd8a7`                     | Success states                                                                           |
| `--red`           | `#ffb4ab`                     | Closed states                                                                            |

On a primary button, the text is `--background` (black) on `--accent` (gold).

### Background picture

- One site-wide image at `public/background.jpg` (TODO(background image): the file is not added yet; until then the page is plain `--background`).
- It covers the whole window (`background-size: cover`) and stays fixed while the page scrolls, with the `--overlay` layer on top so text stays readable.

### Page width

| Viewport           | Content width          |
| ------------------ | ---------------------- |
| below 768px        | 90% of viewport width  |
| 768px and wider    | 80% of viewport width  |

The Nav and every page use the same width, centred.

### Type

| Use                              | Font    | Size and weight (from the enrollment site) |
| -------------------------------- | ------- | ------------------------------------------ |
| Page title (h1)                  | Prompt  | 36px, 800                                  |
| Section heading (h2)             | Prompt  | 30px, 700                                  |
| Card title (h3)                  | Prompt  | 20px, 600                                  |
| Body text, UI text, buttons, nav | Sarabun | 16–18px                                    |

- Load both with `next/font/google`, with the `thai` and `latin` subsets.
- The enrollment site uses Geist for body text. Geist has no Thai letters, so this site uses Sarabun instead; most of its text is Thai.

### Shapes

- Buttons: 2px corners.
- Cards: 4–6px corners.
- Nav links: 8px corners.
- Cards are `--card-bg` with a `--border` border.
- The image sits on top, edge to edge. A small `--accent` badge sits on the image's top-right corner when a card needs one.

### How the enrollment site's parts map to this site

| Enrollment site                                                                             | Here                                                                                                              |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Top bar: logo left, links in the middle (icon + label, the current one gold and underlined) | `Nav`: the same logo (`public/logo.png`), then Projects, Tracks, Join; the current one gold (`--accent`) and underlined |
| Activity card: poster image, gold price badge, title, progress bar, full-width button       | `RoundCard` (poster, title, dates, Apply button), `TrackCards` and `YearbookCards`                                |
| Full-width gold "More Info" button                                                          | Primary `button` style (`--accent`)                                                                                |
| Red "Registration Ended" button                                                             | Not needed: `/join` shows only open rounds                                                                        |
