import { parseTime, tripoliMinutes } from "./hours";
import type { OrderStatus } from "./types";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "تم استلام طلبك",
  preparing: "قيد التجهيز",
  ready: "جاهز للاستلام",
  done: "تم التسليم",
  cancelled: "ملغي",
};

/** Short names for the dashboard columns and badges. */
export const STATUS_SHORT: Record<OrderStatus, string> = {
  new: "جديد",
  preparing: "قيد التجهيز",
  ready: "جاهز",
  done: "تم التسليم",
  cancelled: "ملغي",
};

function clockFromMinutes(total: number): string {
  const hour24 = Math.floor(total / 60) % 24;
  const minute = total % 60;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${hour24 < 12 ? "ص" : "م"}`;
}

/** "13:30" as "1:30 م". Returns the input unchanged if it is not a time. */
export function formatClock(time: string): string {
  const minutes = parseTime(time);
  return minutes === null ? time : clockFromMinutes(minutes);
}

/** An instant as the time on the café's clock, e.g. "1:30 م". */
export function formatInstant(iso: string): string {
  return clockFromMinutes(tripoliMinutes(new Date(iso)));
}

/** A number of minutes in Arabic: "دقيقة"، "دقيقتين"، "5 دقائق"، "40 دقيقة". */
export function minutesText(n: number): string {
  if (n === 1) return "دقيقة";
  if (n === 2) return "دقيقتين";
  if (n >= 3 && n <= 10) return `${n} دقائق`;
  return `${n} دقيقة`;
}
