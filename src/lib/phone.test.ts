import { describe, expect, it } from "vitest";
import { formatBdt, normalizeBdPhone } from "./phone";

describe("normalizeBdPhone", () => {
  it("normalizes local 11-digit 01XXXXXXXXX numbers to +8801XXXXXXXXX", () => {
    expect(normalizeBdPhone("01711111111")).toBe("+8801711111111");
    expect(normalizeBdPhone("01700000000")).toBe("+8801700000000");
  });

  it("keeps already normalized +8801XXXXXXXXX numbers", () => {
    expect(normalizeBdPhone("+8801712000001")).toBe("+8801712000001");
  });

  it("rejects invalid phone numbers", () => {
    expect(() => normalizeBdPhone("12345")).toThrow();
    expect(() => normalizeBdPhone("01211111111")).toThrow();
  });
});

describe("formatBdt", () => {
  it("formats BDT amounts with the Taka symbol", () => {
    expect(formatBdt(500)).toBe("৳500");
    expect(formatBdt(1200)).toBe("৳1,200");
  });
});
