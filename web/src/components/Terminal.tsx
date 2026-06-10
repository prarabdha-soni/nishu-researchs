import { useState, useEffect } from "react";
import { T as BASE_T } from "../theme";
import {
  priceSeries, events, catalysts, thesis,
  DRIVER, STANCE, mFmt, dDay, fmt, fmt2, daysUntil, daysUntilFrom,
} from "../data";
import { useAgent } from "../api/useAgent";
import { ICON_MAP, News, Loop, Plus } from "./Icons";
import GoldChart from "./GoldChart";
import BriefModal from "./BriefModal";
import { TweaksPanel, TweakSection, TweakSlider, TweakRadio, TweakColor, useTweaks } from "./TweaksPanel";

const TWEAK_DEFAULTS = {
  accent: "#C2613F",
  stance: "Bullish",
  conviction: 72,
  target: 4800,
  dipLevel: 4100,
  addSize: 25,
};

interface Props { onReplayIntro?: () => void; }

export default function Terminal({ onReplayIntro: _onReplayIntro }: Props) {
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
  const SEED_USD_INR = 85.5; // fallback rate when live data unavailable
  const usdInr = livePrice?.usd_inr ?? snapshot?.market.usd_inr ?? SEED_USD_INR;
  // Indian gold is quoted per 10g; 1 troy oz = 31.1035g → divide by 3.11035
  const displayPxInr = livePrice?.priceInr ?? Math.round(displayPx * usdInr / 3.11035);

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
const invalid = live ? live.invalidation : 3900;
  const buyZone: [number, number] = live ? live.buyZone : [dipLevel - 100, dipLevel + 50];
  const thesisLineText = live ? live.thesisLine : thesis.line;
  const upsideNum = live ? live.upsidePct : (last ? ((target - last) / last) * 100 : 0);
  const upside = upsideNum.toFixed(1);
  const rr = (live ? live.rewardRisk : (target - dipLevel) / Math.max(1, dipLevel - invalid)).toFixed(1);
  const dUntil = (d: string) => (snapshot ? daysUntilFrom(d, now) : daysUntil(d));


  const sel = evs.find((e) => e.id === selId) ?? evs[0] ?? null;
  const nextCat = cats[0];

  const css = `
  .au-root *{box-sizing:border-box;}
  .au-root{font-family:'Hanken Grotesk',system-ui,sans-serif;color:${T.text};background:${T.bg};
    background-image:radial-gradient(900px 520px at 80% -10%, ${T.glowB}, transparent 60%),
                     radial-gradient(720px 480px at -6% 8%, ${T.glowA}, transparent 55%);
    min-height:100vh;padding:26px clamp(14px,4vw,40px) 36px;overflow-x:hidden;}
  .au-mono{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums;}
  .au-disp{font-family:'Newsreader',Georgia,serif;font-weight:500;letter-spacing:.1px;}
  .au-card{background:${T.panel};border:1px solid ${T.line};border-radius:16px;box-shadow:${T.cardShadow};}
  .au-maxw{max-width:1240px;margin:0 auto;}
  .au-lower{display:grid;grid-template-columns:5fr 7fr;gap:16px;margin-top:16px;}
  .au-lower2{display:grid;grid-template-columns:7fr 5fr;gap:16px;margin-top:16px;}
  .au-hero{display:grid;grid-template-columns:1.45fr 1fr;gap:18px;}
  .au-rules{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:22px;}
  .au-foot{display:flex;gap:14px;margin-top:14px;flex-wrap:wrap;}
  .au-verdict{padding:26px 28px;}
  .au-chartcard{padding:18px 18px 10px;margin-top:16px;}
  @media(max-width:900px){.au-lower,.au-lower2,.au-hero{grid-template-columns:1fr;}}
  @media(max-width:680px){.au-rules{grid-template-columns:1fr;}}
  @media(max-width:560px){
    .au-verdict{padding:18px 16px;}
    .au-chartcard{padding:14px 12px 8px;}
    .au-stance{font-size:25px!important;}
    .au-rule-v{font-size:18px!important;}
  }
  .au-pill{font-size:12.5px;padding:7px 13px;border-radius:999px;border:1px solid ${T.line2};
    color:${T.sub};cursor:default;display:flex;align-items:center;gap:7px;transition:.2s;background:transparent;white-space:nowrap;}
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

  /* ── Alert dates strip ──────────────────────────────────────── */
  .au-alert-strip{display:flex;gap:10px;overflow-x:auto;padding:2px 1px 8px;scrollbar-width:none;-webkit-overflow-scrolling:touch;margin-bottom:4px;}
  .au-alert-strip::-webkit-scrollbar{display:none;}

  /* ── Header layout ─────────────────────────────────────────── */
  .au-hdr{display:flex;flex-wrap:wrap;gap:12px 16px;align-items:flex-end;justify-content:space-between;margin-bottom:18px;}
  .au-hdr-l{display:flex;align-items:center;gap:12px;}
  .au-hdr-m{display:flex;gap:8px;flex-wrap:wrap;}
  .au-hdr-r{display:flex;align-items:flex-end;gap:14px;}

  /* ── Mobile ≤ 700px: 2-col header, scrollable pills ───────── */
  @media(max-width:700px){
    .au-hdr{display:grid;grid-template-columns:1fr auto;grid-template-rows:auto auto;gap:10px 0;}
    .au-hdr-l{grid-column:1;grid-row:1;align-self:center;}
    .au-hdr-r{grid-column:2;grid-row:1;flex-direction:column;align-items:flex-end;gap:3px;}
    .au-hdr-m{grid-column:1/-1;grid-row:2;overflow-x:auto;flex-wrap:nowrap;padding-bottom:3px;
      -webkit-overflow-scrolling:touch;scrollbar-width:none;}
    .au-hdr-m::-webkit-scrollbar{display:none;}
    .au-pill{font-size:11.5px;padding:6px 11px;}
    .au-lower2{margin-top:0;}
  }

  /* ── Mobile ≤ 480px: tighter padding, smaller cards ──────── */
  @media(max-width:480px){
    .au-root{padding:14px 12px 24px;}
    .au-card{border-radius:13px;}
    .au-lower,.au-lower2{gap:12px;margin-top:12px;}
    .au-hero{gap:12px;}
    .au-row{padding:11px 12px;}
    .au-chip{padding:8px 10px;}
    .au-kicker{font-size:10px;letter-spacing:1.2px;}
  }

  /* ── Very small ≤ 380px ──────────────────────────────────── */
  @media(max-width:380px){
    .au-hdr-l .au-kicker{display:none;}
    .au-tgl{padding:6px 10px;font-size:11px;}
  }
  `;

  return (
    <div className="au-root">
      <style>{css}</style>
      <div className="au-maxw">

        {/* Header */}
        <div className="au-hdr au-fade d1">
          {/* Brand */}
          <div className="au-hdr-l">
            <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, background: `linear-gradient(140deg, ${T.goldLite}, ${T.gold} 55%, #7c561a)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#231703", fontWeight: 600, fontFamily: "'Newsreader',serif", fontSize: 17, boxShadow: "0 4px 12px rgba(150,105,25,0.3)" }}>
              nr
            </div>
            <div>
              <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, letterSpacing: ".1px", fontSize: 21, lineHeight: 1, display: "flex", alignItems: "center", gap: 8 }}>
                Nishu Research
                <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: 1, color: T.accent, border: `1px solid ${T.accent}`, borderRadius: 5, padding: "2px 6px", whiteSpace: "nowrap" }}>AI</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                <Loop size={12} style={{ color: T.up }} className="au-spin" />
                <span className="au-kicker" style={{ color: T.upText, whiteSpace: "nowrap", letterSpacing: "1.1px" }}>Self-learning trading agent</span>
              </div>
            </div>
          </div>

          {/* Pills — scrollable on mobile */}
          <div className="au-hdr-m">
            <div className="au-pill on"><span className="au-mono">Au</span> Gold</div>
            <div className="au-pill"><span className="au-mono">Ag</span> Silver <span style={{ fontSize: 9.5, color: T.faint }}>soon</span></div>
            <div className="au-pill"><span className="au-mono">Cu</span> Copper <span style={{ fontSize: 9.5, color: T.faint }}>soon</span></div>
          </div>

          {/* Price + Brief */}
          <div className="au-hdr-r">
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: source === "live" ? T.up : T.faint, flexShrink: 0 }} className={source === "live" ? "au-live" : undefined} />
                <span className="au-mono" style={{ fontSize: "clamp(22px,5vw,30px)", fontWeight: 600, color: T.goldText, lineHeight: 1 }}>
                  ${fmt2(displayPx)}
                </span>
              </div>
              <div className="au-mono" style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginTop: 3, textAlign: "right" }}>
                ₹{displayPxInr.toLocaleString("en-IN")}
                <span style={{ fontSize: 10, color: T.faint, fontWeight: 400, marginLeft: 4 }}>/ 10g</span>
              </div>
              <div className="au-mono" style={{ fontSize: 11.5, marginTop: 3, display: "flex", gap: 4, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <span style={{ color: Number(dayChg) >= 0 ? T.up : T.down }}>{Number(dayChg) >= 0 ? "+" : ""}{dayChg}%</span>
                <span style={{ color: T.faint }}>·</span>
                <span style={{ color: source === "live" ? T.upText : T.accent }}>
                  {source === "live" ? `Yahoo Finance · ${ago}s ago` : "⚡ connecting…"}
                </span>
              </div>
            </div>
            <button className="au-tgl au-cta" onClick={() => setBriefOpen(true)}>
              <News size={15} /> Brief
            </button>
          </div>
        </div>

        {/* Verdict — one simple card */}
        <div className="au-card au-fade d2 au-verdict">

          {/* The call */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ width: 12, height: 12, borderRadius: 99, background: stCol, boxShadow: `0 0 0 4px ${stCol}26` }} />
            <span className="au-stance" style={{ fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, fontSize: 30, lineHeight: 1, color: stTxt }}>{st.label}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12,
              color: T.up, background: T.up + "1f", border: `1px solid ${T.up}55`, borderRadius: 8, padding: "5px 11px" }}>
              <Plus size={12} /> Buy the dip
            </span>
          </div>

          <p style={{ fontSize: 15, color: T.sub, lineHeight: 1.65, marginTop: 14, maxWidth: 660 }}>
            Gold is in a long-term uptrend, but it isn't cheap here. Don't chase it —
            {" "}<b style={{ color: T.text }}>buy only on big dips</b>, then hold for years while inflation stays high.
          </p>

          {/* Two plain rules */}
          <div className="au-rules">
            <div style={{ border: `1px solid ${T.up}44`, borderRadius: 14, padding: "16px 18px", background: T.panel2 }}>
              <span className="au-kicker" style={{ color: T.upText }}>1 · When to buy</span>
              <div className="au-rule-v" style={{ fontSize: 20, fontWeight: 700, marginTop: 8, color: T.text }}>
                Price below <span className="au-mono" style={{ color: T.upText }}>${fmt(dipLevel)}</span>
              </div>
              <div style={{ fontSize: 13, color: T.sub, marginTop: 6, lineHeight: 1.55 }}>
                On any sharp drop. A long-term entry — not a quick trade.
              </div>
            </div>

            <div style={{ border: `1px solid ${T.accent}44`, borderRadius: 14, padding: "16px 18px", background: T.panel2 }}>
              <span className="au-kicker" style={{ color: T.accent }}>2 · When to keep holding</span>
              <div className="au-rule-v" style={{ fontSize: 20, fontWeight: 700, marginTop: 8, color: T.text }}>
                CPI inflation above <span className="au-mono" style={{ color: T.accent }}>4%</span>
              </div>
              <div style={{ fontSize: 13, color: T.sub, marginTop: 6, lineHeight: 1.55 }}>
                The inflation-hedge case. Hold 5+ years while it lasts.
                {nextCat && <>{" "}Next read: <b style={{ color: T.text }}>{nextCat.label}</b> in {dUntil(nextCat.date)}d.</>}
              </div>
            </div>
          </div>

          {/* Status + target */}
          <div className="au-foot">
            {(() => {
              const inZone = displayPx <= dipLevel;
              return (
                <div style={{ flex: 1, minWidth: 220, border: `1px solid ${inZone ? T.up + "88" : T.line2}`, borderRadius: 14, padding: "14px 18px", background: inZone ? T.up + "12" : T.panel2 }}>
                  <span className="au-kicker">Right now</span>
                  <div style={{ fontSize: 19, fontWeight: 700, color: inZone ? T.up : T.goldText, marginTop: 6 }}>
                    {inZone ? "Buy zone — the dip is here" : "Wait — too high to buy"}
                  </div>
                  <div className="au-mono" style={{ fontSize: 12, color: T.sub, marginTop: 5 }}>
                    Gold <b style={{ color: T.text }}>${fmt2(displayPx)}</b> · buy under ${fmt(dipLevel)}
                  </div>
                </div>
              );
            })()}

            <div style={{ flex: 1, minWidth: 220, border: `1px solid ${T.gold}44`, borderRadius: 14, padding: "14px 18px", background: T.panel2 }}>
              <span className="au-kicker">12-month target</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginTop: 6 }}>
                <span className="au-mono" style={{ fontSize: 26, fontWeight: 600, color: T.goldText, lineHeight: 1 }}>${fmt(target)}</span>
                <span className="au-mono" style={{ fontSize: 13, color: Number(upside) >= 0 ? T.up : T.down, fontWeight: 600 }}>{Number(upside) >= 0 ? "+" : ""}{upside}%</span>
              </div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 5 }}>If the trend holds.</div>
            </div>
          </div>

        </div>

        {/* Chart */}
        <div className="au-card au-fade d3 au-chartcard">
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
        <TweakSlider label="12-mo target" value={tw.target} min={3500} max={7000} step={50} unit=" $/oz"
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
          nextMove: `Structurally bullish — buy only on big dips below $${fmt(dipLevel)}${nextCat ? ` (watch ${mFmt(nextCat.date)} ${dDay(nextCat.date)})` : ""}`,
          buyZone: `$${fmt(buyZone[0])} – $${fmt(buyZone[1])}`,
          invalid: `< $${fmt(invalid)}`,
          rr: `${rr} : 1`,
          line: thesisLineText,
        }} />
      )}
    </div>
  );
}
