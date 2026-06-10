import React, { useRef, useState, useLayoutEffect } from "react";
import type { Theme } from "../theme";
import type { TradeEvent } from "../data";
import { mFmt, fmt } from "../data";

interface Props {
  data: { date: string; price: number }[];
  events: TradeEvent[];
  selId: string;
  onSelect: (id: string) => void;
  T: Theme & { accent: string };
  driverColor: (key: string) => string;
  monthTicks: string[];
  zone: [number, number];
}

export default function GoldChart({ data, events, selId, onSelect, T, driverColor, monthTicks, zone }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(760);
  const H = 318;
  const [hover, setHover] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setW(Math.max(260, Math.round(e.contentRect.width)));
    });
    ro.observe(el);
    setW(Math.max(260, Math.round(el.clientWidth)));
    return () => ro.disconnect();
  }, []);

  const padL = 6, padR = 14, padT = 16, padB = 28;
  const prices = data.map((d) => d.price);
  const yMin = Math.min(...prices, zone[0]) - 70;
  const yMax = Math.max(...prices) + 70;
  const n = data.length;

  const X = (i: number) => padL + (i * (w - padL - padR)) / (n - 1);
  const Y = (p: number) => padT + ((yMax - p) / (yMax - yMin)) * (H - padT - padB);

  const linePath = data.map((d, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(d.price).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${X(n - 1).toFixed(1)} ${H - padB} L${X(0).toFixed(1)} ${H - padB} Z`;

  const gridVals: number[] = [];
  const step = 200;
  const lo = Math.ceil(yMin / step) * step;
  for (let v = lo; v < yMax; v += step) gridVals.push(v);

  const idxByDate = (dt: string) => data.findIndex((d) => d.date === dt);

  const onMove = (e: React.MouseEvent) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let best = 0, bd = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(X(i) - x);
      if (d < bd) { bd = d; best = i; }
    }
    setHover(best);
  };

  const hv = hover != null ? data[hover] : null;
  const hvEvent = hv ? events.find((e) => e.date === hv.date) : null;

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <svg width={w} height={H} style={{ display: "block", overflow: "visible" }}
        onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="auGoldFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={T.gold} stopOpacity={0.22} />
            <stop offset="100%" stopColor={T.gold} stopOpacity={0.01} />
          </linearGradient>
        </defs>

        {gridVals.map((v) => (
          <g key={v}>
            <line x1={padL} x2={w - padR} y1={Y(v)} y2={Y(v)} stroke={T.line} strokeWidth="1" />
            <text x={w - padR} y={Y(v) - 5} textAnchor="end" fontSize="10.5"
              fontFamily="'JetBrains Mono',monospace" fill={T.faint}>
              {(v / 1000).toFixed(1)}k
            </text>
          </g>
        ))}

        <g>
          <rect x={padL} y={Y(zone[1])} width={w - padL - padR} height={Y(zone[0]) - Y(zone[1])}
            fill={T.up} opacity={0.10} />
          <line x1={padL} x2={w - padR} y1={Y(zone[1])} y2={Y(zone[1])} stroke={T.up} strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
          <line x1={padL} x2={w - padR} y1={Y(zone[0])} y2={Y(zone[0])} stroke={T.up} strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
          <text x={padL + 4} y={Y(zone[1]) + 13} fontSize="9.5" letterSpacing="1.1"
            fontFamily="'Hanken Grotesk',sans-serif" fontWeight="700" fill={T.up} opacity="0.92">
            NISHU BUY ZONE
          </text>
        </g>

        {(() => {
          // Thin month labels so they never overlap: keep a min pixel gap.
          // Scales down automatically on narrow / mobile widths.
          const minGap = 42;
          let lastX = -Infinity;
          return monthTicks.map((dt) => {
            const i = idxByDate(dt);
            if (i < 0) return null;
            const x = X(i);
            if (x - lastX < minGap) return null;
            lastX = x;
            return (
              <text key={dt} x={x} y={H - 8} textAnchor="middle" fontSize="10.5"
                fontFamily="'JetBrains Mono',monospace" fill={T.faint}>
                {mFmt(dt)}
              </text>
            );
          });
        })()}

        <path d={areaPath} fill="url(#auGoldFill)" />
        <path d={linePath} fill="none" stroke={T.gold} strokeWidth="2.1" />

        {hv && hover != null && (
          <g>
            <line x1={X(hover)} x2={X(hover)} y1={padT} y2={H - padB} stroke={T.line2} strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={X(hover)} cy={Y(hv.price)} r="4" fill={T.panel} stroke={T.goldLite} strokeWidth="2" />
          </g>
        )}

        {events.map((ev) => {
          const i = idxByDate(ev.date);
          if (i < 0) return null;
          const c = driverColor(ev.driver);
          const on = ev.id === selId;
          return (
            <g key={ev.id} style={{ cursor: "pointer" }} onClick={() => onSelect(ev.id)}>
              <circle cx={X(i)} cy={Y(ev.spot)} r="14" fill="transparent" />
              {on && <circle cx={X(i)} cy={Y(ev.spot)} r="11" fill={c} opacity="0.16" />}
              <circle cx={X(i)} cy={Y(ev.spot)} r={on ? 6 : 4.5} fill={T.panel} stroke={c} strokeWidth={on ? 2.4 : 1.8} />
              <circle cx={X(i)} cy={Y(ev.spot)} r={on ? 2.5 : 1.9} fill={c} />
            </g>
          );
        })}
      </svg>

      {hv && hover != null && (
        <div style={{
          position: "absolute", top: 6,
          left: Math.min(Math.max(X(hover) - 70, 0), w - 150),
          pointerEvents: "none", width: 150,
          background: T.tip, border: `1px solid ${T.line2}`, borderRadius: 11,
          padding: "9px 12px", boxShadow: T.shadow,
        }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontVariantNumeric: "tabular-nums", fontSize: 11, color: T.sub }}>
            {mFmt(hv.date)} {parseInt(hv.date.slice(8), 10)}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontVariantNumeric: "tabular-nums", fontSize: 17, color: T.goldText, fontWeight: 600 }}>
            ${fmt(hv.price)}
          </div>
          {hvEvent && (
            <div style={{ marginTop: 5, fontSize: 11.5, color: driverColor(hvEvent.driver), lineHeight: 1.3 }}>
              ● {hvEvent.label}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
