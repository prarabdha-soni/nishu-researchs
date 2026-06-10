// Domain types for the Nishu web cockpit.
// These mirror api/models.py exactly — keep them in sync when changing the Python model.

export type Driver = "macro" | "mechanical" | "positioning" | "geopolitical" | "narrative";
export type Stance = "Bullish" | "Neutral" | "Bearish";
export type ActionKind = "buy" | "wait" | "trim" | "cut";

export interface PricePoint { date: string; price: number }

export interface TradeEvent {
  id: string; date: string; spot: number; label: string;
  driver: Driver; move: number; summary: string; acted: string; detail: string;
}

export interface Catalyst { date: string; label: string; tag: Driver; id?: string }

export interface Signal { key: string; state: string; aligned: boolean }

export interface ScenarioBranch {
  k: string; kind: ActionKind; act: string; move: string; note: string; prob?: number;
}

export interface Scenario {
  id: string; label: string; def: number; opts: ScenarioBranch[];
}

export interface LadderRung { px: number; size: number; tag: string }
export interface BookSlice   { k: string; w: number; key: string }

export interface ArmedOrder {
  id: string; primary?: boolean; act: string; kind: ActionKind;
  size: string; when: string; note: string;
}

export interface RiskRail { k: string; v: string; note: string; tone: string }

export interface QuoteLite { value: number; changePct: number }

export interface MarketSnapshot {
  asset: string; symbol: string; price: number; asOf: string;
  history: PricePoint[];
  changePct1d: number; high52: number; low52: number;
  dailyVolPct: number; annVolPct: number;
  ma50: number; ma200: number; momentumPct: number; drawdownPct: number;
  dxy?: QuoteLite; yield10y?: QuoteLite; usd_inr?: number; stale?: boolean;
}

export interface Decision {
  asOf: string; asset: string; stance: Stance; conviction: number;
  thesisLine: string; target: number; upsidePct: number;
  invalidation: number; dipLevel: number; buyZone: [number, number];
  rewardRisk: number; trimZone: number;
  signals: Signal[]; confidencePct: number;
  scenarios: Scenario[]; ladder: LadderRung[]; book: BookSlice[];
  playbook: ArmedOrder[]; rails: RiskRail[];
  nextCatalyst?: Catalyst; avgEntry: number;
}

export interface Outcome {
  catalystId: string; date: string; dominantDriver: Driver;
  predictedMovePct: number; realisedMovePct: number; errorPct: number;
  branchHit?: string; correct: boolean; resultR?: number;
}

export interface LearnEntry { date: string; ver: string; title: string; note: string; delta: string }

export interface TrackRecord {
  hit: number; trades: number; avgR: number;
  best: { label: string; r: string };
  worst: { label: string; r: string };
}

export interface StateVersion { conviction: string; weights: string; calibration: string }

export interface DriverParam { weight: number; halfLifeSessions: number }

export interface AgentStatePublic {
  journal: LearnEntry[]; track: TrackRecord;
  weights: Record<Driver, DriverParam>; version: StateVersion;
}

export interface AgentSnapshot {
  asOf: string; market: MarketSnapshot; decision: Decision;
  state: AgentStatePublic; catalysts: Catalyst[];
  events: TradeEvent[]; source: "live" | "seed";
}

// ── Seed / fallback data ──────────────────────────────────────────────────────
// The cockpit renders these when the API is unreachable.

export const priceSeries: PricePoint[] = [
  { date: "2024-06-10", price: 2309.3 },
  { date: "2024-06-11", price: 2314.1 },
  { date: "2024-06-12", price: 2338.7 },
  { date: "2024-06-13", price: 2317.7 },
  { date: "2024-06-14", price: 2331.4 },
  { date: "2024-06-17", price: 2320.2 },
  { date: "2024-06-18", price: 2330.4 },
  { date: "2024-06-20", price: 2354.0 },
  { date: "2024-06-21", price: 2331.2 },
  { date: "2024-06-24", price: 2332.9 },
  { date: "2024-06-25", price: 2333.0 },
  { date: "2024-06-26", price: 2314.4 },
  { date: "2024-06-27", price: 2329.0 },
  { date: "2024-06-28", price: 2338.3 },
  { date: "2024-07-01", price: 2329.7 },
  { date: "2024-07-02", price: 2334.6 },
  { date: "2024-07-03", price: 2361.6 },
  { date: "2024-07-05", price: 2388.5 },
  { date: "2024-07-08", price: 2383.8 },
  { date: "2024-07-09", price: 2363.7 },
  { date: "2024-07-10", price: 2377.0 },
  { date: "2024-07-11", price: 2416.7 },
  { date: "2024-07-12", price: 2414.0 },
  { date: "2024-07-15", price: 2436.0 },
  { date: "2024-07-16", price: 2462.4 },
  { date: "2024-07-17", price: 2473.1 },
  { date: "2024-07-18", price: 2466.0 },
  { date: "2024-07-19", price: 2419.2 },
  { date: "2024-07-22", price: 2402.1 },
  { date: "2024-07-23", price: 2404.6 },
  { date: "2024-07-24", price: 2421.0 },
  { date: "2024-07-25", price: 2365.5 },
  { date: "2024-07-26", price: 2386.9 },
  { date: "2024-07-29", price: 2377.3 },
  { date: "2024-07-30", price: 2409.3 },
  { date: "2024-07-31", price: 2447.6 },
  { date: "2024-08-01", price: 2455.1 },
  { date: "2024-08-02", price: 2477.0 },
  { date: "2024-08-05", price: 2449.8 },
  { date: "2024-08-06", price: 2421.8 },
  { date: "2024-08-07", price: 2401.0 },
  { date: "2024-08-08", price: 2422.8 },
  { date: "2024-08-09", price: 2432.1 },
  { date: "2024-08-12", price: 2469.8 },
  { date: "2024-08-13", price: 2470.0 },
  { date: "2024-08-14", price: 2472.1 },
  { date: "2024-08-15", price: 2467.7 },
  { date: "2024-08-16", price: 2508.0 },
  { date: "2024-08-19", price: 2508.5 },
  { date: "2024-08-20", price: 2527.3 },
  { date: "2024-08-21", price: 2515.4 },
  { date: "2024-08-22", price: 2504.1 },
  { date: "2024-08-23", price: 2508.4 },
  { date: "2024-08-26", price: 2523.1 },
  { date: "2024-08-27", price: 2523.1 },
  { date: "2024-08-28", price: 2501.0 },
  { date: "2024-08-29", price: 2525.7 },
  { date: "2024-08-30", price: 2525.4 },
  { date: "2024-09-03", price: 2501.8 },
  { date: "2024-09-04", price: 2493.4 },
  { date: "2024-09-05", price: 2513.3 },
  { date: "2024-09-06", price: 2517.9 },
  { date: "2024-09-09", price: 2504.7 },
  { date: "2024-09-10", price: 2512.3 },
  { date: "2024-09-11", price: 2525.8 },
  { date: "2024-09-12", price: 2557.0 },
  { date: "2024-09-13", price: 2581.8 },
  { date: "2024-09-16", price: 2580.4 },
  { date: "2024-09-17", price: 2581.8 },
  { date: "2024-09-18", price: 2570.7 },
  { date: "2024-09-19", price: 2588.0 },
  { date: "2024-09-20", price: 2621.8 },
  { date: "2024-09-23", price: 2626.5 },
  { date: "2024-09-24", price: 2662.3 },
  { date: "2024-09-25", price: 2664.2 },
  { date: "2024-09-26", price: 2669.9 },
  { date: "2024-09-27", price: 2672.1 },
  { date: "2024-09-30", price: 2662.1 },
  { date: "2024-10-01", price: 2670.9 },
  { date: "2024-10-02", price: 2657.2 },
  { date: "2024-10-03", price: 2657.1 },
  { date: "2024-10-04", price: 2667.0 },
  { date: "2024-10-07", price: 2657.4 },
  { date: "2024-10-08", price: 2639.0 },
  { date: "2024-10-09", price: 2607.7 },
  { date: "2024-10-10", price: 2628.3 },
  { date: "2024-10-11", price: 2658.1 },
  { date: "2024-10-14", price: 2655.3 },
  { date: "2024-10-15", price: 2661.4 },
  { date: "2024-10-16", price: 2674.0 },
  { date: "2024-10-17", price: 2691.7 },
  { date: "2024-10-18", price: 2719.6 },
  { date: "2024-10-21", price: 2738.4 },
  { date: "2024-10-22", price: 2746.0 },
  { date: "2024-10-23", price: 2742.5 },
  { date: "2024-10-24", price: 2736.1 },
  { date: "2024-10-25", price: 2742.4 },
  { date: "2024-10-28", price: 2742.9 },
  { date: "2024-10-29", price: 2768.4 },
  { date: "2024-10-30", price: 2789.0 },
  { date: "2024-10-31", price: 2787.5 },
  { date: "2024-11-01", price: 2756.0 },
  { date: "2024-11-04", price: 2737.1 },
  { date: "2024-11-05", price: 2743.9 },
  { date: "2024-11-06", price: 2734.5 },
  { date: "2024-11-07", price: 2699.1 },
  { date: "2024-11-08", price: 2694.6 },
  { date: "2024-11-11", price: 2671.7 },
  { date: "2024-11-12", price: 2605.5 },
  { date: "2024-11-13", price: 2611.8 },
  { date: "2024-11-14", price: 2576.2 },
  { date: "2024-11-15", price: 2565.7 },
  { date: "2024-11-18", price: 2610.7 },
  { date: "2024-11-19", price: 2627.7 },
  { date: "2024-11-20", price: 2648.2 },
  { date: "2024-11-21", price: 2672.1 },
  { date: "2024-11-22", price: 2710.5 },
  { date: "2024-11-25", price: 2689.4 },
  { date: "2024-11-26", price: 2625.6 },
  { date: "2024-11-27", price: 2657.9 },
  { date: "2024-11-29", price: 2664.3 },
  { date: "2024-12-02", price: 2649.8 },
  { date: "2024-12-03", price: 2654.7 },
  { date: "2024-12-04", price: 2658.3 },
  { date: "2024-12-05", price: 2655.0 },
  { date: "2024-12-06", price: 2643.1 },
  { date: "2024-12-09", price: 2677.1 },
  { date: "2024-12-10", price: 2698.2 },
  { date: "2024-12-11", price: 2733.8 },
  { date: "2024-12-12", price: 2725.1 },
  { date: "2024-12-13", price: 2689.3 },
  { date: "2024-12-16", price: 2663.3 },
  { date: "2024-12-17", price: 2652.3 },
  { date: "2024-12-18", price: 2647.1 },
  { date: "2024-12-19", price: 2610.3 },
  { date: "2024-12-20", price: 2631.6 },
  { date: "2024-12-23", price: 2627.7 },
  { date: "2024-12-24", price: 2620.0 },
  { date: "2024-12-26", price: 2638.8 },
  { date: "2024-12-27", price: 2617.7 },
  { date: "2024-12-30", price: 2626.9 },
  { date: "2024-12-31", price: 2629.2 },
  { date: "2025-01-02", price: 2663.1 },
  { date: "2025-01-03", price: 2658.7 },
  { date: "2025-01-06", price: 2647.0 },
  { date: "2025-01-07", price: 2657.5 },
  { date: "2025-01-08", price: 2676.9 },
  { date: "2025-01-09", price: 2686.3 },
  { date: "2025-01-10", price: 2720.1 },
  { date: "2025-01-13", price: 2711.2 },
  { date: "2025-01-14", price: 2688.3 },
  { date: "2025-01-15", price: 2712.5 },
  { date: "2025-01-16", price: 2749.8 },
  { date: "2025-01-17", price: 2751.6 },
  { date: "2025-01-21", price: 2755.0 },
  { date: "2025-01-22", price: 2768.8 },
  { date: "2025-01-23", price: 2765.0 },
  { date: "2025-01-24", price: 2792.0 },
  { date: "2025-01-27", price: 2762.2 },
  { date: "2025-01-28", price: 2766.8 },
  { date: "2025-01-29", price: 2769.1 },
  { date: "2025-01-30", price: 2829.5 },
  { date: "2025-01-31", price: 2838.0 },
  { date: "2025-02-03", price: 2848.4 },
  { date: "2025-02-04", price: 2853.3 },
  { date: "2025-02-05", price: 2880.5 },
  { date: "2025-02-06", price: 2871.7 },
  { date: "2025-02-07", price: 2889.5 },
  { date: "2025-02-10", price: 2916.1 },
  { date: "2025-02-11", price: 2945.4 },
  { date: "2025-02-12", price: 2912.3 },
  { date: "2025-02-13", price: 2937.7 },
  { date: "2025-02-14", price: 2944.4 },
  { date: "2025-02-18", price: 2936.4 },
  { date: "2025-02-19", price: 2946.0 },
  { date: "2025-02-20", price: 2955.8 },
  { date: "2025-02-21", price: 2940.0 },
  { date: "2025-02-24", price: 2957.9 },
  { date: "2025-02-25", price: 2943.2 },
  { date: "2025-02-26", price: 2917.0 },
  { date: "2025-02-27", price: 2922.8 },
  { date: "2025-02-28", price: 2877.1 },
  { date: "2025-03-03", price: 2891.8 },
  { date: "2025-03-04", price: 2927.9 },
  { date: "2025-03-05", price: 2922.0 },
  { date: "2025-03-06", price: 2918.6 },
  { date: "2025-03-07", price: 2927.3 },
  { date: "2025-03-10", price: 2915.1 },
  { date: "2025-03-11", price: 2916.7 },
  { date: "2025-03-12", price: 2939.1 },
  { date: "2025-03-13", price: 2988.0 },
  { date: "2025-03-14", price: 3004.8 },
  { date: "2025-03-17", price: 3001.5 },
  { date: "2025-03-18", price: 3039.2 },
  { date: "2025-03-19", price: 3050.9 },
  { date: "2025-03-20", price: 3047.3 },
  { date: "2025-03-21", price: 3037.5 },
  { date: "2025-03-24", price: 3024.3 },
  { date: "2025-03-25", price: 3028.8 },
  { date: "2025-03-26", price: 3033.2 },
  { date: "2025-03-27", price: 3065.0 },
  { date: "2025-03-28", price: 3094.9 },
  { date: "2025-03-31", price: 3132.5 },
  { date: "2025-04-01", price: 3149.5 },
  { date: "2025-04-02", price: 3168.6 },
  { date: "2025-04-03", price: 3166.9 },
  { date: "2025-04-04", price: 3127.7 },
  { date: "2025-04-07", price: 3050.8 },
  { date: "2025-04-08", price: 3014.5 },
  { date: "2025-04-09", price: 3090.4 },
  { date: "2025-04-10", price: 3167.0 },
  { date: "2025-04-11", price: 3235.0 },
  { date: "2025-04-14", price: 3228.8 },
  { date: "2025-04-15", price: 3218.7 },
  { date: "2025-04-16", price: 3334.9 },
  { date: "2025-04-17", price: 3345.0 },
  { date: "2025-04-21", price: 3418.5 },
  { date: "2025-04-22", price: 3485.6 },
  { date: "2025-04-23", price: 3370.3 },
  { date: "2025-04-24", price: 3353.9 },
  { date: "2025-04-25", price: 3355.5 },
  { date: "2025-04-28", price: 3332.5 },
  { date: "2025-04-29", price: 3340.0 },
  { date: "2025-04-30", price: 3318.7 },
  { date: "2025-05-01", price: 3275.0 },
  { date: "2025-05-02", price: 3257.0 },
  { date: "2025-05-05", price: 3315.7 },
  { date: "2025-05-06", price: 3430.9 },
  { date: "2025-05-07", price: 3418.7 },
  { date: "2025-05-08", price: 3390.0 },
  { date: "2025-05-09", price: 3335.5 },
  { date: "2025-05-12", price: 3300.7 },
  { date: "2025-05-13", price: 3251.4 },
  { date: "2025-05-14", price: 3233.0 },
  { date: "2025-05-15", price: 3228.1 },
  { date: "2025-05-16", price: 3228.1 },
  { date: "2025-05-19", price: 3241.0 },
  { date: "2025-05-20", price: 3293.2 },
  { date: "2025-05-21", price: 3317.5 },
  { date: "2025-05-22", price: 3328.0 },
  { date: "2025-05-23", price: 3363.6 },
  { date: "2025-05-27", price: 3341.0 },
  { date: "2025-05-28", price: 3293.6 },
  { date: "2025-05-29", price: 3328.8 },
  { date: "2025-05-30", price: 3318.0 },
  { date: "2025-06-02", price: 3380.8 },
  { date: "2025-06-03", price: 3390.0 },
  { date: "2025-06-04", price: 3380.0 },
  { date: "2025-06-05", price: 3400.0 },
  { date: "2025-06-06", price: 3364.3 },
  { date: "2025-06-09", price: 3334.6 },
  { date: "2025-06-10", price: 3344.3 },
  { date: "2025-06-11", price: 3356.0 },
  { date: "2025-06-12", price: 3395.9 },
  { date: "2025-06-13", price: 3444.0 },
  { date: "2025-06-16", price: 3442.0 },
  { date: "2025-06-17", price: 3398.3 },
  { date: "2025-06-18", price: 3391.9 },
  { date: "2025-06-20", price: 3372.9 },
  { date: "2025-06-23", price: 3387.9 },
  { date: "2025-06-24", price: 3358.0 },
  { date: "2025-06-25", price: 3331.2 },
  { date: "2025-06-26", price: 3333.5 },
  { date: "2025-06-27", price: 3318.7 },
  { date: "2025-06-30", price: 3306.9 },
  { date: "2025-07-01", price: 3354.1 },
  { date: "2025-07-02", price: 3357.5 },
  { date: "2025-07-03", price: 3362.0 },
  { date: "2025-07-04", price: 3342.0 },
  { date: "2025-07-07", price: 3333.3 },
  { date: "2025-07-08", price: 3334.5 },
  { date: "2025-07-09", price: 3314.0 },
  { date: "2025-07-10", price: 3330.5 },
  { date: "2025-07-11", price: 3370.0 },
  { date: "2025-07-14", price: 3375.5 },
  { date: "2025-07-15", price: 3341.0 },
  { date: "2025-07-16", price: 3352.9 },
  { date: "2025-07-17", price: 3340.8 },
  { date: "2025-07-18", price: 3353.0 },
  { date: "2025-07-21", price: 3411.7 },
  { date: "2025-07-22", price: 3441.0 },
  { date: "2025-07-23", price: 3433.9 },
  { date: "2025-07-24", price: 3371.0 },
  { date: "2025-07-25", price: 3345.0 },
  { date: "2025-07-28", price: 3326.8 },
  { date: "2025-07-29", price: 3323.4 },
  { date: "2025-07-30", price: 3331.8 },
  { date: "2025-07-31", price: 3312.0 },
  { date: "2025-08-01", price: 3360.6 },
  { date: "2025-08-04", price: 3386.5 },
  { date: "2025-08-05", price: 3387.2 },
  { date: "2025-08-06", price: 3383.3 },
  { date: "2025-08-07", price: 3422.9 },
  { date: "2025-08-08", price: 3477.0 },
  { date: "2025-08-11", price: 3383.9 },
  { date: "2025-08-12", price: 3356.2 },
  { date: "2025-08-13", price: 3363.4 },
  { date: "2025-08-14", price: 3356.0 },
  { date: "2025-08-15", price: 3346.8 },
  { date: "2025-08-18", price: 3347.8 },
  { date: "2025-08-19", price: 3343.5 },
  { date: "2025-08-20", price: 3343.5 },
  { date: "2025-08-21", price: 3349.4 },
  { date: "2025-08-22", price: 3377.7 },
  { date: "2025-08-25", price: 3378.0 },
  { date: "2025-08-26", price: 3396.5 },
  { date: "2025-08-27", price: 3404.6 },
  { date: "2025-08-28", price: 3434.6 },
  { date: "2025-08-29", price: 3475.6 },
  { date: "2025-09-02", price: 3559.2 },
  { date: "2025-09-03", price: 3593.7 },
  { date: "2025-09-04", price: 3573.6 },
  { date: "2025-09-05", price: 3613.2 },
  { date: "2025-09-08", price: 3641.0 },
  { date: "2025-09-09", price: 3670.4 },
  { date: "2025-09-10", price: 3655.4 },
  { date: "2025-09-11", price: 3636.9 },
  { date: "2025-09-12", price: 3656.8 },
  { date: "2025-09-15", price: 3686.4 },
  { date: "2025-09-16", price: 3698.6 },
  { date: "2025-09-17", price: 3685.2 },
  { date: "2025-09-18", price: 3667.4 },
  { date: "2025-09-19", price: 3685.9 },
  { date: "2025-09-22", price: 3748.2 },
  { date: "2025-09-23", price: 3786.0 },
  { date: "2025-09-24", price: 3772.5 },
  { date: "2025-09-25", price: 3756.0 },
  { date: "2025-09-26", price: 3775.3 },
  { date: "2025-09-29", price: 3827.6 },
  { date: "2025-09-30", price: 3865.5 },
  { date: "2025-10-01", price: 3891.9 },
  { date: "2025-10-02", price: 3888.6 },
  { date: "2025-10-03", price: 3886.8 },
  { date: "2025-10-06", price: 3960.0 },
  { date: "2025-10-07", price: 3981.5 },
  { date: "2025-10-08", price: 4049.2 },
  { date: "2025-10-09", price: 4046.2 },
  { date: "2025-10-10", price: 4012.0 },
  { date: "2025-10-13", price: 4111.0 },
  { date: "2025-10-14", price: 4160.1 },
  { date: "2025-10-15", price: 4210.6 },
  { date: "2025-10-16", price: 4307.0 },
  { date: "2025-10-17", price: 4358.0 },
  { date: "2025-10-20", price: 4356.6 },
  { date: "2025-10-21", price: 4332.7 },
  { date: "2025-10-22", price: 4148.5 },
  { date: "2025-10-23", price: 4136.8 },
  { date: "2025-10-24", price: 4120.6 },
  { date: "2025-10-27", price: 4078.6 },
  { date: "2025-10-28", price: 3966.2 },
  { date: "2025-10-29", price: 3983.7 },
  { date: "2025-10-30", price: 4027.2 },
  { date: "2025-10-31", price: 4034.5 },
  { date: "2025-11-03", price: 4020.0 },
  { date: "2025-11-04", price: 3995.4 },
  { date: "2025-11-05", price: 3983.5 },
  { date: "2025-11-06", price: 4007.5 },
  { date: "2025-11-07", price: 3999.4 },
  { date: "2025-11-10", price: 4111.8 },
  { date: "2025-11-11", price: 4140.1 },
  { date: "2025-11-12", price: 4204.4 },
  { date: "2025-11-13", price: 4228.7 },
  { date: "2025-11-14", price: 4197.9 },
  { date: "2025-11-17", price: 4099.5 },
  { date: "2025-11-18", price: 4063.4 },
  { date: "2025-11-19", price: 4122.7 },
  { date: "2025-11-20", price: 4090.4 },
  { date: "2025-11-21", price: 4085.2 },
  { date: "2025-11-24", price: 4091.9 },
  { date: "2025-11-25", price: 4139.2 },
  { date: "2025-11-26", price: 4171.0 },
  { date: "2025-11-28", price: 4223.9 },
  { date: "2025-12-01", price: 4262.1 },
  { date: "2025-12-02", price: 4230.5 },
  { date: "2025-12-03", price: 4234.1 },
  { date: "2025-12-04", price: 4211.8 },
  { date: "2025-12-05", price: 4255.7 },
  { date: "2025-12-08", price: 4215.8 },
  { date: "2025-12-09", price: 4219.7 },
  { date: "2025-12-10", price: 4234.5 },
  { date: "2025-12-11", price: 4286.9 },
  { date: "2025-12-12", price: 4355.0 },
  { date: "2025-12-15", price: 4349.2 },
  { date: "2025-12-16", price: 4321.4 },
  { date: "2025-12-17", price: 4351.4 },
  { date: "2025-12-18", price: 4348.1 },
  { date: "2025-12-19", price: 4361.4 },
  { date: "2025-12-22", price: 4447.6 },
  { date: "2025-12-23", price: 4503.8 },
  { date: "2025-12-24", price: 4503.4 },
  { date: "2025-12-26", price: 4556.3 },
  { date: "2025-12-29", price: 4379.0 },
  { date: "2025-12-30", price: 4403.6 },
  { date: "2025-12-31", price: 4363.8 },
  { date: "2026-01-02", price: 4350.6 },
  { date: "2026-01-05", price: 4443.5 },
  { date: "2026-01-06", price: 4482.2 },
  { date: "2026-01-07", price: 4450.0 },
  { date: "2026-01-08", price: 4461.3 },
  { date: "2026-01-09", price: 4490.3 },
  { date: "2026-01-12", price: 4620.0 },
  { date: "2026-01-13", price: 4617.1 },
  { date: "2026-01-14", price: 4635.0 },
  { date: "2026-01-15", price: 4616.3 },
  { date: "2026-01-16", price: 4608.0 },
  { date: "2026-01-20", price: 4764.0 },
  { date: "2026-01-21", price: 4872.3 },
  { date: "2026-01-22", price: 4908.8 },
  { date: "2026-01-23", price: 4976.2 },
  { date: "2026-01-26", price: 5095.6 },
  { date: "2026-01-27", price: 5079.9 },
  { date: "2026-01-28", price: 5301.6 },
  { date: "2026-01-29", price: 5586.2 },
  { date: "2026-01-30", price: 5440.5 },
  { date: "2026-02-02", price: 4855.8 },
  { date: "2026-02-03", price: 4984.6 },
  { date: "2026-02-04", price: 5082.2 },
  { date: "2026-02-05", price: 5012.3 },
  { date: "2026-02-06", price: 4958.5 },
  { date: "2026-02-09", price: 5065.7 },
  { date: "2026-02-10", price: 5029.0 },
  { date: "2026-02-11", price: 5111.3 },
  { date: "2026-02-12", price: 5078.1 },
  { date: "2026-02-13", price: 5043.9 },
  { date: "2026-02-17", price: 5020.0 },
  { date: "2026-02-18", price: 4987.0 },
  { date: "2026-02-19", price: 5014.7 },
  { date: "2026-02-20", price: 5072.7 },
  { date: "2026-02-23", price: 5211.6 },
  { date: "2026-02-24", price: 5159.0 },
  { date: "2026-02-25", price: 5206.4 },
  { date: "2026-02-26", price: 5199.2 },
  { date: "2026-02-27", price: 5280.0 },
  { date: "2026-03-02", price: 5405.0 },
  { date: "2026-03-03", price: 5303.8 },
  { date: "2026-03-04", price: 5180.2 },
  { date: "2026-03-05", price: 5169.5 },
  { date: "2026-03-06", price: 5146.1 },
  { date: "2026-03-09", price: 5160.6 },
  { date: "2026-03-10", price: 5229.7 },
  { date: "2026-03-11", price: 5191.3 },
  { date: "2026-03-12", price: 5137.2 },
  { date: "2026-03-13", price: 5117.0 },
  { date: "2026-03-16", price: 5010.6 },
  { date: "2026-03-17", price: 5017.6 },
  { date: "2026-03-18", price: 4949.6 },
  { date: "2026-03-19", price: 4830.3 },
  { date: "2026-03-20", price: 4686.9 },
  { date: "2026-03-23", price: 4480.4 },
  { date: "2026-03-24", price: 4399.3 },
  { date: "2026-03-25", price: 4551.9 },
  { date: "2026-03-26", price: 4443.1 },
  { date: "2026-03-27", price: 4492.0 },
  { date: "2026-03-30", price: 4579.1 },
  { date: "2026-03-31", price: 4684.1 },
  { date: "2026-04-01", price: 4789.1 },
  { date: "2026-04-02", price: 4784.4 },
  { date: "2026-04-06", price: 4689.6 },
  { date: "2026-04-07", price: 4676.3 },
  { date: "2026-04-08", price: 4851.0 },
  { date: "2026-04-09", price: 4799.1 },
  { date: "2026-04-10", price: 4791.0 },
  { date: "2026-04-13", price: 4742.4 },
  { date: "2026-04-14", price: 4841.6 },
  { date: "2026-04-15", price: 4843.6 },
  { date: "2026-04-16", price: 4810.9 },
  { date: "2026-04-17", price: 4879.7 },
  { date: "2026-04-20", price: 4811.0 },
  { date: "2026-04-21", price: 4705.0 },
  { date: "2026-04-22", price: 4754.2 },
  { date: "2026-04-23", price: 4732.4 },
  { date: "2026-04-24", price: 4722.3 },
  { date: "2026-04-27", price: 4711.1 },
  { date: "2026-04-28", price: 4680.9 },
  { date: "2026-04-29", price: 4601.6 },
  { date: "2026-04-30", price: 4636.7 },
  { date: "2026-05-01", price: 4636.7 },
  { date: "2026-05-04", price: 4581.2 },
  { date: "2026-05-05", price: 4580.5 },
  { date: "2026-05-06", price: 4712.6 },
  { date: "2026-05-07", price: 4736.2 },
  { date: "2026-05-08", price: 4724.8 },
  { date: "2026-05-11", price: 4729.5 },
  { date: "2026-05-12", price: 4765.2 },
  { date: "2026-05-13", price: 4722.7 },
  { date: "2026-05-14", price: 4678.1 },
  { date: "2026-05-15", price: 4615.2 },
  { date: "2026-05-18", price: 4570.3 },
  { date: "2026-05-19", price: 4552.6 },
  { date: "2026-05-20", price: 4531.3 },
  { date: "2026-05-21", price: 4539.8 },
  { date: "2026-05-22", price: 4530.3 },
  { date: "2026-05-26", price: 4572.8 },
  { date: "2026-05-27", price: 4447.5 },
  { date: "2026-05-28", price: 4512.6 },
  { date: "2026-05-29", price: 4591.8 },
  { date: "2026-06-01", price: 4541.4 },
  { date: "2026-06-02", price: 4529.5 },
  { date: "2026-06-03", price: 4471.7 },
  { date: "2026-06-04", price: 4509.9 },
  { date: "2026-06-05", price: 4472.3 },
  { date: "2026-06-08", price: 4340.9 },
  { date: "2026-06-09", price: 4344.5 },
  { date: "2026-06-10", price: 4281.1 },
];

export const events: TradeEvent[] = [
  { id: "warsh",   date: "2026-01-29", spot: 5586, label: "Warsh named Fed Chair",     driver: "narrative",    move: -8.7,  summary: "A hawkish surprise markets read as removing the 'Fed put.' Gold cratered from cycle ATH ~$5,586 to $4,713 the next session.", acted: "Bought the panic",     detail: "Scaled in at $5,100 and $4,800 — fear, not fundamentals." },
  { id: "margin",  date: "2026-02-06", spot: 4959, label: "Margin-call cascade",        driver: "mechanical",   move: -3.6,  summary: "CME margin hike into the selloff forced liquidations — best entry of the cycle.",                                acted: "Added at the low",     detail: "$4,951 — best entry of the cycle." },
  { id: "hormuz",  date: "2026-02-27", spot: 5280, label: "Strait of Hormuz crisis",    driver: "geopolitical", move:  7.5,  summary: "US–Iran escalation triggers safe-haven + inflation-hedge bid.",     acted: "Held core",            detail: "Didn't chase the spike." },
  { id: "cpi_mar", date: "2026-03-13", spot: 5117, label: "March CPI 3.3% (hot)",       driver: "macro",        move:  4.1,  summary: "Stagflation hedge wins — Fed seen as trapped.",                     acted: "Held",                 detail: "Stagflation hedge intact." },
  { id: "cpi_apr", date: "2026-04-15", spot: 4844, label: "April CPI 3.8% shock",       driver: "macro",        move: -6.2,  summary: "Hike-odds repriced hard — metals crushed.",                         acted: "Bought the flush",     detail: "Re-loaded at $4,800." },
  { id: "nfp_may", date: "2026-06-05", spot: 4472, label: "May NFP 172k vs 85k",         driver: "macro",        move: -3.27, summary: "Jobs print doubled consensus; cut odds flipped.",                   acted: "Buying the dip now",   detail: "Laddering $4,250 / $4,100." },
];

export const catalysts: Catalyst[] = [
  { date: "2026-06-10", label: "May CPI release",     tag: "macro" },
  { date: "2026-06-17", label: "FOMC · Warsh's first",tag: "narrative" },
  { date: "2026-07-02", label: "June jobs · NFP",     tag: "macro" },
  { date: "2026-07-15", label: "June CPI",            tag: "macro" },
  { date: "2026-07-30", label: "FOMC decision",       tag: "narrative" },
];

const TODAY = new Date();
export const daysUntil = (d: string) =>
  Math.max(0, Math.round((new Date(d + "T00:00:00").getTime() - TODAY.getTime()) / 86400000));

export const DRIVER: Record<Driver, { label: string; cL: string; icon: string }> = {
  macro:        { label: "Macro",        cL: "#3E80AA", icon: "Activity" },
  mechanical:   { label: "Mechanical",   cL: "#6E5DB8", icon: "Layers" },
  positioning:  { label: "Positioning",  cL: "#B07F24", icon: "Gauge" },
  geopolitical: { label: "Geopolitical", cL: "#C2563B", icon: "Globe" },
  narrative:    { label: "Narrative",    cL: "#B14A7E", icon: "Message" },
};

export const STANCE: Record<Stance, { label: string; col: string; txt: string }> = {
  Bullish: { label: "Structurally Bullish",   col: "up",   txt: "upText" },
  Neutral: { label: "Neutral · Range-bound",  col: "gold", txt: "goldText" },
  Bearish: { label: "Defensive · Bearish",    col: "down", txt: "down" },
};

export const mFmt = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const dDay = (d: string) => {
  const diff = Math.round((new Date(d + "T00:00:00").getTime() - TODAY.getTime()) / 86400000);
  if (diff === 0) return "· today";
  if (diff > 0)  return `· ${diff}d`;
  return `· ${Math.abs(diff)}d ago`;
};

export const TRACK: TrackRecord = {
  hit: 68, trades: 41, avgR: 1.8,
  best:  { label: "Bought the Feb cascade",    r: "+4.6R" },
  worst: { label: "Early on the Apr CPI add",  r: "−1.2R" },
};

export const LEARN: LearnEntry[] = [
  { date: "Jun 2",  ver: "conviction v3.4",      title: "Down-weighted lone narrative signals", note: "Warsh call: predicted −4%, realised −8.7%. Cascade risk premium added.", delta: "narrative −18%" },
  { date: "Mar 15", ver: "signal-weights v3.3",  title: "Raised positioning to primary trigger",  note: "Crowded-short unwinds explained 3 of the last 4 squeezes.",               delta: "positioning +12%" },
  { date: "Mar 3",  ver: "signal-weights v3.2",  title: "Shortened geopolitical half-life",       note: "Hormuz premium decayed in ~6 sessions, not 12.",                          delta: "geo decay 2×" },
];

export const EVIDENCE: Signal[] = [
  { key: "DXY momentum",    state: "stalling",  aligned: true  },
  { key: "Real yields (10Y)", state: "easing",   aligned: true  },
  { key: "Trend vs 200DMA",  state: "above",     aligned: true  },
  { key: "1-mo momentum",    state: "positive",  aligned: true  },
];

export const SCN: Scenario[] = [
  {
    id: "cpi_jun", label: "May CPI release", def: 2,
    opts: [
      { k: "Soft",    kind: "buy",  act: "ADD",     move: "+0.8 to +2.5%", note: "Cut-path revives; crowded shorts squeeze off the lows." },
      { k: "In-line", kind: "wait", act: "WAIT",    move: "-0.6 to +0.6%", note: "Noise. Range-bound; positioning unchanged." },
      { k: "Hot",     kind: "buy",  act: "BUY DIP", move: "-2.2 to -0.8%", note: "Flush toward $4,100 — exactly the dip the ladder wants." },
    ],
  },
];

export const REASONING: string[] = [
  "Scanning CFTC positioning data — net longs near 3-month lows.",
  "DXY momentum stalling near 100; structurally bullish for gold.",
  "Real yields: 10Y at 4.53%, elevated but range-bound.",
  "May CPI due Jun 10 — the next market-moving catalyst.",
  "Scenario tree: Hot CPI = flush toward $4,100 (buy the dip).",
  "Conviction 72 — structural bid from EM central banks intact.",
];

export const tweaks = {
  stance:     "Bullish" as Stance,
  conviction: 72,
  target:     4800,
  dip:        4100,
  invalidation: 3900,
  trimZone:   4800,
  addSize:    25,
  book:       { core: 55, powder: 35, hedge: 10 },
};

export const fmt  = (n: number) => Math.round(n).toLocaleString("en-US");
export const fmt2 = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const daysUntilFrom = (d: string, now: Date) =>
  Math.max(0, Math.round((new Date(d + "T00:00:00").getTime() - now.getTime()) / 86400000));

export const thesis = {
  stance: "Structurally Bullish",
  conviction: 72,
  target: 4800,
  line: "Central banks are buying gold faster than mines can produce it. Nishu treats every macro-driven dip as an accumulation window — not a top.",
};

export const computeMarketStats = (history: PricePoint[]) => {
  const prices = history.map(p => p.price).filter(p => p > 0);
  const n = prices.length;
  const price = n ? prices[n - 1] : 0;
  const prev  = n > 1 ? prices[n - 2] : price;
  const rets  = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
  const mean  = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
  const m = mean(rets);
  const dailyVol = Math.sqrt(mean(rets.map(r => (r - m) ** 2))) * 100;
  const sma = (n2: number) => mean(prices.slice(Math.max(0, prices.length - n2)));
  const high = Math.max(...prices);
  const ref  = prices[Math.max(0, n - 22)] ?? price;
  return {
    price, changePct1d: prev ? (price / prev - 1) * 100 : 0,
    high52: high, low52: Math.min(...prices),
    dailyVolPct: dailyVol, annVolPct: dailyVol * Math.sqrt(252),
    ma50: sma(50), ma200: sma(200),
    momentumPct: ref ? (price / ref - 1) * 100 : 0,
    drawdownPct: high ? (price / high - 1) * 100 : 0,
  };
};
