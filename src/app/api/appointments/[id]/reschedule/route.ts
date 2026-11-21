import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/session";
import {
  rescheduleAppointment,
  rescheduleAppointmentSchema,
} from "@/lib/booking/appointments";

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await requireRole(["PATIENT"]);
    const body: unknown = await req.json();
    const { newSlotId } = rescheduleAppointmentSchema.parse(body);

    const appointment = await rescheduleAppointment({
      actorUserId: session.userId,
      actorRole: session.role,
      appointmentId: context.params.id,
      newSlotId,
    });

    return apiSuccess({ appointment });
  } catch (err) {
    return handleApiError(err);
  }
}
