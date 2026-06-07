"""Decision engine — P2 / S4-S7. Composes a full Decision from live market data."""

from __future__ import annotations
import datetime
from api.models import AgentState, Catalyst, Decision, MarketSnapshot, Stance
from api.agent.util import clamp, round_to
from api.agent.stats import recent_swing_low
from api.agent.signals import build_signals
from api.agent.conviction import derive_stance, compute_conviction, add_size_from_conviction
from api.agent.scenario import build_scenarios
from api.agent.sizing import build_ladder, build_book
from api.agent.playbook import build_playbook, build_rails


def _thesis_line(stance: Stance) -> str:
    if stance == "Bullish":
        return "Trend holds above the 200-day and official demand is structural. Nishu treats macro-driven dips as accumulation windows, not tops."
    if stance == "Bearish":
        return "Trend and momentum have rolled over. Nishu defends capital, keeps only a core long, and waits for the regime to reset."
    return "Range-bound and signal-light. Nishu stays patient — size stays small until a catalyst resolves the range."


def _pick_next_catalyst(catalysts: list[Catalyst], now: datetime.date) -> Catalyst | None:
    today = now.isoformat()
    future = [c for c in catalysts if c.date >= today]
    return min(future, key=lambda c: c.date) if future else None


def build_decision(
    m: MarketSnapshot,
    state: AgentState,
    catalysts: list[Catalyst],
    now: datetime.datetime | None = None,
) -> Decision:
    now = now or datetime.datetime.utcnow()
    stance = derive_stance(m)
    signals, confidence_pct = build_signals(m)
    conviction = compute_conviction(m, state, confidence_pct, stance)
    add_size = add_size_from_conviction(conviction)

    pullback = clamp((m.dailyVolPct / 100) * 2.2, 0.012, 0.05)
    dip_level = round_to(m.price * (1 - pullback), 5)
    swing = recent_swing_low(m.history, 30)
    invalidation = round_to(
        min(swing * 0.99, m.price * (1 - clamp(pullback * 2.5, 0.04, 0.12))),
        5,
    )

    if stance == "Bullish":
        raw_target = max(m.price, m.high52) * (1 + clamp(0.05 + m.momentumPct / 200, 0.04, 0.14))
        target = round_to(raw_target, 10)
    elif stance == "Bearish":
        target = round_to(m.price * 0.96, 10)
    else:
        target = round_to(m.price * 1.03, 10)

    upside_pct = round((target / m.price - 1) * 100, 1)
    trim_zone = round_to(min(target * 0.96, max(m.price * 1.05, m.high52 * 1.01)), 5)
    buy_zone = (round_to(dip_level * 0.98, 5), round_to(dip_level * 1.01, 5))
    reward_risk = round((target - dip_level) / max(1, dip_level - invalidation), 1)

    next_cat = _pick_next_catalyst(catalysts, now.date())
    scenarios = build_scenarios(m, next_cat, dip_level)
    ladder = build_ladder(dip_level, add_size)
    book = build_book(stance)
    playbook = build_playbook(stance, dip_level, add_size, target, invalidation, trim_zone, next_cat)
    rails = build_rails(invalidation, trim_zone, target, upside_pct, reward_risk)

    return Decision(
        asOf=m.asOf,
        asset=m.asset,
        stance=stance,
        conviction=conviction,
        thesisLine=_thesis_line(stance),
        target=target,
        upsidePct=upside_pct,
        invalidation=invalidation,
        dipLevel=dip_level,
        buyZone=buy_zone,
        rewardRisk=reward_risk,
        trimZone=trim_zone,
        signals=signals,
        confidencePct=confidence_pct,
        scenarios=scenarios,
        ladder=ladder,
        book=book,
        playbook=playbook,
        rails=rails,
        nextCatalyst=next_cat,
        avgEntry=round_to(m.ma50 or m.price, 5),
    )
