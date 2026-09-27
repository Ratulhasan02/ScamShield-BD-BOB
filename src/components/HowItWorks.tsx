"use client";

import { useApp } from "./LanguageContext";

const STEPS = [
  { icon: "📝", en: ["Submit", "Paste a URL, number, message, shop or account."], bn: ["জমা দিন", "একটি লিংক, নাম্বার, মেসেজ, শপ বা অ্যাকাউন্ট দিন।"] },
  { icon: "🧠", en: ["Multi-layer Analysis", "Pattern rules + AI + database + community signals run together."], bn: ["মাল্টি-লেয়ার বিশ্লেষণ", "প্যাটার্ন রুল + AI + ডেটাবেস + কমিউনিটি সিগনাল একসাথে কাজ করে।"] },
  { icon: "📊", en: ["Get a Risk Score", "0-100 score with a plain-language explanation in Bangla or English."], bn: ["রিস্ক স্কোর পান", "সহজ ভাষায় ব্যাখ্যাসহ ০-১০০ স্কোর।"] },
  { icon: "🤝", en: ["Strengthen the Community", "Reports feed a shared intelligence layer that protects everyone."], bn: ["কমিউনিটিকে শক্তিশালী করুন", "রিপোর্টগুলো একটি শেয়ার্ড ইনটেলিজেন্স লেয়ার তৈরি করে যা সবাইকে রক্ষা করে।"] },
];

export default function HowItWorks() {
  const { lang, t } = useApp();
  return (
    <section className="border-b border-white/5 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-extrabold text-white sm:text-3xl">{t("howItWorks")}</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => {
            const [title, desc] = lang === "bn" ? s.bn : s.en;
            return (
              <div key={i} className="card-surface rounded-xl p-5">
                <span className="text-3xl">{s.icon}</span>
                <h3 className="mt-3 font-bold text-white">{title}</h3>
                <p className="mt-1 text-sm text-white/60">{desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
