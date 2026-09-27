import { clamp } from "./utils";

export type InputType = "url" | "phone" | "message" | "shop" | "social";

export interface SignalDefinition {
  id: string;
  labelEn: string;
  labelBn: string;
  weight: number; // contribution to risk score, 0-100 scale points
  test: (ctx: AnalysisContext) => boolean;
}

export interface AnalysisContext {
  inputType: InputType;
  rawText: string; // full combined text (message/description/url/name) lowercased
  original: string;
  communityReportCount: number; // number of existing reports matching this entity
  isNewEntity: boolean;
}

export interface DetectedSignal {
  id: string;
  labelEn: string;
  labelBn: string;
  weight: number;
}

export interface RiskResult {
  score: number;
  level: "Safe" | "Suspicious" | "High Risk" | "Critical";
  levelBn: string;
  signals: DetectedSignal[];
  confidence: number; // 0-100, how confident the engine is in this assessment
  explanationEn: string;
  explanationBn: string;
  recommendedActionEn: string;
  recommendedActionBn: string;
}

// ---- Modular signal library -------------------------------------------------
// Each signal is independent and can be swapped / re-weighted / replaced by an
// ML or LLM-derived signal later without touching the scoring aggregator below.

const OTP_WORDS = ["otp", "pin code", "পিন", "ওটিপি", "password", "পাসওয়ার্ড", "verification code"];
const URGENCY_WORDS = [
  "urgent", "immediately", "right now", "within 30 minutes", "act now", "limited time",
  "জরুরি", "এখনই", "দ্রুত", "তাড়াতাড়ি", "সময় নেই", "আজকের মধ্যে",
];
const ADVANCE_PAYMENT_WORDS = [
  "send money first", "registration fee", "advance payment", "processing fee", "send bkash",
  "bkash korte hobe", "আগে টাকা", "রেজিস্ট্রেশন ফি", "অগ্রিম", "টাকা পাঠান", "সেন্ড মানি",
];
const UNREALISTIC_PROMISE_WORDS = [
  "guaranteed profit", "double your money", "100% profit", "daily income", "no risk",
  "লাভ নিশ্চিত", "দ্বিগুণ", "ঝুঁকিমুক্ত", "প্রতিদিন ইনকাম", "গ্যারান্টিড",
];
const JOB_SCAM_WORDS = [
  "work from home", "no experience needed", "high salary", "part time job", "hiring urgently",
  "ঘরে বসে কাজ", "অভিজ্ঞতা লাগবে না", "উচ্চ বেতন", "পার্ট টাইম",
];
const AUTHORITY_WORDS = [
  "bank officer", "bangladesh bank", "police department", "rab", "government office",
  "কর ভবন", "ব্যাংক অফিসার", "পুলিশ", "সরকারি অফিস", "কাস্টমস",
];
const IMPERSONATION_WORDS = [
  "official page", "verified account", "customer support", "helpline", "bkash care",
  "নগদ হেল্পলাইন", "অফিসিয়াল পেজ", "ভেরিফাইড", "কাস্টমার কেয়ার",
];
const PAYMENT_INSTRUCTION_WORDS = [
  "bkash", "nagad", "rocket", "personal number", "agent number", "cash out",
  "পার্সোনাল নাম্বার", "এজেন্ট নাম্বার", "বিকাশ", "নগদ", "রকেট",
];
const SUSPICIOUS_URL_PATTERNS = [
  "bit.ly", "tinyurl", "-bkash", "-nagad", "verify-account", "secure-login", "bd-offer",
  ".xyz", ".tk", ".ml", "login-", "-support",
];

// Real Bangladeshi brand domains used for lookalike-domain detection
// (e.g. bkash-bd.com vs bkash.com). Kept small and modular.
export const TRUSTED_BD_DOMAINS = [
  "bkash.com",
  "nagad.com.bd",
  "rocket.com.bd",
  "dbbl.com.bd",
  "daraz.com.bd",
  "chaldal.com",
  "pathao.com",
  "facebook.com",
  "bdjobs.com",
];

function hostOf(raw: string): string {
  try {
    let u = raw.trim();
    if (!/^https?:\/\//i.test(u)) u = "http://" + u;
    return new URL(u).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** True when a URL's host looks like a typo/lookalike of a trusted BD brand domain. */
export function isLookalikeDomain(rawUrl: string): boolean {
  const host = hostOf(rawUrl);
  if (!host) return false;
  for (const trusted of TRUSTED_BD_DOMAINS) {
    if (host === trusted) return false;
    const base = trusted.split(".")[0];
    // brand keyword embedded with extra suffix/prefix, e.g. bkash-bd.xyz, bkashverify.com
    if (host.includes(base) && host !== trusted) return true;
    const hostBase = host.split(".")[0];
    if (hostBase.length >= 4 && editDistance(hostBase, base) <= 2) return true;
  }
  return false;
}
const PHISHING_WORDS = [
  "click this link", "confirm your account", "your account will be suspended",
  "লিংকে ক্লিক করুন", "অ্যাকাউন্ট বন্ধ হয়ে যাবে", "কনফার্ম করুন",
];

function containsAny(text: string, list: string[]): boolean {
  return list.some((w) => text.includes(w.toLowerCase()));
}

export const SIGNAL_LIBRARY: SignalDefinition[] = [
  {
    id: "otp_request",
    labelEn: "Requests OTP / PIN / password",
    labelBn: "OTP/পিন/পাসওয়ার্ড চাওয়া হয়েছে",
    weight: 28,
    test: (c) => containsAny(c.rawText, OTP_WORDS),
  },
  {
    id: "advance_payment",
    labelEn: "Requests advance payment / fee",
    labelBn: "অগ্রিম টাকা বা ফি চাওয়া হয়েছে",
    weight: 22,
    test: (c) => containsAny(c.rawText, ADVANCE_PAYMENT_WORDS),
  },
  {
    id: "urgency",
    labelEn: "Uses urgent / pressure language",
    labelBn: "জরুরি ভিত্তিতে চাপ দেওয়ার ভাষা ব্যবহার করা হয়েছে",
    weight: 14,
    test: (c) => containsAny(c.rawText, URGENCY_WORDS),
  },
  {
    id: "unrealistic_promise",
    labelEn: "Unrealistic profit / income promise",
    labelBn: "অবাস্তব মুনাফা বা আয়ের প্রতিশ্রুতি",
    weight: 20,
    test: (c) => containsAny(c.rawText, UNREALISTIC_PROMISE_WORDS),
  },
  {
    id: "job_scam",
    labelEn: "Suspicious job-offer pattern",
    labelBn: "সন্দেহজনক চাকরির অফার প্যাটার্ন",
    weight: 16,
    test: (c) => containsAny(c.rawText, JOB_SCAM_WORDS),
  },
  {
    id: "fake_authority",
    labelEn: "Fake authority / official claim",
    labelBn: "ভুয়া কর্তৃপক্ষ বা সরকারি পরিচয়ের দাবি",
    weight: 18,
    test: (c) => containsAny(c.rawText, AUTHORITY_WORDS),
  },
  {
    id: "impersonation",
    labelEn: "Possible impersonation of a real brand / support line",
    labelBn: "পরিচিত ব্র্যান্ড/কাস্টমার কেয়ারের ছদ্মবেশ ধারণের সম্ভাবনা",
    weight: 15,
    test: (c) => containsAny(c.rawText, IMPERSONATION_WORDS),
  },
  {
    id: "payment_instruction",
    labelEn: "Suspicious mobile-financial-service payment instructions",
    labelBn: "সন্দেহজনক MFS (বিকাশ/নগদ/রকেট) পেমেন্ট নির্দেশনা",
    weight: 12,
    test: (c) => containsAny(c.rawText, PAYMENT_INSTRUCTION_WORDS),
  },
  {
    id: "phishing_language",
    labelEn: "Phishing-style link / account-suspension language",
    labelBn: "ফিশিং লিংক বা অ্যাকাউন্ট বন্ধের ভয় দেখানো ভাষা",
    weight: 16,
    test: (c) => containsAny(c.rawText, PHISHING_WORDS),
  },
  {
    id: "suspicious_url_pattern",
    labelEn: "Suspicious URL structure (shortener, odd domain, brand keyword misuse)",
    labelBn: "সন্দেহজনক ইউআরএল গঠন (শর্টনার, অস্বাভাবিক ডোমেইন)",
    weight: 20,
    test: (c) => c.inputType === "url" && containsAny(c.rawText, SUSPICIOUS_URL_PATTERNS),
  },
  {
    id: "lookalike_domain",
    labelEn: "Lookalike domain impersonating a trusted Bangladeshi brand",
    labelBn: "পরিচিত বাংলাদেশি ব্র্যান্ডের নামে ছদ্ম ডোমেইন",
    weight: 24,
    test: (c) => (c.inputType === "url" || c.rawText.includes("http") || c.rawText.includes("www.") || c.rawText.includes(".com") || c.rawText.includes(".bd")) && isLookalikeDomain(c.original || c.rawText),
  },
  {
    id: "multiple_community_reports",
    labelEn: "Multiple community reports for the same entity",
    labelBn: "একই সোর্স নিয়ে একাধিক কমিউনিটি রিপোর্ট পাওয়া গেছে",
    weight: 26,
    test: (c) => c.communityReportCount >= 3,
  },
  {
    id: "some_community_reports",
    labelEn: "At least one prior community report found",
    labelBn: "আগে অন্তত একটি কমিউনিটি রিপোর্ট পাওয়া গেছে",
    weight: 12,
    test: (c) => c.communityReportCount >= 1 && c.communityReportCount < 3,
  },
  {
    id: "new_low_trust_entity",
    labelEn: "Newly reported / low-trust source with no track record",
    labelBn: "নতুন এবং কোনো পূর্ব রেকর্ড না থাকা সোর্স",
    weight: 8,
    test: (c) => c.isNewEntity && c.communityReportCount === 0,
  },
];

function scoreToLevel(score: number): { level: RiskResult["level"]; levelBn: string } {
  if (score < 25) return { level: "Safe", levelBn: "নিরাপদ" };
  if (score < 50) return { level: "Suspicious", levelBn: "সন্দেহজনক" };
  if (score < 75) return { level: "High Risk", levelBn: "উচ্চ ঝুঁকি" };
  return { level: "Critical", levelBn: "সংকটজনক" };
}

function buildExplanation(signals: DetectedSignal[], level: RiskResult["level"]): { en: string; bn: string } {
  if (signals.length === 0) {
    return {
      en: "No strong scam indicators were detected in the submitted information. This does not guarantee it is completely safe — stay cautious with any request involving money or personal codes.",
      bn: "জমা দেওয়া তথ্যে কোনো জোরালো প্রতারণার লক্ষণ পাওয়া যায়নি। এর মানে এটি সম্পূর্ণ নিরাপদ, এমন নিশ্চয়তা নেই — টাকা বা কোড সংক্রান্ত কোনো অনুরোধে সতর্ক থাকুন।",
    };
  }
  const top = signals.slice(0, 3);
  const enList = top.map((s) => s.labelEn).join("; ");
  const bnList = top.map((s) => s.labelBn).join("; ");

  const prefixEn =
    level === "Critical"
      ? "⚠️ This shows strong signs of a scam."
      : level === "High Risk"
      ? "⚠️ This shows multiple warning signs commonly seen in scams."
      : "This shows some signals worth being cautious about.";

  const prefixBn =
    level === "Critical"
      ? "⚠️ এতে প্রতারণার জোরালো লক্ষণ পাওয়া গেছে।"
      : level === "High Risk"
      ? "⚠️ এতে সাধারণ প্রতারণায় দেখা যায় এমন একাধিক সতর্কতামূলক লক্ষণ পাওয়া গেছে।"
      : "এতে কিছু লক্ষণ পাওয়া গেছে যেগুলোর ব্যাপারে সতর্ক থাকা উচিত।";

  return {
    en: `${prefixEn} Detected: ${enList}. This is an automated pattern-based assessment, not a legal determination of guilt — verify independently before acting.`,
    bn: `${prefixBn} সনাক্ত হয়েছে: ${bnList}। এটি একটি স্বয়ংক্রিয় প্যাটার্ন-ভিত্তিক মূল্যায়ন, আইনি সিদ্ধান্ত নয় — সিদ্ধান্ত নেওয়ার আগে নিজে যাচাই করে নিন।`,
  };
}

function buildRecommendation(level: RiskResult["level"]): { en: string; bn: string } {
  switch (level) {
    case "Critical":
      return {
        en: "Do not send money or share OTP/PIN. Block and report this contact/page immediately.",
        bn: "টাকা পাঠাবেন না বা OTP/পিন শেয়ার করবেন না। এই নাম্বার/পেজ ব্লক করে এখনই রিপোর্ট করুন।",
      };
    case "High Risk":
      return {
        en: "Avoid sending any payment or personal codes. Verify through an official channel before proceeding.",
        bn: "কোনো পেমেন্ট বা ব্যক্তিগত কোড পাঠাবেন না। এগিয়ে যাওয়ার আগে অফিসিয়াল চ্যানেলে যাচাই করুন।",
      };
    case "Suspicious":
      return {
        en: "Proceed with caution. Cross-check the source and avoid sharing sensitive information.",
        bn: "সতর্কতার সাথে এগিয়ে যান। সোর্সটি যাচাই করুন এবং স্পর্শকাতর তথ্য শেয়ার করবেন না।",
      };
    default:
      return {
        en: "No major red flags found, but always stay alert with money-related requests online.",
        bn: "কোনো বড় সতর্কতা চিহ্ন পাওয়া যায়নি, তবে অনলাইনে টাকা সংক্রান্ত অনুরোধে সবসময় সতর্ক থাকুন।",
      };
  }
}

export function runRiskEngine(ctx: AnalysisContext): RiskResult {
  const detected: DetectedSignal[] = [];
  let rawScore = 0;

  for (const sig of SIGNAL_LIBRARY) {
    if (sig.test(ctx)) {
      detected.push({ id: sig.id, labelEn: sig.labelEn, labelBn: sig.labelBn, weight: sig.weight });
      rawScore += sig.weight;
    }
  }

  const score = clamp(Math.round(rawScore), 0, 100);
  const { level, levelBn } = scoreToLevel(score);
  const { en: explanationEn, bn: explanationBn } = buildExplanation(detected, level);
  const { en: recommendedActionEn, bn: recommendedActionBn } = buildRecommendation(level);

  // Confidence grows with number of independent corroborating signals and
  // community evidence, but is capped so the engine never claims certainty.
  const confidence = clamp(35 + detected.length * 8 + ctx.communityReportCount * 5, 20, 92);

  return {
    score,
    level,
    levelBn,
    signals: detected,
    confidence,
    explanationEn,
    explanationBn,
    recommendedActionEn,
    recommendedActionBn,
  };
}

// ---- Scam DNA / pattern clustering -----------------------------------------
// Deterministic clustering: groups a signal-set into a named pattern based on
// which combination of signal IDs is dominant. Kept modular so it can later
// be replaced by embedding-based clustering over report text.

export interface ScamPatternDef {
  key: string;
  nameEn: string;
  nameBn: string;
  requiredSignals: string[]; // if ALL of these are present, this pattern matches
}

export const PATTERN_LIBRARY: ScamPatternDef[] = [
  {
    key: "fake_job_recruitment",
    nameEn: "Fake Job Recruitment",
    nameBn: "ভুয়া চাকরির নিয়োগ",
    requiredSignals: ["job_scam", "advance_payment"],
  },
  {
    key: "investment_scheme",
    nameEn: "Fake Investment / Earning Scheme",
    nameBn: "ভুয়া বিনিয়োগ/আয়ের স্কিম",
    requiredSignals: ["unrealistic_promise", "advance_payment"],
  },
  {
    key: "otp_phishing",
    nameEn: "OTP / Account Takeover Phishing",
    nameBn: "OTP / অ্যাকাউন্ট দখলের ফিশিং",
    requiredSignals: ["otp_request", "urgency"],
  },
  {
    key: "fake_customer_support",
    nameEn: "Fake Customer Support Impersonation",
    nameBn: "ভুয়া কাস্টমার সাপোর্ট পরিচয়",
    requiredSignals: ["impersonation", "payment_instruction"],
  },
  {
    key: "fake_authority_extortion",
    nameEn: "Fake Authority / Extortion Pressure",
    nameBn: "ভুয়া কর্তৃপক্ষ / চাপ দিয়ে আদায়",
    requiredSignals: ["fake_authority", "urgency"],
  },
  {
    key: "phishing_link",
    nameEn: "Phishing Link / Account Suspension Trick",
    nameBn: "ফিশিং লিংক / অ্যাকাউন্ট বন্ধের ভয়",
    requiredSignals: ["phishing_language", "suspicious_url_pattern"],
  },
];

export function detectPattern(signalIds: string[]): ScamPatternDef | null {
  const set = new Set(signalIds);
  for (const p of PATTERN_LIBRARY) {
    if (p.requiredSignals.every((s) => set.has(s))) return p;
  }
  return null;
}
