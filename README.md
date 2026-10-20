# TCOS Portfolio Website

The portfolio website of The Coming of Stages (TCOS, เด็กไทยติดเวที): projects,
tracks (สายงาน), open recruitment rounds and per-project yearbooks.

Before working on the code, read [AGENTS.md](AGENTS.md). It has the rules
(privacy, consent, design) and links to the plans in [docs/](docs/).

## Requirements

- **Node.js 22 or later**, with npm (Node 22 is what CI uses).
- **Git**.
- **To deploy only:** a Cloudflare account, signed in with `npx wrangler login`.

You don't need a database or the server to run the client: it can serve fixtures.

## File structure

```
.
├── AGENTS.md                 Rules for people and AI tools: read first
├── CLAUDE.md                 Points to AGENTS.md
├── docs/
│   ├── FRONTEND.md           Client plan: pages, components, design
│   ├── API.md                Server API: endpoints, response shapes, auth
│   ├── DATABASE.md           Data model, consent rules, examples
│   └── TASKS.md              Task briefs (F1–F7, sprints 1–3, S1–S10)
├── tcos_schema.mongodb.js    MongoDB collections, validators and indexes
├── tcos_ui_flow.drawio       Page layouts (open in diagrams.net)
├── tcos_components.drawio    Mockup of the sprint 1 components, in the design tokens
├── apps/
│   ├── client/               The public site: Next.js on Cloudflare Workers (OpenNext)
│   │   ├── app/              Routes (App Router)
│   │   ├── components/       Nav, Media, BlockRenderer, blocks/
│   │   ├── lib/              api.ts (the only data access), markdown, dates
│   │   ├── types/api.ts      API response types
│   │   ├── fixtures/         Sample API responses, for working without the server
│   │   └── public/           Static files (logo)
│   ├── server/               Express API on Cloudflare Workers (not set up yet: task S1)
│   └── editor/               Admin interface (not in use yet)
└── .github/workflows/        CI checks for the client
```

## Run in development mode

### Client

```bash
cd apps/client
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The example settings use `USE_FIXTURES=true`, so the
site runs on the sample data in `fixtures/`, without the server. To use a real
server, set `API_URL` in `.env.local` and remove `USE_FIXTURES`.

To run the site in the Cloudflare Workers runtime, as it runs in production:

```bash
cp .env.example .dev.vars
npm run preview
```

Open http://localhost:8787.

### Server

```bash
cd apps/server
npm ci
cp .dev.vars.example .dev.vars   # fill in MONGODB_URI and the other secrets
npm run dev
```

The server runs at http://localhost:8787 in the Cloudflare Workers runtime.

- `GET /api/health` checks the server and the database.
- API docs (Swagger UI): http://localhost:8787/api/docs, with the raw spec at
  `/api/openapi.yaml` (the hand-written `apps/server/swagger.yaml`). They are on only
  when `DOCS_ENABLED=true` (set in `.dev.vars`); production leaves them off.
- `npm run check:db` checks that `MONGODB_URI` connects and the collections have validators.
- `npm run token -- --for <you>` makes an admin token (signed with `JWT_SECRET` from `.dev.vars`;
  add `--expires 7d` for an expiry). Send it as `Authorization: Bearer <token>` to `/api/admin/*`.
  Never paste a token into shared files or chat. To revoke every token, change `JWT_SECRET`.
- `npm run seed:dev` adds sample data (all text `<...>`, slugs `sample-...`) to the database in
  `.dev.vars`, for testing the API by hand; `npm run seed:dev -- --clear` removes exactly that data.
  Dev database only.
- Postman: import `apps/server/postman/TCOS-Local.postman_environment.json` and a
  collection (one per domain, or `Full-Suite` for everything). Or, with the server
  running, `npm run test:postman` runs the Full-Suite from the terminal. List requests
  save a real slug/key for the detail requests; with an empty database those are skipped.

Checks, in `apps/server`: `npm run typecheck` and `npm test`. After changing
`wrangler.jsonc`, run `npm run cf-typegen`.

Server layout (`apps/server`):

```
swagger.yaml            OpenAPI, written by hand
postman/                one collection per domain + Full-Suite
scripts/                check-db
tests/
  helpers/app.ts        buildTestApp(): the app with no DB connection and no listen
  helpers/factories.ts  document builders
  <domain>.test.ts      one file per domain
src/
  index.ts              bootstrap: config → app → listen (Workers)
  app/
    server.ts           buildApp(config): middleware → routes → errors
    config/             app.conf / app.keys / db.conf / db.keys / init.ts (zod-checked env)
    database/db.ts      withDb, toObjectId, withId (shared)
    models/             one file per collection (types) + index.ts (handles)
    routes/             one file per domain + init.ts (mounts under /api)
    controllers/        thin HTTP layer
    helpers/            business logic
    schemas/            zod schemas per route
    middleware/         Security, Validate, ErrorHandler (Auth in S5)
    utils/              ApiError, Logger, config
```

## Checks

Run these in `apps/client` before opening a pull request. CI runs them on every
push and pull request that touches the client.

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm test            # Vitest
npm run build       # production build
```

## Deploy

See [apps/client/README.md](apps/client/README.md). In short: `npm run deploy` in
`apps/client`, or deploy on push through Cloudflare Workers Builds.

Never commit `.env*` or `.dev.vars` files. Secrets go in with `npx wrangler secret put <NAME>`.
