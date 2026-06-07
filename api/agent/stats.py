"""Market-statistics engine — pure functions, no I/O."""

from __future__ import annotations
from dataclasses import dataclass
from api.models import PricePoint
from api.agent.util import stdev, sma, pct_returns


@dataclass
class MarketStats:
    price: float
    changePct1d: float
    high52: float
    low52: float
    dailyVolPct: float
    annVolPct: float
    ma50: float
    ma200: float
    momentumPct: float
    drawdownPct: float


def compute_market_stats(history: list[PricePoint]) -> MarketStats:
    prices = [p.price for p in history if p.price and p.price > 0]
    n = len(prices)
    price = prices[-1] if n else 0.0
    prev = prices[-2] if n > 1 else price

    rets = pct_returns(prices)
    daily_vol = stdev(rets) * 100
    ann_vol = daily_vol * (252 ** 0.5)

    high = max(prices) if prices else 0.0
    low = min(prices) if prices else 0.0

    ref = prices[max(0, n - 22)] if n else price
    momentum = ((price / ref - 1) * 100) if ref else 0.0

    return MarketStats(
        price=price,
        changePct1d=((price / prev - 1) * 100) if prev else 0.0,
        high52=high,
        low52=low,
        dailyVolPct=daily_vol,
        annVolPct=ann_vol,
        ma50=sma(prices, 50),
        ma200=sma(prices, 200),
        momentumPct=momentum,
        drawdownPct=((price / high - 1) * 100) if high else 0.0,
    )


def recent_swing_low(history: list[PricePoint], n: int = 30) -> float:
    prices = [p.price for p in history]
    window = prices[max(0, len(prices) - n):]
    return min(window) if window else (prices[-1] if prices else 0.0)
