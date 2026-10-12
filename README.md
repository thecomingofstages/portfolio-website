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

Not set up yet: task S1 in [docs/TASKS.md](docs/TASKS.md) sets it up, and adds its commands here.

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
