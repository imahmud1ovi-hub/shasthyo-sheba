"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

function LoginForm() {
  const { t, setLang } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"SIGN_IN" | "REGISTER" | "OTP">("SIGN_IN");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpStep, setOtpStep] = useState<"PHONE" | "OTP">("PHONE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeRedirect = (json: {
    data?: {
      user?: { preferredLang?: "en" | "bn" };
      redirectTo?: string;
    };
  }) => {
    if (json.data?.user?.preferredLang) {
      setLang(json.data.user.preferredLang);
    }
    const nextParam = searchParams.get("next");
    const target =
      nextParam && nextParam.startsWith("/")
        ? nextParam
        : json.data?.redirectTo || "/";
    router.push(target);
    router.refresh();
  };

  const handlePasswordSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error?.message || "Invalid mobile number or password.");
        return;
      }
      completeRedirect(json);
    } catch {
      setError("Network error while signing in.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error?.message || "Failed to create account.");
        return;
      }
      completeRedirect(json);
    } catch {
      setError("Network error while creating account.");
    } finally {
      setLoading(false);
    }
  };

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
      setOtpStep("OTP");
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
      completeRedirect(json);
    } catch {
      setError("Network error while verifying OTP.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoPhone: string, demoPassword: string) => {
    setMode("SIGN_IN");
    setError(null);
    setPhone(demoPhone);
    setPassword(demoPassword);
  };

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          {t.login.title}
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
          {t.login.subtitle}
        </p>

        {/* Mode Tabs: Sign In (default) | Create Account | OTP Login */}
        <div className="mt-5 grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("SIGN_IN");
              setError(null);
            }}
            className={`rounded-lg py-2 text-xs font-bold transition ${
              mode === "SIGN_IN"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t.login.tabSignIn}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("REGISTER");
              setError(null);
            }}
            className={`rounded-lg py-2 text-xs font-bold transition ${
              mode === "REGISTER"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t.login.tabRegister}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("OTP");
              setError(null);
            }}
            className={`rounded-lg py-2 text-xs font-bold transition ${
              mode === "OTP"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t.login.tabOtp}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Default Tab 1: Phone + Password Sign In */}
        {mode === "SIGN_IN" && (
          <form onSubmit={handlePasswordSignIn} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="signin-phone"
                className="block text-sm font-semibold text-slate-700"
              >
                {t.login.phoneLabel}
              </label>
              <input
                id="signin-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.login.phonePlaceholder}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="signin-password"
                className="block text-sm font-semibold text-slate-700"
              >
                {t.login.passwordLabel}
              </label>
              <input
                id="signin-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.login.passwordPlaceholder}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? t.login.signingInBtn : t.login.signInBtn}
            </button>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500">
                {t.login.quickFillTitle}
              </p>
              <div className="mt-2 grid gap-1.5">
                <button
                  type="button"
                  onClick={() => fillDemoAccount("01700000000", "admin123")}
                  className="text-left rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 hover:bg-emerald-50 hover:border-emerald-200"
                >
                  Admin: 01700000000 / admin123
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount("01711111111", "patient123")}
                  className="text-left rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 hover:bg-emerald-50 hover:border-emerald-200"
                >
                  Patient: 01711111111 / patient123
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount("01712000001", "doctor123")}
                  className="text-left rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 hover:bg-emerald-50 hover:border-emerald-200"
                >
                  Doctor #1: 01712000001 / doctor123
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Create New Patient Account */}
        {mode === "REGISTER" && (
          <form onSubmit={handlePasswordRegister} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="reg-name"
                className="block text-sm font-semibold text-slate-700"
              >
                {t.login.nameLabel}
              </label>
              <input
                id="reg-name"
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.login.namePlaceholder}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="reg-phone"
                className="block text-sm font-semibold text-slate-700"
              >
                {t.login.phoneLabel}
              </label>
              <input
                id="reg-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.login.phonePlaceholder}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="reg-password"
                className="block text-sm font-semibold text-slate-700"
              >
                {t.login.passwordLabel}
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.login.passwordPlaceholder}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? t.login.registeringBtn : t.login.registerBtn}
            </button>
          </form>
        )}

        {/* Tab 3: Secondary Mobile OTP Login */}
        {mode === "OTP" &&
          (otpStep === "PHONE" ? (
            <form onSubmit={handleRequestOtp} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="otp-phone"
                  className="block text-sm font-semibold text-slate-700"
                >
                  {t.login.phoneLabel}
                </label>
                <input
                  id="otp-phone"
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
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
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
                  setOtpStep("PHONE");
                  setCode("");
                  setError(null);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t.login.changePhoneBtn}
              </button>
            </form>
          ))}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-sm text-slate-500">
          Loading... • লোড হচ্ছে...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
