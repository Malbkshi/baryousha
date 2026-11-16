import { describe, expect, it } from "vitest";
import { normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it.each([
    "0912345678",
    "٠٩١٢٣٤٥٦٧٨",
    "+218 91 234 5678",
    "00218912345678",
    "091-234-5678",
    "218912345678",
    " 091 234 5678 ",
  ])("normalises %s to the local form", (input) => {
    expect(normalizePhone(input)).toBe("0912345678");
  });

  it.each(["0812345678", "091234567", "09123456789", "abc", ""])(
    "rejects %s",
    (input) => {
      expect(normalizePhone(input)).toBeNull();
    },
  );

  it("accepts the 091–095 prefixes and nothing else", () => {
    for (const p of ["091", "092", "093", "094", "095"]) {
      expect(normalizePhone(`${p}1234567`)).toBe(`${p}1234567`);
    }
    expect(normalizePhone("0961234567")).toBeNull();
    expect(normalizePhone("0901234567")).toBeNull();
  });
});
