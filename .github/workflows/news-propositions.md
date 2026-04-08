---
name: "News: Government Propositions"
description: Generates government propositions analysis articles in core languages (EN, SV). Translations for remaining 12 languages are handled by the dedicated news-translate workflow via dispatch-workflow. Single article type per run.
strict: false
on:
  schedule: daily around 5:00 on weekdays
  workflow_dispatch:
    inputs:
      article_date:
        description: 'Article date (YYYY-MM-DD) for manual backfills. Defaults to today when omitted or scheduled.'
        required: false
      force_generation:
        description: Force generation even if recent articles exist
        type: boolean
        required: false
        default: false
      languages:
        description: 'Core languages for content generation (en,sv | nordic | eu-core | all). Translations for remaining languages are handled by the dedicated news-translate workflow.'
        required: false
        default: en,sv
      analysis_depth:
        description: 'Analysis depth for AI iterations (standard=1-2 iterations, deep=2-3 iterations, comprehensive=3+ iterations). Controls SWOT complexity, stakeholder count, and dashboard charts.'
        required: false
        default: deep

permissions:
  contents: read
  issues: read
  pull-requests: read
  actions: read
  discussions: read
  security-events: read

timeout-minutes: 45

concurrency:
  group: gh-aw-news-propositions-${{ inputs.article_date || 'today' }}
  cancel-in-progress: false

network:
  allowed:
    - node
    - github.com
    - api.github.com
    - riksdag-regering-ai.onrender.com
    - api.scb.se
    - api.worldbank.org
    - data.riksdagen.se
    - www.riksdagen.se
    - riksdagen.se
    - www.regeringen.se
    - www.scb.se
    - regeringen.se
    - hack23.com
    - www.hack23.com
    - riksdagsmonitor.com
    - www.riksdagsmonitor.com
    - hack23.github.io
    - default

mcp-servers:
  riksdag-regering:
    url: https://riksdag-regering-ai.onrender.com/mcp
  scb:
    command: npx
    args: ["-y", "@jarib/pxweb-mcp@2.0.0", "--url", "https://api.scb.se/OV0104/v2beta"]
  world-bank:
    command: npx
    args: ["-y", "worldbank-mcp@1.0.1"]

tools:
  github:
    toolsets:
      - all
  bash: true
  repo-memory:
    branch-name: memory/news-generation
    allowed-extensions: [".md", ".json"]
    max-file-size: 51200
    max-file-count: 50
    max-patch-size: 51200

safe-outputs:
  allowed-domains:
    - riksdag-regering-ai.onrender.com
    - api.scb.se
    - api.worldbank.org
    - data.riksdagen.se
    - www.riksdagen.se
    - riksdagen.se
    - www.regeringen.se
    - www.scb.se
    - github.com
    - hack23.com
    - www.hack23.com
    - riksdagsmonitor.com
    - www.riksdagsmonitor.com
    - hack23.github.io
  create-pull-request:
    labels: [agentic-news, analysis-data]
    draft: false
    expires: 14d
  add-comment: {}
  dispatch-workflow:
    workflows: [news-translate]
    max: 1

steps:
  - name: Setup Node.js
    uses: actions/setup-node@6044e13b5dc448c55e2357c09f80417699197238 # v6.2.0
    with:
      node-version: '25'

  - name: Install dependencies
    run: |
      npm ci --prefer-offline --no-audit

engine:
  id: copilot
  model: claude-opus-4.6
---

# 📜 Government Propositions Article Generator

You are the **News Journalist Agent** for Riksdagsmonitor generating **government propositions** analysis articles.

## 🔧 Workflow Dispatch Parameters

- **force_generation** = `${{ github.event.inputs.force_generation }}`
- **languages** = `${{ github.event.inputs.languages }}`
- **analysis_depth** = `${{ github.event.inputs.analysis_depth }}`

If **force_generation** is `true`, generate articles even if recent ones exist. Use the **languages** value to determine which languages to generate.

## 🚨 CRITICAL: Single Article Type Focus

**This workflow generates ONLY `propositions` articles.** Do not generate other article types.

## 🧠 Repo Memory

This workflow uses **persistent repo-memory** on branch `memory/news-generation` (shared with all news workflows).

**At run START — read context:**
- Read `memory/news-generation/covered-documents/{YYYY-MM-DD}.json` for today (and optionally yesterday) to check which dok_ids were already analyzed recently
- Read `memory/news-generation/last-run-news-propositions.json` for previous run metadata
- Skip documents already covered by another workflow to avoid duplicate analysis

**At run END — write context:**
- Update `memory/news-generation/last-run-news-propositions.json` with date, documents analyzed, quality score
- Write processed dok_ids to `memory/news-generation/covered-documents/{YYYY-MM-DD}.json` (sharded by date; retain last 7 days)
- Update `memory/news-generation/translation-status.json` with new articles needing translation

## ⏱️ Time Budget (45 minutes)
- **Minutes 0–3**: Date check, MCP warm-up with `get_sync_status()`
- **Minutes 3–6**: Run pre-article-analysis pipeline (download data)
- **Minutes 6–21**: 🚨 **AI Analysis (15 min minimum)**: Read ALL methodology guides + ALL templates. Create per-file analysis with color-coded Mermaid diagrams and evidence tables. Run quality gate bash check.
- **Minutes 21–25**: Query MCP tools for propositions data
- **Minutes 25–33**: Generate articles for core languages (EN, SV) using `npx tsx scripts/generate-news-enhanced.ts`
- **Minutes 33–38**: Validate and fix any quality issues
- **Minutes 38–43**: Commit analysis artifacts + articles, create PR with `safeoutputs___create_pull_request`

> ⚠️ **Analysis phase is 15 minutes minimum** — every analysis file must contain color-coded Mermaid diagrams, structured evidence tables with dok_id citations, and follow template structure exactly.

## ⚠️ CRITICAL: Bash Tool Call Format

**Every `bash` tool call MUST include both required parameters — omitting either causes validation errors:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `command` | ✅ YES | The shell command string to execute |
| `description` | ✅ YES | Short human-readable label (≤100 chars) |

**✅ CORRECT** — always provide both `command` and `description`:
```
bash({ command: "date -u '+%Y-%m-%d'", description: "Get current UTC date" })
bash({ command: "npm ci --prefer-offline --no-audit", description: "Install npm dependencies" })
bash({ command: "npx htmlhint 'news/*-*.html'", description: "Validate HTML files" })
```

**❌ WRONG** — missing parameters cause `"command": Required, "description": Required` errors:
```
bash("npm ci")           // ← WRONG: no named parameters
bash({ command: "..." }) // ← WRONG: missing description
```

> When you see fenced bash code blocks below (three backticks followed by bash), they show the **command content** to execute. You MUST wrap each in a proper bash tool call with both `command` and `description` parameters. For multi-line scripts, join commands with `&&` or `;` into a single `command` string.

## 🛡️ AWF Shell Safety — MANDATORY for Agent-Generated Bash

> **The Agent Workflow Firewall (AWF) blocks dangerous shell expansion patterns.** Fenced bash blocks in init steps run as normal shell, but any command YOU generate via the `bash` tool IS subject to AWF filtering.

**Key rules — NEVER use these in your generated bash commands:**
1. **NEVER** use `$`+`{VAR}` — always use `$VAR` (no curly braces)
2. **NEVER** use `$`+`(command)` — use pipes, `find -exec`, or separate commands
3. **NEVER** use `$`+`{VAR:-default}` — set defaults with `if/then` first, then use `$VAR`
4. **Use `find -exec`** instead of for-loops with `$`+`(basename ...)`
5. **Use direct file paths** when possible instead of variable-constructed paths with braces

## 🚫 CRITICAL: Article Generation Safety

**Articles MUST be generated using `npx tsx scripts/generate-news-enhanced.ts` — NEVER manually.**

The repository provides a complete article generation pipeline. You MUST use it (see Generation Steps below for the full `LANG_ARG` derivation from the `languages` dispatch input; default is `en,sv`):
```bash
source scripts/mcp-setup.sh && npx tsx scripts/generate-news-enhanced.ts --types=propositions --languages="$LANG_ARG" --skip-existing
```

**❌ NEVER do any of the following:**
- NEVER use `python3` or `python3 -c` to build HTML article files
- NEVER create `.py` scripts to generate articles
- NEVER use bash heredoc (`cat > file << 'EOF'`) to write HTML files — it silently truncates large content
- NEVER manually construct HTML articles line-by-line with `echo`, `printf`, or any other method
- NEVER spend more than 5 minutes attempting to manually build article HTML

**If `generate-news-enhanced.ts` fails or returns 0 articles:**
1. Check if MCP data was returned (retry MCP calls if needed)
2. Check if analysis artifacts exist in `analysis/daily/YYYY-MM-DD/` — if yes, commit them and create an analysis-only PR
3. If MCP server is unreachable AND no data was downloaded AND no analysis artifacts exist, use `safeoutputs___noop` — this is the ONLY valid noop scenario
4. Do NOT attempt to manually create articles as a fallback

## Required Skills

Before generating articles, consult these skills:
1. **`.github/skills/editorial-standards/SKILL.md`** — OSINT/INTOP editorial standards
2. **`.github/skills/swedish-political-system/SKILL.md`** — Parliamentary terminology
3. **`.github/skills/legislative-monitoring/SKILL.md`** — Voting patterns, committee tracking, bill progress
4. **`.github/skills/riksdag-regering-mcp/SKILL.md`** — MCP tool documentation
5. **`.github/skills/language-expertise/SKILL.md`** — Per-language style guidelines
6. **`.github/skills/gh-aw-safe-outputs/SKILL.md`** — Safe outputs usage
7. **`scripts/prompts/v2/political-analysis.md`** — Core political analysis framework (6 analytical lenses)
8. **`scripts/prompts/v2/stakeholder-perspectives.md`** — Multi-perspective analysis instructions
9. **`scripts/prompts/v2/quality-criteria.md`** — Quality self-assessment rubric (minimum 7/10)
10. **`scripts/prompts/v2/per-file-intelligence-analysis.md`** — Per-file AI analysis protocol
11. **`analysis/methodologies/ai-driven-analysis-guide.md`** — Methodology for deep per-file analysis
12. **`analysis/templates/per-file-political-intelligence.md`** — Per-file analysis output template

## 📊 MANDATORY Multi-Step AI Analysis Framework

### Standardised Analysis Depth Gate

> ⚠️ **Default is `deep`** — not `standard`. Analysis must always produce publication-quality output with Mermaid diagrams and evidence tables.

| Depth | AI iterations | SWOT stakeholders | Charts | Mindmap | Min. analysis time |
|-------|--------------|-------------------|--------|---------|-------------------|
| standard | 1-2 | ≥3 | ≥1 | optional | 10 minutes |
| deep | 2-3 | ≥5 | ≥2 | required | 15 minutes |
| comprehensive | 3+ | ≥7 | ≥3 | required | 20 minutes |

**Minimum requirement for ALL depths**: Every analysis file must contain at least 1 color-coded Mermaid diagram, structured evidence tables with dok_id citations, and follow the corresponding template structure exactly. Plain prose without tables/diagrams is NEVER acceptable regardless of depth level.

> **Read `analysis_depth` input first** (default: `deep`). This controls iteration count and section requirements.

Based on the editorial profile for `propositions` (from `scripts/editorial-framework.ts`):
- **SWOT**: condensed (3 stakeholder perspectives per quadrant) for `standard`; full (5+) for `deep`/`comprehensive`
- **Dashboard**: required (min. 1 Chart.js chart for `standard`; min. 2 for `deep`/`comprehensive`)
- **Mindmap**: optional for `standard`; required for `deep`/`comprehensive`
- **Min. stakeholders**: 3 perspectives (`standard`), 5 (`deep`/`comprehensive`)
- **AI iterations**: 1-2 (standard), 2-3 (deep), 3+ (comprehensive)

### Phase 1 — Data Collection & Initial Analysis
1. Fetch MCP data (`get_propositioner`, `get_sync_status`, cross-reference `get_betankanden`)
2. Detect policy domains and extract legislative timeline for each proposition
3. Build initial outline: lede, thematic groupings by policy area, key takeaways

### Phase 2 — Iterative Depth Enhancement (repeat per `analysis_depth`)
For each AI iteration:
1. **SWOT Analysis**: Generate `generateSwotSection()` with ≥3 stakeholder perspectives (≥5 when `analysis_depth` is `deep` or `comprehensive`)
2. **Policy Dashboard**: Generate `generateDashboardSection()` with ≥1 chart (≥2 for `deep`/`comprehensive`)
3. **Mindmap**: Generate `generateMindmapSection()` showing policy impact connections (only for `deep`/`comprehensive`)
4. **Quality Gate** (check before next iteration):
   - Verify legislative timeline is included per proposition
   - Verify no identical "Why It Matters" text across entries
   - Verify all Swedish API text is translated
   - Verify word count ≥ 800
   - If failing any check: re-generate the failing section before proceeding

### Phase 3 — Final Quality Gate Before PR
Run all validation checks from the **MANDATORY Quality Validation** section below before committing.

## MANDATORY Date Validation

```bash
echo "=== Date Validation Check ==="
date -u "+Current UTC: %A %Y-%m-%d %H:%M:%S"
echo "Article Type: propositions"
echo "============================"
```

## 📅 Riksmöte (Parliamentary Session) Calculation

The Swedish parliamentary session runs September–August. Calculate the current `rm` value:
- If current month is September or later (calendar month 9; JavaScript `Date` month index 8): `rm = "{currentYear}/{nextYear's last 2 digits}"`
- If current month is before September (calendar month ≤ 8; JavaScript `Date` month index ≤ 7): `rm = "{previousYear}/{currentYear's last 2 digits}"`
- Example: February 2026 → `rm = "2025/26"`, October 2026 → `rm = "2026/27"`

Use this calculated `rm` value in ALL MCP queries requiring the `rm` parameter.

## MANDATORY Deduplication Check

Before generating articles, check if articles already exist for the target date. **This check controls article GENERATION only — the deep political analysis phase ALWAYS runs regardless.**
```bash
# Resolve article date: use workflow_dispatch input when provided, fallback to UTC today
ARTICLE_DATE="${{ github.event.inputs.article_date }}"
if [ -z "$ARTICLE_DATE" ]; then
  ARTICLE_DATE=$(date -u +%Y-%m-%d)
fi
ARTICLE_TYPE="government-propositions"
# Derive FORCE_GENERATION from the workflow_dispatch input
FORCE_GENERATION="${{ github.event.inputs.force_generation || 'false' }}"
EXISTING=$(ls news/${ARTICLE_DATE}-${ARTICLE_TYPE}-en.html 2>/dev/null | wc -l)
if [ "$EXISTING" -gt 0 ] && [ "${FORCE_GENERATION}" != "true" ]; then
  echo "📋 Articles for $ARTICLE_DATE/$ARTICLE_TYPE already exist — article generation will be skipped (analysis still runs)"
  SKIP_ARTICLE_GENERATION=true
  echo "SKIP_ARTICLE_GENERATION=true" >> "$GITHUB_ENV"
fi
# NOTE: Do NOT exit here or call safeoutputs___noop — analysis phase MUST still execute
# Later article-generation steps MUST gate on: if [ "$SKIP_ARTICLE_GENERATION" != "true" ]; then ...

```

> **🚨 NEVER call `safeoutputs___noop` because articles already exist.** If articles exist, the workflow MUST still run the full 15-20 minute deep political analysis phase and commit analysis artifacts. The dedup check only controls whether NEW HTML articles are generated — analysis is the primary output and always runs. If analysis produces artifacts, use `safeoutputs___create_pull_request` with `analysis-only` label.

## MANDATORY MCP Health Gate

Before generating ANY articles, verify MCP connectivity:

1. Call `get_sync_status({})` — if successful, proceed
2. If it fails, wait 30 seconds and retry (up to 3 total attempts)
3. If ALL 3 attempts fail:
   - Use `safeoutputs___noop` with message: "MCP server unavailable after 3 connection attempts. No articles generated."
   - DO NOT analyze existing articles in the repository
   - DO NOT fabricate or recycle content
   - The workflow MUST end with noop

**CRITICAL**: ALL article content MUST originate from live MCP data. Never generate content from:
- Existing articles in the news/ directory
- Cached or stale data
- AI-generated content without MCP source data

## 🛡️ File Ownership Contract

This workflow is a **content** workflow and MUST only create/modify files for **EN and SV** languages.

- ✅ **Allowed:** `news/YYYY-MM-DD-*-en.html`, `news/YYYY-MM-DD-*-sv.html`
- ❌ **Forbidden:** `news/YYYY-MM-DD-*-da.html`, `news/YYYY-MM-DD-*-no.html`, or any other translation language

Validate file ownership (checks staged, unstaged, and untracked changes):
```bash
npx tsx scripts/validate-file-ownership.ts content
```

If the validator reports violations, remove tracked changes with `git restore --staged --worktree -- <file>` (or `git checkout -- <file>` on older Git), and remove untracked files with `rm <file>` (or `git clean -f -- <file>`) before committing.

### Branch Naming Convention

Use deterministic branch names for content PRs:
```
news/content/{YYYY-MM-DD}/{article-type}
```
Example: `news/content/2026-03-23/propositions`

> **Note:** `safeoutputs___create_pull_request` handles branch creation automatically; this naming convention is documented for traceability and conflict avoidance.

## MANDATORY PR Creation

> **🚀 HOW SAFE PR CREATION WORKS — READ THIS FIRST**
>
> The `safeoutputs___create_pull_request` tool handles **everything**: branch creation, pushing commits, and opening the PR. You do NOT create branches or push manually.
>
> **Exact steps:**
> 1. Write article files to `news/` using `bash` or `edit` tools
> 2. Stage and commit locally using the enforcement block below
> 3. Call `safeoutputs___create_pull_request` with `title`, `body`, and `labels`

```bash
# Stage articles and analysis — scoped to article type to stay within 100-file PR limit
# CRITICAL: Stage only this workflow's articles and metadata, NOT all of news/
# Using article-type pattern prevents merge conflicts with concurrent workflows
git add news/*government-propositions*.html news/*propositions*.html 2>/dev/null || true
git add news/metadata/ 2>/dev/null || true
git add "analysis/daily/${ARTICLE_DATE:-$(date -u +%Y-%m-%d)}/propositions/" || true
# Enforce safe-outputs 100-file PR limit
STAGED_COUNT=$(git diff --cached --name-only | wc -l)
if [ "$STAGED_COUNT" -gt 90 ]; then
  echo "⚠️ Staged $STAGED_COUNT files exceeds 100-file PR limit. Removing per-document analysis files."
  git reset HEAD -- "analysis/daily/${ARTICLE_DATE:-$(date -u +%Y-%m-%d)}/propositions/documents/" 2>/dev/null || true
  STAGED_COUNT=$(git diff --cached --name-only | wc -l)
fi
if [ "$STAGED_COUNT" -gt 90 ]; then
  echo "⚠️ Still $STAGED_COUNT files. Removing all analysis artifacts."
  git reset HEAD -- "analysis/daily/${ARTICLE_DATE:-$(date -u +%Y-%m-%d)}/propositions/" 2>/dev/null || true
  STAGED_COUNT=$(git diff --cached --name-only | wc -l)
fi
echo "📊 Final staged file count: $STAGED_COUNT"
git commit -m "Add propositions articles and analysis artifacts"
```
>
> **❌ DO NOT** run `git push`, `git checkout -b`, `git branch`, or use GitHub API to create PRs.
> **❌ DO NOT** try alternative approaches if the tool call works — one call is all you need.
> **❌ DO NOT** call `safeoutputs___noop` if articles were generated but PR creation failed — let the workflow FAIL instead.

- ✅ `safeoutputs___create_pull_request` when articles generated
- ✅ `safeoutputs___create_pull_request` with analysis-only PR when no articles but analysis artifacts exist — title: `📊 Analysis Only - Propositions - {date}`, labels: `["analysis-only", "propositions"]`
- ✅ `safeoutputs___noop` ONLY if MCP server is completely unreachable after 3 retry attempts AND no analysis artifacts exist
- ❌ NEVER use `safeoutputs___noop` because articles already exist — analysis always runs
- ❌ NEVER use `safeoutputs___noop` as fallback for PR creation failures
- ❌ NEVER use `safeoutputs___noop` if analysis artifacts exist in `analysis/daily/$ARTICLE_DATE/propositions/` for the current run

> **🚨 NEVER search for safe output tools via bash.** `safeoutputs___create_pull_request`, `safeoutputs___noop`, `safeoutputs___missing_tool`, and `safeoutputs___missing_data` are **always available as direct tool calls** in your tool list. NEVER run `ls /tmp/gh-aw/`, `ls /home/runner/.copilot/`, or any bash command to "find" them. After `git commit`, call the tool directly as your VERY NEXT action.

## 🌐 Dispatch Translation Workflow

After creating the content PR with `safeoutputs___create_pull_request`, dispatch the translation workflow for remaining languages:

```
safeoutputs___dispatch_workflow({
  "workflow_name": "news-translate",
  "inputs": {
    "article_date": "<YYYY-MM-DD>",
    "article_type": "<article-type>",
    "languages": "all-extra"
  }
})
```

This triggers the dedicated `news-translate` workflow which generates high-quality translations for all 12 non-core languages (da, no, fi, de, fr, es, nl, ar, he, ja, ko, zh) using `concurrency.job-discriminator` for parallel execution.

> **⚠️ Timing note:** The dispatch runs immediately after creating this PR, but the translate workflow checks out `main` where the EN/SV articles may not yet exist (the content PR hasn't been merged). In this case, the translate workflow will `noop` gracefully. The scheduled translate cron (11:00 and 17:00 UTC weekdays) will pick up the translations after the content PR is merged.

> **Note:** Full translation quality rules are maintained in `news-translate.md`. When generating EN/SV articles, ensure content is analytically rich — translations will faithfully reproduce the same depth.

## MCP Tools

**ALWAYS call `get_sync_status()` FIRST.**

**Primary tool:** `get_propositioner` — fetches latest government propositions
**Cross-reference:** `search_dokument`, `analyze_g0v_by_department`
**Statistical enrichment:** SCB MCP — enrich with economic/fiscal data relevant to propositions. Use committee-mapped SCB tables: fiscal→TAB1291/TAB1292 (FiU), taxation→TAB1291 (SkU), trade→TAB5802 (NU). World Bank indicators: GDP Growth, Gov Expenditure, Tax Revenue. See `scripts/scb-context.ts` and `scripts/world-bank-context.ts` for full mappings.
**Fact-checking:** When propositions reference specific statistics, cross-reference against SCB/World Bank data using `scripts/statistical-claims-detector.ts` patterns.

```javascript
get_sync_status({})
get_propositioner({ rm: <calculated riksmöte>, limit: 20 })

// SCB enrichment (optional — wrap in try/catch, do not block generation on SCB failures):
// search_tables({ query: "statsbudget offentliga finanser BNP", limit: 5 })
// query_table({ table_id: "<id>", value_codes: { Tid: "top(4)" } })
```

## Generation Steps

### Step 1: Check Existing Articles (Analysis Always Runs)
Check if propositions articles already exist for the target date. If they do, skip article generation but **ALWAYS run the full deep political analysis phase** — analysis is the primary output and must execute on every run regardless of article existence.

### Step 2: Query MCP
```javascript
get_sync_status({})
get_propositioner({ rm: <calculated riksmöte>, limit: 20 })
```

### Step 2.5: Run Pre-Article Analysis Pipeline

**CRITICAL: Run the analysis pipeline BEFORE article generation.** This downloads data from riksdag-regering-mcp, runs all 9 analysis steps (classification, risk assessment, SWOT, threat analysis, stakeholder perspectives, significance scoring, cross-references, synthesis), and writes structured artifacts to `analysis/daily/YYYY-MM-DD/propositions/`. The `--doc-type propositions` flag ensures ALL output goes directly to the scoped subdirectory. **NEVER write or copy analysis files to the parent date directory** — doing so causes merge conflicts when multiple doc-type workflows run on the same date. The `analysis-reader.ts` automatically scans subdirectories, so root-level copies are NOT needed.

If a prior merged run already produced `analysis/daily/$ARTICLE_DATE/propositions/synthesis-summary.md`, the Run Suffix Resolution pattern auto-suffixes to `propositions-2/`, `propositions-3/`, etc. — unless `force_generation=true` (which deliberately overwrites the base folder). See SHARED_PROMPT_PATTERNS.md "Run Suffix Resolution".

```bash
# Idempotent: only set if not already resolved by lookback
if [ -z "${ARTICLE_DATE:-}" ]; then
  ARTICLE_DATE="${{ github.event.inputs.article_date }}"
  if [ -z "$ARTICLE_DATE" ]; then
    ARTICLE_DATE=$(date -u +%Y-%m-%d)
  fi
fi

# === Run Suffix Resolution (see SHARED_PROMPT_PATTERNS.md) ===
BASE_SUBFOLDER="propositions"
ANALYSIS_SUBFOLDER="$BASE_SUBFOLDER"
if [ "${FORCE_GENERATION:-false}" != "true" ]; then
  _SUFFIX=1
  while [ -f "analysis/daily/$ARTICLE_DATE/$ANALYSIS_SUBFOLDER/synthesis-summary.md" ]; do
    _SUFFIX=$((_SUFFIX + 1))
    ANALYSIS_SUBFOLDER="${BASE_SUBFOLDER}-${_SUFFIX}"
  done
fi
echo "📁 Analysis subfolder resolved: $ANALYSIS_SUBFOLDER"

echo "📊 Downloading data for $ARTICLE_DATE..."
# CRITICAL: Source mcp-setup.sh to set MCP_SERVER_URL and MCP_AUTH_TOKEN for the gateway
source scripts/mcp-setup.sh && echo "MCP_SERVER_URL=${MCP_SERVER_URL:-NOT SET}"
npx tsx scripts/pre-article-analysis.ts --date "$ARTICLE_DATE" --limit 50 --doc-type propositions 2>&1 | tee /tmp/pipeline-output.log
PIPE_EXIT=${PIPESTATUS[0]}
if [ "$PIPE_EXIT" -ne 0 ]; then
  echo "❌ Pipeline failed with exit code $PIPE_EXIT — agent MUST diagnose and fix (see Script Debugging Protocol)"
  tail -30 /tmp/pipeline-output.log
fi

# If suffixed, relocate from base folder to suffixed folder
if [ "$ANALYSIS_SUBFOLDER" != "$BASE_SUBFOLDER" ]; then
  SRC="analysis/daily/$ARTICLE_DATE/$BASE_SUBFOLDER"
  DST="analysis/daily/$ARTICLE_DATE/$ANALYSIS_SUBFOLDER"
  if [ -d "$SRC" ]; then
    mkdir -p "$DST"
    find "$SRC" -maxdepth 1 -type f -exec mv -f {} "$DST/" \;
    if [ -d "$SRC/documents" ]; then
      mkdir -p "$DST/documents"
      find "$SRC/documents" -mindepth 1 -maxdepth 1 -exec mv {} "$DST/documents/" \;
      rmdir "$SRC/documents" 2>/dev/null || true
    fi
    rmdir "$SRC" 2>/dev/null || true
    echo "📁 Relocated pipeline output → $DST (suffix applied for merge safety)"
  fi
fi

echo "📊 Analysis artifacts for $ARTICLE_DATE/$ANALYSIS_SUBFOLDER:"
ls -la "analysis/daily/$ARTICLE_DATE/$ANALYSIS_SUBFOLDER/" 2>/dev/null || echo "⚠️ No analysis output"
# Verify actual data was downloaded
MANIFEST_DOCS=0
MANIFEST_PATH="analysis/daily/$ARTICLE_DATE/$ANALYSIS_SUBFOLDER/data-download-manifest.md"
if [ -f "$MANIFEST_PATH" ]; then
  MANIFEST_DOCS=$(grep -E '^\*\*Documents Analyzed\*\*' "$MANIFEST_PATH" | sed -E 's/^\*\*Documents Analyzed\*\* *: *([0-9]+).*/\1/' || echo 0)
fi
[ -z "$MANIFEST_DOCS" ] && MANIFEST_DOCS=0
DATA_JSON_COUNT=$(find analysis/data/ -name "*.json" -type f 2>/dev/null | wc -l)
echo "📊 Documents in manifest: $MANIFEST_DOCS, JSON data files: $DATA_JSON_COUNT"
if [ "$MANIFEST_DOCS" -eq 0 ] && [ "$DATA_JSON_COUNT" -eq 0 ]; then
  echo "🚨 CRITICAL: Pipeline downloaded ZERO data. Agent MUST diagnose and fix — do NOT fabricate analysis."
fi
```

### 🔄 Data Lookback Fallback

> 🚨 **CRITICAL RULE**: Never produce empty/stub analysis. If no data for today, look back to find unanalyzed data.

```bash
# Idempotent: only set if not already resolved by lookback
if [ -z "${ARTICLE_DATE:-}" ]; then
  ARTICLE_DATE="${{ github.event.inputs.article_date }}"
  [ -z "$ARTICLE_DATE" ] && ARTICLE_DATE=$(date -u +%Y-%m-%d)
fi
ORIGINAL_ARTICLE_DATE="$ARTICLE_DATE"

# Check if the requested date has any analyzed documents (per-date, doc-type-scoped manifest only)
MANIFEST_PATH="analysis/daily/$ARTICLE_DATE/propositions/data-download-manifest.md"
DATE_DOCS_ANALYZED=0
if [ -f "$MANIFEST_PATH" ]; then
  DATE_DOCS_ANALYZED=$(grep -E '^\*\*Documents Analyzed\*\*' "$MANIFEST_PATH" | sed -E 's/^\*\*Documents Analyzed\*\* *: *([0-9]+).*/\1/' || echo 0)
fi
[ -z "$DATE_DOCS_ANALYZED" ] && DATE_DOCS_ANALYZED=0
echo "📄 Propositions analyzed for $ARTICLE_DATE: $DATE_DOCS_ANALYZED"

if [ "$DATE_DOCS_ANALYZED" -eq 0 ]; then
  echo "⚠️ No proposition data for $ARTICLE_DATE — activating lookback fallback (up to 7 days)"
  DATA_DATE=""
  for DAYS_BACK in 1 2 3 4 5 6 7; do
    # Cross-platform date arithmetic: GNU date (-d) on Linux/GitHub Actions, BSD date (-v) on macOS
    LOOKBACK_DATE=$(date -u -d "$ARTICLE_DATE - $DAYS_BACK days" +%Y-%m-%d 2>/dev/null || date -u -v-${DAYS_BACK}d -j -f "%Y-%m-%d" "$ARTICLE_DATE" +%Y-%m-%d 2>/dev/null)
    [ -z "$LOOKBACK_DATE" ] && continue
    echo "🔍 Checking $LOOKBACK_DATE for analyzed propositions..."
    # First, check if a manifest already exists with non-zero Documents Analyzed
    MANIFEST_PATH="analysis/daily/$LOOKBACK_DATE/propositions/data-download-manifest.md"
    DATE_DOCS_ANALYZED=0
    if [ -f "$MANIFEST_PATH" ]; then
      DATE_DOCS_ANALYZED=$(grep -E '^\*\*Documents Analyzed\*\*' "$MANIFEST_PATH" | sed -E 's/^\*\*Documents Analyzed\*\* *: *([0-9]+).*/\1/' || echo 0)
    fi
    [ -z "$DATE_DOCS_ANALYZED" ] && DATE_DOCS_ANALYZED=0
    if [ "$DATE_DOCS_ANALYZED" -gt 0 ]; then
      echo "✅ Found $DATE_DOCS_ANALYZED propositions already analyzed for $LOOKBACK_DATE"
      DATA_DATE="$LOOKBACK_DATE"
      break
    fi
    # No existing data — run pre-article analysis for this lookback date
    echo "ℹ️ No existing manifest data for $LOOKBACK_DATE — running pre-article analysis"
    source scripts/mcp-setup.sh && npx tsx scripts/pre-article-analysis.ts --date "$LOOKBACK_DATE" --limit 50 --doc-type propositions 2>/dev/null || true
    # Re-check manifest after running analysis
    MANIFEST_PATH="analysis/daily/$LOOKBACK_DATE/propositions/data-download-manifest.md"
    DATE_DOCS_ANALYZED=0
    if [ -f "$MANIFEST_PATH" ]; then
      DATE_DOCS_ANALYZED=$(grep -E '^\*\*Documents Analyzed\*\*' "$MANIFEST_PATH" | sed -E 's/^\*\*Documents Analyzed\*\* *: *([0-9]+).*/\1/' || echo 0)
    fi
    [ -z "$DATE_DOCS_ANALYZED" ] && DATE_DOCS_ANALYZED=0
    if [ "$DATE_DOCS_ANALYZED" -gt 0 ]; then
      echo "✅ Successfully analyzed $DATE_DOCS_ANALYZED propositions for $LOOKBACK_DATE"
      DATA_DATE="$LOOKBACK_DATE"
      break
    fi
  done
  # Lookback protection: copy analysis to today's directory instead of overwriting historical data
  if [ -n "$DATA_DATE" ] && [ "$DATA_DATE" != "$ORIGINAL_ARTICLE_DATE" ]; then
    SRC_DIR="analysis/daily/$DATA_DATE/propositions"
    DST_DIR="analysis/daily/$ORIGINAL_ARTICLE_DATE/propositions"
    if [ -d "$SRC_DIR" ]; then
      mkdir -p "$DST_DIR"
      cp -r "$SRC_DIR"/* "$DST_DIR/" 2>/dev/null || true
      echo "📁 Copied analysis from $DATA_DATE → $ORIGINAL_ARTICLE_DATE (preserving original at $DATA_DATE)"
    fi
    ARTICLE_DATE="$ORIGINAL_ARTICLE_DATE"
  elif [ -n "$DATA_DATE" ]; then
    ARTICLE_DATE="$DATA_DATE"
  fi
  echo "🗓️ Using analysis date: $ARTICLE_DATE (data sourced from: ${DATA_DATE:-$ARTICLE_DATE})"
  # Persist resolved ARTICLE_DATE for downstream steps
  if [ -n "${GITHUB_ENV:-}" ]; then
    echo "ARTICLE_DATE=$ARTICLE_DATE" >> "$GITHUB_ENV"
  fi
fi

# Report pending per-file analysis count for monitoring
PENDING=$(npx tsx scripts/catalog-downloaded-data.ts --pending-only --type propositions 2>/dev/null | jq '.pendingAnalysis // 0' 2>/dev/null || echo "0")
[ -z "$PENDING" ] && PENDING=0
echo "📊 Total pending proposition analysis files (all dates): $PENDING"
```

### Per-File AI Analysis Enhancement

> 🚨 **CRITICAL RULE:** You must **actually read the JSON data** in each file and base all analysis on real data found there. Every SWOT entry, risk score, and stakeholder assessment must cite specific data from the file (dok_id, vote counts, party names, reservation details). Generic or boilerplate analysis is a failure mode — see the "Concrete Example: What Good Analysis Looks Like" section in `analysis/methodologies/ai-driven-analysis-guide.md` for bad vs. good comparison.

After the script-based analysis, perform **AI-driven per-file analysis** for deeper intelligence:

1. Run `npx tsx scripts/catalog-downloaded-data.ts --pending-only` to list files needing analysis
2. **Read ALL methodology guides AND templates** (use `view` or `cat` to read each fully):
   - `analysis/methodologies/ai-driven-analysis-guide.md` — Master per-file analysis guide (includes bad/good examples)
   - `analysis/methodologies/political-swot-framework.md` — Evidence-based SWOT with confidence hierarchy
   - `analysis/methodologies/political-risk-methodology.md` — 5×5 Likelihood×Impact risk matrix
   - `analysis/methodologies/political-threat-framework.md` — Political Threat Taxonomy, Attack Trees, severity calibration
   - `analysis/methodologies/political-classification-guide.md` — Sensitivity and domain taxonomy
   - `analysis/methodologies/political-style-guide.md` — Writing standards and evidence density
   - `analysis/templates/per-file-political-intelligence.md` — Per-file output template
   - `analysis/templates/synthesis-summary.md` — Daily synthesis template
   - `analysis/templates/risk-assessment.md` — Risk assessment template
   - `analysis/templates/political-classification.md` — Classification template
   - `analysis/templates/threat-analysis.md` — Threat template
   - `analysis/templates/swot-analysis.md` — SWOT template
   - `analysis/templates/stakeholder-impact.md` — Stakeholder template
   - `analysis/templates/significance-scoring.md` — Significance template
3. For each pending file:
   a. **Read** the JSON data file — use `view` or `cat` to read the actual content
   b. **Extract** key fields (dok_id, titel, datum, organ, rm, undertitel, etc.)
   c. **Classify** — Sensitivity level, domain, urgency, significance (0–10)
   d. **SWOT** — Government + Opposition impact with evidence (cite specific dok_id)
   e. **Risk** — 5×5 Likelihood×Impact matrix with numeric scores
   f. **Political Threat Taxonomy** — 6 democratic function threat categories (only where applicable — cite evidence)
   g. **Stakeholders** — 6-lens impact matrix
   h. **Forward indicators** — Specific watch items with concrete timelines
   i. **Mermaid diagrams** — At least 1 diagram with REAL data from the file (not placeholder text)
   j. **Write** `{id}.analysis.md` alongside the data file
4. Quality gate: ≥3 evidence points, confidence labels, no `[REQUIRED]` placeholders remaining

The analysis pipeline outputs the following artifacts per doc-type run:
- `data-download-manifest.md` — Download metadata and document counts
- `classification-results.md` — Document classification and priority levels
- `risk-assessment.md` — Political risk assessment (coalition stability, anomaly detection)
- `swot-analysis.md` — SWOT analysis (pre-computed for article enrichment)
- `threat-analysis.md` — Threat indicators and democratic health
- `stakeholder-perspectives.md` — Multi-perspective analysis (6 lenses)
- `significance-scoring.md` — Significance scores and urgency levels
- `cross-reference-map.md` — Cross-document reference links
- `synthesis-summary.md` — Combined analysis summary with confidence level
- `documents/*.json` — Raw downloaded documents (one per document)
- `documents/*-analysis.md` — Per-document analysis with SWOT, stakeholder perspectives, and significance scoring

These files are committed alongside articles for human review and continuous improvement.

### 🔴 MANDATORY: Batch Analysis Enrichment (Prevents Empty "0 Documents Analyzed" Files)

> **Root Cause**: The `pre-article-analysis.ts` script filters documents by exact date match. When no propositions are published on the exact analysis date, batch files report "0 documents analyzed" — this violates `ai-driven-analysis-guide.md` quality requirements.

**After per-file analysis, check if batch files are empty and enrich them:**

1. Check `synthesis-summary.md` — if it reports "0 documents analyzed" but per-document analyses exist in `documents/`, aggregate the per-doc findings into all 9 batch files
2. If NO per-doc analyses exist AND batch files show "0 documents analyzed", use MCP `get_propositioner(rm="2025/26", limit=20)` directly to find recent propositions and create meaningful analysis
3. Each enriched batch file MUST include: ≥1 Mermaid diagram, structured tables, evidence citations, confidence labels
4. **NEVER commit batch files that report "0 documents analyzed" when analysis data is available**
5. See `ai-driven-analysis-guide.md` "Deep-Inspection Batch Analysis Enrichment Protocol (v4.1)" for full requirements

### 📋 Rewrite Daily Synthesis Files to Follow Templates

> 🚨 **CRITICAL**: Script-generated stubs do NOT follow template structure. Rewrite each daily file to match its `analysis/templates/` counterpart. Read each template with `cat` before rewriting. Every file needs: metadata header (ID, date, riksmöte, confidence), ≥1 color-coded Mermaid diagram, evidence tables with dok_id citations, and no `[REQUIRED]` placeholders.

### 🚨 MANDATORY: Analysis Artifacts Must ALWAYS Be Committed

**Before deciding whether to generate articles or call noop, you MUST:**

1. **Review the analysis artifacts** in `analysis/daily/YYYY-MM-DD/propositions/` — read `synthesis-summary.md` and `significance-scoring.md` to understand what was found
2. **Summarize the analysis findings** — note how many documents were downloaded, their significance scores, key themes, and risk levels
3. **ALWAYS commit analysis artifacts** regardless of whether articles will be generated:

```bash
# Idempotent: only set if not already resolved by lookback
if [ -z "${ARTICLE_DATE:-}" ]; then
  ARTICLE_DATE="${{ github.event.inputs.article_date }}"
  [ -z "$ARTICLE_DATE" ] && ARTICLE_DATE=$(date -u +%Y-%m-%d)
fi
ANALYSIS_DIR="analysis/daily/$ARTICLE_DATE/propositions"
ANALYSIS_COUNT=0
if [ -d "$ANALYSIS_DIR" ]; then
  ANALYSIS_COUNT=$(find "$ANALYSIS_DIR" -type f | wc -l)
fi
if [ "$ANALYSIS_COUNT" -gt 0 ]; then
  echo "📊 Found $ANALYSIS_COUNT analysis artifacts in $ANALYSIS_DIR — these MUST be committed (do NOT use safeoutputs___noop)"
else
  echo "📊 Found 0 analysis artifacts — safeoutputs___noop is allowed (no files to commit)"
fi
```

> **🚨 CRITICAL RULE: Never call `safeoutputs___noop` if analysis artifacts exist.** If the pre-article analysis pipeline produced ANY output files, you MUST commit them via `safeoutputs___create_pull_request` — even if no articles are generated. Use an analysis-only PR with title: `📊 Analysis Only - Propositions - {date}` and label `analysis-only`. Only use `safeoutputs___noop` if the analysis pipeline produced ZERO output files (truly nothing to analyze).

### Step 3: Generate Articles

```bash
# Set LANGUAGES_INPUT to the value shown in Workflow Dispatch Parameters above
LANGUAGES_INPUT="<value from Workflow Dispatch Parameters>"
[ -z "$LANGUAGES_INPUT" ] && LANGUAGES_INPUT="all"

case "$LANGUAGES_INPUT" in
  "nordic") LANG_ARG="en,sv,da,no,fi" ;;
  "eu-core") LANG_ARG="en,sv,de,fr,es,nl" ;;
  "all") LANG_ARG="en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh" ;;
  *) LANG_ARG="$LANGUAGES_INPUT" ;;
esac

source scripts/mcp-setup.sh && npx tsx scripts/generate-news-enhanced.ts \
  --types=propositions \
  --languages="$LANG_ARG" \
  --skip-existing
```

**Article Navigation Verification**: The `generate-news-enhanced.ts` script automatically includes all required navigation elements:
- **Language switcher** (`<nav class="language-switcher">`) after `<body>` with all 14 languages
- **Back-to-news top nav** (`<div class="article-top-nav">`) with localized back link after language switcher
- **Footer back-to-news link** in `<footer class="article-footer">`

These elements are validated by `bash scripts/validate-news-generation.sh` (Checks 8–10). The fix script is a **fallback only** — do not run it by default:
```bash
# FALLBACK ONLY — use if validate-news-generation.sh reports missing navigation elements
npx tsx scripts/fix-article-navigation.ts
```

### Step 3b: AI Title, Meta Description & Analysis References (v5.0 — Analysis-Driven)

> 🚨 **MANDATORY** — After article HTML is generated, the AI MUST read the completed synthesis-summary.md and use its "AI-Recommended Article Metadata" section to drive title, description, and SEO. See `SHARED_PROMPT_PATTERNS.md` §"AI-DRIVEN TITLE & META DESCRIPTION GENERATION" and `ai-driven-analysis-guide.md` §"Analysis-Driven Article Decision Protocol (v5.0)".

**1. Read synthesis analysis first** — `cat "analysis/daily/$ARTICLE_DATE/$ANALYSIS_SUBFOLDER/synthesis-summary.md"` and extract:
   - "Recommended Title (EN)" and "Recommended Title (SV)" — use as starting point
   - "Meta Description (EN)" and "Meta Description (SV)" — use as starting point
   - "Key Highlights" — verify title references at least one highlight
   - "Article Decision" and "Article Priority" — validate publication decision

**2. Generate newsworthy titles from analysis** — Read each article's content AND the synthesis findings, then generate a title following: `[Active Verb] + [Specific Actor/Institution] + [Concrete Policy Action]`. The title MUST reference findings from the synthesis — not generic category labels. Apply to ALL languages (not just English). BANNED: ❌ "Government Propositions: Policy Priorities This Week: Defense in Focus" or any title ending with ": {Topic} in Focus".

**3. Generate AI meta descriptions from analysis** (150-160 chars) — Summarize the #1 ranked finding from synthesis significance-scoring. BANNED: ❌ "Analysis of N documents covering Published:, Why It Matters:" or any description starting with "Analysis of N documents".

**4. Add analysis references section** — Insert the "📊 Analysis & Sources" HTML block (from SHARED_PROMPT_PATTERNS.md) before the article footer, linking to:
- `analysis/daily/$ARTICLE_DATE/propositions/synthesis-summary.md`
- `analysis/daily/$ARTICLE_DATE/propositions/swot-analysis.md`
- `analysis/daily/$ARTICLE_DATE/propositions/risk-assessment.md`
- `analysis/daily/$ARTICLE_DATE/propositions/threat-analysis.md`
- `analysis/daily/$ARTICLE_DATE/propositions/stakeholder-perspectives.md`
- `analysis/daily/$ARTICLE_DATE/propositions/significance-scoring.md`
- `analysis/daily/$ARTICLE_DATE/propositions/classification-results.md`
- `analysis/methodologies/ai-driven-analysis-guide.md`
- Per-document analyses in `documents/` subfolder

**5. Update all metadata in ALL languages** — For EVERY generated language file, ensure `<title>`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">`, `<h1>`, Schema.org `headline`, `alternativeHeadline`, and `description` all reflect the AI-generated title and description. Non-English articles MUST have properly translated AI titles — not English titles or generic templates.

### Step 3c: AI Content Quality Enforcement (v4.0 — MANDATORY)

> 🚨 **v4.0 CRITICAL**: The AI MUST read pre-computed analysis and rewrite ALL script-generated stub content. See `SHARED_PROMPT_PATTERNS.md` §"AI ARTICLE CONTENT GENERATION" and `ai-driven-analysis-guide.md` v4.0.

**1. Read pre-computed analysis** — Read synthesis, SWOT, risk, and stakeholder analysis from `analysis/daily/$ARTICLE_DATE/propositions/`.

**2. Replace script-generated lede** — Replace any `"Analysis of N documents..."` placeholder with AI lede naming specific propositions, ministers, and political significance.

**3. Replace boilerplate "Why It Matters"** — For EACH proposition, write unique analysis citing the proposition number (e.g., Prop. 2025/26:235), specific policy changes, budget impact (SEK amounts), and affected populations. BANNED: `"Touches on {X} policy..."` boilerplate.

**4. Replace generic "Winners & Losers"** — Replace `"The political landscape remains fluid..."` with specific analysis naming government ministers who tabled the propositions and opposition parties likely to challenge them.

**5. Replace excuse-as-analysis** — Replace `"No chamber debate data..."` with analysis of the proposition text itself or debate data from MCP `search_anforanden`.

**6. Handle empty analysis** — If synthesis reports "0 documents analyzed", use MCP `get_propositioner(rm="2025/26")` directly. NEVER publish with "0 documents analyzed" as content.

**7. Add Strategic Context** — Explain whether propositions represent coordinated government offensive (pre-election legislative push) or routine business. Cross-reference with committee reports and motions from the same date.

### Step 4: Translate, Validate & Verify Analysis Quality

Run validation and HTMLHint before creating PR:
```bash
bash scripts/validate-news-generation.sh
VALIDATION_EXIT=$?
if [ "$VALIDATION_EXIT" -ne 0 ]; then
  echo "❌ News generation validation failed. Fix the reported issues before creating a PR."
  exit "$VALIDATION_EXIT"
fi

# HTMLHint validation with auto-fix for common nesting errors
NEWS_FILES=$(find news -maxdepth 1 -name '*-*.html' | wc -l)
if [ "$NEWS_FILES" -gt 0 ]; then
  if ! npx htmlhint "news/*-*.html" 2>/dev/null; then
    echo "⚠️ HTML validation errors found, attempting auto-fix..."
    npx tsx scripts/article-quality-enhancer.ts --fix
    if ! npx htmlhint "news/*-*.html"; then
      echo "❌ HTML validation failed after auto-fix. Please resolve remaining HTMLHint errors before creating a PR."
      exit 1
    fi
  fi
fi
```

Translate all Swedish content, regenerate indexes, validate, then create PR.

**CRITICAL: Each article MUST contain real analysis, not just a list of translated links.**
Every generated article must include:
- An analytical lede paragraph about the government's legislative strategy (not just a document count)
- Legislative Pipeline section explaining where each proposition sits in the process
- "Why It Matters" analysis for each proposition with policy domain context
- Policy Implications section assessing the government's legislative ambition
- Committee referral analysis showing which policy areas are affected

If the generated article lacks these analytical sections, manually add contextual analysis before committing.

## MANDATORY Quality Validation

After article generation, verify EACH article meets these minimum standards before committing.
Apply the quality rubric from **`scripts/prompts/v2/quality-criteria.md`** (minimum score: 7/10).
- **`scripts/prompts/v2/per-file-intelligence-analysis.md`** — Per-file AI analysis protocol
- **`analysis/methodologies/ai-driven-analysis-guide.md`** — Methodology for deep per-file analysis
- **`analysis/templates/per-file-political-intelligence.md`** — Per-file analysis output template

### Iterative Analysis Protocol

For each generated article, apply up to 3 iterations:
1. **Iteration 1** — Generate initial draft from MCP data
2. **Self-assess** — Score against quality rubric (Accuracy + Depth + Perspectives + Translation + Editorial)
3. **If score < 7**: Identify lowest-scoring dimension and regenerate those sections
4. **Iteration 2** — Address quality gaps, add budget/fiscal impact estimation
5. **If still < 7**: Final iteration — add coalition analysis and legislative timeline
6. **Maximum 3 iterations** — Never publish below 5/10

### Required Sections (at least 3 of 5):
1. **Analytical Lede** (paragraph, not just document count)
2. **Thematic Analysis** (documents grouped by policy theme)
3. **Strategic Context** (why these documents matter politically)
4. **Stakeholder Impact** (who benefits, who loses)
5. **What Happens Next** (expected timeline and outcomes)

### Disqualifying Patterns:
- ❌ `"Filed by: Unknown (Unknown)"` — FIX author/party metadata before committing
- ❌ `data-translate="true"` spans in non-Swedish articles — TRANSLATE before committing
- ❌ Identical "Why It Matters" text for all entries — DIFFERENTIATE analysis per proposition
- ❌ Flat list of propositions without grouping — GROUP by policy theme or ministry
- ❌ Article under 500 words — EXPAND with analytical sections

### Playwright Visual Validation
Run Playwright validation before creating the PR:
```bash
# HTMLHint validation
npx htmlhint "news/*-government-propositions-*.html"

# Playwright visual validation (accessibility, RTL, responsive)
npx tsx scripts/validate-articles-playwright.ts --filter "government-propositions"

# Validate JSON-LD cross-references
npx tsx scripts/validate-cross-references.ts news/*-government-propositions-*.html
```

### Bash Validation Commands:
```bash
# Check for unknown authors (should return 0)
grep -l "Filed by: Unknown" news/*-government-propositions-*.html 2>/dev/null | wc -l || true

# Check for untranslated spans in English article (should return 0)
grep -c 'data-translate="true"' "news/$(date +%Y-%m-%d)-government-propositions-en.html" 2>/dev/null || true

# Check word count of English article text content (warn if < 500; HTML tags stripped)
FILE="news/$(date +%Y-%m-%d)-government-propositions-en.html"
if [ ! -f "$FILE" ]; then echo "WARNING: Expected article file not found: $FILE — check if generation succeeded"; else
  WORD_COUNT="$(sed 's/<[^>]*>/ /g' "$FILE" | tr -s '[:space:]' '\n' | grep -c '[[:alnum:]]' 2>/dev/null || echo 0)"
  echo "Content word count (HTML tags stripped): $WORD_COUNT"
  if [ "$WORD_COUNT" -lt 500 ]; then echo "WARNING: Article content may be too short ($WORD_COUNT words) — consider expanding before PR"; fi
fi

# Check for duplicate "Why It Matters" content (should return empty)
grep -o 'Why It Matters[^<]*' "news/$(date +%Y-%m-%d)-government-propositions-en.html" 2>/dev/null | sort | uniq -d || true
```

### If Article Fails Quality Check:
1. Use bash to enhance the HTML with analytical sections
2. Replace generic "Why It Matters" with proposition-specific analysis
3. Add thematic grouping headers (e.g., by ministry or policy area)
4. Translate any remaining Swedish content

**Note**: For shared rules on news index files, metadata, sitemap generation, and what to commit, see the canonical guidance in `news-article-generator.md`.

## 🌐 MANDATORY Translation Quality Rules

> **📋 Canonical translation rules are maintained in `news-translate.md`.**

For EN/SV articles generated by this workflow, ensure:
1. **ALL section headings** and body content in the correct language (EN or SV)
2. **Meta keywords** in the article language
3. **No untranslated data-translate spans** in final output
4. Swedish API titles translated to article language

When the `news-translate` workflow handles remaining 12 languages, it applies the full translation quality rules including RTL support (ar, he), CJK native script (ja, ko, zh), Nordic parliamentary terms (da, no, fi), and European formal register (de, fr, es, nl). See `news-translate.md` for comprehensive per-language requirements.
## Article Naming Convention
Files: `YYYY-MM-DD-government-propositions-{lang}.html`