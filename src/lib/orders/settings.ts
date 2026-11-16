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
  if ("minutesBefore" in sent) {
    if (!minutesIn(sent.minutesBefore, PRAYER_MINUTES_LIMIT.before)) return null;
    next.minutesBefore = sent.minutesBefore as number;
  }
  if ("minutesAfter" in sent) {
    if (!minutesIn(sent.minutesAfter, PRAYER_MINUTES_LIMIT.after)) return null;
    next.minutesAfter = sent.minutesAfter as number;
  }
  return next;
}
