"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { NavbarUser } from "@/components/Navbar";

export function AdminDashboardView({
  session,
  stats,
}: {
  session: NavbarUser;
  stats: {
    doctorCount: number;
    clinicCount: number;
    specialtyCount: number;
    appointmentCount: number;
  };
}) {
  const { t } = useLanguage();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          {t.roleBadge[session.role]} • {session.phone}
        </span>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          {t.dashboards.adminTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {t.dashboards.adminSubtitle}
        </p>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            {t.dashboards.adminStatsDoctors}
          </p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {stats.doctorCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            {t.dashboards.adminStatsClinics}
          </p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {stats.clinicCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            {t.dashboards.adminStatsSpecialties}
          </p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {stats.specialtyCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            {t.dashboards.adminStatsAppointments}
          </p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {stats.appointmentCount}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">
          {t.dashboards.adminQuickLinks}
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/patient/dashboard"
            className="rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            {t.dashboards.viewPatientArea}
          </Link>
          <Link
            href="/doctor/dashboard"
            className="rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            {t.dashboards.viewDoctorArea}
          </Link>
        </div>
      </section>
    </main>
  );
}
