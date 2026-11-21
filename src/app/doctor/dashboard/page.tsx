import { redirect } from "next/navigation";
import { AuthorizationError, requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
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
        },
        orderBy: {
          appointmentAt: "asc",
        },
        take: 10,
      },
    },
  });

  return (
    <DoctorDashboardView session={session} doctorProfile={doctorProfile} />
  );
}
