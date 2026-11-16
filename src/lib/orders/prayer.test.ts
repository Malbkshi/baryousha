import { describe, expect, it } from "vitest";
import { currentBreak, todaysPrayers } from "./prayer";
import { tripoliMinutes } from "./hours";
import { DEFAULT_SETTINGS, type Settings } from "./types";

const settings: Settings = { ...DEFAULT_SETTINGS, prayerBreaks: true, closeAfterAdhan: 10, maghribBefore: 10, minutesAfter: 40 };

// 12:00 Tripoli on a Sunday in November.
const noon = new Date("2026-11-15T10:00:00Z");
const clock = (iso: string) => {
  const m = tripoliMinutes(new Date(iso));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

describe("todaysPrayers", () => {
  it("lists the five prayers of the Tripoli day, in order", () => {
    const prayers = todaysPrayers(settings, noon);
    expect(prayers.map((p) => p.label)).toEqual(["الفجر", "الظهر", "العصر", "المغرب", "العشاء"]);
    const times = prayers.map((p) => new Date(p.at).getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it("puts dhuhr just before 1 pm in November, on Tripoli's clock", () => {
    // Tripoli sits at 13.2°E on UTC+2, so solar noon falls near 12:52 in mid-November.
    const dhuhr = todaysPrayers(settings, noon)[1];
    const at = clock(dhuhr.at);
    expect(at >= "12:45" && at <= "13:00").toBe(true);
  });

  it("puts dhuhr after 1 pm in summer", () => {
    const dhuhr = todaysPrayers(settings, new Date("2026-06-21T10:00:00Z"))[1];
    expect(clock(dhuhr.at) > "13:00" && clock(dhuhr.at) < "13:15").toBe(true);
  });

  it("uses the Tripoli date, not the UTC date, just after local midnight", () => {
    // 23:30 UTC on the 15th is 01:30 on the 16th in Tripoli.
    const lateUtc = todaysPrayers(settings, new Date("2026-11-15T23:30:00Z"));
    const nextDay = todaysPrayers(settings, new Date("2026-11-16T10:00:00Z"));
    expect(lateUtc.map((p) => p.at)).toEqual(nextDay.map((p) => p.at));
  });

  it("closes ten minutes after the adhan, until forty minutes after it", () => {
    for (const prayer of todaysPrayers(settings, noon).filter((p) => p.prayer !== "maghrib")) {
      const at = new Date(prayer.at).getTime();
      expect(new Date(prayer.from!).getTime()).toBe(at + 10 * 60_000);
      expect(new Date(prayer.until!).getTime()).toBe(at + 40 * 60_000);
    }
  });

  it("closes ten minutes before the adhan at maghrib", () => {
    const maghrib = todaysPrayers(settings, noon).find((p) => p.prayer === "maghrib")!;
    const at = new Date(maghrib.at).getTime();
    expect(new Date(maghrib.from!).getTime()).toBe(at - 10 * 60_000);
    expect(new Date(maghrib.until!).getTime()).toBe(at + 40 * 60_000);
  });

  it("follows the minutes set by the café", () => {
    const custom = { ...settings, closeAfterAdhan: 5, maghribBefore: 15, minutesAfter: 20 };
    const prayers = todaysPrayers(custom, noon);
    const fajr = prayers[0];
    const maghrib = prayers[3];
    expect(new Date(fajr.from!).getTime()).toBe(new Date(fajr.at).getTime() + 5 * 60_000);
    expect(new Date(fajr.until!).getTime()).toBe(new Date(fajr.at).getTime() + 20 * 60_000);
    expect(new Date(maghrib.from!).getTime()).toBe(new Date(maghrib.at).getTime() - 15 * 60_000);
  });

  it("still lists the times, without closures, when prayer breaks are off", () => {
    const prayers = todaysPrayers({ ...settings, prayerBreaks: false }, noon);
    expect(prayers).toHaveLength(5);
    expect(prayers.every((p) => p.from === null && p.until === null)).toBe(true);
  });

  it("calls Friday's noon prayer الجمعة", () => {
    const friday = new Date("2026-11-20T10:00:00Z");
    expect(todaysPrayers(settings, friday)[1].label).toBe("الجمعة");
  });
});

describe("currentBreak", () => {
  const dhuhr = todaysPrayers(settings, noon)[1];
  const at = new Date(dhuhr.at).getTime();
  const minute = 60_000;

  it("stays open at the adhan and for nine minutes after it", () => {
    expect(currentBreak(settings, new Date(at - 10 * minute))).toBeNull();
    expect(currentBreak(settings, new Date(at))).toBeNull();
    expect(currentBreak(settings, new Date(at + 9 * minute))).toBeNull();
  });

  it("is closed from ten minutes after the adhan", () => {
    expect(currentBreak(settings, new Date(at + 10 * minute))?.label).toBe("الظهر");
  });

  it("is already closed ten minutes before maghrib", () => {
    const maghrib = todaysPrayers(settings, noon)[3];
    const m = new Date(maghrib.at).getTime();
    expect(currentBreak(settings, new Date(m - 11 * minute))).toBeNull();
    expect(currentBreak(settings, new Date(m - 10 * minute))?.label).toBe("المغرب");
    expect(currentBreak(settings, new Date(m))?.label).toBe("المغرب");
  });

  it("is still closed thirty-nine minutes after", () => {
    expect(currentBreak(settings, new Date(at + 39 * minute))?.until).toBe(dhuhr.until);
  });

  it("opens again forty minutes after", () => {
    expect(currentBreak(settings, new Date(at + 40 * minute))).toBeNull();
  });

  it("never closes when prayer breaks are off", () => {
    expect(currentBreak({ ...settings, prayerBreaks: false }, new Date(at + 20 * minute))).toBeNull();
  });
});
