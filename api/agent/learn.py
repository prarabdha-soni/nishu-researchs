"""Learning engine — P3 / S9-S10. The keystone that makes Nishu self-learning.

On each resolved catalyst:
  1. Evaluate outcome (predicted vs realised, which branch hit, R-multiple).
  2. Bounded weight update — the responsible driver's weight shifts ±20% max.
  3. Recalibrate conviction (right → +0.02, wrong → -0.03).
  4. Append a versioned, human-readable journal entry.
  5. Recompute track record from the full ledger.
Every change is deterministic and reversible (AGENT.md §6)."""

from __future__ import annotations
import re
import copy
from api.models import AgentState, CatalystRef, Decision, LearnEntry, Outcome, TrackRecord
from api.agent.util import clamp, pct, m_fmt, d_day
from api.agent.drivers import DRIVER

_SIGN_MINUS = re.compile(r"−")  # unicode minus → ASCII


def _parse_band(s: str) -> tuple[float, float]:
    cleaned = _SIGN_MINUS.sub("-", s).replace("%", "")
    nums = [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?", cleaned)]
    lo = nums[0] if nums else 0.0
    hi = nums[1] if len(nums) > 1 else lo
    return min(lo, hi), max(lo, hi)


def _mid_band(s: str) -> float:
    a, b = _parse_band(s)
    return (a + b) / 2


def _branch_for_move(scenario, move: float) -> str | None:
    for o in scenario.opts:
        a, b = _parse_band(o.move)
        if a - 1e-6 <= move <= b + 1e-6:
            return o.k
    best, bd = None, float("inf")
    for o in scenario.opts:
        d = abs(_mid_band(o.move) - move)
        if d < bd:
            bd, best = d, o.k
    return best


def _dir_of(kind: str) -> int:
    if kind == "buy":  return 1
    if kind in ("trim", "cut"): return -1
    return 0


def _bump_version(v: str) -> str:
    def repl(m):
        a, b = m.group(1), m.group(2)
        return f"{a}.{int(b) + 1}"
    return re.sub(r"(\d+)\.(\d+)", repl, v)


def _recompute_track(ledger: list[Outcome], seed: TrackRecord) -> TrackRecord:
    if not ledger:
        return seed
    hit = round(sum(1 for o in ledger if o.correct) / len(ledger) * 100)
    rs = [o.resultR or 0.0 for o in ledger]
    avg_r = round(sum(rs) / len(rs), 1)
    sorted_l = sorted(ledger, key=lambda o: o.resultR or 0.0, reverse=True)

    def fmt_r(o: Outcome) -> str:
        r = o.resultR or 0.0
        return f"{'+' if r >= 0 else ''}{r:.1f}R"

    def lab(o: Outcome) -> str:
        return f"{m_fmt(o.date)} {d_day(o.date)} · {DRIVER[o.dominantDriver]['label']}"

    return TrackRecord(
        hit=hit,
        trades=len(ledger),
        avgR=avg_r,
        best={"label": lab(sorted_l[0]),  "r": fmt_r(sorted_l[0])},
        worst={"label": lab(sorted_l[-1]), "r": fmt_r(sorted_l[-1])},
    )


def evaluate_outcome(decision: Decision, cat: CatalystRef, realised_pct: float) -> Outcome:
    scen = decision.scenarios[0] if decision.scenarios else None
    leaned = scen.opts[scen.def_] if scen else None
    predicted_pct = _mid_band(leaned.move) if leaned else 0.0
    error_pct = round(realised_pct - predicted_pct, 2)
    branch_hit = _branch_for_move(scen, realised_pct) if scen else None

    result_r, correct = 0.0, False
    if leaned:
        if leaned.kind == "wait":
            correct = abs(realised_pct) < 1
            result_r = 0.0
        else:
            a, b = _parse_band(leaned.move)
            risk_unit = max(0.5, (b - a) / 2)
            signed = _dir_of(leaned.kind) * realised_pct
            result_r = round(clamp(signed / risk_unit, -3, 6), 1)
            correct = result_r > 0

    return Outcome(
        catalystId=cat.id,
        date=cat.date,
        dominantDriver=cat.tag,
        predictedMovePct=round(predicted_pct, 2),
        realisedMovePct=round(realised_pct, 2),
        errorPct=error_pct,
        branchHit=branch_hit,
        correct=correct,
        resultR=result_r,
    )


def apply_learning(state: AgentState, outcome: Outcome, cat: CatalystRef) -> tuple[AgentState, LearnEntry]:
    next_state = AgentState(**copy.deepcopy(state.model_dump()))
    d = outcome.dominantDriver
    w = next_state.weights[d]

    rel_err = (
        (abs(outcome.realisedMovePct) - abs(outcome.predictedMovePct))
        / max(1, abs(outcome.predictedMovePct))
    )
    delta = clamp(0.4 * rel_err, -0.2, 0.2)
    w.weight = round(clamp(w.weight * (1 + delta), 0.3, 2.0), 3)

    next_state.convictionCalib = round(
        clamp(next_state.convictionCalib + (0.02 if outcome.correct else -0.03), 0.6, 1.1), 3
    )

    next_state.ledger = next_state.ledger + [outcome]
    next_state.track = _recompute_track(next_state.ledger, state.track)
    next_state.version.weights     = _bump_version(next_state.version.weights)
    next_state.version.conviction  = _bump_version(next_state.version.conviction)
    next_state.version.calibration = _bump_version(next_state.version.calibration)

    drv_label = DRIVER[d]["label"]
    ran = ("ran past" if rel_err > 0.15 else "fell short of" if rel_err < -0.15 else "matched")
    if rel_err > 0.15:
        title = f"Raised {drv_label.lower()} weight — the move {ran} the model"
    elif rel_err < -0.15:
        title = f"Trimmed {drv_label.lower()} weight — the move {ran} the model"
    else:
        title = f"Confirmed {drv_label.lower()} weighting"

    entry = LearnEntry(
        date=f"{m_fmt(cat.date)} {d_day(cat.date)}",
        ver=f"weights {next_state.version.weights}",
        title=title,
        note=(
            f"{cat.label or cat.id}: predicted {pct(outcome.predictedMovePct)}, "
            f"realised {pct(outcome.realisedMovePct)}. "
            f"{'The leaned branch was right.' if outcome.correct else 'The leaned branch missed.'}"
        ),
        delta=f"{d} {'+' if delta >= 0 else ''}{round(delta * 100)}%",
    )

    next_state.journal = ([entry] + next_state.journal)[:12]
    from datetime import datetime, timezone
    next_state.updatedAt = datetime.now(timezone.utc).isoformat()
    return next_state, entry


def run_learning(
    state: AgentState,
    decision: Decision,
    cat: CatalystRef,
    realised_pct: float,
) -> tuple[AgentState, Outcome, LearnEntry]:
    outcome = evaluate_outcome(decision, cat, realised_pct)
    next_state, entry = apply_learning(state, outcome, cat)
    return next_state, outcome, entry
