/**
 * The public calibration ledger — every call, scored. Misses included.
 * This is the moat: accumulated scored history competitors cannot copy.
 * Brier score lower = better. Hit rate = branch landed in predicted band.
 */
import { useEffect, useState } from "react";
import type { Theme } from "../theme";

interface DriverStat {
  calls:      number;
  hit_rate:   number;
  brier_mean: number | null;
}

interface Call {
  scenario_id:  string;
  catalyst_id:  string;
  label:        string;
  driver:       string;
  probability:  number;
  predicted_lo: number | null;
  predicted_hi: number | null;
  if_then:      string | null;
  actual_move:  number;
  branch_hit:   boolean;
  brier_score:  number;
  r_multiple:   number | null;
  resolved_at:  string;
}

interface Ledger {
  total_calls: number;
  hit_rate:    number;
  brier_mean:  number | null;
  by_driver:   Record<string, DriverStat>;
  calls:       Call[];
  note:        string;
}

const DRIVER_COLOR: Record<string, string> = {
  macro: "#3E80AA", mechanical: "#6E5DB8", positioning: "#B07F24",
  geopolitical: "#C2563B", narrative: "#B14A7E",
};

const STYLE = `
.cl-table{width:100%;border-collapse:collapse;font-size:12px}
.cl-table th{text-align:left;padding:6px 10px;font-weight:600;
  font-size:10px;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid}
.cl-table td{padding:7px 10px;border-bottom:1px solid;vertical-align:top}
.cl-hit{font-weight:700}
.cl-brier{font-variant-numeric:tabular-nums;font-size:11.5px}
.cl-chip{display:inline-block;border-radius:4px;padding:1px 7px;font-size:10px;font-weight:700}
`;

export default function CalibrationLedger({ T }: { T: Theme & { accent: string } }) {
  const [ledger, setLedger]   = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ledger")
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setLedger)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="au-card au-fade d5" style={{ padding: 20, color: T.sub, fontSize: 13 }}>
      Loading calibration ledger…
    </div>
  );

  if (error || !ledger) return (
    <div className="au-card au-fade d5" style={{ padding: 20, color: T.sub, fontSize: 13 }}>
      {error || "No calls yet."}
    </div>
  );

  return (
    <div className="au-card au-fade d5" style={{ padding: 20 }}>
      <style>{STYLE}</style>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span className="au-kicker" style={{ color: T.faint }}>Calibration Ledger</span>
          <span style={{ fontSize: 10, background: "rgba(196,169,109,.12)",
            color: "#c4a96d", borderRadius: 4, padding: "1px 7px", marginLeft: "auto" }}>
            public · all misses included
          </span>
        </div>

        {/* Summary stats */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { label: "Total calls",  v: ledger.total_calls, unit: "" },
            { label: "Hit rate",     v: ledger.hit_rate,    unit: "%" },
            { label: "Brier (mean)", v: ledger.brier_mean ?? "—", unit: "" },
          ].map(s => (
            <div key={s.label} style={{ minWidth: 90 }}>
              <div style={{ fontSize: 11, color: T.faint }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                color: T.text }}>
                {typeof s.v === "number" ? s.v.toLocaleString() : s.v}{s.unit}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-driver stats */}
      {Object.keys(ledger.by_driver).length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {Object.entries(ledger.by_driver).map(([driver, stat]) => {
            const col = DRIVER_COLOR[driver] || T.sub;
            return (
              <div key={driver} style={{ borderRadius: 8, padding: "8px 12px",
                background: col + "14", border: `1px solid ${col}33`, minWidth: 110 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: col,
                  textTransform: "uppercase", letterSpacing: ".06em" }}>{driver}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text,
                  fontVariantNumeric: "tabular-nums" }}>{stat.hit_rate}%</div>
                <div style={{ fontSize: 10, color: T.faint }}>
                  {stat.calls} call{stat.calls !== 1 ? "s" : ""}
                  {stat.brier_mean != null ? ` · Brier ${stat.brier_mean.toFixed(3)}` : ""}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Call table */}
      {ledger.calls.length === 0 ? (
        <div style={{ fontSize: 13, color: T.sub, textAlign: "center", padding: "24px 0" }}>
          No scored calls yet. Start logging scenarios daily — the ledger compounds over time.
          <div style={{ fontSize: 11, color: T.faint, marginTop: 6 }}>
            Even six weeks of honest scored calls is a moat competitors can't replicate.
          </div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="cl-table">
            <thead>
              <tr style={{ color: T.faint, borderBottomColor: T.line }}>
                <th style={{ borderBottomColor: T.line }}>Date</th>
                <th style={{ borderBottomColor: T.line }}>Scenario</th>
                <th style={{ borderBottomColor: T.line }}>Driver</th>
                <th style={{ borderBottomColor: T.line }}>Prob</th>
                <th style={{ borderBottomColor: T.line }}>Predicted</th>
                <th style={{ borderBottomColor: T.line }}>Actual</th>
                <th style={{ borderBottomColor: T.line }}>Hit</th>
                <th style={{ borderBottomColor: T.line }}>Brier</th>
                <th style={{ borderBottomColor: T.line }}>R</th>
              </tr>
            </thead>
            <tbody>
              {ledger.calls.map(call => {
                const col = DRIVER_COLOR[call.driver] || T.sub;
                const hitCol = call.branch_hit ? T.up : T.down;
                const date = new Date(call.resolved_at).toLocaleDateString("en-US",
                  { month: "short", day: "numeric" });
                return (
                  <tr key={call.scenario_id} style={{ color: T.text, borderBottomColor: T.line }}>
                    <td style={{ color: T.faint, whiteSpace: "nowrap" }}>{date}</td>
                    <td style={{ maxWidth: 180 }}>
                      <div style={{ fontWeight: 600 }}>{call.label}</div>
                      {call.if_then && (
                        <div style={{ fontSize: 10.5, color: T.faint, marginTop: 2 }}>
                          {call.if_then}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="cl-chip" style={{ background: col + "20", color: col }}>
                        {call.driver}
                      </span>
                    </td>
                    <td className="cl-brier">{Math.round(call.probability * 100)}%</td>
                    <td className="cl-brier" style={{ color: T.sub }}>
                      {call.predicted_lo != null && call.predicted_hi != null
                        ? `${call.predicted_lo >= 0 ? "+" : ""}${call.predicted_lo.toFixed(1)} / ${call.predicted_hi >= 0 ? "+" : ""}${call.predicted_hi.toFixed(1)}%`
                        : "—"}
                    </td>
                    <td className="cl-brier" style={{ color: call.actual_move >= 0 ? T.up : T.down }}>
                      {call.actual_move >= 0 ? "+" : ""}{call.actual_move.toFixed(2)}%
                    </td>
                    <td>
                      <span className="cl-hit" style={{ color: hitCol }}>
                        {call.branch_hit ? "✓" : "✗"}
                      </span>
                    </td>
                    <td className="cl-brier">{call.brier_score.toFixed(4)}</td>
                    <td className="cl-brier" style={{ color: (call.r_multiple ?? 0) >= 0 ? T.up : T.down }}>
                      {call.r_multiple != null
                        ? `${call.r_multiple >= 0 ? "+" : ""}${call.r_multiple.toFixed(1)}R`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ fontSize: 10.5, color: T.faint, marginTop: 12 }}>{ledger.note}</div>
    </div>
  );
}
