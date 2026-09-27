"use client";

import { useState } from "react";
import { useApp } from "./LanguageContext";
import { useToast } from "./Toast";
import { formatNumber, localizeError } from "@/lib/utils";

const SCAM_TYPES: { value: string; en: string; bn: string }[] = [
  { value: "Fake Facebook Page", en: "Fake Facebook Page", bn: "ভুয়া ফেসবুক পেজ" },
  { value: "Fake Online Shop", en: "Fake Online Shop", bn: "ভুয়া অনলাইন শপ" },
  { value: "Scam Website", en: "Scam Website", bn: "স্ক্যাম ওয়েবসাইট" },
  { value: "Fraudulent Job Offer", en: "Fraudulent Job Offer", bn: "প্রতারণামূলক চাকরির অফার" },
  { value: "Investment Scheme", en: "Investment Scheme", bn: "বিনিয়োগ স্কিম" },
  { value: "Suspicious Phone Number", en: "Suspicious Phone Number", bn: "সন্দেহজনক ফোন নাম্বার" },
  { value: "Payment Fraud", en: "Payment Fraud", bn: "পেমেন্ট প্রতারণা" },
  { value: "Phishing Link", en: "Phishing Link", bn: "ফিশিং লিংক" },
  { value: "Fake Customer Support", en: "Fake Customer Support", bn: "ভুয়া কাস্টমার সাপোর্ট" },
  { value: "Social Engineering", en: "Social Engineering", bn: "সোশ্যাল ইঞ্জিনিয়ারিং" },
  { value: "Other", en: "Other", bn: "অন্যান্য" },
];
const PLATFORMS: { value: string; en: string; bn: string }[] = [
  { value: "Facebook", en: "Facebook", bn: "ফেসবুক" },
  { value: "WhatsApp", en: "WhatsApp", bn: "হোয়াটসঅ্যাপ" },
  { value: "Website", en: "Website", bn: "ওয়েবসাইট" },
  { value: "bKash", en: "bKash", bn: "বিকাশ" },
  { value: "Nagad", en: "Nagad", bn: "নগদ" },
  { value: "Rocket", en: "Rocket", bn: "রকেট" },
  { value: "Phone Call", en: "Phone Call", bn: "ফোন কল" },
  { value: "SMS", en: "SMS", bn: "এসএমএস" },
  { value: "Other", en: "Other", bn: "অন্যান্য" },
];

export default function ReportForm() {
  const { lang } = useApp();
  const { show } = useToast();
  const [form, setForm] = useState({
    scamType: SCAM_TYPES[0].value,
    platform: PLATFORMS[0].value,
    phone: "",
    url: "",
    accountName: "",
    description: "",
    evidenceText: "",
    amountInvolved: "",
    incidentDate: "",
    location: "",
    reporterContact: "",
  });
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ reportId: string; riskScore: number; riskLevel: string } | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4_000_000) {
      show(lang === "bn" ? "ছবিটি খুব বড় (৪MB এর কম দিন)" : "Image too large (max 4MB)", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function submit() {
    if (!form.description.trim() || form.description.length < 10) {
      show(lang === "bn" ? "বিস্তারিত লিখুন (কমপক্ষে ১০ অক্ষর)" : "Please describe what happened (min 10 characters)", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amountInvolved: form.amountInvolved ? Number(form.amountInvolved) : undefined,
          screenshotDataUrl: screenshot || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSuccess(data);
      show(lang === "bn" ? "রিপোর্ট সফলভাবে জমা হয়েছে" : "Report submitted successfully", "success");
    } catch (err) {
      show(localizeError(lang, err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="card-surface rounded-2xl p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/15 text-2xl text-brand-400">✓</div>
        <h2 className="mt-4 text-xl font-bold text-white">
          {lang === "bn" ? "রিপোর্ট সফলভাবে জমা হয়েছে" : "Report submitted successfully"}
        </h2>
        <p className="mt-2 text-sm text-white/60">
          {lang === "bn" ? "আপনার রিপোর্ট আইডি" : "Your report ID"}:{" "}
          <span className="font-mono font-bold text-brand-400">{success.reportId}</span>
        </p>
        <p className="mt-1 text-sm text-white/60">
          {lang === "bn" ? "প্রাথমিক রিস্ক স্কোর" : "Preliminary risk score"}: {formatNumber(lang, success.riskScore)}/{formatNumber(lang, 100)} ({success.riskLevel})
        </p>
        <button
          onClick={() => { setSuccess(null); setForm({ ...form, description: "", evidenceText: "" }); setScreenshot(null); }}
          className="mt-6 rounded-full border border-white/15 px-6 py-2.5 text-sm font-semibold text-white hover:border-brand-500/40"
        >
          {lang === "bn" ? "আরও একটি রিপোর্ট করুন" : "Submit another report"}
        </button>
      </div>
    );
  }

  return (
    <div className="card-surface space-y-4 rounded-2xl p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-white/50">{lang === "bn" ? "স্ক্যামের ধরন" : "Scam Type"}</label>
          <select value={form.scamType} onChange={(e) => update("scamType", e.target.value)} className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500">
            {SCAM_TYPES.map((s) => <option key={s.value} value={s.value}>{lang === "bn" ? s.bn : s.en}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-white/50">{lang === "bn" ? "প্ল্যাটফর্ম" : "Platform"}</label>
          <select value={form.platform} onChange={(e) => update("platform", e.target.value)} className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500">
            {PLATFORMS.map((s) => <option key={s.value} value={s.value}>{lang === "bn" ? s.bn : s.en}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-white/50">{lang === "bn" ? "ফোন নাম্বার (ঐচ্ছিক)" : "Phone Number (optional)"}</label>
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="01XXXXXXXXX" className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-white/50">URL ({lang === "bn" ? "ঐচ্ছিক" : "optional"})</label>
          <input value={form.url} onChange={(e) => update("url", e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-white/50">{lang === "bn" ? "পেজ/অ্যাকাউন্টের নাম (ঐচ্ছিক)" : "Page / Account Name (optional)"}</label>
          <input value={form.accountName} onChange={(e) => update("accountName", e.target.value)} className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-white/50">{lang === "bn" ? "সংশ্লিষ্ট টাকার পরিমাণ (ঐচ্ছিক)" : "Amount Involved, BDT (optional)"}</label>
          <input type="number" value={form.amountInvolved} onChange={(e) => update("amountInvolved", e.target.value)} className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-white/50">{lang === "bn" ? "ঘটনার তারিখ (ঐচ্ছিক)" : "Incident Date (optional)"}</label>
          <input type="date" value={form.incidentDate} onChange={(e) => update("incidentDate", e.target.value)} className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-white/50">{lang === "bn" ? "এলাকা / জেলা (ঐচ্ছিক)" : "Location / District (optional)"}</label>
          <input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder={lang === "bn" ? "যেমন: ঢাকা, চট্টগ্রাম..." : "e.g. Dhaka, Chattogram..."} className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-white/50">{lang === "bn" ? "আপনার যোগাযোগ (ঐচ্ছিক, প্রকাশ্য নয়)" : "Your Contact (optional, kept private)"}</label>
          <input value={form.reporterContact} onChange={(e) => update("reporterContact", e.target.value)} className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-white/50">{lang === "bn" ? "বিস্তারিত বর্ণনা *" : "Description *"}</label>
        <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500" placeholder={lang === "bn" ? "কী হয়েছিল বিস্তারিত লিখুন..." : "Describe what happened in detail..."} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-white/50">{lang === "bn" ? "প্রমাণ / মেসেজ টেক্সট (ঐচ্ছিক)" : "Evidence / Message Text (optional)"}</label>
        <textarea value={form.evidenceText} onChange={(e) => update("evidenceText", e.target.value)} rows={3} className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-white/50">{lang === "bn" ? "স্ক্রিনশট (ঐচ্ছিক)" : "Screenshot (optional)"}</label>
        <input type="file" accept="image/*" onChange={handleFile} className="block w-full text-sm text-white/60" />
        {screenshot && <p className="mt-1 text-xs text-brand-400">{lang === "bn" ? "ছবি সংযুক্ত হয়েছে — AI স্বয়ংক্রিয়ভাবে টেক্সট পড়ে নেবে" : "Image attached — AI will auto-read its text"}</p>}
      </div>

      <button onClick={submit} disabled={submitting} className="w-full rounded-lg bg-brand-500 py-3 text-sm font-bold text-ink-900 shadow-glow transition hover:bg-brand-400 disabled:opacity-60">
        {submitting ? (lang === "bn" ? "জমা হচ্ছে..." : "Submitting...") : (lang === "bn" ? "রিপোর্ট জমা দিন" : "Submit Report")}
      </button>
    </div>
  );
}
