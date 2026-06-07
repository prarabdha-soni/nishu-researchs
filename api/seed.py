"""Seed / fallback data. Three purposes:
1. The cockpit renders this when the API / live data is unavailable.
2. The agent's initial learning journal (pre-loaded lessons).
3. Historical examples for the narrative record."""

from api.models import (
    PricePoint, TradeEvent, Catalyst, LearnEntry, TrackRecord,
    DriverParam, AgentState, StateVersion,
)
from api.agent.drivers import DEFAULT_WEIGHTS
import copy

PRICE_SERIES: list[PricePoint] = [
    PricePoint(date="2026-01-05", price=5180),  PricePoint(date="2026-01-12", price=5300),
    PricePoint(date="2026-01-19", price=5448),  PricePoint(date="2026-01-26", price=5588),
    PricePoint(date="2026-01-29", price=5118),  PricePoint(date="2026-02-06", price=4946),
    PricePoint(date="2026-02-13", price=5044),  PricePoint(date="2026-02-20", price=5132),
    PricePoint(date="2026-02-27", price=5270),  PricePoint(date="2026-03-06", price=5362),
    PricePoint(date="2026-03-13", price=5452),  PricePoint(date="2026-03-20", price=5520),
    PricePoint(date="2026-03-27", price=5558),  PricePoint(date="2026-04-03", price=5574),
    PricePoint(date="2026-04-10", price=5498),  PricePoint(date="2026-04-15", price=5208),
    PricePoint(date="2026-04-24", price=5276),  PricePoint(date="2026-05-01", price=5360),
    PricePoint(date="2026-05-08", price=5404),  PricePoint(date="2026-05-15", price=5442),
    PricePoint(date="2026-05-22", price=5418),  PricePoint(date="2026-05-29", price=5432),
    PricePoint(date="2026-06-04", price=5426),  PricePoint(date="2026-06-05", price=5250),
]

EVENTS: list[TradeEvent] = [
    TradeEvent(
        id="warsh", date="2026-01-29", spot=5118, label="Warsh named Fed Chair",
        driver="narrative", move=-8.7,
        summary="A hawkish surprise markets read as removing the 'Fed put.' Gold cratered intraday from an all-time record high of $5,594.82 to a session low of $5,109.62.",
        acted="Bought the panic", detail="Scaled in at $5,130 and $5,000 — fear, not fundamentals.",
    ),
    TradeEvent(
        id="margin", date="2026-02-06", spot=4946, label="Margin-call cascade",
        driver="mechanical", move=-3.6,
        summary="CME hiked margins into the selloff; stretched longs were force-liquidated, turning a narrative shock into a mechanical air-pocket — the year's low.",
        acted="Added at the low", detail="$4,946 — the best entry of the year.",
    ),
    TradeEvent(
        id="hormuz", date="2026-02-27", spot=5270, label="Strait of Hormuz crisis",
        driver="geopolitical", move=7.5,
        summary="US–Iran escalation disrupts the energy chokepoint. Oil spikes; an inflation-hedge and safe-haven bid pull gold off the floor.",
        acted="Held core", detail="Didn't chase the spike — let winners run.",
    ),
    TradeEvent(
        id="cpi_mar", date="2026-03-13", spot=5452, label="March CPI 3.3% (hot)",
        driver="macro", move=4.1,
        summary="Counter-intuitively bullish: a Fed seen as trapped — unable to hike into an energy shock — means the stagflation hedge wins.",
        acted="Held", detail="Stagflation hedge intact; no action needed.",
    ),
    TradeEvent(
        id="cpi_apr", date="2026-04-15", spot=5208, label="April CPI 3.8% shock",
        driver="macro", move=-6.2,
        summary="Headline 3.8%, PPI explodes to 9.8%. Hike-odds repriced hard — metals crushed across the board.",
        acted="Bought the flush", detail="Re-loaded at $5,210 into the panic.",
    ),
    TradeEvent(
        id="nfp_may", date="2026-06-05", spot=5250, label="May NFP 172k vs 85k",
        driver="macro", move=-3.27,
        summary="Jobs print doubled consensus; cut odds flipped to a year-end hike bet and gold made a fresh range low. The surprise moved it — not the level.",
        acted="Buying the dip now", detail="Laddering $5,150 / $5,050 — see the plan.",
    ),
]

TRACK = TrackRecord(
    hit=68, trades=41, avgR=1.8,
    best={"label": "Bought the Feb cascade", "r": "+4.6R"},
    worst={"label": "Early on the Apr CPI add", "r": "−1.2R"},
)

LEARN: list[LearnEntry] = [
    LearnEntry(
        date="Jun 2", ver="conviction v3.4",
        title="Down-weighted lone narrative signals",
        note="Warsh call: predicted −4%, realised −8.7%. A narrative shock detonated a mechanical cascade — lone narrative signals now carry a cascade-risk premium.",
        delta="narrative −18%",
    ),
    LearnEntry(
        date="Mar 15", ver="signal-weights v3.3",
        title="Raised positioning to primary trigger",
        note="Crowded-short unwinds explained 3 of the last 4 squeezes. Positioning promoted from confirmer to primary trigger.",
        delta="positioning +12%",
    ),
    LearnEntry(
        date="Mar 3", ver="signal-weights v3.2",
        title="Shortened geopolitical half-life",
        note="Hormuz premium decayed in ~6 sessions, not the modelled 12. Geo half-life cut to 6.",
        delta="geo decay 2×",
    ),
]


def create_default_state() -> AgentState:
    return AgentState(
        weights=copy.deepcopy(DEFAULT_WEIGHTS),
        convictionCalib=0.9,
        version=StateVersion(conviction="v1.0", weights="v1.0", calibration="v1.0"),
        journal=copy.deepcopy(LEARN),
        ledger=[],
        track=copy.deepcopy(TRACK),
        updatedAt="1970-01-01T00:00:00Z",
    )
