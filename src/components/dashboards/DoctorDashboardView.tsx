"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { formatBdt } from "@/lib/phone";
import { NavbarUser } from "@/components/Navbar";

interface DoctorProfileData {
  id: string;
  bmdcNumber: string;
  status: string;
  titleEn: string;
  titleBn: string;
  qualificationsEn: string;
  qualificationsBn: string;
  specialties: Array<{
    specialty: {
      nameEn: string;
      nameBn: string;
    };
  }>;
  chambers: Array<{
    id: string;
    roomNumber: string | null;
    feeBdt: number;
    startTime: string;
    endTime: string;
    slotDurationMin: number;
    clinic: {
      nameEn: string;
      nameBn: string;
      cityEn: string;
      cityBn: string;
      areaEn: string;
      areaBn: string;
    };
  }>;
  appointments: Array<{
    id: string;
    dateStr: string;
    startTime: string;
    serialNumber: number;
    status: string;
    feeBdt: number;
    patient: {
      user: {
        nameEn: string | null;
        nameBn: string | null;
        phone: string;
      };
    };
  }>;
}

export function DoctorDashboardView({
  session,
  doctorProfile,
}: {
  session: NavbarUser;
  doctorProfile: DoctorProfileData | null;
}) {
  const { lang, t } = useLanguage();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          {t.roleBadge[session.role]} • {session.phone}
        </span>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          {t.dashboards.doctorTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {t.dashboards.doctorSubtitle}
        </p>

        {doctorProfile && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid gap-2 sm:grid-cols-3 text-xs sm:text-sm">
            <div>
              <span className="text-slate-500">{t.dashboards.bmdcLabel}: </span>
              <span className="font-bold text-slate-900">
                {doctorProfile.bmdcNumber} ({doctorProfile.status})
              </span>
            </div>
            <div>
              <span className="text-slate-500">
                {t.dashboards.specialtyLabel}:{" "}
              </span>
              <span className="font-bold text-slate-900">
                {lang === "bn"
                  ? doctorProfile.specialties[0]?.specialty.nameBn
                  : doctorProfile.specialties[0]?.specialty.nameEn}
              </span>
            </div>
            <div className="text-slate-700 font-medium">
              {lang === "bn"
                ? doctorProfile.qualificationsBn
                : doctorProfile.qualificationsEn}
            </div>
          </div>
        )}
      </div>

      {doctorProfile && (
        <section className="mt-6">
          <h2 className="text-lg font-bold text-slate-900">
            {t.dashboards.chambersTitle}
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {doctorProfile.chambers.map((ch) => (
              <div
                key={ch.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-base font-bold text-slate-900">
                  {lang === "bn" ? ch.clinic.nameBn : ch.clinic.nameEn}
                </h3>
                <p className="text-xs text-slate-600">
                  {lang === "bn"
                    ? `${ch.clinic.areaBn}, ${ch.clinic.cityBn}`
                    : `${ch.clinic.areaEn}, ${ch.clinic.cityEn}`}
                  {ch.roomNumber ? ` • ${ch.roomNumber}` : ""}
                </p>
                <p className="mt-2 text-sm font-semibold text-emerald-700">
                  {t.dashboards.feeLabel}: {formatBdt(ch.feeBdt)} •{" "}
                  {ch.startTime} - {ch.endTime} ({ch.slotDurationMin}m)
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
