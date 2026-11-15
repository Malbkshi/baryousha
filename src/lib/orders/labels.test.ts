import { describe, expect, it } from "vitest";
import { formatClock, formatInstant } from "./labels";

describe("formatClock", () => {
  it.each([
    ["00:05", "12:05 ص"],
    ["08:00", "8:00 ص"],
    ["12:00", "12:00 م"],
    ["13:30", "1:30 م"],
    ["23:59", "11:59 م"],
  ])("shows %s as %s", (input, shown) => {
    expect(formatClock(input)).toBe(shown);
  });

  it("leaves a non-time alone", () => {
    expect(formatClock("soon")).toBe("soon");
  });
});

describe("formatInstant", () => {
  it("shows the time on the café's clock, two hours ahead of UTC", () => {
    expect(formatInstant("2026-11-15T10:10:00.000Z")).toBe("12:10 م");
  });
});
