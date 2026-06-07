"""Armed-orders playbook — S7."""

from __future__ import annotations
from api.models import ArmedOrder, Catalyst, RiskRail, Stance


def _usd(n: float) -> str:
    return f"${round(n):,}"


def build_playbook(
    stance: Stance,
    dip_level: float,
    add_size: int,
    target: float,
    invalidation: float,
    trim_zone: float,
    next_catalyst: Catalyst | None = None,
) -> list[ArmedOrder]:
    after = f" after the {next_catalyst.label}" if next_catalyst else ""
    return [
        ArmedOrder(
            id="t1", primary=True, act="ADD", kind="buy", size=f"+{add_size}%",
            when=f"Dip into {_usd(dip_level)}{after}",
            note="Primary dip-add. Crowded shorts into a structural bid = an asymmetric squeeze; stagger fills across the ladder rungs.",
        ),
        ArmedOrder(
            id="t2", act="ADD", kind="buy", size=f"+{max(5, add_size - 10)}%",
            when="A dovish policy surprise flags growth risk",
            note="Dovish reopen of the cut path — the biggest upside branch from the lows.",
        ),
        ArmedOrder(
            id="t3", act="WAIT", kind="wait", size="hold",
            when="A macro print runs hot, above consensus",
            note=f"No chase. Let it flush toward {_usd(dip_level * 0.98)}, then ladder in.",
        ),
        ArmedOrder(
            id="t4", act="TRIM", kind="trim", size="−10%",
            when=f"Rip above {_usd(trim_zone)} with no new official buyers",
            note=f"Bank gains into thin demand; core stays on for the {_usd(target)} target.",
        ),
        ArmedOrder(
            id="t5", act="CUT", kind="cut", size="→ 30%",
            when=f"Daily close below {_usd(invalidation)}",
            note="Thesis invalidation. De-risk to a core hold and reassess the regime.",
        ),
    ]


def build_rails(
    invalidation: float,
    trim_zone: float,
    target: float,
    upside_pct: float,
    reward_risk: float,
) -> list[RiskRail]:
    sign = "+" if upside_pct >= 0 else ""
    return [
        RiskRail(k="Invalidation", v=f"< {_usd(invalidation)}", note="cut to 30% core",       tone="down"),
        RiskRail(k="Trim zone",    v=_usd(trim_zone),            note="take 10% off",           tone="sub"),
        RiskRail(k="12-mo target", v=_usd(target),               note=f"{sign}{upside_pct:.1f}% upside", tone="up"),
        RiskRail(k="Reward : risk",v=f"{reward_risk} : 1",       note="on the dip-add",         tone="up"),
    ]
