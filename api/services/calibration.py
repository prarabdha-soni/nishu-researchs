"""Public calibration ledger — Brier scoring for every forward scenario.

The moat: start it empty, publish every miss. Accumulated scored history
is the one thing competitors can't copy. Brier score = (p - o)² where
o=1 if the branch hit, 0 if it missed. Lower = better calibrated.

Ledger is always public and always honest — misses included."""

from __future__ import annotations
import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from api.db import Scenario, ScenarioOutcome, Explanation
from api.services.data_service import series_since, latest


def _brier(probability: float, hit: bool) -> float:
    return round((probability - (1.0 if hit else 0.0)) ** 2, 4)


def resolve_scenario(
    db: Session,
    scenario_id: str,
    actual_move_pct: float,
) -> ScenarioOutcome:
    """Score a scenario against the realised move. Idempotent."""
    existing = (
        db.query(ScenarioOutcome)
        .filter(ScenarioOutcome.scenario_id == scenario_id)
        .first()
    )
    if existing:
        return existing

    scen = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scen:
        raise ValueError(f"Scenario {scenario_id} not found")

    lo = scen.predicted_move_lo or 0.0
    hi = scen.predicted_move_hi or 0.0
    branch_hit = lo - 0.1 <= actual_move_pct <= hi + 0.1
    brier = _brier(scen.probability, branch_hit)

    r_unit = max(0.5, (hi - lo) / 2) if hi != lo else 0.5
    direction = 1 if (lo + hi) / 2 > 0 else -1
    r_multiple = round((direction * actual_move_pct) / r_unit, 1)

    outcome = ScenarioOutcome(
        scenario_id=scenario_id,
        resolved_at=datetime.now(timezone.utc).isoformat(),
        actual_move=actual_move_pct,
        branch_hit=1 if branch_hit else 0,
        brier_score=brier,
        r_multiple=r_multiple,
    )
    db.add(outcome)
    db.flush()
    return outcome


def get_ledger(db: Session, limit: int = 100) -> dict:
    """Full public ledger with running stats per driver."""
    outcomes = (
        db.query(ScenarioOutcome, Scenario)
        .join(Scenario, ScenarioOutcome.scenario_id == Scenario.id)
        .order_by(ScenarioOutcome.resolved_at.desc())
        .limit(limit)
        .all()
    )

    rows = []
    brier_by_driver: dict[str, list[float]] = {}
    hit_by_driver: dict[str, list[bool]] = {}

    for out, scen in outcomes:
        driver = scen.driver
        brier_by_driver.setdefault(driver, []).append(out.brier_score)
        hit_by_driver.setdefault(driver, []).append(bool(out.branch_hit))
        rows.append({
            "scenario_id":  scen.id,
            "catalyst_id":  scen.catalyst_id,
            "label":        scen.label,
            "driver":       driver,
            "probability":  scen.probability,
            "predicted_lo": scen.predicted_move_lo,
            "predicted_hi": scen.predicted_move_hi,
            "if_then":      scen.if_then,
            "created_at":   scen.created_at,
            "actual_move":  out.actual_move,
            "branch_hit":   bool(out.branch_hit),
            "brier_score":  out.brier_score,
            "r_multiple":   out.r_multiple,
            "resolved_at":  out.resolved_at,
        })

    # Aggregate stats per driver
    driver_stats = {}
    for driver in set(list(brier_by_driver) + list(hit_by_driver)):
        bs = brier_by_driver.get(driver, [])
        hs = hit_by_driver.get(driver, [])
        driver_stats[driver] = {
            "calls":      len(bs),
            "hit_rate":   round(sum(hs) / len(hs) * 100) if hs else 0,
            "brier_mean": round(sum(bs) / len(bs), 4) if bs else None,
        }

    total = len(rows)
    hits  = sum(1 for r in rows if r["branch_hit"])
    bs_all = [r["brier_score"] for r in rows]

    return {
        "total_calls":    total,
        "hit_rate":       round(hits / total * 100) if total else 0,
        "brier_mean":     round(sum(bs_all) / len(bs_all), 4) if bs_all else None,
        "by_driver":      driver_stats,
        "calls":          rows,
        "note": (
            "Start date: first call logged. Misses published. "
            "Brier score: lower = better calibrated. Hit rate: branch within predicted band."
        ),
    }


def pending_scenarios(db: Session) -> list[dict]:
    """Scenarios not yet resolved — need a realised move to score."""
    resolved_ids = {
        r.scenario_id
        for r in db.query(ScenarioOutcome.scenario_id).all()
    }
    pending = (
        db.query(Scenario)
        .filter(~Scenario.id.in_(resolved_ids) if resolved_ids else True)
        .order_by(Scenario.created_at.desc())
        .all()
    )
    return [
        {
            "id":           s.id,
            "catalyst_id":  s.catalyst_id,
            "label":        s.label,
            "driver":       s.driver,
            "probability":  s.probability,
            "predicted_lo": s.predicted_move_lo,
            "predicted_hi": s.predicted_move_hi,
            "if_then":      s.if_then,
            "created_at":   s.created_at,
        }
        for s in pending
    ]
