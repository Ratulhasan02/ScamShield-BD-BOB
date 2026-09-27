# Spec-Compliance Checklist

This file is the ScamShield BD project's concrete requirements checklist — used in Phase 1 to ground the audit in real, checkable specification items.

For other projects: replace the entries below with the requirements extracted from that project's spec document in Phase 1.

---

## ScamShield BD Requirements (extracted from spec)

> **Note on sources:** REQ-01 through REQ-09 are extracted directly from the codebase's own stated behaviour and the README. REQ-10 is inferred from code comments (`// Admin console is English-only by design`) — it was **not** verified against an external specification document. Treat REQ-10 findings as P2 and confirm with the project owner at Phase 4 before assuming English-only admin is an accepted requirement.

| REQ-ID | Requirement | How to Verify | Category | Source |
|---|---|---|---|---|
| REQ-01 | Application supports two locales: Bangla (`bn`) and English (`en`) | Every user-visible string has both `en` and `bn` versions in `dict` or as inline `lang === "bn" ? bn : en` branches | i18n | README + `src/lib/i18n.ts` |
| REQ-02 | Numbers render in Bangla digits when locale is Bangla | `formatNumber(lang, n)` — `lang` is reactive, never hardcoded `"en"` | i18n | `src/lib/utils.ts` implementation |
| REQ-03 | Dates render in Bangla format when locale is Bangla | `formatDate(lang, date)` — `lang` is reactive, never hardcoded `"en"` | i18n | `src/lib/utils.ts` implementation |
| REQ-04 | Error messages and toast notifications are localized | `localizeError(lang, err)` — `lang` is reactive | i18n | `src/lib/utils.ts` implementation |
| REQ-05 | Dark mode is default; light mode is toggled via the Navbar button | Theme toggle persists to `localStorage`; `<html>` receives `.light`/`.dark` class; survives page reload | theme | `src/app/globals.css`, `LanguageContext.tsx`, `layout.tsx` |
| REQ-06 | All user-facing sections respond to the theme toggle | No section uses hardcoded dark hex colors without a corresponding light override | theme | `src/app/globals.css` `.light` block |
| REQ-07 | bKash, Nagad, Rocket listed as supported platforms in the Report form | These three platforms appear in the `PLATFORMS` array in `ReportForm.tsx` | features | `src/components/ReportForm.tsx` |
| REQ-08 | Scam Checker supports: URL, Phone, Message, Online Shop, Social Media | All five `InputType` options present in `TYPE_OPTIONS` in `ScamChecker.tsx` | features | `src/components/ScamChecker.tsx` |
| REQ-09 | Risk score returned as 0–100 integer with Bangla/English label | `riskScore` field in API response; `riskLevelBn` field present alongside `riskLevel` | features | API route + `ScamChecker.tsx` result rendering |
| REQ-10 | Admin console is intentionally English-only *(inferred — unverified against external spec)* | Code comments in `Navbar.tsx` and `Footer.tsx` assert English-only by design | admin | Code comments only — confirm with project owner |

---

## Checklist Status (filled in by Reviewer in Phase 3)

| REQ-ID | Status | Finding IDs | Notes |
|---|---|---|---|
| REQ-01 | | | |
| REQ-02 | | | |
| REQ-03 | | | |
| REQ-04 | | | |
| REQ-05 | | | |
| REQ-06 | | | |
| REQ-07 | | | |
| REQ-08 | | | |
| REQ-09 | | | |
| REQ-10 | | | |

Status values: `✅ Fully Met` · `⚠️ Partially Met` · `❌ Broken`

---

## Template for Other Projects

When adapting this workflow for a different codebase, replace the table above with entries derived from that project's spec document during Phase 1. The column structure is the same:

- **REQ-ID** — sequential `REQ-NN`
- **Requirement** — one-line description of what the spec says must be true
- **How to Verify** — the specific file, function, pattern, or grep that proves compliance
- **Category** — grouping for the final report (`i18n`, `theme`, `accessibility`, `api`, etc.)

Good requirements for this checklist are **binary** — either the codebase satisfies them or it does not. Avoid vague requirements like "the UI should look good in both themes" — instead write "all `text-white` classes have a corresponding `.light .text-white` override in globals.css".
