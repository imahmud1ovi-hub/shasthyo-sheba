import { describe, expect, it } from "vitest";
import {
  buildDoctorWhereClause,
  doctorSearchQuerySchema,
} from "./search";

describe("doctorSearchQuerySchema", () => {
  it("applies sensible defaults when empty query is passed", () => {
    const parsed = doctorSearchQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(6);
    expect(parsed.sort).toBe("rating_desc");
    expect(parsed.availableToday).toBe(false);
    expect(parsed.q).toBeUndefined();
  });

  it("parses fee ranges, gender, specialty, city, and day availability", () => {
    const parsed = doctorSearchQuerySchema.parse({
      q: "  Mahmudul  ",
      specialty: "cardiology",
      city: "Dhaka",
      area: "Dhanmondi",
      gender: "FEMALE",
      minFee: "600",
      maxFee: "1000",
      availableDay: "3",
      sort: "fee_asc",
      page: "2",
    });

    expect(parsed.q).toBe("Mahmudul");
    expect(parsed.specialty).toBe("cardiology");
    expect(parsed.city).toBe("Dhaka");
    expect(parsed.area).toBe("Dhanmondi");
    expect(parsed.gender).toBe("FEMALE");
    expect(parsed.minFee).toBe(600);
    expect(parsed.maxFee).toBe(1000);
    expect(parsed.availableDay).toBe(3);
    expect(parsed.sort).toBe("fee_asc");
    expect(parsed.page).toBe(2);
  });
});

describe("buildDoctorWhereClause", () => {
  it("always enforces status: APPROVED even with no filters", () => {
    const params = doctorSearchQuerySchema.parse({});
    const where = buildDoctorWhereClause(params);
    expect(where.AND).toEqual([{ status: "APPROVED" }]);
  });

  it("builds bilingual name/qualification search and chamber filters", () => {
    const params = doctorSearchQuerySchema.parse({
      q: "কার্ডিওলজি",
      specialty: "cardiology",
      city: "ঢাকা",
      gender: "MALE",
      minFee: "500",
      maxFee: "900",
      availableToday: "true",
    });

    const where = buildDoctorWhereClause(params, 2); // Tuesday = 2
    const conditions = Array.isArray(where.AND) ? where.AND : [];

    expect(conditions[0]).toEqual({ status: "APPROVED" });
    expect(JSON.stringify(conditions)).toContain("কার্ডিওলজি");
    expect(JSON.stringify(conditions)).toContain("cardiology");
    expect(JSON.stringify(conditions)).toContain("ঢাকা");
    expect(JSON.stringify(conditions)).toContain('"has":2');
    expect(JSON.stringify(conditions)).toContain('"gte":500');
    expect(JSON.stringify(conditions)).toContain('"lte":900');
  });
});
