import type { AgentSnapshot } from "@nishu/shared";

const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const url = (path: string) => `${BASE}${path}`;

export interface LivePrice {
  price: number;
  changePct1d: number;
  asOf: string;
  source: "live" | "seed";
}

export async function fetchSnapshot(signal?: AbortSignal): Promise<AgentSnapshot> {
  const r = await fetch(url("/api/snapshot"), { signal });
  if (!r.ok) throw new Error(`snapshot ${r.status}`);
  return r.json() as Promise<AgentSnapshot>;
}

export async function fetchPrice(signal?: AbortSignal): Promise<LivePrice> {
  const r = await fetch(url("/api/price"), { signal });
  if (!r.ok) throw new Error(`price ${r.status}`);
  return r.json() as Promise<LivePrice>;
}
