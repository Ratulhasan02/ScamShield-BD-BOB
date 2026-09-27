"use client";

import { useApp } from "./LanguageContext";
import { PATTERN_LIBRARY, SIGNAL_LIBRARY } from "@/lib/riskEngine";

export default function ScamDNASection() {
  const { lang, t } = useApp();
  return (
    <section className="border-b border-white/5 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-extrabold text-white sm:text-3xl">{t("scamIntelligence")}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-white/60">
          {lang === "bn"
            ? "ScamShield BD প্রতিটি রিপোর্টকে আলাদাভাবে না দেখে একই ধরনের রিপোর্টগুলোকে একত্র করে একটি স্ক্যাম \"প্যাটার্ন\" চিহ্নিত করে — যাকে আমরা Scam DNA বলি।"
            : "Instead of treating every report in isolation, ScamShield BD clusters similar reports into a recognizable scam \"pattern\" — what we call its Scam DNA."}
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PATTERN_LIBRARY.map((p) => (
            <div key={p.key} className="card-surface rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">Scam Pattern</p>
              <h3 className="mt-1 text-lg font-bold text-white">{lang === "bn" ? p.nameBn : p.nameEn}</h3>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-white/40">
                {lang === "bn" ? "সাধারণ সিগনাল" : "Common Signals"}
              </p>
              <ul className="mt-1 space-y-1 text-sm text-white/70">
                {p.requiredSignals.map((s) => {
                  const sig = SIGNAL_LIBRARY.find((x) => x.id === s);
                  const label = sig ? (lang === "bn" ? sig.labelBn : sig.labelEn) : s.replace(/_/g, " ");
                  return (
                    <li key={s} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> {label}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
