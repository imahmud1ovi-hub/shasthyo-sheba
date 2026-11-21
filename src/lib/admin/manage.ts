import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit/audit-log";
import { notificationProvider } from "@/lib/notifications/notification-provider";

export const reviewDoctorSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().trim().max(400).optional(),
});

export async function reviewDoctorRegistration(params: {
  adminUserId: string;
  doctorProfileId: string;
  rawInput: unknown;
}) {
  const { adminUserId, doctorProfileId, rawInput } = params;
  const input = reviewDoctorSchema.parse(rawInput);

  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: doctorProfileId },
  });

  if (!doctor) {
    throw new Error("Doctor profile not found.");
  }

  const updated = await prisma.doctorProfile.update({
    where: { id: doctor.id },
    data: {
      status: input.status,
      rejectionReason:
        input.status === "REJECTED"
          ? input.rejectionReason || "BM&DC verification unsuccessful."
          : null,
    },
  });

  await recordAuditLog({
    actorUserId: adminUserId,
    targetUserId: doctor.userId,
    action: input.status === "APPROVED" ? "APPROVE_DOCTOR" : "REJECT_DOCTOR",
    entityType: "DoctorProfile",
    entityId: doctor.id,
    details: `Doctor BM&DC ${doctor.bmdcNumber} marked ${input.status}${
      input.rejectionReason ? `: ${input.rejectionReason}` : ""
    }`,
  });

  await notificationProvider.send({
    userId: doctor.userId,
    titleEn:
      input.status === "APPROVED"
        ? "BM&DC Doctor Profile Approved"
        : "BM&DC Doctor Profile Rejected",
    titleBn:
      input.status === "APPROVED"
        ? "বিএমএন্ডডিসি ডাক্তার প্রোফাইল অনুমোদিত হয়েছে"
        : "বিএমএন্ডডিসি ডাক্তার প্রোফাইল প্রত্যাখ্যাত হয়েছে",
    messageEn:
      input.status === "APPROVED"
        ? `Your BM&DC registration (${doctor.bmdcNumber}) has been verified. Your profile is now live in public search.`
        : `Your BM&DC registration (${doctor.bmdcNumber}) was rejected. ${
            input.rejectionReason || ""
          }`,
    messageBn:
      input.status === "APPROVED"
        ? `আপনার বিএমএন্ডডিসি নিবন্ধন (${doctor.bmdcNumber}) যাচাই সম্পন্ন হয়েছে। আপনার প্রোফাইল এখন পাবলিক সার্চে দৃশ্যমান।`
        : `আপনার বিএমএন্ডডিসি নিবন্ধন (${doctor.bmdcNumber}) প্রত্যাখ্যাত হয়েছে। ${
            input.rejectionReason || ""
          }`,
  });

  return updated;
}

export const createSpecialtySchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug must contain lowercase letters, numbers, or hyphens."),
  nameEn: z.string().trim().min(2, "English name is required."),
  nameBn: z.string().trim().min(2, "Bangla name is required."),
  descriptionEn: z.string().trim().max(300).optional(),
  descriptionBn: z.string().trim().max(300).optional(),
});

export async function createSpecialty(rawInput: unknown) {
  const input = createSpecialtySchema.parse(rawInput);
  return prisma.specialty.create({
    data: {
      slug: input.slug,
      nameEn: input.nameEn,
      nameBn: input.nameBn,
      descriptionEn: input.descriptionEn || null,
      descriptionBn: input.descriptionBn || null,
    },
  });
}

export const createClinicSchema = z.object({
  nameEn: z.string().trim().min(2, "English clinic name is required."),
  nameBn: z.string().trim().min(2, "Bangla clinic name is required."),
  cityEn: z.string().trim().min(2, "English city name is required."),
  cityBn: z.string().trim().min(2, "Bangla city name is required."),
  areaEn: z.string().trim().min(2, "English area name is required."),
  areaBn: z.string().trim().min(2, "Bangla area name is required."),
  addressEn: z.string().trim().min(3, "English address is required."),
  addressBn: z.string().trim().min(3, "Bangla address is required."),
  phone: z.string().trim().max(30).optional(),
});

export async function createClinic(rawInput: unknown) {
  const input = createClinicSchema.parse(rawInput);
  return prisma.clinic.create({
    data: {
      nameEn: input.nameEn,
      nameBn: input.nameBn,
      cityEn: input.cityEn,
      cityBn: input.cityBn,
      areaEn: input.areaEn,
      areaBn: input.areaBn,
      addressEn: input.addressEn,
      addressBn: input.addressBn,
      phone: input.phone || null,
      isActive: true,
    },
  });
}
