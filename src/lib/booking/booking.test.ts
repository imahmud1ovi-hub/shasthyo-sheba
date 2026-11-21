import { describe, expect, it } from "vitest";
import {
  computeTimeSlotsForDate,
  getOrGenerateSlotsForChamberDate,
  isChamberOpenOnDate,
} from "./slots";
import {
  bookAppointment,
  BookingError,
  cancelAppointment,
  canModifyAppointment,
  rescheduleAppointment,
} from "./appointments";
import { prisma } from "@/lib/db/prisma";

describe("Chamber slot generation & open-date rules", () => {
  it("computes sequential 15-minute serial slots between start and end times", () => {
    const slots = computeTimeSlotsForDate("2027-05-10", "17:00", "18:00", 15);
    expect(slots).toHaveLength(4);
    expect(slots[0]).toMatchObject({
      serialNumber: 1,
      startTime: "17:00",
      endTime: "17:15",
    });
    expect(slots[3]).toMatchObject({
      serialNumber: 4,
      startTime: "17:45",
      endTime: "18:00",
    });
  });

  it("blocks dates present in chamber.blockedDates or outside daysOfWeek", () => {
    const chamber = {
      isActive: true,
      daysOfWeek: [1, 2, 3], // Mon, Tue, Wed
      blockedDates: ["2027-05-10"], // Monday
    };

    // 2027-05-10 is Monday (day 1), but explicitly in blockedDates
    expect(isChamberOpenOnDate(chamber, "2027-05-10")).toEqual({
      open: false,
      reason: "BLOCKED_DATE",
    });

    // 2027-05-09 is Sunday (day 0), not in daysOfWeek
    expect(isChamberOpenOnDate(chamber, "2027-05-09")).toEqual({
      open: false,
      reason: "CLOSED_DAY_OF_WEEK",
    });

    // 2027-05-11 is Tuesday (day 2), open
    expect(isChamberOpenOnDate(chamber, "2027-05-11")).toEqual({
      open: true,
    });
  });
});

describe("2-hour rule for cancel and reschedule (canModifyAppointment)", () => {
  it("allows modifications 2 hours or more before appointment time", () => {
    const apptTime = new Date("2027-05-10T17:00:00+06:00");
    const twoHoursOneMinBefore = new Date("2027-05-10T14:59:00+06:00");
    const exactTwoHoursBefore = new Date("2027-05-10T15:00:00+06:00");

    expect(canModifyAppointment(apptTime, twoHoursOneMinBefore)).toBe(true);
    expect(canModifyAppointment(apptTime, exactTwoHoursBefore)).toBe(true);
  });

  it("rejects modifications within 2 hours of appointment time", () => {
    const apptTime = new Date("2027-05-10T17:00:00+06:00");
    const oneHourFiftyNineMinBefore = new Date("2027-05-10T15:01:00+06:00");
    const thirtyMinsBefore = new Date("2027-05-10T16:30:00+06:00");

    expect(canModifyAppointment(apptTime, oneHourFiftyNineMinBefore)).toBe(
      false
    );
    expect(canModifyAppointment(apptTime, thirtyMinsBefore)).toBe(false);
  });
});

describe("Database concurrency & booking lifecycle (book, reschedule, cancel)", () => {
  it("allows only one booking when two patients book the exact same slot concurrently", async () => {
    const testDateStr = "2027-06-15";
    const chamber = await prisma.chamber.findFirst({
      where: {
        isActive: true,
        doctor: { status: "APPROVED" },
      },
    });
    expect(chamber).not.toBeNull();

    // Ensure 2 temporary test patients exist
    const [p1, p2] = await Promise.all([
      prisma.user.upsert({
        where: { phone: "+8801799990001" },
        update: {},
        create: {
          phone: "+8801799990001",
          role: "PATIENT",
          nameEn: "Concurrency Patient 1",
          patientProfile: { create: {} },
        },
      }),
      prisma.user.upsert({
        where: { phone: "+8801799990002" },
        update: {},
        create: {
          phone: "+8801799990002",
          role: "PATIENT",
          nameEn: "Concurrency Patient 2",
          patientProfile: { create: {} },
        },
      }),
    ]);

    try {
      const generated = await getOrGenerateSlotsForChamberDate(
        chamber!.id,
        testDateStr
      );
      expect(generated.open).toBe(true);
      expect(generated.slots.length).toBeGreaterThanOrEqual(2);

      const targetSlot = generated.slots[0];
      const secondSlot = generated.slots[1];

      // Fire two concurrent booking requests for the SAME slot at the SAME time
      const results = await Promise.allSettled([
        bookAppointment({
          patientUserId: p1.id,
          slotId: targetSlot.id,
          symptoms: "Concurrent booking A",
        }),
        bookAppointment({
          patientUserId: p2.id,
          slotId: targetSlot.id,
          symptoms: "Concurrent booking B",
        }),
      ]);

      const fulfilled = results.filter(
        (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof bookAppointment>>> =>
          r.status === "fulfilled"
      );
      const rejected = results.filter(
        (r): r is PromiseRejectedResult => r.status === "rejected"
      );

      // Strictly ONE must succeed and ONE must fail with SLOT_ALREADY_BOOKED
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0].reason).toBeInstanceOf(BookingError);
      expect((rejected[0].reason as BookingError).code).toBe(
        "SLOT_ALREADY_BOOKED"
      );

      const winningAppt = fulfilled[0].value;
      const winningUserId =
        winningAppt.symptoms === "Concurrent booking A" ? p1.id : p2.id;

      // Verify in PostgreSQL that only 1 active appointment exists for targetSlot
      const activeForSlot = await prisma.appointment.count({
        where: {
          slotId: targetSlot.id,
          status: "CONFIRMED",
        },
      });
      expect(activeForSlot).toBe(1);

      // Test rescheduling to secondSlot
      const rescheduled = await rescheduleAppointment({
        actorUserId: winningUserId,
        actorRole: "PATIENT",
        appointmentId: winningAppt.id,
        newSlotId: secondSlot.id,
      });
      expect(rescheduled.slotId).toBe(secondSlot.id);
      expect(rescheduled.serialNumber).toBe(secondSlot.serialNumber);

      // Old slot must now be free (isBooked: false)
      const oldSlotInDb = await prisma.availabilitySlot.findUnique({
        where: { id: targetSlot.id },
      });
      expect(oldSlotInDb?.isBooked).toBe(false);

      // Test 2-hour rule enforcement when trying to cancel 30 minutes before appointment
      const thirtyMinBefore = new Date(
        rescheduled.appointmentAt.getTime() - 30 * 60 * 1000
      );
      await expect(
        cancelAppointment({
          actorUserId: winningUserId,
          actorRole: "PATIENT",
          appointmentId: rescheduled.id,
          now: thirtyMinBefore,
        })
      ).rejects.toMatchObject({
        code: "TOO_LATE_TO_MODIFY",
      });

      // Test valid cancellation (> 2 hours before appointment)
      const cancelled = await cancelAppointment({
        actorUserId: winningUserId,
        actorRole: "PATIENT",
        appointmentId: rescheduled.id,
      });
      expect(cancelled.status).toBe("CANCELLED");
      expect(cancelled.activeSlotKey).toBeNull();

      // Freed slot must now have isBooked: false
      const secondSlotInDb = await prisma.availabilitySlot.findUnique({
        where: { id: secondSlot.id },
      });
      expect(secondSlotInDb?.isBooked).toBe(false);
    } finally {
      // Cleanup test records so seeded demo data remains untouched
      await prisma.appointment.deleteMany({
        where: {
          chamberId: chamber!.id,
          dateStr: testDateStr,
        },
      });
      await prisma.availabilitySlot.deleteMany({
        where: {
          chamberId: chamber!.id,
          dateStr: testDateStr,
        },
      });
      await prisma.user.deleteMany({
        where: {
          phone: { in: ["+8801799990001", "+8801799990002"] },
        },
      });
    }
  });
});
