import type { Theme } from "../theme";
import type { Signal } from "../data";
import { EVIDENCE } from "../data";

interface Props { T: Theme & { accent: string }; signals?: Signal[]; confidencePct?: number; }

export default function EvidenceChain({ T, signals = EVIDENCE, confidencePct }: Props) {
  const aligned = signals.filter((e) => e.aligned).length;
  const conf = confidencePct ?? (signals.length ? Math.round((aligned / signals.length) * 100) : 0);
  return (
    <div style={{ marginTop: 12, borderTop: `1px solid ${T.line}`, paddingTop: 11 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span className="au-kicker" style={{ color: T.faint }}>Why now</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontVariantNumeric: "tabular-nums", fontSize: 12, fontWeight: 600, color: T.upText }}>{conf}% confidence</span>
        <span style={{ fontSize: 11, color: T.faint }}>· {aligned}/{signals.length} signals aligned</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {signals.map((e) => {
          const col = e.aligned ? T.up : T.down;
          return (
            <span key={e.key} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5,
              color: T.text, background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 999, padding: "4px 10px" }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: col }} />
              {e.key} <span style={{ color: T.sub }}>{e.state}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
