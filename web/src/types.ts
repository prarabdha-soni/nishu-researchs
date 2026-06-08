// Domain types for the Nishu web cockpit.
// These mirror api/models.py exactly — keep them in sync when changing the Python model.

export type Driver = "macro" | "mechanical" | "positioning" | "geopolitical" | "narrative";
export type Stance = "Bullish" | "Neutral" | "Bearish";
export type ActionKind = "buy" | "wait" | "trim" | "cut";

export interface PricePoint { date: string; price: number }

export interface TradeEvent {
  id: string; date: string; spot: number; label: string;
  driver: Driver; move: number; summary: string; acted: string; detail: string;
}

export interface Catalyst { date: string; label: string; tag: Driver; id?: string }

export interface Signal { key: string; state: string; aligned: boolean }

export interface ScenarioBranch {
  k: string; kind: ActionKind; act: string; move: string; note: string; prob?: number;
}

export interface Scenario {
  id: string; label: string; def: number; opts: ScenarioBranch[];
}

export interface LadderRung { px: number; size: number; tag: string }
export interface BookSlice   { k: string; w: number; key: string }

export interface ArmedOrder {
  id: string; primary?: boolean; act: string; kind: ActionKind;
  size: string; when: string; note: string;
}

export interface RiskRail { k: string; v: string; note: string; tone: string }

export interface QuoteLite { value: number; changePct: number }

export interface MarketSnapshot {
  asset: string; symbol: string; price: number; asOf: string;
  history: PricePoint[];
  changePct1d: number; high52: number; low52: number;
  dailyVolPct: number; annVolPct: number;
  ma50: number; ma200: number; momentumPct: number; drawdownPct: number;
  dxy?: QuoteLite; yield10y?: QuoteLite; usd_inr?: number; stale?: boolean;
}

export interface Decision {
  asOf: string; asset: string; stance: Stance; conviction: number;
  thesisLine: string; target: number; upsidePct: number;
  invalidation: number; dipLevel: number; buyZone: [number, number];
  rewardRisk: number; trimZone: number;
  signals: Signal[]; confidencePct: number;
  scenarios: Scenario[]; ladder: LadderRung[]; book: BookSlice[];
  playbook: ArmedOrder[]; rails: RiskRail[];
  nextCatalyst?: Catalyst; avgEntry: number;
}

export interface Outcome {
  catalystId: string; date: string; dominantDriver: Driver;
  predictedMovePct: number; realisedMovePct: number; errorPct: number;
  branchHit?: string; correct: boolean; resultR?: number;
}

export interface LearnEntry { date: string; ver: string; title: string; note: string; delta: string }

export interface TrackRecord {
  hit: number; trades: number; avgR: number;
  best: { label: string; r: string };
  worst: { label: string; r: string };
}

export interface StateVersion { conviction: string; weights: string; calibration: string }

export interface DriverParam { weight: number; halfLifeSessions: number }

export interface AgentStatePublic {
  journal: LearnEntry[]; track: TrackRecord;
  weights: Record<Driver, DriverParam>; version: StateVersion;
}

export interface AgentSnapshot {
  asOf: string; market: MarketSnapshot; decision: Decision;
  state: AgentStatePublic; catalysts: Catalyst[];
  events: TradeEvent[]; source: "live" | "seed";
}

// ── Seed / fallback data ──────────────────────────────────────────────────────
// The cockpit renders these when the API is unreachable.

export const priceSeries: PricePoint[] = [
  { date: "2026-01-05", price: 5180 }, { date: "2026-01-12", price: 5300 },
  { date: "2026-01-19", price: 5448 }, { date: "2026-01-26", price: 5588 },
  { date: "2026-01-29", price: 5118 }, { date: "2026-02-06", price: 4946 },
  { date: "2026-02-13", price: 5044 }, { date: "2026-02-20", price: 5132 },
  { date: "2026-02-27", price: 5270 }, { date: "2026-03-06", price: 5362 },
  { date: "2026-03-13", price: 5452 }, { date: "2026-03-20", price: 5520 },
  { date: "2026-03-27", price: 5558 }, { date: "2026-04-03", price: 5574 },
  { date: "2026-04-10", price: 5498 }, { date: "2026-04-15", price: 5208 },
  { date: "2026-04-24", price: 5276 }, { date: "2026-05-01", price: 5360 },
  { date: "2026-05-08", price: 5404 }, { date: "2026-05-15", price: 5442 },
  { date: "2026-05-22", price: 5418 }, { date: "2026-05-29", price: 5432 },
  { date: "2026-06-04", price: 5426 }, { date: "2026-06-05", price: 5250 },
];

export const events: TradeEvent[] = [
  { id: "warsh",   date: "2026-01-29", spot: 5118, label: "Warsh named Fed Chair",     driver: "narrative",    move: -8.7,  summary: "A hawkish surprise markets read as removing the 'Fed put.'",          acted: "Bought the panic",     detail: "Scaled in at $5,130 and $5,000." },
  { id: "margin",  date: "2026-02-06", spot: 4946, label: "Margin-call cascade",        driver: "mechanical",   move: -3.6,  summary: "CME margin hike into the selloff forced liquidations — year's low.", acted: "Added at the low",     detail: "$4,946 — the best entry of the year." },
  { id: "hormuz",  date: "2026-02-27", spot: 5270, label: "Strait of Hormuz crisis",    driver: "geopolitical", move:  7.5,  summary: "US–Iran escalation triggers safe-haven + inflation-hedge bid.",     acted: "Held core",            detail: "Didn't chase the spike." },
  { id: "cpi_mar", date: "2026-03-13", spot: 5452, label: "March CPI 3.3% (hot)",       driver: "macro",        move:  4.1,  summary: "Stagflation hedge wins — Fed seen as trapped.",                     acted: "Held",                 detail: "Stagflation hedge intact." },
  { id: "cpi_apr", date: "2026-04-15", spot: 5208, label: "April CPI 3.8% shock",       driver: "macro",        move: -6.2,  summary: "Hike-odds repriced hard — metals crushed.",                         acted: "Bought the flush",     detail: "Re-loaded at $5,210." },
  { id: "nfp_may", date: "2026-06-05", spot: 5250, label: "May NFP 172k vs 85k",         driver: "macro",        move: -3.27, summary: "Jobs print doubled consensus; cut odds flipped.",                   acted: "Buying the dip now",   detail: "Laddering $5,150 / $5,050." },
];

export const catalysts: Catalyst[] = [
  { date: "2026-06-10", label: "May CPI release",     tag: "macro" },
  { date: "2026-06-17", label: "FOMC · Warsh's first",tag: "narrative" },
  { date: "2026-07-02", label: "June jobs · NFP",     tag: "macro" },
  { date: "2026-07-15", label: "June CPI",            tag: "macro" },
  { date: "2026-07-30", label: "FOMC decision",       tag: "narrative" },
];

const TODAY = new Date("2026-06-07T00:00:00");
export const daysUntil = (d: string) =>
  Math.max(0, Math.round((new Date(d + "T00:00:00").getTime() - TODAY.getTime()) / 86400000));

export const DRIVER: Record<Driver, { label: string; cL: string; icon: string }> = {
  macro:        { label: "Macro",        cL: "#3E80AA", icon: "Activity" },
  mechanical:   { label: "Mechanical",   cL: "#6E5DB8", icon: "Layers" },
  positioning:  { label: "Positioning",  cL: "#B07F24", icon: "Gauge" },
  geopolitical: { label: "Geopolitical", cL: "#C2563B", icon: "Globe" },
  narrative:    { label: "Narrative",    cL: "#B14A7E", icon: "Message" },
};

export const STANCE: Record<Stance, { label: string; col: string; txt: string }> = {
  Bullish: { label: "Structurally Bullish",   col: "up",   txt: "upText" },
  Neutral: { label: "Neutral · Range-bound",  col: "gold", txt: "goldText" },
  Bearish: { label: "Defensive · Bearish",    col: "down", txt: "down" },
};

export const mFmt = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const dDay = (d: string) => {
  const diff = Math.round((new Date(d + "T00:00:00").getTime() - TODAY.getTime()) / 86400000);
  if (diff === 0) return "· today";
  if (diff > 0)  return `· ${diff}d`;
  return `· ${Math.abs(diff)}d ago`;
};

export const TRACK: TrackRecord = {
  hit: 68, trades: 41, avgR: 1.8,
  best:  { label: "Bought the Feb cascade",    r: "+4.6R" },
  worst: { label: "Early on the Apr CPI add",  r: "−1.2R" },
};

export const LEARN: LearnEntry[] = [
  { date: "Jun 2",  ver: "conviction v3.4",      title: "Down-weighted lone narrative signals", note: "Warsh call: predicted −4%, realised −8.7%. Cascade risk premium added.", delta: "narrative −18%" },
  { date: "Mar 15", ver: "signal-weights v3.3",  title: "Raised positioning to primary trigger",  note: "Crowded-short unwinds explained 3 of the last 4 squeezes.",               delta: "positioning +12%" },
  { date: "Mar 3",  ver: "signal-weights v3.2",  title: "Shortened geopolitical half-life",       note: "Hormuz premium decayed in ~6 sessions, not 12.",                          delta: "geo decay 2×" },
];

export const EVIDENCE: Signal[] = [
  { key: "DXY momentum",    state: "stalling",  aligned: true  },
  { key: "Real yields (10Y)", state: "easing",   aligned: true  },
  { key: "Trend vs 200DMA",  state: "above",     aligned: true  },
  { key: "1-mo momentum",    state: "positive",  aligned: true  },
];

export const SCN: Scenario[] = [
  {
    id: "cpi_jun", label: "May CPI release", def: 2,
    opts: [
      { k: "Soft",    kind: "buy",  act: "ADD",     move: "+0.8 to +2.5%", note: "Cut-path revives; crowded shorts squeeze off the lows." },
      { k: "In-line", kind: "wait", act: "WAIT",    move: "-0.6 to +0.6%", note: "Noise. Range-bound; positioning unchanged." },
      { k: "Hot",     kind: "buy",  act: "BUY DIP", move: "-2.2 to -0.8%", note: "Flush toward $5,050 — exactly the dip the ladder wants." },
    ],
  },
];

export const REASONING: string[] = [
  "Scanning CFTC positioning data — net shorts at 6-month high.",
  "DXY momentum stalling below 103; bullish for gold.",
  "Real yields: 10Y at 4.21%, slight pullback. Neutral headwind.",
  "May CPI due Jun 10 — the next market-moving catalyst.",
  "Scenario tree: Hot CPI = flush toward $5,050 (buy the dip).",
  "Conviction 82 — structural bid from EM central banks intact.",
];

export const tweaks = {
  stance:     "Bullish" as Stance,
  conviction: 82,
  target:     6000,
  dip:        5150,
  invalidation: 4900,
  trimZone:   5750,
  addSize:    25,
  book:       { core: 55, powder: 35, hedge: 10 },
};

export const fmt  = (n: number) => Math.round(n).toLocaleString("en-US");
export const fmt2 = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const daysUntilFrom = (d: string, now: Date) =>
  Math.max(0, Math.round((new Date(d + "T00:00:00").getTime() - now.getTime()) / 86400000));

export const thesis = {
  stance: "Structurally Bullish",
  conviction: 82,
  target: 6000,
  line: "Central banks are buying gold faster than mines can produce it. Nishu treats every macro-driven dip as an accumulation window — not a top.",
};

export const computeMarketStats = (history: PricePoint[]) => {
  const prices = history.map(p => p.price).filter(p => p > 0);
  const n = prices.length;
  const price = n ? prices[n - 1] : 0;
  const prev  = n > 1 ? prices[n - 2] : price;
  const rets  = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
  const mean  = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
  const m = mean(rets);
  const dailyVol = Math.sqrt(mean(rets.map(r => (r - m) ** 2))) * 100;
  const sma = (n2: number) => mean(prices.slice(Math.max(0, prices.length - n2)));
  const high = Math.max(...prices);
  const ref  = prices[Math.max(0, n - 22)] ?? price;
  return {
    price, changePct1d: prev ? (price / prev - 1) * 100 : 0,
    high52: high, low52: Math.min(...prices),
    dailyVolPct: dailyVol, annVolPct: dailyVol * Math.sqrt(252),
    ma50: sma(50), ma200: sma(200),
    momentumPct: ref ? (price / ref - 1) * 100 : 0,
    drawdownPct: high ? (price / high - 1) * 100 : 0,
  };
};
