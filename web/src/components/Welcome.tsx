import React, { useState, useEffect } from "react";

const C = {
  bg: "#F4F1EA", panel: "#FBF9F4",
  text: "#2A2620", sub: "#6F6A5C", faint: "#A39C8B",
  line: "rgba(64,52,30,0.10)", line2: "rgba(64,52,30,0.17)",
  accent: "#C2613F", gold: "#B27D27", goldLite: "#C8923A", goldText: "#8A6118", up: "#1E9B57",
};

const TOPICS = [
  { l: "Trump",        c: "#B14A7E", t: "5%",  x: "23%" },
  { l: "Gold",         c: "#B27D27", t: "2%",  x: "53%" },
  { l: "Iran",         c: "#C2563B", t: "10%", x: "81%" },
  { l: "War risk",     c: "#C2563B", t: "22%", x: "4%"  },
  { l: "Tariffs",      c: "#3E80AA", t: "31%", x: "92%" },
  { l: "Fed pivot",    c: "#3E80AA", t: "44%", x: "2%"  },
  { l: "AI models",    c: "#C2613F", t: "55%", x: "94%" },
  { l: "Silver",       c: "#8A8FA0", t: "66%", x: "5%"  },
  { l: "May CPI",      c: "#3E80AA", t: "90%", x: "25%" },
  { l: "China · PBoC", c: "#B07F24", t: "93%", x: "55%" },
  { l: "Oil shock",    c: "#C2563B", t: "86%", x: "83%" },
];

const PHASES = [
  { p: 0,  t: "Ingesting global news & filings" },
  { p: 24, t: "Linking events to gold's reaction" },
  { p: 48, t: "Training on realised outcomes" },
  { p: 72, t: "Calibrating conviction" },
  { p: 90, t: "Synthesising the macro view" },
];

const css = `
.nw-root{position:fixed;inset:0;z-index:50;font-family:'Hanken Grotesk',system-ui,sans-serif;color:${C.text};
  background:${C.bg};
  background-image:radial-gradient(900px 540px at 80% -8%, rgba(178,125,39,0.12), transparent 60%),
                   radial-gradient(760px 500px at -6% 10%, rgba(194,97,63,0.09), transparent 55%);
  display:flex;align-items:center;justify-content:center;overflow:auto;
  transition:opacity .44s ease, transform .44s ease;}
.nw-root *{box-sizing:border-box;}
.nw-leaving{opacity:0;transform:scale(.985);}
.nw-skip{position:absolute;top:18px;right:20px;background:transparent;border:1px solid ${C.line2};
  color:${C.sub};border-radius:999px;padding:6px 14px;font-size:12px;cursor:pointer;font-family:inherit;transition:.18s;}
.nw-skip:hover{color:${C.text};border-color:${C.text};}
.nw-wrap{width:100%;max-width:720px;padding:34px 24px;text-align:center;}
.nw-brand{display:flex;align-items:center;justify-content:center;gap:10px;}
.nw-logo{width:34px;height:34px;border-radius:10px;background:linear-gradient(140deg, ${C.goldLite}, ${C.gold} 55%, #7c561a);
  color:#231703;display:flex;align-items:center;justify-content:center;font-family:'Newsreader',serif;font-weight:600;font-size:15px;
  box-shadow:0 4px 12px rgba(150,105,25,0.3);}
.nw-name{font-family:'Newsreader',serif;font-size:20px;}
.nw-tag{font-size:9.5px;font-weight:700;letter-spacing:1px;color:${C.accent};border:1px solid ${C.accent};
  border-radius:5px;padding:2px 6px;}
.nw-h1{font-family:'Newsreader',serif;font-weight:500;font-size:clamp(28px,4.6vw,44px);margin:18px 0 0;letter-spacing:.2px;line-height:1.05;}
.nw-sub{font-size:14.5px;line-height:1.62;color:${C.sub};max-width:566px;margin:13px auto 0;text-wrap:pretty;}
.nw-stage{position:relative;width:100%;max-width:600px;height:312px;margin:20px auto 0;}
.nw-chippos{position:absolute;transform:translate(-50%,-50%);}
.nw-chip{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:600;color:${C.sub};
  background:${C.panel};border:1px solid ${C.line};border-radius:999px;padding:7px 13px;white-space:nowrap;
  box-shadow:0 4px 14px rgba(70,55,25,0.05);transition:transform .35s ease, color .35s, border-color .35s, box-shadow .35s;}
.nw-dot{width:8px;height:8px;border-radius:99px;opacity:.55;transition:.35s;}
.nw-chip.on{color:${C.text};border-color:var(--c);transform:scale(1.12);
  box-shadow:0 0 0 1px var(--c) inset, 0 10px 26px color-mix(in srgb, var(--c) 22%, transparent);}
.nw-chip.on .nw-dot{opacity:1;box-shadow:0 0 0 4px color-mix(in srgb, var(--c) 18%, transparent);}
.nw-core{position:absolute;top:50%;left:50%;width:154px;height:154px;transform:translate(-50%,-50%);
  display:flex;align-items:center;justify-content:center;}
.nw-core-in{position:relative;z-index:2;width:106px;height:106px;border-radius:50%;background:${C.panel};
  border:1px solid ${C.line2};display:flex;flex-direction:column;align-items:center;justify-content:center;
  box-shadow:0 12px 32px rgba(70,55,25,0.14);}
.nw-kick{font-size:9px;letter-spacing:1.4px;text-transform:uppercase;color:${C.faint};font-weight:700;}
.nw-word{font-family:'Newsreader',serif;font-size:19px;margin-top:3px;max-width:94px;line-height:1.05;}
.nw-ring{position:absolute;border-radius:50%;}
.nw-dash{position:absolute;width:136px;height:136px;border-radius:50%;border:1.5px dashed ${C.gold};opacity:.5;}
.nw-prog{max-width:448px;margin:22px auto 0;}
.nw-ptop{display:flex;justify-content:space-between;align-items:baseline;font-size:12.5px;margin-bottom:7px;}
.nw-phase{color:${C.sub};} .nw-pct{font-family:'JetBrains Mono',monospace;color:${C.goldText};font-weight:600;}
.nw-bar{height:7px;border-radius:6px;background:rgba(60,45,20,0.08);overflow:hidden;}
.nw-fill{height:100%;background:linear-gradient(90deg, ${C.gold}, ${C.up});border-radius:6px;transition:width .25s ease;}
.nw-stats{display:flex;justify-content:center;gap:20px;margin-top:13px;font-size:11.5px;color:${C.faint};flex-wrap:wrap;}
.nw-stats b{color:${C.text};font-family:'JetBrains Mono',monospace;font-weight:600;}
.nw-enter{margin-top:24px;opacity:0;transform:translateY(6px);pointer-events:none;transition:.5s ease;
  background:${C.accent};color:#fff;border:none;border-radius:999px;padding:12px 24px;font-size:14px;font-weight:600;
  cursor:pointer;font-family:inherit;box-shadow:0 8px 22px rgba(194,97,63,0.28);}
.nw-enter.show{opacity:1;transform:none;pointer-events:auto;}
.nw-enter:hover{filter:brightness(1.05);}
.nw-fadein{opacity:0;animation:nwUp .7s cubic-bezier(.2,.7,.2,1) forwards;}
.nw-d1{animation-delay:.05s}.nw-d2{animation-delay:.16s}.nw-d3{animation-delay:.28s}.nw-d4{animation-delay:.4s}
@keyframes nwUp{to{opacity:1;transform:none;}}
@keyframes nwSpin{to{transform:rotate(360deg);}}
@keyframes nwPulse{0%{transform:scale(.66);opacity:0}40%{opacity:.5}100%{transform:scale(1.28);opacity:0}}
@keyframes nwFloat{0%,100%{margin-top:-3px}50%{margin-top:5px}}
@keyframes nwWordIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:no-preference){
  .nw-chip{animation:nwFloat 4s ease-in-out infinite;}
  .nw-dash{animation:nwSpin 15s linear infinite;}
  .nw-r1{animation:nwPulse 2.6s ease-out infinite;}
  .nw-r2{animation:nwPulse 2.6s ease-out infinite 1.3s;}
  .nw-word{animation:nwWordIn .45s cubic-bezier(.2,.7,.2,1);}
}
@media(max-width:600px){
  .nw-wrap{padding:24px 16px;}
  .nw-stage{height:240px;}
  .nw-chippos:nth-child(n+6){display:none;}
  .nw-chip{font-size:11.5px;padding:6px 11px;}
  .nw-core-in{width:92px;height:92px;}
  .nw-word{font-size:16px;}
  .nw-enter{padding:11px 22px;font-size:13px;}
  .nw-prog{max-width:100%;}
}
@media(max-width:400px){
  .nw-stage{height:190px;}
  .nw-chippos:nth-child(n+4){display:none;}
  .nw-h1{margin:12px 0 0;}
}
`;

interface Props {
  onEnter: () => void;
}

export default function Welcome({ onEnter }: Props) {
  const [prog, setProg] = useState(0);
  const [wi, setWi] = useState(0);
  const [done, setDone] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const enter = () => { setLeaving(true); setTimeout(onEnter, 440); };

  useEffect(() => {
    const start = performance.now(), dur = 5400;
    let raf: number, stop = false;
    const tick = (now: number) => {
      if (stop) return;
      const e = Math.min(1, (now - start) / dur);
      setProg(Math.round(e * 100));
      if (e < 1) raf = requestAnimationFrame(tick);
      else { setDone(true); }
    };
    raf = requestAnimationFrame(tick);
    return () => { stop = true; cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setWi((v) => (v + 1) % TOPICS.length), 560);
    return () => clearInterval(id);
  }, []);

  const phase = [...PHASES].reverse().find((ph) => prog >= ph.p) || PHASES[0];
  const cur = TOPICS[wi];
  const scanned = Math.round((prog / 100) * 1284);
  const linked  = Math.round((prog / 100) * 26);
  const trained = Math.round((prog / 100) * 312);

  return (
    <div className={"nw-root" + (leaving ? " nw-leaving" : "")}>
      <style>{css}</style>
      <button className="nw-skip" onClick={enter}>Skip intro →</button>

      <div className="nw-wrap">
        <div className="nw-brand nw-fadein nw-d1">
          <div className="nw-logo">nr</div>
          <div className="nw-name">Nishu Research</div>
          <span className="nw-tag">AI · AGI</span>
        </div>

        <h1 className="nw-h1 nw-fadein nw-d2">Self-learning trading agent</h1>
        <p className="nw-sub nw-fadein nw-d2">
          An autonomous AI that researches the macro from global news and events, trades the
          outcome, and re-trains itself on every result — an agent compounding its own edge,
          toward AGI for markets.
        </p>

        <div className="nw-stage nw-fadein nw-d3">
          {TOPICS.map((tp, i) => (
            <div key={i} className="nw-chippos" style={{ top: tp.t, left: tp.x }}>
              <div
                className={"nw-chip" + (i === wi ? " on" : "")}
                style={{ "--c": tp.c, animationDelay: (i * 0.27) + "s" } as React.CSSProperties}
              >
                <span className="nw-dot" style={{ background: tp.c }} />{tp.l}
              </div>
            </div>
          ))}

          <div className="nw-core">
            <span className="nw-ring nw-r1" style={{ width: 154, height: 154, border: `1px solid ${C.line2}` }} />
            <span className="nw-ring nw-r2" style={{ width: 154, height: 154, border: `1px solid ${C.line}` }} />
            <span className="nw-dash" />
            <div className="nw-core-in">
              <div className="nw-kick">Researching</div>
              <div key={wi} className="nw-word" style={{ color: cur.c }}>{cur.l}</div>
            </div>
          </div>
        </div>

        <div className="nw-prog nw-fadein nw-d4">
          <div className="nw-ptop">
            <span className="nw-phase">{done ? "Macro view synthesised" : phase.t + "…"}</span>
            <span className="nw-pct">{prog}%</span>
          </div>
          <div className="nw-bar"><div className="nw-fill" style={{ width: prog + "%" }} /></div>
          <div className="nw-stats">
            <span><b>{scanned.toLocaleString()}</b> sources scanned</span>
            <span><b>{linked}</b> events linked</span>
            <span><b>{trained}</b> outcomes trained</span>
          </div>
        </div>

        <button className={"nw-enter" + (done ? " show" : "")} onClick={enter}>Enter the desk →</button>
      </div>
    </div>
  );
}
