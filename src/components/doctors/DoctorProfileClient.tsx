"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { DAY_NAMES } from "@/lib/i18n/translations";
import { formatBdt } from "@/lib/phone";

interface DoctorProfileFull {
  id: string;
  bmdcNumber: string;
  gender: string;
  titleEn: string;
  titleBn: string;
  qualificationsEn: string;
  qualificationsBn: string;
  bioEn: string | null;
  bioBn: string | null;
  experienceYears: number;
  averageRating: number;
  reviewCount: number;
  specialties: Array<{
    specialty: {
      id: string;
      slug: string;
      nameEn: string;
      nameBn: string;
    };
  }>;
  chambers: Array<{
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
      phone: string | null;
    };
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date | string;
    patient: {
      user: {
        nameEn: string | null;
        nameBn: string | null;
      };
    };
  }>;
}

export function DoctorProfileClient({
  doctor,
}: {
  doctor: DoctorProfileFull;
}) {
  const { lang, t } = useLanguage();

  const name = lang === "bn" ? doctor.titleBn : doctor.titleEn;
  const quals =
    lang === "bn" ? doctor.qualificationsBn : doctor.qualificationsEn;
  const bio = lang === "bn" ? doctor.bioBn : doctor.bioEn;
  const initials = doctor.titleEn
    .replace(/^(Prof\.|Assoc\.|Dr\.)\s*/gi, "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <Link
        href="/doctors"
        className="inline-flex items-center text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800"
      >
        {t.profile.backToSearch}
      </Link>

      {/* Doctor Hero Card */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <div
            aria-hidden="true"
            className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold text-2xl sm:text-3xl shadow-inner"
          >
            {initials || "DR"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                {t.profile.verifiedBmdc} {doctor.bmdcNumber}
              </span>
              {doctor.specialties.map((s) => (
                <span
                  key={s.specialty.id}
                  className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800"
                >
                  {lang === "bn" ? s.specialty.nameBn : s.specialty.nameEn}
                </span>
              ))}
            </div>

            <h1 className="mt-2.5 text-2xl sm:text-3xl font-extrabold text-slate-900">
              {name}
            </h1>
            <p className="mt-1 text-sm sm:text-base font-medium text-slate-600">
              {quals}
            </p>

            <div className="mt-4 grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-6 pt-4 border-t border-slate-100 text-xs sm:text-sm">
              <div>
                <span className="block text-slate-500">
                  {t.profile.experienceLabel}
                </span>
                <span className="font-bold text-slate-900">
                  {t.profile.experienceYears.replace(
                    "{years}",
                    String(doctor.experienceYears)
                  )}
                </span>
              </div>

              <div>
                <span className="block text-slate-500">
                  {t.profile.ratingLabel}
                </span>
                <span className="font-bold text-amber-700">
                  ★ {doctor.averageRating.toFixed(1)}{" "}
                  <span className="font-normal text-slate-500">
                    {t.profile.reviewsCount.replace(
                      "{count}",
                      String(doctor.reviewCount)
                    )}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {doctor.chambers[0] && (
            <div className="sm:text-right flex flex-col justify-between gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div>
                <span className="block text-xs text-slate-500">
                  {t.profile.consultationFee}
                </span>
                <span className="text-2xl font-extrabold text-emerald-700">
                  {formatBdt(doctor.chambers[0].feeBdt)}
                </span>
              </div>
              <a
                href="#chambers-section"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                {t.profile.bookAppointmentBtn}
              </a>
            </div>
          )}
        </div>

        {bio && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              {t.profile.aboutTitle}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
              {bio}
            </p>
          </div>
        )}
      </section>

      {/* Chambers & Schedule */}
      <section id="chambers-section" className="mt-8">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
          {t.profile.chambersTitle}
        </h2>

        <div className="mt-4 grid gap-4">
          {doctor.chambers.map((chamber) => {
            const clinicName =
              lang === "bn" ? chamber.clinic.nameBn : chamber.clinic.nameEn;
            const clinicAddress =
              lang === "bn"
                ? chamber.clinic.addressBn
                : chamber.clinic.addressEn;
            const cityArea =
              lang === "bn"
                ? `${chamber.clinic.areaBn}, ${chamber.clinic.cityBn}`
                : `${chamber.clinic.areaEn}, ${chamber.clinic.cityEn}`;
            const dayLabels = chamber.daysOfWeek
              .map((d) => DAY_NAMES[lang][d] ?? "")
              .filter(Boolean)
              .join(", ");

            return (
              <div
                key={chamber.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                      {cityArea}
                    </span>
                    {chamber.roomNumber && (
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {t.profile.roomLabel}: {chamber.roomNumber}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {clinicName}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {clinicAddress}
                  </p>

                  <div className="pt-2 flex flex-wrap gap-4 text-xs sm:text-sm text-slate-700">
                    <div>
                      <span className="font-semibold text-slate-900">
                        {t.profile.scheduleDays}:{" "}
                      </span>
                      <span>{dayLabels}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">
                        {t.profile.scheduleHours}:{" "}
                      </span>
                      <span>
                        {chamber.startTime} - {chamber.endTime} (
                        {chamber.slotDurationMin} {t.profile.minutesUnit})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 flex flex-col sm:items-end justify-between gap-3 shrink-0">
                  <div>
                    <div className="text-xs text-slate-500">
                      {t.profile.consultationFee}:{" "}
                      <span className="text-lg font-extrabold text-emerald-700">
                        {formatBdt(chamber.feeBdt)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {t.profile.followUpFee}:{" "}
                      <span className="font-semibold text-slate-700">
                        {formatBdt(chamber.followUpFeeBdt)}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/doctors/${doctor.id}/book?chamberId=${encodeURIComponent(
                      chamber.id
                    )}`}
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    {t.profile.bookAppointmentBtn}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Patient Reviews */}
      <section className="mt-8">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
          {t.profile.reviewsTitle}
        </h2>

        {doctor.reviews.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-6 text-xs sm:text-sm text-slate-500 shadow-sm">
            {t.profile.noReviewsYet}
          </div>
        ) : (
          <div className="mt-3 grid gap-3">
            {doctor.reviews.map((rev) => {
              const reviewerName =
                (lang === "bn"
                  ? rev.patient.user.nameBn || rev.patient.user.nameEn
                  : rev.patient.user.nameEn || rev.patient.user.nameBn) ||
                t.profile.anonymousPatient;

              return (
                <div
                  key={rev.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      {reviewerName}
                    </span>
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800">
                      {"★".repeat(rev.rating)} ({rev.rating}/5)
                    </span>
                  </div>
                  {rev.comment && (
                    <p className="mt-2 text-xs sm:text-sm text-slate-600">
                      {rev.comment}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
