import { currentBreak } from "./prayer";
import { LIMITS, type Settings } from "./types";

const TIME_ZONE = "Africa/Tripoli";
const SLOT_MINUTES = 15;
const DAY_MINUTES = 24 * 60;

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

/** Open all day when the opening and closing times are the same. */
export function isAllDay(settings: Settings): boolean {
  return settings.openTime === settings.closeTime;
}

/**
 * Whether a minute of the day is inside opening hours. Handles all day
 * (open == close) and hours that run past midnight (close < open).
 * `closeIncluded` lets a pickup be booked for the closing minute itself.
 */
function withinHours(settings: Settings, minute: number, closeIncluded: boolean): boolean {
  const open = parseTime(settings.openTime) ?? 0;
  const close = parseTime(settings.closeTime) ?? 0;
  if (open === close) return true;
  const beforeClose = closeIncluded ? minute <= close : minute < close;
  return open < close ? minute >= open && beforeClose : minute >= open || beforeClose;
}

export function isOpen(settings: Settings, now: Date): boolean {
  return withinHours(settings, tripoliMinutes(now), false);
}

/** The instant of "HH:MM" today on the café's clock. */
function instantToday(minute: number, now: Date): Date {
  const start = now.getTime() - (now.getUTCSeconds() * 1000 + now.getUTCMilliseconds());
  return new Date(start + (minute - tripoliMinutes(now)) * 60_000);
}

export function checkPickupTime(
  time: string,
  settings: Settings,
  now: Date,
): "ok" | "invalid" | "closed" | "too-soon" | "prayer" {
  const wanted = parseTime(time);
  if (wanted === null) return "invalid";
  if (!withinHours(settings, wanted, true)) return "closed";
  if (wanted < tripoliMinutes(now) + LIMITS.minLeadMinutes) return "too-soon";
  if (currentBreak(settings, instantToday(wanted, now))) return "prayer";
  return "ok";
}

export type OrderingState = {
  state: "open" | "closed" | "prayer";
  /** The prayer the café is closed for, when state is "prayer". */
  label: string | null;
  /** When it opens again after a prayer closure. */
  reopensAt: string | null;
};

/** Whether orders can be taken right now, ignoring the café's pause switch. */
export function orderingState(settings: Settings, now: Date): OrderingState {
  if (!isOpen(settings, now)) return { state: "closed", label: null, reopensAt: null };
  const prayer = currentBreak(settings, now);
  if (prayer) return { state: "prayer", label: prayer.label, reopensAt: prayer.until };
  return { state: "open", label: null, reopensAt: null };
}

/** Quarter-hour pickup times still available today, skipping prayer closures. */
export function pickupSlots(settings: Settings, now: Date): string[] {
  if (orderingState(settings, now).state !== "open") return [];
  const earliest = tripoliMinutes(now) + LIMITS.minLeadMinutes;
  const first = Math.ceil(earliest / SLOT_MINUTES) * SLOT_MINUTES;
  const slots: string[] = [];
  for (let t = first; t < DAY_MINUTES; t += SLOT_MINUTES) {
    const time = formatMinutes(t);
    if (checkPickupTime(time, settings, now) === "ok") slots.push(time);
  }
  return slots;
}
