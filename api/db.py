"""Database — SQLite for local dev, PostgreSQL for production.
The entire provenance system lives here: data_points, catalysts,
explanations, scenarios, scenario_outcomes.

Rule enforced at this layer: nothing enters data_points without
a source, source_url, and asof. The explanation service receives
only IDs; it cannot invent values."""

from __future__ import annotations
import os
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    create_engine, Column, String, Float, Text, Integer, Index,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from contextlib import contextmanager

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///api/data/nishu.db",
)

_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=_connect_args, echo=False)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def _uuid() -> str:
    return str(uuid.uuid4())

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class DataPoint(Base):
    """One observation with full provenance. The spine."""
    __tablename__ = "data_points"

    id          = Column(String, primary_key=True, default=_uuid)
    series      = Column(String, nullable=False, index=True)   # 'gold_spot', 'real_yield_10y', …
    value       = Column(Float,  nullable=False)
    unit        = Column(String, nullable=False)                # 'USD/oz', '%', 'index'
    source      = Column(String, nullable=False)                # 'yahoo_finance', 'fred', …
    source_url  = Column(Text,   nullable=False)                # direct link — must be populated
    asof        = Column(String, nullable=False, index=True)    # ISO datetime of the observation
    fetched_at  = Column(String, nullable=False, default=_now)
    meta        = Column(Text)                                   # JSON blob for extra fields

    __table_args__ = (
        UniqueConstraint("series", "asof", name="uq_series_asof"),
        Index("ix_series_asof", "series", "asof"),
    )


class DbCatalyst(Base):
    """Scheduled catalyst with official-calendar provenance."""
    __tablename__ = "catalysts"

    id              = Column(String, primary_key=True)
    date            = Column(String, nullable=False, index=True)
    label           = Column(String, nullable=False)
    driver          = Column(String, nullable=False)
    source          = Column(String, nullable=False)   # 'fed_calendar', 'bls_calendar'
    source_url      = Column(Text,   nullable=False)
    consensus_dp_id = Column(String)  # FK → data_points for consensus estimate
    actual_dp_id    = Column(String)  # FK → data_points for actual print
    resolved_at     = Column(String)


class Explanation(Base):
    """One AI-generated causal note, grounded in data_point IDs."""
    __tablename__ = "explanations"

    id          = Column(String, primary_key=True, default=_uuid)
    asof        = Column(String, nullable=False, index=True)
    catalyst_id = Column(String, index=True)
    headline    = Column(Text, nullable=False)
    body        = Column(Text, nullable=False)   # full validated JSON
    model       = Column(String, nullable=False) # 'deepseek-chat'
    created_at  = Column(String, nullable=False, default=_now)


class Scenario(Base):
    """A forward scenario emitted by the explanation engine, with probability."""
    __tablename__ = "scenarios"

    id                 = Column(String, primary_key=True, default=_uuid)
    catalyst_id        = Column(String, nullable=False, index=True)
    explanation_id     = Column(String)
    label              = Column(String, nullable=False)   # 'Soft', 'Hot', 'Dovish'
    probability        = Column(Float,  nullable=False)   # 0..1
    predicted_move_lo  = Column(Float)
    predicted_move_hi  = Column(Float)
    driver             = Column(String, nullable=False)
    if_then            = Column(Text)
    created_at         = Column(String, nullable=False, default=_now)


class ScenarioOutcome(Base):
    """Resolved outcome with Brier score — the calibration ledger."""
    __tablename__ = "scenario_outcomes"

    id          = Column(String, primary_key=True, default=_uuid)
    scenario_id = Column(String, nullable=False, index=True)
    resolved_at = Column(String, nullable=False)
    actual_move = Column(Float, nullable=False)
    branch_hit  = Column(Integer, nullable=False)   # 1 = hit, 0 = miss
    brier_score = Column(Float, nullable=False)      # (p - o)²
    r_multiple  = Column(Float)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


@contextmanager
def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
