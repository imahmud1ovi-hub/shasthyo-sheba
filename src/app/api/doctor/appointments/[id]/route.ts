import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/session";
import { doctorUpdateAppointment } from "@/lib/doctors/manage";

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await requireRole(["DOCTOR"]);
    const body: unknown = await req.json();

    const updated = await doctorUpdateAppointment({
      actorUserId: session.userId,
      actorRole: session.role,
      appointmentId: context.params.id,
      rawInput: body,
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
