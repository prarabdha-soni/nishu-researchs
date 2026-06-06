export const priceSeries = [
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

export interface TradeEvent {
  id: string;
  date: string;
  spot: number;
  label: string;
  driver: string;
  move: number;
  summary: string;
  acted: string;
  detail: string;
}

export const events: TradeEvent[] = [
  {
    id: "warsh", date: "2026-01-29", spot: 5118, label: "Warsh named Fed Chair",
    driver: "narrative", move: -8.7,
    summary: "A hawkish surprise markets read as removing the 'Fed put.' Gold cratered intraday from an all-time record high of $5,594.82 to a session low of $5,109.62.",
    acted: "Bought the panic", detail: "Scaled in at $5,130 and $5,000 — fear, not fundamentals.",
  },
  {
    id: "margin", date: "2026-02-06", spot: 4946, label: "Margin-call cascade",
    driver: "mechanical", move: -3.6,
    summary: "CME hiked margins into the selloff; stretched longs were force-liquidated, turning a narrative shock into a mechanical air-pocket — the year's low.",
    acted: "Added at the low", detail: "$4,946 — the best entry of the year.",
  },
  {
    id: "hormuz", date: "2026-02-27", spot: 5270, label: "Strait of Hormuz crisis",
    driver: "geopolitical", move: 7.5,
    summary: "US–Iran escalation disrupts the energy chokepoint. Oil spikes; an inflation-hedge and safe-haven bid pull gold off the floor.",
    acted: "Held core", detail: "Didn't chase the spike — let winners run.",
  },
  {
    id: "cpi_mar", date: "2026-03-13", spot: 5452, label: "March CPI 3.3% (hot)",
    driver: "macro", move: 4.1,
    summary: "Counter-intuitively bullish: a Fed seen as trapped — unable to hike into an energy shock — means the stagflation hedge wins.",
    acted: "Held", detail: "Stagflation hedge intact; no action needed.",
  },
  {
    id: "cpi_apr", date: "2026-04-15", spot: 5208, label: "April CPI 3.8% shock",
    driver: "macro", move: -6.2,
    summary: "Headline 3.8%, PPI explodes to 9.8%. Hike-odds repriced hard — metals crushed across the board.",
    acted: "Bought the flush", detail: "Re-loaded at $5,210 into the panic.",
  },
  {
    id: "nfp_may", date: "2026-06-05", spot: 5250, label: "May NFP 172k vs 85k",
    driver: "macro", move: -3.27,
    summary: "Jobs print doubled consensus; cut odds flipped to a year-end hike bet and gold made a fresh range low. The surprise moved it — not the level.",
    acted: "Buying the dip now", detail: "Laddering $5,150 / $5,050 — see the plan.",
  },
];

export const monthTicks = ["2026-01-05", "2026-02-06", "2026-03-06", "2026-04-03", "2026-05-01", "2026-06-04"];

export const TODAY = new Date("2026-06-07T00:00:00");
export const daysUntil = (d: string) =>
  Math.max(0, Math.round((new Date(d + "T00:00:00").getTime() - TODAY.getTime()) / 86400000));

export const catalysts = [
  { date: "2026-06-10", label: "May CPI release", tag: "macro" },
  { date: "2026-06-17", label: "FOMC · Warsh's first", tag: "narrative" },
  { date: "2026-07-02", label: "June jobs · NFP", tag: "macro" },
  { date: "2026-07-15", label: "June CPI", tag: "macro" },
  { date: "2026-07-30", label: "FOMC decision", tag: "narrative" },
];

export const thesis = {
  stance: "Structurally Bullish",
  conviction: 82,
  target: 6000,
  line: "Central banks are buying gold faster than mines can produce it. Nishu treats every macro-driven dip as an accumulation window — not a top.",
};

export const DRIVER: Record<string, { label: string; cL: string; icon: string }> = {
  macro:        { label: "Macro",        cL: "#3E80AA", icon: "Activity" },
  mechanical:   { label: "Mechanical",   cL: "#6E5DB8", icon: "Layers" },
  positioning:  { label: "Positioning",  cL: "#B07F24", icon: "Gauge" },
  geopolitical: { label: "Geopolitical", cL: "#C2563B", icon: "Globe" },
  narrative:    { label: "Narrative",    cL: "#B14A7E", icon: "Message" },
};

export const STANCE: Record<string, { label: string; col: string; txt: string }> = {
  Bullish: { label: "Structurally Bullish", col: "up",   txt: "upText" },
  Neutral: { label: "Neutral · Range-bound", col: "gold", txt: "goldText" },
  Bearish: { label: "Defensive · Bearish",   col: "down", txt: "down" },
};

export const TRACK = {
  hit: 68, trades: 41, avgR: 1.8,
  best:  { label: "Bought the Feb cascade",    r: "+4.6R" },
  worst: { label: "Early on the Apr CPI add",  r: "−1.2R" },
};

export const LEARN = [
  { date: "Jun 2",  ver: "conviction v3.4",    title: "Down-weighted lone narrative signals",
    note: "The Warsh call overshot — predicted −4%, realised −8.7%. Narrative shocks now carry a mechanical-cascade risk premium.",
    delta: "narrative −18%" },
  { date: "May 19", ver: "signal-weights v3.3", title: "Raised weight on CFTC positioning",
    note: "Crowded-short unwinds explained 3 of the last 4 squeezes; positioning is now a primary trigger, not a confirmer.",
    delta: "positioning +12%" },
  { date: "Apr 30", ver: "calibration v3.2",    title: "Shortened geopolitical half-life",
    note: "The Hormuz premium decayed faster than modelled; geo signals now mean-revert in ~6 sessions, not 12.",
    delta: "geo decay 2×" },
];

export const SCN = [
  { id: "cpi", label: "May CPI · Jun 10", def: 2, opts: [
    { k: "Soft",    kind: "buy",  act: "ADD",     move: "+0.8 to +2.5%", note: "Cut-path revives; crowded shorts squeeze off the lows." },
    { k: "In-line", kind: "wait", act: "WAIT",    move: "−0.5 to +0.5%", note: "Noise. Range-bound into the FOMC; positioning unchanged." },
    { k: "Hot",     kind: "buy",  act: "BUY DIP", move: "−0.8 to −2.0%", note: "Flush toward $5,050 — exactly the dip the ladder wants." },
  ]},
  { id: "fomc", label: "FOMC · Jun 17", def: 1, opts: [
    { k: "Dovish",  kind: "buy",  act: "ADD",  move: "+1.0 to +3.0%", note: "Reopens the cut path — the biggest upside branch from the lows." },
    { k: "Hold",    kind: "wait", act: "HOLD", move: "−0.4 to +0.6%", note: "Already priced. Nothing new to trade." },
    { k: "Hawkish", kind: "trim", act: "TRIM", move: "−1.0 to −2.5%", note: "Confirms the new regime — lighten tactical, keep core." },
  ]},
];

export const EVIDENCE = [
  { k: "CFTC net shorts", s: "crowded", align: true },
  { k: "DXY momentum",    s: "stalling", align: true },
  { k: "Official demand", s: "buying",   align: true },
  { k: "Real yields",     s: "rising",   align: false },
];

export const REASONING = [
  "Scoring 1,284 headlines for macro impact…",
  "Cross-checking DXY momentum against gold beta…",
  "Re-pricing the Jun 10 CPI scenario tree…",
  "Stress-testing the $5,150 dip-add vs invalidation…",
  "Updating conviction from realised outcomes…",
  "Watching CFTC positioning for a short squeeze…",
];

export const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const mFmt = (d: string) => MON[parseInt(d.slice(5, 7), 10) - 1];
export const dDay  = (d: string) => parseInt(d.slice(8), 10);
export const fmt   = (n: number) => n.toLocaleString("en-US");
export const fmt2  = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
