import { redirect } from "next/navigation";
import { AuthorizationError, requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit/audit-log";
import { PatientDashboardView } from "@/components/dashboards/PatientDashboardView";

export default async function PatientDashboardPage() {
  let session;
  try {
    session = await requireRole(["PATIENT"]);
  } catch (err) {
    if (err instanceof AuthorizationError && err.code === "UNAUTHENTICATED") {
      redirect("/login?next=/patient/dashboard");
    }
    redirect("/unauthorized");
  }

  const appointments = await prisma.appointment.findMany({
    where:
      session.role === "ADMIN"
        ? {}
        : {
            patient: {
              userId: session.userId,
            },
          },
    include: {
      doctor: {
        include: {
          specialties: {
            include: { specialty: true },
          },
        },
      },
      chamber: {
        include: {
          clinic: true,
        },
      },
      payment: true,
    },
    orderBy: {
      appointmentAt: "asc",
    },
    take: 10,
  });

  if (session.role === "ADMIN" && appointments.length > 0) {
    await recordAuditLog({
      actorUserId: session.userId,
      action: "VIEW_PATIENT_APPOINTMENTS",
      entityType: "PatientProfile",
      entityId: "ADMIN_DASHBOARD_VIEW",
      details: `Admin viewed ${appointments.length} patient appointment(s) on Patient Dashboard`,
    });
  }

  return <PatientDashboardView session={session} appointments={appointments} />;
}
