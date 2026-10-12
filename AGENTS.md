# AGENTS.md

Instructions for AI coding agents (and people) working on the TCOS portfolio website. Read this file before every task.

## The project

The portfolio website of The Coming of Stages (TCOS, เด็กไทยติดเวที). It shows TCOS projects, tracks (สายงาน), open recruitment rounds and per-project yearbooks. Most of the site's text is Thai.

| Part | Stack | Plan |
| --- | --- | --- |
| client (`apps/client`) | Next.js (App Router) on Cloudflare Workers through OpenNext: the public site | [docs/FRONTEND.md](docs/FRONTEND.md) |
| server (`apps/server`) | Express.js on Cloudflare Workers, with the official `mongodb` driver: public read API and admin API | [docs/API.md](docs/API.md) |
| database | MongoDB with `$jsonSchema` validators | [docs/DATABASE.md](docs/DATABASE.md), [tcos_schema.mongodb.js](tcos_schema.mongodb.js) |

## Sources of truth

Read the docs for your task before writing code. When they disagree, stop and ask; do not pick one yourself.

| Question | Source |
| --- | --- |
| Pages, paths, components, sprints, design (colours, fonts, shapes) | [docs/FRONTEND.md](docs/FRONTEND.md) |
| Endpoints, response shapes, auth, uploads, page refresh | [docs/API.md](docs/API.md) |
| Fields, what they mean, consent rules, example documents | [docs/DATABASE.md](docs/DATABASE.md) |
| Exact field types and required fields | [tcos_schema.mongodb.js](tcos_schema.mongodb.js) |
| Page layouts | `tcos_ui_flow.drawio` (open in diagrams.net) |
| Your task: what to read, which files, when it is done | [docs/TASKS.md](docs/TASKS.md) |

**Do not use:**
- `tocs-schema.js`: an early Mongoose draft, out of date, and kept as it is. Do not edit it, and do not copy from it.
- `it-10-portfolio.md`, `meeting-*.srt` and the `tcos_*.csv` files: raw interview notes, a meeting transcript and unverified source data, with people's names. Everything the code needs from them is already in `docs/`. Never copy text, names or numbers from them into code, fixtures or tests.

## Rules

### Content
- **Never invent content.** `<...>` in the docs means "not decided yet". Keep it as `<...>` in fixtures and placeholders. Never make up names, numbers, dates, prices, quotes or wording, including Thai text.
- Fixtures come from the examples in docs/DATABASE.md, shaped like the responses in docs/API.md.
- Field names are `snake_case`, exactly as in the schema. Do not rename or add fields.

### Privacy and consent
Many members are minors.
- **The server is the only filter.** It sends only `is_shown: true` documents and items; `photo` only where `is_photo_allowed` is true; `logo` only where `logo_permission` is true.
- **The client never filters.** It shows what the API sends. It never receives hidden data, so it never hides anything itself.
- No birth dates, phone numbers or other contact details anywhere.
- Never log, print or put in a URL a person's name together with their photo or project, outside the pages that show them.

### Client (Next.js)
- **API calls:** fetch data only through `lib/api.ts`, on the Next.js server (server components, route handlers). The browser never calls the Express server.
- **Types:** use `types/api.ts`; do not write response types inline.
- **Errors:** a `404` from the API means `notFound()`. Other errors go to `error.tsx`.
- **Design:** use only the colour tokens, fonts (Prompt for headings, Sarabun for body) and corner sizes in the Design section of docs/FRONTEND.md. The site is dark only.
- **Markdown:** render `article` bodies without raw HTML.
- **Accessibility:** every image has `alt`. The slideshow and shelf respect reduced motion. The shelf and the track popup work with the keyboard.
- **Page width:** every page must work at phone width.
- **Blocks:** `BlockRenderer` maps `type` to a component and skips types it does not know. One component per block type, in `components/blocks/`.

### Server (Express on Cloudflare Workers)
- **Runtime:** the server runs on Cloudflare Workers, not a long-running Node process. Keep `nodejs_compat` in the Wrangler config. Do not rely on the disk, on memory kept between requests, or on packages with native (C++) add-ons.
- **Database:** use the official `mongodb` driver through `db.ts`, never Mongoose and never a new connection helper of your own. Follow "Database access" in docs/API.md:
  - call `.toArray()` on `find()` and `aggregate()`;
  - convert ids with `toObjectId` and dates with `new Date(...)` before querying;
  - add `_id` to every new list item with `withId`;
  - treat MongoDB error code `121` as a `400`;
  - check request bodies with `zod`.
- **Settings:** read secrets, vars and the R2 binding from the Worker environment, as listed in docs/API.md "Environment". Never hard-code them.
- **R2:** write through the `MEDIA_BUCKET` binding and stream uploads; never save them to disk first.
- **JWT:** check tokens with `jose`, not `jsonwebtoken`.
- Every `/api/admin/*` route checks the JWT (`Authorization: Bearer <token>`). There is no login endpoint.
- Run the checks on every write listed in docs/API.md (references, `409` on delete, slug and key renames, photo removal when consent is withdrawn).
- After a write, call the client's `/api/revalidate` with the changed paths from docs/API.md.

### Secrets
- Never commit `.env` or `.dev.vars` files, tokens, `JWT_SECRET` or database URIs. Use `.env.example` (client) and `.dev.vars.example` (server) with empty values. Server secrets go in with `npx wrangler secret put`.
- Never put a secret in a `NEXT_PUBLIC_` variable.

## Working on a task

1. **Read the brief.** Each task in [docs/TASKS.md](docs/TASKS.md) names its ID, the docs sections to read, the files you may change, and when it is done.
2. **Stay in your files.** Change only the files the task names. Shared parts have one owner each: `Shelf`, `RoundCard`, `YearbookGrid`, `lib/api.ts`, `types/api.ts`, `BlockRenderer`, the design tokens, and on the server `db.ts` and the visibility filter. Ask the owner rather than editing them.
3. **Changing the plan.** A change to an endpoint, a response shape, a field or a path needs the matching doc in `docs/` updated first, and approval from the project lead. Do not change docs to match your code without that approval.
4. **Open questions.** When the docs leave something open, leave a `TODO(<question>)` and use `<...>`. Do not decide it in code.
5. **Before finishing.** Run lint, type checks and tests, and check the page at phone width.
   - Client, in `apps/client`: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Run it locally with `npm run dev` (Node) or `npm run preview` (the Cloudflare Workers runtime).
   - Server: `<...>` (task S1).
6. **Pull requests.** One task per pull request, with its ID in the title. A person reviews every pull request before it merges, especially anything touching names, photos or consent.
