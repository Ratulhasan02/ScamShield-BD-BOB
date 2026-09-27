"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/components/LanguageContext";
import { formatNumber, localizeError } from "@/lib/utils";

interface FullReport {
  reportId: string; scamType: string; platform: string; phone?: string; url?: string;
  accountName?: string; description: string; amountInvolved?: number; incidentDate?: string;
  status: string; riskScore?: number; riskLevel?: string; signals?: string[]; patternTag?: string;
  isDemo?: boolean; createdAt: string;
}

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const { lang } = useApp();
  const [report, setReport] = useState<FullReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reports/${params.id}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Not found");
        setReport(data);
      })
      .catch((e) => setError(localizeError(lang, e)));
  }, [params.id, lang]);

  if (error) return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-white/60">{error}</div>;
  if (!report) return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-white/40">{lang === "bn" ? "লোড হচ্ছে..." : "Loading..."}</div>;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="card-surface rounded-2xl p-6 sm:p-8">
          <p className="font-mono text-xs text-white/40">{report.reportId}</p>
          <h1 className="mt-1 text-xl font-bold text-white">{report.scamType} · {report.platform}</h1>
          <p className="mt-3 text-sm text-white/70">{report.description}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/50">
            <span>{lang === "bn" ? "অবস্থা" : "Status"}: <b className="text-white">{report.status.replace(/_/g, " ")}</b></span>
            {report.riskScore !== undefined && <span>{lang === "bn" ? "রিস্ক" : "Risk"}: <b className="text-white">{formatNumber(lang, report.riskScore)}/{formatNumber(lang, 100)} ({report.riskLevel})</b></span>}
            {report.patternTag && <span>{lang === "bn" ? "প্যাটার্ন" : "Pattern"}: <b className="text-white">{report.patternTag.replace(/_/g, " ")}</b></span>}
          </div>
          {report.isDemo && <p className="mt-3 text-xs font-semibold text-warn-500">⚠ {lang === "bn" ? "ডেমো / নমুনা ডেটা" : "Demo / sample data"}</p>}
        </div>
      </div>
    </section>
  );
}
