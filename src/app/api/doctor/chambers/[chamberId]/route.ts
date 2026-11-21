import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/session";
import { updateChamberSchedule } from "@/lib/booking/slots";

export async function PATCH(
  req: NextRequest,
  context: { params: { chamberId: string } }
) {
  try {
    const session = await requireRole(["DOCTOR"]);
    const body: unknown = await req.json();

    const updated = await updateChamberSchedule(
      session.userId,
      session.role,
      context.params.chamberId,
      body
    );

    return apiSuccess({ chamber: updated });
  } catch (err) {
    if (
      err instanceof Error &&
      err.message === "You are not authorized to edit this chamber."
    ) {
      return apiError("FORBIDDEN", err.message, 403);
    }
    if (err instanceof Error && err.message === "Chamber not found.") {
      return apiError("NOT_FOUND", err.message, 404);
    }
    return handleApiError(err);
  }
}
