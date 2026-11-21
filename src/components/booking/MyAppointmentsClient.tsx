"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { formatBdt } from "@/lib/phone";
import { TWO_HOURS_MS } from "@/lib/booking/appointments-client";

interface AppointmentItem {
  id: string;
  chamberId: string;
  slotId: string;
  dateStr: string;
  startTime: string;
  endTime: string;
  appointmentAt: Date | string;
  serialNumber: number;
  feeBdt: number;
  status: string;
  symptoms: string | null;
  doctor: {
    id: string;
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

interface NotificationItem {
  id: string;
  titleEn: string;
  titleBn: string;
  messageEn: string;
  messageBn: string;
  createdAt: Date | string;
}

interface SlotOption {
  id: string;
  serialNumber: number;
  startTime: string;
  endTime: string;
  slotDateTime: string;
  isBooked: boolean;
  isBlocked: boolean;
}

export function MyAppointmentsClient({
  appointments,
  notifications,
}: {
  appointments: AppointmentItem[];
  notifications: NotificationItem[];
}) {
  const { lang, t } = useLanguage();
  const router = useRouter();

  const [tab, setTab] = useState<"UPCOMING" | "PAST">("UPCOMING");
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Reschedule modal state
  const [rescheduleTarget, setRescheduleTarget] =
    useState<AppointmentItem | null>(null);
  const [newDateStr, setNewDateStr] = useState("");
  const [availableSlots, setAvailableSlots] = useState<SlotOption[]>([]);
  const [selectedNewSlotId, setSelectedNewSlotId] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const nowMs = Date.now();

  const upcomingList = appointments.filter((a) => {
    const apptMs = new Date(a.appointmentAt).getTime();
    return (
      (a.status === "CONFIRMED" || a.status === "PENDING") && apptMs >= nowMs
    );
  });

  const pastList = appointments.filter((a) => {
    const apptMs = new Date(a.appointmentAt).getTime();
    return (
      a.status === "CANCELLED" ||
      a.status === "COMPLETED" ||
      a.status === "NO_SHOW" ||
      apptMs < nowMs
    );
  });

  useEffect(() => {
    if (!rescheduleTarget || !newDateStr) return;
    let active = true;
    setLoadingSlots(true);
    setSelectedNewSlotId("");

    fetch(
      `/api/chambers/${encodeURIComponent(
        rescheduleTarget.chamberId
      )}/slots?date=${encodeURIComponent(newDateStr)}`
    )
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        if (json.ok && json.data.open) {
          setAvailableSlots(json.data.slots ?? []);
        } else {
          setAvailableSlots([]);
        }
      })
      .catch(() => {
        if (active) setAvailableSlots([]);
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [rescheduleTarget, newDateStr]);

  const handleCancel = async (appointmentId: string) => {
    setActionError(null);
    setCancellingId(appointmentId);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelReason: "Cancelled by patient" }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setActionError(json.error?.message || "Failed to cancel appointment.");
        return;
      }
      router.refresh();
    } catch {
      setActionError("Network error while cancelling appointment.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleTarget || !selectedNewSlotId) return;
    setActionError(null);
    setRescheduling(true);

    try {
      const res = await fetch(
        `/api/appointments/${rescheduleTarget.id}/reschedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newSlotId: selectedNewSlotId }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setActionError(
          json.error?.message || "Failed to reschedule appointment."
        );
        return;
      }
      setRescheduleTarget(null);
      router.refresh();
    } catch {
      setActionError("Network error while rescheduling appointment.");
    } finally {
      setRescheduling(false);
    }
  };

  const displayedList = tab === "UPCOMING" ? upcomingList : pastList;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {t.myAppointments.pageTitle}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            {t.myAppointments.pageSubtitle}
          </p>
        </div>
        <Link
          href="/doctors"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          {t.myAppointments.browseDoctorsCta}
        </Link>
      </div>

      {actionError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm text-red-700"
        >
          {actionError}
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("UPCOMING")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
            tab === "UPCOMING"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          {t.myAppointments.tabUpcoming} ({upcomingList.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("PAST")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
            tab === "PAST"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          {t.myAppointments.tabPast} ({pastList.length})
        </button>
      </div>

      {/* Appointment Cards */}
      {displayedList.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-600">
            {tab === "UPCOMING"
              ? t.myAppointments.emptyUpcoming
              : t.myAppointments.emptyPast}
          </p>
          <Link
            href="/doctors"
            className="mt-4 inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {t.myAppointments.browseDoctorsCta}
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          {displayedList.map((appt) => {
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
            const apptMs = new Date(appt.appointmentAt).getTime();
            const canModify =
              (appt.status === "CONFIRMED" || appt.status === "PENDING") &&
              apptMs - nowMs >= TWO_HOURS_MS;

            return (
              <div
                key={appt.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
                      {t.dashboards.serialLabel}
                      {appt.serialNumber}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        appt.status === "CONFIRMED"
                          ? "bg-emerald-50 text-emerald-800"
                          : appt.status === "CANCELLED"
                            ? "bg-red-50 text-red-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {appt.status}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {appt.dateStr} • {appt.startTime} - {appt.endTime}
                    </span>
                  </div>

                  <h2 className="mt-2 text-base sm:text-lg font-bold text-slate-900">
                    <Link
                      href={`/doctors/${appt.doctor.id}`}
                      className="hover:text-emerald-700"
                    >
                      {docName}
                    </Link>
                  </h2>
                  <p className="text-xs text-slate-600">
                    {specName} • BM&DC: {appt.doctor.bmdcNumber}
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-slate-700">
                    {clinicName} ({areaCity})
                    {appt.chamber.roomNumber
                      ? ` • ${appt.chamber.roomNumber}`
                      : ""}
                  </p>
                  {appt.symptoms && (
                    <p className="mt-1 text-xs text-slate-500">
                      {appt.symptoms}
                    </p>
                  )}
                </div>

                <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 flex flex-col sm:items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-emerald-700">
                      {t.dashboards.feeLabel}: {formatBdt(appt.feeBdt)}
                    </p>
                    {appt.payment && (
                      <p className="text-xs text-slate-500">
                        {appt.payment.method} ({appt.payment.status})
                      </p>
                    )}
                  </div>

                  {tab === "UPCOMING" && (
                    <div className="flex flex-wrap gap-2">
                      {canModify ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setRescheduleTarget(appt);
                              setNewDateStr(appt.dateStr);
                              setActionError(null);
                            }}
                            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                          >
                            {t.myAppointments.rescheduleBtn}
                          </button>
                          <button
                            type="button"
                            disabled={cancellingId === appt.id}
                            onClick={() => handleCancel(appt.id)}
                            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                          >
                            {cancellingId === appt.id
                              ? t.myAppointments.cancellingBtn
                              : t.myAppointments.cancelBtn}
                          </button>
                        </>
                      ) : (
                        <span className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800">
                          {t.myAppointments.twoHourLockNotice}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">
              {t.myAppointments.rescheduleModalTitle}
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              {lang === "bn"
                ? rescheduleTarget.doctor.titleBn
                : rescheduleTarget.doctor.titleEn}{" "}
              •{" "}
              {lang === "bn"
                ? rescheduleTarget.chamber.clinic.nameBn
                : rescheduleTarget.chamber.clinic.nameEn}
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700">
                {t.myAppointments.chooseNewDate}
              </label>
              <input
                type="date"
                value={newDateStr}
                onChange={(e) => setNewDateStr(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700">
                {t.myAppointments.chooseNewSlot}
              </label>
              {loadingSlots ? (
                <p className="mt-2 text-xs text-slate-500">
                  {t.booking.loadingSlots}
                </p>
              ) : availableSlots.length === 0 ? (
                <p className="mt-2 text-xs text-amber-700">
                  {t.booking.noSlotsAvailable}
                </p>
              ) : (
                <div className="mt-2 grid grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                  {availableSlots.map((slot) => {
                    const isPast =
                      new Date(slot.slotDateTime).getTime() <= nowMs;
                    const disabled =
                      slot.isBooked ||
                      slot.isBlocked ||
                      isPast ||
                      slot.id === rescheduleTarget.slotId;
                    const selected = selectedNewSlotId === slot.id;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelectedNewSlotId(slot.id)}
                        className={`rounded-xl border p-2.5 text-left text-xs transition ${
                          disabled
                            ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                            : selected
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-slate-200 bg-white text-slate-800 hover:border-emerald-500"
                        }`}
                      >
                        <div className="font-bold">
                          #{slot.serialNumber}
                        </div>
                        <div>
                          {slot.startTime} - {slot.endTime}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
              >
                {t.myAppointments.closeModalBtn}
              </button>
              <button
                type="button"
                disabled={!selectedNewSlotId || rescheduling}
                onClick={handleConfirmReschedule}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {rescheduling
                  ? t.myAppointments.reschedulingBtn
                  : t.myAppointments.confirmRescheduleBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <section className="mt-10">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">
          {t.myAppointments.notificationsTitle}
        </h2>
        {notifications.length === 0 ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-5 text-xs sm:text-sm text-slate-500">
            {t.myAppointments.noNotifications}
          </div>
        ) : (
          <div className="mt-3 grid gap-2.5">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  {lang === "bn" ? n.titleBn : n.titleEn}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {lang === "bn" ? n.messageBn : n.messageEn}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
