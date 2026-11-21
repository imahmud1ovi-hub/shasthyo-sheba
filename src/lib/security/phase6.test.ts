import { describe, expect, it } from "vitest";
import { translations } from "@/lib/i18n/translations";
import {
  OtpError,
  requestOtpForPhone,
  verifyOtpForPhone,
} from "@/lib/auth/otp";
import { SmsProvider } from "@/lib/sms/sms-provider";
import { prisma } from "@/lib/db/prisma";
import {
  getOrGenerateSlotsForChamberDate,
  updateChamberSchedule,
} from "@/lib/booking/slots";
import {
  bookAppointment,
  cancelAppointment,
  listPatientAppointments,
  rescheduleAppointment,
} from "@/lib/booking/appointments";
import { payForAppointment } from "@/lib/payments/service";
import { submitAppointmentReview } from "@/lib/reviews/service";
import { doctorUpdateAppointment } from "@/lib/doctors/manage";

function collectStructureKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") {
    return [prefix];
  }
  if (Array.isArray(obj)) {
    return obj.flatMap((item, idx) =>
      collectStructureKeys(item, `${prefix}[${idx}]`)
    );
  }
  return Object.entries(obj as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([k, v]) =>
      collectStructureKeys(v, prefix ? `${prefix}.${k}` : k)
    );
}

function collectLeafStrings(obj: unknown): string[] {
  if (typeof obj === "string") return [obj];
  if (Array.isArray(obj)) return obj.flatMap(collectLeafStrings);
  if (obj && typeof obj === "object") {
    return Object.values(obj).flatMap(collectLeafStrings);
  }
  return [];
}

describe("Bilingual (English + বাংলা) translation completeness", () => {
  it("has identical keys and non-empty strings across English and Bangla", () => {
    const enKeys = collectStructureKeys(translations.en);
    const bnKeys = collectStructureKeys(translations.bn);

    expect(bnKeys).toEqual(enKeys);

    for (const s of collectLeafStrings(translations.en)) {
      expect(s.trim().length).toBeGreaterThan(0);
    }
    for (const s of collectLeafStrings(translations.bn)) {
      expect(s.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("OTP rate limiting (max 5/hour) and brute-force attempt lockout", () => {
  it("blocks the 6th OTP request within an hour and locks out after 5 failed verify attempts", async () => {
    const testPhone = "+8801799990061";
    let lastCode = "";
    const silentSms: SmsProvider = {
      async sendOtp(_phone, code) {
        lastCode = code;
      },
    };

    await prisma.otpVerification.deleteMany({ where: { phone: testPhone } });

    try {
      // 1. 5 OTP requests within 1 hour succeed
      for (let i = 0; i < 5; i++) {
        await requestOtpForPhone(testPhone, silentSms);
      }
      expect(lastCode).toMatch(/^\d{6}$/);

      // 2. 6th OTP request within the same hour must fail with 429 RATE_LIMITED
      await expect(
        requestOtpForPhone(testPhone, silentSms)
      ).rejects.toMatchObject({
        code: "RATE_LIMITED",
        statusCode: 429,
      } satisfies Partial<OtpError>);

      // 3. 5 wrong verification guesses increment attempts to 5
      for (let i = 0; i < 5; i++) {
        await expect(
          verifyOtpForPhone(testPhone, "000000")
        ).rejects.toMatchObject({
          code: "INVALID_OTP",
        });
      }

      // 4. Even with the actual code, the 6th attempt is locked out with RATE_LIMITED
      await expect(
        verifyOtpForPhone(testPhone, lastCode)
      ).rejects.toMatchObject({
        code: "RATE_LIMITED",
        statusCode: 429,
      });
    } finally {
      await prisma.otpVerification.deleteMany({ where: { phone: testPhone } });
    }
  });
});

describe("Cross-patient & cross-doctor authorization isolation", () => {
  it("prevents Patient B from viewing, cancelling, rescheduling, paying, or reviewing Patient A's appointment, and prevents Doctor B from modifying Doctor A's chamber or appointment", async () => {
    const patAPhone = "+8801799990062";
    const patBPhone = "+8801799990063";
    const testDateStr = "2027-09-15";

    const [docA, docB] = await prisma.doctorProfile.findMany({
      where: { status: "APPROVED" },
      include: { chambers: true },
      take: 2,
    });
    expect(docA).toBeDefined();
    expect(docB).toBeDefined();

    const chamberA = docA.chambers[0];
    expect(chamberA).toBeDefined();

    const [patA, patB] = await Promise.all([
      prisma.user.upsert({
        where: { phone: patAPhone },
        update: {},
        create: {
          phone: patAPhone,
          role: "PATIENT",
          patientProfile: { create: {} },
        },
      }),
      prisma.user.upsert({
        where: { phone: patBPhone },
        update: {},
        create: {
          phone: patBPhone,
          role: "PATIENT",
          patientProfile: { create: {} },
        },
      }),
    ]);

    try {
      const generated = await getOrGenerateSlotsForChamberDate(
        chamberA.id,
        testDateStr
      );
      const slot1 = generated.slots[0];
      const slot2 = generated.slots[1];

      const apptA = await bookAppointment({
        patientUserId: patA.id,
        slotId: slot1.id,
      });

      // 1. Patient B listing appointments must NOT see Patient A's appointment
      const patBList = await listPatientAppointments(patB.id, "PATIENT");
      expect(patBList.some((a) => a.id === apptA.id)).toBe(false);

      // 2. Patient B cannot cancel Patient A's appointment
      await expect(
        cancelAppointment({
          actorUserId: patB.id,
          actorRole: "PATIENT",
          appointmentId: apptA.id,
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN", statusCode: 403 });

      // 3. Patient B cannot reschedule Patient A's appointment
      await expect(
        rescheduleAppointment({
          actorUserId: patB.id,
          actorRole: "PATIENT",
          appointmentId: apptA.id,
          newSlotId: slot2.id,
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN", statusCode: 403 });

      // 4. Patient B cannot pay for Patient A's appointment
      await expect(
        payForAppointment({
          actorUserId: patB.id,
          actorRole: "PATIENT",
          appointmentId: apptA.id,
          rawInput: { method: "MOCK_ONLINE" },
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN", statusCode: 403 });

      // 5. Doctor B cannot modify Doctor A's chamber schedule
      await expect(
        updateChamberSchedule(docB.userId, "DOCTOR", chamberA.id, {
          feeBdt: 900,
          slotDurationMin: 15,
          daysOfWeek: [0, 1, 2],
          startTime: "17:00",
          endTime: "20:00",
          blockedDates: [],
        })
      ).rejects.toThrow("You are not authorized to edit this chamber.");

      // 6. Doctor B cannot modify Doctor A's appointment
      await expect(
        doctorUpdateAppointment({
          actorUserId: docB.userId,
          actorRole: "DOCTOR",
          appointmentId: apptA.id,
          rawInput: { status: "COMPLETED" },
        })
      ).rejects.toThrow("You are not authorized to manage this appointment.");

      // 7. Even after Doctor A completes the appointment, Patient B cannot review it
      await doctorUpdateAppointment({
        actorUserId: docA.userId,
        actorRole: "DOCTOR",
        appointmentId: apptA.id,
        rawInput: { status: "COMPLETED" },
      });

      await expect(
        submitAppointmentReview({
          actorUserId: patB.id,
          actorRole: "PATIENT",
          appointmentId: apptA.id,
          rawInput: { rating: 1, comment: "Unauthorized review" },
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN", statusCode: 403 });
    } finally {
      await prisma.auditLog.deleteMany({
        where: { targetUserId: { in: [patA.id, patB.id] } },
      });
      await prisma.appointment.deleteMany({
        where: { chamberId: chamberA.id, dateStr: testDateStr },
      });
      await prisma.availabilitySlot.deleteMany({
        where: { chamberId: chamberA.id, dateStr: testDateStr },
      });
      await prisma.user.deleteMany({
        where: { phone: { in: [patAPhone, patBPhone] } },
      });
    }
  });
});
