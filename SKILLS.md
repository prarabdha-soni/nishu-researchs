# SKILLS.md

The agent's capabilities, broken into composable **skills**. Each skill is one unit of work with typed inputs and outputs; chained together they execute the `Perceive → Decide → Act → Observe → Learn` loop from [`AGENT.md`](./AGENT.md). For where each runs, see [`ARCHITECTURE.md`](./ARCHITECTURE.md); for the code seam, see [`CLAUDE.md`](./CLAUDE.md).

> **Status:** Skills S1–S10 are **implemented** (deterministic) in `packages/shared/src/agent/*` and `apps/server/src/*`; the "Today" column notes the seed fallback each maps to. The LLM-reflection half of S10, and S8's paper/live actuators, are the remaining work. References to "`data/index.ts`" mean the `@nishu/shared` data layer.

---

## 1. What "skill" means here

A skill is a **pure-ish capability**: it takes typed input, returns typed output, and (where noted) reads/writes the agent state store. Skills are independently testable and backtestable, and they compose into the loop. This is *not* the Claude Code "skills" system — it's the agent's own capability catalog.

Design rules:
- **One job each.** A skill classifies, *or* scores, *or* sizes — not all three.
- **Typed I/O.** Inputs/outputs are the `data/index.ts` shapes (or the `Decision`/`Outcome` types from `AGENT.md` §3).
- **Deterministic where it can be.** Quant skills (score, size, calibrate) are deterministic and backtestable; reasoning skills (classify, scenario, reflect) may use an LLM but still emit structured output.
- **No skill edits a guardrail.** Risk limits live outside the catalog (`AGENT.md` §7).

---

## 2. Skill catalog

| # | Skill | Loop phase | In → Out | Today (mock) |
| --- | --- | --- | --- | --- |
| S1 | **Research / Ingest** | Perceive | feeds → normalized, driver-taggable records | `priceSeries`, `catalysts`, `REASONING` |
| S2 | **Driver-Classify** | Perceive | record → `driver` + confidence | `DRIVER` taxonomy; `event.driver` |
| S3 | **Impact-Score / Evidence** | Perceive | signals → evidence board + surprise-vs-consensus | `EVIDENCE`, `event.move` |
| S4 | **Scenario-Tree** | Decide | catalyst + state → branches w/ probs + actions | `SCN` |
| S5 | **Conviction-Calibrate** | Decide | evidence + weights + history → stance + conviction | `thesis.stance/conviction`, `EvidenceChain` |
| S6 | **Position-Size & Ladder** | Decide | conviction + risk → sized scale-in ladder | ladder/`book` in `Terminal` |
| S7 | **Armed-Orders** | Decide | scenarios + levels → IF→THEN rule set | `playbook` in `Terminal` |
| S8 | **Advise / Execute** | Act | decision → brief \| paper fill \| live order | `BriefModal`, "Next move" |
| S9 | **Outcome-Evaluate** | Observe | decision + realised data → error + branch hit | `events[]`, `TRACK` |
| S10 | **Reflect & Learn** | Learn | (decision, outcome, error) → weight deltas + journal | `LEARN` |
| S11 | **Brief-Generate** | (cross) | current state → shareable daily brief | `BriefModal` |

---

## 3. Skills in detail

### S1 · Research / Ingest  *(Perceive)*
- **Purpose:** pull the raw world — prices (Au/Ag/Cu), news & filings, the economic calendar, and positioning data (CFTC, DXY, real yields) — and normalize to timestamped records ready to tag by driver.
- **In:** feed adapters / API responses. **Out:** `IngestedRecord[]` (source, timestamp, text/values, asset).
- **Today:** `priceSeries`, `catalysts`, and the rotating `REASONING` strings stand in for a real ingestion trace.
- **Target:** adapters per source; dedupe; the "Live reasoning" ticker becomes the real tool/ingest log.

### S2 · Driver-Classify  *(Perceive)*
- **Purpose:** label each record with its **driver** — `macro | mechanical | positioning | geopolitical | narrative` — the vocabulary the whole system shares.
- **In:** `IngestedRecord`. **Out:** `{ driver, confidence }`.
- **Today:** every `event` already carries a `driver`; `DRIVER` holds the closed taxonomy + color/icon.
- **Target:** LLM classifier (structured output) with a confidence; abstains/flags when ambiguous. Keep the taxonomy closed — extending it is a deliberate change across all consumers.

### S3 · Impact-Score / Evidence  *(Perceive)*
- **Purpose:** turn classified signals into (a) an **evidence board** (each signal aligned / against the thesis → a confidence %) and (b) a **surprise-vs-consensus** magnitude — because *the surprise moves the market, not the level* (`AGENT.md` §5).
- **In:** classified records + the agent's prior expectation. **Out:** `Signal[]` (`{key, state, aligned}`) + expected-impact estimate.
- **Today:** `EVIDENCE` (4 signals → `aligned/total → confidence`); `event.move` is the realised magnitude.
- **Target:** per-driver impact model weighted by the learned driver weights; emits the `EvidenceChain` board live.

### S4 · Scenario-Tree  *(Decide)*
- **Purpose:** for the next catalyst, enumerate outcome **branches** with probabilities, a predicted move range, and a pre-committed action per branch.
- **In:** catalyst + agent state + evidence. **Out:** `ScenarioBranch[]` (`{label, prob, predictedMove:[lo,hi], action, note}`).
- **Today:** `SCN` — e.g. CPI → Soft/In-line/Hot, each with `kind: buy|wait|trim` and a move band; rendered by `ScenarioLab`.
- **Target:** LLM generates branches conditioned on the quant signals; probabilities sum to 1; each branch's action is consistent with the ladder (S6) and rails.

### S5 · Conviction-Calibrate  *(Decide)*
- **Purpose:** collapse evidence + driver weights + calibration history into a **stance** and a **calibrated conviction** (0–100). Conviction drives size, so it must be honest.
- **In:** evidence board, driver weights, recent calibration error. **Out:** `{ stance, conviction }`.
- **Today:** `thesis` (`Bullish`, `82`); `STANCE` map; `EvidenceChain` confidence.
- **Target:** conviction = f(aligned evidence, weights) **discounted by recent miss rate**; the `Scorecard` (`hit 68%`) is its calibration scoreboard. Floored/capped (guardrail).

### S6 · Position-Size & Ladder  *(Decide)*
- **Purpose:** map conviction + risk budget to a **staged scale-in ladder** and a book allocation (core / dry-powder / tail-hedge).
- **In:** conviction, invalidation, risk budget. **Out:** `LadderRung[]` (`{px, size, tag}`) + `book` split.
- **Today:** the ladder ($5,150 / $5,050 / $4,950) and `book` (55/35/10) are derived in `Terminal` from `addSize`/`dipLevel`.
- **Target:** size scales with calibrated conviction and distance-to-invalidation; respects position caps (guardrail).

### S7 · Armed-Orders  *(Decide)*
- **Purpose:** compile scenarios + levels into an explicit **IF→THEN** rule set the agent (or human) commits to in advance — *"if this happens, Nishu does this."*
- **In:** scenario tree + ladder + rails. **Out:** `ArmedOrder[]` (`{when, kind: buy|wait|trim|cut, size, note, primary}`).
- **Today:** the `playbook` array in `Terminal` (e.g. `ADD +25% on a dip into $5,150`; `CUT → 30% on a close below $4,900`).
- **Target:** rules become live triggers (advisory alert / paper fill / live order); the `cut` rule enforces invalidation regardless of conviction.

### S8 · Advise / Execute  *(Act)*
- **Purpose:** the actuator — emit the recommendation, simulate a fill, or place a real order. **Same decision upstream; only this skill changes across advisory → paper → live.**
- **In:** the `Decision` + a triggered `ArmedOrder`. **Out:** a brief/alert, a paper fill, or a broker order receipt.
- **Today:** advisory only — `BriefModal` and the "Next move" card.
- **Target:** pluggable backends per `ARCHITECTURE.md` roadmap; live execution gated behind risk controls + human-in-the-loop.

### S9 · Outcome-Evaluate  *(Observe)*
- **Purpose:** when a catalyst resolves, record the realised move, which scenario branch hit, the realised surprise, and the trade result; update the ledger and track record.
- **In:** the prior `Decision` + realised market data. **Out:** `Outcome` (`{realisedMove, branchHit, surprise, resultR}`).
- **Today:** each `events[]` entry is a resolved catalyst (`move`, `acted`, `detail`); `TRACK` is the self-score.
- **Target:** writes the trade ledger; feeds S10 and recomputes `TRACK` (`hit`, `avgR`, `best/worst`).

### S10 · Reflect & Learn  *(Learn)* — the keystone
- **Purpose:** convert `(Decision, Outcome, error)` into model improvement: bounded driver-weight + half-life updates, conviction recalibration, and a versioned journal entry; optionally propose new rules/skills.
- **In:** `Decision`, `Outcome`, error attribution. **Out:** `WeightDelta[]` + a `LEARN` entry + (optional) proposed rule/skill.
- **Today:** `LEARN` — e.g. *Warsh predicted −4% / realised −8.7% → `narrative −18%`*; *Hormuz decay → `geo decay 2×`*; *positioning promoted → `positioning +12%`*.
- **Target:** two substrates working together (detailed in `AGENT.md` §6):
  - **Quant:** bounded online updates → the numeric `delta`s; deterministic, backtestable.
  - **Reflective (LLM):** reads the miss, writes the journal `note`, proposes structural changes ("narrative shocks need a cascade premium").
  Every change is **versioned and reversible**; a delta that hurts the live hit rate is rolled back.

### S11 · Brief-Generate  *(cross-cutting)*
- **Purpose:** render the current agent state into a shareable, printable daily brief — stance, conviction, target, next move, buy zone, invalidation, R:R, thesis line.
- **In:** current state. **Out:** the brief (`BriefData` in `BriefModal.tsx`).
- **Today:** fully built — `BriefModal` with print-to-PDF.
- **Target:** populated from live state instead of derived mock values; unchanged otherwise.

---

## 4. How skills compose into the loop

```
PERCEIVE   S1 Ingest ─► S2 Classify ─► S3 Impact/Evidence
                                            │
DECIDE     S4 Scenario-Tree ─► S5 Conviction ─► S6 Size/Ladder ─► S7 Armed-Orders
                                            │
ACT        S8 Advise / Execute  ◄───────────┘     (+ S11 Brief any time)
                │
OBSERVE    S9 Outcome-Evaluate   (catalyst resolves)
                │
LEARN      S10 Reflect & Learn ─► updates weights + conviction + journal
                │
                └────────►  feeds S3/S4/S5 on the next cycle  (closing the loop)
```

The output of S10 is the input that changes S3/S4/S5 next time — that single back-edge is what makes the agent self-learning rather than a static rules engine.

---

## 5. Adding a new skill

The reflective layer (S10) may *propose* new skills — this is the path toward the agent extending itself (`AGENT.md` §8). The contract for any new skill:

1. **Typed I/O** against the `data/index.ts` shapes (or `Decision`/`Outcome`).
2. **Backtestable** — it must replay against historical catalysts and show it improves (or at least doesn't degrade) the hit rate / avg R before going live.
3. **Auditable** — it logs its rationale; if added by S10, the proposal lands in the `LEARN` journal with a version.
4. **Guardrail-safe** — it cannot widen or edit risk limits.
5. **Composes** — it slots into exactly one loop phase and names its upstream/downstream skills.

---

## 6. Skill roadmap

- **Multi-asset transfer:** generalise S2–S6 across `Au → Ag → Cu` so a lesson in one metal informs the others (the asset pills in `Terminal` already anticipate this).
- **New signals:** add ingestion + scoring for ETF flows, lease rates, options skew — each a small S1/S3 extension.
- **Regime detection:** a meta-skill feeding S5 so conviction adapts when the macro regime itself shifts.
- **Self-authored skills:** S10 writing and backtesting genuinely new capabilities — the most ambitious item, and the clearest step toward the "AGI for markets" north star.
