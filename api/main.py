"""FastAPI app — three layers: snapshot (P1-P3 agent), data spine, explain, ledger."""

from __future__ import annotations
import os
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Agent runtime (existing P1-P3)
from api.runtime import get_snapshot, get_live_price, resolve_catalyst, auto_resolve_due
from api.store import json_store
from api.models import CatalystRef

# Phase 1 — data spine
from api.db import init_db, get_db, DataPoint as DbDP
from api.services.data_service import (
    snapshot_context, latest, series_since, get_by_ids, upcoming_catalysts,
)
from api.ingest.prices import ingest_prices
from api.ingest.fred import ingest_fred
from api.ingest.bls import ingest_bls_calendar

# Phase 2 — explanation engine
from api.services.explain_service import run_explanation, latest_explanation

# Phase 3 — calibration ledger
from api.services.calibration import get_ledger, resolve_scenario, pending_scenarios

app = FastAPI(title="nishu-agent", version="2.0.0")

origins = os.getenv("WEB_ORIGIN", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if origins == "*" else [o.strip() for o in origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


# ── Health ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"name": "nishu-agent", "version": "2.0.0", "try": "/api/snapshot"}

@app.get("/api/health")
def health():
    return {"ok": True, "ts": datetime.now(timezone.utc).isoformat()}


# ── Agent snapshot (existing) ────────────────────────────────────────────────

@app.get("/api/snapshot")
def snapshot(force: bool = Query(default=False)):
    return get_snapshot(force=force).model_dump()

@app.get("/api/price")
def price():
    return get_live_price()

@app.get("/api/state")
def state():
    return json_store.get_state().model_dump()

class ResolveBody(BaseModel):
    id: str; date: str; tag: str; label: str | None = None; realisedMovePct: float

@app.post("/api/resolve")
def resolve(body: ResolveBody):
    cat = CatalystRef(id=body.id, date=body.date, tag=body.tag, label=body.label)
    return resolve_catalyst(cat, body.realisedMovePct)

@app.post("/api/cycle")
def cycle():
    return auto_resolve_due()


# ── Phase 1 — Sourced data spine ─────────────────────────────────────────────

@app.post("/api/ingest/run")
def ingest_run():
    """Pull prices + FRED + BLS calendar into the provenance store."""
    with get_db() as db:
        prices  = ingest_prices(db)
        fred    = ingest_fred(db)
        bls_n   = ingest_bls_calendar(db)
    return {
        "prices_written": prices,
        "fred_updated":   fred,
        "bls_catalysts":  bls_n,
        "asof":           datetime.now(timezone.utc).isoformat(),
    }

@app.get("/api/data")
def data_context():
    """All series' latest values with full provenance — what the UI renders."""
    with get_db() as db:
        return {"data": snapshot_context(db)}

@app.get("/api/data/{series}")
def data_series(series: str, days: int = Query(default=30)):
    """History for a single series with provenance on every row."""
    from datetime import timedelta
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    with get_db() as db:
        rows = series_since(db, series, since)
        if not rows:
            raise HTTPException(404, f"No data for series '{series}'")
        return {
            "series": series,
            "rows": [
                {
                    "id": r.id, "value": r.value, "unit": r.unit,
                    "source": r.source, "source_url": r.source_url,
                    "asof": r.asof,
                }
                for r in rows
            ],
        }

@app.get("/api/data/point/{point_id}")
def data_point(point_id: str):
    """Single data point by ID — the click-through destination."""
    with get_db() as db:
        rows = get_by_ids(db, [point_id])
        if not rows:
            raise HTTPException(404, f"DataPoint {point_id} not found")
        r = rows[0]
        return {
            "id": r.id, "series": r.series, "value": r.value, "unit": r.unit,
            "source": r.source, "source_url": r.source_url,
            "asof": r.asof, "fetched_at": r.fetched_at,
        }

@app.get("/api/catalysts")
def catalysts_list():
    """Upcoming catalysts sourced from official calendars."""
    with get_db() as db:
        cats = upcoming_catalysts(db, limit=8)
        return {
            "catalysts": [
                {
                    "id": c.id, "date": c.date, "label": c.label,
                    "driver": c.driver, "source": c.source, "source_url": c.source_url,
                }
                for c in cats
            ]
        }


# ── Phase 2 — Explanation engine ─────────────────────────────────────────────

@app.post("/api/explain/run")
def explain_run(catalyst_id: str | None = Query(default=None)):
    """Run the daily explanation. Requires DEEPSEEK_API_KEY + sourced data."""
    with get_db() as db:
        try:
            exp = run_explanation(db, catalyst_id=catalyst_id)
            import json
            return {
                "id":         exp.id,
                "asof":       exp.asof,
                "headline":   exp.headline,
                "body":       json.loads(exp.body),
                "model":      exp.model,
                "provenance": "validated — all evidence_ids verified against data store",
            }
        except ValueError as e:
            raise HTTPException(400, str(e))

@app.get("/api/explain/latest")
def explain_latest():
    """Today's (or most recent) explanation with full sourced backing."""
    with get_db() as db:
        exp = latest_explanation(db)
        if not exp:
            raise HTTPException(404, "No explanation yet — run POST /api/explain/run first")
        import json
        return {
            "id":       exp.id,
            "asof":     exp.asof,
            "headline": exp.headline,
            "body":     json.loads(exp.body),
            "model":    exp.model,
        }


# ── Phase 3 — Calibration ledger ─────────────────────────────────────────────

@app.get("/api/ledger")
def ledger():
    """The public scored call history — every miss included."""
    with get_db() as db:
        return get_ledger(db)

@app.get("/api/ledger/pending")
def ledger_pending():
    """Scenarios awaiting resolution — needs a realised move to score."""
    with get_db() as db:
        return {"pending": pending_scenarios(db)}

class ScoreBody(BaseModel):
    scenario_id: str
    actual_move_pct: float

@app.post("/api/ledger/score")
def ledger_score(body: ScoreBody):
    """Score a pending scenario against the realised move."""
    with get_db() as db:
        try:
            outcome = resolve_scenario(db, body.scenario_id, body.actual_move_pct)
            return {
                "scenario_id": body.scenario_id,
                "branch_hit":  bool(outcome.branch_hit),
                "brier_score": outcome.brier_score,
                "r_multiple":  outcome.r_multiple,
            }
        except ValueError as e:
            raise HTTPException(404, str(e))
