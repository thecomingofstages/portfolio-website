# TCOS portfolio: client

The public site: Next.js (App Router) on Cloudflare Workers through OpenNext
(`@opennextjs/cloudflare`). Plan: [docs/FRONTEND.md](../../docs/FRONTEND.md).
Read [AGENTS.md](../../AGENTS.md) before working here.

## Run it

```bash
npm install
cp .env.example .env.local   # USE_FIXTURES=true works without the server
npm run dev                  # http://localhost:3000
```

`npm run preview` builds for Workers and runs it in the Workers runtime
(values from `.dev.vars`, same names as `.env.example`).

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

GitHub Actions runs these on every push and pull request that touches
`apps/client` ([.github/workflows/client.yml](../../.github/workflows/client.yml)).

## Deploy

- **By hand:** `npm run deploy` (needs `npx wrangler login`).
- **On push (Cloudflare Workers Builds):** in the Cloudflare dashboard, open the
  `portfolio-website` Worker → Settings → Builds → Connect the Git repository, with:
  - Root directory: `apps/client`
  - Build command: `npx opennextjs-cloudflare build`
  - Deploy command: `npx opennextjs-cloudflare deploy`
  - Build variables: `MEDIA_BASE_URL` once the media bucket exists, and
    `USE_FIXTURES=true` until the server is deployed.
- **Pull request previews (GitHub Actions):** the `preview` job in
  [client.yml](../../.github/workflows/client.yml) runs `npx wrangler preview` for
  each pull request and puts the Preview URL in the job summary. It needs two
  repository secrets: `CLOUDFLARE_API_TOKEN` (a token that can edit Workers
  scripts) and `CLOUDFLARE_ACCOUNT_ID`. Keep "Builds for Preview branches" off in
  Workers Builds, so previews are not built twice.
- **Secrets:** `npx wrangler secret put API_URL` and
  `npx wrangler secret put REVALIDATE_SECRET`. Without `REVALIDATE_SECRET`,
  `/api/revalidate` answers `401` to every call.

## Versions

- `next` is pinned to 16.3.8: OpenNext 1.20.10 cannot yet run Next 16.4 on
  Workers (it fails on `preview-props.json`). Upgrade both together.
- TODO(page cache): `revalidatePath` and `revalidate = 86400` need an OpenNext
  incremental cache (an R2 bucket) and tag cache on Workers. See `open-next.config.ts`.
