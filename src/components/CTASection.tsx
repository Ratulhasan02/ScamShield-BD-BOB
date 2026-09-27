"use client";

import Link from "next/link";
import { useApp } from "./LanguageContext";

export default function CTASection() {
  const { t } = useApp();
  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-2xl font-extrabold text-white sm:text-3xl">{t("ctaTitle")}</h2>
        <p className="mt-3 text-white/60">{t("ctaSubtitle")}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/check" className="w-full rounded-full bg-brand-500 px-8 py-3.5 text-sm font-bold text-ink-900 shadow-glow transition hover:bg-brand-400 sm:w-auto">
            {t("checkScam")}
          </Link>
          <Link href="/community" className="w-full rounded-full border border-white/15 px-8 py-3.5 text-sm font-bold text-white transition hover:border-brand-500/40 sm:w-auto">
            {t("navCommunity")}
          </Link>
        </div>
      </div>
    </section>
  );
}
