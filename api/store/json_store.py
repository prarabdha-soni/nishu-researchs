"""File-backed agent state store. Seeds a default state on first run."""

from __future__ import annotations
import json
import os
from pathlib import Path
from api.models import AgentState
from api.seed import create_default_state

_cache: AgentState | None = None
_STATE_FILE = Path(os.getenv("STATE_FILE", ".data/agent-state.json"))


def _load() -> AgentState:
    global _cache
    if _cache is not None:
        return _cache
    try:
        raw = _STATE_FILE.read_text(encoding="utf-8")
        _cache = AgentState.model_validate_json(raw)
    except Exception:
        _cache = create_default_state()
        _persist(_cache)
    return _cache


def _persist(state: AgentState) -> None:
    _STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    _STATE_FILE.write_text(state.model_dump_json(indent=2), encoding="utf-8")


def get_state() -> AgentState:
    return _load()


def set_state(state: AgentState) -> None:
    global _cache
    _cache = state
    _persist(state)


def reset_cache() -> None:
    global _cache
    _cache = None
