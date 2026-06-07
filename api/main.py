"""FastAPI app — serves the AgentSnapshot shapes the React cockpit renders."""

from __future__ import annotations
import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from api.runtime import get_snapshot, get_live_price, resolve_catalyst, auto_resolve_due
from api.store import json_store
from api.models import CatalystRef

app = FastAPI(title="nishu-agent", version="1.0.0")

origins = os.getenv("WEB_ORIGIN", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if origins == "*" else [o.strip() for o in origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"name": "nishu-agent", "ok": True, "try": "/api/snapshot"}


@app.get("/api/health")
def health():
    from datetime import datetime, timezone
    return {"ok": True, "ts": datetime.now(timezone.utc).isoformat()}


@app.get("/api/snapshot")
def snapshot(force: bool = Query(default=False)):
    snap = get_snapshot(force=force)
    return snap.model_dump()


@app.get("/api/price")
def price():
    return get_live_price()


@app.get("/api/state")
def state():
    return json_store.get_state().model_dump()


class ResolveBody(BaseModel):
    id: str
    date: str
    tag: str
    label: str | None = None
    realisedMovePct: float


@app.post("/api/resolve")
def resolve(body: ResolveBody):
    cat = CatalystRef(id=body.id, date=body.date, tag=body.tag, label=body.label)
    return resolve_catalyst(cat, body.realisedMovePct)


@app.post("/api/cycle")
def cycle():
    return auto_resolve_due()
