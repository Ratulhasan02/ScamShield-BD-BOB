"use client";

import { useApp } from "./LanguageContext";
import { formatNumber } from "@/lib/utils";

export interface ReportSummary {
  reportId: string;
  scamType: string;
  platform: string;
  phone?: string;
  url?: string;
  accountName?: string;
  descriptionSummary?: string;
  amountInvolved?: number;
  status: string;
  riskScore?: number;
  riskLevel?: string;
  patternTag?: string;
  isDemo?: boolean;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { en: string; bn: string; cls: string }> = {
  reported: { en: "Reported", bn: "রিপোর্ট হয়েছে", cls: "bg-white/10 text-white/70" },
  under_review: { en: "Under Review", bn: "পর্যালোচনায় আছে", cls: "bg-warn-500/15 text-warn-500" },
  community_flagged: { en: "Community Flagged", bn: "কমিউনিটি ফ্ল্যাগড", cls: "bg-orange-500/15 text-orange-400" },
  verified: { en: "Verified", bn: "যাচাইকৃত", cls: "bg-brand-500/15 text-brand-400" },
  rejected: { en: "Rejected", bn: "প্রত্যাখ্যাত", cls: "bg-danger-500/15 text-danger-400" },
};

export default function ReportCard({ report }: { report: ReportSummary }) {
  const { lang } = useApp();
  const statusInfo = STATUS_LABELS[report.status] || STATUS_LABELS.reported;
  const identifier = report.url || report.accountName || report.phone || "—";

  return (
    <div className="card-surface rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-white/40">{report.reportId}</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-white">{identifier}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusInfo.cls}`}>
          {lang === "bn" ? statusInfo.bn : statusInfo.en}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-white/60">{report.descriptionSummary}</p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-white/40">{report.scamType} · {report.platform}</span>
        {report.riskScore !== undefined && (
          <span className="font-bold text-white/80">{formatNumber(lang, report.riskScore)}/{formatNumber(lang, 100)}</span>
        )}
      </div>
      {report.isDemo && <p className="mt-2 text-[11px] font-semibold text-warn-500">{lang === "bn" ? "ডেমো ডেটা" : "Demo data"}</p>}
    </div>
  );
}
