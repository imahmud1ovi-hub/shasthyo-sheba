import Link from "next/link";
import { notFound } from "next/navigation";
import { getApprovedDoctorById } from "@/lib/doctors/search";
import { formatBdt } from "@/lib/phone";

export default async function BookAppointmentPlaceholderPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { chamberId?: string };
}) {
  const doctor = await getApprovedDoctorById(params.id);
  if (!doctor) {
    notFound();
  }

  const chamber =
    doctor.chambers.find((c) => c.id === searchParams.chamberId) ??
    doctor.chambers[0];

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          Chamber Serial Booking • চেম্বার সিরিয়াল বুকিং
        </span>
        <h1 className="mt-3 text-xl sm:text-2xl font-bold text-slate-900">
          {doctor.titleEn} ({doctor.titleBn})
        </h1>
        {chamber && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-sm text-slate-700 space-y-1">
            <p className="font-bold text-slate-900">
              {chamber.clinic.nameEn} — {chamber.clinic.nameBn}
            </p>
            <p>
              {chamber.clinic.areaEn}, {chamber.clinic.cityEn} •{" "}
              {chamber.startTime} - {chamber.endTime}
            </p>
            <p className="font-semibold text-emerald-700">
              Fee / ফি: {formatBdt(chamber.feeBdt)}
            </p>
          </div>
        )}
        <p className="mt-4 text-sm text-slate-600">
          Slot generation and interactive serial booking are activated in Phase
          3.
        </p>
        <div className="mt-6">
          <Link
            href={`/doctors/${doctor.id}`}
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Back to Doctor Profile
          </Link>
        </div>
      </div>
    </main>
  );
}
