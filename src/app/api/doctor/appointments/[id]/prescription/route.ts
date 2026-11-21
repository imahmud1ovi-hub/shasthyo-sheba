import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/session";
import { doctorAttachPrescription } from "@/lib/doctors/manage";
import { saveUploadedFile } from "@/lib/uploads/storage";

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await requireRole(["DOCTOR"]);
    const formData = await req.formData();
    const file = formData.get("prescription");

    if (!(file instanceof File) || file.size === 0) {
      return apiError(
        "VALIDATION_ERROR",
        "Please select a PDF or image prescription file.",
        400
      );
    }

    const prescriptionPath = await saveUploadedFile(file, "prescriptions");
    const updated = await doctorAttachPrescription({
      actorUserId: session.userId,
      actorRole: session.role,
      appointmentId: context.params.id,
      prescriptionPath,
    });

    return apiSuccess({ appointment: updated });
  } catch (err) {
    if (err instanceof Error && err.message.includes("not authorized")) {
      return apiError("FORBIDDEN", err.message, 403);
    }
    if (err instanceof Error && err.message === "Appointment not found.") {
      return apiError("NOT_FOUND", err.message, 404);
    }
    return handleApiError(err);
  }
}
