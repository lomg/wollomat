"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Mail, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  email: string;
}

export default function DashboardHeader({ email }: Props) {
  const { t } = useLanguage();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/dashboard/logout", { method: "POST" });
      router.push("/dashboard/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-secondary-foreground">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary">{t("dashboardTitle")}</h1>
          <div className="flex items-center gap-1.5 text-xs text-secondary-foreground mt-0.5">
            <Mail className="w-3.5 h-3.5" />
            <span className="font-mono">{email}</span>
          </div>
        </div>
      </div>
      <button
        id="dashboard-logout-btn"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="inline-flex items-center gap-2 self-start sm:self-center px-4 py-2 text-xs font-semibold bg-secondary text-secondary-foreground border border-border hover:bg-opacity-80 rounded-xl transition-all cursor-pointer disabled:opacity-50"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>{isLoggingOut ? t("loggingOutBtn") : t("logoutBtn")}</span>
      </button>
    </div>
  );
}
