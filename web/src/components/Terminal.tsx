import React, { useState, useEffect } from "react";
import { T as BASE_T } from "../theme";
import {
  priceSeries, events, catalysts, thesis,
  DRIVER, STANCE, mFmt, dDay, fmt, fmt2, daysUntil, daysUntilFrom,
} from "../data";
import { useAgent } from "../api/useAgent";
import { ICON_MAP, Target, Calendar, News, Loop, Plus, Scissors, Clock } from "./Icons";
import GoldChart from "./GoldChart";
import ReasoningStream from "./ReasoningStream";
import EvidenceChain from "./EvidenceChain";
import Scorecard from "./Scorecard";
import LearningLog from "./LearningLog";
import ScenarioLab from "./ScenarioLab";
import BriefModal from "./BriefModal";
import { TweaksPanel, TweakSection, TweakSlider, TweakRadio, TweakColor, useTweaks } from "./TweaksPanel";

const TWEAK_DEFAULTS = {
  accent: "#C2613F",
  stance: "Bullish",
  conviction: 82,
  target: 6000,
  dipLevel: 5150,
  addSize: 25,
};

const ACT_META: Record<string, { Icon: React.FC<{ size?: number }>; key: string }> = {
  buy:  { Icon: Plus,     key: "up" },
  wait: { Icon: Clock,    key: "sub" },
  trim: { Icon: Scissors, key: "down" },
  cut:  { Icon: Scissors, key: "down" },
};

interface Props { onReplayIntro?: () => void; }

export default function Terminal({ onReplayIntro }: Props) {
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const { snapshot, livePrice } = useAgent();
  const live = snapshot?.decision ?? null;

  const [selId, setSelId] = useState<string | null>(null);
  const [ago, setAgo] = useState(0);
  const [briefOpen, setBriefOpen] = useState(false);

  const T = { ...BASE_T, accent: tw.accent || BASE_T.accent };
  const dc = (k: string) => DRIVER[k as keyof typeof DRIVER]?.cL ?? "#888";
  const now = new Date();

  // Reset the "synced ago" counter whenever a fresh live price lands.
  useEffect(() => { setAgo(0); }, [livePrice?.asOf]);
  useEffect(() => {
    const id = setInterval(() => setAgo((a) => a + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Live data with seed fallbacks — the cockpit always renders.
  const source = livePrice?.source ?? snapshot?.source ?? "seed";
  const series = snapshot?.market.history ?? priceSeries;
  const evs = snapshot?.events ?? events;
  const cats = snapshot?.catalysts ?? catalysts;

  const last = series[series.length - 1]?.price ?? 0;
  const prev = series[series.length - 2]?.price ?? last;
  const displayPx = livePrice?.price ?? snapshot?.market.price ?? last;
  const dayChgNum = livePrice?.changePct1d ?? snapshot?.market.changePct1d ?? (prev ? ((last - prev) / prev) * 100 : 0);
  const dayChg = dayChgNum.toFixed(2);

  // Month ticks derived from whatever series is in play (live or seed).
  const ticks = (() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of series) { const k = p.date.slice(0, 7); if (!seen.has(k)) { seen.add(k); out.push(p.date); } }
    return out;
  })();

  const stanceKey = live ? live.stance : tw.stance;
  const st = STANCE[stanceKey as keyof typeof STANCE] || STANCE.Bullish;
  const stCol = T[st.col as keyof typeof T] as string;
  const stTxt = T[st.txt as keyof typeof T] as string;
  const conviction = live ? live.conviction : tw.conviction;
  const target = live ? live.target : tw.target;
  const dipLevel = live ? live.dipLevel : tw.dipLevel;
  const addSize = live ? (live.ladder[0]?.size ?? tw.addSize) : tw.addSize;
  const invalid = live ? live.invalidation : 4900;
  const trimZone = live ? live.trimZone : 5750;
  const buyZone: [number, number] = live ? live.buyZone : [dipLevel - 100, dipLevel + 50];
  const thesisLineText = live ? live.thesisLine : thesis.line;
  const upsideNum = live ? live.upsidePct : (last ? ((target - last) / last) * 100 : 0);
  const upside = upsideNum.toFixed(1);
  const rr = (live ? live.rewardRisk : (target - dipLevel) / Math.max(1, dipLevel - invalid)).toFixed(1);
  const floor = snapshot?.market.low52 ?? 4946;
  const avgEntry = live ? live.avgEntry : 5180;
  const dUntil = (d: string) => (snapshot ? daysUntilFrom(d, now) : daysUntil(d));

  const ladder = live
    ? live.ladder
    : [
        { px: dipLevel,       size: tw.addSize,                   tag: "Primary dip-add · armed" },
        { px: dipLevel - 100, size: Math.max(5, tw.addSize - 5),  tag: "Second rung" },
        { px: dipLevel - 200, size: Math.max(5, tw.addSize - 10), tag: "Capitulation rung" },
      ];
  const book = (live ? live.book : [
    { k: "Core long", w: 55, key: "up" },
    { k: "Tactical dry powder", w: 35, key: "gold" },
    { k: "Tail hedge", w: 10, key: "faint" },
  ]).map((b) => ({ k: b.k, w: b.w, c: T[b.key as keyof typeof T] as string }));

  const playbook = live ? live.playbook : [
    { id: "t1", primary: true, act: "ADD",  kind: "buy",  size: `+${tw.addSize}%`,
      when: `Dip into $${fmt(dipLevel)} after the Jun 10 CPI`,
      note: "Primary dip-add. Crowded shorts into a structural bid = an asymmetric squeeze; stagger fills across the ladder rungs." },
    { id: "t2", act: "ADD",  kind: "buy",  size: "+15%",
      when: "FOMC (Jun 17) flags growth risk",
      note: "Dovish reopen of the cut path — the biggest upside branch from the lows." },
    { id: "t3", act: "WAIT", kind: "wait", size: "hold",
      when: "May CPI prints hot, above 3.6%",
      note: `No chase. Let it flush toward $${fmt(dipLevel - 100)}, then ladder in.` },
    { id: "t4", act: "TRIM", kind: "trim", size: "−10%",
      when: "Rip above $5,750 with no new official buyers",
      note: `Bank gains into thin demand; core stays on for the $${fmt(target)} target.` },
    { id: "t5", act: "CUT",  kind: "cut",  size: "→ 30%",
      when: `Daily close below $${fmt(invalid)}`,
      note: "Thesis invalidation. De-risk to a core hold and reassess the regime." },
  ];
  const rails = (live ? live.rails : [
    { k: "Invalidation",  v: `< $${fmt(invalid)}`, note: "cut to 30% core", tone: "down" },
    { k: "Trim zone",     v: `$${fmt(trimZone)}`,  note: "take 10% off",    tone: "sub" },
    { k: "12-mo target",  v: `$${fmt(target)}`,    note: `+${upside}% upside`, tone: "up" },
    { k: "Reward : risk", v: `${rr} : 1`,          note: "on the dip-add",  tone: "up" },
  ]).map((r) => ({ k: r.k, v: r.v, note: r.note, tone: T[r.tone as keyof typeof T] as string }));

  const sel = evs.find((e) => e.id === selId) ?? evs[0] ?? null;
  const dr = sel ? DRIVER[sel.driver] : null;
  const drC = sel ? dc(sel.driver) : "#888";
  const DrIcon = dr ? ICON_MAP[dr.icon] : null;
  const nextCat = cats[0];

  const actChip = (kind: string, act: string, size?: string | null) => {
    const meta = ACT_META[kind] || ACT_META.wait;
    const col = T[meta.key as keyof typeof T] as string;
    const AIcon = meta.Icon;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12.5,
        color: col, background: col + "1f", border: `1px solid ${col}55`, borderRadius: 8, padding: "4px 9px" }}>
        <AIcon size={13} /> {act}
        {size && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontVariantNumeric: "tabular-nums", fontWeight: 600, opacity: 0.85 }}>{size}</span>}
      </span>
    );
  };

  const css = `
  .au-root *{box-sizing:border-box;}
  .au-root{font-family:'Hanken Grotesk',system-ui,sans-serif;color:${T.text};background:${T.bg};
    background-image:radial-gradient(900px 520px at 80% -10%, ${T.glowB}, transparent 60%),
                     radial-gradient(720px 480px at -6% 8%, ${T.glowA}, transparent 55%);
    min-height:100vh;padding:26px clamp(16px,4vw,40px) 36px;}
  .au-mono{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums;}
  .au-disp{font-family:'Newsreader',Georgia,serif;font-weight:500;letter-spacing:.1px;}
  .au-card{background:${T.panel};border:1px solid ${T.line};border-radius:16px;box-shadow:${T.cardShadow};}
  .au-maxw{max-width:1240px;margin:0 auto;}
  .au-lower{display:grid;grid-template-columns:5fr 7fr;gap:16px;margin-top:16px;}
  .au-lower2{display:grid;grid-template-columns:7fr 5fr;gap:16px;margin-top:16px;}
  .au-hero{display:grid;grid-template-columns:1.45fr 1fr;gap:18px;}
  @media(max-width:900px){.au-lower,.au-lower2,.au-hero{grid-template-columns:1fr;}}
  .au-pill{font-size:12.5px;padding:7px 13px;border-radius:999px;border:1px solid ${T.line2};
    color:${T.sub};cursor:default;display:flex;align-items:center;gap:7px;transition:.2s;background:transparent;}
  .au-pill.on{color:#fff;background:${T.accent};border-color:${T.accent};font-weight:600;}
  .au-chip{cursor:pointer;border:1px solid ${T.line};background:${T.panel2};border-radius:12px;
    padding:10px 12px;transition:.18s;min-width:0;}
  .au-chip:hover{border-color:${T.line2};transform:translateY(-2px);}
  .au-chip.on{box-shadow:0 0 0 1.5px currentColor inset;}
  .au-row{border:1px solid ${T.line};border-radius:13px;padding:13px 14px;background:transparent;transition:.16s;}
  .au-row:hover{border-color:${T.line2};background:${T.panel2};}
  .au-tgl{display:flex;align-items:center;gap:6px;border:1px solid ${T.line2};background:transparent;color:${T.sub};
    border-radius:999px;padding:7px 12px;cursor:pointer;font-size:12px;transition:.18s;font-family:inherit;}
  .au-tgl:hover{color:${T.text};border-color:${T.text};}
  .au-cta{background:${T.accent};border-color:${T.accent};color:#fff;font-weight:600;}
  .au-cta:hover{color:#fff;filter:brightness(1.05);}
  .au-fade{opacity:0;transform:translateY(10px);animation:auUp .6s cubic-bezier(.2,.7,.2,1) forwards;}
  .d1{animation-delay:.04s}.d2{animation-delay:.1s}.d3{animation-delay:.18s}.d4{animation-delay:.26s}.d5{animation-delay:.34s}.d6{animation-delay:.42s}
  @keyframes auUp{to{opacity:1;transform:none;}}
  @keyframes auSpin{to{transform:rotate(360deg);}}
  .au-spin{transform-origin:50% 50%;}
  @media(prefers-reduced-motion:no-preference){.au-spin{animation:auSpin 7s linear infinite;}}
  .au-bar{height:7px;border-radius:6px;background:rgba(60,45,20,0.08);overflow:hidden;}
  .au-rail{display:flex;gap:9px;overflow-x:auto;padding:4px 1px 6px;}
  .au-rail::-webkit-scrollbar{height:7px;}
  .au-rail::-webkit-scrollbar-thumb{background:${T.line2};border-radius:8px;}
  .au-kicker{font-size:10.5px;letter-spacing:1.4px;text-transform:uppercase;color:${T.faint};font-weight:600;}
  .au-reason{animation:auReason .5s ease;}
  @keyframes auReason{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:none;}}
  .au-live{animation:auLive 2.4s ease-in-out infinite;}
  @keyframes auLive{0%,100%{opacity:1;box-shadow:0 0 0 0 ${T.up}66;}50%{opacity:.65;box-shadow:0 0 0 4px ${T.up}00;}}
  @media(max-width:560px){
    .au-root{padding:18px 14px 28px;}
    .au-hero{gap:14px;}
    .au-lower,.au-lower2{gap:14px;}
  }
  `;

  return (
    <div className="au-root">
      <style>{css}</style>
      <div className="au-maxw">

        {/* Header */}
        <div className="au-fade d1" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(140deg, ${T.goldLite}, ${T.gold} 55%, #7c561a)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#231703", fontWeight: 600, fontFamily: "'Newsreader',serif", fontSize: 17, boxShadow: "0 4px 12px rgba(150,105,25,0.3)" }}>
              nr
            </div>
            <div>
              <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, letterSpacing: ".1px", fontSize: 23, lineHeight: 1, display: "flex", alignItems: "center", gap: 8 }}>
                Nishu Research
                <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: 1, color: T.accent, border: `1px solid ${T.accent}`, borderRadius: 5, padding: "2px 6px", whiteSpace: "nowrap" }}>AI</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                <Loop size={12} style={{ color: T.up }} className="au-spin" />
                <span className="au-kicker" style={{ color: T.upText, whiteSpace: "nowrap", letterSpacing: "1.1px" }}>Self-learning trading agent</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div className="au-pill on"><span className="au-mono">Au</span> Gold</div>
            <div className="au-pill"><span className="au-mono">Ag</span> Silver <span style={{ fontSize: 9.5, color: T.faint }}>soon</span></div>
            <div className="au-pill"><span className="au-mono">Cu</span> Copper <span style={{ fontSize: 9.5, color: T.faint }}>soon</span></div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: source === "live" ? T.up : T.faint }} className={source === "live" ? "au-live" : undefined} />
                <span className="au-mono" style={{ fontSize: 30, fontWeight: 600, color: T.goldText, lineHeight: 1 }}>
                  ${fmt2(displayPx)}
                </span>
              </div>
              <div className="au-mono" style={{ fontSize: 12.5, marginTop: 5 }}>
                <span style={{ color: Number(dayChg) >= 0 ? T.up : T.down }}>{Number(dayChg) >= 0 ? "+" : ""}{dayChg}% 1d</span>
                <span style={{ color: T.faint }}>{"  ·  "}</span>
                <span style={{ color: T.faint }}>{source === "live" ? `live · ${ago}s ago` : "sample data"}</span>
              </div>
            </div>
            <button className="au-tgl au-cta" onClick={() => setBriefOpen(true)}>
              <News size={15} /> Brief
            </button>
          </div>
        </div>

        {/* Live reasoning */}
        <ReasoningStream T={T} />

        {/* Hero */}
        <div className="au-card au-fade d2 au-hero" style={{ padding: 22 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div className="au-kicker">Nishu stance</div>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 8 }}>
              <span style={{ width: 11, height: 11, borderRadius: 99, background: stCol, boxShadow: `0 0 0 4px ${stCol}26` }} />
              <span style={{ fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, letterSpacing: ".1px", fontSize: 29, lineHeight: 1.05, color: stTxt }}>{st.label}</span>
            </div>
            <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.6, marginTop: 13, maxWidth: 520 }}>{thesisLineText}</p>

            <div style={{ marginTop: 18, maxWidth: 440 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
                <span className="au-kicker">Conviction</span>
                <span className="au-mono" style={{ fontSize: 13, color: stTxt, fontWeight: 600 }}>{(conviction / 10).toFixed(1)} / 10</span>
              </div>
              <div className="au-bar" style={{ height: 9 }}>
                <div style={{ width: conviction + "%", height: "100%", background: `linear-gradient(90deg, ${T.gold}, ${stCol})`, borderRadius: 6 }} />
              </div>
            </div>

            {/* Next move */}
            <div style={{ marginTop: "auto", paddingTop: 18 }}>
              <div style={{ border: `1px solid ${T.up}66`, background: T.upBg, borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 11 }}>
                  <span className="au-kicker" style={{ color: T.upText }}>Next move</span>
                  {actChip("buy", "WAITING TO BUY", null)}
                </div>
                {nextCat && (
                  <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                    <div style={{ textAlign: "center", border: `1px solid ${T.gold}`, borderRadius: 12, padding: "6px 0 7px", minWidth: 66, background: T.panel, boxShadow: `0 0 0 4px ${T.glowB}` }}>
                      <div className="au-mono" style={{ fontSize: 9.5, letterSpacing: 1.5, color: T.goldText, fontWeight: 600 }}>{mFmt(nextCat.date).toUpperCase()}</div>
                      <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, fontSize: 27, lineHeight: 1, color: T.goldText }}>{dDay(nextCat.date)}</div>
                      <div className="au-mono" style={{ fontSize: 9, color: T.accent, fontWeight: 600, marginTop: 2 }}>in {dUntil(nextCat.date)} days</div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{nextCat.label}</div>
                      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: T.sub, marginTop: 3 }}>
                        Add <b className="au-mono" style={{ color: T.upText }}>+{addSize}%</b> on <b>any dip below ${fmt(dipLevel)}</b>.
                      </div>
                    </div>
                  </div>
                )}
                <EvidenceChain T={T} signals={live?.signals} confidencePct={live?.confidencePct} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* 12-mo target */}
            <div style={{ border: `1px solid ${T.line2}`, borderRadius: 14, padding: "16px 17px", background: T.panel2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Target size={15} style={{ color: T.gold }} />
                <span className="au-kicker">12-month target</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
                <span className="au-mono" style={{ fontSize: 34, fontWeight: 600, color: T.goldText, lineHeight: 1 }}>${fmt(target)}</span>
                <span className="au-mono" style={{ fontSize: 14, color: Number(upside) >= 0 ? T.up : T.down, fontWeight: 600 }}>{Number(upside) >= 0 ? "+" : ""}{upside}%</span>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="au-bar">
                  <div style={{ width: Math.max(2, Math.min(100, (last - floor) / Math.max(1, target - floor) * 100)) + "%", height: "100%", background: T.gold, borderRadius: 6 }} />
                </div>
                <div className="au-mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: T.faint, marginTop: 5 }}>
                  <span>now ${fmt(Math.round(last))}</span><span>${fmt(target)}</span>
                </div>
              </div>
            </div>

            {/* Upcoming catalysts */}
            <div style={{ border: `1px solid ${T.line2}`, borderRadius: 14, padding: "15px 17px 6px", background: T.panel2, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <Calendar size={14} style={{ color: T.accent }} />
                <span className="au-kicker">Upcoming catalysts</span>
              </div>
              {cats.map((c, i) => {
                const col = dc(c.tag);
                const dys = dUntil(c.date);
                const next = i === 0;
                return (
                  <div key={c.id ?? c.date} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderTop: i ? `1px solid ${T.line}` : "none" }}>
                    <div style={{ textAlign: "center", minWidth: 38 }}>
                      <div className="au-mono" style={{ fontSize: 9, letterSpacing: 1, color: T.faint, fontWeight: 600 }}>{mFmt(c.date).toUpperCase()}</div>
                      <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, fontSize: 18, lineHeight: 1, color: next ? T.goldText : T.text }}>{dDay(c.date)}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 99, background: col, flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.label}</span>
                    </div>
                    {next
                      ? <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, color: "#fff", background: T.accent, borderRadius: 6, padding: "2px 8px" }}>NEXT</span>
                      : <span className="au-mono" style={{ fontSize: 11, color: T.faint }}>{dys}d</span>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="au-card au-fade d3" style={{ padding: "18px 18px 10px", marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 10, marginBottom: 6 }}>
            <div>
              <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, letterSpacing: ".1px", fontSize: 18 }}>
                {snapshot ? "How Nishu is trading gold" : "How Nishu traded 2026"}
              </div>
              <div style={{ fontSize: 11.5, color: T.faint, marginTop: 2 }}>
                {snapshot
                  ? `Live ${snapshot.market.symbol} via Yahoo Finance · markers are catalysts the agent has learned from.`
                  : "Every macro shock was an entry. Tap a marker to see the trade."}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              <span style={{ fontSize: 11, color: T.sub, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 14, height: 8, borderRadius: 3, background: T.up, opacity: 0.5, display: "inline-block" }} /> Buy zone
              </span>
              <span style={{ fontSize: 11, color: T.sub, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 2, background: T.gold, display: "inline-block" }} /> Price
              </span>
            </div>
          </div>

          <GoldChart
            data={series} events={evs} selId={sel?.id ?? ""} onSelect={setSelId}
            T={T} driverColor={dc} monthTicks={ticks} zone={buyZone}
          />

          {evs.length > 0 && (
            <div className="au-rail" style={{ marginTop: 4 }}>
              {evs.map((ev) => {
                const on = ev.id === sel?.id;
                const c = dc(ev.driver);
                const EvIcon = ICON_MAP[DRIVER[ev.driver].icon];
                return (
                  <div key={ev.id} className={"au-chip" + (on ? " on" : "")} style={{ color: c }} onClick={() => setSelId(ev.id)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <EvIcon size={13} />
                      <span className="au-mono" style={{ fontSize: 10.5, color: T.faint }}>{mFmt(ev.date)} {dDay(ev.date)}</span>
                    </div>
                    <div style={{ color: T.text, fontSize: 12, fontWeight: 600, marginTop: 4, whiteSpace: "nowrap" }}>{ev.label}</div>
                    <div className="au-mono" style={{ fontSize: 11.5, marginTop: 3, color: ev.move >= 0 ? T.up : T.down }}>
                      {ev.move >= 0 ? "+" : ""}{ev.move}%
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected trade read */}
          {sel && dr && DrIcon && (
            <div key={sel.id} className="au-fade" style={{ marginTop: 6, borderTop: `1px solid ${T.line}`, paddingTop: 13, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div style={{ minWidth: 200, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 99, background: drC + "22", color: drC, display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
                    <DrIcon size={11} /> {dr.label}
                  </span>
                  <span style={{ fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, letterSpacing: ".1px", fontSize: 16 }}>{sel.label}</span>
                  <span className="au-mono" style={{ fontSize: 14, fontWeight: 600, color: sel.move >= 0 ? T.up : T.down }}>{sel.move >= 0 ? "+" : ""}{sel.move}%</span>
                </div>
                <p style={{ fontSize: 12.5, color: T.sub, lineHeight: 1.55, marginTop: 7, maxWidth: 560 }}>{sel.summary}</p>
              </div>
              <div style={{ minWidth: 200, flex: 1, border: `1px solid ${T.up}44`, background: T.upBg, borderRadius: 11, padding: "11px 13px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-flex", width: 22, height: 22, borderRadius: 7, alignItems: "center", justifyContent: "center", background: T.up + "26", color: T.up }}><Plus size={13} /></span>
                  <span className="au-kicker" style={{ color: T.upText }}>What Nishu did</span>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: T.upText, marginTop: 7 }}>{sel.acted}</div>
                <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.5, marginTop: 4 }}>{sel.detail}</div>
              </div>
            </div>
          )}
        </div>

        {/* Playbook header */}
        <div className="au-fade d4" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, marginBottom: 2 }}>
          <Target size={16} style={{ color: T.accent }} />
          <span style={{ fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, letterSpacing: ".1px", fontSize: 18 }}>The playbook</span>
          <span style={{ fontSize: 11, color: T.faint }}>· how Nishu is positioned, and what it does next</span>
        </div>

        <div className="au-lower">
          {/* Positioning */}
          <div className="au-card au-fade d4" style={{ padding: 20 }}>
            <div className="au-kicker" style={{ marginBottom: 10 }}>Positioning</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, letterSpacing: ".1px", fontSize: 20, color: T.upText }}>Net long</span>
              <span className="au-mono" style={{ fontSize: 12.5, color: T.sub }}>avg entry ${fmt(avgEntry)}</span>
            </div>
            <div style={{ display: "flex", height: 11, borderRadius: 6, overflow: "hidden", marginTop: 12, gap: 2 }}>
              {book.map((b) => <div key={b.k} style={{ width: b.w + "%", background: b.c }} />)}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px 16px", marginTop: 10 }}>
              {book.map((b) => (
                <span key={b.k} style={{ fontSize: 11.5, color: T.sub, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: b.c }} />{b.k} <b className="au-mono" style={{ color: T.text }}>{b.w}%</b>
                </span>
              ))}
            </div>

            <div className="au-kicker" style={{ marginTop: 20, marginBottom: 10 }}>Scale-in ladder · dry powder staged</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ladder.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, border: `1px solid ${i === 0 ? T.up + "66" : T.line}`, background: i === 0 ? T.upBg : "transparent", borderRadius: 11, padding: "11px 13px" }}>
                  <span className="au-mono" style={{ fontSize: 15, fontWeight: 600, color: T.goldText, minWidth: 60 }}>${fmt(r.px)}</span>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: T.sub }}>{r.tag}</div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: 12.5, color: T.up, background: T.up + "1f", border: `1px solid ${T.up}55`, borderRadius: 8, padding: "4px 9px" }}>
                    <Plus size={13} /> +{r.size}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Armed orders */}
          <div className="au-card au-fade d4" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{ fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, letterSpacing: ".1px", fontSize: 18 }}>Armed orders</span>
            </div>
            <div style={{ fontSize: 11.5, color: T.faint, marginBottom: 13 }}>If this happens, Nishu does this — automatically.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {playbook.map((p) => (
                <div key={p.id} className="au-row" style={p.primary ? { borderColor: T.up + "66", background: T.upBg } : {}}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span className="au-mono" style={{ fontSize: 10.5, color: T.faint, fontWeight: 600 }}>IF</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{p.when}</span>
                    </div>
                    {actChip(p.kind, p.act, p.size)}
                  </div>
                  <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.5, marginTop: 8 }}>{p.note}</div>
                  {p.primary && (
                    <div className="au-kicker" style={{ color: T.upText, marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 99, background: T.up, boxShadow: `0 0 0 3px ${T.upBg}` }} /> Primary · armed now
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk rails */}
        <div className="au-card au-fade d5" style={{ padding: "17px 20px", marginTop: 16 }}>
          <div className="au-kicker" style={{ marginBottom: 13 }}>Risk rails</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 18 }}>
            {rails.map((r) => (
              <div key={r.k} style={{ borderLeft: `2px solid ${r.tone}`, paddingLeft: 13 }}>
                <div className="au-mono" style={{ fontSize: 10, color: T.faint, letterSpacing: 0.6, textTransform: "uppercase" }}>{r.k}</div>
                <div className="au-mono" style={{ fontSize: 21, fontWeight: 600, color: r.tone, marginTop: 4, lineHeight: 1 }}>{r.v}</div>
                <div style={{ fontSize: 11.5, color: T.sub, marginTop: 3 }}>{r.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Track record */}
        <Scorecard T={T} track={snapshot?.state.track} />

        {/* Learning + Scenario lab */}
        <div className="au-lower2" style={{ alignItems: "start" }}>
          <LearningLog T={T} entries={snapshot?.state.journal} />
          <ScenarioLab T={T} scenarios={live?.scenarios} />
        </div>

        {/* Footer */}
        <div style={{ fontSize: 11, color: T.faint, marginTop: 18, lineHeight: 1.55 }}>
          {snapshot ? (
            <>
              Live gold via Yahoo Finance (<span className="au-mono">{snapshot.market.symbol}</span>). Stance, levels and orders are model-derived from real price action and update as catalysts resolve. Nishu advises on scenarios; it does not guarantee outcomes. Not financial advice.
            </>
          ) : (
            <>
              Confirmed anchor: Jan-29 intraday ATH <span className="au-mono">$5,594.82</span> → session low <span className="au-mono">$5,109.62</span>.
              Sample data — start the agent server to go live. Nishu advises on scenarios; it does not guarantee outcomes. Not financial advice.
            </>
          )}
          {onReplayIntro && (
            <button onClick={onReplayIntro} style={{ marginLeft: 6, background: "none", border: "none", color: T.accent, cursor: "pointer", fontFamily: "inherit", fontSize: 11, textDecoration: "underline", padding: 0 }}>Replay intro</button>
          )}
        </div>
      </div>

      {/* Tweaks panel */}
      <TweaksPanel>
        <TweakSection label="Appearance" />
        <TweakColor label="Accent" value={tw.accent}
          options={["#C2613F", "#2A6FDB", "#1F8A5B", "#7A5AE0", "#B07F24"]}
          onChange={(v) => setTweak("accent", v)} />

        <TweakSection label="Agent view (offline / fallback)" />
        <TweakRadio label="Stance" value={tw.stance} options={["Bullish", "Neutral", "Bearish"]}
          onChange={(v) => setTweak("stance", v)} />
        <TweakSlider label="Conviction" value={tw.conviction} min={0} max={100} step={1} unit="%"
          onChange={(v) => setTweak("conviction", v)} />
        <TweakSlider label="12-mo target" value={tw.target} min={5000} max={7000} step={50} unit=" $/oz"
          onChange={(v) => setTweak("target", v)} />

        <TweakSection label="Next move (offline / fallback)" />
        <TweakSlider label="Buy on dip below" value={tw.dipLevel} min={4800} max={5400} step={25} unit=" $"
          onChange={(v) => setTweak("dipLevel", v)} />
        <TweakSlider label="Add size" value={tw.addSize} min={5} max={50} step={5} unit="%"
          onChange={(v) => setTweak("addSize", v)} />
      </TweaksPanel>

      {briefOpen && (
        <BriefModal T={T} onClose={() => setBriefOpen(false)} brief={{
          date: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          stance: st.label,
          conviction,
          last: fmt2(displayPx),
          target: fmt(target),
          nextMove: `Add +${addSize}% on a dip < $${fmt(dipLevel)}${nextCat ? ` (${mFmt(nextCat.date)} ${dDay(nextCat.date)})` : ""}`,
          buyZone: `$${fmt(buyZone[0])} – $${fmt(buyZone[1])}`,
          invalid: `< $${fmt(invalid)}`,
          rr: `${rr} : 1`,
          line: thesisLineText,
        }} />
      )}
    </div>
  );
}
