import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { DoctorRegisterClient } from "@/components/doctors/DoctorRegisterClient";

export default async function DoctorRegisterPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/doctor/register");
  }

  const [specialties, clinics, existingDoctor] = await Promise.all([
    prisma.specialty.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.clinic.findMany({
      where: { isActive: true },
      orderBy: [{ cityEn: "asc" }, { nameEn: "asc" }],
    }),
    prisma.doctorProfile.findUnique({
      where: { userId: session.userId },
    }),
  ]);

  if (existingDoctor && session.role === "DOCTOR") {
    redirect("/doctor/dashboard");
  }

  return (
    <DoctorRegisterClient
      userPhone={session.phone}
      specialties={specialties}
      clinics={clinics}
    />
  );
}
