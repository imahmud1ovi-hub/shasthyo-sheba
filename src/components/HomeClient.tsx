"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { NavbarUser } from "@/components/Navbar";
import { getDashboardPathForRole } from "@/lib/auth/session-client";

export function HomeClient({ user }: { user: NavbarUser | null }) {
  const { t } = useLanguage();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 sm:p-10 shadow-sm">
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          {t.home.badge}
        </span>
        <h1 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          {t.home.headline}
        </h1>
        <p className="mt-3 max-w-2xl text-base sm:text-lg text-slate-600">
          {t.home.subheadline}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {user ? (
            <Link
              href={getDashboardPathForRole(user.role)}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              {t.home.ctaDashboard}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
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
