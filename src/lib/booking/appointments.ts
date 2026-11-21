import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { notificationProvider } from "@/lib/notifications/notification-provider";
import { isChamberOpenOnDate } from "@/lib/booking/slots";

export const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export class BookingError extends Error {
  public readonly code:
    | "SLOT_NOT_FOUND"
    | "SLOT_ALREADY_BOOKED"
    | "SLOT_BLOCKED"
    | "SLOT_IN_PAST"
    | "DOCTOR_NOT_APPROVED"
    | "APPOINTMENT_NOT_FOUND"
    | "FORBIDDEN"
    | "INVALID_STATUS"
    | "TOO_LATE_TO_MODIFY";
  public readonly statusCode: number;

  constructor(
    message: string,
    code: BookingError["code"],
    statusCode = 400
  ) {
    super(message);
    this.name = "BookingError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const bookAppointmentSchema = z.object({
  slotId: z.string().min(1, "Slot ID is required."),
  symptoms: z.string().trim().max(500).optional(),
});

export const cancelAppointmentSchema = z.object({
  cancelReason: z.string().trim().max(300).optional(),
});

export const rescheduleAppointmentSchema = z.object({
  newSlotId: z.string().min(1, "New slot ID is required."),
});

/**
 * Business rule: Cancel or reschedule is not allowed within 2 hours of the appointment time.
 */
export function canModifyAppointment(
  appointmentAt: Date,
  now: Date = new Date()
): boolean {
  return appointmentAt.getTime() - now.getTime() >= TWO_HOURS_MS;
}

/**
 * Books a chamber serial slot inside an atomic PostgreSQL transaction.
 * Prevents double-booking at the database level via conditional `updateMany`
 * AND the `@unique` constraint on `Appointment.activeSlotKey`.
 */
export async function bookAppointment(params: {
  patientUserId: string;
  slotId: string;
  symptoms?: string;
  now?: Date;
}) {
  const { patientUserId, slotId, symptoms, now = new Date() } = params;

  const slot = await prisma.availabilitySlot.findUnique({
    where: { id: slotId },
    include: {
      chamber: {
        include: {
          clinic: true,
          doctor: true,
        },
      },
    },
  });

  if (!slot) {
    throw new BookingError(
      "Selected time slot does not exist.",
      "SLOT_NOT_FOUND",
      404
    );
  }

  if (slot.chamber.doctor.status !== "APPROVED") {
    throw new BookingError(
      "Doctor is not approved for public booking.",
      "DOCTOR_NOT_APPROVED",
      400
    );
  }

  const openCheck = isChamberOpenOnDate(slot.chamber, slot.dateStr);
  if (!openCheck.open || slot.isBlocked) {
    throw new BookingError(
      "This date or slot is blocked by the chamber.",
      "SLOT_BLOCKED",
      400
    );
  }

  if (slot.slotDateTime.getTime() <= now.getTime()) {
    throw new BookingError(
      "Cannot book a slot in the past.",
      "SLOT_IN_PAST",
      400
    );
  }

  let patientProfile = await prisma.patientProfile.findUnique({
    where: { userId: patientUserId },
  });

  if (!patientProfile) {
    patientProfile = await prisma.patientProfile.create({
      data: { userId: patientUserId },
    });
  }

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      // 1. Atomic conditional update in PostgreSQL: only succeeds if isBooked is currently false
      const claimed = await tx.availabilitySlot.updateMany({
        where: {
          id: slot.id,
          isBooked: false,
          isBlocked: false,
        },
        data: {
          isBooked: true,
        },
      });

      if (claimed.count === 0) {
        throw new BookingError(
          "This serial slot has already been booked by another patient.",
          "SLOT_ALREADY_BOOKED",
          409
        );
      }

      // 2. Create Appointment with unique activeSlotKey = slot.id (DB-enforced unique constraint)
      const created = await tx.appointment.create({
        data: {
          patientId: patientProfile.id,
          doctorId: slot.doctorId,
          chamberId: slot.chamberId,
          slotId: slot.id,
          dateStr: slot.dateStr,
          startTime: slot.startTime,
          endTime: slot.endTime,
          appointmentAt: slot.slotDateTime,
          serialNumber: slot.serialNumber,
          feeBdt: slot.chamber.feeBdt,
          status: "CONFIRMED",
          symptoms: symptoms?.trim() || null,
          activeSlotKey: slot.id,
          payment: {
            create: {
              amountBdt: slot.chamber.feeBdt,
              method: "CASH_AT_CLINIC",
              status: "PENDING",
              transactionRef: `SER-${Date.now()}-${Math.floor(
                Math.random() * 10000
              )}`,
            },
          },
        },
        include: {
          doctor: true,
          chamber: {
            include: { clinic: true },
          },
          payment: true,
        },
      });

      return created;
    });

    await notificationProvider.send({
      userId: patientUserId,
      titleEn: `Serial #${appointment.serialNumber} Confirmed`,
      titleBn: `সিরিয়াল #${appointment.serialNumber} নিশ্চিত হয়েছে`,
      messageEn: `Your appointment with ${slot.chamber.doctor.titleEn} at ${slot.chamber.clinic.nameEn} on ${slot.dateStr} (${slot.startTime}) is confirmed. Fee: ৳${appointment.feeBdt}.`,
      messageBn: `${slot.dateStr} তারিখ (${slot.startTime})-এ ${slot.chamber.clinic.nameBn}-এ ${slot.chamber.doctor.titleBn}-এর সাথে আপনার সিরিয়াল #${appointment.serialNumber} নিশ্চিত হয়েছে। ফি: ৳${appointment.feeBdt}।`,
    });

    return appointment;
  } catch (err) {
    if (err instanceof BookingError) {
      throw err;
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new BookingError(
        "This serial slot has already been booked by another patient.",
        "SLOT_ALREADY_BOOKED",
        409
      );
    }
    throw err;
  }
}

/**
 * Cancels an existing appointment, enforcing the 2-hour cutoff rule and releasing the slot.
 */
export async function cancelAppointment(params: {
  actorUserId: string;
  actorRole: "PATIENT" | "DOCTOR" | "ADMIN";
  appointmentId: string;
  cancelReason?: string;
  now?: Date;
}) {
  const {
    actorUserId,
    actorRole,
    appointmentId,
    cancelReason,
    now = new Date(),
  } = params;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      doctor: true,
      chamber: { include: { clinic: true } },
    },
  });

  if (!appointment) {
    throw new BookingError(
      "Appointment not found.",
      "APPOINTMENT_NOT_FOUND",
      404
    );
  }

  if (actorRole !== "ADMIN" && appointment.patient.userId !== actorUserId) {
    throw new BookingError(
      "You can only cancel your own appointments.",
      "FORBIDDEN",
      403
    );
  }

  if (
    appointment.status !== "CONFIRMED" &&
    appointment.status !== "PENDING"
  ) {
    throw new BookingError(
      `Cannot cancel an appointment with status ${appointment.status}.`,
      "INVALID_STATUS",
      400
    );
  }

  if (!canModifyAppointment(appointment.appointmentAt, now)) {
    throw new BookingError(
      "Cancel or reschedule is not allowed within 2 hours of the appointment time.",
      "TOO_LATE_TO_MODIFY",
      400
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const cancelled = await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancelReason: cancelReason?.trim() || "Cancelled by patient",
        activeSlotKey: null,
      },
    });

    await tx.availabilitySlot.update({
      where: { id: appointment.slotId },
      data: { isBooked: false },
    });

    return cancelled;
  });

  await notificationProvider.send({
    userId: appointment.patient.userId,
    titleEn: `Serial #${appointment.serialNumber} Cancelled`,
    titleBn: `সিরিয়াল #${appointment.serialNumber} বাতিল করা হয়েছে`,
    messageEn: `Your appointment with ${appointment.doctor.titleEn} on ${appointment.dateStr} (${appointment.startTime}) has been cancelled.`,
    messageBn: `${appointment.dateStr} (${appointment.startTime})-এ ${appointment.doctor.titleBn}-এর সাথে আপনার অ্যাপয়েন্টমেন্ট বাতিল করা হয়েছে।`,
  });

  return updated;
}

/**
 * Reschedules an existing appointment to a new AvailabilitySlot, enforcing the 2-hour rule
 * and atomic DB-level concurrency protection on the new slot.
 */
export async function rescheduleAppointment(params: {
  actorUserId: string;
  actorRole: "PATIENT" | "DOCTOR" | "ADMIN";
  appointmentId: string;
  newSlotId: string;
  now?: Date;
}) {
  const {
    actorUserId,
    actorRole,
    appointmentId,
    newSlotId,
    now = new Date(),
  } = params;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      doctor: true,
      chamber: { include: { clinic: true } },
    },
  });

  if (!appointment) {
    throw new BookingError(
      "Appointment not found.",
      "APPOINTMENT_NOT_FOUND",
      404
    );
  }

  if (actorRole !== "ADMIN" && appointment.patient.userId !== actorUserId) {
    throw new BookingError(
      "You can only reschedule your own appointments.",
      "FORBIDDEN",
      403
    );
  }

  if (
    appointment.status !== "CONFIRMED" &&
    appointment.status !== "PENDING"
  ) {
    throw new BookingError(
      `Cannot reschedule an appointment with status ${appointment.status}.`,
      "INVALID_STATUS",
      400
    );
  }

  if (!canModifyAppointment(appointment.appointmentAt, now)) {
    throw new BookingError(
      "Cancel or reschedule is not allowed within 2 hours of the appointment time.",
      "TOO_LATE_TO_MODIFY",
      400
    );
  }

  if (appointment.slotId === newSlotId) {
    throw new BookingError(
      "Please choose a different slot to reschedule.",
      "SLOT_ALREADY_BOOKED",
      400
    );
  }

  const newSlot = await prisma.availabilitySlot.findUnique({
    where: { id: newSlotId },
    include: {
      chamber: {
        include: { clinic: true, doctor: true },
      },
    },
  });

  if (!newSlot || newSlot.doctorId !== appointment.doctorId) {
    throw new BookingError(
      "Selected new slot is not valid for this doctor.",
      "SLOT_NOT_FOUND",
      404
    );
  }

  const openCheck = isChamberOpenOnDate(newSlot.chamber, newSlot.dateStr);
  if (!openCheck.open || newSlot.isBlocked) {
    throw new BookingError(
      "Selected new slot is blocked or closed.",
      "SLOT_BLOCKED",
      400
    );
  }

  if (newSlot.slotDateTime.getTime() <= now.getTime()) {
    throw new BookingError(
      "Cannot reschedule to a slot in the past.",
      "SLOT_IN_PAST",
      400
    );
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Atomically claim the new slot
      const claimed = await tx.availabilitySlot.updateMany({
        where: {
          id: newSlot.id,
          isBooked: false,
          isBlocked: false,
        },
        data: {
          isBooked: true,
        },
      });

      if (claimed.count === 0) {
        throw new BookingError(
          "The new serial slot has already been booked by another patient.",
          "SLOT_ALREADY_BOOKED",
          409
        );
      }

      // 2. Release the old slot
      await tx.availabilitySlot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false },
      });

      // 3. Update the appointment to point to the new slot
      return tx.appointment.update({
        where: { id: appointment.id },
        data: {
          chamberId: newSlot.chamberId,
          slotId: newSlot.id,
          dateStr: newSlot.dateStr,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
          appointmentAt: newSlot.slotDateTime,
          serialNumber: newSlot.serialNumber,
          feeBdt: newSlot.chamber.feeBdt,
          activeSlotKey: newSlot.id,
        },
        include: {
          doctor: true,
          chamber: { include: { clinic: true } },
          payment: true,
        },
      });
    });

    await notificationProvider.send({
      userId: appointment.patient.userId,
      titleEn: `Rescheduled to Serial #${updated.serialNumber}`,
      titleBn: `সিরিয়াল #${updated.serialNumber}-এ সময় পরিবর্তন হয়েছে`,
      messageEn: `Your appointment with ${appointment.doctor.titleEn} has been rescheduled to ${updated.dateStr} at ${updated.startTime} (Serial #${updated.serialNumber}).`,
      messageBn: `${appointment.doctor.titleBn}-এর সাথে আপনার অ্যাপয়েন্টমেন্ট ${updated.dateStr} তারিখ ${updated.startTime}-এ (সিরিয়াল #${updated.serialNumber}) পরিবর্তন করা হয়েছে।`,
    });

    return updated;
  } catch (err) {
    if (err instanceof BookingError) {
      throw err;
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new BookingError(
        "The new serial slot has already been booked by another patient.",
        "SLOT_ALREADY_BOOKED",
        409
      );
    }
    throw err;
  }
}

export async function listPatientAppointments(
  actorUserId: string,
  actorRole: "PATIENT" | "DOCTOR" | "ADMIN"
) {
  return prisma.appointment.findMany({
    where:
      actorRole === "ADMIN"
        ? {}
        : {
            patient: {
              userId: actorUserId,
            },
          },
    include: {
      doctor: {
        include: {
          specialties: {
            include: { specialty: true },
          },
        },
      },
      chamber: {
        include: { clinic: true },
      },
      payment: true,
      review: true,
    },
    orderBy: {
      appointmentAt: "desc",
    },
  });
}
