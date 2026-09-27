"use client";

import { useEffect, useState } from "react";
import { useApp } from "./LanguageContext";
import { formatNumber } from "@/lib/utils";

export default function HotspotMap() {
  const { lang } = useApp();
  const [rows, setRows] = useState<{ _id: string; count: number; avgRisk: number }[]>([]);

  useEffect(() => {
    fetch("/api/hotspots")
      .then((r) => r.json())
      .then((d) => setRows(d.hotspots || []))
      .catch(() => setRows([]));
  }, []);

  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <section className="border-b border-white/5 py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-extrabold text-white sm:text-3xl">
          {lang === "bn" ? "স্ক্যাম হটস্পট" : "Scam Hotspots"}
        </h2>
        <p className="mt-2 text-center text-sm text-white/50">
          {lang === "bn" ? "এলাকা অনুযায়ী রিপোর্টের ঘনত্ব" : "Report density by reported location"}
        </p>
        <div className="card-surface mt-8 space-y-2 rounded-xl p-5">
          {rows.map((r) => (
            <div key={r._id} className="flex items-center gap-3 text-sm">
              <span className="w-32 truncate font-medium text-white/80">{r._id}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-danger-500" style={{ width: `${Math.round((r.count / max) * 100)}%` }} />
              </div>
              <span className="w-16 text-right font-bold text-white/80">{formatNumber(lang, r.count)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
