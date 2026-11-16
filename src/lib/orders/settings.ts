import { parseTime } from "./hours";
import { PRAYER_MINUTES_LIMIT, type Settings } from "./types";

const minutesIn = (value: unknown, max: number) =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= max;

/**
 * `current` with the fields of `body` applied, or null when any field sent
 * is not valid. Fields not sent keep their current value.
 */
export function mergeSettings(current: Settings, body: unknown): Settings | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const sent = body as Record<string, unknown>;
  const next: Settings = { ...current };

  for (const key of ["acceptingOrders", "prayerBreaks"] as const) {
    if (key in sent) {
      if (typeof sent[key] !== "boolean") return null;
      next[key] = sent[key] as boolean;
    }
  }
  for (const key of ["openTime", "closeTime"] as const) {
    if (key in sent) {
      if (typeof sent[key] !== "string" || parseTime(sent[key] as string) === null) return null;
      next[key] = sent[key] as string;
    }
  }
  if ("closeAfterAdhan" in sent) {
    if (!minutesIn(sent.closeAfterAdhan, PRAYER_MINUTES_LIMIT.closeAfterAdhan)) return null;
    next.closeAfterAdhan = sent.closeAfterAdhan as number;
  }
  if ("maghribBefore" in sent) {
    if (!minutesIn(sent.maghribBefore, PRAYER_MINUTES_LIMIT.maghribBefore)) return null;
    next.maghribBefore = sent.maghribBefore as number;
  }
  if ("minutesAfter" in sent) {
    if (!minutesIn(sent.minutesAfter, PRAYER_MINUTES_LIMIT.after)) return null;
    next.minutesAfter = sent.minutesAfter as number;
  }
  // The café must reopen after it closes, or the closure is empty.
  if (next.minutesAfter <= next.closeAfterAdhan) return null;
  return next;
}
