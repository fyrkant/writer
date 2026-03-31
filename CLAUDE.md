# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR (React frontend + Cloudflare Worker)
npm run build     # TypeScript compile + Vite build
npm run lint      # Biome
npm run preview   # Build and preview production locally
npm run deploy    # Build and deploy to Cloudflare Workers
npm run cf-typegen # Generate Cloudflare types (wrangler types)
npm test          # Run Playwright e2e tests
npm run test:ui   # Run tests with interactive Playwright UI
npm run test:debug # Run tests in debug mode
```

## Testing

**Always run `npm test` to validate changes before committing.**

E2e tests live in `e2e/` and use Playwright with `page.route()` to mock all API calls — no real KV or auth token needed.

```
e2e/
  fixtures/
    api.ts    # makePost() factory + setupApiRoutes(page, opts) for mocking endpoints
    auth.ts   # loginAs(page) — injects token into localStorage before navigation
  tests/
    login.spec.ts        # Auth flow, error state, token persistence
    sidebar.spec.ts      # Post list, counts, tags, active highlight, loading
    editor.spec.ts       # All fields, new/existing post, Ctrl+S, save states
    delete.spec.ts       # Confirmation dialog, cancel, success/error
    dirty.spec.ts        # Unsaved-changes guard on post switch and new post
    toast.spec.ts        # Success/error toasts, auto-hide
    auth-persist.spec.ts # Reload persistence, logout, 401 clears token
    build.spec.ts        # Build button, status transitions, error handling
```

First-time setup (installs Chromium browser):
```bash
npx playwright install chromium
```

CI runs automatically on push/PR via `.github/workflows/e2e.yml`.

## Architecture

Blog editor app with React frontend and Hono API backend on Cloudflare Workers.

**Frontend (`src/`):**
- React 19 + TypeScript
- Entry: `src/main.tsx` → `src/App.tsx`
- Components: `Login`, `Sidebar`, `Editor`, `Toast`
- Types: `src/types.ts` (Post, PostInput)
- API client: `src/api.ts`

**Worker (`worker/index.ts`):**
- Hono app with REST API for posts
- KV storage via `POSTS` namespace
- Bearer token auth for write operations

**API Endpoints:**
- `GET /api/posts` - list all posts (public)
- `GET /api/posts/:id` - get single post (public)
- `POST /api/posts` - create post (auth required)
- `PUT /api/posts/:id` - update post (auth required)
- `DELETE /api/posts/:id` - delete post (auth required)

**Configuration:**
- `wrangler.jsonc` - Workers config, KV binding, vars
- `vite.config.ts` - Vite + React + Cloudflare plugin

**Secrets (set via `wrangler secret put`):**
- `AUTH_TOKEN` - Bearer token for authentication
- `NETLIFY_BUILD_HOOK` - Webhook URL to trigger builds on save
