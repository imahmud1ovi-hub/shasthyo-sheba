"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

interface SpecialtyItem {
  id: string;
  nameEn: string;
  nameBn: string;
}

interface ClinicItem {
  id: string;
  nameEn: string;
  nameBn: string;
  cityEn: string;
  cityBn: string;
  areaEn: string;
  areaBn: string;
}

export function DoctorRegisterClient({
  userPhone,
  specialties,
  clinics,
}: {
  userPhone: string;
  specialties: SpecialtyItem[];
  clinics: ClinicItem[];
}) {
  const { lang, t } = useLanguage();
  const router = useRouter();

  const [bmdcNumber, setBmdcNumber] = useState("");
  const [gender, setGender] = useState("MALE");
  const [titleEn, setTitleEn] = useState("");
  const [titleBn, setTitleBn] = useState("");
  const [qualificationsEn, setQualificationsEn] = useState(
    "MBBS (DMC), FCPS"
  );
  const [qualificationsBn, setQualificationsBn] = useState(
    "এমবিবিএস (ডিএমসি), এফসিপিএস"
  );
  const [experienceYears, setExperienceYears] = useState("6");
  const [specialtyId, setSpecialtyId] = useState(specialties[0]?.id ?? "");
  const [clinicId, setClinicId] = useState(clinics[0]?.id ?? "");
  const [feeBdt, setFeeBdt] = useState("700");
  const [roomNumber, setRoomNumber] = useState("Room 205");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a BM&DC registration certificate file.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("bmdcNumber", bmdcNumber);
      formData.append("gender", gender);
      formData.append("titleEn", titleEn);
      formData.append("titleBn", titleBn);
      formData.append("qualificationsEn", qualificationsEn);
      formData.append("qualificationsBn", qualificationsBn);
      formData.append("experienceYears", experienceYears);
      formData.append("specialtyId", specialtyId);
      formData.append("clinicId", clinicId);
      formData.append("feeBdt", feeBdt);
      formData.append("roomNumber", roomNumber);
      formData.append("bmdcDocument", file);

      const res = await fetch("/api/doctors/register", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error?.message || "Doctor registration failed.");
        return;
      }

      router.push(json.data.redirectTo || "/doctor/dashboard");
      router.refresh();
    } catch {
      setError("Network error while submitting registration.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          {userPhone}
        </span>
        <h1 className="mt-3 text-xl sm:text-2xl font-bold text-slate-900">
          {t.doctorRegister.pageTitle}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          {t.doctorRegister.pageSubtitle}
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                {t.doctorRegister.bmdcNumberLabel}
              </label>
              <input
                type="text"
                required
                value={bmdcNumber}
                onChange={(e) => setBmdcNumber(e.target.value)}
                placeholder="A-10025"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                {t.doctorRegister.genderLabel}
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="MALE">{t.discovery.genderMale}</option>
                <option value="FEMALE">{t.discovery.genderFemale}</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                {t.doctorRegister.titleEnLabel}
              </label>
              <input
                type="text"
                required
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Dr. Tareq Aziz"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                {t.doctorRegister.titleBnLabel}
              </label>
              <input
                type="text"
                required
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
                placeholder="ডা. তারেক আজিজ"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                {t.doctorRegister.qualEnLabel}
              </label>
              <input
                type="text"
                required
                value={qualificationsEn}
                onChange={(e) => setQualificationsEn(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                {t.doctorRegister.qualBnLabel}
              </label>
              <input
                type="text"
                required
                value={qualificationsBn}
                onChange={(e) => setQualificationsBn(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                {t.doctorRegister.specialtyLabel}
              </label>
              <select
                required
                value={specialtyId}
                onChange={(e) => setSpecialtyId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {lang === "bn" ? s.nameBn : s.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                {t.doctorRegister.experienceLabel}
              </label>
              <input
                type="number"
                min={0}
                max={70}
                required
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                {t.doctorRegister.feeBdtLabel}
              </label>
              <input
                type="number"
                min={0}
                step={50}
                required
                value={feeBdt}
                onChange={(e) => setFeeBdt(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                {t.doctorRegister.clinicLabel}
              </label>
              <select
                required
                value={clinicId}
                onChange={(e) => setClinicId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === "bn"
                      ? `${c.nameBn} (${c.areaBn}, ${c.cityBn})`
                      : `${c.nameEn} (${c.areaEn}, ${c.cityEn})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                {t.doctorRegister.roomNumberLabel}
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              {t.doctorRegister.docUploadLabel}
            </label>
            <input
              type="file"
              required
              accept=".pdf,image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs sm:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting
              ? t.doctorRegister.submittingBtn
              : t.doctorRegister.submitBtn}
          </button>
        </form>
      </div>
    </main>
  );
}
