"""Driver taxonomy + default learnable weights."""

from __future__ import annotations
from api.models import DriverParam

DRIVER: dict[str, dict] = {
    "macro":        {"label": "Macro",        "cL": "#3E80AA", "icon": "Activity"},
    "mechanical":   {"label": "Mechanical",   "cL": "#6E5DB8", "icon": "Layers"},
    "positioning":  {"label": "Positioning",  "cL": "#B07F24", "icon": "Gauge"},
    "geopolitical": {"label": "Geopolitical", "cL": "#C2563B", "icon": "Globe"},
    "narrative":    {"label": "Narrative",    "cL": "#B14A7E", "icon": "Message"},
}

STANCE_META: dict[str, dict] = {
    "Bullish": {"label": "Structurally Bullish",   "col": "up",   "txt": "upText"},
    "Neutral": {"label": "Neutral · Range-bound",  "col": "gold", "txt": "goldText"},
    "Bearish": {"label": "Defensive · Bearish",    "col": "down", "txt": "down"},
}

# Lessons already encoded before the first live cycle (mirrors AGENT.md §4).
DEFAULT_WEIGHTS: dict[str, DriverParam] = {
    "macro":        DriverParam(weight=1.0,  halfLifeSessions=8),
    "mechanical":   DriverParam(weight=1.2,  halfLifeSessions=3),
    "positioning":  DriverParam(weight=0.95, halfLifeSessions=6),
    "geopolitical": DriverParam(weight=0.8,  halfLifeSessions=6),
    "narrative":    DriverParam(weight=0.72, halfLifeSessions=5),
}

ALL_DRIVERS: list[str] = list(DEFAULT_WEIGHTS)
