"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { NavbarUser } from "@/components/Navbar";

interface AdminDoctorItem {
  id: string;
  bmdcNumber: string;
  status: string;
  titleEn: string;
  titleBn: string;
  qualificationsEn: string;
  qualificationsBn: string;
  bmdcDocumentPath: string | null;
  user: { phone: string };
  specialties: Array<{
    specialty: {
      nameEn: string;
      nameBn: string;
    };
  }>;
}

interface SpecialtyItem {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
}

interface ClinicItem {
  id: string;
  nameEn: string;
  nameBn: string;
  cityEn: string;
  cityBn: string;
  areaEn: string;
  areaBn: string;
  addressEn: string;
  addressBn: string;
}

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string | null;
  createdAt: Date | string;
  actor: { phone: string; role: string };
  targetUser: { phone: string; role: string } | null;
}

export function AdminDashboardView({
  session,
  stats,
  doctors,
  specialties,
  clinics,
  auditLogs,
}: {
  session: NavbarUser;
  stats: {
    approvedDoctorCount: number;
    pendingDoctorCount: number;
    patientCount: number;
    clinicCount: number;
    specialtyCount: number;
    appointmentCount: number;
  };
  doctors: AdminDoctorItem[];
  specialties: SpecialtyItem[];
  clinics: ClinicItem[];
  auditLogs: AuditLogItem[];
}) {
  const { lang, t } = useLanguage();
  const router = useRouter();

  const [busyDoctorId, setBusyDoctorId] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Add Specialty form
  const [specSlug, setSpecSlug] = useState("");
  const [specNameEn, setSpecNameEn] = useState("");
  const [specNameBn, setSpecNameBn] = useState("");
  const [addingSpec, setAddingSpec] = useState(false);

  // Add Clinic form
  const [clinicNameEn, setClinicNameEn] = useState("");
  const [clinicNameBn, setClinicNameBn] = useState("");
  const [cityEn, setCityEn] = useState("Dhaka");
  const [cityBn, setCityBn] = useState("ঢাকা");
  const [areaEn, setAreaEn] = useState("");
  const [areaBn, setAreaBn] = useState("");
  const [addressEn, setAddressEn] = useState("");
  const [addressBn, setAddressBn] = useState("");
  const [addingClinic, setAddingClinic] = useState(false);

  const handleReviewDoctor = async (
    doctorId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    setBusyDoctorId(doctorId);
    setAdminError(null);
    try {
      const res = await fetch(`/api/admin/doctors/${doctorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setAdminError(json.error?.message || "Failed to update doctor status.");
        return;
      }
      router.refresh();
    } catch {
      setAdminError("Network error while updating doctor status.");
    } finally {
      setBusyDoctorId(null);
    }
  };

  const handleAddSpecialty = async (e: FormEvent) => {
    e.preventDefault();
    setAddingSpec(true);
    setAdminError(null);
    try {
      const res = await fetch("/api/admin/specialties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: specSlug,
          nameEn: specNameEn,
          nameBn: specNameBn,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setAdminError(json.error?.message || "Failed to add specialty.");
        return;
      }
      setSpecSlug("");
      setSpecNameEn("");
      setSpecNameBn("");
      router.refresh();
    } catch {
      setAdminError("Network error while adding specialty.");
    } finally {
      setAddingSpec(false);
    }
  };

  const handleAddClinic = async (e: FormEvent) => {
    e.preventDefault();
    setAddingClinic(true);
    setAdminError(null);
    try {
      const res = await fetch("/api/admin/clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameEn: clinicNameEn,
          nameBn: clinicNameBn,
          cityEn,
          cityBn,
          areaEn,
          areaBn,
          addressEn,
          addressBn,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setAdminError(json.error?.message || "Failed to add clinic.");
        return;
      }
      setClinicNameEn("");
      setClinicNameBn("");
      setAreaEn("");
      setAreaBn("");
      setAddressEn("");
      setAddressBn("");
      router.refresh();
    } catch {
      setAdminError("Network error while adding clinic.");
    } finally {
      setAddingClinic(false);
    }
  };

  const pendingDoctors = doctors.filter((d) => d.status === "PENDING");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
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

      {adminError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm text-red-700"
        >
          {adminError}
        </div>
      )}

      {/* Metrics Overview */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs font-semibold text-amber-800">
            {t.adminPortal.pendingDoctorsStat}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-amber-900">
            {stats.pendingDoctorCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            {t.dashboards.adminStatsDoctors}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {stats.approvedDoctorCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            {t.adminPortal.totalPatientsStat}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {stats.patientCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            {t.dashboards.adminStatsClinics}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {stats.clinicCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            {t.dashboards.adminStatsSpecialties}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {stats.specialtyCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            {t.dashboards.adminStatsAppointments}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {stats.appointmentCount}
          </p>
        </div>
      </section>

      {/* Pending Doctor Approvals Queue */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">
          {t.adminPortal.pendingApprovalsTitle} ({pendingDoctors.length})
        </h2>

        {pendingDoctors.length === 0 ? (
          <p className="mt-3 text-xs sm:text-sm text-slate-500">
            {t.adminPortal.noPendingDoctors}
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {pendingDoctors.map((doc) => (
              <div
                key={doc.id}
                className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                      BM&DC: {doc.bmdcNumber}
                    </span>
                    <span className="text-xs text-slate-600">
                      {doc.user.phone}
                    </span>
                  </div>
                  <h3 className="mt-1 text-sm sm:text-base font-bold text-slate-900">
                    {lang === "bn" ? doc.titleBn : doc.titleEn}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {lang === "bn"
                      ? doc.qualificationsBn
                      : doc.qualificationsEn}
                  </p>
                  {doc.bmdcDocumentPath && (
                    <a
                      href={`/api/uploads/${doc.bmdcDocumentPath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center rounded-lg bg-white border border-slate-300 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-slate-50"
                    >
                      {t.adminPortal.viewBmdcDocLink}
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busyDoctorId === doc.id}
                    onClick={() => handleReviewDoctor(doc.id, "APPROVED")}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {t.adminPortal.approveBtn}
                  </button>
                  <button
                    type="button"
                    disabled={busyDoctorId === doc.id}
                    onClick={() => handleReviewDoctor(doc.id, "REJECTED")}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    {t.adminPortal.rejectBtn}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Compact list of all doctors */}
        <details className="mt-5 pt-4 border-t border-slate-100">
          <summary className="cursor-pointer text-xs sm:text-sm font-bold text-slate-700">
            {t.adminPortal.allDoctorsTitle} ({doctors.length})
          </summary>
          <div className="mt-3 grid gap-2 max-h-72 overflow-y-auto">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">
                    {lang === "bn" ? doc.titleBn : doc.titleEn}
                  </span>{" "}
                  ({doc.bmdcNumber}) • {doc.user.phone}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-white px-2 py-0.5 font-semibold border border-slate-200">
                    {doc.status}
                  </span>
                  {doc.status !== "APPROVED" && (
                    <button
                      type="button"
                      onClick={() => handleReviewDoctor(doc.id, "APPROVED")}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      {t.adminPortal.approveBtn}
                    </button>
                  )}
                  {doc.status !== "REJECTED" && (
                    <button
                      type="button"
                      onClick={() => handleReviewDoctor(doc.id, "REJECTED")}
                      className="text-red-600 font-bold hover:underline"
                    >
                      {t.adminPortal.rejectBtn}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </details>
      </section>

      {/* Manage Specialties & Clinics */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Specialties Manager */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            {t.adminPortal.manageSpecialtiesTitle}
          </h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {specialties.map((s) => (
              <span
                key={s.id}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800"
              >
                {s.nameEn} / {s.nameBn}
              </span>
            ))}
          </div>

          <form onSubmit={handleAddSpecialty} className="mt-4 space-y-2.5">
            <input
              type="text"
              required
              value={specSlug}
              onChange={(e) => setSpecSlug(e.target.value)}
              placeholder="slug (e.g. dermatology)"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
            <input
              type="text"
              required
              value={specNameEn}
              onChange={(e) => setSpecNameEn(e.target.value)}
              placeholder="English Name (e.g. Dermatology)"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
            <input
              type="text"
              required
              value={specNameBn}
              onChange={(e) => setSpecNameBn(e.target.value)}
              placeholder="বাংলা নাম (যেমন: চর্মরোগ বিশেষজ্ঞ)"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
            <button
              type="submit"
              disabled={addingSpec}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {t.adminPortal.addSpecialtyBtn}
            </button>
          </form>
        </section>

        {/* Clinics & Cities Manager */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            {t.adminPortal.manageClinicsTitle}
          </h2>
          <div className="mt-3 max-h-32 overflow-y-auto space-y-1 text-xs text-slate-700">
            {clinics.map((c) => (
              <div key={c.id} className="truncate">
                • <span className="font-semibold">{c.nameEn}</span> ({c.areaEn},{" "}
                {c.cityEn})
              </div>
            ))}
          </div>

          <form onSubmit={handleAddClinic} className="mt-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={clinicNameEn}
                onChange={(e) => setClinicNameEn(e.target.value)}
                placeholder="Clinic Name (EN)"
                className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                required
                value={clinicNameBn}
                onChange={(e) => setClinicNameBn(e.target.value)}
                placeholder="ক্লিনিকের নাম (বাংলা)"
                className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={cityEn}
                onChange={(e) => setCityEn(e.target.value)}
                placeholder="City (EN)"
                className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                required
                value={cityBn}
                onChange={(e) => setCityBn(e.target.value)}
                placeholder="শহর (বাংলা)"
                className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={areaEn}
                onChange={(e) => setAreaEn(e.target.value)}
                placeholder="Area (EN)"
                className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                required
                value={areaBn}
                onChange={(e) => setAreaBn(e.target.value)}
                placeholder="এলাকা (বাংলা)"
                className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={addressEn}
                onChange={(e) => setAddressEn(e.target.value)}
                placeholder="Address (EN)"
                className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                required
                value={addressBn}
                onChange={(e) => setAddressBn(e.target.value)}
                placeholder="ঠিকানা (বাংলা)"
                className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={addingClinic}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {t.adminPortal.addClinicBtn}
            </button>
          </form>
        </section>
      </div>

      {/* AuditLog Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">
          {t.adminPortal.auditLogTitle}
        </h2>
        {auditLogs.length === 0 ? (
          <p className="mt-3 text-xs sm:text-sm text-slate-500">
            {t.adminPortal.noAuditLogs}
          </p>
        ) : (
          <div className="mt-3 grid gap-2 max-h-72 overflow-y-auto">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
              >
                <div>
                  <span className="font-mono font-bold text-emerald-800">
                    {log.action}
                  </span>{" "}
                  • <span className="font-semibold">{log.entityType}</span> •{" "}
                  <span className="text-slate-600">
                    Actor: {log.actor.phone} ({log.actor.role})
                  </span>
                  {log.targetUser && (
                    <span className="text-slate-600">
                      {" "}
                      → Target: {log.targetUser.phone}
                    </span>
                  )}
                  {log.details && (
                    <p className="text-slate-500 mt-0.5">{log.details}</p>
                  )}
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Admin Cross-Access Links */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
            className="rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-emerald-50"
          >
            {t.dashboards.viewDoctorArea}
          </Link>
        </div>
      </section>
    </main>
  );
}
