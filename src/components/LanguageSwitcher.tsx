"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-secondary border border-border p-1 rounded-xl text-xs font-mono font-medium shrink-0">
      <button
        onClick={() => setLanguage("en")}
        className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
          language === "en"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-secondary-foreground hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("de")}
        className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
          language === "de"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-secondary-foreground hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
      >
        DE
      </button>
    </div>
  );
}
