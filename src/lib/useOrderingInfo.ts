"use client";

import { useCallback, useState } from "react";
import type { OrderingInfo } from "@/lib/orders/ordering-info";
import { usePoke } from "@/lib/realtime/usePoke";

/** The café's opening state and today's prayer closures, refreshed every minute. */
export function useOrderingInfo(pollMs = 60_000) {
  const [info, setInfo] = useState<OrderingInfo | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/ordering", { cache: "no-store" });
      if (response.ok) setInfo((await response.json()) as OrderingInfo);
    } catch {
      // Keep the last known state.
    }
  }, []);

  usePoke([], refresh, pollMs, { immediate: true });
  return { info, refresh };
}
