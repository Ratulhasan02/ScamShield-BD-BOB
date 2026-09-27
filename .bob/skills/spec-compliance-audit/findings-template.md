# Findings Template

This file defines the JSON schema for scanner output and the markdown format for the final report. Both scanners and the reviewer use this as their output contract.

---

## Scanner Output Schema (JSON)

Every scanner subagent returns a JSON array. Each element:

```json
{
  "scanner": "locale" | "theme",
  "id": "L-001" | "T-001",
  "file": "src/components/Example.tsx",
  "line": 42,
  "severity": "P1" | "P2" | "P3",
  "category": "HARDCODED_EN_STRING" | "LATIN_DIGITS" | "INCONSISTENT_DATE_FORMAT" | "MISSING_I18N_KEY" | "TOGGLE_WIRED_INCORRECTLY" | "TOGGLE_PATH_BROKEN" | "PERSISTENCE_BROKEN" | "HYDRATION_MISMATCH" | "UNTHEMED_CSS" | "HARDCODED_DARK_COLOR" | "UNTHEMED_SECTION" | "REDUNDANT_THEME_GUARD" | "BEHAVIORAL_TRACE",
  "description": "One sentence, specific, names the exact string/value involved",
  "proposed_fix": "One sentence describing the minimal code change"
}
```

### Field rules

| Field | Rule |
|---|---|
| `scanner` | Literal string `"locale"` or `"theme"` — never anything else |
| `id` | `L-NNN` for locale findings, `T-NNN` for theme; NNN is zero-padded 3 digits, sequential within the scanner |
| `file` | Relative path from workspace root, forward slashes only |
| `line` | The specific line of the violation, not the line of the enclosing function |
| `severity` | `P1` = user-visible regression; `P2` = inconsistency/partial; `P3` = minor gap; `PASS` = behavioral trace completed with no violations found (theme scanner only) |
| `description` | Must name the exact string, value, or class involved — not generic |
| `proposed_fix` | One sentence. Must not say "refactor", "restructure", or "rewrite". Must say exactly what to add/change/remove |

---

## Merged Findings Schema (after reviewer deduplication)

```json
{
  "id": "F-001",
  "source_ids": ["L-001"],
  "scanner": "locale",
  "file": "src/components/Example.tsx",
  "line": 42,
  "severity": "P1",
  "category": "HARDCODED_EN_STRING",
  "description": "...",
  "proposed_fix": "...",
  "req_ids": ["REQ-02"],
  "approved": null,
  "fixed": false
}
```

New fields added by the reviewer:
- `req_ids` — list of requirement IDs from the checklist that this finding affects
- `approved` — `null` before human review; `true` or `false` after Phase 4
- `fixed` — `false` initially; `true` after Phase 5 confirms the fix was applied

---

## Requirements Checklist Entry Schema

```json
{
  "id": "REQ-01",
  "description": "Application supports Bangla (bn) and English (en) locales",
  "verification": "All user-visible strings have both `en` and `bn` versions; `formatNumber(lang, n)` uses reactive `lang`",
  "status": "fully_met" | "partially_met" | "broken",
  "finding_ids": ["F-001", "F-003"]
}
```

---

## Final Report Format (Markdown)

The reviewer produces this in chat:

```markdown
## Spec-Compliance Audit — [Project Name] — [Date]

### Summary
- Files scanned: N
- Total findings: N (P1: N · P2: N · P3: N)
- Requirements: N fully met · N partially met · N broken
- Locale scanner: N findings
- Theme scanner: N findings

---

### Spec-Compliance Checklist

| REQ-ID | Requirement | Status | Related Findings |
|---|---|---|---|
| REQ-01 | Bangla + English locale support | ✅ / ⚠️ / ❌ | F-001, F-002 |
| REQ-02 | Dark / light theme toggle | ✅ / ⚠️ / ❌ | — |

---

### Findings

| ID | Sev | Scanner | File | Line | Category | Description |
|---|---|---|---|---|---|---|
| F-001 | P1 | locale | src/... | 42 | HARDCODED_EN_STRING | ... |

---

### Proposed Fixes (P1 + P2)

**F-001** — P1 · `src/components/Example.tsx:42`
> `"Some Label"` hardcoded. Wrap: `lang === "bn" ? "বাংলা লেবেল" : "Some Label"`.

---

### Items Declined / Excluded
| ID | Reason |
|---|---|
| F-004 | Admin-only; intentionally English — approved by reviewer |

---

### Impact
| Metric | Value |
|---|---|
| Manual grep estimate | ~45–60 min |
| Pipeline runtime | ~4 min |
| Previously unknown violations | N |
```

---

## Severity Reference Card

```
P1 — User-visible regression
     The documented feature is provably broken for a real user.
     Examples: always-English string in Bangla mode, white-on-white text in light mode.

P2 — Inconsistency
     The feature mostly works but not universally.
     Examples: admin-only hardcoded locale, one sub-element missing a theme class.
     Human reviewer decides whether to fix.

P3 — Minor gap
     No functional regression; cosmetic or completeness issue.
     Examples: truncated Bangla string, redundant theme guard, missing minor clause.
```
