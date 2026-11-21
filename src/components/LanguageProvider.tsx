"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Lang, translations } from "@/lib/i18n/translations";

interface LanguageContextValue {
  lang: Lang;
  setLang: (next: Lang) => void;
  toggleLang: () => void;
  t: (typeof translations)[Lang];
}

const STORAGE_KEY = "shasthyo_lang";

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  toggleLang: () => {},
  t: translations.en,
});

export function LanguageProvider({
  initialLang = "en",
  children,
}: {
  initialLang?: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "bn") {
      setLangState(saved);
    } else if (initialLang) {
      window.localStorage.setItem(STORAGE_KEY, initialLang);
    }
  }, [initialLang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    void fetch("/api/user/lang", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: next }),
    }).catch(() => {});
  };

  const toggleLang = () => {
    setLang(lang === "en" ? "bn" : "en");
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        t: translations[lang],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
