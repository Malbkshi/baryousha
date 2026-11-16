import type { PrayerSlot } from "./prayer";

/** What GET /api/ordering returns. */
export type OrderingInfo = {
  state: "open" | "paused" | "closed" | "prayer" | "unavailable";
  /** The prayer the café is closed for, when state is "prayer". */
  label: string | null;
  reopensAt: string | null;
  openTime: string;
  closeTime: string;
  allDay: boolean;
  prayerBreaks: boolean;
  closeAfterAdhan: number;
  maghribBefore: number;
  minutesAfter: number;
  prayers: PrayerSlot[];
  slots: string[];
};
