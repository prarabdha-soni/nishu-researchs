import { useState, useEffect } from "react";
import type { Theme } from "../theme";
import { REASONING } from "../data";
import { Loop } from "./Icons";

interface Props { T: Theme & { accent: string }; }

export default function ReasoningStream({ T }: Props) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % REASONING.length), 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="au-fade d2" style={{ display: "flex", alignItems: "center", gap: 9, margin: "0 2px 16px", fontSize: 12.5, color: T.sub }}>
      <Loop size={13} className="au-spin" style={{ color: T.up, flexShrink: 0 }} />
      <span className="au-kicker" style={{ color: T.upText }}>Live reasoning</span>
      <span style={{ width: 1, height: 12, background: T.line2 }} />
      <span key={i} className="au-reason" style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {REASONING[i]}
      </span>
    </div>
  );
}
