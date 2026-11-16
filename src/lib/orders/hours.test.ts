import { describe, expect, it } from "vitest";
import { checkPickupTime, isOpen, pickupSlots, tripoliMinutes } from "./hours";
import { todaysPrayers } from "./prayer";
import { DEFAULT_SETTINGS, type Settings } from "./types";

// Day hours with no prayer breaks: the rules for opening hours on their own.
const DAY: Settings = { ...DEFAULT_SETTINGS, openTime: "08:00", closeTime: "23:00", prayerBreaks: false };
const ALL_DAY: Settings = { ...DEFAULT_SETTINGS, openTime: "00:00", closeTime: "00:00", prayerBreaks: false };
const OVERNIGHT: Settings = { ...DEFAULT_SETTINGS, openTime: "18:00", closeTime: "02:00", prayerBreaks: false };

// 10:00 UTC is 12:00 in Tripoli (UTC+2, no daylight saving).
const noon = new Date("2026-11-15T10:00:00Z");
const afterMidnight = new Date("2026-11-15T22:30:00Z"); // 00:30 Tripoli

describe("tripoliMinutes", () => {
  it("reads the clock in Tripoli, not UTC", () => {
    expect(tripoliMinutes(noon)).toBe(720);
    expect(tripoliMinutes(afterMidnight)).toBe(30);
  });
});

describe("isOpen", () => {
  it("is open inside working hours", () => {
    expect(isOpen(DAY, noon)).toBe(true);
  });
  it("is closed outside them", () => {
    expect(isOpen(DAY, afterMidnight)).toBe(false);
    expect(isOpen(DAY, new Date("2026-11-15T05:59:00Z"))).toBe(false);
    expect(isOpen(DAY, new Date("2026-11-15T21:00:00Z"))).toBe(false);
  });
});

describe("checkPickupTime", () => {
  it("needs ten minutes of notice", () => {
    expect(checkPickupTime("12:05", DAY, noon)).toBe("too-soon");
    expect(checkPickupTime("12:10", DAY, noon)).toBe("ok");
  });
  it("refuses a time in the past today", () => {
    expect(checkPickupTime("09:00", DAY, noon)).toBe("too-soon");
  });
  it("refuses a time after closing", () => {
    expect(checkPickupTime("23:30", DAY, noon)).toBe("closed");
  });
  it("accepts closing time itself", () => {
    expect(checkPickupTime("23:00", DAY, noon)).toBe("ok");
  });
  it.each(["25:00", "1230", "12:60", "", "ab:cd"])("rejects malformed %s", (t) => {
    expect(checkPickupTime(t, DAY, noon)).toBe("invalid");
  });
});

describe("pickupSlots", () => {
  it("offers quarter hours from ten minutes ahead until closing", () => {
    const slots = pickupSlots(DAY, noon);
    expect(slots[0]).toBe("12:15");
    expect(slots[1]).toBe("12:30");
    expect(slots.at(-1)).toBe("23:00");
  });
  it("offers nothing when closed", () => {
    expect(pickupSlots(DAY, afterMidnight)).toEqual([]);
  });
});

describe("open all day", () => {
  it("treats the same opening and closing time as 24 hours", () => {
    expect(isOpen(ALL_DAY, afterMidnight)).toBe(true);
    expect(isOpen(ALL_DAY, noon)).toBe(true);
  });

  it("is the default", () => {
    expect(DEFAULT_SETTINGS.openTime).toBe(DEFAULT_SETTINGS.closeTime);
  });

  it("offers pickup until the end of the day", () => {
    expect(pickupSlots(ALL_DAY, noon).at(-1)).toBe("23:45");
    expect(checkPickupTime("23:45", ALL_DAY, noon)).toBe("ok");
  });
});

describe("open overnight", () => {
  it("is open after the evening opening and before the early closing", () => {
    expect(isOpen(OVERNIGHT, new Date("2026-11-15T17:00:00Z"))).toBe(true); // 19:00
    expect(isOpen(OVERNIGHT, afterMidnight)).toBe(true); // 00:30
  });

  it("is closed in the day", () => {
    expect(isOpen(OVERNIGHT, noon)).toBe(false);
  });
});

describe("prayer breaks and pickup", () => {
  const settings: Settings = { ...ALL_DAY, prayerBreaks: true, closeAfterAdhan: 10, maghribBefore: 10, minutesAfter: 40 };
  const dhuhr = todaysPrayers(settings, noon)[1];
  const minutes = (iso: string) => tripoliMinutes(new Date(iso));
  const at = (total: number) =>
    `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

  it("refuses a pickup time inside a prayer closure", () => {
    expect(checkPickupTime(at(minutes(dhuhr.from!)), settings, noon)).toBe("prayer");
    expect(checkPickupTime(at(minutes(dhuhr.until!) - 1), settings, noon)).toBe("prayer");
  });

  it("accepts a pickup time at the adhan itself, before the closure starts", () => {
    expect(checkPickupTime(at(minutes(dhuhr.at)), settings, noon)).toBe("ok");
  });

  it("accepts a pickup time once the closure is over", () => {
    expect(checkPickupTime(at(minutes(dhuhr.until!)), settings, noon)).toBe("ok");
  });

  it("leaves closure times out of the pickup list", () => {
    const slots = pickupSlots(settings, noon);
    const from = minutes(dhuhr.from!);
    const until = minutes(dhuhr.until!);
    for (const slot of slots) {
      const t = Number(slot.slice(0, 2)) * 60 + Number(slot.slice(3));
      expect(t >= from && t < until).toBe(false);
    }
    expect(slots.length).toBeGreaterThan(0);
  });

  it("offers nothing while the café is closed for prayer", () => {
    expect(pickupSlots(settings, new Date(dhuhr.from!))).toEqual([]);
  });
});
