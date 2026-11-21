"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { DAY_NAMES } from "@/lib/i18n/translations";
import { formatBdt } from "@/lib/phone";
import { NavbarUser } from "@/components/Navbar";

interface ChamberItem {
  id: string;
  roomNumber: string | null;
  feeBdt: number;
  followUpFeeBdt: number;
  slotDurationMin: number;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  clinic: {
    id: string;
    nameEn: string;
    nameBn: string;
    cityEn: string;
    cityBn: string;
    areaEn: string;
    areaBn: string;
    addressEn: string;
    addressBn: string;
  };
}

interface DoctorBookingInfo {
  id: string;
  bmdcNumber: string;
  titleEn: string;
  titleBn: string;
  qualificationsEn: string;
  qualificationsBn: string;
  chambers: ChamberItem[];
}

interface SlotItem {
  id: string;
  serialNumber: number;
  startTime: string;
  endTime: string;
  slotDateTime: string;
  isBooked: boolean;
  isBlocked: boolean;
}

export function BookAppointmentClient({
  doctor,
  user,
  initialChamberId,
  initialDate,
}: {
  doctor: DoctorBookingInfo;
  user: NavbarUser | null;
  initialChamberId: string;
  initialDate: string;
}) {
  const { lang, t } = useLanguage();
  const router = useRouter();

  const [chamberId, setChamberId] = useState(initialChamberId);
  const [dateStr, setDateStr] = useState(initialDate);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [chamberOpen, setChamberOpen] = useState(true);
  const [closedReason, setClosedReason] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [symptoms, setSymptoms] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH_AT_CLINIC" | "MOCK_ONLINE"
  >("CASH_AT_CLINIC");
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedChamber =
    doctor.chambers.find((c) => c.id === chamberId) ?? doctor.chambers[0];

  useEffect(() => {
    let active = true;
    setLoadingSlots(true);
    setError(null);
    setSelectedSlotId("");

    fetch(
      `/api/chambers/${encodeURIComponent(chamberId)}/slots?date=${encodeURIComponent(
        dateStr
      )}`
    )
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        if (!json.ok) {
          setError(json.error?.message || "Failed to load slots.");
          setSlots([]);
          return;
        }
        setChamberOpen(Boolean(json.data.open));
        setClosedReason(json.data.reason ?? null);
        setSlots(json.data.slots ?? []);
      })
      .catch(() => {
        if (active) setError("Network error while loading slots.");
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [chamberId, dateStr]);

  const handleConfirmBooking = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlotId,
          symptoms: symptoms.trim() || undefined,
          paymentMethod,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error?.message || "Could not book serial slot.");
        return;
      }
      router.push("/patient/appointments?booked=1");
      router.refresh();
    } catch {
      setError("Network error while booking appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  const docName = lang === "bn" ? doctor.titleBn : doctor.titleEn;
  const docQuals =
    lang === "bn" ? doctor.qualificationsBn : doctor.qualificationsEn;
  const nowMs = Date.now();

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <Link
        href={`/doctors/${doctor.id}`}
        className="inline-flex items-center text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800"
      >
        {t.booking.backToProfile}
      </Link>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm">
        <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
          BM&DC: {doctor.bmdcNumber}
        </span>
        <h1 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">
          {t.booking.pageTitle}
        </h1>
        <p className="mt-1 text-sm font-semibold text-slate-700">{docName}</p>
        <p className="text-xs text-slate-500">{docQuals}</p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleConfirmBooking} className="mt-6 space-y-6">
          {/* 1. Select Chamber */}
          <div>
            <label className="block text-sm font-bold text-slate-900">
              {t.booking.selectChamberLabel}
            </label>
            <div className="mt-2 grid gap-3">
              {doctor.chambers.map((ch) => {
                const isSelected = ch.id === chamberId;
                const clinicName =
                  lang === "bn" ? ch.clinic.nameBn : ch.clinic.nameEn;
                const cityArea =
                  lang === "bn"
                    ? `${ch.clinic.areaBn}, ${ch.clinic.cityBn}`
                    : `${ch.clinic.areaEn}, ${ch.clinic.cityEn}`;
                const dayNames = ch.daysOfWeek
                  .map((d) => DAY_NAMES[lang][d])
                  .join(", ");

                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setChamberId(ch.id)}
                    className={`w-full text-left rounded-xl border p-4 transition ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm sm:text-base font-bold text-slate-900">
                        {clinicName} ({cityArea})
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-emerald-700">
                        {formatBdt(ch.feeBdt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      {dayNames} • {ch.startTime} - {ch.endTime} (
                      {ch.slotDurationMin}m)
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Select Date */}
          <div>
            <label
              htmlFor="booking-date"
              className="block text-sm font-bold text-slate-900"
            >
              {t.booking.selectDateLabel}
            </label>
            <input
              id="booking-date"
              type="date"
              required
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="mt-2 w-full sm:w-64 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* 3. Select Serial Slot */}
          <div>
            <label className="block text-sm font-bold text-slate-900">
              {t.booking.selectSlotLabel}
            </label>

            {loadingSlots ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs sm:text-sm text-slate-500">
                {t.booking.loadingSlots}
              </div>
            ) : !chamberOpen ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm text-amber-800">
                {closedReason === "BLOCKED_DATE"
                  ? t.booking.chamberClosedBlocked
                  : t.booking.chamberClosedDay}
              </div>
            ) : slots.length === 0 ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:text-sm text-slate-600">
                {t.booking.noSlotsAvailable}
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {slots.map((slot) => {
                  const isPast =
                    new Date(slot.slotDateTime).getTime() <= nowMs;
                  const disabled = slot.isBooked || slot.isBlocked || isPast;
                  const isSelected = selectedSlotId === slot.id;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        disabled
                          ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                          : isSelected
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-900 hover:border-emerald-400 hover:bg-emerald-50/40"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>
                          {t.booking.serialBadge}
                          {slot.serialNumber}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            disabled
                              ? "bg-slate-200 text-slate-600"
                              : isSelected
                                ? "bg-emerald-700 text-white"
                                : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {slot.isBooked
                            ? t.booking.bookedBadge
                            : isPast
                              ? t.booking.pastBadge
                              : t.booking.availableBadge}
                        </span>
                      </div>
                      <div className="mt-1 text-xs sm:text-sm font-semibold">
                        {slot.startTime} - {slot.endTime}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Optional Symptoms */}
          <div>
            <label
              htmlFor="symptoms"
              className="block text-sm font-bold text-slate-900"
            >
              {t.booking.symptomsLabel}
            </label>
            <textarea
              id="symptoms"
              rows={2}
              maxLength={500}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder={t.booking.symptomsPlaceholder}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* 5. Payment Method */}
          <div>
            <label className="block text-sm font-bold text-slate-900">
              {t.booking.paymentMethodLabel}
            </label>
            <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH_AT_CLINIC")}
                className={`rounded-xl border p-3.5 text-left text-xs sm:text-sm font-semibold transition ${
                  paymentMethod === "CASH_AT_CLINIC"
                    ? "border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {t.booking.payAtClinicOption}
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("MOCK_ONLINE")}
                className={`rounded-xl border p-3.5 text-left text-xs sm:text-sm font-semibold transition ${
                  paymentMethod === "MOCK_ONLINE"
                    ? "border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {t.booking.payMockOnlineOption}
              </button>
            </div>
          </div>

          {/* 5. Fee Summary & Submit */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="block text-xs text-slate-500">
                {t.booking.feeSummaryLabel}
              </span>
              <span className="text-xl font-extrabold text-emerald-700">
                {formatBdt(selectedChamber.feeBdt)}
              </span>
            </div>

            {!user ? (
              <Link
                href={`/login?next=${encodeURIComponent(
                  `/doctors/${doctor.id}/book?chamberId=${chamberId}&date=${dateStr}`
                )}`}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                {t.booking.loginToBookBtn}
              </Link>
            ) : (
              <button
                type="submit"
                disabled={!selectedSlotId || submitting}
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting
                  ? t.booking.bookingInProgress
                  : t.booking.confirmBookingBtn}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
