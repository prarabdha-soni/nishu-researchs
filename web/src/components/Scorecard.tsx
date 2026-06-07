import type { Theme } from "../theme";
import type { TrackRecord } from "../data";
import { TRACK } from "../data";
import { Gauge } from "./Icons";

interface Props { T: Theme & { accent: string }; track?: TrackRecord; }

export default function Scorecard({ T, track = TRACK }: Props) {
  const tile = (label: string, value: string, color: string, sub?: string) => (
    <div style={{ borderLeft: `2px solid ${color}`, paddingLeft: 13 }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontVariantNumeric: "tabular-nums", fontSize: 10, color: T.faint, letterSpacing: 0.6, textTransform: "uppercase" as const }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontVariantNumeric: "tabular-nums", fontSize: 21, fontWeight: 600, color, marginTop: 4, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: T.sub, marginTop: 3 }}>{sub}</div>}
    </div>
  );
  return (
    <div className="au-card au-fade d5" style={{ padding: "17px 20px", marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 13, flexWrap: "wrap" as const }}>
        <Gauge size={15} style={{ color: T.accent }} />
        <span style={{ fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, letterSpacing: ".1px", fontSize: 17 }}>Track record</span>
        <span style={{ fontSize: 11, color: T.faint }}>· live, since Jan 2026 · the wins and the misses</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 18 }}>
        {tile("Hit rate",      track.hit + "%",   T.up,   track.trades + " trades")}
        {tile("Avg realised",  track.avgR + "R",  T.up,   "per closed trade")}
        {tile("Best call",     track.best.r,      T.up,   track.best.label)}
        {tile("Worst call",    track.worst.r,     T.down, track.worst.label)}
      </div>
    </div>
  );
}
