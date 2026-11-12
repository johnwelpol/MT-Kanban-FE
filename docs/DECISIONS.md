# Decisions

Deviations from `00-overview.md` / `02-frontend-nextjs.md`.

| Date | What | Why |
|---|---|---|
| 2026-11-12 | The frontend lives at the repo root, not `/frontend`. | This repo is the frontend app only. Plan paths `frontend/...` map to the root. |
| 2026-11-12 | `cacheComponents` and `partialPrefetching` are disabled. | Every tenant page reads cookies or headers and fetches with `no-store`. With Cache Components on, each of those reads would need a `<Suspense>` boundary. |
| 2026-11-12 | No `allowedDevOrigins` entry. | Next 16.4 already allows `localhost` and its subdomains in dev. |
| 2026-11-12 | shadcn uses the `base-nova` style (Base UI primitives, not Radix), and `cn` comes from the `cn` package. | These are the current `shadcn init` defaults. Components use the `render` prop where Radix used `asChild`. |
| 2026-11-12 | `@vitejs/plugin-react` is not installed. | Its optional babel peer conflicts on install, and unit tests run in `node` with no JSX. |
| 2026-11-12 | `vite-tsconfig-paths` is not installed. Vitest uses Vite 8's native `resolve.tsconfigPaths`. | It is a built-in platform feature, so no plugin is needed. |
| 2026-11-12 | `@types/node` was bumped from ^20 to ^22. | Vitest 5 requires it, and it matches the Node 22 runtime. |
| 2026-11-12 | `iron-session` v9 (the plan says v8) and `zod` v4. | These are the current majors at install time. The API is checked in F1. |
| 2026-11-12 | `typecheck` runs `next typegen` before `tsc`. | Global route types (`LayoutProps`, ...) only exist after generation, so a clean checkout would fail without it. |
| 2026-11-12 | Vitest sets dummy server env vars in `vitest.config.mts`. | `lib/env.ts` validates at import, so any tested module that imports it would otherwise throw. |
