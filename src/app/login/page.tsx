"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

function LoginForm() {
  const { t, setLang } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phone, setPhone] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error?.message || "Failed to send OTP.");
        return;
      }
      setNormalizedPhone(json.data.phone);
      setStep("OTP");
    } catch {
      setError("Network error while requesting OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone || phone, code }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error?.message || "Invalid OTP code.");
        return;
      }

      if (json.data.user?.preferredLang) {
        setLang(json.data.user.preferredLang);
      }

      const nextParam = searchParams.get("next");
      const target =
        nextParam && nextParam.startsWith("/")
          ? nextParam
          : json.data.redirectTo || "/";
      router.push(target);
      router.refresh();
    } catch {
      setError("Network error while verifying OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          {t.login.title}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{t.login.subtitle}</p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {step === "PHONE" ? (
          <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-semibold text-slate-700"
              >
                {t.login.phoneLabel}
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.login.phonePlaceholder}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? t.login.sendingOtp : t.login.sendOtpBtn}
            </button>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500">
                {t.login.quickFillTitle}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPhone("01700000000")}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-mono text-slate-700 hover:bg-slate-100"
                >
                  Admin (01700000000)
                </button>
                <button
                  type="button"
                  onClick={() => setPhone("01711111111")}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-mono text-slate-700 hover:bg-slate-100"
                >
                  Patient (01711111111)
                </button>
                <button
                  type="button"
                  onClick={() => setPhone("01712000001")}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-mono text-slate-700 hover:bg-slate-100"
                >
                  Doctor #1 (01712000001)
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm text-emerald-800">
              {t.login.otpSentNotice.replace("{phone}", normalizedPhone)}
            </div>

            <div>
              <label
                htmlFor="otp-code"
                className="block text-sm font-semibold text-slate-700"
              >
                {t.login.otpLabel}
              </label>
              <input
                id="otp-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t.login.otpPlaceholder}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base font-mono tracking-widest focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? t.login.verifyingOtp : t.login.verifyOtpBtn}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("PHONE");
                setCode("");
                setError(null);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t.login.changePhoneBtn}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
