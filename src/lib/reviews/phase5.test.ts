import { describe, expect, it } from "vitest";
import { MockPaymentProvider } from "@/lib/payments/payment-provider";
import { payForAppointment } from "@/lib/payments/service";
import { submitAppointmentReview } from "@/lib/reviews/service";
import { prisma } from "@/lib/db/prisma";
import { getOrGenerateSlotsForChamberDate } from "@/lib/booking/slots";
import { bookAppointment } from "@/lib/booking/appointments";
import { doctorUpdateAppointment } from "@/lib/doctors/manage";
import {
  getApprovedDoctorById,
  searchApprovedDoctors,
} from "@/lib/doctors/search";

describe("MockPaymentProvider unit tests", () => {
  it("returns PENDING for CASH_AT_CLINIC and PAID for MOCK_ONLINE", async () => {
    const provider = new MockPaymentProvider();

    const clinicRes = await provider.processPayment({
      appointmentId: "appt_1",
      amountBdt: 800,
      method: "CASH_AT_CLINIC",
      patientPhone: "+8801711111111",
    });
    expect(clinicRes.status).toBe("PENDING");
    expect(clinicRes.paidAt).toBeNull();

    const onlineRes = await provider.processPayment({
      appointmentId: "appt_2",
      amountBdt: 800,
      method: "MOCK_ONLINE",
      patientPhone: "+8801711111111",
    });
    expect(onlineRes.status).toBe("PAID");
    expect(onlineRes.paidAt).toBeInstanceOf(Date);
    expect(onlineRes.transactionRef).toContain("MOCK-PAY-");
  });
});

describe("Phase 5 lifecycle: payment processing, COMPLETED-only review rule, single-review enforcement, and search rating sync", () => {
  it("processes mock online payment, rejects review before COMPLETED, allows one review after COMPLETED, and updates search rating", async () => {
    const testPatPhone = "+8801799990055";
    const testDateStr = "2027-08-18";

    const chamber = await prisma.chamber.findFirst({
      where: {
        isActive: true,
        doctor: { bmdcNumber: "A-10020" },
      },
      include: { doctor: true },
    });
    expect(chamber).not.toBeNull();

    const originalAvg = chamber!.doctor.averageRating;
    const originalCount = chamber!.doctor.reviewCount;

    const patUser = await prisma.user.upsert({
      where: { phone: testPatPhone },
      update: {},
      create: {
        phone: testPatPhone,
        role: "PATIENT",
        nameEn: "Review Test Patient",
        patientProfile: { create: {} },
      },
    });

    try {
      const generated = await getOrGenerateSlotsForChamberDate(
        chamber!.id,
        testDateStr
      );
      expect(generated.slots.length).toBeGreaterThan(0);

      const appt = await bookAppointment({
        patientUserId: patUser.id,
        slotId: generated.slots[0].id,
        paymentMethod: "CASH_AT_CLINIC",
      });
      expect(appt.payment?.status).toBe("PENDING");

      // 1. Pay online using PaymentProvider service
      const paid = await payForAppointment({
        actorUserId: patUser.id,
        actorRole: "PATIENT",
        appointmentId: appt.id,
        rawInput: { method: "MOCK_ONLINE" },
      });
      expect(paid.status).toBe("PAID");
      expect(paid.method).toBe("MOCK_ONLINE");

      // Paying a second time must be rejected with ALREADY_PAID
      await expect(
        payForAppointment({
          actorUserId: patUser.id,
          actorRole: "PATIENT",
          appointmentId: appt.id,
          rawInput: { method: "MOCK_ONLINE" },
        })
      ).rejects.toMatchObject({ code: "ALREADY_PAID" });

      // 2. Reviewing before appointment is COMPLETED must be rejected
      await expect(
        submitAppointmentReview({
          actorUserId: patUser.id,
          actorRole: "PATIENT",
          appointmentId: appt.id,
          rawInput: { rating: 5, comment: "Premature review" },
        })
      ).rejects.toMatchObject({ code: "APPOINTMENT_NOT_COMPLETED" });

      // 3. Doctor marks appointment COMPLETED
      await doctorUpdateAppointment({
        actorUserId: chamber!.doctor.userId,
        actorRole: "DOCTOR",
        appointmentId: appt.id,
        rawInput: { status: "COMPLETED" },
      });

      // 4. Patient submits a valid review on the COMPLETED appointment
      const reviewRes = await submitAppointmentReview({
        actorUserId: patUser.id,
        actorRole: "PATIENT",
        appointmentId: appt.id,
        rawInput: {
          rating: 5,
          comment: "Excellent orthopedic care and very punctual serial.",
        },
      });
      expect(reviewRes.review.rating).toBe(5);
      expect(reviewRes.doctorStats.averageRating).toBe(5);
      expect(reviewRes.doctorStats.reviewCount).toBeGreaterThanOrEqual(1);

      // 5. Submitting a second review for the same appointment must fail with ALREADY_REVIEWED
      await expect(
        submitAppointmentReview({
          actorUserId: patUser.id,
          actorRole: "PATIENT",
          appointmentId: appt.id,
          rawInput: { rating: 4, comment: "Duplicate review attempt" },
        })
      ).rejects.toMatchObject({ code: "ALREADY_REVIEWED" });

      // 6. Verify rating and review appear in search results and doctor profile
      const searchRes = await searchApprovedDoctors({ q: "A-10020" });
      expect(searchRes.items[0]?.averageRating).toBe(5);

      const profile = await getApprovedDoctorById(chamber!.doctorId);
      expect(profile?.averageRating).toBe(5);
      expect(profile?.reviews[0]?.comment).toContain(
        "Excellent orthopedic care"
      );
    } finally {
      // Restore original doctor stats and clean up test records
      await prisma.review.deleteMany({
        where: { doctorId: chamber!.doctorId },
      });
      await prisma.doctorProfile.update({
        where: { id: chamber!.doctorId },
        data: {
          averageRating: originalAvg,
          reviewCount: originalCount,
        },
      });
      await prisma.auditLog.deleteMany({
        where: { targetUserId: patUser.id },
      });
      await prisma.appointment.deleteMany({
        where: { chamberId: chamber!.id, dateStr: testDateStr },
      });
      await prisma.availabilitySlot.deleteMany({
        where: { chamberId: chamber!.id, dateStr: testDateStr },
      });
      await prisma.user.deleteMany({
        where: { phone: testPatPhone },
      });
    }
  });
});
