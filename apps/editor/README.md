# TCOS editor

The admin interface: edits the Home page and project pages through the server's
admin API. The plan, settings and what it does not edit yet are in
[docs/EDITOR.md](../../docs/EDITOR.md); the rules are in [AGENTS.md](../../AGENTS.md).

```bash
npm ci
cp .env.example .env.local
npm run dev        # http://localhost:3001
```

With `USE_FIXTURES=true` (the example setting) it edits an in-memory copy of
`fixtures/`, kept until the dev server restarts.

Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

| Folder | What |
| --- | --- |
| `app/` | Routes: `/`, `/pages/[key]`, `/projects/[slug]`, `/projects/new`; `actions.ts` (every write) |
| `components/` | `BlocksEditor`, `FieldInput`, `ProjectForm`, `PageFieldsForm`, `ui` |
| `lib/admin-api.ts` | The only data access: the admin API, or the fixture store |
| `lib/schemas.ts` | zod schemas, following `tcos_schema.mongodb.js` |
| `lib/blocks.ts` | Block labels, form fields and defaults |
| `fixtures/` | Stored-shape documents from the docs/DATABASE.md examples |
