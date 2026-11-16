import { describe, expect, it } from "vitest";
import { applyAction, type StaffAction } from "./status";
import type { OrderStatus } from "./types";

describe("applyAction", () => {
  it("walks an order forward one step at a time", () => {
    expect(applyAction("new", "accept")).toBe("preparing");
    expect(applyAction("preparing", "ready")).toBe("ready");
    expect(applyAction("ready", "done")).toBe("done");
  });

  it("allows cancelling until the order is handed over", () => {
    for (const s of ["new", "preparing", "ready"] as OrderStatus[]) {
      expect(applyAction(s, "cancel")).toBe("cancelled");
    }
  });

  it("allows nothing once an order is finished", () => {
    for (const s of ["done", "cancelled"] as OrderStatus[]) {
      for (const a of ["accept", "ready", "done", "cancel"] as StaffAction[]) {
        expect(applyAction(s, a)).toBeNull();
      }
    }
  });

  it("refuses to skip steps", () => {
    expect(applyAction("new", "ready")).toBeNull();
    expect(applyAction("new", "done")).toBeNull();
    expect(applyAction("preparing", "done")).toBeNull();
    expect(applyAction("preparing", "accept")).toBeNull();
  });
});
