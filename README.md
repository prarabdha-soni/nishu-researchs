# Nishu Research — self-learning gold trading agent

An autonomous agent that researches gold from live market data, takes a stance, commits a playbook, and **re-weights its own model from the realised outcome of each catalyst** — then trades the next move accordingly. A polished React "trading desk" is the cockpit; a TypeScript agent is the brain.

> **Honest status.** The decision engine, live data, and the self-learning loop are real (phases P1–P3, below). It is **advisory** — it produces stances, scenarios, and armed-order plans, not real trades. *Nishu advises on scenarios; it does not guarantee outcomes. Not financial advice.*

Design docs: [`AGENT.md`](./AGENT.md) · [`ARCHITECTURE.md`](./ARCHITECTURE.md) · [`SKILLS.md`](./SKILLS.md) · working-in-the-code guide: [`CLAUDE.md`](./CLAUDE.md).

---

## Monorepo layout

```
apps/web        # React 19 + Vite cockpit  → deploy to Vercel
apps/server     # Hono API + agent runtime → deploy to Render / Railway
packages/shared # domain model + pure agent core (decide + learn) — shared by both
```

`packages/shared` is the contract: types, the driver taxonomy, and the deterministic agent math (signals → conviction → scenario tree → sizing → playbook, plus the learning update). The server adds I/O (Yahoo Finance, persistence, HTTP); the web app renders the server's `AgentSnapshot` and falls back to the shared seed data when the API is unreachable.

---

## Quickstart

```bash
npm install        # installs all workspaces
npm run dev        # web on http://localhost:5173 + agent API on http://localhost:8787
```

The web dev server proxies `/api/*` to the agent (see `apps/web/vite.config.ts`). Run them separately with `npm run dev:web` / `npm run dev:server`.

Other scripts (root):

| Script | Does |
| --- | --- |
| `npm run build` | Production build of the web app → `apps/web/dist` |
| `npm run start:server` | Start the agent API (tsx, no build step) |
| `npm run cycle` | Run one learning tick — resolve due catalysts from real reactions |
| `npm run typecheck` | Typecheck every workspace |

## Live data

Market data comes from **Yahoo Finance** (`yahoo-finance2`): gold `GC=F`, plus `DX-Y.NYB` (DXY) and `^TNX` (10Y yield) for the evidence board. Symbols and more are configurable — copy `.env.example` to `.env`. If Yahoo is unreachable the agent serves the **seed** dataset and the cockpit shows a `sample data` badge, so it always renders.

---

## How the agent learns

Each cycle: **Perceive → Decide → Act → Observe → Learn** (full detail in [`AGENT.md`](./AGENT.md)).

- `GET /api/snapshot` — the full payload the cockpit renders (market, decision, scenarios, playbook, journal, track).
- `GET /api/price` — lightweight live price for the header.
- `POST /api/cycle` — autonomous tick: finds catalysts that have come due, measures the **actual** gold reaction from price history, and applies a bounded re-weighting + a journal entry.
- `POST /api/resolve` — resolve a specific catalyst with a known move.

The learning update is deterministic, bounded, versioned, and reversible (`packages/shared/src/agent/learn.ts`). State persists via a pluggable store (JSON file by default; set `DATABASE_URL` and add a Postgres adapter for durable prod state).

---

## Deploy (free tiers)

**Web → Vercel.** Import the repo; `vercel.json` builds `@nishu/web` and outputs `apps/web/dist`. Edit the `/api` rewrite host in `vercel.json` to your agent URL (or set `VITE_API_URL` at build time).

**Agent → Render.** `render.yaml` is a Blueprint: a free web service (`/api/health` health check) **plus a weekday cron** that runs the learning tick. Render's free disk is ephemeral (`STATE_FILE=/tmp/...`); for durable learning set `DATABASE_URL` (e.g. Neon free tier) and add a Postgres store adapter.

**Agent → Railway (alt).** `railway.json` sets the build/start commands.

See `.env.example` for all configuration.
