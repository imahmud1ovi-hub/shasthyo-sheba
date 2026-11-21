"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { AppRole, getDashboardPathForRole } from "@/lib/auth/session-client";

export interface NavbarUser {
  userId: string;
  phone: string;
  role: AppRole;
  nameEn?: string | null;
  nameBn?: string | null;
}

export function Navbar({ user }: { user: NavbarUser | null }) {
  const { lang, toggleLang, t } = useLanguage();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const displayName = user
    ? (lang === "bn" ? user.nameBn || user.nameEn : user.nameEn || user.nameBn) ||
      user.phone
    : null;

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
      <div className="mx-auto flex flex-wrap max-w-5xl items-center justify-between px-3 sm:px-4 py-3 gap-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-base sm:text-lg shadow-sm">
            +
          </div>
          <div>
            <span className="block text-sm sm:text-lg font-bold text-slate-900 leading-tight">
              {t.brand}
            </span>
            <span className="block text-[11px] sm:text-xs text-slate-500">
              {t.brandSub}
            </span>
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
          <Link
            href="/doctors"
            className="rounded-lg px-2 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            {t.navFindDoctors}
          </Link>
          {(!user || user.role === "PATIENT") && (
            <Link
              href="/doctor/register"
              className="rounded-lg px-2 py-1.5 text-xs sm:text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              {t.navDoctorRegister}
            </Link>
          )}
          {user ? (
            <>
              {(user.role === "PATIENT" || user.role === "ADMIN") && (
                <Link
                  href="/patient/appointments"
                  className="rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {t.navMyAppointments}
                </Link>
              )}
              <Link
                href={getDashboardPathForRole(user.role)}
                className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs sm:text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                {t.navDashboard} ({t.roleBadge[user.role]})
              </Link>
              <span className="hidden md:inline text-xs text-slate-600 font-medium">
                {displayName}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t.navLogout}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t.navLogin}
            </Link>
          )}

          <button
            type="button"
            onClick={toggleLang}
            aria-label="Toggle language"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t.toggleBtn}
          </button>
        </div>
      </div>
    </header>
  );
}
