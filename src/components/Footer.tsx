"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./LanguageContext";
import { t as translate } from "@/lib/i18n";

export default function Footer() {
  const { t } = useApp();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  // Keep admin chrome English-only so footer never looks half-translated.
  const footT = isAdminRoute ? (k: Parameters<typeof translate>[1]) => translate("en", k) : t;
  return (
    <footer className="border-t border-white/5 bg-ink-900 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/30">🛡️</span>
              <span className="text-base font-bold">{footT("appName")}</span>
            </div>
            <p className="mt-2 max-w-sm text-sm text-white/50">{footT("subtitle")}</p>
          </div>
          <div className="flex gap-6 text-sm text-white/60">
            <Link href="/check" className="hover:text-brand-400">{footT("navCheck")}</Link>
            <Link href="/community" className="hover:text-brand-400">{footT("navCommunity")}</Link>
            <Link href="/report" className="hover:text-brand-400">{footT("navReport")}</Link>
            <Link href="/admin/login" className="hover:text-brand-400">{footT("navAdmin")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
