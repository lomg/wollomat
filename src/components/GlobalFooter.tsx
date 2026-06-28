"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function GlobalFooter() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border py-6 px-6 bg-card text-center text-xs text-secondary-foreground mt-auto">
      <div className="max-w-6xl mx-auto flex justify-center">
        <p>
          &copy; {new Date().getFullYear()} {t("appName")}.{" "}
          <a 
            href="https://github.com/lomg/wollomat" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-accent-warm hover:underline transition-colors font-medium"
          >
            {t("footerText")}
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
