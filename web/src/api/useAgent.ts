import { useEffect, useState } from "react";
import type { AgentSnapshot } from "@nishu/shared";
import { fetchSnapshot, fetchPrice, type LivePrice } from "./client";

export interface AgentData {
  snapshot: AgentSnapshot | null;
  livePrice: LivePrice | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches the agent snapshot once, then polls the live price. Everything is
 * optional: when the API is down, consumers fall back to the seed data, so the
 * cockpit always renders.
 */
export function useAgent(pricePollMs = 15_000): AgentData {
  const [snapshot, setSnapshot] = useState<AgentSnapshot | null>(null);
  const [livePrice, setLivePrice] = useState<LivePrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetchSnapshot(ac.signal)
      .then((s) => {
        setSnapshot(s);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!ac.signal.aborted) setError(String(e));
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, []);

  useEffect(() => {
    let stopped = false;
    const ac = new AbortController();
    const tick = () => {
      fetchPrice(ac.signal)
        .then((p) => {
          if (!stopped) setLivePrice(p);
        })
        .catch(() => {
          /* keep last known / seed */
        });
    };
    tick();
    const id = setInterval(tick, pricePollMs);
    return () => {
      stopped = true;
      ac.abort();
      clearInterval(id);
    };
  }, [pricePollMs]);

  return { snapshot, livePrice, loading, error };
}
