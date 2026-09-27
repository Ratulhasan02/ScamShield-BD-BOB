"use client";

import { useApp } from "./LanguageContext";

const TIPS_EN = [
  "Never share your OTP, PIN, or password with anyone — no bank, MFS agent, or 'support' account will ever ask for it.",
  "Be suspicious of any offer that demands urgent action or payment 'right now'.",
  "Verify job offers, shops, and investment schemes through official channels before paying any fee.",
  "Check how long a Facebook page or shop has existed and look for genuine customer reviews.",
  "If a deal sounds too good to be true — guaranteed profit, huge discount, instant high salary — it probably is.",
];
const TIPS_BN = [
  "OTP, পিন বা পাসওয়ার্ড কখনো কারো সাথে শেয়ার করবেন না — কোনো ব্যাংক, MFS এজেন্ট বা 'সাপোর্ট' অ্যাকাউন্ট এটি কখনো চাইবে না।",
  "জরুরি ভিত্তিতে পেমেন্ট বা সিদ্ধান্ত নিতে চাপ দেওয়া কোনো অফার নিয়ে সতর্ক থাকুন।",
  "কোনো ফি দেওয়ার আগে চাকরি, শপ বা বিনিয়োগ স্কিম অফিসিয়াল চ্যানেলে যাচাই করুন।",
  "ফেসবুক পেজ বা শপ কতদিন ধরে আছে এবং সত্যিকারের কাস্টমার রিভিউ আছে কিনা দেখুন।",
  "যদি কোনো অফার খুব বেশি ভালো মনে হয় — নিশ্চিত মুনাফা, বড় ছাড়, তাৎক্ষণিক উচ্চ বেতন — তাহলে সেটি সম্ভবত প্রতারণা।",
];

export default function SafetyTips() {
  const { lang, t } = useApp();
  const tips = lang === "bn" ? TIPS_BN : TIPS_EN;
  return (
    <section className="border-b border-white/5 bg-ink-800/40 py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-extrabold text-white sm:text-3xl">{t("safetyTips")}</h2>
        <div className="mt-8 space-y-3">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-white/10 p-4">
              <span className="mt-0.5 text-brand-400">✔</span>
              <p className="text-sm text-white/80">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
