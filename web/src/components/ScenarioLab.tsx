import React, { useState } from "react";
import type { Theme } from "../theme";
import type { Scenario } from "../data";
import { SCN } from "../data";
import { Activity, Plus, Clock, Scissors } from "./Icons";

interface Props { T: Theme & { accent: string }; scenarios?: Scenario[]; }

const ACT_ICON: Record<string, React.FC<{ size?: number }>> = { buy: Plus, wait: Clock, trim: Scissors };
const ACT_KEY: Record<string, string> = { buy: "up", wait: "sub", trim: "down" };

function ActChip({ T, kind, act }: { T: Theme & { accent: string }; kind: string; act: string }) {
  const col = T[ACT_KEY[kind] as keyof typeof T] as string;
  const AIcon = ACT_ICON[kind] || Clock;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12.5,
      color: col, background: col + "1f", border: `1px solid ${col}55`, borderRadius: 8, padding: "4px 9px", whiteSpace: "nowrap" }}>
      <AIcon size={13} /> {act}
    </span>
  );
}

export default function ScenarioLab({ T, scenarios = SCN }: Props) {
  const [sel, setSel] = useState<Record<string, number>>(() =>
    Object.fromEntries(scenarios.map((s) => [s.id, s.def]))
  );

  return (
    <div className="au-card au-fade d5" style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
        <Activity size={15} style={{ color: T.accent }} />
        <span style={{ fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, letterSpacing: ".1px", fontSize: 18 }}>Scenario lab</span>
        <span style={{ fontSize: 11, color: T.faint }}>· what would Nishu do?</span>
      </div>
      <div style={{ fontSize: 11.5, color: T.faint, marginBottom: 16 }}>Pick an outcome — see the agent's pre-committed response.</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {scenarios.map((s) => {
          const cur = s.opts[sel[s.id]];
          const moveColor = cur.kind === "trim" ? T.down : cur.kind === "wait" ? T.sub : T.up;
          return (
            <div key={s.id}>
              <div className="au-kicker" style={{ marginBottom: 8 }}>{s.label}</div>
              <div style={{ display: "flex", gap: 6, background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 10, padding: 4 }}>
                {s.opts.map((o, i) => {
                  const on = sel[s.id] === i;
                  return (
                    <button key={i} onClick={() => setSel((p) => ({ ...p, [s.id]: i }))}
                      style={{ flex: 1, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600,
                        borderRadius: 7, padding: "7px 6px", transition: ".15s",
                        background: on ? T.panel : "transparent", color: on ? T.text : T.sub,
                        boxShadow: on ? T.cardShadow : "none" }}>
                      {o.k}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 11, flexWrap: "wrap" as const }}>
                <ActChip T={T} kind={cur.kind} act={cur.act} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontVariantNumeric: "tabular-nums", fontSize: 13, fontWeight: 600, color: moveColor }}>{cur.move}</span>
              </div>
              <div style={{ fontSize: 12.5, color: T.sub, lineHeight: 1.5, marginTop: 8 }}>{cur.note}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
