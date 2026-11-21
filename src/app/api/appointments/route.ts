import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/session";
import {
  bookAppointment,
  bookAppointmentSchema,
  listPatientAppointments,
} from "@/lib/booking/appointments";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireRole(["PATIENT"]);
    const appointments = await listPatientAppointments(
      session.userId,
      session.role
    );
    return apiSuccess({ appointments });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["PATIENT"]);
    const body: unknown = await req.json();
    const { slotId, symptoms } = bookAppointmentSchema.parse(body);

    const appointment = await bookAppointment({
      patientUserId: session.userId,
      slotId,
      symptoms,
    });

    return apiSuccess({ appointment }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
