import React, { useState, useRef, useCallback, useEffect } from "react";

const STYLE = `
.twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
  max-height:calc(100vh - 32px);display:flex;flex-direction:column;
  background:rgba(250,249,247,.78);color:#29261b;
  -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
  border:.5px solid rgba(255,255,255,.6);border-radius:14px;
  box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
  font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
.twk-hd{display:flex;align-items:center;justify-content:space-between;
  padding:10px 8px 10px 14px;cursor:move;user-select:none}
.twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
.twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
  width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
.twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
.twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
  overflow-y:auto;overflow-x:hidden;min-height:0;
  scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
.twk-row{display:flex;flex-direction:column;gap:5px}
.twk-lbl{display:flex;justify-content:space-between;align-items:baseline;color:rgba(41,38,27,.72)}
.twk-lbl>span:first-child{font-weight:500}
.twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}
.twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
  color:rgba(41,38,27,.45);padding:10px 0 0}
.twk-sect:first-child{padding-top:0}
.twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
  border-radius:999px;background:rgba(0,0,0,.12);outline:none}
.twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
  width:14px;height:14px;border-radius:50%;background:#fff;
  border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
.twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
  background:rgba(0,0,0,.06);user-select:none}
.twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
  background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
  transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
.twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
  background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
  border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2}
.twk-chips{display:flex;gap:6px}
.twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
  padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
  box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);transition:transform .12s}
.twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),0 2px 6px rgba(0,0,0,.15)}
`;

export function useTweaks<T extends Record<string, unknown>>(defaults: T): [T, (key: keyof T, val: T[keyof T]) => void] {
  const [values, setValues] = useState<T>(defaults);
  const setTweak = useCallback((key: keyof T, val: T[keyof T]) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);
  return [values, setTweak];
}

interface PanelProps { title?: string; children: React.ReactNode; }

export function TweaksPanel({ title = "Tweaks", children }: PanelProps) {
  const [open, setOpen] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 16, y: 16 });
  const PAD = 16;

  const clampToViewport = useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const pw = panel.offsetWidth, ph = panel.offsetHeight;
    const maxRight  = Math.max(PAD, window.innerWidth  - pw - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - ph - PAD);
    offsetRef.current = {
      x: Math.min(maxRight,  Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    };
    panel.style.right  = offsetRef.current.x + "px";
    panel.style.bottom = offsetRef.current.y + "px";
  }, []);

  useEffect(() => {
    if (!open) return;
    clampToViewport();
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const t = e?.data?.type;
      if (t === "__activate_edit_mode") setOpen(true);
      else if (t === "__deactivate_edit_mode") setOpen(false);
    };
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const onDragStart = (e: React.MouseEvent) => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startRight  = window.innerWidth  - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev: MouseEvent) => {
      offsetRef.current = { x: startRight - (ev.clientX - sx), y: startBottom - (ev.clientY - sy) };
      clampToViewport();
    };
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  if (!open) return null;
  return (
    <>
      <style>{STYLE}</style>
      <div ref={dragRef} className="twk-panel" style={{ right: PAD, bottom: PAD }}>
        <div className="twk-hd" onMouseDown={onDragStart}>
          <b>{title}</b>
          <button className="twk-x" onClick={() => { setOpen(false); window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*"); }}>✕</button>
        </div>
        <div className="twk-body">{children}</div>
      </div>
    </>
  );
}

export function TweakSection({ label }: { label: string }) {
  return <div className="twk-sect">{label}</div>;
}

export function TweakSlider({ label, value, min = 0, max = 100, step = 1, unit = "", onChange }: {
  label: string; value: number; min?: number; max?: number; step?: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <div className="twk-row">
      <div className="twk-lbl"><span>{label}</span><span className="twk-val">{value}{unit}</span></div>
      <input type="range" className="twk-slider" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export function TweakRadio({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const n = options.length;
  const idx = Math.max(0, options.indexOf(value));

  const segAt = (clientX: number) => {
    const r = trackRef.current!.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor(((clientX - r.left - 2) / inner) * n);
    return options[Math.max(0, Math.min(n - 1, i))];
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const v0 = segAt(e.clientX);
    if (v0 !== value) onChange(v0);
    const move = (ev: PointerEvent) => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== value) onChange(v);
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className="twk-row">
      <div className="twk-lbl"><span>{label}</span></div>
      <div ref={trackRef} className="twk-seg" onPointerDown={onPointerDown}>
        <div className="twk-seg-thumb" style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`, width: `calc((100% - 4px) / ${n})` }} />
        {options.map((o) => (
          <button key={o} type="button">{o}</button>
        ))}
      </div>
    </div>
  );
}

export function TweakColor({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div className="twk-row">
      <div className="twk-lbl"><span>{label}</span></div>
      <div className="twk-chips">
        {options.map((o) => (
          <button key={o} type="button" className="twk-chip" data-on={o.toLowerCase() === value.toLowerCase() ? "1" : "0"}
            style={{ background: o }} onClick={() => onChange(o)} />
        ))}
      </div>
    </div>
  );
}
