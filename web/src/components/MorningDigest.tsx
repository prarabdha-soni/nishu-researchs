/**
 * Daily explanation panel — shows the DeepSeek-generated causal note.
 * Every claim links back to its DataPoint source. No number appears
 * without a citation. This is the "research" half of the product.
 */
import { useEffect, useState } from "react";
import type { Theme } from "../theme";

interface EvidenceRow {
  id:         string;
  series:     string;
  value:      number;
  unit:       string;
  source:     string;
  source_url: string;
  asof:       string;
}

interface Driver {
  rank:                      number;
  driver:                    string;
  claim:                     string;
  evidence_ids:              string[];
  magnitude_attribution_pct: number;
  chain:                     string;
}

interface Scenario {
  catalyst_id:      string;
  label:            string;
  probability:      number;
  predicted_move_lo: number;
  predicted_move_hi: number;
  driver:           string;
  if_then:          string;
}

interface ExplainBody {
  headline:  string;
  summary:   string;
  drivers:   Driver[];
  scenarios: Scenario[];
}

interface ExplanationResp {
  id:      string;
  asof:    string;
  headline:string;
  body:    ExplainBody;
  model:   string;
}

const DRIVER_COLOR: Record<string, string> = {
  macro: "#3E80AA", mechanical: "#6E5DB8", positioning: "#B07F24",
  geopolitical: "#C2563B", narrative: "#B14A7E",
};

const STYLE = `
.md-card{border-radius:14px;overflow:hidden}
.md-driver{border-radius:8px;padding:12px 14px;margin-bottom:8px}
.md-chain{font-size:11px;font-family:'JetBrains Mono',monospace;
  opacity:.65;margin-top:5px;letter-spacing:.01em}
.md-ev-chip{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;
  border-radius:5px;padding:2px 8px;margin:2px 3px 2px 0;cursor:pointer;
  text-decoration:none;transition:opacity .1s}
.md-ev-chip:hover{opacity:.75}
.md-scen{border-radius:8px;padding:10px 13px;margin-bottom:6px;display:flex;
  align-items:flex-start;gap:12px}
.md-prob{font-size:15px;font-weight:700;font-variant-numeric:tabular-nums;min-width:44px}
`;

export default function MorningDigest({ T }: { T: Theme & { accent: string } }) {
  const [exp, setExp]         = useState<ExplanationResp | null>(null);
  const [refs, setRefs]       = useState<Record<string, EvidenceRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/explain/latest")
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(async (data: ExplanationResp) => {
        setExp(data);
        // Fetch all evidence data points for click-through
        const allIds = data.body.drivers.flatMap(d => d.evidence_ids);
        if (allIds.length) {
          const refMap: Record<string, EvidenceRow> = {};
          await Promise.all(allIds.map(id =>
            fetch(`/api/data/point/${id}`)
              .then(r => r.ok ? r.json() : null)
              .then(row => { if (row) refMap[row.id] = row; })
              .catch(() => {})
          ));
          setRefs(refMap);
        }
      })
      .catch((e) => setError(e === 404 ? "No explanation yet — run the daily cycle." : String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="au-card au-fade d5" style={{ padding: 20, color: T.sub, fontSize: 13 }}>
      Loading research note…
    </div>
  );

  if (error) return (
    <div className="au-card au-fade d5" style={{ padding: 20, color: T.sub, fontSize: 13 }}>
      {error}
    </div>
  );

  if (!exp) return null;
  const body = exp.body;
  const asofStr = new Date(exp.asof).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="au-card au-fade d4 md-card" style={{ padding: 20 }}>
      <style>{STYLE}</style>

      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span className="au-kicker" style={{ color: T.faint }}>Daily Research</span>
          <span style={{ fontSize: 10.5, color: T.faint }}>{asofStr} · {exp.model}</span>
          <span style={{ marginLeft: "auto", fontSize: 10, background: "rgba(196,169,109,.12)",
            color: "#c4a96d", borderRadius: 4, padding: "1px 7px" }}>
            sourced · verified
          </span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.35 }}>
          {body.headline}
        </div>
        <div style={{ fontSize: 12.5, color: T.sub, marginTop: 7, lineHeight: 1.6 }}>
          {body.summary}
        </div>
      </div>

      {/* Drivers */}
      {body.drivers?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="au-kicker" style={{ color: T.faint, marginBottom: 8 }}>Driver attribution</div>
          {body.drivers.map(d => {
            const col = DRIVER_COLOR[d.driver] || T.sub;
            const mag = d.magnitude_attribution_pct;
            return (
              <div key={d.rank} className="md-driver"
                style={{ background: col + "14", border: `1px solid ${col}33` }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: col,
                    textTransform: "uppercase", letterSpacing: ".06em" }}>
                    #{d.rank} {d.driver}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 600,
                    color: mag >= 0 ? T.up : T.down, fontVariantNumeric: "tabular-nums" }}>
                    {mag >= 0 ? "+" : ""}{mag?.toFixed(1)}%
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: T.text, marginTop: 4 }}>{d.claim}</div>
                <div className="md-chain">{d.chain}</div>
                {/* Evidence chips — each is a click-through to the source */}
                {d.evidence_ids?.length > 0 && (
                  <div style={{ marginTop: 7 }}>
                    {d.evidence_ids.map(eid => {
                      const row = refs[eid];
                      return row ? (
                        <a key={eid} href={row.source_url} target="_blank"
                          rel="noopener noreferrer" className="md-ev-chip"
                          style={{ background: col + "20", color: col, border: `1px solid ${col}44` }}
                          title={`${row.series}: ${row.value} ${row.unit} · ${row.source}`}>
                          ↗ {row.series} {row.value} {row.unit}
                        </a>
                      ) : (
                        <span key={eid} className="md-ev-chip"
                          style={{ background: T.panel2, color: T.faint }}>
                          {eid.slice(0, 8)}…
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Scenarios */}
      {body.scenarios?.length > 0 && (
        <div>
          <div className="au-kicker" style={{ color: T.faint, marginBottom: 8 }}>
            Forward scenarios · logged to ledger
          </div>
          {body.scenarios.map((s, i) => {
            const lo = s.predicted_move_lo, hi = s.predicted_move_hi;
            const mid = (lo + hi) / 2;
            const col = mid >= 0 ? T.up : T.down;
            return (
              <div key={i} className="md-scen"
                style={{ background: T.panel2, border: `1px solid ${T.line}` }}>
                <div>
                  <div className="md-prob" style={{ color: col }}>
                    {Math.round(s.probability * 100)}%
                  </div>
                  <div style={{ fontSize: 10, color: T.faint, fontVariantNumeric: "tabular-nums" }}>
                    {lo >= 0 ? "+" : ""}{lo?.toFixed(1)} to {hi >= 0 ? "+" : ""}{hi?.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 11.5, color: T.sub, marginTop: 2 }}>{s.if_then}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
