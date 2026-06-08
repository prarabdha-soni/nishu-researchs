"""FRED API adapter — real yields, breakeven inflation, fed funds rate.

Every observation is stored with its FRED series URL so the user can
click through to the St. Louis Fed's chart. API key from:
https://fred.stlouisfed.org/docs/api/api_key.html (free)"""

from __future__ import annotations
import os
import requests
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from api.services.data_service import write_point

FRED_API_KEY = os.getenv("FRED_API_KEY", "")
FRED_BASE    = "https://api.stlouisfed.org/fred/series/observations"

# Series we pull. Add more here — each must have a public FRED URL.
SERIES: dict[str, dict] = {
    "real_yield_10y": {
        "fred_id":   "DFII10",
        "unit":      "%",
        "source":    "FRED · St. Louis Fed",
        "url":       "https://fred.stlouisfed.org/series/DFII10",
        "label":     "10-Year Real Yield (TIPS)",
    },
    "breakeven_10y": {
        "fred_id":   "T10YIE",
        "unit":      "%",
        "source":    "FRED · St. Louis Fed",
        "url":       "https://fred.stlouisfed.org/series/T10YIE",
        "label":     "10-Year Breakeven Inflation Rate",
    },
    "fed_funds_rate": {
        "fred_id":   "FEDFUNDS",
        "unit":      "%",
        "source":    "FRED · St. Louis Fed",
        "url":       "https://fred.stlouisfed.org/series/FEDFUNDS",
        "label":     "Effective Federal Funds Rate",
    },
    "us_cpi_yoy": {
        "fred_id":   "CPIAUCSL",
        "unit":      "index",
        "source":    "FRED · St. Louis Fed / BLS",
        "url":       "https://fred.stlouisfed.org/series/CPIAUCSL",
        "label":     "CPI All Urban Consumers (SA)",
    },
}


def _fetch_series(fred_id: str, days: int = 90) -> list[dict]:
    if not FRED_API_KEY:
        raise ValueError("FRED_API_KEY not set — get a free key at fred.stlouisfed.org")
    start = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    r = requests.get(FRED_BASE, params={
        "series_id":       fred_id,
        "api_key":         FRED_API_KEY,
        "file_type":       "json",
        "observation_start": start,
        "sort_order":      "desc",
        "limit":           30,
    }, timeout=10)
    r.raise_for_status()
    return [o for o in r.json().get("observations", []) if o["value"] != "."]


def ingest_fred(db: Session) -> list[str]:
    """Fetch all configured FRED series and store with provenance. Returns series names updated."""
    if not FRED_API_KEY:
        return []

    updated: list[str] = []
    for series_name, meta in SERIES.items():
        try:
            obs = _fetch_series(meta["fred_id"], days=30)
            if not obs:
                continue
            latest = obs[0]
            asof = latest["date"] + "T00:00:00Z"
            write_point(
                db,
                series=series_name,
                value=float(latest["value"]),
                unit=meta["unit"],
                source=meta["source"],
                source_url=meta["url"],
                asof=asof,
                meta={"fred_id": meta["fred_id"], "label": meta["label"]},
            )
            updated.append(series_name)
        except Exception as e:
            # Non-fatal: log and continue to next series
            print(f"[fred] {series_name}: {e}")
    return updated
