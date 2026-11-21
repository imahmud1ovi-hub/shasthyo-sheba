import { redirect } from "next/navigation";
import { AuthorizationError, requireRole } from "@/lib/auth/session";
import { listPatientAppointments } from "@/lib/booking/appointments";
import { prisma } from "@/lib/db/prisma";
import { MyAppointmentsClient } from "@/components/booking/MyAppointmentsClient";

export default async function MyAppointmentsPage() {
  let session;
  try {
    session = await requireRole(["PATIENT"]);
  } catch (err) {
    if (err instanceof AuthorizationError && err.code === "UNAUTHENTICATED") {
      redirect("/login?next=/patient/appointments");
    }
    redirect("/unauthorized");
  }

  const [appointments, notifications] = await Promise.all([
    listPatientAppointments(session.userId, session.role),
    prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  return (
    <MyAppointmentsClient
      appointments={appointments}
      notifications={notifications}
    />
  );
}
