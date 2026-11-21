"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { NavbarUser } from "@/components/Navbar";
import { getDashboardPathForRole } from "@/lib/auth/session-client";

export function UnauthorizedClient({ user }: { user: NavbarUser | null }) {
  const { t } = useLanguage();

  return (
    <main className="mx-auto max-w-lg px-4 py-14">
      <div className="rounded-2xl border border-amber-200 bg-white p-6 sm:p-8 shadow-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-bold text-lg">
          !
        </div>
        <h1 className="mt-4 text-xl sm:text-2xl font-bold text-slate-900">
          {t.unauthorized.title}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{t.unauthorized.message}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {user && (
            <Link
              href={getDashboardPathForRole(user.role)}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t.unauthorized.backToDashboard}
            </Link>
          )}
          <Link
            href="/"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t.unauthorized.backHome}
          </Link>
        </div>
      </div>
    </main>
  );
}
