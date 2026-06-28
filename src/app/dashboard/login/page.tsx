"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, ArrowRight, Loader2, KeyRound } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

function LoginForm() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!email.trim() || !email.includes("@")) {
      setError(t("emailErrorPrompt"));
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/dashboard/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request login link.");
      }

      if (data.fallbackMode) {
        setSuccess(t("loginLocalMsg"));
      } else {
        setSuccess(t("loginSuccessMsg"));
      }
      setEmail("");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-12 md:py-20 fade-in w-full">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-primary mb-2">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">{t("portalTitle")}</h1>
          <p className="text-xs text-secondary-foreground max-w-xs mx-auto leading-relaxed">
            {t("portalSubtitle")}
          </p>
        </div>

        {error && (
          <div className="p-3.5 text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/50 animate-in fade-in duration-200">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3.5 text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-xl border border-green-200 dark:border-green-900/50 leading-relaxed animate-in fade-in duration-200 space-y-1">
            <p>{success}</p>
            {success !== t("loginLocalMsg") && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-1 border-t border-green-200 dark:border-green-900/50 pt-1">
                {t("spamFolderNotice")}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-secondary-foreground uppercase tracking-wider">
              {t("modalEmailLabel")}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("modalEmailPlaceholder")}
                className="w-full bg-input border border-border pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-accent-warm transition-all"
              />
            </div>
          </div>

          <button
            id="login-request-submit"
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-xl font-medium hover:bg-opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("requestingLinkBtn")}</span>
              </>
            ) : (
              <>
                <span>{t("sendMagicLinkBtn")}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-border/50">
          <a
            href="/"
            className="text-xs text-secondary-foreground hover:text-accent-warm transition-colors font-mono"
          >
            &larr; {t("backToHomeLink")}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useLanguage();

  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto px-6 py-20 text-center flex flex-col items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        <p className="text-xs text-secondary-foreground mt-2 font-mono">{t("loadingPortal")}</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
