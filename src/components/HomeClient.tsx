"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { NavbarUser } from "@/components/Navbar";
import { getDashboardPathForRole } from "@/lib/auth/session-client";

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

export function HomeClient({
  user,
  specialties,
  cities,
}: {
  user: NavbarUser | null;
  specialties: SpecialtyOption[];
  cities: CityOption[];
}) {
  const { lang, t } = useLanguage();
  const router = useRouter();

  const [q, setQ] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (specialty) params.set("specialty", specialty);
    if (city) params.set("city", city);
    const qs = params.toString();
    router.push(qs ? `/doctors?${qs}` : "/doctors");
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 sm:p-10 shadow-sm">
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          {t.home.badge}
        </span>
        <h1 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          {t.home.headline}
        </h1>
        <p className="mt-2.5 max-w-2xl text-sm sm:text-lg text-slate-600">
          {t.home.subheadline}
        </p>

        {/* Doctor Discovery Search Bar */}
        <form
          onSubmit={handleSearch}
          className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-sm sm:grid-cols-12"
        >
          <div className="sm:col-span-5">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.home.searchPlaceholder}
              aria-label={t.home.searchPlaceholder}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              aria-label={t.home.allSpecialties}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
            >
              <option value="">{t.home.allSpecialties}</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.slug}>
                  {lang === "bn" ? s.nameBn : s.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              aria-label={t.home.allCities}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
            >
              <option value="">{t.home.allCities}</option>
              {cities.map((c) => (
                <option key={c.cityEn} value={c.cityEn}>
                  {lang === "bn" ? c.cityBn : c.cityEn}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              {t.home.searchBtn}
            </button>
          </div>
        </form>

        {/* Quick Specialty & City Pills */}
        {specialties.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t.home.popularSpecialties}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {specialties.map((s) => (
                <Link
                  key={s.id}
                  href={`/doctors?specialty=${encodeURIComponent(s.slug)}`}
                  className="rounded-full border border-emerald-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  {lang === "bn" ? s.nameBn : s.nameEn}
                </Link>
              ))}
            </div>
          </div>
        )}

        {cities.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t.home.browseByCity}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {cities.map((c) => (
                <Link
                  key={c.cityEn}
                  href={`/doctors?city=${encodeURIComponent(c.cityEn)}`}
                  className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {lang === "bn" ? c.cityBn : c.cityEn}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/doctors"
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            {t.home.ctaBrowseDoctors}
          </Link>
          {user ? (
            <Link
              href={getDashboardPathForRole(user.role)}
              className="rounded-xl border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              {t.home.ctaDashboard}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-xl border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              {t.home.ctaLogin}
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {t.home.cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-base font-bold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {card.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">
          {t.home.demoAccountsTitle}
        </h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-3 text-xs sm:text-sm font-mono text-slate-700">
          <div className="rounded-lg bg-slate-50 px-3 py-2 border border-slate-200">
            {t.home.demoAdmin}
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 border border-slate-200">
            {t.home.demoPatient}
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 border border-slate-200">
            {t.home.demoDoctor}
          </div>
        </div>
      </div>
    </main>
  );
}
