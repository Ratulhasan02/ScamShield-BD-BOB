---
name: spec-compliance-audit
description: Use when the user wants to audit a codebase against its specification for i18n/locale consistency and dark/light theme compliance — runs parallel locale and theme scanners, produces a severity-ranked findings report, requires human approval before applying any fixes, then verifies the results.
---

# Spec-Compliance & Consistency Audit Workflow

A multi-phase, parallel-scan pipeline that compares a codebase against its specification. Designed for projects with i18n (multi-language) and theming requirements. Reusable for any Next.js / TypeScript / Tailwind codebase — adapt the scanner personas for other stacks.

Built from the ScamShield BD audit run during the IBM Bob 2.0 Global Innovation Build Challenge V2.

---

## Inputs (collect before starting)

Ask the user to confirm or provide:

1. **Spec document** — path to the project specification (e.g. `README.md`, a design doc, or a written requirements list). If none exists, ask the user to describe the top-level requirements in 3–5 bullet points.
2. **Source directory** — root of the codebase to scan (default: `src/`).
3. **i18n system** — how translations work in this project (e.g. a `dict` object in `lib/i18n.ts`, `next-i18next`, `react-intl`, `i18next`). Needed to calibrate the Locale Scanner.
4. **Theme system** — how dark/light theming works (e.g. Tailwind `darkMode: "class"` + CSS variable overrides, `next-themes`, CSS-in-JS). Needed to calibrate the Theme Scanner.
5. **Locale variable name** — the reactive variable that carries the current language (e.g. `lang`, `locale`, `i18n.language`).
6. **Theme variable name** — the reactive variable or class that carries the current theme (e.g. `theme`, `colorScheme`, `.dark` / `.light` class on `<html>`).

---

## Phase 1 — Document Understanding

**Goal:** Extract concrete, checkable requirements from the spec.

Steps:
1. Read the spec document using `read_file`.
2. Read a representative sample of source files to understand project conventions (start with `src/lib/i18n.ts` or equivalent, `src/app/layout.tsx`, `tailwind.config.ts`, global CSS).
3. Produce a **Requirements Checklist** using `findings-template.md` as the output format. For each requirement write:
   - Requirement ID (REQ-01, REQ-02, …)
   - Description (one line)
   - How to verify it (grep pattern, file to read, or render check)
4. Share the checklist with the user and ask: *"Does this capture all the requirements you want checked? Add or remove items before I start scanning."*
5. Wait for confirmation before proceeding.

---

## Phase 2 — Parallel Scanner Stage

**Goal:** Detect all violations in the codebase, independently and simultaneously.

Spawn **two subagents in the same turn** (parallel execution) using `spawn_subagent`. Pass each scanner's complete persona from the supporting files below.

### Scanner A — Locale Scanner
Load instructions from `locale-scanner-persona.md`.

Key violations to find:
- Hardcoded user-visible English strings that bypass the i18n system in components where a `lang`/`locale` variable is in scope.
- Numbers rendered with `formatNumber` / `Intl.NumberFormat` where the locale argument is hardcoded as `"en"` instead of the reactive variable.
- Dates rendered with `formatDate` / `Intl.DateTimeFormat` where the locale argument is hardcoded.
- Bangla (or target-locale) translations that are missing, truncated, or semantically incomplete vs. their English counterparts.
- Error messages, toast strings, or loading states that are only available in one language.

### Scanner B — Theme Scanner
Load instructions from `theme-scanner-persona.md`.

The Theme Scanner operates at **two levels** — behavioral first, static second:

**Behavioral path trace (primary):** Trace the toggle's full runtime path — button click → context function → React state update → `useEffect` DOM mutation → `localStorage` persistence → hydration script on reload. Verify each step is correctly wired. Absence of hardcoded colors does not prove the toggle works; the path trace does.

Key behavioral checks:
- Toggle button calls the context `toggleTheme()` function, not a local state setter.
- `toggleTheme()` reads React state (not stale `localStorage`), computes next value, calls `setState`.
- The DOM-mutation `useEffect` manages **both** `.light` and `.dark` classes symmetrically.
- A `themeReady` guard prevents the `useEffect` from overwriting the hydration script's classes on first mount.
- The `localStorage` write uses the same key as the hydration script reads.
- The inline hydration script in the root layout reads the same key, applies the same class names, and has a `try/catch` fallback.
- The CSS responds to the class the toggle applies (`.light` or `.dark` selector exists in the stylesheet).

**Static audit (secondary):** After the behavioral trace, also check for:
- Hardcoded hex/rgb/hsl colors in `style={{}}` that only work in one theme.
- UI sections that are invisible to the theme system (use no theme-aware classes or context).
- Redundant `theme` context reads that duplicate existing CSS override logic.

If the behavioral trace finds no violations, the subagent **must** return a `PASS` object with explicit evidence of what was verified — not an empty array.

**Both subagents run in parallel. Do not wait for one before spawning the other.**

Each subagent must return a JSON array of findings. See `findings-template.md` for the schema.

---

## Phase 3 — Reviewer Stage

**Goal:** Merge both finding sets, cross-reference against the Requirements Checklist, assign severities, and produce the final report. Do NOT apply any fixes.

Steps:
1. Collect the JSON arrays from both subagents.
2. Deduplicate findings that reference the same file + line.
3. For each requirement in the checklist, mark it: ✅ Fully Met / ⚠️ Partially Met / ❌ Broken.
4. Assign severity to each finding using the guide in `reviewer-persona.md`:
   - **P1** — User-visible regression: a feature that is documented as supported is provably broken for a subset of users.
   - **P2** — Inconsistency: the feature works in most cases but not all (e.g. a hardcoded locale in an admin-only context that is explicitly English-only by design is P2, not P1).
   - **P3** — Minor gap: incomplete translation of a non-critical string, cosmetic inconsistency.
5. Produce the **Findings Report** in the format defined in `findings-template.md`.
6. Produce the **Spec-Compliance Checklist** using `spec-compliance-checklist.md`.

---

## Phase 4 — Human Approval Gate

**Goal:** Present findings to the developer. Require explicit approval before touching any code.

Steps:
1. Present the Findings Report and Spec-Compliance Checklist to the user.
2. For each P1 and P2 finding, propose the minimal fix (one sentence description).
3. Ask: *"Which of these findings should I fix? You can approve all, approve a subset by number, or decline all. Admin-only or intentional English-only contexts may be excluded."*
4. **Do not write any code until the user replies.**
5. Record which findings are approved and which are intentionally excluded (with the user's stated reason).

---

## Phase 5 — Fix Stage

**Goal:** Apply only the approved fixes. Keep changes minimal and surgical.

Steps:
1. For each approved finding:
   - Use `apply_diff` for targeted in-place edits. Never use `write_file` on an existing file unless a full rewrite is genuinely required.
   - Follow the existing code style exactly (same quote style, same conditional pattern used elsewhere in the file).
   - For i18n fixes: use the same `lang === "bn" ? "বাংলা" : "English"` ternary pattern already present in the file.
   - For theme fixes: use the same CSS class / CSS variable pattern already present — never introduce a new pattern.
2. After each file edit, do not re-read the file unless a subsequent edit in the same file depends on the line numbers shifting.
3. Record what was changed: file, line range, finding ID.

---

## Phase 6 — Verification Stage

**Goal:** Confirm approved fixes are correct and complete. Detect regressions.

Steps:
1. Re-read each modified file and verify the fix is present and syntactically correct.
2. Run TypeScript type-checking if a `tsconfig.json` is present:
   ```
   node node_modules/typescript/bin/tsc --noEmit
   ```
   (Use `node` directly to avoid PowerShell execution-policy issues on Windows.)
3. Re-run a targeted grep for each fixed pattern to confirm the violation is gone:
   ```
   grep -rn "<old hardcoded string>" src/
   ```
4. Check that no new violations of the same category were introduced in adjacent lines.
5. For any finding that was **not** approved, confirm it is still present (i.e. nothing accidentally touched it).

---

## Phase 7 — Final Report

**Goal:** Produce the complete audit summary as a permanent record.

Output the following sections (in chat — do not use `create_html_artifact` unless the user explicitly asks for a shareable one-pager):

### Summary
- Total files scanned
- Total findings (by scanner, by severity)
- Requirements: N fully met / N partially met / N broken

### Spec-Compliance Checklist
| REQ-ID | Requirement | Status | Finding IDs |
|---|---|---|---|

### Findings Table
| # | Severity | File | Line | Category | Description | Approved | Fixed |
|---|---|---|---|---|---|---|---|

### Impact Estimate
- **Manual grep estimate** — time for a developer to walk all files manually for each violation category
- **Audit loop runtime** — time from first scan spawn to verified fixes (excludes packaging as a skill)
- **New violations found (not previously known)**

> **Timing note:** The audit loop (scan → report → fix → verify) and the full workflow session (including packaging as a reusable skill) are different durations. Report both separately.

### Remaining Open Items
Any P1/P2 findings that were not approved, with the stated reason.

---

## Adapting This Workflow for Other Codebases

| Dimension | Where to change |
|---|---|
| i18n system | Update `locale-scanner-persona.md` — replace `dict[lang][key]` references with the project's actual translation call pattern |
| Theme system | Update `theme-scanner-persona.md` — replace `.light` CSS override descriptions with the project's theme mechanism |
| Locale variable name | Replace `lang` throughout the scanner personas |
| Additional requirement categories | Add new scanner personas as extra subagents in Phase 2 |
| Stack (non-Next.js) | The phase structure is stack-agnostic; only the grep patterns and file paths inside the personas change |

---

## Notes

- **Parallel subagents are the key performance mechanism.** The two scanners in Phase 2 must be spawned in the same `spawn_subagent` batch — not sequentially. This is what makes the pipeline faster than a serial grep walk.
- **The Human Approval Gate (Phase 4) is non-negotiable.** Never skip it. The workflow produces a report; a human decides what to fix.
- **Admin-only or intentionally monolingual contexts are P2, not P1 — but verify the assumption.** If a component carries a code comment explicitly stating it is English-only by design, flag it P2. If no such comment exists and the assumption is inferred, flag it P2 anyway but note "assumption unverified against spec" in the description. Let the human reviewer confirm or override at Phase 4.
- **Supporting files:** `locale-scanner-persona.md`, `theme-scanner-persona.md`, `reviewer-persona.md`, `findings-template.md`, `spec-compliance-checklist.md` are all in this skill directory. Read them at the relevant phase.
