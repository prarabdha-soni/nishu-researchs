import React from "react";

interface SProps {
  size?: number;
  children: React.ReactNode;
  fill?: string;
  sw?: number;
  style?: React.CSSProperties;
  className?: string;
}

const S = ({ size = 16, children, fill = "none", sw = 1.7, style, className }: SProps) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke="currentColor" strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", ...style }}
    className={className}
  >{children}</svg>
);

type IconProps = Omit<SProps, "children">;

export const Activity = (p: IconProps) => <S {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></S>;
export const Layers   = (p: IconProps) => <S {...p}><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></S>;
export const Gauge    = (p: IconProps) => <S {...p}><path d="M12 14l4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></S>;
export const Globe    = (p: IconProps) => <S {...p}><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></S>;
export const Message  = (p: IconProps) => <S {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></S>;
export const ArrowUpRight   = (p: IconProps) => <S {...p}><path d="M7 17 17 7" /><path d="M8 7h9v9" /></S>;
export const ArrowDownRight = (p: IconProps) => <S {...p}><path d="M7 7l10 10" /><path d="M17 8v9H8" /></S>;
export const Minus    = (p: IconProps) => <S {...p}><path d="M5 12h14" /></S>;
export const Calendar = (p: IconProps) => <S {...p}><rect x="3" y="4" width="18" height="18" rx="2.5" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M12 14v3l2 1" /></S>;
export const Zap      = (p: IconProps) => <S {...p} fill="currentColor" sw={0}><path d="M13 2 4 13h6l-1 9 9-11h-6l1-9z" /></S>;
export const Spark    = (p: IconProps) => <S {...p} fill="currentColor" sw={0}><path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9L12 2.5z" /></S>;
export const Sun      = (p: IconProps) => <S {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></S>;
export const Moon     = (p: IconProps) => <S {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" /></S>;
export const Target   = (p: IconProps) => <S {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /></S>;
export const Bank     = (p: IconProps) => <S {...p}><path d="M3 21h18" /><path d="M4 10h16" /><path d="M5 6.5 12 3l7 3.5" /><path d="M6 10v8M10 10v8M14 10v8M18 10v8" /></S>;
export const News     = (p: IconProps) => <S {...p}><path d="M4 5h13a2 2 0 0 1 2 2v11a1.5 1.5 0 0 0 3 0V9" /><path d="M4 5a1.5 1.5 0 0 0-1.5 1.5V19a2 2 0 0 0 2 2h13" /><path d="M7 9h7M7 13h7M7 17h4" /></S>;
export const Plus     = (p: IconProps) => <S {...p}><path d="M12 5v14M5 12h14" /></S>;
export const Scissors = (p: IconProps) => <S {...p}><circle cx="6" cy="6" r="2.6" /><circle cx="6" cy="18" r="2.6" /><path d="M20 4 8.5 15.5M14.5 14.5 20 20M8.5 8.5 12 12" /></S>;
export const Clock    = (p: IconProps) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></S>;
export const Loop     = (p: IconProps) => <S {...p}><path d="M21 3v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 9" /><path d="M3 21v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 15" /></S>;

export const ICON_MAP: Record<string, React.FC<IconProps>> = {
  Activity, Layers, Gauge, Globe, Message,
  ArrowUpRight, ArrowDownRight, Minus, Calendar, Zap, Spark, Sun, Moon,
  Target, Bank, News, Plus, Scissors, Clock, Loop,
};
