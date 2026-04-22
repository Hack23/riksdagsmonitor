# `.github/prompts/` — Agentic Workflow Prompt Library

This directory holds the **bounded-context prompt modules** imported by every news workflow in `.github/workflows/news-*.md`. It replaces the previous monolithic `.github/aw/SHARED_PROMPT_PATTERNS.md`.

## Why

- **One concern per module** — each file is ≤ 300 lines and has a single responsibility.
- **Explicit dependencies** — workflows declare imports in YAML frontmatter (`imports:`), not by prose reference.
- **No duplication** — modules link to the canonical methodology, template, and MCP config files rather than copy them.
- **No audit history** — rules only, no dated run IDs, PR numbers, or version tags.

## Integration points (authoritative)

This directory is the **single source of truth** for how GitHub Agentic Workflows (gh-aw) produce news articles in this repo. Agents, skills, and copilot instructions MUST link back here rather than restate the rules.

- **gh-aw runtime**: `gh-aw-actions/setup-cli@v0.69.3` (see any `news-*.lock.yml` for the pinned action).
- **Upstream documentation** — link-out only, never copy content:
  - Abridged: <https://github.github.com/gh-aw/llms-small.txt>
  - Complete: <https://github.github.com/gh-aw/llms-full.txt>
  - Agentic-workflows blog series: <https://github.github.com/gh-aw/_llms-txt/agentic-workflows.txt>
  - Source repo: <https://github.com/github/gh-aw>
  - GitHub CLI: <https://cli.github.com/manual/>
- **Analysis artifact contract** (the "deep political analysis" product that every news workflow must produce *before* writing a single article sentence):
  - Methodology → [`analysis/methodologies/ai-driven-analysis-guide.md`](../../analysis/methodologies/ai-driven-analysis-guide.md)
  - Templates → [`analysis/templates/`](../../analysis/templates/) (one file per artifact)
  - **9 core artifacts** (single-type workflow, produced in `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/`): `synthesis-summary.md`, `swot-analysis.md`, `risk-assessment.md`, `threat-analysis.md`, `stakeholder-perspectives.md`, `significance-scoring.md`, `classification-results.md`, `cross-reference-map.md`, `data-download-manifest.md` — full definitions in [`04-analysis-pipeline.md`](04-analysis-pipeline.md).
  - **14 artifacts** for Tier-C aggregation (9 core + `README.md`, `executive-brief.md`, `scenario-analysis.md`, `comparative-international.md`, `methodology-reflection.md`) — full definitions in [`ext/tier-c-aggregation.md`](ext/tier-c-aggregation.md).
- **Single blocking gate**: [`05-analysis-gate.md`](05-analysis-gate.md) is the only enforcer. No article may be touched until the gate passes.
- **AI-FIRST rule** (from [`00-base-contract.md`](00-base-contract.md) §Non-negotiable rules #5): minimum 2 complete iterations — Pass 1 creates every artifact, Pass 2 reads Pass 1 back in full and improves every section.

## Module catalogue

| File | Responsibility | Consumed by |
|------|---------------|-------------|
| [`00-base-contract.md`](00-base-contract.md) | Role, ethics, GDPR/ISMS, AI-FIRST quality rule, pipeline order | All news workflows + translate |
| [`01-bash-and-shell-safety.md`](01-bash-and-shell-safety.md) | Bash tool call format, AWF-safe shell patterns, UTF-8 | All news workflows + translate |
| [`02-mcp-access.md`](02-mcp-access.md) | MCP server inventory, tool naming, in-prompt health gate | All news workflows + translate |
| [`03-data-download.md`](03-data-download.md) | Download pipeline, subfolder naming, lookback fallback, manifest | All content workflows |
| [`04-analysis-pipeline.md`](04-analysis-pipeline.md) | Methodologies, templates, 9 core artifacts, Pass 1 / Pass 2 | All content workflows |
| [`05-analysis-gate.md`](05-analysis-gate.md) | Single blocking gate before any article is touched | All content workflows |
| [`06-article-generation.md`](06-article-generation.md) | Article sections, banned patterns, visualisation, translations | All content workflows |
| [`07-commit-and-pr.md`](07-commit-and-pr.md) | Stage → commit → exactly one `create_pull_request` | All news workflows + translate |
| [`ext/tier-c-aggregation.md`](ext/tier-c-aggregation.md) | 14-artifact gate, period multipliers, cross-type synthesis | Aggregation & reference-grade workflows |

## Dependency matrix

| Workflow | 00 | 01 | 02 | 03 | 04 | 05 | 06 | 07 | ext |
|----------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|
| `news-propositions` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `news-motions` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `news-committee-reports` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `news-interpellations` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `news-evening-analysis` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `news-week-ahead` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `news-month-ahead` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `news-weekly-review` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `news-monthly-review` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `news-realtime-monitor` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `news-article-generator` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `news-translate` | ✅ | ✅ | ✅ | | | | | ✅ | |

## Phase sequence (single-type workflow)

```mermaid
flowchart LR
  A[Download data<br/>module 03] --> B[Read methodologies &amp; templates<br/>module 04]
  B --> C[Analysis Pass 1<br/>module 04]
  C --> D[Analysis Pass 2<br/>module 04]
  D --> E{Analysis Gate<br/>module 05}
  E -- pass --> F[Article Pass 1 &amp; 2<br/>module 06]
  E -- fail --> G[Fix &amp; retry]
  G --> E
  F --> H[Stage &amp; commit<br/>module 07]
  H --> I[ONE create_pull_request<br/>module 07]
  style A fill:#0a0e27,stroke:#00d9ff,color:#e0e0e0
  style E fill:#1a1e3d,stroke:#ff006e,color:#e0e0e0
  style I fill:#1a1e3d,stroke:#ffbe0b,color:#e0e0e0
```

## Why multiple prompt imports (not a single Copilot Agent File)

gh-aw supports [two distinct import styles](https://github.github.com/gh-aw/guides/packaging-imports/):

| Style | Source | Per-workflow cap | Frontmatter shape | Use for |
|-------|--------|------------------|-------------------|---------|
| **Plain imports** | Any `.md` outside `.github/agents/` | unlimited | plain Markdown (no special frontmatter required) | Shared rule modules — this directory. |
| **Copilot Agent File** | `.github/agents/<name>.md` | **exactly one** per workflow | `name`, `description`, `tools`, `mcp-servers` | Per-issue delegation via `assign_copilot_to_issue`, or a single specialised persona for one workflow. |

News workflows need eight bounded-context modules (role, shell, MCP, download, analysis, gate, article, commit) plus an optional Tier-C extension. The "one agent file per workflow" limit makes that infeasible as a single agent file, so we use plain imports. The 24 files under `.github/agents/` remain the persona catalogue for `assign_copilot_to_issue` and for any future workflow that genuinely needs a single reusable persona per run.

If a workflow ever needs a *single* reusable persona (e.g. a pure code-review workflow), that workflow may import one agent file from `.github/agents/` **in addition to** any plain prompt imports — gh-aw allows mixing the two styles.

## Authoring rules for new / edited modules

| Rule | Enforced by |
|------|-------------|
| ≤ 300 lines per module | CI check in `compile-agentic-workflows.yml` |
| No audit history, PR/run IDs, version tags | Code review |
| Link to canonical external docs rather than copy content | Code review |
| Tables over prose where rules are enumerable | Code review |
| Declarative ("do X") not narrative ("we decided to do X because of PR #1794") | Code review |

## Changing the import list of a workflow

1. Edit the workflow's frontmatter `imports:` list.
2. Run `gh aw compile` locally.
3. Commit both `.md` and regenerated `.lock.yml`.

See [`.github/skills/github-agentic-workflows/SKILL.md`](../skills/github-agentic-workflows/SKILL.md) §"Imports" for gh-aw import semantics.

## History

The monolithic `.github/aw/SHARED_PROMPT_PATTERNS.md` was deleted when these modules went live. Every rule from the old file was either migrated into one of the modules above, merged with an equivalent rule, or deleted as audit history / duplicated content / tutorial from a skill file.
