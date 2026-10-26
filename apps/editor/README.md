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
`fixtures/`, kept until the dev server restarts. Uploads need the real admin API.
Set `SITE_URL` to a running client, with `EDITOR_ORIGIN=http://localhost:3001` in the
client's settings, to edit on the page itself.

Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

| Folder | What |
| --- | --- |
| `app/` | Routes: `/`, `/pages/[key]`, `/projects/[slug]`, `/projects/new`, `api/upload`; `actions.ts` (every write) |
| `components/` | `BlocksEditor`, `FieldInput`, `ProjectForm`, `PageFieldsForm`, `BlockDialogs`, `UploadButton`, `NavLinks`, `ui` |
| `lib/admin-api.ts` | The only data access: the admin API, or the fixture store |
| `lib/schemas.ts` | zod schemas, following `tcos_schema.mongodb.js` |
| `lib/blocks.ts` | Block labels, form fields and defaults; which types the site shows yet |
| `lib/dates.ts` | The client's date format, copied as is (a test keeps it identical) |
| `lib/date-input.ts` | Stored dates ↔ the date and Bangkok-time inputs |
| `fixtures/` | Stored-shape documents from the docs/DATABASE.md examples |
