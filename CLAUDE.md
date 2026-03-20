# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR (React frontend + Cloudflare Worker)
npm run build     # TypeScript compile + Vite build
npm run lint      # ESLint
npm run preview   # Build and preview production locally
npm run deploy    # Build and deploy to Cloudflare Workers
npm run cf-typegen # Generate Cloudflare types (wrangler types)
```

## Architecture

This is a Cloudflare Workers app with a React frontend, built using Vite with the `@cloudflare/vite-plugin`.

**Frontend (`src/`):**
- React 19 + TypeScript
- Entry: `src/main.tsx` → `src/App.tsx`
- Compiled with `tsconfig.app.json`

**Worker (`worker/`):**
- Cloudflare Worker handling API routes using [Hono](https://hono.dev/)
- Entry: `worker/index.ts` exports a Hono app (`new Hono<{ Bindings: Env }>()`)
- Routes starting with `/api/` are handled by the worker
- Other routes fall through to the SPA (configured in `wrangler.jsonc` via `not_found_handling: "single-page-application"`)
- Compiled with `tsconfig.worker.json`
- Types generated via `npm run cf-typegen` → `worker-configuration.d.ts`

**Configuration:**
- `wrangler.jsonc` - Cloudflare Workers config
- `vite.config.ts` - Vite + React + Cloudflare plugin
