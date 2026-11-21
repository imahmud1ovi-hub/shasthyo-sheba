import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/session";
import {
  cancelAppointment,
  cancelAppointmentSchema,
} from "@/lib/booking/appointments";

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await requireRole(["PATIENT"]);
    const body: unknown = await req.json().catch(() => ({}));
    const { cancelReason } = cancelAppointmentSchema.parse(body);

    const appointment = await cancelAppointment({
      actorUserId: session.userId,
      actorRole: session.role,
      appointmentId: context.params.id,
      cancelReason,
    });

    return apiSuccess({ appointment });
  } catch (err) {
    return handleApiError(err);
  }
}
