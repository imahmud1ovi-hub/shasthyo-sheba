"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { DAY_NAMES } from "@/lib/i18n/translations";
import { formatBdt } from "@/lib/phone";
import { NavbarUser } from "@/components/Navbar";

interface ChamberScheduleItem {
  id: string;
  roomNumber: string | null;
  feeBdt: number;
  followUpFeeBdt: number;
  startTime: string;
  endTime: string;
  slotDurationMin: number;
  daysOfWeek: number[];
  blockedDates: string[];
  clinic: {
    nameEn: string;
    nameBn: string;
    cityEn: string;
    cityBn: string;
    areaEn: string;
    areaBn: string;
  };
}

interface DoctorAppointmentItem {
  id: string;
  dateStr: string;
  startTime: string;
  endTime: string;
  serialNumber: number;
  status: string;
  feeBdt: number;
  symptoms: string | null;
  doctorNotes: string | null;
  prescriptionPath: string | null;
  chamber: {
    clinic: {
      nameEn: string;
      nameBn: string;
    };
  };
  patient: {
    user: {
      nameEn: string | null;
      nameBn: string | null;
      phone: string;
    };
  };
}

interface DoctorProfileData {
  id: string;
  bmdcNumber: string;
  status: string;
  rejectionReason: string | null;
  bmdcDocumentPath: string | null;
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
  chambers: ChamberScheduleItem[];
  appointments: DoctorAppointmentItem[];
}

function DoctorAppointmentCard({ appt }: { appt: DoctorAppointmentItem }) {
  const { lang, t } = useLanguage();
  const router = useRouter();

  const [notes, setNotes] = useState(appt.doctorNotes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patientName =
    (lang === "bn"
      ? appt.patient.user.nameBn || appt.patient.user.nameEn
      : appt.patient.user.nameEn || appt.patient.user.nameBn) ||
    appt.patient.user.phone;

  const handleStatusUpdate = async (
    nextStatus: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
  ) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/doctor/appointments/${appt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error?.message || "Failed to update appointment.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveNotes = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/doctor/appointments/${appt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorNotes: notes }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error?.message || "Failed to save notes.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const handleUploadPrescription = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("prescription", file);
      const res = await fetch(
        `/api/doctor/appointments/${appt.id}/prescription`,
        {
          method: "POST",
          body: formData,
        }
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error?.message || "Failed to upload prescription.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error while uploading prescription.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
              {t.dashboards.serialLabel}
              {appt.serialNumber}
            </span>
            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
              {appt.status}
            </span>
            <span className="text-xs font-bold text-slate-700">
              {appt.dateStr} • {appt.startTime} - {appt.endTime}
            </span>
          </div>

          <h3 className="mt-2 text-base font-bold text-slate-900">
            {patientName}
          </h3>
          <p className="text-xs text-slate-600">
            {t.doctorPortal.patientPhoneLabel}: {appt.patient.user.phone} •{" "}
            {lang === "bn"
              ? appt.chamber.clinic.nameBn
              : appt.chamber.clinic.nameEn}
          </p>
          {appt.symptoms && (
            <p className="mt-1 text-xs text-slate-700">
              <span className="font-semibold">
                {t.doctorPortal.symptomsLabel}:{" "}
              </span>
              {appt.symptoms}
            </p>
          )}
        </div>

        {/* Status Actions */}
        <div className="flex flex-wrap gap-1.5">
          {appt.status === "PENDING" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => handleStatusUpdate("CONFIRMED")}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {t.doctorPortal.acceptBtn}
            </button>
          )}
          {(appt.status === "CONFIRMED" || appt.status === "PENDING") && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleStatusUpdate("COMPLETED")}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {t.doctorPortal.completeBtn}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleStatusUpdate("NO_SHOW")}
                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              >
                {t.doctorPortal.noShowBtn}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleStatusUpdate("CANCELLED")}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                {t.doctorPortal.rejectBtn}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Clinical Notes & Prescription Upload */}
      <div className="grid gap-4 sm:grid-cols-2 pt-3 border-t border-slate-100">
        <div>
          <label className="block text-xs font-bold text-slate-700">
            {t.doctorPortal.notesLabel}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.doctorPortal.notesPlaceholder}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
          />
          <button
            type="button"
            disabled={busy}
            onClick={handleSaveNotes}
            className="mt-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50"
          >
            {t.doctorPortal.saveNotesBtn}
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">
            {t.doctorPortal.prescriptionLabel}
          </label>
          <input
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) =>
              handleUploadPrescription(e.target.files?.[0] ?? null)
            }
            className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs"
          />
          {appt.prescriptionPath && (
            <a
              href={`/api/uploads/${appt.prescriptionPath}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              {t.doctorPortal.viewPrescriptionBtn}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ChamberScheduleEditorCard({
  chamber,
}: {
  chamber: ChamberScheduleItem;
}) {
  const { lang, t } = useLanguage();
  const router = useRouter();

  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(chamber.daysOfWeek);
  const [startTime, setStartTime] = useState(chamber.startTime);
  const [endTime, setEndTime] = useState(chamber.endTime);
  const [slotDurationMin, setSlotDurationMin] = useState(
    chamber.slotDurationMin
  );
  const [feeBdt, setFeeBdt] = useState(chamber.feeBdt);
  const [blockedDates, setBlockedDates] = useState<string[]>(
    chamber.blockedDates ?? []
  );
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (dayIdx: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(dayIdx)
        ? prev.filter((d) => d !== dayIdx)
        : [...prev, dayIdx].sort((a, b) => a - b)
    );
  };

  const handleAddBlockedDate = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newBlockedDate)) return;
    if (!blockedDates.includes(newBlockedDate)) {
      setBlockedDates((prev) => [...prev, newBlockedDate].sort());
    }
    setNewBlockedDate("");
  };

  const handleRemoveBlockedDate = (dateToRemove: string) => {
    setBlockedDates((prev) => prev.filter((d) => d !== dateToRemove));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/doctor/chambers/${chamber.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feeBdt: Number(feeBdt),
          slotDurationMin: Number(slotDurationMin),
          daysOfWeek,
          startTime,
          endTime,
          blockedDates,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error?.message || "Failed to update schedule.");
        return;
      }
      setMessage(t.dashboards.scheduleSavedMsg);
      router.refresh();
    } catch {
      setError("Network error while saving chamber schedule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            {lang === "bn" ? chamber.clinic.nameBn : chamber.clinic.nameEn}
          </h3>
          <p className="text-xs text-slate-600">
            {lang === "bn"
              ? `${chamber.clinic.areaBn}, ${chamber.clinic.cityBn}`
              : `${chamber.clinic.areaEn}, ${chamber.clinic.cityEn}`}
            {chamber.roomNumber ? ` • ${chamber.roomNumber}` : ""}
          </p>
        </div>
        <span className="text-sm font-extrabold text-emerald-700">
          {formatBdt(feeBdt)}
        </span>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {message}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700">
          {t.dashboards.visitingDaysLabel}
        </label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DAY_NAMES[lang].map((dayLabel, idx) => {
            const active = daysOfWeek.includes(idx);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggleDay(idx)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {dayLabel}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700">
            {t.dashboards.startTimeLabel}
          </label>
          <input
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-2.5 py-2 text-xs sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700">
            {t.dashboards.endTimeLabel}
          </label>
          <input
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-2.5 py-2 text-xs sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700">
            {t.dashboards.slotDurationLabel}
          </label>
          <select
            value={slotDurationMin}
            onChange={(e) => setSlotDurationMin(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs sm:text-sm"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700">
            {t.dashboards.feeBdtLabel}
          </label>
          <input
            type="number"
            min={0}
            step={50}
            required
            value={feeBdt}
            onChange={(e) => setFeeBdt(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-300 px-2.5 py-2 text-xs sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700">
          {t.dashboards.blockedDatesLabel}
        </label>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={newBlockedDate}
            onChange={(e) => setNewBlockedDate(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs"
          />
          <button
            type="button"
            onClick={handleAddBlockedDate}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
          >
            {t.dashboards.addBlockedDateBtn}
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {blockedDates.length === 0 ? (
            <span className="text-xs text-slate-400">
              {t.dashboards.noBlockedDates}
            </span>
          ) : (
            blockedDates.map((d) => (
              <span
                key={d}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-mono text-amber-900"
              >
                {d}
                <button
                  type="button"
                  onClick={() => handleRemoveBlockedDate(d)}
                  className="font-bold text-amber-700 hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? t.dashboards.savingSchedule : t.dashboards.saveScheduleBtn}
        </button>
      </div>
    </form>
  );
}

export function DoctorDashboardView({
  session,
  doctorProfile,
}: {
  session: NavbarUser;
  doctorProfile: DoctorProfileData | null;
}) {
  const { lang, t } = useLanguage();
  const [apptTab, setApptTab] = useState<"TODAY" | "ALL">("ALL");

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;

  const appointments = doctorProfile?.appointments ?? [];
  const todayAppointments = appointments.filter((a) => a.dateStr === todayStr);
  const displayedAppointments =
    apptTab === "TODAY" ? todayAppointments : appointments;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Status Banner for PENDING / REJECTED doctors */}
      {doctorProfile && doctorProfile.status === "PENDING" && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
          <h2 className="text-sm sm:text-base font-bold text-amber-900">
            {t.doctorPortal.pendingBannerTitle}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-amber-800">
            {t.doctorPortal.pendingBannerDesc}
          </p>
        </div>
      )}

      {doctorProfile && doctorProfile.status === "REJECTED" && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-5 shadow-sm">
          <h2 className="text-sm sm:text-base font-bold text-red-900">
            {t.doctorPortal.rejectedBannerTitle}
          </h2>
          {doctorProfile.rejectionReason && (
            <p className="mt-1 text-xs sm:text-sm text-red-800">
              {doctorProfile.rejectionReason}
            </p>
          )}
        </div>
      )}

      {/* Doctor Profile Header */}
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

      {/* Patient Serials Queue (Today & All) */}
      {doctorProfile && (
        <section>
          <div className="flex items-center gap-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setApptTab("TODAY")}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
                apptTab === "TODAY"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.doctorPortal.todayAppointmentsTab} ({todayAppointments.length})
            </button>
            <button
              type="button"
              onClick={() => setApptTab("ALL")}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
                apptTab === "ALL"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.doctorPortal.allAppointmentsTab} ({appointments.length})
            </button>
          </div>

          {displayedAppointments.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-xs sm:text-sm text-slate-500">
              {t.doctorPortal.noAppointmentsToday}
            </div>
          ) : (
            <div className="mt-4 grid gap-4">
              {displayedAppointments.map((appt) => (
                <DoctorAppointmentCard key={appt.id} appt={appt} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Chamber Schedule Editor */}
      {doctorProfile && (
        <section>
          <h2 className="text-lg font-bold text-slate-900">
            {t.dashboards.editScheduleTitle}
          </h2>
          <div className="mt-3 grid gap-4">
            {doctorProfile.chambers.map((ch) => (
              <ChamberScheduleEditorCard key={ch.id} chamber={ch} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
