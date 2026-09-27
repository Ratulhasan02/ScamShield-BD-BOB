"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "./LanguageContext";
import ReportCard, { ReportSummary } from "./ReportCard";

export default function CommunityPreview() {
  const { lang, t } = useApp();
  const [reports, setReports] = useState<ReportSummary[]>([]);

  useEffect(() => {
    fetch("/api/reports?limit=6")
      .then((r) => r.json())
      .then((d) => setReports(d.reports || []))
      .catch(() => setReports([]));
  }, []);

  return (
    <section className="border-b border-white/5 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">{t("communityReports")}</h2>
          <Link href="/community" className="text-sm font-semibold text-brand-400 hover:text-brand-300">
            {lang === "bn" ? "সব দেখুন →" : "View all →"}
          </Link>
        </div>
        {reports.length === 0 ? (
          <p className="mt-8 rounded-xl border border-white/10 p-8 text-center text-sm text-white/40">
            {lang === "bn"
              ? "এখনো কোনো রিপোর্ট নেই — প্রথম রিপোর্টটি জমা দিন, অথবা লাইভ ডেটার জন্য MongoDB ডেটাবেস সংযুক্ত করুন।"
              : "No reports yet — be the first to submit one, or connect a MongoDB database to see live community data."}
          </p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((r) => <ReportCard key={r.reportId} report={r} />)}
          </div>
        )}
      </div>
    </section>
  );
}
