**# ScamShield BD 🛡️**

**Scam detection and community intelligence platform with optional AI-assisted analysis for Bangladesh.**

Built for **Global Innovation Build Challenge V2 — Track 03: Open (General Technical Invention)**.

🔗 **Live Demo:** https://scam-shield-bd-bob.vercel.app/

**## What it does**

ScamShield BD helps users in Bangladesh check whether a URL, phone number, message,
online shop, or social media account looks like a scam — and lets the community
report and track scams together.

- **Scam Risk Intelligence Engine** — combines rule-based pattern detection,
  optional AI explanation, and community report history into a 0–100 risk score.
- **Scam Checker** — a guided, animated multi-step analysis (input validation →
  pattern analysis → database check → AI risk analysis → community intelligence →
  final assessment) with a full result dashboard.
- **Scam Report system** — full report submission with evidence, screenshots,
  and auto-generated report IDs, stored in MongoDB.
- **Community Intelligence** — a public, searchable database of past reports
  with masked sensitive data and neutral status labels ("Reported", "Under
  Review", "Community Flagged", "Verified") instead of accusations.
- **Scam DNA** — clusters reports sharing common signal combinations into
  named recurring scam patterns (e.g. "Fake Job Recruitment").
- **Admin dashboard** — JWT-protected, lets an admin review, search, filter,
  and verify/reject reports.
- **Bangla + English** — full UI language toggle, Bangladesh phone number
  format support, and bKash / Nagad / Rocket / Facebook / WhatsApp awareness.
- **Demo mode** — 5 preloaded, clearly labeled example scams that run through
  the real analysis pipeline for a smooth hackathon demo.

The app works **with or without** an Anthropic API key. If `ANTHROPIC_API_KEY`
is not set, ScamShield BD automatically uses its built-in deterministic
rule-based analysis engine — every feature stays fully functional.

**## Tech stack**

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes
- **Database:** MongoDB (via Mongoose)
- **Auth:** JWT (admin dashboard only)
- **AI:** Anthropic Claude (optional) with a rule-based fallback

## Getting started

```bash
npm install
cp .env.example .env.local   # then edit .env.local with your own values
npm run dev
```

Open http://localhost:3000.

### Environment variables (`.env.local`)

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/scamshield?retryWrites=true&w=majority&appName=ScamShield-BD
JWT_SECRET=change-this-to-a-long-random-secret
ANTHROPIC_API_KEY=            # optional - leave empty to use rule-based engine
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_BOOTSTRAP_USERNAME=admin
ADMIN_BOOTSTRAP_PASSWORD=change-this-password
```

The first time you log in at `/admin/login` with the bootstrap username/password,
an admin account is automatically created in the database.

### Seed demo data (optional, recommended for a live demo)

```bash
npm run seed
```

This adds 5 clearly-marked demo reports and entities so the Community
Intelligence page and Admin Dashboard aren't empty on first run.

## Project structure

```
src/
  app/                 # Pages (landing, /check, /report, /community, /admin/*)
    api/               # API routes: check, analyze, reports, search, admin/*, feedback, hotspots
  components/          # UI components (ScamChecker, ReportForm, AdminTable, HotspotMap, ...)
  lib/
    riskEngine.ts      # Modular, swappable rule-based signal + scoring engine (+ lookalike-domain signal)
    aiAnalysis.ts      # Anthropic API call with automatic rule-based fallback (+ screenshot OCR)
    analyzePipeline.ts # Shared analysis pipeline used by /api/check & /api/analyze (+ near-duplicate merge)
    db.ts              # MongoDB connection helper
    models/            # Mongoose schemas (ScamReport, ScamEntity, ScamPattern, RiskAnalysis, Admin, User)
    auth.ts            # JWT sign/verify helpers for the admin dashboard
    i18n.ts            # Bangla / English UI strings
    demoData.ts        # 5 preloaded demo examples
    utils.ts           # Phone masking, ID generation, validation, formatNumber/formatDate/localizeError, levenshtein/isNearDuplicate

scripts/
  seed.mjs             # Demo data seeder
  probe.mjs            # Connectivity probe
  smoke.mjs            # Smoke test
  test-db.mjs          # Database connection test

.bob/
  skills/
    spec-compliance-audit/ # Reusable IBM Bob 2.0 audit workflow (SKILL.md + 5 supporting files)

ibm-bob-session-report.md  # Exported IBM Bob session report
ibm-bob-workflow.json      # IBM Bob workflow export

```

## API endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/check` | Run the full risk analysis pipeline on a submission |
| POST | `/api/analyze` | Same pipeline, exposed separately for future ML/LLM swap-in |
| POST | `/api/reports` | Submit a new scam report |
| GET | `/api/reports` | List / search reports (masked, public) |
| GET | `/api/reports/:id` | Get a single report by report ID |
| GET | `/api/search` | Search entities + reports for Community Intelligence |
| GET | `/api/stats` | Public homepage statistics (live or demo-labeled) |
| POST | `/api/admin/login` | Admin login, returns a JWT |
| GET | `/api/admin/stats` | Admin-only aggregate stats (incl. byType breakdown, visualized on dashboard) |
| GET | `/api/admin/all-reports` | Admin-only unmasked report listing |
| PATCH | `/api/admin/reports/:id` | Admin-only status update (verify/reject/etc.) |
| POST | `/api/feedback` | Accuracy feedback on an analysis (feeds future signal retuning) |
| GET | `/api/hotspots` | Aggregated report counts by location/district for the hotspot map |

## Notes on the risk engine

`src/lib/riskEngine.ts` defines an independent, swappable `SIGNAL_LIBRARY`
(OTP requests, advance-payment requests, urgency language, unrealistic
promises, job-scam patterns, fake-authority claims, impersonation,
suspicious payment instructions, phishing language, suspicious URL
structure, lookalike-domain impersonation of trusted BD brands, and
community report volume). Each signal contributes a weight
to the final 0–100 score, and the same signal IDs feed the `PATTERN_LIBRARY`
used for Scam DNA clustering. Both lists can be extended or replaced by an
ML/LLM-derived scorer later without changing the API contract.

## Key capabilities

- **Dark/light mode** — theme is applied pre-paint from `localStorage`
  (no flicker); the palette lives in `globals.css` (`:root` + `.light`
  variables) so Navbar, Footer, Hero, Stats, HowItWorks, Categories,
  Scam DNA, SafetyTips, CTA, Checker, ReportForm, Community, ReportCard,
  and Admin all respond to one toggle.
- **Bangla + English throughout** — one language toggle drives the whole
  public UI, with Bangla numerals/dates via `formatNumber` / `formatDate`
  (`Intl.NumberFormat('bn-BD')`), localized dropdowns, signal labels,
  error toasts (`localizeError`), and status pills. The admin console is
  intentionally English-only (internal tool); its Navbar/Footer stay
  locked to English so the page never looks half-translated.
- **Lookalike-domain detection** — the `lookalike_domain` signal compares
  the submitted URL's host against trusted BD brand domains (bKash, Nagad,
  Daraz, …) to catch typosquat/phishing URLs.
- **Screenshot OCR** — uploaded screenshots are transcribed via Claude
  vision and fed into the same text-analysis pipeline.
- **Near-duplicate merging** — close phone/URL matches merge into the
  existing `ScamEntity` instead of diluting community counts.
- **Accuracy feedback loop** — 👍/👎 buttons on checker results POST to
  `/api/feedback` for future signal retuning.
- **Scam hotspot map** — the optional `location` field on reports is
  aggregated by `/api/hotspots` and rendered by `HotspotMap` on the home
  and community pages.
- **Admin analytics** — the `byType` breakdown from `/api/admin/stats`
  is visualized as bars on the admin dashboard.
- **Rate limiting** — per-IP limits on `/api/check`, `/api/analyze`
  (20/min) and `/api/reports` (10/10min). For multi-instance production,
  back this with Redis/Upstash.
- **Bot-ready** — `/api/check` accepts plain JSON (`inputType`, `value`,
  `description`, `screenshotText`), so a WhatsApp/Messenger front end can
  call it unchanged.

## Safety & privacy

- Phone numbers are masked in all public views.
- Reports use neutral status labels, never automatic guilt declarations.
- Full evidence and unmasked contact info are only visible to authenticated admins.
- Demo/sample data is always clearly labeled and never mixed silently with real reports.

## IBM Bob audit (GIBC V2)

As part of the Global Innovation Build Challenge V2 submission, an IBM Bob 2.0
spec-compliance audit was run against this codebase using a custom multi-phase
workflow: parallel locale and theme scanners → severity-ranked findings report →
human approval gate → targeted fixes → TypeScript verification.

**Approved source-code fixes applied by the audit:**

- `src/components/ScamChecker.tsx` — the "Scam DNA — Pattern Match" result card
  heading and the "AI-assisted / rule-based analysis" metadata line were hardcoded
  English in Bangla mode; both now render correctly in Bangla when `lang === "bn"`.
- `src/components/CommunityPreview.tsx` — the Bangla empty-state message was
  shorter than its English counterpart (missing the MongoDB connection detail);
  it now matches the English version in full.

The reusable audit workflow is saved in `.bob/skills/spec-compliance-audit/`.
The exported Bob session report is `ibm-bob-session-report.md`.
