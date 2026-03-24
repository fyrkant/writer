# blog.editor

A minimal blog post editor backed by Cloudflare Workers and KV storage. React frontend with a Hono REST API — write and manage posts, trigger Netlify builds on save.

## Stack

- **Frontend** — React 19 + TypeScript, built with Vite
- **Backend** — Hono on Cloudflare Workers
- **Storage** — Cloudflare KV
- **Auth** — Bearer token (single shared secret)
- **Linting** — Biome
- **Tests** — Playwright e2e

## Getting started

```bash
npm install
npx playwright install chromium  # first time only
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Enter your `AUTH_TOKEN` to log in.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (frontend + worker via miniflare) |
| `npm run build` | TypeScript compile + Vite build |
| `npm run lint` | Biome lint |
| `npm run preview` | Build and preview locally |
| `npm run deploy` | Build and deploy to Cloudflare Workers |
| `npm test` | Run Playwright e2e tests |
| `npm run test:ui` | Playwright interactive UI mode |

## API

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/auth` | required | Verify token |
| GET | `/api/posts` | — | List all posts |
| GET | `/api/posts/:id` | — | Get single post |
| POST | `/api/posts` | required | Create post |
| PUT | `/api/posts/:id` | required | Update post |
| DELETE | `/api/posts/:id` | required | Delete post |
| POST | `/api/build` | required | Trigger Netlify build |

## Secrets

Set via `wrangler secret put`:

- `AUTH_TOKEN` — password used to log in
- `NETLIFY_BUILD_HOOK` — webhook URL triggered on save (optional)

## Deployment

```bash
npm run deploy
```

Requires a Cloudflare account with a KV namespace. Update the `id` in `wrangler.jsonc` with your own namespace ID.

## Tests

Playwright e2e tests cover all user flows. API calls are intercepted with `page.route()` so tests run without real KV or credentials.

```bash
npm test
```

CI runs on every push and pull request via GitHub Actions.
