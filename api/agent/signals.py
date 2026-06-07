"""Evidence board — S3. Derives aligned/against signals from live market data."""

from __future__ import annotations
from api.models import MarketSnapshot, Signal


def build_signals(m: MarketSnapshot) -> tuple[list[Signal], int]:
    signals: list[Signal] = []

    if m.dxy:
        falling = m.dxy.changePct <= 0
        signals.append(Signal(
            key="DXY momentum",
            state="stalling" if falling else "firming",
            aligned=falling,  # weaker dollar → gold bullish
        ))

    if m.yield10y:
        rising = m.yield10y.changePct > 0
        signals.append(Signal(
            key="Real yields (10Y)",
            state="rising" if rising else "easing",
            aligned=not rising,  # rising yields are a headwind
        ))

    signals.append(Signal(
        key="Trend vs 200DMA",
        state="above" if m.price >= m.ma200 else "below",
        aligned=m.price >= m.ma200,
    ))

    signals.append(Signal(
        key="1-mo momentum",
        state="positive" if m.momentumPct >= 0 else "negative",
        aligned=m.momentumPct >= 0,
    ))

    aligned = sum(1 for s in signals if s.aligned)
    confidence_pct = round((aligned / len(signals)) * 100) if signals else 0
    return signals, confidence_pct
