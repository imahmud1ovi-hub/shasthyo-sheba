import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getApprovedDoctorById } from "@/lib/doctors/search";
import { BookAppointmentClient } from "@/components/booking/BookAppointmentClient";

function getTomorrowBdDateStr(): string {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const dd = String(tomorrow.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function BookAppointmentPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { chamberId?: string; date?: string };
}) {
  const [doctor, session] = await Promise.all([
    getApprovedDoctorById(params.id),
    getSession(),
  ]);

  if (!doctor || doctor.chambers.length === 0) {
    notFound();
  }

  const initialChamberId =
    doctor.chambers.find((c) => c.id === searchParams.chamberId)?.id ??
    doctor.chambers[0].id;
  const initialDate =
    searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date)
      ? searchParams.date
      : getTomorrowBdDateStr();

  return (
    <BookAppointmentClient
      doctor={doctor}
      user={session}
      initialChamberId={initialChamberId}
      initialDate={initialDate}
    />
  );
}
