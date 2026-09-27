"use client";

import CommunitySearch from "@/components/CommunitySearch";
import HotspotMap from "@/components/HotspotMap";
import { useApp } from "@/components/LanguageContext";

export default function CommunityPage() {
  const { lang, t } = useApp();
  return (
    <>
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h1 className="text-center text-3xl font-extrabold text-white sm:text-4xl">{t("navCommunity")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-white/60">
            {lang === "bn" ? "আগে রিপোর্ট হওয়া স্ক্যাম সার্চ করুন।" : "Search previously reported scams and see how the community has flagged them."}
          </p>
          <div className="mt-8">
            <CommunitySearch />
          </div>
        </div>
      </section>
      <HotspotMap />
    </>
  );
}
