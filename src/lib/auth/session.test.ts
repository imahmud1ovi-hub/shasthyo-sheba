import { describe, expect, it } from "vitest";
import {
  getDashboardPathForRole,
  isRoleAllowed,
  SessionUser,
  signSessionToken,
  verifySessionToken,
} from "./session";

describe("JWT session signing & verification", () => {
  it("signs and verifies a valid session payload", async () => {
    const user: SessionUser = {
      userId: "user_123",
      phone: "+8801711111111",
      role: "PATIENT",
      preferredLang: "bn",
      nameEn: "Rahim Uddin",
      nameBn: "রহিম উদ্দিন",
    };

    const token = await signSessionToken(user);
    const verified = await verifySessionToken(token);

    expect(verified).toEqual(user);
  });

  it("returns null for an invalid or tampered JWT token", async () => {
    const verified = await verifySessionToken("invalid.token.value");
    expect(verified).toBeNull();
  });
});

describe("RBAC permissions (isRoleAllowed)", () => {
  it("allows PATIENT only in PATIENT area", () => {
    expect(isRoleAllowed("PATIENT", ["PATIENT"])).toBe(true);
    expect(isRoleAllowed("PATIENT", ["DOCTOR"])).toBe(false);
    expect(isRoleAllowed("PATIENT", ["ADMIN"])).toBe(false);
  });

  it("allows DOCTOR only in DOCTOR area", () => {
    expect(isRoleAllowed("DOCTOR", ["DOCTOR"])).toBe(true);
    expect(isRoleAllowed("DOCTOR", ["PATIENT"])).toBe(false);
    expect(isRoleAllowed("DOCTOR", ["ADMIN"])).toBe(false);
  });

  it("allows ADMIN across PATIENT, DOCTOR, and ADMIN areas", () => {
    expect(isRoleAllowed("ADMIN", ["PATIENT"])).toBe(true);
    expect(isRoleAllowed("ADMIN", ["DOCTOR"])).toBe(true);
    expect(isRoleAllowed("ADMIN", ["ADMIN"])).toBe(true);
  });

  it("maps roles to their default dashboard paths", () => {
    expect(getDashboardPathForRole("ADMIN")).toBe("/admin/dashboard");
    expect(getDashboardPathForRole("DOCTOR")).toBe("/doctor/dashboard");
    expect(getDashboardPathForRole("PATIENT")).toBe("/patient/dashboard");
  });
});
