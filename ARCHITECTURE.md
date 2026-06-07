# ARCHITECTURE.md

How the system is built today and how it becomes the self-learning agent. Pair with [`AGENT.md`](./AGENT.md) (the decision/learning logic), [`SKILLS.md`](./SKILLS.md) (the capabilities), and [`CLAUDE.md`](./CLAUDE.md) (working in the code).

> **Built so far (P1–P3):** the monorepo, the live Yahoo-Finance ingestion, the decision engine, and the autonomous learning loop + cron are implemented (`packages/shared`, `apps/server`). The sections below describe the full target system; the roadmap (§6) marks what's done. The agent is advisory; LLM reflection, paper P&L, and a durable DB are the remaining phases.

---

## 1. Two layers of truth

| | Today (shipped) | Target (to build) |
| --- | --- | --- |
| **Presentation** | React 19 cockpit reading live `AgentSnapshot`, seed fallback | richer live surfaces (SSE, more assets) |
| **Intelligence** | decision + learning engine in `packages/shared` (deterministic) | + LLM reflection on top of the quant core |
| **Data** | live Yahoo Finance + JSON-file state store | durable Postgres + a real calendar feed |
| **Execution** | advisory only | advisory → paper → optional live |

The strategy is to keep the cockpit and grow a brain behind it. **`src/data/index.ts` is the contract between the two layers** — today it exports literals; tomorrow those same shapes are served from the backend. Nail the schema there and the front-end barely changes.

---

## 2. Current architecture (what runs now)

A dependency-light client-rendered SPA. No backend, no network calls, no persistence.

```
index.html  ──► src/main.tsx (createRoot, StrictMode)
                     │
                     ▼
                 src/App.tsx ── entered? ──► Terminal.tsx        (the desk)
                     │           else  ──►   Welcome.tsx         (intro)
                     │
   theme.ts (tokens) ┘
                     ▼
   Terminal composes ── GoldChart · ReasoningStream · EvidenceChain
                        Scorecard · LearningLog · ScenarioLab
                        BriefModal · TweaksPanel · Icons
                     ▲
                     │  props derived from ↓
              src/data/index.ts   ★ all domain data + types (the seam)
```

**Characteristics:**
- **Rendering:** 100% client-side; `Terminal` derives everything (ladder, rails, playbook, R:R) from `data/index.ts` + live tweak values at render time.
- **State:** local `useState`/`useEffect` only. `useTweaks` holds the editable agent view in memory; nothing persists across reload.
- **"Live" effects are cosmetic:** `livePx` random walk, the rotating `REASONING` ticker, the intro progress bar. No real time, no real data.
- **Charting** is hand-rolled SVG (`GoldChart.tsx`) — no charting lib.
- **Styling** is inline + injected `<style>` blocks keyed by class prefix (`au-`/`nw-`/`twk-`); color via the `T` token object.
- **External host hook:** `TweaksPanel` speaks a `postMessage` protocol (`__activate_edit_mode` / `__edit_mode_available` / …) to a parent visual-editor frame. It is the only outward integration and is unrelated to the trading domain.

---

## 3. Domain model (the data contracts)

These already exist as typed literals in `src/data/index.ts`. The target system serves the *same shapes* from live sources. Canonical concepts:

| Concept | Today | Becomes |
| --- | --- | --- |
| `priceSeries` | weekly mock points | live OHLC feed for `Au`/`Ag`/`Cu` |
| `TradeEvent` / `events[]` | resolved catalysts (`move`, `driver`, `acted`, `detail`) | observed outcomes written by the learning loop |
| `catalysts[]` | upcoming CPI/FOMC/NFP w/ `tag` | live economic calendar |
| `thesis` | `{stance, conviction, target, line}` | current agent state (persisted) |
| `DRIVER` | closed taxonomy + color/icon | unchanged — the shared driver vocabulary |
| `SCN` | scenario trees per catalyst | model output: branches w/ probabilities + actions |
| `EVIDENCE` | signals aligned → confidence | live signal board |
| `LEARN` | authored "learning" entries | append-only learning journal written on each outcome |
| `TRACK` | hit/avg-R/best/worst | computed from the trade ledger |
| `REASONING` | rotating strings | real reasoning trace / tool log |

**First implementation step** is to formalise these into explicit `interface`s (only `TradeEvent` is typed today) and a `Decision`/`Outcome` pair (see `AGENT.md` §3). Keep the exports' names and shapes stable so components stay untouched.

---

## 4. Target architecture (the agent behind the cockpit)

A pipeline that realises the `Perceive → Decide → Act → Observe → Learn` loop from `AGENT.md`.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          ORCHESTRATION  (event-driven)                     │
│   schedule: each catalyst → run cycle;  webhook: breaking news → run cycle │
└──────────────────────────────────────────────────────────────────────────┘
        │
        ▼
① INGESTION ───────────────► ② SIGNAL / FEATURE ──────► ③ DECISION ENGINE
  • prices (Au/Ag/Cu)          • driver-classify          • stance + conviction
  • news / filings             • impact-score             • scenario tree (probs)
  • econ calendar              • evidence board           • playbook (IF→THEN)
  • CFTC positioning           • surprise vs consensus     • position sizing / ladder
  • DXY, real yields                                       • invalidation / R:R
        │                                                        │
        │                                                        ▼
        │                                                  ④ ACTUATOR
        │                                                   advisory | paper | live
        │                                                        │
        ▼                                                        ▼
⑥ STATE / MEMORY STORE  ◄──────── ⑤ LEARNING ENGINE ◄──── OUTCOME (catalyst resolves)
  • agent state (thesis…)         • realised vs predicted error
  • driver weights / half-lives   • bounded weight + half-life update
  • trade ledger                  • conviction recalibration
  • learning journal (LEARN)      • LLM reflection → journal + new rules
        │
        └──────────────►  API  ──────────►  PRESENTATION (the existing React SPA)
                       serves data/index.ts shapes as live state
```

### Layer responsibilities

1. **Ingestion** — adapters for market data, a news/filings stream, the economic calendar, and positioning (CFTC, DXY, real yields — the `EVIDENCE` inputs). Normalises everything to timestamped, driver-taggable records.
2. **Signal / feature** — classifies each input by **driver** (the closed taxonomy), scores expected impact, computes **surprise vs consensus**, and maintains the evidence board → confidence. (Skills S2/S3 in `SKILLS.md`.)
3. **Decision engine** — produces the `Decision`: stance, calibrated conviction, scenario tree with probabilities, the sized playbook + ladder, invalidation and reward:risk. Hybrid: a **quant model** for signals/conviction + an **LLM** for narrative synthesis, scenario trees, and rationale. (Skills S4–S7.)
4. **Actuator** — emits the recommendation (advisory), simulates fills (paper), or routes to a broker/exchange (live). Same decision upstream; only the actuator differs. (Skill S8.)
5. **Learning engine** — on each resolved catalyst, computes error, applies **bounded** weight/half-life updates, recalibrates conviction, and runs an **LLM reflection** that writes the journal entry and may propose new rules/skills. Versioned and reversible. (Skills S9/S10 — the mechanism is detailed in `AGENT.md` §6.)
6. **State / memory store** — the persisted agent: thesis, driver weights, calibration curve, trade ledger, and the append-only `LEARN` journal. This is the thing the loop mutates and the API serves.
7. **Orchestration** — event-driven: a scheduler fires a cycle per calendar catalyst; webhooks fire cycles on breaking news; a post-event hook fires the learning update when an outcome lands.
8. **API + presentation** — a thin API serves the `data/index.ts` shapes as live state; the existing SPA renders them. Add SSE/WebSocket so the "live" surfaces (price, reasoning) become genuinely live.

---

## 5. Recommended tech (proposals, not yet chosen)

Deliberately minimal to start; every choice is reversible.

| Layer | Suggestion | Why |
| --- | --- | --- |
| Backend | **TypeScript (Node)** service — Hono/Express or Next route handlers | One language across stack; shares the `data/index.ts` types verbatim. |
| Agent/reflection | **Claude via the Anthropic SDK** (see the `claude-api` skill) for classification, scenario synthesis, and the reflection/journal step | Strong reasoning + tool use; pairs with a quant core. |
| Quant core | A small TS/Python module for bounded online weight updates + calibration | Deterministic, backtestable, owns the numeric `delta`s. |
| Storage | **SQLite/Postgres** for the ledger + agent state; the journal is append-only | Auditability; easy to version and roll back. |
| Realtime | **SSE or WebSocket** | Turn cosmetic "live" surfaces into real ones. |
| Scheduling | Cron / queue keyed to the economic calendar | One cycle per catalyst; post-event learning hooks. |
| Backtesting | Replay harness over historical catalysts | Validate any weight/skill change before it goes live. |

> When working on anything LLM-related, consult the `claude-api` skill for current model IDs, pricing, tool-use, and caching — don't hardcode from memory.

---

## 6. Build roadmap (phased)

Each phase ships something demonstrable and keeps the cockpit honest about what's real.

| Phase | Goal | Done when |
| --- | --- | --- |
| **P0 — cockpit** | React desk with seed data | ✅ shipped |
| **P1 — live read** | Real gold prices + generated calendar; an API; live price polling | ✅ **done** — `apps/server` ingest + `/api/snapshot`, `/api/price`; web reads via `useAgent` |
| **P2 — decision engine** | Driver-scored evidence, scenario tree, conviction, levels — generated, not authored | ✅ **done** — `packages/shared/src/agent/*`, served in `decision` |
| **P3 — learning loop** | Outcome capture + bounded weight update + conviction recalibration + journal | ✅ **done (quant)** — `learn.ts`, `/api/cycle`, weekday cron. *Next: LLM reflection layer* |
| **P4 — paper trading** | Simulated fills against live prices; honest self-scored P&L | ◻ todo — `Scorecard` reflects a real (paper) ledger |
| **P5 — live (optional)** | Broker/exchange execution behind hard risk controls + human-in-the-loop | ◻ todo — only after P3 calibration is proven on paper |

Do not skip P3 before P4/P5: an agent that trades before it has demonstrably calibrated learning is just a bot with extra UI.

---

## 7. Cross-cutting concerns

- **Auditability first.** Every decision and every learning update is persisted with its rationale (the `LEARN` journal). No silent self-modification — this is both a safety and a debugging requirement.
- **Backtest every change.** Weight updates, new signals, and new skills must replay against historical catalysts before going live (P5).
- **Guardrails live outside the learnable model** — invalidation, position/loss caps, human-in-the-loop. Learning cannot edit them (see `AGENT.md` §7).
- **Honesty contract.** A surface is either provably live (real source + timestamp) or visibly disclaimed. Never present mock state as real. The current footer and "Not financial advice" copy stay until the backing systems exist.
- **Keep the seam thin.** New intelligence routes through the `data/index.ts` contracts, not ad-hoc fetches inside components — so the cockpit and the brain can evolve independently.
