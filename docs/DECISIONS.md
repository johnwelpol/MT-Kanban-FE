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
| 2026-11-12 | `iron-session` v9 (the plan says v8) and `zod` v4. | These are the current majors at install time. v9 keeps `getIronSession(await cookies(), options)`, so `lib/session.ts` is written as the plan describes. |
| 2026-11-12 | `typecheck` runs `next typegen` before `tsc`. | Global route types (`LayoutProps`, ...) only exist after generation, so a clean checkout would fail without it. |
| 2026-11-12 | Vitest sets dummy server env vars in `vitest.config.mts`. | `lib/env.ts` validates at import, so any tested module that imports it would otherwise throw. |
| 2026-11-12 | E2E uses Cypress instead of Playwright. | Requested by the project owner. Workspace subdomains need `cy.origin()` (Cypress `injectDocumentDomain` is off by default), and the second user in multi-user specs is driven from a `cy.task`, because Cypress has a single browser context. |
| 2026-11-12 | `SLUG_REGEX` and `RESERVED_SLUGS` were added to `lib/slug.ts` in F1, not F2. | `parseHost` needs the reserved list. F2 adds `slugify` and `validateSlug` to the same file. |
| 2026-11-12 | The proxy 404s only `/site` and `/site/*` on tenant hosts. The plan used `startsWith('/site')`. | A plain prefix check would also 404 unrelated paths such as `/sitemap.xml`. |
| 2026-11-12 | `resolveTenant` caches found and missing tenants (60 s) but throws on other upstream errors, without caching them. | A Laravel outage must not get cached as "workspace not found". |
| 2026-11-12 | The passthrough also rejects empty segments and segments containing `/` or `\` (400), returns 404 for non-allowlisted paths, and forwards the query string. | A decoded `%2F` inside a segment could otherwise smuggle a different path past the allowlist. Clients need query strings to reach Laravel. |
| 2026-11-12 | The passthrough's same-origin check compares `Origin` with the `Host` header. | This matches the plan. Behind a reverse proxy that rewrites `Host`, the check must use the forwarded host instead. |
