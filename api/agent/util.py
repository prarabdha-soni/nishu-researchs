"""Pure utility functions — no side effects, no imports from other modules."""

import math
from typing import Sequence


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def round_to(v: float, step: float) -> float:
    return round(v / step) * step


def mean(xs: Sequence[float]) -> float:
    return sum(xs) / len(xs) if xs else 0.0


def stdev(xs: Sequence[float]) -> float:
    if len(xs) < 2:
        return 0.0
    m = mean(xs)
    return math.sqrt(mean([(x - m) ** 2 for x in xs]))


def sma(xs: Sequence[float], n: int) -> float:
    return mean(xs[max(0, len(xs) - n):])


def pct_returns(prices: Sequence[float]) -> list[float]:
    r: list[float] = []
    for i in range(1, len(prices)):
        r.append((prices[i] - prices[i - 1]) / prices[i - 1])
    return r


def pct(n: float, dp: int = 1) -> str:
    sign = "+" if n >= 0 else ""
    return f"{sign}{n:.{dp}f}%"


def m_fmt(date_iso: str) -> str:
    """'2026-06-10' → 'Jun 10'"""
    import datetime
    d = datetime.date.fromisoformat(date_iso)
    try:
        return d.strftime("%b %-d")
    except ValueError:
        return d.strftime("%b %d").lstrip("0")


def d_day(date_iso: str) -> str:
    """'2026-06-10' → '·3d' (days from today) or '·today'"""
    import datetime
    delta = (datetime.date.fromisoformat(date_iso) - datetime.date.today()).days
    if delta == 0:
        return "· today"
    if delta > 0:
        return f"· {delta}d"
    return f"· {abs(delta)}d ago"
