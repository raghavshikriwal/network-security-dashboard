# Network Security Dashboard

A real-time Security Operations Center (SOC) dashboard for monitoring network threats, traffic, and incidents with JWT authentication.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/security-dashboard run dev` — run the frontend (port 18344)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Socket.io (real-time traffic events)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Auth: JWT via `jsonwebtoken`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite + Recharts + Tailwind CSS (dark theme)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — DB schema (users, threats, incidents)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — JWT middleware
- `artifacts/api-server/src/lib/trafficStore.ts` — In-memory real-time traffic data store
- `artifacts/security-dashboard/src/` — React frontend

## Architecture decisions

- Socket.io serves at `/api/socket.io` path — both `/api` and `/api/socket.io` are listed in artifact.toml paths for proxy routing.
- JWT auth uses `SESSION_SECRET` env var, falls back to a hardcoded default for dev.
- Traffic data is entirely in-memory (no DB); simulated with realistic random values every 5s.
- IP lookup is deterministic/simulated (no external API dependency).
- Passwords are SHA-256 hashed with a fixed salt (not bcrypt) — fine for a demo, upgrade for production.

## Product

- **Login**: JWT auth with demo credentials (admin/admin123, analyst/analyst123)
- **Dashboard**: Live traffic charts (Socket.io), stat cards, severity donut chart, activity feed
- **Threat Alerts**: Filterable list of threats with resolve/investigate actions
- **Incident Logs**: Create, track, and update security incidents
- **IP Lookup**: Geo info, risk score, VPN/Tor/proxy detection for any IP

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always add new WebSocket paths to the api-server `artifact.toml` paths array — the proxy only forwards explicitly listed paths.
- After OpenAPI spec changes, always re-run `pnpm --filter @workspace/api-spec run codegen` before building.
- The `lib/db` package exports all schema tables — import from `@workspace/db` in routes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
