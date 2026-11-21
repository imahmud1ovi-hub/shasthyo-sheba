import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/session";
import { submitAppointmentReview } from "@/lib/reviews/service";

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await requireRole(["PATIENT"]);
    const body: unknown = await req.json();

    const result = await submitAppointmentReview({
      actorUserId: session.userId,
      actorRole: session.role,
      appointmentId: context.params.id,
      rawInput: body,
    });

    return apiSuccess(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
