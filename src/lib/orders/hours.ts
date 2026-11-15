import { LIMITS, type Settings } from "./types";

const TIME_ZONE = "Africa/Tripoli";
const SLOT_MINUTES = 15;

const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Minutes since midnight on the café's clock. */
export function tripoliMinutes(now: Date): number {
  const parts = clock.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

/** "HH:MM" to minutes, or null when it is not a real time of day. */
export function parseTime(time: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export function formatMinutes(total: number): string {
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function bounds(settings: Settings): { open: number; close: number } {
  return {
    open: parseTime(settings.openTime) ?? 0,
    close: parseTime(settings.closeTime) ?? 24 * 60,
  };
}

export function isOpen(settings: Settings, now: Date): boolean {
  const { open, close } = bounds(settings);
  const current = tripoliMinutes(now);
  return current >= open && current < close;
}

export function checkPickupTime(
  time: string,
  settings: Settings,
  now: Date,
): "ok" | "invalid" | "closed" | "too-soon" {
  const wanted = parseTime(time);
  if (wanted === null) return "invalid";
  const { open, close } = bounds(settings);
  if (wanted < open || wanted > close) return "closed";
  if (wanted < tripoliMinutes(now) + LIMITS.minLeadMinutes) return "too-soon";
  return "ok";
}

/** Quarter-hour pickup times still available today. */
export function pickupSlots(settings: Settings, now: Date): string[] {
  if (!isOpen(settings, now)) return [];
  const { close } = bounds(settings);
  const earliest = tripoliMinutes(now) + LIMITS.minLeadMinutes;
  const first = Math.ceil(earliest / SLOT_MINUTES) * SLOT_MINUTES;
  const slots: string[] = [];
  for (let t = first; t <= close; t += SLOT_MINUTES) slots.push(formatMinutes(t));
  return slots;
}
