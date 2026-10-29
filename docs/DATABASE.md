# TCOS portfolio database

MongoDB, 4 collections: 3 for data and `pages` for the layout of pages that are not a project. The setup script is [tcos_schema.mongodb.js](../tcos_schema.mongodb.js).

```bash
mongosh "<connection string>/tcos" tcos_schema.mongodb.js
```

| Collection | One document per                                                                     | Used by                                    |
| ---------- | ------------------------------------------------------------------------------------ | ------------------------------------------ |
| `projects` | project (TCOS 1, TCOS 2, RPM 1, HOUSE of TCOS, To Write A Life, RPM Club, RPM 2 ...) | Home, project list, project page, yearbook |
| `tracks`   | สายงาน, a department that lasts across years                                         | Tracks page (`/tracks`) and its popup (`/tracks/<key>`) |
| `apply`    | recruitment round (display only)                                                     | Join page, `join` blocks on Home and project pages |
| `pages`    | page that is not a project (Home now)                                                | Home                                       |

Every page is built from an ordered list of blocks. See [Blocks](#blocks-block_component).

## How they connect

```
tracks.key ◄──────── projects.team[].dept_key
     ▲                    projects.slug ◄──── tracks.achievements[].project_slug
     │                         ▲
     └──── apply.positions[].dept_key     apply.project_slug
```

- References are by string key (`slug`, `key`), not ObjectId, so they read clearly in the admin and in URLs.
- The team is stored once, inside `projects`. `dept_key` groups a project's own team (team blocks, yearbook). The site does not yet join tracks to projects: department names and team structure vary between projects, so the track popup lists no people and links to no project.
- Everything a project page shows (team, sponsors, highlights) is embedded in the project document. Each list is short and always read with its project.

## Conventions

- **`is_shown`** is on every document and every listed item: projects, tracks, apply rounds, pages, blocks, team members, sponsors, highlights, track achievements, apply positions and timeline events. The site shows a document or item **only when `is_shown` is `true`**. It is required, so a missing flag is a validation error, not a silent hide. Small sub-lists (gallery images, buttons, stat items, videos) follow their block.
- **`_id` on list items:** team members, sponsors, highlights, track achievements, apply positions and timeline events each carry a required `_id` (ObjectId), so the admin API can edit one item by id. The server adds it to new items, and import scripts must set it too, with `new ObjectId()`. Block sub-lists (gallery images, buttons, stat items, videos) have none: a page's blocks are saved whole.
- Every collection and listed item rejects fields it does not list (`additionalProperties: false`), so removed or renamed fields cannot linger.
- Field names are `snake_case`. The camelCase words in the script (`bsonType`, `additionalProperties`, `createCollection` ...) are MongoDB's own and must stay.
- Dates are BSON `Date`, and may carry a time. A date without a time is stored as midnight UTC (what `new Date("2025-06-28")` gives); the site shows a time only when it is not midnight UTC.
- `pics`, `logo`, `poster`, `photo`, `media_url`, `slides` and `org_chart_image` hold URLs.
- Text is Thai-first plain strings. English is an open decision (see the end).
- Validators run with `validationLevel: "moderate"`. Switch to `"strict"` once the data is clean.

---

## `projects`

| Field               | Type              | Required | Description                                                                                |
| ------------------- | ----------------- | -------- | ------------------------------------------------------------------------------------------ |
| `slug`              | string            | yes      | URL key, unique. e.g. `tcos-2-the-hidden-saloon`                                           |
| `name`              | string            | yes      | Project name as announced                                                                  |
| `type`              | enum              | yes      | `stage_play`, `mini_concert`, `camp`, `club`, `workshop`, `event`, `central_team`          |
| `status`            | enum              | yes      | `upcoming`, `recruiting`, `in_progress`, `completed`, `cancelled`                          |
| `start_date`        | date              | yes      | First show, camp day or activity. Required: the bookshelf sorts by it and the year filter uses it |
| `end_date`          | date or null      |          | Last show, camp day or activity                                                            |
| `venue`             | string or null    |          | Main venue. A project with several venues (RPM Club) puts each one in `highlights[].venue` |
| `summary`           | string            |          | One or two lines for project cards and the project list. Page text goes in article blocks  |
| `org_chart_image`   | string or null    |          | Org chart image URL                                                                        |
| `pics`              | string[]          |          | Image URLs, e.g. for cards                                                                 |
| `team`              | object[]          |          | Who did what. See below                                                                    |
| `sponsors`          | object[]          |          | See below                                                                                  |
| `highlights`        | object[]          |          | Events within the project. See below                                                       |
| `blocks`            | block_component[] |          | The project page layout. See [Blocks](#blocks-block_component)                             |
| `is_yearbook_shown` | bool              |          | Turns on `/projects/<slug>/yearbook`, its button on the project page, and the project's card in the `yearbook` block. Leave `false` for projects without a yearbook |
| `is_shown`          | bool              | yes      |                                                                                            |

**`team[]`**: one entry per person per role. It also feeds the [Yearbook](#yearbook). A `photo` is rejected unless `is_photo_allowed` is `true`.

| Field              | Type   | Required | Description                                                                                                                                                             |
| ------------------ | ------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`             | string | yes      | Full name, first name and surname in one string, shown as is                                                                                                            |
| `nickname`         | string |          |                                                                                                                                                                         |
| `dept_key`         | string | yes      | Matches `tracks.key`                                                                                                                                                    |
| `dept_name`        | string |          | Department name used that year (names change every year)                                                                                                                |
| `position`         | string | yes      | e.g. Project Manager, Copywriter                                                                                                                                        |
| `photo`            | string |          | Yearbook portrait URL. Only accepted when `is_photo_allowed` is `true`                                                                                                  |
| `is_photo_allowed` | bool   |          | Set `true` only after the person agrees, and their guardian for a minor. To withdraw: set `false` and `$unset` `photo`                                                  |
| `is_shown`         | bool   | yes      | Also the name consent: set `true` only after the person agrees, and their guardian for a minor. `false` hides the person everywhere: team blocks, yearbook |

**`sponsors[]`**

| Field             | Type           | Required | Description                                                                |
| ----------------- | -------------- | -------- | -------------------------------------------------------------------------- |
| `name`            | string         | yes      | Organisation name                                                          |
| `logo`            | string or null |          | Logo URL                                                                   |
| `logo_permission` | bool           |          | Show the logo only when `true`                                             |
| `tier`            | string or null |          | e.g. Official Sponsor, Main Sponsor, Co-Sponsor (the TCOS 2 package names) |
| `is_shown`        | bool           | yes      |                                                                            |

**`highlights[]`**

| Field        | Type           | Required | Description                              |
| ------------ | -------------- | -------- | ---------------------------------------- |
| `event_name` | string         | yes      | e.g. a show, a camp day, an RPM Club day |
| `date`       | date or null   |          |                                          |
| `venue`      | string or null |          |                                          |
| `desc`       | string         |          |                                          |
| `pics`       | string[]       |          |                                          |
| `is_shown`   | bool           | yes      |                                          |

**Indexes**: `slug` unique · `{ is_shown, start_date: -1 }` · `is_yearbook_shown` · `status`

---

## `tracks` (สายงาน)

| Field          | Type     | Required | Description                                                                                                   |
| -------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `key`          | string   | yes      | Unique, stable key. Praow named six: `production`, `event`, `film`, `it`, `marketing`, `finance` (to confirm). Also the popup's URL, `/tracks/<key>`, so keep it lowercase and URL-safe; renaming it breaks shared links |
| `display_name` | string   | yes      | Name shown on the site                                                                                        |
| `desc`         | string   |          | What the track does                                                                                           |
| `pics`         | string[] |          |                                                                                                               |
| `achievements` | object[] |          | See below                                                                                                     |
| `order`        | int      |          | Display order                                                                                                 |
| `is_shown`     | bool     | yes      |                                                                                                               |

**`achievements[]`**

| Field          | Type        | Required | Description                             |
| -------------- | ----------- | -------- | --------------------------------------- |
| `project_slug` | string      | yes      | Matches `projects.slug`. Shown as the project's name, not as a link, for now |
| `year`         | int or null |          |                                         |
| `text`         | string      | yes      | What the track achieved on that project |
| `pics`         | string[]    |          |                                         |
| `is_shown`     | bool        | yes      |                                         |

**Indexes**: `key` unique

---

## `apply`

One document per recruitment round, **for display only**. It replaces the รายละเอียดเพิ่มเติม PDFs, whose QR codes and folder links have gone dead. Applications are handled elsewhere (Google Forms now, your separate project later), so no applicant data is stored here.

There is no `status` field. A round is **open** when `is_shown` is `true` and today is between `opens_at` and `extended_to` (or `closes_at` when there is no extension).

| Field            | Type           | Required | Description                                                         |
| ---------------- | -------------- | -------- | ------------------------------------------------------------------- |
| `project_slug`   | string or null |          | Matches `projects.slug`. `null` for a round not tied to one project |
| `title`          | string         | yes      |                                                                     |
| `opens_at`       | date           | yes      |                                                                     |
| `closes_at`      | date           | yes      |                                                                     |
| `extended_to`    | date or null   |          | e.g. RPM Club staff: closed 16 Apr 2026, extended to 23 Apr         |
| `qualifications` | object         |          | See below                                                           |
| `positions`      | object[]       | yes      | See below                                                           |
| `timeline`       | object[]       |          | See below                                                           |
| `apply_url`      | string or null |          | Google Form                                                         |
| `poster`         | string or null |          | Recruitment poster image                                            |
| `is_shown`       | bool           | yes      |                                                                     |

**`qualifications`**

| Field      | Type           | Description                                                                                          |
| ---------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| `age_min`  | int or null    | Differs by round and role (14–22, 16–22, 16–20, 15–21 ... in the sources)                            |
| `age_max`  | int or null    |                                                                                                      |
| `age_note` | string or null | e.g. "or M.4 to Year 4" (2026 IT round)                                                              |
| `items`    | string[]       | Shared text for the round (goals, compromise, daring to make mistakes, eagerness to learn, teamwork) |

**`positions[]`**

| Field                | Type           | Required | Description                            |
| -------------------- | -------------- | -------- | -------------------------------------- |
| `dept_key`           | string         | yes      | Matches `tracks.key`                   |
| `dept_name`          | string         |          | ฝ่าย as named in this round            |
| `unit_name`          | string or null |          | แผนก, when the round lists one         |
| `title`              | string         | yes      | Position                               |
| `description`        | string         |          |                                        |
| `requirements`       | string[]       |          | Role-specific requirements             |
| `portfolio_required` | bool           |          | e.g. graphics                          |
| `onsite_required`    | bool           |          | Must be able to work onsite in Bangkok |
| `audition`           | object         |          | Performers and MCs only. See below     |
| `is_shown`           | bool           | yes      |                                        |

**`positions[].audition`**

| Field              | Type        | Description                                                                 |
| ------------------ | ----------- | --------------------------------------------------------------------------- |
| `clip_required`    | bool        |                                                                             |
| `clip_brief`       | string      | e.g. MC: a clip introducing TCOS (who, what, why), plus a self-introduction |
| `clip_max_minutes` | int or null | e.g. 5                                                                      |
| `clip_file_name`   | string      | e.g. `เต้นเดี่ยว-ชื่อจริง-ชื่อเล่น`, `พิธีกร_ชื่อจริง-นามสกุล_ชื่อเล่น`     |
| `clip_upload`      | string      | e.g. public Google Drive link                                               |
| `pieces`           | string[]    | Songs or monologues to choose from                                          |
| `onsite`           | bool        | Onsite audition after the clip round                                        |

**`timeline[]`**: one event per step of the round (apply, shortlist, interview, results, first meet ...).

| Field               | Type           | Required | Description                          |
| ------------------- | -------------- | -------- | ------------------------------------ |
| `start_date`        | date           | yes      | May include the time                 |
| `end_date`          | date or null   |          | For events that span days            |
| `event_name`        | string         | yes      | e.g. Interview                       |
| `event_description` | string         |          | e.g. Google Meet, with a make-up day |
| `location`          | string or null |          | `null` = online. e.g. Casa Sardine   |
| `is_shown`          | bool           | yes      |                                      |

**Indexes**: `{ project_slug, opens_at: -1 }` · `{ is_shown, opens_at, closes_at }` · `positions.dept_key`

---

## `pages`

A project page's layout lives in `projects.blocks`. Home is not a project, so its block list needs its own place: that is `pages`. Today it holds one document, `home`. Other non-project pages (About, Support) can be added later if they need blocks.

| Field        | Type              | Required | Description         |
| ------------ | ----------------- | -------- | ------------------- |
| `key`        | string            | yes      | Unique, e.g. `home` |
| `title`      | string            | yes      |                     |
| `blocks`     | block_component[] | yes      | The page layout     |
| `updated_at` | date              |          |                     |
| `is_shown`   | bool              | yes      |                     |

**Indexes**: `key` unique

---

## Blocks (`block_component`)

A page is an ordered `blocks[]` array, stored in `projects.blocks` for project pages and in `pages.blocks` for Home. A project page always starts with a fixed header built from the project's own fields (see [Pages and their queries](#pages-and-their-queries)); its `blocks` follow below. Array order is display order. The validator accepts exactly one block shape per item (`oneOf`) and rejects unknown fields.

**Two kinds**

- **Content blocks** hold their own content: hero, article, image, quote, gallery, video, button, stats.
- **Data blocks** hold no content, only a pointer to the structured fields, so the data lives in one place: highlights, team, sponsors, join, plus the card lists projects, tracks and yearbook.
  - `project_slug: null` means the page's own project.
  - On Home, `project_slug: null` means all shown projects.
  - Data blocks only ever show items whose own `is_shown` is `true`.

**Fields on every block**

| Field      | Type           | Required | Description                                                                                                              |
| ---------- | -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `id`       | string         | yes      | Unique within the page; also the `#anchor`. The editor gives new blocks a UUID v7; older blocks keep readable ids (e.g. `partners`, `contact`). The app checks uniqueness, `$jsonSchema` cannot |
| `type`     | enum           | yes      | One of the 15 types below                                                                                                |
| `title`    | string or null |          | Optional section heading                                                                                                 |
| `is_shown` | bool           | yes      | `false` keeps the block in the layout but does not show it                                                               |

**Content blocks**

| `type`    | Fields (required in bold)                                                                         | Use                                                         |
| --------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `hero`    | **`media_url`**, `subtitle`, `media_kind` (image, video, slideshow), `slides[]`, `slide_seconds`, `buttons[]` | Top of Home. A project page starts with its fixed header instead |
| `article` | **`body`** (Markdown), `image`, `image_side` (left, right, top)                                   | Text sections: about, project story, Support on Home (including the overall sponsor benefits) |
| `image`   | **`url`**, `alt`, `caption`, `credit`, `size` (normal, large)                                     | One image; `large` = full width, e.g. the whole team photo |
| `quote`   | **`text`**, **`who`**, `role`, `background_image`, `background_color`                             | Quote with background                                       |
| `gallery` | **`items[]`**: **`url`**, `alt`, `desc`                                                           | Many images, each with a description                        |
| `video`   | **`videos[]`**: **`url`**, **`provider`** (youtube, tiktok, instagram, drive), `title`, `caption` | One video or a series, e.g. documentary episodes on YouTube |
| `button`  | **`buttons[]`**: **`label`**, **`url`**, `style` (primary, secondary); `align` (left, center)     | Tickets, donate, LINE, apply, contact links                 |
| `stats`   | **`items[]`**: **`label`**, **`value`** (number or text), `note`                                  | Confirmed numbers, e.g. members, shows                      |

**Data blocks**

| `type`       | Fields                                                                                   | Reads                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `highlights` | `project_slug`, `limit`                                                                  | `projects.highlights`                                                                              |
| `team`       | `project_slug`, `dept_keys[]` (empty = all), `show_org_chart`, `layout` (list, yearbook) | `projects.team`, `projects.org_chart_image`. `yearbook` shows the photo grid grouped by department |
| `sponsors`   | `project_slug`, `tiers[]` (empty = all)                                                  | `projects.sponsors`; logos only where `logo_permission` is true                                    |
| `join`       | `project_slug`, `empty_text`                                                             | `apply` rounds open today; `empty_text` when none is open                                          |
| `projects`   | `limit`                                                                                  | Shown `projects`, newest first, as the bookshelf (same component as `/projects`, without filters). Spine: `pics[0]`; each links to the project page |
| `tracks`     | (none)                                                                                   | Shown `tracks`, by `order`. Cards: `display_name`, `pics[0]`; each links to `/tracks`             |
| `yearbook`   | `limit`                                                                                  | Shown `projects` where `is_yearbook_shown`, newest first. Cards link to that project's yearbook    |

### Block examples

Values from the sources are real (see [tcos_facts.csv](../tcos_facts.csv) and [tcos_quotes.csv](../tcos_quotes.csv)). Anything the sources do not give is `"<...>"`. Every example below passes the schema's validator.

#### `hero`: the top of a page

```json
{
  "id": "hero",
  "type": "hero",
  "is_shown": true,
  "title": "<...>",
  "subtitle": "<...>",
  "media_url": "<cover image URL>",
  "media_kind": "image",
  "buttons": [{ "label": "<...>", "url": "/join", "style": "primary" }]
}
```

Shows a full-width image (or a video when `media_kind` is `video`) with the title, subtitle and buttons on top.

For a slideshow, set `media_kind` to `slideshow`. `media_url` is the first slide, and `slides` lists the images after it, in order. `slide_seconds` sets how long each slide shows; `null` uses the app's default. When the visitor's device asks for reduced motion, the hero shows `media_url` only.

```json
{
  "id": "hero",
  "type": "hero",
  "is_shown": true,
  "title": "<...>",
  "subtitle": "<...>",
  "media_url": "<first slide URL>",
  "media_kind": "slideshow",
  "slides": ["<slide URL>", "<slide URL>"],
  "slide_seconds": null,
  "buttons": [{ "label": "<...>", "url": "/join", "style": "primary" }]
}
```

#### `article`: a text section

```json
{
  "id": "about",
  "type": "article",
  "is_shown": true,
  "title": "<...>",
  "body": "<Markdown text>",
  "image": "<image URL>",
  "image_side": "right"
}
```

`body` is Markdown, so headings, lists and links work. The image sits on the side named in `image_side`. Leave `image` out for text only.

#### `image`: one picture

```json
{
  "id": "set-photo",
  "type": "image",
  "is_shown": true,
  "url": "<image URL>",
  "alt": "<what the picture shows, for screen readers>",
  "caption": "<...>",
  "credit": "<photographer>"
}
```

For the team photo on a project page, add `"size": "large"`: the picture runs full width. Team photos were called the most important part of a project page in the meeting (01:26).

#### `quote`: a quote with a background

```json
{
  "id": "quote-kan",
  "type": "quote",
  "is_shown": true,
  "text": "มันส์ เฟรนลี่ สนุกแน่นอน ขอให้โชคดีครับทุกคน มีอะไรก็ใส่ให้สุด คิดอะไรไม่ออก ก็ลองยิ้มเข้าไว้ เดี๋ยวมันก็มาเอง :)",
  "who": "กานต์",
  "role": "ทีมโฆษณา (Advertising)",
  "background_image": "<image URL>",
  "background_color": null
}
```

From tcos_quotes.csv (TCOS 2). Use `background_image` or `background_color`. Quotes are stored only in `quote` blocks, one block per quote, on the page that shows it. [tcos_quotes.csv](../tcos_quotes.csv) maps to it directly (`quote` → `text`, `who`, `role`; `project` → that project's `blocks`). `who` is the speaker's name as text, not linked to `team`, because speakers include guests.

#### `gallery`: many images, each with a description

```json
{
  "id": "gallery",
  "type": "gallery",
  "is_shown": true,
  "title": "<...>",
  "items": [
    {
      "url": "<image URL>",
      "alt": "<...>",
      "desc": "<what happened in this photo>"
    },
    { "url": "<image URL>", "alt": "<...>", "desc": "<...>" }
  ]
}
```

#### `video`: one video or a documentary series

```json
{
  "id": "documentary",
  "type": "video",
  "is_shown": true,
  "title": "<...>",
  "videos": [
    {
      "url": "https://www.youtube.com/watch?v=<id>",
      "provider": "youtube",
      "title": "<episode 1>",
      "caption": "<...>"
    },
    {
      "url": "https://www.youtube.com/watch?v=<id>",
      "provider": "youtube",
      "title": "<episode 2>",
      "caption": "<...>"
    }
  ]
}
```

One video is a list of one. Several videos show as a playlist, e.g. a documentary's episodes from the YouTube channel @TheComingofStages.

#### `button`: links as buttons

```json
{
  "id": "contact",
  "type": "button",
  "is_shown": true,
  "title": "<...>",
  "align": "center",
  "buttons": [
    {
      "label": "Email",
      "url": "mailto:official_account@thecomingofstages.com",
      "style": "primary"
    },
    {
      "label": "Instagram",
      "url": "https://www.instagram.com/thecomingofstages",
      "style": "secondary"
    },
    {
      "label": "TikTok",
      "url": "https://www.tiktok.com/@thecomingofstages",
      "style": "secondary"
    },
    {
      "label": "YouTube",
      "url": "https://www.youtube.com/@TheComingofStages",
      "style": "secondary"
    }
  ]
}
```

A contact section, for example. The same block works for tickets, donations, LINE, or the sponsor email in Support on Home.

#### `stats`: numbers

```json
{
  "id": "numbers",
  "type": "stats",
  "is_shown": true,
  "items": [
    { "label": "Members", "value": 306 },
    { "label": "Shows", "value": 4 }
  ]
}
```

TCOS 2 figures that two sources agree on. Leave internal or conflicting numbers out until confirmed.

#### `highlights`: data from `projects.highlights`

```json
{
  "id": "highlights",
  "type": "highlights",
  "is_shown": true,
  "project_slug": null,
  "limit": 6
}
```

On a project page this shows that project's shown highlights, up to `limit`. On Home it shows the latest highlights across all shown projects. Set `project_slug` to show one other project's highlights.

#### `team`: data from `projects.team`

```json
{
  "id": "team",
  "type": "team",
  "is_shown": true,
  "project_slug": null,
  "dept_keys": [],
  "show_org_chart": true,
  "layout": "list"
}
```

```json
{
  "id": "yearbook",
  "type": "team",
  "is_shown": true,
  "project_slug": null,
  "dept_keys": [],
  "show_org_chart": false,
  "layout": "yearbook"
}
```

`list` shows name, nickname and position under each department, with the org chart above. `yearbook` shows the photo grid grouped by department, with a photo only where `is_photo_allowed`. Put `["it"]` in `dept_keys` to show one department.

#### `sponsors`: data from `projects.sponsors`

```json
{
  "id": "partners",
  "type": "sponsors",
  "is_shown": true,
  "title": "<...>",
  "project_slug": null,
  "tiers": []
}
```

On Home this is the Partners section: every shown sponsor across shown projects, logos only where `logo_permission` is true. Put `["Official Sponsor", "Main Sponsor"]` in `tiers` to show the top tiers only.

#### `join`: data from `apply`

```json
{
  "id": "join",
  "type": "join",
  "is_shown": true,
  "project_slug": null,
  "empty_text": "<...>"
}
```

Shows rounds open today, with their positions, timeline and apply link. On a project page, only that project's rounds. On Home, all of them. When nothing is open it shows `empty_text`.

#### `projects`: project cards

```json
{ "id": "projects", "type": "projects", "is_shown": true, "title": "<...>", "limit": null }
```

The PJ section on Home. It renders the same bookshelf component as the project list (`/projects`), without the year filter and order toggle: one spine per shown project, newest first, up to `limit`, plus a "See all" link to `/projects`. Clicking a spine opens the project page. `limit: null` shows all of them.

#### `tracks`: department cards

```json
{ "id": "tracks", "type": "tracks", "is_shown": true, "title": "<...>" }
```

The Tracks section on Home: one card per shown track, in `order`, linking to the Tracks page (`/tracks`). It has no settings of its own: which tracks appear and in what order is set on the `tracks` documents.

#### `yearbook`: yearbook cards by project

```json
{ "id": "yearbook-list", "type": "yearbook", "is_shown": true, "title": "<...>", "limit": null }
```

The yearbook section on Home: one card per shown project where `is_yearbook_shown` is `true`, newest first, each linking to that project's yearbook. For the members themselves, use a `team` block with `layout: "yearbook"`.

---

## Yearbook

**What the meeting asked for** (transcript is auto-generated, so check the timestamps):

| Time        | Point                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 00:35–00:59 | Praow's first idea for the site was a Year Book of who was in TCOS each year, possibly split by department                                              |
| 00:59–01:07 | One photo per person, facing the camera, like a school-class yearbook, with name and department. Members should see their own name and face on the site |
| 01:26       | Team photos are the most important part of a project page                                                                                               |
| 01:33       | The yearbook is split by project and sits in the project zone                                                                                           |
| 01:35       | Ordered by project, then department, with real name and nickname. Reachable both from the Projects menu and as its own page                             |

**How it is built**

- **No new collection.** The yearbook is a view of `projects.team`, using `name` (full name), `nickname`, `photo` and `is_photo_allowed`.
- **Its own page, per project:** `/projects/<slug>/yearbook`, as in the UI sketch. It exists only where `is_yearbook_shown` is `true`; otherwise the route returns 404.
- **Two ways in, one data source:**
  - The Yearbook button on the project page (shown only when `is_yearbook_shown` is `true`).
  - The `yearbook` block on Home: one card per project with a yearbook.
- A `team` block with `layout: "yearbook"` can also put the same photo grid inside a page.
- **Photos** are shown only where `is_photo_allowed` is `true`. The validator rejects a `photo` on any entry that is not allowed, so a photo cannot be stored before consent. Everyone else appears without a photo.
- **Collecting consent:**
  - **Two switches per person:** `is_shown` for the name and nickname, `is_photo_allowed` for the photo. Both stay `false` until the person agrees, and their guardian for a minor.
  - **New members:** add both questions, with guardian consent for minors, to the confirm Google Form that every recruitment round already uses.
  - **Past projects:** ask again. Agreeing to a printed programme book is not agreeing to a public website.

```js
// /projects/<slug>/yearbook: one project's shown team, grouped by department, photos only where allowed
db.projects.aggregate([
  { $match: { slug: SLUG, is_shown: true, is_yearbook_shown: true } },
  { $unwind: "$team" },
  { $match: { "team.is_shown": true } },
  {
    $group: {
      _id: { dept_key: "$team.dept_key", dept_name: "$team.dept_name" },
      members: {
        $push: {
          name: "$team.name",
          nickname: "$team.nickname",
          position: "$team.position",
          photo: {
            $cond: [
              { $eq: ["$team.is_photo_allowed", true] },
              "$team.photo",
              null,
            ],
          },
        },
      },
    },
  },
  { $sort: { "_id.dept_name": 1 } },
]);
```

---

## Pages and their queries

Every query filters on `is_shown: true`, for the document and for the items it lists.

| Page                          | Query                                                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                          | `pages` where `key: "home"`, then one query per data block (`projects`, `yearbook`, `highlights`, `sponsors` read shown `projects`; `tracks` reads shown `tracks`; `join` reads open `apply` rounds) |
| Project list (`/projects`)    | Bookshelf: one spine per shown project, newest first by `start_date`, with a toggle to reverse it (on screen, no query change). Year filter from `start_date`. The selected project shows `name`, year and `pics[0]`, and opens the project page |
| Project page (`/projects/<slug>`) | one `projects` document by `slug`. Fixed header: `name`, `start_date`–`end_date`, `venue`, `pics[0]`, and a Yearbook button when `is_yearbook_shown`. Below it, `blocks` in order. Plus `apply` where `project_slug` matches for a `join` block |
| Tracks (`/tracks`)            | shown `tracks`, by `order`; one row per track                                                                                                 |
| Track popup (`/tracks/<key>`, shown over `/tracks`) | one `tracks` document by `key`; a missing or hidden key returns 404. Each track has its own link, so it can be shared, and refresh and Back work. Shows `display_name`, `desc`, `pics`, shown `achievements` (project named as text, no link; an achievement whose project is not shown is hidden). No team list and no open positions for now |
| Join (`/join`)                | `apply` rounds open today, closing soonest first: `title`, `poster`, dates, `qualifications`, shown `positions` and `timeline`, `apply_url`. Linked from the nav and the Home `join` block |
| Yearbook (`/projects/<slug>/yearbook`) | one project's shown `team`, grouped by department; photos only where `is_photo_allowed`                                                       |

```js
// Join page: rounds open today (NOW), closing soonest first.
// A round closes at extended_to when it is set, else at closes_at.
db.apply.aggregate([
  { $match: { is_shown: true, opens_at: { $lte: NOW } } },
  { $addFields: { closes_on: { $ifNull: ["$extended_to", "$closes_at"] } } },
  { $match: { closes_on: { $gte: NOW } } },
  { $sort: { closes_on: 1 } },
  { $project: { closes_on: 0 } },
]);
```

## Full document examples

Dates are shown as strings for readability. In the database they are `Date` values. Anything not in the sources is `"<...>"`. These pass the schema's validator.

**A project**

```json
{
  "slug": "tcos-2-the-hidden-saloon",
  "name": "ทำนองของสายฝน : The Hidden Saloon The Musical",
  "type": "stage_play",
  "status": "completed",
  "start_date": "2025-06-28",
  "end_date": "2025-06-29",
  "venue": "Lido Connect Hall 2",
  "summary": "<...>",
  "org_chart_image": "<...>",
  "pics": [],
  "team": [
    {
      "_id": "<ObjectId>",
      "name": "<first name surname>",
      "nickname": "กานต์",
      "dept_key": "<track to confirm>",
      "dept_name": "ทีมโฆษณา (Advertising)",
      "position": "<...>",
      "is_photo_allowed": false,
      "is_shown": true
    }
  ],
  "sponsors": [
    {
      "_id": "<ObjectId>",
      "name": "Lido Connect",
      "logo": "<...>",
      "logo_permission": false,
      "tier": "<...>",
      "is_shown": true
    }
  ],
  "highlights": [
    {
      "_id": "<ObjectId>",
      "event_name": "รอบสื่อ",
      "date": "2025-06-28",
      "venue": "Lido Connect Hall 2",
      "desc": "<...>",
      "pics": [],
      "is_shown": true
    }
  ],
  "blocks": [
    "<image: the team photo, size large>",
    "<article>",
    "<stats>",
    "<gallery>",
    "<video>",
    "<highlights>",
    "<team>",
    "<quote>",
    "<sponsors>"
  ],
  "is_yearbook_shown": true,
  "is_shown": false
}
```

`blocks` holds the block objects from the examples above, in that order, below the fixed header (`name`, dates, `venue`, `pics[0]`).

**A track**

```json
{
  "key": "it",
  "display_name": "IT",
  "desc": "<...>",
  "pics": [],
  "achievements": [
    {
      "_id": "<ObjectId>",
      "project_slug": "tcos-2-the-hidden-saloon",
      "year": 2025,
      "text": "<...>",
      "pics": [],
      "is_shown": true
    }
  ],
  "is_shown": false
}
```

**A recruitment round** (TCOS 2, round 5: MC and ushers)

```json
{
  "project_slug": "tcos-2-the-hidden-saloon",
  "title": "<...>",
  "opens_at": "2025-04-28",
  "closes_at": "2025-05-01",
  "extended_to": null,
  "qualifications": {
    "age_min": 14,
    "age_max": 22,
    "age_note": null,
    "items": ["<...>"]
  },
  "positions": [
    {
      "_id": "<ObjectId>",
      "dept_key": "<track to confirm>",
      "dept_name": "MC and ushers",
      "title": "พิธีกร",
      "audition": {
        "clip_required": true,
        "clip_brief": "A clip introducing TCOS (who, what, why), plus a self-introduction clip",
        "clip_max_minutes": 5,
        "clip_file_name": "พิธีกร_ชื่อจริง-นามสกุล_ชื่อเล่น",
        "clip_upload": "public Google Drive link"
      },
      "is_shown": true
    }
  ],
  "timeline": [
    {
      "_id": "<ObjectId>",
      "start_date": "2025-04-28",
      "end_date": "2025-05-01",
      "event_name": "Apply",
      "event_description": "Google Form",
      "location": null,
      "is_shown": true
    },
    {
      "_id": "<ObjectId>",
      "start_date": "<...>",
      "event_name": "Interview",
      "event_description": "Google Meet",
      "location": null,
      "is_shown": true
    },
    {
      "_id": "<ObjectId>",
      "start_date": "<...>",
      "event_name": "First meet",
      "event_description": "<...>",
      "location": "<venue>",
      "is_shown": true
    }
  ],
  "apply_url": "<...>",
  "poster": "<...>",
  "is_shown": false
}
```

**Home**

```json
{
  "key": "home",
  "title": "The Coming of Stages",
  "blocks": [
    "<hero>",
    "<article: about>",
    "<stats>",
    "<projects>",
    "<tracks>",
    "<join>",
    "<quote>",
    "<yearbook>",
    "<article: #support, why support TCOS>",
    "<article: #support, overall sponsor benefits as a Markdown list, then: <...> (benefits depend on the project and the amount; email us for details)>",
    "<button: #support, mailto:official_account@thecomingofstages.com>",
    "<sponsors: past partners>"
  ],
  "is_shown": true
}
```

## Left out on purpose

- **A quote archive per project** (`projects.quotes`): quotes live only in `quote` blocks, so each is typed once. The cost: a project's quotes cannot be listed in one place.
- **Merch**: a separate project, not tied to any project here.
- **Sponsor packages and amounts**: packages vary from project to project, so none are stored. Support lists the overall benefits in an article, followed by a line pointing sponsors to the email button for a project's amounts. This answers the interview's "what do I get for xxx baht" only in part. A per-project packages field can be added later if someone takes it on.
- **Applicant data**: applications are handled elsewhere. The site only describes rounds.
- **Source codes and verification status per record**: `is_shown` is the only gate, and [tcos_facts.csv](../tcos_facts.csv) stays the record of sources and the 14 conflicts. Resolve a conflict there before showing the value.
- **Stats, venues, organisations and media as their own collections**: folded into strings, URL lists and blocks.

## Open decisions

- [ ] Praow: confirm the track keys, and map the departments that do not clearly fit one of the six: documents and coordination, venue and welfare, media production (Film or Marketing), advertising, and MC and ushers.
- [ ] Which rounds are not tied to one project (the June and July 2026 special rounds), so `apply.project_slug` can be `null`.
- [ ] Whether the Tracks page also gets `blocks`. (Join does not: `/join` is fixed, and its empty-state message is written in the client code.)
- [ ] Later block types: event info, timeline, contact, cards, map, divider.
- [ ] Whether English pages are needed. If yes, text fields become `{ th, en }`.
- [x] Who edits the data, and how: through the server's admin API with a hand-made JWT, called directly for now; a separate admin interface is planned in [EDITOR.md](EDITOR.md). See [API.md](API.md).
- [ ] Track team and open positions: the requirements list a team (ทีมงาน) under each track, but department names and structure vary between projects. Decide how people map to tracks before the popup lists them.
- [ ] Sponsor benefits: the overall list of what sponsors get, for the Support article, and the wording of the line that sends sponsors to the email for amounts. Packages vary by project and are left out.
- [ ] A page per person, so members can see their own growth across projects ("เห็นพัฒนาการของตัวเอง"): it would need a `people` collection and a `person_key` on each team member, and its own consent (plus guardian consent for minors), since it puts one person's history in one place. Later.
- [ ] Bookshelf images: the project list uses `pics[0]`. A dedicated spine and cover image per project would need new fields.
