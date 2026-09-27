"use client";

import ScamChecker from "@/components/ScamChecker";
import { useApp } from "@/components/LanguageContext";

export default function CheckPage() {
  const { t } = useApp();
  return (
    <section className="py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-center text-3xl font-extrabold text-white sm:text-4xl">{t("navCheck")}</h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-white/60">{t("subtitle")}</p>
        <div className="mt-8">
          <ScamChecker />
        </div>
      </div>
    </section>
  );
}
