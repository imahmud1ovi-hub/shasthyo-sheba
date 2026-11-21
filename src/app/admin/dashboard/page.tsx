import { redirect } from "next/navigation";
import { AuthorizationError, requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AdminDashboardView } from "@/components/dashboards/AdminDashboardView";

export default async function AdminDashboardPage() {
  let session;
  try {
    session = await requireRole(["ADMIN"]);
  } catch (err) {
    if (err instanceof AuthorizationError && err.code === "UNAUTHENTICATED") {
      redirect("/login?next=/admin/dashboard");
    }
    redirect("/unauthorized");
  }

  const [doctorCount, clinicCount, specialtyCount, appointmentCount] =
    await Promise.all([
      prisma.doctorProfile.count({ where: { status: "APPROVED" } }),
      prisma.clinic.count(),
      prisma.specialty.count(),
      prisma.appointment.count(),
    ]);

  return (
    <AdminDashboardView
      session={session}
      stats={{
        doctorCount,
        clinicCount,
        specialtyCount,
        appointmentCount,
      }}
    />
  );
}
