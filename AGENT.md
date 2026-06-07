...# AGENT.md — Nishu, the self-learning trading agent

How the agent thinks, decides, and learns. This is the heart of the project. For the system that hosts it see [`ARCHITECTURE.md`](./ARCHITECTURE.md); for the capabilities it's built from see [`SKILLS.md`](./SKILLS.md); for working in the code see [`CLAUDE.md`](./CLAUDE.md).

> **Status:** The loop below is now **implemented** — the decision engine and the deterministic learning update live in `packages/shared/src/agent/*`, driven by live Yahoo data in `apps/server`. The remaining design-only piece is the **LLM reflection** variant of the learning step (§6). References to "`data/index.ts`" below now mean the `@nishu/shared` data layer.

---

## 1. Mandate

Nishu is an **autonomous, self-improving research-and-trading agent** for precious/industrial metals — **gold first** (`Au`), with silver (`Ag`) and copper (`Cu`) on the roadmap (see the asset pills in `Terminal.tsx`).

Its job is a single, repeating sentence:

> **Predict how the next catalyst will move the market, take (or recommend) a position, watch the outcome, update its own decision model from the error, and trade the next move accordingly.**

It is **advisory by default** — it produces stances, scenario trees, armed-order plans, and briefs for a human (current framing: *"Nishu advises on scenarios; it does not guarantee outcomes. Not financial advice."*). Paper-trading and optional live execution are later phases (see `ARCHITECTURE.md` §Roadmap). The intelligence is identical across all three; only the actuator changes.

---

## 2. The core loop

This is the whole idea. Every cycle is anchored to a **catalyst** — a scheduled or breaking event that moves metals (CPI, FOMC, NFP, a geopolitical shock).

```
        ┌─────────────────────────────────────────────────────────┐
        │                                                           │
        ▼                                                           │
   ① PERCEIVE  ──►  ② DECIDE  ──►  ③ ACT  ──►  ④ OBSERVE  ──►  ⑤ LEARN
   ingest news,     stance +       advise /     the catalyst    measure error,
   prices, calendar conviction,    place the    resolves;       update weights +
   positioning      scenario tree, order, or    record the      memory, recalibrate
                    armed orders    arm a rule   realised move   conviction
        ▲                                                           │
        └───────────────────────────────────────────────────────────┘
                         the updated model feeds the next PERCEIVE
```

| Phase | What happens | Where it shows in the UI today |
| --- | --- | --- |
| ① Perceive | Ingest global news, price series, the economic calendar, and positioning data; classify each input by **driver**. | "Live reasoning" ticker, `ReasoningStream`; `priceSeries`, `catalysts` |
| ② Decide | Produce a **stance** + **conviction**, a **scenario tree** for the next catalyst, and a **playbook** of pre-committed IF→THEN orders sized along a ladder. | Hero (stance/conviction), `ScenarioLab` (`SCN`), playbook & ladder in `Terminal`, `EvidenceChain` |
| ③ Act | Emit the recommendation / arm the rule / (later) place the order. | "Next move", "Armed orders" |
| ④ Observe | When the catalyst resolves, capture the **realised move** and which scenario branch hit. | `events[]` (each is a resolved catalyst + what Nishu did) |
| ⑤ Learn | Compare realised vs predicted, attribute the error to drivers, update weights + the memory journal, recalibrate conviction. | "How Nishu is learning" (`LEARN`), `Scorecard` (`TRACK`) |

The loop is **online**, not batch: each resolved catalyst immediately re-weights the model that prices the next one. That is what "self-learning" means here.

---

## 3. Agent state

What Nishu carries between cycles (the model the loop mutates):

| State | Shape (today's mock) | Meaning |
| --- | --- | --- |
| **Stance** | `Bullish \| Neutral \| Bearish` (`STANCE`, `thesis.stance`) | Directional regime view. |
| **Conviction** | `0–100` (`thesis.conviction = 82`) | Calibrated confidence in the stance. Drives sizing. |
| **Thesis** | `{ stance, conviction, target, line }` | The structural narrative + a 12-mo price target (`6000`). |
| **Driver weights** | implicit; surfaced as `LEARN` deltas | How much each driver class moves the prediction. **This is what learning updates.** |
| **Positioning** | core / dry-powder / tail-hedge split + avg entry | Current book. |
| **Playbook** | array of IF→THEN orders w/ `kind: buy\|wait\|trim\|cut` | Pre-committed responses. |
| **Risk rails** | invalidation `$4,900`, trim `$5,750`, target, reward:risk | Hard constraints. |
| **Memory / journal** | `LEARN` entries (versioned) | Append-only record of what it learned and why. |
| **Track record** | `TRACK` (hit %, avg R, best/worst) | Self-scored performance. |

A **Decision** the agent emits for a catalyst looks like (target schema — formalise in `data/index.ts`):

```ts
interface Decision {
  catalystId: string;          // e.g. "cpi_jun"
  asOf: string;                // ISO timestamp
  stance: Stance;              // Bullish | Neutral | Bearish
  conviction: number;          // 0–100, calibrated
  scenarios: ScenarioBranch[]; // {label, prob, predictedMove:[lo,hi], action}
  primaryAction: Action;       // {kind: buy|wait|trim|cut, size, level}
  evidence: Signal[];          // {key, state, aligned} → confidence
  invalidation: number;        // price that kills the thesis
  rationale: string;           // human-readable "why"
}
```

After the catalyst resolves it pairs with an **Outcome** to produce a learning update (§6).

---

## 4. The driver model

Nishu does not predict price directly; it predicts **why** price will move, then maps cause → magnitude. Drivers are a **closed taxonomy** (`DRIVER` in `data/index.ts`):

| Driver | What it captures | Example in the record |
| --- | --- | --- |
| **macro** | Rates / inflation / growth prints | CPI 3.8% shock (`cpi_apr`, −6.2%) |
| **mechanical** | Forced flows: margin calls, liquidations, gamma | Margin-call cascade (`margin`, −3.6%, the year's low) |
| **positioning** | CFTC crowding, squeezes | Crowded-short unwinds (raised to a primary trigger in `LEARN`) |
| **geopolitical** | Conflict / supply chokepoints | Strait of Hormuz (`hormuz`, +7.5%) |
| **narrative** | Regime/story shifts markets re-price | Warsh named Fed Chair (`warsh`, −8.7%) |

Each driver carries a **weight** (impact multiplier) and a **half-life** (how fast its effect decays). Both are learned. Two real calibration lessons already encoded in `LEARN`:

- **Geopolitical half-life shortened** — Hormuz premium decayed in ~6 sessions, not the modelled 12 → `geo decay 2×`.
- **Positioning promoted** — crowded-short unwinds explained 3 of the last 4 squeezes → `positioning +12%`, moved from *confirmer* to *primary trigger*.

---

## 5. Conviction & calibration

Conviction (0–100) is the bridge from belief to size — higher conviction → larger ladder adds (see `addSize` and the scale-in ladder in `Terminal`). It must be **calibrated**: when Nishu says 80%, it should be right ~80% of the time. The `Scorecard` (`hit 68%`, `avgR 1.8`) is the calibration scoreboard.

Conviction is assembled from aligned evidence (`EvidenceChain`: `aligned / total → confidence %`) and the driver weights, then **discounted by recent calibration error**. A core principle, taken straight from the record (`nfp_may`):

> **The surprise moves the market, not the level.** May NFP printed 172k vs 85k consensus — gold made a fresh low on the *gap to expectations*, not the absolute number.

So conviction is scored against **consensus-relative surprise**, and the agent must hold an explicit expectation for each catalyst to even have an opinion worth sizing.

---

## 6. The learning mechanism (the part that makes it "self-learning")

When a catalyst resolves, Nishu runs a **learning update**. This is the mechanism behind the "How Nishu is learning" timeline — and the thing to actually build.

**Step by step:**

1. **Capture outcome.** Realised move, which scenario branch hit, realised surprise vs consensus. (Each `events[]` entry is a resolved catalyst with `move`, `driver`, and `acted`.)
2. **Compute error.** `error = realisedMove − predictedMove` for the dominant driver. The canonical worked example lives in `LEARN`:
   > *Warsh call: predicted −4%, realised −8.7%.* A narrative shock detonated a mechanical cascade.
3. **Attribute & update weights.** Push the error onto the responsible driver(s). The Warsh miss produced **`narrative −18%`** — lone narrative signals are down-weighted and now carry a *mechanical-cascade risk premium* (narrative shocks can trigger forced selling). Updates are bounded per cycle (no whiplash from one print).
4. **Recalibrate conviction.** Adjust the confidence→outcome mapping so future convictions stay honest (feeds `Scorecard`).
5. **Update half-lives** where decay was mis-modelled (e.g. `geo decay 2×`).
6. **Reflect to memory.** Write a versioned journal entry — *what changed, by how much, and why* — exactly the `LEARN` shape: `{ date, ver, title, note, delta }`. This is the agent's append-only, auditable rationale (`conviction v3.4`, `signal-weights v3.3`, …).
7. **Re-decide.** The updated model immediately re-prices the *next* catalyst — closing the loop.

**Two complementary learning substrates** (recommended hybrid — see `ARCHITECTURE.md`):

- **Quantitative:** bounded online updates to driver weights, half-lives, and the conviction calibration curve. Deterministic, backtestable, the source of the numeric `delta`s.
- **Reflective (LLM):** a reasoning model reads `(Decision, Outcome, error)`, writes the human-readable journal `note`, and proposes structural changes ("narrative shocks need a cascade premium") that become new rules/skills. This is the "AGI feel" — the agent narrating and amending its own playbook.

The numeric update keeps it honest; the reflective update lets it discover *new structure* a fixed model can't. Every change is **versioned and reversible** — if a weight change degrades the live hit rate, roll it back.

---

## 7. Guardrails

A self-modifying trading agent needs hard limits that learning **cannot** edit:

- **Invalidation is sacred.** A daily close below the invalidation level (`$4,900`) forces de-risk to a core hold and a regime re-assessment — regardless of conviction (`playbook` rule `t5: CUT → 30%`).
- **Bounded updates.** Per-cycle weight changes are capped; conviction is floored/capped; no single outcome can flip the model.
- **Position & loss caps** sit outside the learnable model.
- **Human-in-the-loop** for live execution until calibration is proven on paper.
- **Auditability.** Every decision and every learning update is logged with its rationale (the `LEARN` journal). No silent self-modification.
- **Honest framing.** Advisory unless/until execution is real; never present mock state as live (see `CLAUDE.md`).

---

## 8. The "AGI" question — stated honestly

The intro screen tags Nishu *"AI · AGI"* and frames it as *"an agent compounding its own edge, toward AGI for markets."* Treat that as a **north star, not a present claim.** What exists in design is a **narrow, self-improving agent**: it learns within one domain (metals macro), from its own outcomes, online. That is genuinely valuable and genuinely "self-learning" — it is not general intelligence.

What would push it *toward* the aspiration, in order of ambition:

1. **Transfer** — the same loop generalising across assets (gold → silver → copper → rates) so a lesson in one market informs another.
2. **Self-authored skills** — the reflective layer not just tuning weights but *writing new capabilities* (a new signal, a new scenario type) and validating them on history (see `SKILLS.md` §"Adding a skill").
3. **Meta-learning** — learning *how* to learn: adapting its own update rules and calibration when the macro regime itself changes.

Keep the engineering grounded and the marketing copy honest; let the results, not the label, carry the claim.

---

## 9. Worked example — the Jun 10 CPI cycle

Ties §2–§6 to the data the demo ships with (`TODAY = 2026-06-07`; next catalyst `May CPI · Jun 10`).

- **① Perceive.** Evidence: CFTC net shorts *crowded*, DXY momentum *stalling*, official demand *buying* (aligned); real yields *rising* (against). 3/4 aligned → ~75–82% confidence (`EVIDENCE`).
- **② Decide.** Stance **Structurally Bullish**, conviction **82**. Scenario tree (`SCN.cpi`): **Soft** → ADD (squeeze, +0.8–2.5%); **In-line** → WAIT (range); **Hot** → BUY DIP (flush toward $5,050 — "exactly the dip the ladder wants"). Primary armed order: **Add +25% on any dip below $5,150**, staged across rungs $5,150 / $5,050 / $4,950.
- **③ Act.** Arm the ladder; emit the brief.
- **④ Observe (hypothetical).** CPI prints **hot**; gold flushes to **$5,060**, realised −2.4% vs a predicted −0.8 to −2.0%. The "Hot → BUY DIP" branch hit; the primary rung filled.
- **⑤ Learn.** Realised slightly exceeded the modelled range → small upward nudge to the macro-surprise weight and a calibration note; conviction held (the *direction of the playbook* was right, only the magnitude band was tight). Journal entry, `calibration v3.5`: *"Hot-CPI flush ran ~0.4% beyond band; widened macro downside tail. Ladder thesis validated."* The next catalyst — **FOMC · Jun 17** — is now priced with the updated macro weight, and its scenario tree (`SCN.fomc`: Dovish/Hold/Hawkish) is re-evaluated against the new, larger position.

That is the entire agent: *trade the event, then let the event re-teach the agent before the next trade.*
