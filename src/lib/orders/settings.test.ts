import { describe, expect, it } from "vitest";
import { mergeSettings } from "./settings";
import { DEFAULT_SETTINGS } from "./types";

describe("mergeSettings", () => {
  it("applies a full, valid update", () => {
    const next = { acceptingOrders: false, openTime: "08:00", closeTime: "23:00", prayerBreaks: false, minutesBefore: 5, minutesAfter: 30 };
    expect(mergeSettings(DEFAULT_SETTINGS, next)).toEqual(next);
  });

  it("keeps the current value of anything not sent", () => {
    expect(mergeSettings(DEFAULT_SETTINGS, { acceptingOrders: false })).toEqual({ ...DEFAULT_SETTINGS, acceptingOrders: false });
  });

  it("accepts 24 hours and hours past midnight", () => {
    expect(mergeSettings(DEFAULT_SETTINGS, { openTime: "00:00", closeTime: "00:00" })).not.toBeNull();
    expect(mergeSettings(DEFAULT_SETTINGS, { openTime: "18:00", closeTime: "02:00" })).not.toBeNull();
  });

  it.each([
    [{ openTime: "25:00" }],
    [{ closeTime: "8" }],
    [{ acceptingOrders: "yes" }],
    [{ prayerBreaks: 1 }],
    [{ minutesBefore: -1 }],
    [{ minutesBefore: 61 }],
    [{ minutesAfter: 121 }],
    [{ minutesAfter: 2.5 }],
  ])("refuses %j", (body) => {
    expect(mergeSettings(DEFAULT_SETTINGS, body)).toBeNull();
  });

  it("refuses something that is not an object", () => {
    expect(mergeSettings(DEFAULT_SETTINGS, null)).toBeNull();
    expect(mergeSettings(DEFAULT_SETTINGS, "x")).toBeNull();
  });

  it("ignores fields it does not know", () => {
    expect(mergeSettings(DEFAULT_SETTINGS, { colour: "red" })).toEqual(DEFAULT_SETTINGS);
  });
});
