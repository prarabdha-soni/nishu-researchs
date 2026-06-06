import type { Theme } from "../theme";
import { LEARN } from "../data";
import { Loop } from "./Icons";

interface Props { T: Theme & { accent: string }; }

export default function LearningLog({ T }: Props) {
  return (
    <div className="au-card au-fade d5" style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
        <Loop size={15} style={{ color: T.accent }} />
        <span style={{ fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, letterSpacing: ".1px", fontSize: 18 }}>How Nishu is learning</span>
      </div>
      <div style={{ fontSize: 11.5, color: T.faint, marginBottom: 16 }}>Every closed trade re-weights the model. Recent changes:</div>

      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 5, top: 4, bottom: 4, width: 1.5, background: T.line }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {LEARN.map((l, i) => (
            <div key={i} style={{ position: "relative", paddingLeft: 22 }}>
              <span style={{ position: "absolute", left: 0, top: 4, width: 11, height: 11, borderRadius: 99,
                background: T.panel, border: `2px solid ${i === 0 ? T.up : T.faint}` }} />
              <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" as const }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontVariantNumeric: "tabular-nums", fontSize: 11.5, color: T.goldText, fontWeight: 600 }}>{l.date}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T.sub, background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 6, padding: "1px 7px" }}>{l.ver}</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: T.accent }}>{l.delta}</span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 5 }}>{l.title}</div>
              <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.5, marginTop: 4 }}>{l.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
