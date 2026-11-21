"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export default function NotFoundPage() {
  const { lang } = useLanguage();

  return (
    <main className="mx-auto max-w-lg px-4 py-14">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-sm">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          404
        </span>
        <h1 className="mt-3 text-xl font-bold text-slate-900">
          {lang === "bn" ? "পেজটি পাওয়া যায়নি" : "Page Not Found"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {lang === "bn"
            ? "আপনি যে পেজ বা ডাক্তারের প্রোফাইল খুঁজছেন তা বিদ্যমান নেই অথবা এখনো অনুমোদিত হয়নি।"
            : "The page or doctor profile you are looking for does not exist or is not yet approved."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/doctors"
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {lang === "bn" ? "ডাক্তার খুঁজুন" : "Find Doctors"}
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {lang === "bn" ? "হোম পেজ" : "Home"}
          </Link>
        </div>
      </div>
    </main>
  );
}
