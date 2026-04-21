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
- Background keep-alive pinger removed; MCP pre-warm kept at ≤ 2 minutes (≤ 6 retries, 20 s apart).
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
| MCP session expiry without heartbeat | Tight time budgets + scope-trim policy + ≤ 2 min pre-warm; deadline rule in `07-commit-and-pr.md` forces commit + PR by minute ~55. |
| `imports:` resolution differences across gh-aw versions | `compile-agentic-workflows.yml` pins gh-aw via `GH_AW_VERSION="v0.69.2"`. |
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
