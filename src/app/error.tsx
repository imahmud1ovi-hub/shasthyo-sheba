"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { lang } = useLanguage();

  return (
    <main className="mx-auto max-w-lg px-4 py-14">
      <div className="rounded-2xl border border-red-200 bg-white p-6 sm:p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">
          {lang === "bn"
            ? "কিছু একটা সমস্যা হয়েছে"
            : "Something went wrong"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {lang === "bn"
            ? "পেজটি লোড করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
            : "An unexpected error occurred while loading this page. Please try again."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {lang === "bn" ? "আবার চেষ্টা করুন" : "Try Again"}
          </button>
          <Link
            href="/"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {lang === "bn" ? "হোম পেজে যান" : "Back to Home"}
          </Link>
        </div>
      </div>
    </main>
  );
}
