"""Canonical domain model — mirrors the TypeScript types in web/src/types.ts.
All Pydantic models are the single source of truth for data flowing between
the Python engine and the React cockpit."""

from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel


Driver = Literal["macro", "mechanical", "positioning", "geopolitical", "narrative"]
Stance = Literal["Bullish", "Neutral", "Bearish"]
ActionKind = Literal["buy", "wait", "trim", "cut"]


class PricePoint(BaseModel):
    date: str  # YYYY-MM-DD
    price: float


class TradeEvent(BaseModel):
    id: str
    date: str
    spot: float
    label: str
    driver: Driver
    move: float
    summary: str
    acted: str
    detail: str


class Catalyst(BaseModel):
    date: str
    label: str
    tag: Driver
    id: Optional[str] = None


class Signal(BaseModel):
    key: str
    state: str
    aligned: bool


class ScenarioBranch(BaseModel):
    k: str
    kind: ActionKind
    act: str
    move: str
    note: str
    prob: Optional[float] = None


class Scenario(BaseModel):
    id: str
    label: str
    def_: int  # leaned branch index — "def" is a Python keyword, serialized as "def"
    opts: list[ScenarioBranch]

    model_config = {"populate_by_name": True}

    def model_dump(self, **kw):
        d = super().model_dump(**kw)
        d["def"] = d.pop("def_")
        return d


class LadderRung(BaseModel):
    px: float
    size: int
    tag: str


class BookSlice(BaseModel):
    k: str
    w: int
    key: str


class ArmedOrder(BaseModel):
    id: str
    primary: Optional[bool] = None
    act: str
    kind: ActionKind
    size: str
    when: str
    note: str


class RiskRail(BaseModel):
    k: str
    v: str
    note: str
    tone: str


class QuoteLite(BaseModel):
    value: float
    changePct: float


class MarketSnapshot(BaseModel):
    asset: str
    symbol: str
    price: float
    asOf: str
    history: list[PricePoint]
    changePct1d: float
    high52: float
    low52: float
    dailyVolPct: float
    annVolPct: float
    ma50: float
    ma200: float
    momentumPct: float
    drawdownPct: float
    dxy: Optional[QuoteLite] = None
    yield10y: Optional[QuoteLite] = None
    stale: Optional[bool] = None


class Decision(BaseModel):
    asOf: str
    asset: str
    stance: Stance
    conviction: int
    thesisLine: str
    target: float
    upsidePct: float
    invalidation: float
    dipLevel: float
    buyZone: tuple[float, float]
    rewardRisk: float
    trimZone: float
    signals: list[Signal]
    confidencePct: int
    scenarios: list[Scenario]
    ladder: list[LadderRung]
    book: list[BookSlice]
    playbook: list[ArmedOrder]
    rails: list[RiskRail]
    nextCatalyst: Optional[Catalyst] = None
    avgEntry: float


class Outcome(BaseModel):
    catalystId: str
    date: str
    dominantDriver: Driver
    predictedMovePct: float
    realisedMovePct: float
    errorPct: float
    branchHit: Optional[str] = None
    correct: bool
    resultR: Optional[float] = None


class LearnEntry(BaseModel):
    date: str
    ver: str
    title: str
    note: str
    delta: str


class TrackRecord(BaseModel):
    hit: int
    trades: int
    avgR: float
    best: dict
    worst: dict


class StateVersion(BaseModel):
    conviction: str
    weights: str
    calibration: str


class DriverParam(BaseModel):
    weight: float
    halfLifeSessions: int


class AgentState(BaseModel):
    weights: dict[str, DriverParam]
    convictionCalib: float
    version: StateVersion
    journal: list[LearnEntry]
    ledger: list[Outcome]
    track: TrackRecord
    updatedAt: str


class AgentStatePublic(BaseModel):
    journal: list[LearnEntry]
    track: TrackRecord
    weights: dict[str, DriverParam]
    version: StateVersion


class AgentSnapshot(BaseModel):
    asOf: str
    market: MarketSnapshot
    decision: Decision
    state: AgentStatePublic
    catalysts: list[Catalyst]
    events: list[TradeEvent]
    source: Literal["live", "seed"]


class CatalystRef(BaseModel):
    id: str
    date: str
    tag: Driver
    label: Optional[str] = None
