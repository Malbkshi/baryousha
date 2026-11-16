import { describe, expect, it } from "vitest";
import { mergeSettings } from "./settings";
import { DEFAULT_SETTINGS } from "./types";

describe("mergeSettings", () => {
  it("applies a full, valid update", () => {
    const next = { acceptingOrders: false, openTime: "08:00", closeTime: "23:00", prayerBreaks: false, closeAfterAdhan: 5, maghribBefore: 15, minutesAfter: 30 };
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
    [{ closeAfterAdhan: -1 }],
    [{ closeAfterAdhan: 61 }],
    [{ maghribBefore: -1 }],
    [{ maghribBefore: 61 }],
    [{ maghribBefore: 1.5 }],
    [{ minutesAfter: 121 }],
    [{ minutesAfter: 2.5 }],
  ])("refuses %j", (body) => {
    expect(mergeSettings(DEFAULT_SETTINGS, body)).toBeNull();
  });

  it("refuses a closure that would end before it starts", () => {
    expect(mergeSettings(DEFAULT_SETTINGS, { closeAfterAdhan: 40, minutesAfter: 40 })).toBeNull();
    expect(mergeSettings(DEFAULT_SETTINGS, { closeAfterAdhan: 30, minutesAfter: 20 })).toBeNull();
    expect(mergeSettings(DEFAULT_SETTINGS, { closeAfterAdhan: 0, minutesAfter: 1 })).not.toBeNull();
  });

  it("refuses something that is not an object", () => {
    expect(mergeSettings(DEFAULT_SETTINGS, null)).toBeNull();
    expect(mergeSettings(DEFAULT_SETTINGS, "x")).toBeNull();
  });

  it("ignores fields it does not know", () => {
    expect(mergeSettings(DEFAULT_SETTINGS, { colour: "red" })).toEqual(DEFAULT_SETTINGS);
  });
});
