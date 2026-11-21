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

  const [
    approvedDoctorCount,
    pendingDoctorCount,
    patientCount,
    clinicCount,
    specialtyCount,
    appointmentCount,
    doctors,
    specialties,
    clinics,
    auditLogs,
  ] = await Promise.all([
    prisma.doctorProfile.count({ where: { status: "APPROVED" } }),
    prisma.doctorProfile.count({ where: { status: "PENDING" } }),
    prisma.patientProfile.count(),
    prisma.clinic.count(),
    prisma.specialty.count(),
    prisma.appointment.count(),
    prisma.doctorProfile.findMany({
      include: {
        user: { select: { phone: true } },
        specialties: { include: { specialty: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.specialty.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.clinic.findMany({
      orderBy: [{ cityEn: "asc" }, { nameEn: "asc" }],
    }),
    prisma.auditLog.findMany({
      include: {
        actor: { select: { phone: true, role: true } },
        targetUser: { select: { phone: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  return (
    <AdminDashboardView
      session={session}
      stats={{
        approvedDoctorCount,
        pendingDoctorCount,
        patientCount,
        clinicCount,
        specialtyCount,
        appointmentCount,
      }}
      doctors={doctors}
      specialties={specialties}
      clinics={clinics}
      auditLogs={auditLogs}
    />
  );
}
