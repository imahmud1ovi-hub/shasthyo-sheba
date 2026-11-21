import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit/audit-log";
import { notificationProvider } from "@/lib/notifications/notification-provider";

export const registerDoctorSchema = z.object({
  bmdcNumber: z
    .string()
    .trim()
    .min(3, "BM&DC number is required (e.g. A-10025).")
    .max(30),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).default("MALE"),
  titleEn: z.string().trim().min(3, "English full name/title is required."),
  titleBn: z.string().trim().min(3, "Bangla full name/title is required."),
  qualificationsEn: z
    .string()
    .trim()
    .min(2, "English qualifications are required."),
  qualificationsBn: z
    .string()
    .trim()
    .min(2, "Bangla qualifications are required."),
  experienceYears: z.coerce.number().int().min(0).max(70).default(5),
  bioEn: z.string().trim().max(1000).optional(),
  bioBn: z.string().trim().max(1000).optional(),
  specialtyId: z.string().min(1, "Specialty is required."),
  clinicId: z.string().min(1, "Primary chamber clinic is required."),
  feeBdt: z.coerce.number().int().min(0).max(50000).default(700),
  roomNumber: z.string().trim().max(40).optional(),
});

export type RegisterDoctorInput = z.infer<typeof registerDoctorSchema>;

export async function registerDoctorApplication(params: {
  userId: string;
  input: RegisterDoctorInput;
  bmdcDocumentPath: string;
}) {
  const { userId, input, bmdcDocumentPath } = params;

  const existingBmdc = await prisma.doctorProfile.findUnique({
    where: { bmdcNumber: input.bmdcNumber },
  });

  if (existingBmdc && existingBmdc.userId !== userId) {
    throw new Error("This BM&DC registration number is already registered.");
  }

  const [specialty, clinic] = await Promise.all([
    prisma.specialty.findUnique({ where: { id: input.specialtyId } }),
    prisma.clinic.findUnique({ where: { id: input.clinicId } }),
  ]);

  if (!specialty) {
    throw new Error("Selected specialty does not exist.");
  }
  if (!clinic) {
    throw new Error("Selected clinic does not exist.");
  }

  return prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        role: "DOCTOR",
        nameEn: input.titleEn,
        nameBn: input.titleBn,
      },
    });

    const doctorProfile = await tx.doctorProfile.upsert({
      where: { userId },
      create: {
        userId,
        bmdcNumber: input.bmdcNumber,
        status: "PENDING",
        gender: input.gender,
        titleEn: input.titleEn,
        titleBn: input.titleBn,
        qualificationsEn: input.qualificationsEn,
        qualificationsBn: input.qualificationsBn,
        experienceYears: input.experienceYears,
        bioEn: input.bioEn || null,
        bioBn: input.bioBn || null,
        bmdcDocumentPath,
        rejectionReason: null,
      },
      update: {
        bmdcNumber: input.bmdcNumber,
        status: "PENDING",
        gender: input.gender,
        titleEn: input.titleEn,
        titleBn: input.titleBn,
        qualificationsEn: input.qualificationsEn,
        qualificationsBn: input.qualificationsBn,
        experienceYears: input.experienceYears,
        bioEn: input.bioEn || null,
        bioBn: input.bioBn || null,
        bmdcDocumentPath,
        rejectionReason: null,
      },
    });

    await tx.doctorSpecialty.upsert({
      where: {
        doctorId_specialtyId: {
          doctorId: doctorProfile.id,
          specialtyId: specialty.id,
        },
      },
      create: {
        doctorId: doctorProfile.id,
        specialtyId: specialty.id,
        isPrimary: true,
      },
      update: {
        isPrimary: true,
      },
    });

    await tx.chamber.upsert({
      where: {
        doctorId_clinicId: {
          doctorId: doctorProfile.id,
          clinicId: clinic.id,
        },
      },
      create: {
        doctorId: doctorProfile.id,
        clinicId: clinic.id,
        roomNumber: input.roomNumber || "Room 101",
        feeBdt: input.feeBdt,
        followUpFeeBdt: Math.max(300, input.feeBdt - 200),
        slotDurationMin: 15,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startTime: "17:00",
        endTime: "21:00",
      },
      update: {
        roomNumber: input.roomNumber || "Room 101",
        feeBdt: input.feeBdt,
      },
    });

    return { user: updatedUser, doctorProfile };
  });
}

export const doctorUpdateAppointmentSchema = z.object({
  status: z
    .enum(["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .optional(),
  doctorNotes: z.string().trim().max(2000).optional(),
  cancelReason: z.string().trim().max(300).optional(),
});

export async function doctorUpdateAppointment(params: {
  actorUserId: string;
  actorRole: "DOCTOR" | "ADMIN" | "PATIENT";
  appointmentId: string;
  rawInput: unknown;
}) {
  const { actorUserId, actorRole, appointmentId, rawInput } = params;
  const input = doctorUpdateAppointmentSchema.parse(rawInput);

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: true,
      patient: true,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found.");
  }

  if (actorRole !== "ADMIN" && appointment.doctor.userId !== actorUserId) {
    throw new Error("You are not authorized to manage this appointment.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (input.status === "CANCELLED" && appointment.status !== "CANCELLED") {
      await tx.availabilitySlot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false },
      });
    }

    return tx.appointment.update({
      where: { id: appointment.id },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.doctorNotes !== undefined
          ? { doctorNotes: input.doctorNotes || null }
          : {}),
        ...(input.status === "CANCELLED"
          ? {
              cancelledAt: new Date(),
              cancelReason: input.cancelReason || "Rejected by doctor",
              activeSlotKey: null,
            }
          : {}),
      },
    });
  });

  if (input.status) {
    await recordAuditLog({
      actorUserId,
      targetUserId: appointment.patient.userId,
      action: "UPDATE_APPOINTMENT_STATUS",
      entityType: "Appointment",
      entityId: appointment.id,
      details: `Changed appointment status from ${appointment.status} to ${input.status}`,
    });

    await notificationProvider.send({
      userId: appointment.patient.userId,
      titleEn: `Serial #${appointment.serialNumber} Status: ${input.status}`,
      titleBn: `সিরিয়াল #${appointment.serialNumber}-এর অবস্থা: ${input.status}`,
      messageEn: `${appointment.doctor.titleEn} updated your appointment on ${appointment.dateStr} to ${input.status}.`,
      messageBn: `${appointment.doctor.titleBn} আপনার ${appointment.dateStr} তারিখের অ্যাপয়েন্টমেন্টের অবস্থা ${input.status} করেছেন।`,
    });
  }

  if (input.doctorNotes !== undefined) {
    await recordAuditLog({
      actorUserId,
      targetUserId: appointment.patient.userId,
      action: "UPDATE_DOCTOR_NOTES",
      entityType: "Appointment",
      entityId: appointment.id,
      details: "Updated clinical patient notes on appointment",
    });
  }

  return updated;
}

export async function doctorAttachPrescription(params: {
  actorUserId: string;
  actorRole: "DOCTOR" | "ADMIN" | "PATIENT";
  appointmentId: string;
  prescriptionPath: string;
}) {
  const { actorUserId, actorRole, appointmentId, prescriptionPath } = params;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: true,
      patient: true,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found.");
  }

  if (actorRole !== "ADMIN" && appointment.doctor.userId !== actorUserId) {
    throw new Error("You are not authorized to upload a prescription for this appointment.");
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      prescriptionPath,
    },
  });

  await recordAuditLog({
    actorUserId,
    targetUserId: appointment.patient.userId,
    action: "UPLOAD_PRESCRIPTION",
    entityType: "Appointment",
    entityId: appointment.id,
    details: `Uploaded prescription file: ${prescriptionPath}`,
  });

  await notificationProvider.send({
    userId: appointment.patient.userId,
    titleEn: `Prescription Uploaded (Serial #${appointment.serialNumber})`,
    titleBn: `প্রেসক্রিপশন আপলোড হয়েছে (সিরিয়াল #${appointment.serialNumber})`,
    messageEn: `${appointment.doctor.titleEn} uploaded a prescription for your visit on ${appointment.dateStr}.`,
    messageBn: `${appointment.dateStr} তারিখের ভিজিটের জন্য ${appointment.doctor.titleBn} আপনার প্রেসক্রিপশন আপলোড করেছেন।`,
  });

  return updated;
}
