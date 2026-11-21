"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { formatBdt } from "@/lib/phone";
import { NavbarUser } from "@/components/Navbar";

interface PatientAppointmentItem {
  id: string;
  dateStr: string;
  startTime: string;
  endTime: string;
  serialNumber: number;
  feeBdt: number;
  status: string;
  doctor: {
    titleEn: string;
    titleBn: string;
    bmdcNumber: string;
    specialties: Array<{
      specialty: {
        nameEn: string;
        nameBn: string;
      };
    }>;
  };
  chamber: {
    roomNumber: string | null;
    clinic: {
      nameEn: string;
      nameBn: string;
      cityEn: string;
      cityBn: string;
      areaEn: string;
      areaBn: string;
    };
  };
  payment: {
    status: string;
    method: string;
  } | null;
}

export function PatientDashboardView({
  session,
  appointments,
}: {
  session: NavbarUser;
  appointments: PatientAppointmentItem[];
}) {
  const { lang, t } = useLanguage();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          {t.roleBadge[session.role]} • {session.phone}
        </span>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          {t.dashboards.patientTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {t.dashboards.patientSubtitle}
        </p>
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-slate-900">
          {t.dashboards.upcomingAppointments}
        </h2>

        {appointments.length === 0 ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            {t.dashboards.noAppointments}
          </div>
        ) : (
          <div className="mt-3 grid gap-4">
            {appointments.map((appt) => {
              const docName =
                lang === "bn" ? appt.doctor.titleBn : appt.doctor.titleEn;
              const spec = appt.doctor.specialties[0]?.specialty;
              const specName = spec
                ? lang === "bn"
                  ? spec.nameBn
                  : spec.nameEn
                : "";
              const clinicName =
                lang === "bn"
                  ? appt.chamber.clinic.nameBn
                  : appt.chamber.clinic.nameEn;
              const areaCity =
                lang === "bn"
                  ? `${appt.chamber.clinic.areaBn}, ${appt.chamber.clinic.cityBn}`
                  : `${appt.chamber.clinic.areaEn}, ${appt.chamber.clinic.cityEn}`;

              return (
                <div
                  key={appt.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
                        {t.dashboards.serialLabel}
                        {appt.serialNumber}
                      </span>
                      <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {appt.status}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-bold text-slate-900">
                      {docName}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {specName} • BM&DC: {appt.doctor.bmdcNumber}
                    </p>
                    <p className="mt-1 text-xs sm:text-sm text-slate-700">
                      {clinicName} ({areaCity})
                      {appt.chamber.roomNumber
                        ? ` • ${appt.chamber.roomNumber}`
                        : ""}
                    </p>
                  </div>

                  <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <p className="text-sm font-bold text-slate-900">
                      {appt.dateStr} • {appt.startTime} - {appt.endTime}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-700">
                      {t.dashboards.feeLabel}: {formatBdt(appt.feeBdt)}
                    </p>
                    {appt.payment && (
                      <p className="text-xs text-slate-500">
                        {appt.payment.method} ({appt.payment.status})
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
