"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";
import { formatDate, formatNumber, localizeError } from "@/lib/utils";

interface FullReport {
  reportId: string; scamType: string; platform: string; phone?: string; url?: string;
  accountName?: string; description: string; evidenceText?: string; amountInvolved?: number;
  incidentDate?: string; status: string; riskScore?: number; riskLevel?: string;
  patternTag?: string; createdAt: string;
}

const STATUSES = ["reported", "under_review", "community_flagged", "verified", "rejected"];

export default function AdminTable() {
  const router = useRouter();
  const { show } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [reports, setReports] = useState<FullReport[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [stats, setStats] = useState<{ total: number; verified: number; underReview: number; flagged: number; rejected: number; byType?: { _id: string; count: number }[] } | null>(null);
  const [selected, setSelected] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("ssb_admin_token");
    if (!t) { router.push("/admin/login"); return; }
    setToken(t);
  }, [router]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const [reportsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/all-reports?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (reportsRes.status === 401 || statsRes.status === 401) {
        localStorage.removeItem("ssb_admin_token");
        router.push("/admin/login");
        return;
      }
      const reportsData = await reportsRes.json();
      const statsData = await statsRes.json();
      setReports(reportsData.reports || []);
      setStats(statsData);
    } catch (e) {
      show(localizeError("en", e), "error");
    } finally {
      setLoading(false);
    }
  }, [token, q, status, router, show]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(reportId: string, newStatus: string) {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      show("Report status updated", "success");
      load();
      setSelected(null);
    } catch (e) {
      show(localizeError("en", e), "error");
    }
  }

  function logout() {
    localStorage.removeItem("ssb_admin_token");
    router.push("/admin/login");
  }

  if (!token) return null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white">Admin Dashboard</h1>
        <button onClick={logout} className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold text-white/70 hover:border-danger-500/40 hover:text-danger-400">
          Log out
        </button>
      </div>

      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[
            ["Total Reports", stats.total],
            ["Verified", stats.verified],
            ["Under Review", stats.underReview],
            ["Community Flagged", stats.flagged],
            ["Rejected", stats.rejected],
          ].map(([label, val]) => (
            <div key={label as string} className="card-surface rounded-xl p-4 text-center">
              <p className="text-2xl font-extrabold text-brand-400">{formatNumber("en", val as number)}</p>
              <p className="mt-1 text-xs text-white/50">{label}</p>
            </div>
          ))}
        </div>
      )}
      {stats?.byType?.length ? (
        <div className="card-surface mt-4 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Reports by type</p>
          <div className="mt-3 space-y-2">
            {(() => {
              const rows = stats.byType || [];
              const max = Math.max(...rows.map((r) => r.count), 1);
              return rows.map((r) => (
                <div key={r._id} className="flex items-center gap-3 text-xs">
                  <span className="w-40 truncate text-white/70">{r._id || "Unknown"}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.round((r.count / max) * 100)}%` }} />
                  </div>
                  <span className="w-10 text-right font-bold text-white/80">{formatNumber("en", r.count)}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Search reports..." className="flex-1 rounded-lg border border-white/10 bg-ink-800 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-white/10 bg-ink-800 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <button onClick={load} className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-bold text-ink-900 hover:bg-brand-400">Search</button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-white/40">
            <tr>
              <th className="px-4 py-3">Report ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Identifier</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-white/40">Loading...</td></tr>
            ) : reports.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-white/40">No reports found.</td></tr>
            ) : (
              reports.map((r) => (
                <tr key={r.reportId} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-mono text-xs text-white/70">{r.reportId}</td>
                  <td className="px-4 py-3">{r.scamType}</td>
                  <td className="max-w-[160px] truncate px-4 py-3">{r.url || r.accountName || r.phone || "—"}</td>
                  <td className="px-4 py-3">{r.riskScore !== undefined && r.riskScore !== null ? formatNumber("en", r.riskScore) : "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.reportId, e.target.value)}
                      className="rounded-md border border-white/10 bg-ink-800 px-2 py-1 text-xs text-white outline-none"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40">{formatDate("en", r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(r)} className="text-xs font-semibold text-brand-400 hover:underline">View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} className="card-surface max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <h2 className="font-mono text-lg font-bold text-white">{selected.reportId}</h2>
              <button onClick={() => setSelected(null)} className="text-white/50">✕</button>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-white/40">Scam Type</dt><dd className="text-white">{selected.scamType}</dd></div>
              <div><dt className="text-white/40">Platform</dt><dd className="text-white">{selected.platform}</dd></div>
              {selected.phone && <div><dt className="text-white/40">Phone</dt><dd className="text-white">{selected.phone}</dd></div>}
              {selected.url && <div><dt className="text-white/40">URL</dt><dd className="break-all text-white">{selected.url}</dd></div>}
              {selected.accountName && <div><dt className="text-white/40">Account/Page</dt><dd className="text-white">{selected.accountName}</dd></div>}
              <div><dt className="text-white/40">Description</dt><dd className="text-white">{selected.description}</dd></div>
              {selected.evidenceText && <div><dt className="text-white/40">Evidence</dt><dd className="text-white">{selected.evidenceText}</dd></div>}
              {selected.amountInvolved !== undefined && <div><dt className="text-white/40">Amount Involved</dt><dd className="text-white">৳{selected.amountInvolved}</dd></div>}
              <div><dt className="text-white/40">Risk</dt><dd className="text-white">{selected.riskScore}/100 ({selected.riskLevel})</dd></div>
              {selected.patternTag && <div><dt className="text-white/40">Scam Pattern</dt><dd className="text-white">{selected.patternTag.replace(/_/g, " ")}</dd></div>}
            </dl>
            <div className="mt-5 flex gap-2">
              <button onClick={() => updateStatus(selected.reportId, "verified")} className="flex-1 rounded-lg bg-brand-500 py-2 text-xs font-bold text-ink-900 hover:bg-brand-400">Mark Verified</button>
              <button onClick={() => updateStatus(selected.reportId, "rejected")} className="flex-1 rounded-lg border border-danger-500/40 py-2 text-xs font-bold text-danger-400 hover:bg-danger-500/10">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
