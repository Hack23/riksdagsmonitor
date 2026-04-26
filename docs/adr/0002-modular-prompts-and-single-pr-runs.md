# ADR 0002 — Modular prompt library and single-PR agentic workflow runs

- **Status**: Accepted
- **Date**: 2026-04-21
- **Authors**: Hack23 AB — Riksdagsmonitor maintainers
- **Deciders**: CEO / CISO (per `Change_Management.md` — Normal change touching `.github/aw/` and workflow `.md` configuration)

## Context

The agentic news pipeline had grown the following structural defects by April 2026:

1. **Monolithic shared prompt file** — `.github/aw/SHARED_PROMPT_PATTERNS.md` held ~4,350 lines covering ~50 mixed topics (bash format, UTF-8, MCP inventory, 9- and 14-artifact gates, heartbeat PR strategy, DIW, visualisation, IMF/WB/SCB references, three competing PR template variants, audit history, version tags v3.0/v4.0/v5.0, dated annotations, and run IDs).
2. **Multi-PR heartbeat pattern** — every news workflow declared `safe-outputs.create-pull-request.max: 2–5` and implemented a "🫀 Heartbeat PR #1 / final PR #2" pattern with a 55-minute background keep-alive pinger. In practice `safeoutputs___create_pull_request` **freezes the patch at call time**; every commit made after the first call was silently dropped. Content loss was confirmed by the user and by direct observation of missing translations / analyses on merged PRs.
3. **Workflow bloat** — the 12 news workflow `.md` files were 780–1,100 lines each (≈15,300 lines total). They duplicated rules from the shared file and referenced it as prose ("See `SHARED_PROMPT_PATTERNS.md` →…") without using the first-class `imports:` mechanism that gh-aw already supports.
4. **Scattered enforcement** — the "analysis before article" rule was stated in six+ places with inconsistent minute budgets (22 / 14 / 40). The PR template existed in three variants. The economic-chart spec existed in three variants.
5. **Token bloat** — duplicate correct/incorrect examples, inline rationale paragraphs citing PR numbers and run IDs, tutorials that already lived in `.github/skills/`.

Total prompt-surface footprint: ~19,700 lines of markdown fed to every news run.

## Decision

Adopt a bounded-context prompt library under `.github/prompts/` and **exactly one pull request per run**.

### 1. Prompt library

Eight core modules + one Tier-C extension + a `README.md`:

```
.github/prompts/
├── 00-base-contract.md           role, ethics, GDPR/ISMS, AI-FIRST, pipeline order
├── 01-bash-and-shell-safety.md   bash tool call format, AWF-safe shell, UTF-8
├── 02-mcp-access.md              MCP inventory, tool naming, in-prompt health gate
├── 03-data-download.md           subfolder naming, download pipeline, lookback
├── 04-analysis-pipeline.md       methodology, 9 core artifacts, Pass 1 / Pass 2
├── 05-analysis-gate.md           single blocking gate before any article
├── 06-article-generation.md      sections, banned patterns, visualisation
├── 07-commit-and-pr.md           stage → commit → ONE create_pull_request
├── README.md                     catalogue + dependency matrix + phase diagram
└── ext/
    └── tier-c-aggregation.md     14-artifact gate, period multipliers, cross-type
```

- Every module ≤ 300 lines, declarative rules only, no audit history, no PR/run IDs, no version tags.
- Modules link to (do not copy) authoritative sources: `analysis/methodologies/`, `analysis/templates/`, `.github/copilot-mcp.json`, ISMS policies.

### 2. Workflow refactor

- All 12 news workflows declare `imports:` in frontmatter; `gh aw compile` resolves them into `{{#runtime-import …}}` directives in the generated `.lock.yml`.
- `safe-outputs.create-pull-request.max: 1` on every news workflow (was 2 / 3 / 5).
- Background keep-alive pinger removed; MCP pre-warm is a single best-effort `curl` step (≤ 6 retries, 20 s apart, `curl --max-time 30`) — worst-case runtime can exceed 4 minutes, see `.github/prompts/02-mcp-access.md` §"Pre-warm step". If a strict cap is required, tighten the `curl` timeout and retry parameters.
- Workflow bodies reduced to ≤ 50 lines each (schedule + inputs + time budget + dedup path).
- `news-translate` imports only the four modules it needs (base contract, bash/shell, MCP, commit & PR) and issues exactly one PR batching every language produced in the run.

### 3. Single blocking gate

`05-analysis-gate.md` is the only separator between analysis and article generation. It checks: 9 artifacts exist, no `AI_MUST_REPLACE` markers, evidence citations (`dok_id`) in SWOT + significance files, Mermaid diagrams present, Pass 2 completed. The article-dedup / `analysis-only` path uses the same single PR with a different label.

### 4. CI enforcement

`compile-agentic-workflows.yml` fails the build on any of:

- prompt module > 300 lines
- news workflow body > 200 lines
- `create-pull-request.max ≠ 1`
- occurrences of `Heartbeat`, `keep-alive pinger`, `post-heartbeat rebase`, `🫀`

## Consequences

### Positive

- **No more data loss** on long runs — one PR per run, no dropped commits.
- **Token discipline** — prompt surface reduced from ~19,700 → ≈4,000 lines (~80 % reduction).
- **Maintainability** — each rule lives in exactly one module; dependencies are declared, not referenced.
- **Onboarding** — the dependency matrix in `.github/prompts/README.md` lets new contributors see what rules apply where without reading 4,350 lines.
- **Drift prevention** — CI enforcement blocks regressions.

### Negative / accepted trade-offs

- **Lost "progressive PR" resilience pattern.** The multi-PR heartbeat was attempting to survive the ~30-minute safeoutputs session idle window. We accept the loss because it never actually worked — the second commit batch was silently dropped. The real fix for session expiry is shorter workflows + scope trimming, which is now the explicit deadline policy in `07-commit-and-pr.md`.
- **Harder to add one-off rules to a single workflow.** The new model is factored around shared modules; a workflow-unique tweak requires either inlining it into that workflow's body (within the 200-line cap) or factoring it into a module. This is the intended friction.

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| MCP session expiry without heartbeat | Tight time budgets + scope-trim policy + best-effort MCP pre-warm (worst-case > 4 min, see `.github/prompts/02-mcp-access.md`); deadline rule in `07-commit-and-pr.md` forces commit + PR by minute ~55. |
| `imports:` resolution differences across gh-aw versions | `compile-agentic-workflows.yml` pins gh-aw via `GH_AW_VERSION="v0.69.3"`. |
| Hidden rules in the 4,350-line file dropped accidentally | Phase A migrated every H2/H3 explicitly; review is backed by the CI module-size/banned-string check. |
| `news-translate` capacity | If 12 languages exceed the 60-minute budget, translation is split across multiple scheduled runs (already cron'd twice daily + weekend catch-up) rather than across multiple PRs in one run. |

## Compliance & governance

- **Change type** per `Change_Management.md`: Normal change. Requires CEO approval before merge.
- **ISMS mapping**: affects CIS Controls v8.1 §16 Application Software Security (agentic pipeline), NIST CSF 2.0 PR.PS-01 (Configuration management), ISO 27001:2022 A.5.33 (documented information).
- **Risk review**: no CIA triad rating change (data flows unchanged). Attack surface unchanged (same MCP servers, same network allowlist). Threat model unchanged — supersedes the internal "progressive PR" resilience assumption only.
- **Open-source policy**: no new dependencies.

## References

- `.github/prompts/README.md` — catalogue + dependency matrix + phase sequence diagram
- `.github/workflows/compile-agentic-workflows.yml` — CI enforcement block
- `.github/skills/github-agentic-workflows/SKILL.md` §"Imports (Reusable Components)" — `imports:` semantics
- `.github/skills/gh-aw-workflow-authoring/SKILL.md` — authoring pattern with a link to `.github/prompts/`
- `analysis/methodologies/ai-driven-analysis-guide.md` — authoritative DIW methodology (unchanged)
- `analysis/templates/` — authoritative artifact templates (unchanged)
- gh-aw packaging-imports guide: <https://github.github.com/gh-aw/guides/packaging-imports/>
- gh-aw Copilot agent files reference: <https://github.github.com/gh-aw/reference/copilot-custom-agents/>

## Addendum — 2026-04-21 correctness pass

A follow-up deep review fixed defects that slipped through the initial
migration:

| # | Defect | Fix |
|---|--------|-----|
| 1 | `01-bash-and-shell-safety.md` told the agent to avoid `${VAR}` and `${VAR:-default}` (standard parameter expansion) and to work around `$(…)` via temp files. AWF inspects network egress, not shell syntax; `$(…)` is used throughout our own workflow `steps:`. | Rewrote module 01: quote expansions, use `set -Eeuo pipefail`, UTF-8 locale, keep secrets out of log-visible substitutions. Removed the factually wrong table rows. |
| 2 | `scripts/validate-analysis-gate.ts`, `scripts/validate-tier-c-gate.ts`, `scripts/inject-analysis-references.ts` and `scripts/validate-translation.ts` are referenced from prompts / workflow bodies but do not exist in the repo. | Module 05 and the Tier-C extension now carry inline bash gate scripts that implement the documented checks directly; module 06 points at the hand-written analysis-references footer; news-translate.md's validator reference is corrected to the existing `scripts/validate-news-translations.ts`. |
| 3 | The `dok_id` evidence requirement was restated with slight variations in modules 00, 04, 05, 06. The "never fabricate" rule was in 00 and 02. The `safeoutputs___noop` policy was in 00, 02, 07. | Canonical statement lives in exactly one module; the others cross-reference it (e.g. "gate enforcement lives in `05-analysis-gate.md` check 4"). |
| 4 | Module 02's tool-naming table listed `filesystem`, `memory`, `sequential-thinking`, `playwright` as available helpers, but news workflows do not declare those under `mcp-servers:`; they exist only on the local Copilot channel (`.github/copilot-mcp.json`). | Replaced the table with a per-surface view (what the news workflow actually sees vs what the local Copilot sees) and added the `repo-memory`, `bash`, `safeoutputs` rows that were previously implicit. |
| 5 | `.github/prompts/README.md` did not explain why we use plain imports instead of a single Copilot Agent File. gh-aw docs cap Copilot Agent Files at **one per workflow**, which is incompatible with our 8-module split. | Added a "Why multiple prompt imports" section describing the two import styles, the one-per-workflow cap, and the coexistence with `.github/agents/*.md` persona files used by `assign_copilot_to_issue`. |

All 12 workflows still compile clean (`gh aw compile`: 0 errors, 0 warnings); all four CI invariants still hold.
