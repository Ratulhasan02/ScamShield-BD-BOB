"use client";

import { useEffect, useState, useCallback } from "react";
import { useApp } from "./LanguageContext";
import ReportCard, { ReportSummary } from "./ReportCard";
import { formatNumber } from "@/lib/utils";

const STATUS_FILTERS = ["all", "reported", "under_review", "community_flagged", "verified", "rejected"];

export default function CommunitySearch() {
  const { lang } = useApp();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status !== "all") params.set("status", status);
      params.set("limit", "24");
      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      setReports(data.reports || []);
      setTotal(data.total || 0);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder={lang === "bn" ? "ফোন, লিংক, শপ বা পেজের নাম দিয়ে সার্চ করুন..." : "Search by phone, URL, shop or page name..."}
          className="flex-1 rounded-lg border border-white/10 bg-ink-800 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-brand-500"
        />
        <button onClick={load} className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-bold text-ink-900 hover:bg-brand-400">
          {lang === "bn" ? "সার্চ" : "Search"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition ${
              status === s ? "border-brand-500 bg-brand-500/10 text-brand-300" : "border-white/10 text-white/50 hover:border-white/20"
            }`}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs text-white/40">{formatNumber(lang, total)} {lang === "bn" ? "টি রিপোর্ট পাওয়া গেছে" : "reports found"}</p>

      {loading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-white/10 bg-white/5" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <p className="mt-8 rounded-xl border border-white/10 p-8 text-center text-sm text-white/40">
          {lang === "bn" ? "কোনো রিপোর্ট পাওয়া যায়নি।" : "No reports found for this search."}
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => <ReportCard key={r.reportId} report={r} />)}
        </div>
      )}
    </div>
  );
}
