/**
 * Provenance badge — wraps any number that came from the data store.
 * Click opens the source URL in a new tab. Hover shows source + asof.
 * Every figure on screen that touches a DataPoint must use this.
 */
import type { Theme } from "../theme";

interface DataRef {
  id:         string;
  series?:    string;
  value:      number;
  unit:       string;
  source:     string;
  source_url: string;
  asof:       string;
}

interface Props {
  T:        Theme & { accent: string };
  data:     DataRef;
  format?:  (v: number) => string;
  inline?:  boolean;
}

const STYLE = `
.prov-wrap{position:relative;display:inline-flex;align-items:baseline;gap:3px}
.prov-val{font-variant-numeric:tabular-nums;cursor:pointer;border-bottom:1px dotted currentColor;
  text-decoration:none;transition:opacity .1s}
.prov-val:hover{opacity:.75}
.prov-tooltip{position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);
  z-index:200;min-width:220px;max-width:300px;
  background:#1a1916;color:#f0ede4;border-radius:8px;padding:9px 12px;
  font:11px/1.5 ui-sans-serif,system-ui,sans-serif;white-space:normal;
  box-shadow:0 4px 20px rgba(0,0,0,.4);pointer-events:none;
  opacity:0;transition:opacity .15s}
.prov-wrap:hover .prov-tooltip{opacity:1;pointer-events:auto}
.prov-tooltip a{color:#c4a96d;text-decoration:underline;word-break:break-all}
.prov-source-chip{display:inline-block;margin-top:5px;font-size:10px;
  background:rgba(196,169,109,.15);color:#c4a96d;border-radius:4px;padding:1px 6px}
`;

export default function Provenance({ data, format, inline = false }: Props) {
  const display = format ? format(data.value) : data.value.toLocaleString("en-US");
  const asofStr = new Date(data.asof).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <>
      <style>{STYLE}</style>
      <span className="prov-wrap" style={inline ? { display: "inline-flex" } : {}}>
        <a
          className="prov-val"
          href={data.source_url}
          target="_blank"
          rel="noopener noreferrer"
          title={`Source: ${data.source}`}
          style={{ color: "inherit" }}
        >
          {display}
        </a>
        <div className="prov-tooltip">
          {data.series && <div style={{ fontWeight: 600, marginBottom: 3 }}>{data.series}</div>}
          <div>{display} {data.unit}</div>
          <div style={{ color: "rgba(240,237,228,.55)", fontSize: 10 }}>as of {asofStr}</div>
          <a href={data.source_url} target="_blank" rel="noopener noreferrer">
            → {data.source}
          </a>
          <div className="prov-source-chip">sourced · verified</div>
        </div>
      </span>
    </>
  );
}
