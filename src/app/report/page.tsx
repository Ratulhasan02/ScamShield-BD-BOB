"use client";

import ReportForm from "@/components/ReportForm";
import { useApp } from "@/components/LanguageContext";

export default function ReportPage() {
  const { lang, t } = useApp();
  return (
    <section className="py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-center text-3xl font-extrabold text-white sm:text-4xl">{t("reportScam")}</h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-white/60">
          {lang === "bn"
            ? "সন্দেহজনক ঘটনা রিপোর্ট করে কমিউনিটিকে সুরক্ষিত রাখুন।"
            : "Help protect the community by reporting suspicious activity. Your report strengthens ScamShield BD's shared intelligence for everyone."}
        </p>
        <div className="mt-8">
          <ReportForm />
        </div>
      </div>
    </section>
  );
}
