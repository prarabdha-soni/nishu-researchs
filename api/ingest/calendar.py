"""Economic-calendar generator. Produces upcoming catalysts live from the real clock."""

from __future__ import annotations
import datetime
from api.models import Catalyst

# Fed FOMC decision days (publicly scheduled).
FOMC_DECISION_DAYS = [
    "2025-01-29", "2025-03-19", "2025-05-07", "2025-06-18", "2025-07-30",
    "2025-09-17", "2025-10-29", "2025-12-10",
    "2026-01-28", "2026-03-18", "2026-04-29", "2026-06-17", "2026-07-29",
    "2026-09-16", "2026-10-28", "2026-12-16",
]


def _nth_weekday(year: int, month: int, weekday: int, n: int) -> datetime.date:
    """nth occurrence (1-based) of `weekday` (Mon=0…Sun=6) in given month."""
    first = datetime.date(year, month, 1)
    shift = (weekday - first.weekday() + 7) % 7
    return first + datetime.timedelta(days=shift + (n - 1) * 7)


def _nfp_date(year: int, month: int) -> datetime.date:
    return _nth_weekday(year, month, 4, 1)   # first Friday


def _cpi_date(year: int, month: int) -> datetime.date:
    return _nth_weekday(year, month, 2, 2)   # ~second Wednesday


def _macro_for_month(year: int, month: int) -> list[Catalyst]:
    mon = datetime.date(year, month, 1).strftime("%B")
    cpi = _cpi_date(year, month)
    nfp = _nfp_date(year, month)
    return [
        Catalyst(id=f"macro-{cpi}", date=str(cpi), label=f"{mon} CPI release", tag="macro"),
        Catalyst(id=f"macro-{nfp}", date=str(nfp), label=f"{mon} jobs · NFP",  tag="macro"),
    ]


def generate_calendar(now: datetime.datetime, count: int = 6) -> list[Catalyst]:
    today = str(now.date())
    out: list[Catalyst] = []
    y, m = now.year, now.month
    for i in range(7):
        nm = m + i
        ny = y + (nm - 1) // 12
        nm = (nm - 1) % 12 + 1
        for c in _macro_for_month(ny, nm):
            if c.date >= today:
                out.append(c)
    for f in FOMC_DECISION_DAYS:
        if f >= today:
            out.append(Catalyst(id=f"narrative-{f}", date=f, label="FOMC decision", tag="narrative"))
    return sorted(out, key=lambda c: c.date)[:count]


def recent_catalysts(now: datetime.datetime, days_back: int = 28) -> list[Catalyst]:
    today = str(now.date())
    start = str((now - datetime.timedelta(days=days_back)).date())
    out: list[Catalyst] = []
    y, m = now.year, now.month
    for i in range(-2, 1):
        nm = m + i
        ny = y + (nm - 1) // 12
        nm = (nm - 1) % 12 + 1
        for c in _macro_for_month(ny, nm):
            if start <= c.date < today:
                out.append(c)
    for f in FOMC_DECISION_DAYS:
        if start <= f < today:
            out.append(Catalyst(id=f"narrative-{f}", date=f, label="FOMC decision", tag="narrative"))
    return sorted(out, key=lambda c: c.date)
