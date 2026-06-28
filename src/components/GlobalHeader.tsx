"use client";

import React from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

export default function GlobalHeader() {
  const { t } = useLanguage();

  return (
    <header className="border-b border-border py-4 px-6 glassmorphism sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <a href="/" id="header-logo-link" className="flex items-center space-x-2 text-xl font-bold tracking-tight">
          <span className="text-accent-warm">✒</span>
          <span>{t("appName")}</span>
        </a>
        <div className="flex items-center gap-4">
          <div className="hidden xs:block text-xs text-secondary-foreground font-mono bg-secondary px-2.5 py-1 rounded-full">
            v1.0.0
          </div>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
