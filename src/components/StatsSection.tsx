"use client";

import { useEffect, useState } from "react";
import { useApp } from "./LanguageContext";
import { formatNumber } from "@/lib/utils";

interface Stats { source: string; scamsReported: number; usersProtected: number; threatsDetected: number; reportsVerified: number; }

export default function StatsSection() {
  const { lang, t } = useApp();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => setStats(null));
  }, []);

  const items = [
    { label: t("statsReported"), value: stats?.scamsReported },
    { label: t("statsProtected"), value: stats?.usersProtected },
    { label: t("statsThreats"), value: stats?.threatsDetected },
    { label: t("statsVerified"), value: stats?.reportsVerified },
  ];

  return (
    <section className="border-b border-white/5 bg-ink-800/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {stats?.source === "demo" && (
          <p className="mb-4 text-center text-xs font-semibold text-warn-500">⚠ {t("demoLabel")}</p>
        )}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {items.map((it) => (
            <div key={it.label} className="text-center">
              <p className="text-3xl font-extrabold text-brand-400 sm:text-4xl">
                {it.value !== undefined ? formatNumber(lang, it.value) : "—"}
              </p>
              <p className="mt-1 text-xs font-medium text-white/50 sm:text-sm">{it.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
