"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useApp } from "./LanguageContext";
import { t as translate } from "@/lib/i18n";

export default function Navbar() {
  const { t, lang, setLang, theme, toggleTheme } = useApp();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  // Admin console is English-only by design (internal tool).
  // Force English labels here so nav never looks "half-translated" on /admin/*.
  const navT = isAdminRoute ? (k: Parameters<typeof translate>[1]) => translate("en", k) : t;

  const links = [
    { href: "/", label: navT("navHome") },
    { href: "/check", label: navT("navCheck") },
    { href: "/community", label: navT("navCommunity") },
    { href: "/report", label: navT("navReport") },
    { href: "/admin/login", label: navT("navAdmin") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-ink-900/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/30">
            🛡️
          </span>
          <span className="text-lg font-bold tracking-tight text-white">{navT("appName")}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-white/70 transition hover:text-brand-400">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!isAdminRoute && (
            <button
              onClick={() => setLang(lang === "en" ? "bn" : "en")}
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:border-brand-500/40 hover:text-brand-400"
            >
              {lang === "en" ? "বাংলা" : "English"}
            </button>
          )}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:border-brand-500/40 hover:text-brand-400"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
          <Link
            href="/check"
            className="rounded-full bg-brand-500 px-4 py-1.5 text-sm font-semibold text-ink-900 shadow-glow transition hover:bg-brand-400"
          >
            {navT("checkScam")}
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          <span className="text-2xl">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-white/5 bg-ink-900 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium text-white/80">
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {!isAdminRoute && (
                <button
                  onClick={() => setLang(lang === "en" ? "bn" : "en")}
                  className="flex-1 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold"
                >
                  {lang === "en" ? "বাংলা" : "English"}
                </button>
              )}
              <button onClick={toggleTheme} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold">
                {theme === "dark" ? "🌙" : "☀️"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
