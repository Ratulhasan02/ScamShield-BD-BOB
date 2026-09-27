"use client";

import Link from "next/link";
import { useApp } from "./LanguageContext";

export default function Hero() {
  const { t, theme } = useApp();
  const isLight = theme === "light";
  // Light mode uses inline styles so it can't lose to Tailwind/CSS specificity
  // or a stale stylesheet — this is what fixes the "white shadow / invisible"
  // hero text. Dark mode keeps the original classes untouched.
  return (
    <section
      className={`relative border-b ${isLight ? "border-black/10" : "border-white/5 overflow-hidden"}`}
      style={isLight ? { backgroundColor: "#ffffff", backgroundImage: "none" } : undefined}
    >
      {!isLight && (
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[600px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />
      )}
      <div className="relative mx-auto w-full min-w-0 max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <span
          className={`inline-flex max-w-full items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold ${isLight ? "" : "border-brand-500/30 bg-brand-500/10 text-brand-300"}`}
          style={isLight ? { color: "#0b5c3f", backgroundColor: "#e6f6ee", borderColor: "rgba(11,92,63,0.4)" } : undefined}
        >
          <span className="inline-flex h-4 w-6 shrink-0 items-center justify-center overflow-hidden rounded-[3px] ring-1 ring-black/20" aria-hidden="true">
            <svg viewBox="0 0 30 18" className="h-full w-full" role="img" aria-label="Bangladesh flag">
              <rect width="30" height="18" fill="#006a4e" />
              <circle cx="13.5" cy="9" r="6" fill="#f42a41" />
            </svg>
          </span>
          <span className="min-w-0 break-words">Built for Bangladesh · GIBC V2 · Track 03: Open</span>
        </span>
        <h1
          className={`mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl ${isLight ? "" : "text-white"}`}
          style={{ color: isLight ? "#0a0f14" : "#ffffff", textShadow: "none" }}
        >
          {t("appName")}
        </h1>
        <p
          className={`mt-4 text-xl font-semibold sm:text-2xl ${isLight ? "" : "text-brand-400"}`}
          style={{ color: isLight ? "#0b5c3f" : undefined, textShadow: "none" }}
        >
          {t("tagline")}
        </p>
        <p
          className={`mx-auto mt-4 w-full min-w-0 max-w-2xl break-words text-base sm:text-lg ${isLight ? "" : "text-white/60"}`}
          style={{ color: isLight ? "#1e2c39" : undefined, textShadow: "none", overflow: "visible" }}
        >
          {t("subtitle")}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/check" className="w-full rounded-full bg-brand-500 px-8 py-3.5 text-sm font-bold text-ink-900 shadow-glow transition hover:bg-brand-400 sm:w-auto">
            {t("checkScam")} →
          </Link>
          <Link
            href="/report"
            className={`w-full rounded-full border px-8 py-3.5 text-sm font-bold transition sm:w-auto ${isLight ? "" : "border-white/15 text-white hover:border-brand-500/40"}`}
            style={isLight ? { color: "#0a0f14", backgroundColor: "#ffffff", borderColor: "rgba(10,15,20,0.3)", textShadow: "none" } : { textShadow: "none" }}
          >
            {t("reportScam")}
          </Link>
        </div>
      </div>
    </section>
  );
}
