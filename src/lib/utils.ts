import { nanoid } from "nanoid";
import type { Lang } from "./i18n";

export function generateReportId(): string {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `SSB-${stamp}-${nanoid(6).toUpperCase()}`;
}

export function generateAnalysisId(): string {
  return `RA-${nanoid(10).toUpperCase()}`;
}

// Masks a Bangladeshi (or generic) phone number for public display,
// e.g. 01712345678 -> 017XX-XX5678
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "•".repeat(digits.length);
  const start = digits.slice(0, 3);
  const end = digits.slice(-4);
  return `${start}XX-XX${end}`;
}

export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("880")) digits = "0" + digits.slice(3);
  return digits;
}

export function isValidBdPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^01[3-9]\d{8}$/.test(normalized);
}

export function normalizeUrl(url: string): string {
  try {
    let u = url.trim();
    if (!/^https?:\/\//i.test(u)) u = "http://" + u;
    const parsed = new URL(u);
    return (parsed.hostname + parsed.pathname).replace(/\/$/, "").toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export function maskUrlEvidence(text: string, maxLen = 220): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "…";
}

export function entityKeyFor(type: string, value: string): string {
  if (type === "phone") return `phone:${normalizePhone(value)}`;
  if (type === "url") return `url:${normalizeUrl(value)}`;
  return `${type}:${value.trim().toLowerCase()}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

// ---- Bangla-aware number / date formatting (centralized) ----
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBnDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function formatNumber(lang: Lang, n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  if (lang === "bn") {
    try {
      return new Intl.NumberFormat("bn-BD").format(n);
    } catch {
      return toBnDigits(String(n));
    }
  }
  return n.toLocaleString("en-US");
}

export function formatDate(lang: Lang, date: string | Date | undefined | null): string {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

// Map known English server/client errors to Bangla at the toast site.
const ERROR_MAP: { match: RegExp; en: string; bn: string }[] = [
  { match: /analysis failed/i, en: "Analysis failed. Please try again.", bn: "বিশ্লেষণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।" },
  { match: /invalid input/i, en: "Invalid input.", bn: "ভুল ইনপুট। যাচাই করে আবার চেষ্টা করুন।" },
  { match: /invalid report/i, en: "Invalid report data.", bn: "রিপোর্টের তথ্য সঠিক নয়।" },
  { match: /could not submit/i, en: "Could not submit report.", bn: "রিপোর্ট জমা দেওয়া যায়নি।" },
  { match: /could not load reports/i, en: "Could not load reports.", bn: "রিপোর্ট লোড করা যায়নি।" },
  { match: /could not load admin/i, en: "Could not load admin data.", bn: "অ্যাডমিন ডেটা লোড করা যায়নি।" },
  { match: /could not update/i, en: "Could not update report.", bn: "রিপোর্ট আপডেট করা যায়নি।" },
  { match: /update failed/i, en: "Update failed.", bn: "আপডেট ব্যর্থ হয়েছে।" },
  { match: /login failed|unauthorized|invalid credentials/i, en: "Login failed.", bn: "লগইন ব্যর্থ হয়েছে।" },
  { match: /submission failed/i, en: "Submission failed.", bn: "জমা দেওয়া ব্যর্থ হয়েছে।" },
  { match: /not found/i, en: "Not found.", bn: "পাওয়া যায়নি।" },
];

export function localizeError(lang: Lang, raw: unknown): string {
  const msg = raw instanceof Error ? raw.message : String(raw ?? "");
  if (lang === "en") return msg || "Something went wrong";
  for (const e of ERROR_MAP) {
    if (e.match.test(msg)) return e.bn;
  }
  if (!msg) return "কিছু ভুল হয়েছে। আবার চেষ্টা করুন।";
  return msg;
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function isNearDuplicate(a: string, b: string): boolean {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (!x || !y || x === y) return false;
  if (x.includes(y) || y.includes(x)) return true;
  const dist = levenshtein(x, y);
  const maxLen = Math.max(x.length, y.length);
  return dist <= 2 || (maxLen > 10 && dist / maxLen <= 0.15);
}

export function extractHostname(raw: string): string {
  try {
    let u = raw.trim();
    if (!/^https?:\/\//i.test(u)) u = "http://" + u;
    return new URL(u).hostname.toLowerCase();
  } catch {
    return raw.trim().toLowerCase();
  }
}
