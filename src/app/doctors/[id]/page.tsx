import { notFound } from "next/navigation";
import { getApprovedDoctorById } from "@/lib/doctors/search";
import { DoctorProfileClient } from "@/components/doctors/DoctorProfileClient";

export default async function DoctorProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const doctor = await getApprovedDoctorById(params.id);

  if (!doctor) {
    notFound();
  }

  return <DoctorProfileClient doctor={doctor} />;
}
