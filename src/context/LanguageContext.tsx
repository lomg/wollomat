"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, TranslationKey } from "@/lib/translations";

type Language = "en" | "de";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("wollomat_lang") as Language;
    if (savedLang === "en" || savedLang === "de") {
      setLanguageState(savedLang);
      document.cookie = `wollomat_lang=${savedLang}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      const browserLang = navigator.language.startsWith("de") ? "de" : "en";
      setLanguageState(browserLang);
      document.cookie = `wollomat_lang=${browserLang}; path=/; max-age=31536000; SameSite=Lax`;
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("wollomat_lang", lang);
    document.cookie = `wollomat_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const t = (key: TranslationKey): string => {
    const dict = translations[language] || translations.en;
    return (dict[key] || translations.en[key] || key) as string;
  };

  // Prevent flash of untranslated content by delaying render slightly if needed,
  // but to keep Next SSR happy we just render the children with the initial state
  // and update client-side after mounting.
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
