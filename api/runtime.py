"""Agent runtime — orchestrates Perceive → Decide → Learn.

get_snapshot()       Perceive + Decide, cached.
auto_resolve_due()   Autonomous learning tick (cron + /api/cycle).
resolve_catalyst()   Manual Observe → Learn for a known move.
"""

from __future__ import annotations
import datetime
from api.models import (
    AgentSnapshot, AgentStatePublic, Catalyst, CatalystRef,
    MarketSnapshot, PricePoint, TradeEvent,
)
from api.agent.decide import build_decision
from api.agent.learn import run_learning
from api.agent.stats import compute_market_stats
from api.agent.drivers import DRIVER
from api.agent.util import m_fmt, d_day
from api.ingest.yahoo import fetch_market, GOLD_SYMBOL
from api.ingest.calendar import generate_calendar, recent_catalysts
from api.store import json_store
from api.seed import PRICE_SERIES, EVENTS, create_default_state
import os

SNAPSHOT_TTL_S = int(os.getenv("SNAPSHOT_TTL_S", "60"))

_cache: dict | None = None
_cache_at: float = 0.0


def _seed_market() -> MarketSnapshot:
    history = PRICE_SERIES
    s = compute_market_stats(history)
    return MarketSnapshot(
        asset="Gold", symbol=GOLD_SYMBOL,
        price=s.price, asOf=datetime.datetime.utcnow().isoformat() + "Z",
        history=history,
        changePct1d=s.changePct1d, high52=s.high52, low52=s.low52,
        dailyVolPct=s.dailyVolPct, annVolPct=s.annVolPct,
        ma50=s.ma50, ma200=s.ma200,
        momentumPct=s.momentumPct, drawdownPct=s.drawdownPct,
        stale=True,
    )


def _load_market() -> tuple[MarketSnapshot, str]:
    try:
        return fetch_market(), "live"
    except Exception:
        return _seed_market(), "seed"


def _market_as_of(full: MarketSnapshot, date_iso: str) -> MarketSnapshot:
    history = [p for p in full.history if p.date <= date_iso]
    h = history if history else full.history
    s = compute_market_stats(h)
    return full.model_copy(update={
        "history": h, "price": s.price, "asOf": f"{date_iso}T00:00:00Z",
        "changePct1d": s.changePct1d, "high52": s.high52, "low52": s.low52,
        "dailyVolPct": s.dailyVolPct, "annVolPct": s.annVolPct,
        "ma50": s.ma50, "ma200": s.ma200,
        "momentumPct": s.momentumPct, "drawdownPct": s.drawdownPct,
    })


def _realised_move_around(history: list[PricePoint], date_iso: str) -> float | None:
    dates = [p.date for p in history]
    try:
        idx = next(i for i, d in enumerate(dates) if d >= date_iso)
    except StopIteration:
        return None
    if idx <= 0 or idx >= len(history):
        return None
    before = history[idx - 1].price
    after  = history[min(len(history) - 1, idx + 1)].price
    if not before:
        return None
    return round((after / before - 1) * 100, 2)


def _prev_day(date_iso: str) -> str:
    d = datetime.date.fromisoformat(date_iso) - datetime.timedelta(days=1)
    return str(d)


def _outcome_to_event(outcome, history: list[PricePoint]) -> TradeEvent:
    pt = next((p for p in history if p.date >= outcome.date), history[-1] if history else None)
    spot = pt.price if pt else 0.0

    def s(n: float) -> str:
        return f"+{n}" if n >= 0 else str(n)

    return TradeEvent(
        id=outcome.catalystId,
        date=outcome.date,
        spot=spot,
        label=f"{DRIVER[outcome.dominantDriver]['label']} · {m_fmt(outcome.date)} {d_day(outcome.date)}",
        driver=outcome.dominantDriver,
        move=outcome.realisedMovePct,
        summary=f"Predicted {s(outcome.predictedMovePct)}%, realised {s(outcome.realisedMovePct)}%. The agent re-weighted {DRIVER[outcome.dominantDriver]['label'].lower()} from this outcome.",
        acted="Lean was right" if outcome.correct else "Lean missed",
        detail=f"{outcome.branchHit or '—'} branch{f' · {outcome.resultR:+.1f}R' if outcome.resultR is not None else ''}",
    )


def get_snapshot(force: bool = False) -> AgentSnapshot:
    global _cache, _cache_at
    import time
    now_ts = time.time()
    if not force and _cache and (now_ts - _cache_at) < SNAPSHOT_TTL_S:
        return AgentSnapshot.model_validate(_cache)

    state = json_store.get_state()
    market, source = _load_market()
    now = datetime.datetime.utcnow()
    catalysts = generate_calendar(now, 6)
    decision = build_decision(market, state, catalysts, now)
    events = EVENTS if source == "seed" else [_outcome_to_event(o, market.history) for o in state.ledger]

    snap = AgentSnapshot(
        asOf=now.isoformat() + "Z",
        market=market,
        decision=decision,
        state=AgentStatePublic(
            journal=state.journal,
            track=state.track,
            weights=state.weights,
            version=state.version,
        ),
        catalysts=catalysts,
        events=events,
        source=source,
    )
    _cache = snap.model_dump()
    _cache_at = now_ts
    return snap


def get_live_price() -> dict:
    snap = get_snapshot()
    return {
        "price": snap.market.price,
        "changePct1d": snap.market.changePct1d,
        "asOf": snap.market.asOf,
        "source": snap.source,
    }


def resolve_catalyst(cat: CatalystRef, realised_pct: float) -> dict:
    global _cache
    state = json_store.get_state()
    if any(o.catalystId == cat.id for o in state.ledger):
        return {"skipped": True, "reason": "already resolved", "version": state.version.model_dump()}

    market, _ = _load_market()
    past_market = _market_as_of(market, _prev_day(cat.date))
    cat_obj = Catalyst(id=cat.id, date=cat.date, label=cat.label, tag=cat.tag)
    decision = build_decision(past_market, state, [cat_obj],
                              datetime.datetime.fromisoformat(cat.date))
    next_state, outcome, entry = run_learning(state, decision, cat, realised_pct)
    json_store.set_state(next_state)
    _cache = None
    return {"skipped": False, "outcome": outcome.model_dump(), "entry": entry.model_dump(),
            "version": next_state.version.model_dump()}


def auto_resolve_due(now: datetime.datetime | None = None) -> dict:
    global _cache
    now = now or datetime.datetime.utcnow()
    market, _ = _load_market()
    state = json_store.get_state()
    due = [c for c in recent_catalysts(now, 28)
           if not any(o.catalystId == c.id for o in state.ledger)]

    resolved = []
    for c in due:
        if not any(p.date > c.date for p in market.history):
            continue
        move = _realised_move_around(market.history, c.date)
        if move is None:
            continue
        cat_id = c.id or f"{c.tag}-{c.date}"
        ref = CatalystRef(id=cat_id, date=c.date, tag=c.tag, label=c.label)
        past = _market_as_of(market, _prev_day(c.date))
        decision = build_decision(past, state, [c], datetime.datetime.fromisoformat(c.date))
        state, _, entry = run_learning(state, decision, ref, move)
        resolved.append({"id": cat_id, "move": move, "delta": entry.delta})

    if resolved:
        json_store.set_state(state)
        _cache = None

    return {"count": len(resolved), "resolved": resolved,
            "version": state.version.model_dump()}
