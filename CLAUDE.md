# CLAUDE.md

Operational guide for Claude Code (and humans) working in this repo. Read this first.

> Companion docs: [`AGENT.md`](./AGENT.md) — how the agent thinks & learns · [`ARCHITECTURE.md`](./ARCHITECTURE.md) — how the system is built · [`SKILLS.md`](./SKILLS.md) — the agent's composable capabilities · [`README.md`](./README.md) — quickstart & deploy.

---

## What this project is

**Nishu Research** is a self-learning, gold-focused AI trading agent with a React "trading desk" cockpit. It is an **npm-workspaces monorepo**:

```
apps/web        @nishu/web     React 19 + Vite cockpit            → Vercel
apps/server     @nishu/server  Hono API + agent runtime + cron    → Render / Railway
packages/shared @nishu/shared  domain model + pure agent core     (imported by both)
```

The loop is real: the server pulls **live gold data from Yahoo Finance**, the **decision engine** in `packages/shared` derives stance/conviction/levels/scenarios/playbook from real price action, and the **learning engine** re-weights the model from the realised reaction to each catalyst (`POST /api/cycle`). It is **advisory** — keep the "Not financial advice" framing; there is no real-money execution.

**What is *not* real yet:** LLM-based reflection (the learning update is deterministic/quant today), paper-trading P&L, and a durable database (state is a JSON file by default). See `ARCHITECTURE.md` §Roadmap (P3 reflection, P4 paper, P5 live).

---

## The seam (read before adding data)

`packages/shared` is the **contract** between the cockpit and the brain. It holds the types, the closed `DRIVER` taxonomy, the deterministic agent math, and the **seed/fallback** dataset.

- **Server** (`apps/server`) adds I/O: Yahoo ingestion, the JSON store, HTTP. It composes a `Decision` via `buildDecision(...)` and learns via `runLearning(...)` — both from `@nishu/shared`. It serves an `AgentSnapshot` at `GET /api/snapshot`.
- **Web** (`apps/web`) renders that snapshot through `src/api/useAgent.ts`. When the API is down it **falls back to the shared seed** (`apps/web/src/data/index.ts` is just `export * from "@nishu/shared"`), so the cockpit always renders. A `sample data` vs `live` badge tells which.

When adding intelligence: put pure logic in `packages/shared/src/agent/*`, I/O in `apps/server/src/*`, and keep the `AgentSnapshot`/`Decision` shapes stable so the web layer doesn't churn. Don't fetch external data from inside web components.

---

## Commands

npm workspaces (Node ≥ 20). From the repo root:

```bash
npm install            # all workspaces; creates node_modules/@nishu/* symlinks
npm run dev            # web :5173 + agent API :8787 (concurrently)
npm run dev:web        # just the cockpit
npm run dev:server     # just the agent (tsx watch)
npm run build          # production build of the web app → apps/web/dist
npm run start:server   # run the agent API (tsx, no build step)
npm run cycle          # one learning tick (resolve due catalysts from real reactions)
npm run typecheck      # tsc across shared + server + web
```

No test runner is configured. `npm run typecheck` is the gate — run it before declaring a change done. `apps/web/vite.config.ts` proxies `/api/*` to `http://localhost:8787` in dev.

---

## Stack

| Concern | Choice |
| --- | --- |
| Cockpit | React **19** + Vite **8**, `StrictMode` (effects run twice in dev) |
| Agent API | **Hono 4** on `@hono/node-server`, run with **tsx** (no build step; tsx is a runtime dep) |
| Ingestion | **yahoo-finance2** (`GC=F` gold, `DX-Y.NYB`, `^TNX`) |
| Language | TypeScript **~6.0**, strict, `moduleResolution: bundler`, `verbatimModuleSyntax` |
| Shared pkg | `@nishu/shared` ships **TS source** (`main: src/index.ts`); web aliases it, server resolves the workspace symlink — **no build step for shared** |
| Styling | Inline styles + per-component injected `<style>` (prefixes `au-`/`nw-`/`twk-`). No CSS framework. Color via `apps/web/src/theme.ts` (`T`). |
| State store | Pluggable `Store` (JSON file default; `STORE=memory` for tests; Postgres TODO) |

Web runtime deps stay minimal (`react`, `react-dom`, `@nishu/shared`). The agent's math has **zero runtime deps** — it lives in `@nishu/shared` and is pure/testable.

---

## Conventions (match these)

- **Pure vs I/O split.** Decision/learning logic is pure and lives in `packages/shared/src/agent/*` (no fetch, no fs, no Date.now in the core math where avoidable — `now` is passed in). All I/O is in `apps/server`.
- **Types are central.** New domain concepts go in `packages/shared/src/types.ts`; the driver taxonomy is closed (`drivers.ts`). Don't redefine shapes in web/server.
- **`verbatimModuleSyntax`** is on everywhere — use `import type` for type-only imports. Use extensionless relative imports (bundler resolution + tsx both handle them).
- **No `structuredClone`** in shared (lib portability) — use `deepClone` from `agent/util.ts`.
- **Styling/theme/icons** unchanged from the original cockpit: color only via `T`, class prefixes per component, icons from `apps/web/src/components/Icons.tsx` via `ICON_MAP`.
- **Defensive ingestion.** Every Yahoo call is wrapped; on failure the runtime falls back to seed and marks the snapshot `source: "seed"`. Never let a data outage blank the UI.

---

## Gotchas

- **Yahoo may be blocked in sandboxes/CI** → the agent serves seed data (`source: "seed"`, `market.stale: true`). That's expected, not a bug. Live data appears when deployed with network access.
- **State file location follows cwd.** Default `STATE_FILE=.data/agent-state.json` resolves under the server's working dir (`apps/server/.data/...` when run via the workspace script). `.data` is git-ignored. Render uses `/tmp` (ephemeral).
- **Real clock drives the calendar.** `apps/server/src/ingest/calendar.ts` generates catalysts forward from `new Date()` (NFP = first Friday, CPI ≈ second Wednesday, FOMC from a published list). The web `TODAY`/`daysUntil` seed constant is only the offline fallback.
- **Stance is computed, not fixed.** On thin/seed history the engine may read **Bearish** (e.g. an end-of-series dip). That's the engine working, not a regression.
- **TweaksPanel is offline/fallback + a builder hook.** Its sliders only drive the UI when there's no live snapshot; it also speaks a `postMessage` edit-mode protocol to a parent visual editor. Don't remove that handshake casually.
- **Commit history** is young; branch before non-trivial work; commit/push only when asked.

---

## Where the work is going

P1 (live data), P2 (decision engine), and the P3 learning loop + cron are **built**. Next: an LLM reflection step on top of the deterministic update (gate behind `ANTHROPIC_API_KEY`, keep the deterministic fallback — consult the `claude-api` skill for model IDs), a Postgres `Store` adapter for durable learning, then paper-trading P&L. Roadmap detail in [`ARCHITECTURE.md`](./ARCHITECTURE.md).
