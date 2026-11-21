import { redirect } from "next/navigation";
import { AuthorizationError, requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit/audit-log";
import { DoctorDashboardView } from "@/components/dashboards/DoctorDashboardView";

export default async function DoctorDashboardPage() {
  let session;
  try {
    session = await requireRole(["DOCTOR"]);
  } catch (err) {
    if (err instanceof AuthorizationError && err.code === "UNAUTHENTICATED") {
      redirect("/login?next=/doctor/dashboard");
    }
    redirect("/unauthorized");
  }

  const doctorProfile = await prisma.doctorProfile.findFirst({
    where:
      session.role === "ADMIN"
        ? {}
        : {
            userId: session.userId,
          },
    include: {
      specialties: {
        include: { specialty: true },
      },
      chambers: {
        include: { clinic: true },
      },
      appointments: {
        include: {
          patient: {
            include: { user: true },
          },
          chamber: {
            include: { clinic: true },
          },
        },
        orderBy: {
          appointmentAt: "asc",
        },
        take: 30,
      },
    },
  });

  if (doctorProfile && doctorProfile.appointments.length > 0) {
    await recordAuditLog({
      actorUserId: session.userId,
      action: "VIEW_PATIENT_APPOINTMENTS",
      entityType: "DoctorProfile",
      entityId: doctorProfile.id,
      details: `Viewed ${doctorProfile.appointments.length} patient appointment record(s) on Doctor Dashboard`,
    });
  }

  return (
    <DoctorDashboardView session={session} doctorProfile={doctorProfile} />
  );
}
