import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/session";
import { reviewDoctorRegistration } from "@/lib/admin/manage";

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await requireRole(["ADMIN"]);
    const body: unknown = await req.json();

    const updated = await reviewDoctorRegistration({
      adminUserId: session.userId,
      doctorProfileId: context.params.id,
      rawInput: body,
    });

    return apiSuccess({ doctorProfile: updated });
  } catch (err) {
    if (err instanceof Error && err.message === "Doctor profile not found.") {
      return apiError("NOT_FOUND", err.message, 404);
    }
    return handleApiError(err);
  }
}
