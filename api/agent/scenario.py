"""Scenario tree — S4. Vol-scaled branches for the next catalyst."""

from __future__ import annotations
from api.models import Catalyst, MarketSnapshot, Scenario, ScenarioBranch


def _fmt_move(a: float, b: float) -> str:
    def s(n: float) -> str:
        return f"+{n:.1f}" if n >= 0 else f"{n:.1f}"
    return f"{s(a)} to {s(b)}%"


def build_scenarios(m: MarketSnapshot, next_cat: Catalyst | None, dip_level: float) -> list[Scenario]:
    if not next_cat:
        return []
    v = max(0.5, m.dailyVolPct)
    dip = f"${round(dip_level):,}"
    tag = next_cat.tag
    def_: int

    if tag == "narrative":
        opts = [
            ScenarioBranch(k="Dovish", kind="buy",  act="ADD",  move=_fmt_move(v*1.0, v*3.0),
                note="Reopens the cut path — the biggest upside branch from here."),
            ScenarioBranch(k="Hold",   kind="wait", act="HOLD", move=_fmt_move(-v*0.5, v*0.7),
                note="Largely priced. Nothing new to trade; positioning unchanged."),
            ScenarioBranch(k="Hawkish",kind="trim", act="TRIM", move=_fmt_move(-v*2.5, -v*1.0),
                note="Confirms the regime — lighten tactical, keep the core long."),
        ]
        def_ = 1
    elif tag == "geopolitical":
        opts = [
            ScenarioBranch(k="Escalation",   kind="buy",  act="HOLD/ADD", move=_fmt_move(v*1.0, v*3.0),
                note="Safe-haven + inflation-hedge bid; hold core, add only on a controlled dip."),
            ScenarioBranch(k="Stalemate",    kind="wait", act="WAIT",     move=_fmt_move(-v*0.5, v*1.0),
                note="Premium decays on a short half-life; no chase."),
            ScenarioBranch(k="De-escalation",kind="wait", act="WAIT",     move=_fmt_move(-v*2.0, -v*0.8),
                note=f"Risk-premium unwind toward {dip} — let the ladder do the work."),
        ]
        def_ = 0
    else:
        # macro: CPI / NFP / PPI
        opts = [
            ScenarioBranch(k="Soft",    kind="buy",  act="ADD",     move=_fmt_move(v*0.8, v*2.5),
                note="Cut-path revives; crowded shorts squeeze off the lows."),
            ScenarioBranch(k="In-line", kind="wait", act="WAIT",    move=_fmt_move(-v*0.6, v*0.6),
                note="Noise. Range-bound; positioning unchanged into the next print."),
            ScenarioBranch(k="Hot",     kind="buy",  act="BUY DIP", move=_fmt_move(-v*2.2, -v*0.8),
                note=f"Flush toward {dip} — exactly the dip the ladder wants."),
        ]
        def_ = 2

    return [Scenario(id=next_cat.id or next_cat.date, label=next_cat.label, def_=def_, opts=opts)]
