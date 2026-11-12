# MT Kanban — Frontend

Next.js 16 frontend (and backend-for-frontend) for MT Kanban, a multi-tenant Kanban app where each workspace lives on its own subdomain.

The browser only talks to this app. Server components, server actions and the `/api/*` passthrough call the Laravel API ([MT-Kanban-BE](https://github.com/johnwelpol/MT-Kanban-BE)) server-to-server. The only direct browser connection to the backend stack is the Reverb WebSocket.

## Prerequisites

| Requirement | Version / notes |
|---|---|
| Node.js | 20.9 or newer (22 LTS recommended) |
| npm | 10+ (comes with Node) |
| Laravel backend (`mt-kanban-be`) | Running at `http://127.0.0.1:8000`, with its migrations run |
| Backend services | MySQL 8.4, Redis 7, Mailpit (`http://localhost:8025`), the queue worker (Horizon) and Laravel Reverb (`localhost:8080`). See the backend README for how to start them. |
| Shared secrets | The `INTERNAL_API_KEY` value from the backend `.env` (both apps must use the same value), and the backend's `REVERB_APP_KEY` |
| Browser | Chrome, Edge or Firefox. These resolve `*.localhost` to `127.0.0.1`, so workspace URLs like `http://acme.localhost:3000` work without editing your hosts file. |
| Cypress (e2e only) | Installed by `npm install`. Run `npx cypress verify` once; on Linux, install the [Cypress system dependencies](https://docs.cypress.io/app/get-started/install-cypress#Linux-Prerequisites) first. |

## Getting started

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Dev value | Notes |
|---|---|---|
| `ROOT_DOMAIN` | `localhost` | Workspaces are served on `{slug}.ROOT_DOMAIN` |
| `APP_PROTOCOL` | `http` | |
| `APP_PORT` | `3000` | Leave empty in production |
| `INTERNAL_API_URL` | `http://127.0.0.1:8000` | Laravel API base URL, reached from the Next.js server only |
| `INTERNAL_API_KEY` | backend's `INTERNAL_API_KEY` | Must match the backend exactly |
| `SESSION_SECRET` | 32+ random characters | Encrypts the session cookie |
| `NEXT_PUBLIC_REVERB_APP_KEY` | backend's `REVERB_APP_KEY` | |
| `NEXT_PUBLIC_REVERB_HOST` / `_PORT` / `_SCHEME` | `localhost` / `8080` / `http` | |

Generate a random secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The app checks these variables at startup and refuses to boot if one is missing or invalid.

Then start the dev server (with the backend already running):

```bash
npm run dev
```

## URLs in development

| URL | What it is |
|---|---|
| `http://localhost:3000` | Root site: landing page, registration, workspace finder |
| `http://{slug}.localhost:3000` | A workspace, for example `http://acme.localhost:3000` |
| `http://localhost:8025` | Mailpit, for invitation and password-reset emails sent by the backend |

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate Next route types, then `tsc --noEmit` |
| `npm test` | Unit tests (Vitest) |
| `npm run e2e` | End-to-end tests (Cypress, headless) |

## Testing

**Unit tests** need nothing else running:

```bash
npm test
```

**End-to-end tests** run against the full stack. Start the backend services, Horizon and Reverb, start this app with `npm run dev`, then:

```bash
npm run e2e
```

`cypress.config.ts` maps `*.localhost` to `127.0.0.1`, because Node's resolver (which Cypress uses) does not do this on every OS.

## Project layout

```
proxy.ts            Resolves the workspace from the host and guards signed-in pages
lib/                Server API client, session, env, permissions and pure helpers
app/site/           Root-domain pages (rewritten from / by proxy.ts)
app/(tenant)/       Workspace pages: (auth) sign-in flows, (app) the signed-in app
app/api/[...path]/  Passthrough that browser code uses to reach the API
components/         UI (shadcn/ui on Base UI), shell, boards, board, members
```
