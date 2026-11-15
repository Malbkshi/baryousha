"use client";

import { useEffect, useRef } from "react";
import { POKE_EVENT } from "./channels";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Calls `onPoke` whenever the page should refetch: on a live "changed"
 * broadcast when Supabase is configured, and on a timer regardless, so the
 * page stays correct if the live connection drops. `pollMs <= 0` turns it off.
 *
 * By default it rests while the tab is hidden and fires once when the tab
 * comes back. `background` keeps it going in a hidden tab, for the café's
 * order board, which has to chime even when another tab is in front.
 * `immediate` also fires once as soon as the page mounts.
 */
export function usePoke(
  channels: string[],
  onPoke: () => void,
  pollMs: number,
  { immediate = false, background = false }: { immediate?: boolean; background?: boolean } = {},
): void {
  const callback = useRef(onPoke);
  useEffect(() => {
    callback.current = onPoke;
  });

  const key = channels.join("|");

  useEffect(() => {
    if (pollMs <= 0) return;

    const fire = () => {
      if (background || document.visibilityState === "visible") callback.current();
    };

    if (immediate) callback.current();
    const timer = window.setInterval(fire, pollMs);
    document.addEventListener("visibilitychange", fire);

    let cancelled = false;
    let cleanupLive: (() => void) | undefined;

    if (SUPABASE_URL && SUPABASE_KEY && key) {
      import("@supabase/supabase-js")
        .then(({ createClient }) => {
          if (cancelled) return;
          const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const subscriptions = key.split("|").map((name) =>
            client.channel(name).on("broadcast", { event: POKE_EVENT }, fire).subscribe(),
          );
          cleanupLive = () => {
            for (const subscription of subscriptions) client.removeChannel(subscription);
          };
        })
        .catch(() => {
          // Polling carries on without the live connection.
        });
    }

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", fire);
      cleanupLive?.();
    };
  }, [key, pollMs, immediate, background]);
}
