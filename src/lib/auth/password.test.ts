import { describe, expect, it } from "vitest";
import {
  hashPassword,
  loginWithPhoneAndPassword,
  registerPatientWithPassword,
  verifyPassword,
} from "./password";
import { prisma } from "@/lib/db/prisma";

describe("Password hashing & verification (crypto.scrypt)", () => {
  it("hashes passwords with random salt and verifies accurately", () => {
    const hash = hashPassword("patient123");
    expect(hash.startsWith("scrypt:")).toBe(true);
    expect(verifyPassword("patient123", hash)).toBe(true);
    expect(verifyPassword("wrongpass", hash)).toBe(false);
    expect(verifyPassword("patient123", null)).toBe(false);
  });
});

describe("Phone + Password authentication & registration against PostgreSQL", () => {
  it("authenticates seeded admin, patient, and doctor accounts and supports new patient registration", async () => {
    const testPhone = "+8801799990088";

    try {
      // 1. Verify seeded accounts login with fixed passwords
      const admin = await loginWithPhoneAndPassword({
        phone: "01700000000",
        password: "admin123",
      });
      expect(admin.role).toBe("ADMIN");

      const patient = await loginWithPhoneAndPassword({
        phone: "01711111111",
        password: "patient123",
      });
      expect(patient.role).toBe("PATIENT");

      const doctor = await loginWithPhoneAndPassword({
        phone: "01712000001",
        password: "doctor123",
      });
      expect(doctor.role).toBe("DOCTOR");

      // 2. Wrong password must fail with 401 INVALID_CREDENTIALS
      await expect(
        loginWithPhoneAndPassword({
          phone: "01711111111",
          password: "wrongpassword",
        })
      ).rejects.toMatchObject({
        code: "INVALID_CREDENTIALS",
        statusCode: 401,
      });

      // 3. Register a new patient with phone + password
      const registered = await registerPatientWithPassword({
        name: "KarimMia",
        phone: "01799990088",
        password: "mypassword123",
      });
      expect(registered.phone).toBe(testPhone);
      expect(registered.role).toBe("PATIENT");

      // 4. Duplicate registration must fail with 409 PHONE_ALREADY_REGISTERED
      await expect(
        registerPatientWithPassword({
          name: "KarimMia",
          phone: "01799990088",
          password: "mypassword123",
        })
      ).rejects.toMatchObject({
        code: "PHONE_ALREADY_REGISTERED",
        statusCode: 409,
      });
    } finally {
      await prisma.user.deleteMany({
        where: { phone: testPhone },
      });
    }
  });
});
