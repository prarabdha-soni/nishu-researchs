"""Provenance-locked data access layer.

The one hard rule: the explanation engine receives DataPointRef objects
(id + metadata), never raw values it could repeat without attribution.
write_point() is the only way into the store — it rejects rows missing
source_url or asof."""

from __future__ import annotations
import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from api.db import DataPoint, DbCatalyst


# ── Write (ingest side) ──────────────────────────────────────────────────────

def write_point(
    db: Session,
    series: str,
    value: float,
    unit: str,
    source: str,
    source_url: str,
    asof: str,
    meta: dict | None = None,
) -> DataPoint:
    """Upsert a data point. Raises if source_url is missing (provenance rule)."""
    if not source_url:
        raise ValueError(f"source_url is required for series '{series}' — provenance rule")
    existing = (
        db.query(DataPoint)
        .filter(DataPoint.series == series, DataPoint.asof == asof)
        .first()
    )
    if existing:
        existing.value = value
        existing.source = source
        existing.source_url = source_url
        existing.meta = json.dumps(meta) if meta else None
        return existing

    dp = DataPoint(
        series=series, value=value, unit=unit,
        source=source, source_url=source_url,
        asof=asof,
        meta=json.dumps(meta) if meta else None,
    )
    db.add(dp)
    db.flush()
    return dp


def write_catalyst(
    db: Session,
    id: str,
    date: str,
    label: str,
    driver: str,
    source: str,
    source_url: str,
) -> DbCatalyst:
    existing = db.query(DbCatalyst).filter(DbCatalyst.id == id).first()
    if existing:
        return existing
    cat = DbCatalyst(
        id=id, date=date, label=label, driver=driver,
        source=source, source_url=source_url,
    )
    db.add(cat)
    db.flush()
    return cat


# ── Read (query side) ────────────────────────────────────────────────────────

def latest(db: Session, series: str) -> DataPoint | None:
    return (
        db.query(DataPoint)
        .filter(DataPoint.series == series)
        .order_by(DataPoint.asof.desc())
        .first()
    )


def series_since(db: Session, series: str, since_iso: str) -> list[DataPoint]:
    return (
        db.query(DataPoint)
        .filter(DataPoint.series == series, DataPoint.asof >= since_iso)
        .order_by(DataPoint.asof.asc())
        .all()
    )


def get_by_ids(db: Session, ids: list[str]) -> list[DataPoint]:
    return db.query(DataPoint).filter(DataPoint.id.in_(ids)).all()


def validate_ids(db: Session, ids: list[str]) -> tuple[bool, list[str]]:
    """Check every referenced ID exists. Returns (ok, missing_ids)."""
    found = {dp.id for dp in get_by_ids(db, ids)}
    missing = [i for i in ids if i not in found]
    return len(missing) == 0, missing


def snapshot_context(db: Session) -> list[dict]:
    """
    Return all series' latest values as a structured context block
    to pass to the explanation engine. Each row includes its ID so
    the model can reference it — but the model must cite the ID, not
    repeat the value independently.
    """
    rows = (
        db.query(DataPoint)
        .distinct(DataPoint.series)
        .order_by(DataPoint.series, DataPoint.asof.desc())
        .all()
    )
    # Deduplicate: keep latest per series
    seen: dict[str, DataPoint] = {}
    for r in rows:
        if r.series not in seen:
            seen[r.series] = r
    return [
        {
            "id": dp.id,
            "series": dp.series,
            "value": dp.value,
            "unit": dp.unit,
            "source": dp.source,
            "source_url": dp.source_url,
            "asof": dp.asof,
        }
        for dp in seen.values()
    ]


def upcoming_catalysts(db: Session, limit: int = 6) -> list[DbCatalyst]:
    today = datetime.now(timezone.utc).date().isoformat()
    return (
        db.query(DbCatalyst)
        .filter(DbCatalyst.date >= today, DbCatalyst.resolved_at.is_(None))
        .order_by(DbCatalyst.date.asc())
        .limit(limit)
        .all()
    )
