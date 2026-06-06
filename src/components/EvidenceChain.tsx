import type { Theme } from "../theme";
import { EVIDENCE } from "../data";

interface Props { T: Theme & { accent: string }; }

export default function EvidenceChain({ T }: Props) {
  const aligned = EVIDENCE.filter((e) => e.align).length;
  const conf = Math.round((aligned / EVIDENCE.length) * 100);
  return (
    <div style={{ marginTop: 12, borderTop: `1px solid ${T.line}`, paddingTop: 11 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span className="au-kicker" style={{ color: T.faint }}>Why now</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontVariantNumeric: "tabular-nums", fontSize: 12, fontWeight: 600, color: T.upText }}>{conf}% confidence</span>
        <span style={{ fontSize: 11, color: T.faint }}>· {aligned}/{EVIDENCE.length} signals aligned</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {EVIDENCE.map((e) => {
          const col = e.align ? T.up : T.down;
          return (
            <span key={e.k} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5,
              color: T.text, background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 999, padding: "4px 10px" }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: col }} />
              {e.k} <span style={{ color: T.sub }}>{e.s}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
