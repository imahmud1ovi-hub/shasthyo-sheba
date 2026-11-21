import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/session";
import { payForAppointment } from "@/lib/payments/service";

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await requireRole(["PATIENT"]);
    const body: unknown = await req.json().catch(() => ({}));

    const payment = await payForAppointment({
      actorUserId: session.userId,
      actorRole: session.role,
      appointmentId: context.params.id,
      rawInput: body,
    });

    return apiSuccess({ payment });
  } catch (err) {
    return handleApiError(err);
  }
}
