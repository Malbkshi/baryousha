import { describe, expect, it } from "vitest";
import { checkPickupTime, isOpen, pickupSlots, tripoliMinutes } from "./hours";
import { DEFAULT_SETTINGS } from "./types";

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
    expect(isOpen(DEFAULT_SETTINGS, noon)).toBe(true);
  });
  it("is closed outside them", () => {
    expect(isOpen(DEFAULT_SETTINGS, afterMidnight)).toBe(false);
    expect(isOpen(DEFAULT_SETTINGS, new Date("2026-11-15T05:59:00Z"))).toBe(false);
    expect(isOpen(DEFAULT_SETTINGS, new Date("2026-11-15T21:00:00Z"))).toBe(false);
  });
});

describe("checkPickupTime", () => {
  it("needs ten minutes of notice", () => {
    expect(checkPickupTime("12:05", DEFAULT_SETTINGS, noon)).toBe("too-soon");
    expect(checkPickupTime("12:10", DEFAULT_SETTINGS, noon)).toBe("ok");
  });
  it("refuses a time in the past today", () => {
    expect(checkPickupTime("09:00", DEFAULT_SETTINGS, noon)).toBe("too-soon");
  });
  it("refuses a time after closing", () => {
    expect(checkPickupTime("23:30", DEFAULT_SETTINGS, noon)).toBe("closed");
  });
  it("accepts closing time itself", () => {
    expect(checkPickupTime("23:00", DEFAULT_SETTINGS, noon)).toBe("ok");
  });
  it.each(["25:00", "1230", "12:60", "", "ab:cd"])("rejects malformed %s", (t) => {
    expect(checkPickupTime(t, DEFAULT_SETTINGS, noon)).toBe("invalid");
  });
});

describe("pickupSlots", () => {
  it("offers quarter hours from ten minutes ahead until closing", () => {
    const slots = pickupSlots(DEFAULT_SETTINGS, noon);
    expect(slots[0]).toBe("12:15");
    expect(slots[1]).toBe("12:30");
    expect(slots.at(-1)).toBe("23:00");
  });
  it("offers nothing when closed", () => {
    expect(pickupSlots(DEFAULT_SETTINGS, afterMidnight)).toEqual([]);
  });
});
