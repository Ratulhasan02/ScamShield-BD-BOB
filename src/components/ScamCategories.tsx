"use client";

import { useApp } from "./LanguageContext";

const CATEGORIES = [
  { icon: "📘", en: "Fake Facebook Pages", bn: "ভুয়া ফেসবুক পেজ" },
  { icon: "🛍️", en: "Fake Online Shops", bn: "ভুয়া অনলাইন শপ" },
  { icon: "🌐", en: "Scam Websites", bn: "স্ক্যাম ওয়েবসাইট" },
  { icon: "💼", en: "Fraudulent Job Offers", bn: "প্রতারণামূলক চাকরির অফার" },
  { icon: "📈", en: "Fake Investment Schemes", bn: "ভুয়া বিনিয়োগ স্কিম" },
  { icon: "📞", en: "Suspicious Phone Numbers", bn: "সন্দেহজনক ফোন নাম্বার" },
  { icon: "💳", en: "Fraudulent Payment Requests", bn: "প্রতারণামূলক পেমেন্ট অনুরোধ" },
  { icon: "🎯", en: "Phishing Links", bn: "ফিশিং লিংক" },
  { icon: "☎️", en: "Fake Customer Support", bn: "ভুয়া কাস্টমার সাপোর্ট" },
  { icon: "🕵️", en: "Social Engineering Messages", bn: "সোশ্যাল ইঞ্জিনিয়ারিং মেসেজ" },
];

export default function ScamCategories() {
  const { lang, t } = useApp();
  return (
    <section className="border-b border-white/5 bg-ink-800/40 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-extrabold text-white sm:text-3xl">{t("scamCategories")}</h2>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <div key={c.en} className="flex flex-col items-center gap-2 rounded-xl border border-white/10 p-4 text-center transition hover:border-brand-500/40">
              <span className="text-2xl">{c.icon}</span>
              <span className="text-xs font-medium text-white/70">{lang === "bn" ? c.bn : c.en}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
