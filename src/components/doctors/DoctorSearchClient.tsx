"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { DAY_NAMES } from "@/lib/i18n/translations";
import { formatBdt } from "@/lib/phone";
import { DoctorSearchParams, DoctorSortOption } from "@/lib/doctors/search";

interface DoctorListItem {
  id: string;
  bmdcNumber: string;
  gender: string;
  titleEn: string;
  titleBn: string;
  qualificationsEn: string;
  qualificationsBn: string;
  experienceYears: number;
  averageRating: number;
  reviewCount: number;
  lowestFeeBdt: number;
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
    feeBdt: number;
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
    roomNumber: string | null;
    clinic: {
      nameEn: string;
      nameBn: string;
      cityEn: string;
      cityBn: string;
      areaEn: string;
      areaBn: string;
    };
  }>;
}

interface SpecialtyOption {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
}

interface CityOption {
  cityEn: string;
  cityBn: string;
}

interface AreaOption {
  cityEn: string;
  areaEn: string;
  areaBn: string;
}

export function DoctorSearchClient({
  items,
  pagination,
  initialFilters,
  specialties,
  cities,
  areas,
}: {
  items: DoctorListItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  initialFilters: DoctorSearchParams;
  specialties: SpecialtyOption[];
  cities: CityOption[];
  areas: AreaOption[];
}) {
  const { lang, t } = useLanguage();
  const router = useRouter();

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [q, setQ] = useState(initialFilters.q ?? "");
  const [specialty, setSpecialty] = useState(initialFilters.specialty ?? "");
  const [city, setCity] = useState(initialFilters.city ?? "");
  const [area, setArea] = useState(initialFilters.area ?? "");
  const [gender, setGender] = useState<string>(initialFilters.gender ?? "");
  const [minFee, setMinFee] = useState(
    initialFilters.minFee !== undefined ? String(initialFilters.minFee) : ""
  );
  const [maxFee, setMaxFee] = useState(
    initialFilters.maxFee !== undefined ? String(initialFilters.maxFee) : ""
  );
  const [availableToday, setAvailableToday] = useState(
    Boolean(initialFilters.availableToday)
  );
  const [availableDay, setAvailableDay] = useState(
    initialFilters.availableDay !== undefined
      ? String(initialFilters.availableDay)
      : ""
  );
  const [sort, setSort] = useState<DoctorSortOption>(
    initialFilters.sort ?? "rating_desc"
  );

  const filteredAreas = city
    ? areas.filter((a) => a.cityEn.toLowerCase() === city.toLowerCase())
    : areas;

  const buildQueryString = (targetPage = 1) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (specialty) params.set("specialty", specialty);
    if (city) params.set("city", city);
    if (area) params.set("area", area);
    if (gender) params.set("gender", gender);
    if (minFee.trim()) params.set("minFee", minFee.trim());
    if (maxFee.trim()) params.set("maxFee", maxFee.trim());
    if (availableToday) params.set("availableToday", "true");
    if (availableDay !== "") params.set("availableDay", availableDay);
    if (sort && sort !== "rating_desc") params.set("sort", sort);
    if (targetPage > 1) params.set("page", String(targetPage));
    return params.toString();
  };

  const handleApplyFilters = (e: FormEvent) => {
    e.preventDefault();
    const qs = buildQueryString(1);
    setMobileFiltersOpen(false);
    router.push(qs ? `/doctors?${qs}` : "/doctors");
  };

  const handleResetFilters = () => {
    setQ("");
    setSpecialty("");
    setCity("");
    setArea("");
    setGender("");
    setMinFee("");
    setMaxFee("");
    setAvailableToday(false);
    setAvailableDay("");
    setSort("rating_desc");
    setMobileFiltersOpen(false);
    router.push("/doctors");
  };

  const handlePageChange = (nextPage: number) => {
    const qs = buildQueryString(nextPage);
    router.push(qs ? `/doctors?${qs}` : "/doctors");
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {t.discovery.pageTitle}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            {t.discovery.pageSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMobileFiltersOpen((prev) => !prev)}
          className="sm:hidden inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-sm"
        >
          {t.discovery.toggleFiltersMobile}
        </button>
      </div>

      {/* Filter & Sort Panel */}
      <form
        onSubmit={handleApplyFilters}
        className={`mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm ${
          mobileFiltersOpen ? "block" : "hidden sm:block"
        }`}
      >
        <div className="grid gap-3.5 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700">
              {t.discovery.searchInputLabel}
            </label>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.discovery.searchInputPlaceholder}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              {t.discovery.specialtyLabel}
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
            >
              <option value="">{t.discovery.allSpecialties}</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.slug}>
                  {lang === "bn" ? s.nameBn : s.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              {t.discovery.cityLabel}
            </label>
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setArea("");
              }}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
            >
              <option value="">{t.discovery.allCities}</option>
              {cities.map((c) => (
                <option key={c.cityEn} value={c.cityEn}>
                  {lang === "bn" ? c.cityBn : c.cityEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              {t.discovery.areaLabel}
            </label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
            >
              <option value="">{t.discovery.allAreas}</option>
              {filteredAreas.map((a) => (
                <option key={`${a.cityEn}:${a.areaEn}`} value={a.areaEn}>
                  {lang === "bn" ? a.areaBn : a.areaEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              {t.discovery.genderLabel}
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
            >
              <option value="">{t.discovery.genderAll}</option>
              <option value="MALE">{t.discovery.genderMale}</option>
              <option value="FEMALE">{t.discovery.genderFemale}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                {t.discovery.minFeeLabel}
              </label>
              <input
                type="number"
                min={0}
                step={100}
                value={minFee}
                onChange={(e) => setMinFee(e.target.value)}
                placeholder="500"
                className="mt-1 w-full rounded-xl border border-slate-300 px-2.5 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                {t.discovery.maxFeeLabel}
              </label>
              <input
                type="number"
                min={0}
                step={100}
                value={maxFee}
                onChange={(e) => setMaxFee(e.target.value)}
                placeholder="1500"
                className="mt-1 w-full rounded-xl border border-slate-300 px-2.5 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              {t.discovery.availableDayLabel}
            </label>
            <select
              value={availableDay}
              onChange={(e) => setAvailableDay(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
            >
              <option value="">{t.discovery.anyDay}</option>
              {DAY_NAMES[lang].map((dayLabel, idx) => (
                <option key={idx} value={String(idx)}>
                  {dayLabel}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={availableToday}
                onChange={(e) => setAvailableToday(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              {t.discovery.availableTodayLabel}
            </label>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">
                {t.discovery.sortLabel}:
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as DoctorSortOption)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-800"
              >
                <option value="rating_desc">
                  {t.discovery.sortRatingDesc}
                </option>
                <option value="fee_asc">{t.discovery.sortFeeAsc}</option>
                <option value="fee_desc">{t.discovery.sortFeeDesc}</option>
                <option value="experience_desc">
                  {t.discovery.sortExpDesc}
                </option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t.discovery.resetFiltersBtn}
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              {t.discovery.applyFiltersBtn}
            </button>
          </div>
        </div>
      </form>

      {/* Results Header */}
      <div className="mt-5 flex items-center justify-between text-xs sm:text-sm text-slate-600">
        <p className="font-medium">
          {t.discovery.resultsCount.replace(
            "{count}",
            String(pagination.total)
          )}
        </p>
        <p>
          {t.discovery.pageIndicator
            .replace("{page}", String(pagination.page))
            .replace("{totalPages}", String(pagination.totalPages))}
        </p>
      </div>

      {/* Results List or Empty State */}
      {items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {t.discovery.noDoctorsFoundTitle}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            {t.discovery.noDoctorsFoundDesc}
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {t.discovery.resetFiltersBtn}
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {items.map((doc) => {
            const name = lang === "bn" ? doc.titleBn : doc.titleEn;
            const quals =
              lang === "bn" ? doc.qualificationsBn : doc.qualificationsEn;
            const primarySpec = doc.specialties[0]?.specialty;
            const specName = primarySpec
              ? lang === "bn"
                ? primarySpec.nameBn
                : primarySpec.nameEn
              : "";
            const firstChamber = doc.chambers[0];
            const initials = doc.titleEn
              .replace(/^(Prof\.|Assoc\.|Dr\.)\s*/gi, "")
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0] ?? "")
              .join("")
              .toUpperCase();

            return (
              <article
                key={doc.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start gap-3.5">
                    <div
                      aria-hidden="true"
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold text-lg"
                    >
                      {initials || "DR"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                          {t.discovery.verifiedBadge} ({doc.bmdcNumber})
                        </span>
                        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          ★ {doc.averageRating.toFixed(1)} ({doc.reviewCount})
                        </span>
                      </div>

                      <h2 className="mt-1.5 text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        <Link
                          href={`/doctors/${doc.id}`}
                          className="hover:text-emerald-700"
                        >
                          {name}
                        </Link>
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">
                        {quals}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    {specName && (
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-800">
                        {specName}
                      </span>
                    )}
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                      {t.discovery.experienceBadge.replace(
                        "{years}",
                        String(doc.experienceYears)
                      )}
                    </span>
                  </div>

                  {firstChamber && (
                    <div className="mt-3.5 rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs text-slate-700">
                      <p className="font-bold text-slate-900">
                        {lang === "bn"
                          ? firstChamber.clinic.nameBn
                          : firstChamber.clinic.nameEn}
                      </p>
                      <p className="mt-0.5 text-slate-600">
                        {lang === "bn"
                          ? `${firstChamber.clinic.areaBn}, ${firstChamber.clinic.cityBn}`
                          : `${firstChamber.clinic.areaEn}, ${firstChamber.clinic.cityEn}`}
                        {" • "}
                        {firstChamber.startTime} - {firstChamber.endTime}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="block text-[11px] text-slate-500">
                      {t.discovery.startingFeeLabel}
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-emerald-700">
                      {formatBdt(doc.lowestFeeBdt)}
                    </span>
                  </div>

                  <Link
                    href={`/doctors/${doc.id}`}
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    {t.discovery.viewProfileBtn}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => handlePageChange(pagination.page - 1)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            {t.discovery.prevPage}
          </button>
          <span className="text-xs sm:text-sm font-medium text-slate-700">
            {t.discovery.pageIndicator
              .replace("{page}", String(pagination.page))
              .replace("{totalPages}", String(pagination.totalPages))}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            {t.discovery.nextPage}
          </button>
        </div>
      )}
    </main>
  );
}
