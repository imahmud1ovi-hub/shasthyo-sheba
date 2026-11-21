"use client";

import { useState } from "react";

type Lang = "en" | "bn";

const copy = {
  en: {
    brand: "Shasthyo Sheba",
    brandSub: "স্বাস্থ্য সেবা",
    toggleBtn: "বাংলা",
    badge: "Phase 0 Foundation Ready • Local Windows Mode",
    headline: "Find Verified Doctors & Book Chamber Serials in Bangladesh",
    subheadline:
      "Fast, 100% free, local-first doctor discovery and chamber appointment booking across Dhaka, Chattogram, and Sylhet.",
    cards: [
      {
        title: "For Patients",
        desc: "Search BM&DC-verified specialists by city and fee (৳), and book your chamber serial.",
      },
      {
        title: "For Doctors",
        desc: "Manage chamber schedules, slot duration, blocked dates, and daily patient serials.",
      },
      {
        title: "For Admins",
        desc: "Verify doctor BM&DC registrations, manage clinics & specialties, and audit access logs.",
      },
    ],
    footer: "100% Free • Offline-Capable Local PostgreSQL + Next.js App",
  },
  bn: {
    brand: "স্বাস্থ্য সেবা",
    brandSub: "Shasthyo Sheba",
    toggleBtn: "English",
    badge: "ফেজ ০ ফাউন্ডেশন প্রস্তুত • লোকাল উইন্ডোজ মোড",
    headline: "যাচাইকৃত ডাক্তার খুঁজুন এবং চেম্বার সিরিয়াল বুক করুন",
    subheadline:
      "ঢাকা, চট্টগ্রাম ও সিলেট জুড়ে বিএমএন্ডডিসি যাচাইকৃত বিশেষজ্ঞ ডাক্তারদের চেম্বার অ্যাপয়েন্টমেন্ট বুকিং প্ল্যাটফর্ম।",
    cards: [
      {
        title: "রোগীদের জন্য",
        desc: "শহর, বিভাগ ও ফি (৳) অনুযায়ী বিশেষজ্ঞ ডাক্তার খুঁজুন এবং সহজেই চেম্বার সিরিয়াল নিন।",
      },
      {
        title: "ডাক্তারদের জন্য",
        desc: "চেম্বারের সময়সূচি, স্লট ডিউরেশন, ছুটির দিন এবং প্রতিদিনের রোগীর সিরিয়াল পরিচালনা করুন।",
      },
      {
        title: "অ্যাডমিনদের জন্য",
        desc: "ডাক্তারদের বিএমএন্ডডিসি নিবন্ধন যাচাই, ক্লিনিক ও বিভাগ ব্যবস্থাপনা এবং অডিট লগ পর্যবেক্ষণ।",
      },
    ],
    footer: "১০০% ফ্রি • লোকাল পোস্টগ্রেএসকিউএল + নেক্সট.জেএস অ্যাপ",
  },
} as const;

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = copy[lang];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-sm">
              +
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                {t.brand}
              </h1>
              <p className="text-xs text-slate-500">{t.brandSub}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "bn" : "en")}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100"
          >
            {t.toggleBtn}
          </button>
        </div>
      </header>

      <main className="mx-auto flex-1 max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 sm:p-10 shadow-sm">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            {t.badge}
          </span>
          <h2 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {t.headline}
          </h2>
          <p className="mt-3 max-w-2xl text-base sm:text-lg text-slate-600">
            {t.subheadline}
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {t.cards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-base font-bold text-slate-900">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        {t.footer}
      </footer>
    </div>
  );
}
