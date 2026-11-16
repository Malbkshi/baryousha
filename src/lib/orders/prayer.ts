import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from "adhan";
import type { Settings } from "./types";

export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

/** One prayer on one day, with the café's closure around it. Times are ISO instants. */
export type PrayerSlot = {
  prayer: PrayerName;
  label: string;
  at: string;
  /** When the café closes for it; null when prayer breaks are off. */
  from: string | null;
  /** When the café opens again; null when prayer breaks are off. */
  until: string | null;
};

// The café, in Tripoli. Times are computed here, offline, for every day.
const TRIPOLI = new Coordinates(32.8872, 13.1913);

// Egyptian General Authority of Survey angles (Fajr 19.5°, Isha 17.5°),
// the method in common use in Libya, with the standard Asr shadow (Maliki).
function parameters() {
  const params = CalculationMethod.Egyptian();
  params.madhab = Madhab.Shafi;
  return params;
}

const LABEL: Record<PrayerName, string> = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

const ORDER: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const calendar = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Tripoli",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The date on the café's calendar at `now`, shifted by whole days. */
function tripoliDay(now: Date, offsetDays: number): Date {
  const parts = calendar.formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  // adhan reads the year, month and day through the local getters, so build
  // the day with the local constructor whatever the server's time zone is.
  return new Date(get("year"), get("month") - 1, get("day") + offsetDays);
}

function prayersOn(settings: Settings, day: Date): PrayerSlot[] {
  const times = new PrayerTimes(TRIPOLI, day, parameters());
  const isFriday = day.getDay() === 5;
  const minute = 60_000;

  return ORDER.map((prayer) => {
    const at = times[prayer];
    return {
      prayer,
      label: prayer === "dhuhr" && isFriday ? "الجمعة" : LABEL[prayer],
      at: at.toISOString(),
      from: settings.prayerBreaks
        ? new Date(at.getTime() - settings.minutesBefore * minute).toISOString()
        : null,
      until: settings.prayerBreaks
        ? new Date(at.getTime() + settings.minutesAfter * minute).toISOString()
        : null,
    };
  });
}

/** The five prayers of the Tripoli day that contains `now`. */
export function todaysPrayers(settings: Settings, now: Date): PrayerSlot[] {
  return prayersOn(settings, tripoliDay(now, 0));
}

/** The prayer closure `now` falls in, or null when the café is not closed for prayer. */
export function currentBreak(settings: Settings, now: Date): PrayerSlot | null {
  if (!settings.prayerBreaks) return null;
  const t = now.getTime();
  // Yesterday and tomorrow too, in case a closure ever runs across midnight.
  for (const offset of [-1, 0, 1]) {
    for (const slot of prayersOn(settings, tripoliDay(now, offset))) {
      if (t >= new Date(slot.from!).getTime() && t < new Date(slot.until!).getTime()) {
        return slot;
      }
    }
  }
  return null;
}
