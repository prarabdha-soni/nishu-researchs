import type { Theme } from "../theme";

interface BriefData {
  date: string;
  stance: string;
  conviction: number;
  last: string;
  target: string;
  nextMove: string;
  buyZone: string;
  invalid: string;
  rr: string;
  line: string;
}

interface Props { T: Theme & { accent: string }; brief: BriefData; onClose: () => void; }

const printCss = `@media print{body *{visibility:hidden!important;}#nw-brief,#nw-brief *{visibility:visible!important;}
  #nw-brief{position:absolute!important;left:0;top:0;width:100%;box-shadow:none!important;border:none!important;}#nw-brief .nw-noprint{display:none!important;}}`;

function Row({ k, v, c, T }: { k: string; v: string; c?: string; T: Theme & { accent: string } }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "9px 0", borderBottom: `1px solid ${T.line}` }}>
      <span style={{ fontSize: 12.5, color: T.sub }}>{k}</span>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontVariantNumeric: "tabular-nums", fontSize: 13.5, fontWeight: 600, color: c || T.text }}>{v}</span>
    </div>
  );
}

export default function BriefModal({ T, brief, onClose }: Props) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(20,15,8,0.45)",
      display: "flex", alignItems: "flex-start", justifyContent: "center", overflow: "auto", padding: "5vh 16px", backdropFilter: "blur(3px)" }}>
      <style>{printCss}</style>
      <div id="nw-brief" onClick={(e) => e.stopPropagation()} className="au-card"
        style={{ width: "100%", maxWidth: 460, padding: 26, background: T.panel }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="au-kicker" style={{ color: T.accent }}>Nishu Research · daily brief</div>
            <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, letterSpacing: ".1px", fontSize: 22, marginTop: 4 }}>Gold · {brief.date}</div>
          </div>
          <button onClick={onClose} className="nw-noprint" style={{ border: "none", background: "transparent", color: T.faint, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 4px" }}>
          <span style={{ width: 10, height: 10, borderRadius: 99, background: T.up }} />
          <span style={{ fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, fontSize: 19, color: T.upText }}>{brief.stance}</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontVariantNumeric: "tabular-nums", fontSize: 12.5, color: T.sub, marginLeft: "auto" }}>{(brief.conviction / 10).toFixed(1)}/10 conviction</span>
        </div>

        <div style={{ marginTop: 10 }}>
          <Row T={T} k="Spot"           v={"$" + brief.last} />
          <Row T={T} k="12-month target" v={"$" + brief.target}  c={T.goldText} />
          <Row T={T} k="Next move"       v={brief.nextMove}       c={T.upText} />
          <Row T={T} k="Buy zone"        v={brief.buyZone} />
          <Row T={T} k="Invalidation"    v={brief.invalid}        c={T.down} />
          <Row T={T} k="Reward : risk"   v={brief.rr}             c={T.up} />
        </div>

        <div style={{ marginTop: 16, fontSize: 12.5, color: T.sub, lineHeight: 1.6 }}>{brief.line}</div>

        <div className="nw-noprint" style={{ display: "flex", gap: 9, marginTop: 20 }}>
          <button onClick={() => window.print()} style={{ flex: 1, border: "none", cursor: "pointer", fontFamily: "inherit",
            background: T.accent, color: "#fff", borderRadius: 10, padding: "11px", fontSize: 13.5, fontWeight: 600 }}>
            Print / Save PDF
          </button>
          <button onClick={onClose} style={{ border: `1px solid ${T.line2}`, cursor: "pointer", fontFamily: "inherit",
            background: "transparent", color: T.sub, borderRadius: 10, padding: "11px 16px", fontSize: 13.5 }}>
            Close
          </button>
        </div>
        <div style={{ fontSize: 10, color: T.faint, marginTop: 14, lineHeight: 1.5 }}>
          Illustrative. Nishu advises on scenarios; it does not guarantee outcomes. Not financial advice.
        </div>
      </div>
    </div>
  );
}
