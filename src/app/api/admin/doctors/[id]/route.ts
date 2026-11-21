import { NextRequest } from "next/server";
import {
  apiError,
  apiSuccess,
  handleApiError,
  idParamSchema,
} from "@/lib/api-response";
import { requireRole } from "@/lib/auth/session";
import { reviewDoctorRegistration } from "@/lib/admin/manage";

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await requireRole(["ADMIN"]);
    const { id } = idParamSchema.parse(context.params);
    const body: unknown = await req.json();

    const updated = await reviewDoctorRegistration({
      adminUserId: session.userId,
      doctorProfileId: id,
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
