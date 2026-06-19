# FoxPrompt

A full-stack social platform for AI image/video prompt engineering — discover, copy, enhance, and share high-quality prompts.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000/8080)
- `pnpm --filter @workspace/foxprompt run dev` — run the frontend (Vite)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `OPENAI_API_KEY`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS v4 + Framer Motion + Wouter routing
- Auth: Clerk (`@clerk/react` v6 — uses `useAuth()` hook, NOT `SignedIn`/`SignedOut` components)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/foxprompt/` — React+Vite frontend
- `artifacts/api-server/` — Express API backend
- `lib/api-client-react/src/generated/` — generated React Query hooks + Zod schemas (do not edit manually)
- `lib/db/src/schema.ts` — DB schema (source of truth)
- `artifacts/api-server/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `artifacts/foxprompt/src/index.css` — theme tokens (orange brand: `#FF6B00`)

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → React Query hooks used in frontend
- All DB access via Drizzle ORM; schema pushed with `pnpm --filter @workspace/db run push`
- Clerk v6 auth: `useAuth()` returns `isSignedIn`; no `SignedIn`/`SignedOut` components in v6
- Generated hooks require `queryKey` in their options object (Orval quirk) — use the matching `get*QueryKey()` helper
- `useSyncUser` mutation takes `undefined` as argument (not `{}`)
- Dark-mode-first theme: `class="dark"` on containers; orange primary `#FF6B00`

## Product

- **Feed** — masonry discovery grid with search, category filters, sort (newest/trending/featured)
- **Enhance** — paste any prompt, pick a style, get an AI-enhanced version via OpenAI
- **Submit** — authenticated users submit prompts with optional image URL and tags
- **Profile** — view your submitted prompts and copy count
- **Admin** — feature/unfeature and delete prompts (admin users only)
- **Auth** — Clerk sign-in/sign-up with orange branded appearance

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Clerk v6 does NOT export `SignedIn`, `SignedOut` — use `useAuth().isSignedIn` conditionally instead
- `UserButton` in Clerk v6 does not accept `afterSignOutUrl` prop
- Generated React Query hooks require `queryKey` in the `query` options — always pass the matching `get*QueryKey()` helper
- Do NOT run `pnpm dev` at workspace root — use workflows or `pnpm --filter` per-package
- `EnhanceInputStyle` is an enum object — use `EnhanceInputStyle.photorealistic` not the string literal

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
