import { redirect } from "next/navigation";
import { AuthorizationError, requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
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

  return <PatientDashboardView session={session} appointments={appointments} />;
}
