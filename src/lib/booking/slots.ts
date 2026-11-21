import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm (24h) format.");

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.");

export const updateChamberScheduleSchema = z
  .object({
    roomNumber: z.string().trim().max(40).optional().nullable(),
    feeBdt: z.number().int().min(0).max(50000),
    followUpFeeBdt: z.number().int().min(0).max(50000).optional(),
    slotDurationMin: z.number().int().min(5).max(120),
    daysOfWeek: z
      .array(z.number().int().min(0).max(6))
      .min(1, "Select at least one visiting day."),
    startTime: timeStringSchema,
    endTime: timeStringSchema,
    blockedDates: z.array(dateStringSchema).optional().default([]),
  })
  .refine((data) => timeToMinutes(data.endTime) > timeToMinutes(data.startTime), {
    message: "End time must be after start time.",
    path: ["endTime"],
  });

export type UpdateChamberScheduleInput = z.infer<
  typeof updateChamberScheduleSchema
>;

export interface ComputedTimeSlot {
  serialNumber: number;
  startTime: string;
  endTime: string;
  slotDateTime: Date;
}

export function timeToMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(":");
  return Number(hStr) * 60 + Number(mStr);
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Returns the day of week (0 = Sunday .. 6 = Saturday) for a YYYY-MM-DD date string
 * interpreted in Bangladesh Standard Time (+06:00).
 */
export function getDayOfWeekForDateStr(dateStr: string): number {
  const dt = new Date(`${dateStr}T12:00:00+06:00`);
  return dt.getUTCDay();
}

/**
 * Pure function that computes sequential chamber slots for a given date, start/end time, and duration.
 */
export function computeTimeSlotsForDate(
  dateStr: string,
  startTime: string,
  endTime: string,
  slotDurationMin: number
): ComputedTimeSlot[] {
  dateStringSchema.parse(dateStr);
  timeStringSchema.parse(startTime);
  timeStringSchema.parse(endTime);

  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);

  if (slotDurationMin <= 0 || endMins <= startMins) {
    return [];
  }

  const slots: ComputedTimeSlot[] = [];
  let serial = 1;

  for (
    let cursor = startMins;
    cursor + slotDurationMin <= endMins;
    cursor += slotDurationMin
  ) {
    const slotStart = minutesToTime(cursor);
    const slotEnd = minutesToTime(cursor + slotDurationMin);
    const slotDateTime = new Date(`${dateStr}T${slotStart}:00+06:00`);

    slots.push({
      serialNumber: serial,
      startTime: slotStart,
      endTime: slotEnd,
      slotDateTime,
    });
    serial++;
  }

  return slots;
}

/**
 * Checks if a chamber operates on the given YYYY-MM-DD date (not a blocked date and matches daysOfWeek).
 */
export function isChamberOpenOnDate(
  chamber: {
    isActive: boolean;
    daysOfWeek: number[];
    blockedDates: string[];
  },
  dateStr: string
): { open: boolean; reason?: "INACTIVE" | "BLOCKED_DATE" | "CLOSED_DAY_OF_WEEK" } {
  if (!chamber.isActive) {
    return { open: false, reason: "INACTIVE" };
  }
  if (chamber.blockedDates.includes(dateStr)) {
    return { open: false, reason: "BLOCKED_DATE" };
  }
  const dayOfWeek = getDayOfWeekForDateStr(dateStr);
  if (!chamber.daysOfWeek.includes(dayOfWeek)) {
    return { open: false, reason: "CLOSED_DAY_OF_WEEK" };
  }
  return { open: true };
}

/**
 * Materializes and returns AvailabilitySlot rows in PostgreSQL for a chamber and YYYY-MM-DD date.
 */
export async function getOrGenerateSlotsForChamberDate(
  chamberId: string,
  rawDateStr: string
) {
  const dateStr = dateStringSchema.parse(rawDateStr);

  const chamber = await prisma.chamber.findUnique({
    where: { id: chamberId },
    include: {
      clinic: true,
      doctor: true,
    },
  });

  if (!chamber) {
    return {
      chamber: null,
      open: false,
      reason: "NOT_FOUND" as const,
      slots: [],
    };
  }

  const openCheck = isChamberOpenOnDate(chamber, dateStr);
  if (!openCheck.open) {
    return {
      chamber,
      open: false,
      reason: openCheck.reason ?? ("CLOSED_DAY_OF_WEEK" as const),
      slots: [],
    };
  }

  const computed = computeTimeSlotsForDate(
    dateStr,
    chamber.startTime,
    chamber.endTime,
    chamber.slotDurationMin
  );

  // Ensure each computed slot exists in PostgreSQL without overwriting existing booking status
  if (computed.length > 0) {
    await prisma.availabilitySlot.createMany({
      data: computed.map((s) => ({
        chamberId: chamber.id,
        doctorId: chamber.doctorId,
        dateStr,
        startTime: s.startTime,
        endTime: s.endTime,
        slotDateTime: s.slotDateTime,
        serialNumber: s.serialNumber,
        isBooked: false,
        isBlocked: false,
      })),
      skipDuplicates: true,
    });
  }

  const slots = await prisma.availabilitySlot.findMany({
    where: {
      chamberId: chamber.id,
      dateStr,
    },
    orderBy: {
      serialNumber: "asc",
    },
  });

  return {
    chamber,
    open: true,
    reason: undefined,
    slots,
  };
}

/**
 * Updates a chamber's weekly schedule, slot duration, fee, and blocked dates.
 * Only the owning doctor or an ADMIN may update the chamber.
 */
export async function updateChamberSchedule(
  actorUserId: string,
  actorRole: "DOCTOR" | "ADMIN" | "PATIENT",
  chamberId: string,
  rawInput: unknown
) {
  const input = updateChamberScheduleSchema.parse(rawInput);

  const chamber = await prisma.chamber.findUnique({
    where: { id: chamberId },
    include: { doctor: true },
  });

  if (!chamber) {
    throw new Error("Chamber not found.");
  }

  if (actorRole !== "ADMIN" && chamber.doctor.userId !== actorUserId) {
    throw new Error("You are not authorized to edit this chamber.");
  }

  const uniqueDays = Array.from(new Set(input.daysOfWeek)).sort((a, b) => a - b);
  const uniqueBlockedDates = Array.from(new Set(input.blockedDates)).sort();

  const updated = await prisma.chamber.update({
    where: { id: chamberId },
    data: {
      roomNumber: input.roomNumber ?? chamber.roomNumber,
      feeBdt: input.feeBdt,
      followUpFeeBdt: input.followUpFeeBdt ?? chamber.followUpFeeBdt,
      slotDurationMin: input.slotDurationMin,
      daysOfWeek: uniqueDays,
      startTime: input.startTime,
      endTime: input.endTime,
      blockedDates: uniqueBlockedDates,
    },
    include: {
      clinic: true,
    },
  });

  return updated;
}
