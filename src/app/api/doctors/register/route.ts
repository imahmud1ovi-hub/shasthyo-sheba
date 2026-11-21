import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import {
  getSession,
  getSessionCookieOptions,
  signSessionToken,
} from "@/lib/auth/session";
import {
  registerDoctorApplication,
  registerDoctorSchema,
} from "@/lib/doctors/manage";
import { saveUploadedFile } from "@/lib/uploads/storage";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("UNAUTHENTICATED", "Please log in first.", 401);
    }

    const formData = await req.formData();
    const file = formData.get("bmdcDocument");
    if (!(file instanceof File) || file.size === 0) {
      return apiError(
        "VALIDATION_ERROR",
        "BM&DC registration certificate file (PDF or image) is required.",
        400
      );
    }

    const parsedInput = registerDoctorSchema.parse({
      bmdcNumber: formData.get("bmdcNumber"),
      gender: formData.get("gender") || "MALE",
      titleEn: formData.get("titleEn"),
      titleBn: formData.get("titleBn"),
      qualificationsEn: formData.get("qualificationsEn"),
      qualificationsBn: formData.get("qualificationsBn"),
      experienceYears: formData.get("experienceYears"),
      bioEn: formData.get("bioEn") || undefined,
      bioBn: formData.get("bioBn") || undefined,
      specialtyId: formData.get("specialtyId"),
      clinicId: formData.get("clinicId"),
      feeBdt: formData.get("feeBdt"),
      roomNumber: formData.get("roomNumber") || undefined,
    });

    const bmdcDocumentPath = await saveUploadedFile(file, "bmdc");

    const { user, doctorProfile } = await registerDoctorApplication({
      userId: session.userId,
      input: parsedInput,
      bmdcDocumentPath,
    });

    const nextSession = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      preferredLang: user.preferredLang,
      nameEn: user.nameEn,
      nameBn: user.nameBn,
    };

    const token = await signSessionToken(nextSession);
    const response = apiSuccess(
      {
        doctorProfile,
        redirectTo: "/doctor/dashboard",
      },
      201
    );

    const cookieOpts = getSessionCookieOptions();
    response.cookies.set(cookieOpts.name, token, cookieOpts);

    return response;
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("already registered")
    ) {
      return apiError("DUPLICATE_BMDC", err.message, 409);
    }
    return handleApiError(err);
  }
}
