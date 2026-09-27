"use client";

import { useState } from "react";
import { useApp } from "./LanguageContext";
import { useToast } from "./Toast";
import { DEMO_EXAMPLES } from "@/lib/demoData";
import { formatNumber, localizeError } from "@/lib/utils";

type InputType = "url" | "phone" | "message" | "shop" | "social";

const TYPE_OPTIONS: { id: InputType; en: string; bn: string; icon: string }[] = [
  { id: "url", en: "URL / Link", bn: "লিংক / ইউআরএল", icon: "🔗" },
  { id: "phone", en: "Phone Number", bn: "ফোন নাম্বার", icon: "📱" },
  { id: "message", en: "Message / Text", bn: "মেসেজ / টেক্সট", icon: "✉️" },
  { id: "shop", en: "Online Shop", bn: "অনলাইন শপ", icon: "🛒" },
  { id: "social", en: "Social Media Account", bn: "সোশ্যাল মিডিয়া অ্যাকাউন্ট", icon: "👤" },
];

const PIPELINE_STEPS_EN = [
  "Input Validation",
  "Pattern Analysis",
  "Database Check",
  "AI Risk Analysis",
  "Community Intelligence",
  "Final Risk Assessment",
];
const PIPELINE_STEPS_BN = [
  "ইনপুট যাচাই",
  "প্যাটার্ন বিশ্লেষণ",
  "ডেটাবেস চেক",
  "AI রিস্ক অ্যানালাইসিস",
  "কমিউনিটি ইনটেলিজেন্স",
  "চূড়ান্ত রিস্ক মূল্যায়ন",
];

interface CheckResult {
  analysisId: string;
  riskScore: number;
  riskLevel: "Safe" | "Suspicious" | "High Risk" | "Critical";
  riskLevelBn: string;
  confidence: number;
  signals: { id: string; labelEn: string; labelBn: string; weight: number }[];
  explanationEn: string;
  explanationBn: string;
  recommendedActionEn: string;
  recommendedActionBn: string;
  aiUsed: boolean;
  similarReportsCount: number;
  nearDuplicateKey?: string | null;
  scamPattern: { key: string; nameEn: string; nameBn: string; requiredSignals: string[] } | null;
}

const LEVEL_STYLES: Record<string, string> = {
  Safe: "text-brand-400 border-brand-500/40 bg-brand-500/10",
  Suspicious: "text-warn-500 border-warn-500/40 bg-warn-500/10",
  "High Risk": "text-orange-400 border-orange-500/40 bg-orange-500/10",
  Critical: "text-danger-500 border-danger-500/40 bg-danger-500/10",
};

export default function ScamChecker() {
  const { lang, t } = useApp();
  const { show } = useToast();
  const [inputType, setInputType] = useState<InputType>("url");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = lang === "bn" ? PIPELINE_STEPS_BN : PIPELINE_STEPS_EN;

  function loadDemo(id: string) {
    const demo = DEMO_EXAMPLES.find((d) => d.id === id);
    if (!demo) return;
    setInputType(demo.inputType);
    setValue(demo.value);
    setDescription(demo.description);
    setIsDemo(true);
    setResult(null);
    setError(null);
  }

  async function runAnalysis() {
    if (!value.trim()) {
      show(lang === "bn" ? "অনুগ্রহ করে তথ্য দিন" : "Please enter something to check", "error");
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    setStepIndex(0);

    const stepTimer = setInterval(() => {
      setStepIndex((i) => (i < steps.length - 1 ? i + 1 : i));
    }, 480);

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputType, value, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      await new Promise((r) => setTimeout(r, steps.length * 480 + 300));
      setResult(data);
    } catch (err) {
      setError(localizeError(lang, err));
      show(lang === "bn" ? "বিশ্লেষণ ব্যর্থ হয়েছে" : "Analysis failed. Please try again.", "error");
    } finally {
      clearInterval(stepTimer);
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl card-surface p-5 sm:p-8">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />

      <div className="relative">
        <h3 className="text-xl font-bold text-white sm:text-2xl">
          {lang === "bn" ? "কী চেক করতে চান নির্বাচন করুন" : "Choose what to check"}
        </h3>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => { setInputType(opt.id); setIsDemo(false); }}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition ${
                inputType === opt.id
                  ? "border-brand-500 bg-brand-500/10 text-brand-300"
                  : "border-white/10 text-white/60 hover:border-white/20"
              }`}
            >
              <span className="text-lg">{opt.icon}</span>
              {lang === "bn" ? opt.bn : opt.en}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          <input
            value={value}
            onChange={(e) => { setValue(e.target.value); setIsDemo(false); }}
            placeholder={
              lang === "bn"
                ? "লিংক, ফোন নাম্বার, পেজ/শপের নাম লিখুন..."
                : "Enter a URL, phone number, page or shop name..."
            }
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-brand-500"
          />
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setIsDemo(false); }}
            placeholder={
              lang === "bn"
                ? "অতিরিক্ত বিস্তারিত বা মেসেজের টেক্সট (ঐচ্ছিক)..."
                : "Optional: paste the message text or extra details for a more accurate check..."
            }
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-brand-500"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/40">
            {lang === "bn" ? "ডেমো উদাহরণ:" : "Try a demo example:"}
          </span>
          {DEMO_EXAMPLES.map((d) => (
            <button
              key={d.id}
              onClick={() => loadDemo(d.id)}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60 hover:border-brand-500/40 hover:text-brand-400"
            >
              {lang === "bn" ? d.titleBn : d.titleEn}
            </button>
          ))}
        </div>
        {isDemo && (
          <p className="mt-2 text-xs font-semibold text-warn-500">
            ⚠ {t("demoLabel")}
          </p>
        )}

        <button
          onClick={runAnalysis}
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-brand-500 py-3 text-sm font-bold text-ink-900 shadow-glow transition hover:bg-brand-400 disabled:opacity-60"
        >
          {loading
            ? lang === "bn" ? "বিশ্লেষণ চলছে..." : "Analyzing..."
            : lang === "bn" ? "এখনই যাচাই করুন" : "Analyze Now"}
        </button>

        {loading && (
          <div className="mt-6 space-y-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    i < stepIndex
                      ? "bg-brand-500 text-ink-900"
                      : i === stepIndex
                      ? "bg-brand-500/30 text-brand-300 animate-pulseSoft"
                      : "bg-white/10 text-white/30"
                  }`}
                >
                  {i < stepIndex ? "✓" : i + 1}
                </span>
                <span className={i <= stepIndex ? "text-white" : "text-white/30"}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <p className="mt-4 rounded-lg border border-danger-500/40 bg-danger-500/10 p-3 text-sm text-danger-50">{error}</p>
        )}

        {result && !loading && (
          <div className="mt-8 space-y-5 border-t border-white/10 pt-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">
                  {lang === "bn" ? "রিস্ক স্কোর" : "Risk Score"}
                </p>
                <p className="text-4xl font-extrabold text-white">{formatNumber(lang, result.riskScore)}/{formatNumber(lang, 100)}</p>
              </div>
              <span className={`rounded-full border px-4 py-1.5 text-sm font-bold ${LEVEL_STYLES[result.riskLevel]}`}>
                {lang === "bn" ? result.riskLevelBn : result.riskLevel}
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${
                  result.riskScore < 25 ? "bg-brand-500" : result.riskScore < 50 ? "bg-warn-500" : result.riskScore < 75 ? "bg-orange-500" : "bg-danger-500"
                }`}
                style={{ width: `${result.riskScore}%` }}
              />
            </div>

            <p className="text-sm leading-relaxed text-white/80">
              {lang === "bn" ? result.explanationBn : result.explanationEn}
            </p>

            {result.signals.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
                  {lang === "bn" ? "শনাক্তকৃত সতর্কতা চিহ্ন" : "Detected Warning Signals"}
                </p>
                <ul className="space-y-1.5">
                  {result.signals.map((s) => (
                    <li key={s.id} className="flex items-start gap-2 text-sm text-white/80">
                      <span className="mt-0.5 text-warn-500">•</span>
                      {lang === "bn" ? s.labelBn : s.labelEn}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-lg border border-danger-500/30 bg-danger-500/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-danger-500">
                {lang === "bn" ? "প্রস্তাবিত পদক্ষেপ" : "Recommended Action"}
              </p>
              <p className="mt-1 text-sm text-white/90">
                {lang === "bn" ? result.recommendedActionBn : result.recommendedActionEn}
              </p>
            </div>

            {result.scamPattern && (
              <div className="rounded-lg border border-brand-500/30 bg-brand-500/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">
                  {lang === "bn" ? "স্ক্যাম ডিএনএ — প্যাটার্ন মিল" : "Scam DNA — Pattern Match"}
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {lang === "bn" ? result.scamPattern.nameBn : result.scamPattern.nameEn}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  {lang === "bn"
                    ? "এই রিপোর্টটি একটি পরিচিত স্ক্যাম প্যাটার্নের সাথে মিলে যায়।"
                    : "This matches a recognized recurring scam pattern seen in other community reports."}
                </p>
              </div>
            )}

            {result.nearDuplicateKey && (
              <p className="rounded-lg border border-warn-500/30 bg-warn-500/5 p-3 text-xs text-white/70">
                {lang === "bn"
                  ? "এটি আগের একটি রিপোর্টের সাথে প্রায় মিলে গেছে — কমিউনিটি কাউন্ট একত্র করা হয়েছে।"
                  : "This closely matches a previously reported entity — community counts were merged."}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-xs text-white/40">
              <span>
                {lang === "bn" ? "কনফিডেন্স" : "Confidence"}: {formatNumber(lang, result.confidence)}%
              </span>
              <span>
                {lang === "bn" ? "কমিউনিটি রিপোর্ট" : "Similar Community Reports"}: {formatNumber(lang, result.similarReportsCount)}
              </span>
              <span>
                {result.aiUsed
                  ? lang === "bn" ? "AI-সহায়তায় বিশ্লেষণ" : "AI-assisted analysis"
                  : lang === "bn" ? "নিয়ম-ভিত্তিক বিশ্লেষণ (কোনো AI কী কনফিগার করা নেই)" : "Rule-based analysis (no AI key configured)"}
              </span>
            </div>
            <FeedbackButtons analysisId={result.analysisId} />
          </div>
        )}
      </div>
    </div>
  );
}

function FeedbackButtons({ analysisId }: { analysisId: string }) {
  const { lang } = useApp();
  const { show } = useToast();
  const [sent, setSent] = useState(false);
  async function send(accurate: boolean) {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, accurate }),
      });
      setSent(true);
      show(lang === "bn" ? "মতামতের জন্য ধন্যবাদ" : "Thanks for your feedback", "success");
    } catch {
      show(lang === "bn" ? "মতামত পাঠানো যায়নি" : "Could not send feedback", "error");
    }
  }
  if (sent) return <p className="text-xs text-white/40">{lang === "bn" ? "আপনার মতামত সংরক্ষিত হয়েছে।" : "Feedback saved."}</p>;
  return (
    <div className="flex items-center gap-2 text-xs text-white/50">
      <span>{lang === "bn" ? "এই মূল্যায়ন কি সঠিক মনে হয়েছে?" : "Was this assessment accurate?"}</span>
      <button onClick={() => send(true)} className="rounded-full border border-white/15 px-3 py-1 hover:border-brand-500/50">👍</button>
      <button onClick={() => send(false)} className="rounded-full border border-white/15 px-3 py-1 hover:border-danger-500/50">👎</button>
    </div>
  );
}
