"""Conviction calibration — S5."""

from __future__ import annotations
from api.models import MarketSnapshot, AgentState, Stance
from api.agent.util import clamp


def derive_stance(m: MarketSnapshot) -> Stance:
    score = 0
    if m.price >= m.ma200: score += 1
    if m.ma50 >= m.ma200:  score += 1
    if m.momentumPct >= 0: score += 1
    if m.drawdownPct < -8 and m.price >= m.ma200: score += 1  # deep dip above 200DMA = accumulation
    if score >= 3: return "Bullish"
    if score <= 1: return "Bearish"
    return "Neutral"


def compute_conviction(m: MarketSnapshot, state: AgentState, confidence_pct: int, stance: Stance) -> int:
    raw = 40.0 + confidence_pct * 0.45  # 40..85 from evidence
    dist_pct = ((m.price - m.ma200) / m.ma200 * 100) if m.ma200 else 0.0
    vol = max(0.4, m.dailyVolPct)
    raw += clamp(dist_pct / vol, -10, 12)   # trend strength, vol-normalised
    raw += clamp(m.momentumPct * 0.4, -6, 6)
    if stance == "Bearish":
        raw -= 8
    raw *= state.convictionCalib
    return round(clamp(raw, 15, 95))


def add_size_from_conviction(conviction: int) -> int:
    return int(clamp(round(conviction / 4), 5, 35))
