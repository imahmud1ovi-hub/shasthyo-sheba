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
  chambers: ChamberScheduleItem[];
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

      {/* Visiting Days */}
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

      {/* Hours, Slot Duration, Fee */}
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

      {/* Blocked Dates */}
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
