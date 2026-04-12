---
name: "News: Month Ahead"
description: Generates month-ahead strategic outlook articles in core languages (EN, SV). Translations handled by news-translate workflow. Runs on 1st of each month.
strict: false
on:
  schedule:
    - cron: "0 8 1 * *"
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

timeout-minutes: 30

concurrency:
  group: gh-aw-news-month-ahead-${{ inputs.article_date || 'today' }}
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

# 📅 Month Ahead Strategic Outlook Generator

You are the **News Journalist Agent** for Riksdagsmonitor generating **month-ahead** strategic outlook articles.

## 🔧 Workflow Dispatch Parameters

- **force_generation** = `${{ github.event.inputs.force_generation }}`
- **languages** = `${{ github.event.inputs.languages }}`
- **analysis_depth** = `${{ github.event.inputs.analysis_depth }}`

If **force_generation** is `true`, generate articles even if recent ones exist. Use the **languages** value to determine which languages to generate.

## 🚨 CRITICAL: Single Article Type Focus

**This workflow generates ONLY `month-ahead` articles.** Do not generate other article types.

This is a **prospective** article providing a 30-day forward-looking strategic overview of upcoming parliamentary activity, scheduled votes, committee milestones, and government calendar events.

## 🧠 Repo Memory

Uses `memory/news-generation` branch. START: read `memory/news-generation/last-run-news-month-ahead.json` + `memory/news-generation/covered-documents/{YYYY-MM-DD}.json`. END: update both + `memory/news-generation/translation-status.json`. Skip already-covered dok_ids.

## ⏱️ Time Budget (30 minutes)
- **Minutes 0–3**: Date check, MCP warm-up with `get_sync_status()`
- **Minutes 3–5**: Run pre-article-analysis pipeline (download data)
- **Minutes 5–15**: 🚨 **AI Analysis (10 min minimum)**: Read methodology guides + templates. Create analysis with color-coded Mermaid diagrams and evidence tables. Run quality gate bash check.
- **Minutes 15–18**: Query calendar events for next 30 days
- **Minutes 18–25**: Generate articles for all 14 languages
- **Minutes 25–28**: Validate and commit analysis + articles
- **Minutes 28–30**: Create PR with `safeoutputs___create_pull_request`

> ⚠️ **Analysis must include color-coded Mermaid diagrams, evidence tables, and template structure compliance** — plain prose is NEVER acceptable.

## ⚠️ CRITICAL: Bash Tool Call Format

> **Full reference:** See `SHARED_PROMPT_PATTERNS.md` → "Bash Tool Call Format". Key rule: every `bash` call MUST have both `command` AND `description` parameters. Example: `bash({ command: "date -u '+%Y-%m-%d'", description: "Get current UTC date" })`

## 🛡️ AWF Shell Safety

> **Full reference:** See `SHARED_PROMPT_PATTERNS.md` → "AWF Shell Safety". Summary: use `$VAR` not `$`+`{VAR}`, use `find -exec` not `$(...)`, set defaults with `if/then` before using `$VAR`.

## 🔤 UTF-8 Encoding

> **Full reference:** See `SHARED_PROMPT_PATTERNS.md` → "UTF-8 Encoding". Summary: use native UTF-8 (`ö`, `ä`, `å`) — NEVER HTML entities (`&#246;`, `&#228;`). Author: `James Pether Sörling`.


## Required Skills

Consult as needed — do NOT read all files upfront:
- **Skills:** `.github/skills/editorial-standards/SKILL.md`, `.github/skills/swedish-political-system/SKILL.md`, `.github/skills/legislative-monitoring/SKILL.md`, `.github/skills/riksdag-regering-mcp/SKILL.md`, `.github/skills/language-expertise/SKILL.md`, `.github/skills/gh-aw-safe-outputs/SKILL.md`
- **Analysis:** `scripts/prompts/v2/political-analysis.md`, `per-file-intelligence-analysis.md`, `stakeholder-perspectives.md`, `quality-criteria.md`
- **Methodology:** `analysis/methodologies/ai-driven-analysis-guide.md` (v5.0) + `analysis/templates/per-file-political-intelligence.md`

## 📊 MANDATORY Multi-Step AI Analysis Framework

### Article Type Isolation

> 🚨 **This workflow writes analysis ONLY to `analysis/daily/$ARTICLE_DATE/month-ahead/`**. NEVER write to the parent date directory or another article type's folder. See SHARED_PROMPT_PATTERNS.md "Article Type Isolation" section.

### Standardised Analysis Depth Gate

> ⚠️ **Default is `deep`** — not `standard`. Analysis must always produce publication-quality output with Mermaid diagrams and evidence tables.

| Depth | AI iterations | SWOT stakeholders | Charts | Mindmap | Mermaid diagrams | Risk matrix (L×I) | Forward indicators | Min. analysis time |
|-------|--------------|-------------------|--------|---------|-----------------|-------------------|-------------------|-------------------|
| standard | 1-2 | ≥5 (of 8 groups) | ≥1 | optional | ≥1 color-coded | ≥2 risks scored | ≥2 with triggers | 10 minutes |
| deep | 2-3 | ≥7 (of 8 groups) | ≥2 | required | ≥2 color-coded | ≥4 risks scored | ≥3 with triggers | 15 minutes |
| comprehensive | 3+ | all 8 groups | ≥3 | required | ≥3 color-coded | ≥6 risks scored | ≥5 with triggers | 20 minutes |

**The 8 mandatory stakeholder groups are**: Citizens, Government Coalition, Opposition Bloc, Business/Industry, Civil Society, International/EU, Judiciary/Constitutional, Media/Public Opinion. Every group MUST be analyzed with specific evidence (dok_id, vote counts, named politicians).

**Minimum requirement for ALL depths**: Every analysis file must contain at least 1 color-coded Mermaid diagram, structured evidence tables with dok_id citations, quantified risk matrix with numeric L×I scores, forward indicators with specific triggers/timelines, confidence labels on all analytical claims, and follow the corresponding template structure exactly. Plain prose without tables/diagrams is NEVER acceptable regardless of depth level.

> **Read `analysis_depth` input first** (default: `deep`). This controls iteration count and section requirements.

Based on the editorial profile for `month-ahead` (from `scripts/editorial-framework.ts`):
- **SWOT**: ALL 8 stakeholder groups analyzed with forward-looking evidence (scheduled debates, committee meetings, expected votes)
- **Dashboard**: required (min. 2 Chart.js charts)
- **Mindmap**: required (CSS policy mindmap)
- **Min. stakeholders**: 8 perspectives (Citizens, Government Coalition, Opposition Bloc, Business/Industry, Civil Society, International/EU, Judiciary/Constitutional, Media/Public Opinion)
- **Risk Matrix**: required — numeric L×I scores for upcoming legislative risks, coalition stress points, policy implementation risks
- **Forward Indicators**: required — specific dates for committee sessions, plenary debates, expected government decisions
- **Confidence Labels**: `[HIGH]`/`[MEDIUM]`/`[LOW]` on ALL analytical claims
- **Mermaid Diagrams**: ≥1 color-coded Gantt chart or legislative pipeline showing monthly agenda flow
- **Cross-Document Pattern Analysis**: required — identify thematic clusters (e.g., "3 defense-related meetings indicate coordinated legislative push")
- **AI iterations**: 2 (standard), 2 (deep), or 3 (comprehensive)

> 🚨 **ANTI-PATTERNS (REJECTED)**: Generic "Requires committee review and chamber debate" (must be unique per entry), SWOT with only 3 groups, no forward date-specific indicators, no Mermaid diagrams, no cross-document synthesis

### 🗳️ Election 2026 Lens (Mandatory — v5.0)

Every analysis MUST include an **Election 2026 Implications** section assessing: Electoral Impact, Coalition Scenarios, Voter Salience, Campaign Vulnerability, and Policy Legacy. Use the **5-level confidence scale** (⬛VERY LOW → 🟥LOW → 🟧MEDIUM → 🟩HIGH → 🟦VERY HIGH). See `analysis/methodologies/ai-driven-analysis-guide.md` v5.0 for full criteria.

### Phase 1 — Data Collection & Initial Analysis
1. Fetch MCP data (`get_calendar_events`, `get_propositioner`, `get_motioner`, `get_interpellationer`, `get_sync_status`)
2. Build monthly legislative pipeline with key milestones
3. Build initial outline: strategic outlook lede, legislative pipeline, policy domain forecast

### Phase 2 — Iterative Depth Enhancement (repeat per `analysis_depth`)
For each AI iteration:
1. **Full SWOT Analysis**: Generate multi-stakeholder SWOT with ALL 8 groups (Citizens, Government Coalition, Opposition Bloc, Business/Industry, Civil Society, International/EU, Judiciary/Constitutional, Media/Public Opinion) focusing on upcoming legislative priorities. Use structured evidence tables with columns: `#`, `Statement`, `Evidence (dok_id)`, `Confidence`, `Impact`, `Entry Date`. Every entry MUST cite specific scheduled debate, committee meeting, or expected vote.
2. **Strategic Dashboard Summary**: Provide concise comparative summaries for at least 2 analytical views (for example, documents by week and policy domain distribution) using prose and/or markdown tables that can be included directly in the article without requiring any undocumented rendering pipeline.
3. **Policy Relationship Outline**: Describe inter-connected policy areas as a clear hierarchical outline (central topic, major branches, and sub-items) in standard markdown so the relationships are explicit without assuming automated mindmap rendering.
4. **Quality Gate** (check before next iteration):
   - Verify forward-looking watch-points reference specific scheduled events
   - Verify all Swedish API text is translated
   - Verify word count ≥ 900

### Phase 3 — Final Quality Gate Before PR
Run all validation checks from the **MANDATORY Quality Validation** section below before committing.

## MANDATORY Date Validation

```bash
echo "=== Date Validation Check ==="
date -u "+Current UTC: %A %Y-%m-%d %H:%M:%S"
echo "Article Type: month-ahead"
echo "============================"
```

## 📅 Riksmöte (Parliamentary Session) Calculation

September+ → `rm = "{year}/{year+1 2-digit}"` (e.g. Oct 2026 → `2026/27`). Before September → `rm = "{year-1}/{year 2-digit}"` (e.g. Feb 2026 → `2025/26`). Use in ALL MCP queries requiring `rm`.

## MANDATORY Deduplication Check

Before generating articles, check if articles already exist for the target date. **This check controls article GENERATION only — the deep political analysis phase ALWAYS runs regardless.**
```bash
# Resolve article date: use workflow_dispatch input when provided, fallback to UTC today
ARTICLE_DATE="${{ github.event.inputs.article_date }}"
if [ -z "$ARTICLE_DATE" ]; then
  ARTICLE_DATE=$(date -u +%Y-%m-%d)
fi
ARTICLE_TYPE="month-ahead"
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

1. Call `get_sync_status({})` — retry up to 3× (30s wait between each)
2. After 3 failures → `safeoutputs___noop({"message": "MCP server unavailable after 3 attempts"})`
3. **ALL content MUST come from live MCP data.** Never use cached articles, stale data, or AI-fabricated content.

## 🛡️ File Ownership Contract

Content workflows: only create/modify **EN and SV** files (`news/YYYY-MM-DD-*-en.html`, `*-sv.html`). Validate with `npx tsx scripts/validate-file-ownership.ts content`. Fix violations: `git restore --staged --worktree -- <file>` (tracked) or `rm <file>` (untracked).

### Branch Naming Convention

Branch: `news/content/{YYYY-MM-DD}/{article-type}` (e.g. `news/content/2026-03-23/month-ahead`). `safeoutputs___create_pull_request` handles this automatically.

## MANDATORY PR Creation

> **🚀 HOW SAFE PR CREATION WORKS — READ THIS FIRST**
>
> The `safeoutputs___create_pull_request` tool handles **everything**: branch creation, pushing commits, and opening the PR. Do NOT run `git push` or `git checkout -b` manually.
>
> **Exact steps:**
> 1. Write article files to `news/` using `bash` or `edit` tools
> 2. Stage and commit locally (scoped to resolved month-ahead analysis subfolder): `git add news/*month-ahead*.html news/metadata/ "analysis/daily/$ARTICLE_DATE/$ANALYSIS_SUBFOLDER/" analysis/weekly/ && git commit -m "Add month-ahead articles and analysis artifacts"`
> 3. Call `safeoutputs___create_pull_request` with `title`, `body`, and `labels`
>
- ✅ `safeoutputs___create_pull_request` for articles or analysis-only PRs
- ✅ `safeoutputs___noop` ONLY if MCP unreachable after 3 attempts AND no analysis artifacts exist
- ❌ NEVER noop because articles already exist — analysis always runs
- ❌ Safe output tools are in your tool list — NEVER search for them via bash

## 🌐 Dispatch Translation Workflow

After creating the content PR, dispatch translations: `safeoutputs___dispatch_workflow({ "workflow_name": "news-translate", "inputs": { "article_date": "<YYYY-MM-DD>", "article_type": "<article-type>", "languages": "all-extra" } })`. See `news-translate.md` for full translation quality rules.

## MCP Tools

**ALWAYS call `get_sync_status()` FIRST.**

**Primary tool:** `get_calendar_events` — 30-day forward calendar (**⚠️ Known issue: may return HTML instead of JSON; if this happens, treat it as a calendar retrieval failure and state that explicitly in the analysis. You may query `search_dokument` with a recent lookback window only as a proxy signal of parliamentary activity (e.g., recent publications related to expected topics), but must never treat "no documents found" as "no upcoming events."**)
**Cross-reference:** `get_propositioner`, `search_dokument`, `search_regering`
**Statistical enrichment:** SCB/World Bank — for major economic milestones (budget debates, economic policy events), pre-fetch trend data from committee-mapped indicators. See `scripts/scb-context.ts` for 15 domain→committee mappings. **World Bank indicators (144 total)**: `view analysis/worldbank/indicators-inventory.json` for the complete inventory with `policyAreas`, `committees`, and `mcpTool` fields per indicator. Use MCP tools for indicators with `mcpTool` field. See `SHARED_PROMPT_PATTERNS.md` §"WORLD BANK ECONOMIC CONTEXT INTEGRATION" for Chart.js chart templates (`economic-comparison`, `economic-trend`, `nordic-radar`). MUST generate ≥2 economic charts for monthly forecasting.

```javascript
get_sync_status({})
// Get events for next 30 days
const today = new Date().toISOString().split('T')[0];
const nextMonth = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];
get_calendar_events({ from: today, tom: nextMonth, limit: 200 })
get_propositioner({ rm: <calculated riksmöte>, limit: 20 })
search_regering({ dateFrom: today, dateTo: nextMonth, limit: 10 })
```

## Generation Steps

### Step 1: Check Existing Articles (Analysis Always Runs)
Check if month-ahead articles already exist for the target date. If they do, skip article generation but **ALWAYS run the full deep political analysis phase** — analysis is the primary output and must execute on every run regardless of article existence.

### Step 2: Query MCP
```javascript
get_sync_status({})
get_calendar_events({ from: today, tom: nextMonth, limit: 200 })
```

### Step 2.5: Run Pre-Article Analysis Pipeline

**CRITICAL: Run the analysis pipeline BEFORE article generation.** This downloads data, runs all 9 analysis steps, and writes structured artifacts to `analysis/daily/YYYY-MM-DD/`. Article generators will consume these for enrichment.

```bash
ARTICLE_DATE=$(date -u +%Y-%m-%d)
echo "📊 Running pre-article analysis for $ARTICLE_DATE..."
# CRITICAL: Source mcp-setup.sh FIRST to set MCP_SERVER_URL and MCP_AUTH_TOKEN for the gateway
source scripts/mcp-setup.sh && npx tsx scripts/pre-article-analysis.ts --date "$ARTICLE_DATE" --limit 50 2>&1 | tee /tmp/pipeline-output.log
PIPE_EXIT=${PIPESTATUS[0]}
if [ "$PIPE_EXIT" -ne 0 ]; then
  echo "❌ Pipeline failed — agent MUST diagnose and fix (read /tmp/pipeline-output.log)"
  tail -20 /tmp/pipeline-output.log
fi
echo "📊 Analysis artifacts for $ARTICLE_DATE:"
ls -la "analysis/daily/$ARTICLE_DATE/" 2>/dev/null || echo "⚠️ No analysis output"
DATA_JSON_COUNT=$(find analysis/data/ -name "*.json" -type f 2>/dev/null | wc -l)
echo "📊 JSON data files: $DATA_JSON_COUNT (must be > 0)"
# Relocate pipeline artifacts: pre-article-analysis.ts writes to analysis/daily/$DATE/ (unscoped)
# but this workflow needs them under analysis/daily/$DATE/month-ahead/
# === Run Suffix Resolution (see SHARED_PROMPT_PATTERNS.md) ===
BASE_SUBFOLDER="month-ahead"
ANALYSIS_SUBFOLDER="$BASE_SUBFOLDER"
if [ "${FORCE_GENERATION:-false}" != "true" ]; then
  _SUFFIX=1
  while [ -f "analysis/daily/$ARTICLE_DATE/$ANALYSIS_SUBFOLDER/synthesis-summary.md" ]; do
    _SUFFIX=$((_SUFFIX + 1))
    ANALYSIS_SUBFOLDER="${BASE_SUBFOLDER}-${_SUFFIX}"
  done
fi
echo "📁 Analysis subfolder resolved: $ANALYSIS_SUBFOLDER"
UNSCOPED_DIR="analysis/daily/$ARTICLE_DATE"
SCOPED_DIR="$UNSCOPED_DIR/$ANALYSIS_SUBFOLDER"
if [ -d "$UNSCOPED_DIR" ]; then
  mkdir -p "$SCOPED_DIR"
  if find "$UNSCOPED_DIR" -maxdepth 1 -type f -name "*.md" | grep -q .; then
    find "$UNSCOPED_DIR" -maxdepth 1 -type f -name "*.md" -exec mv -f {} "$SCOPED_DIR/" \;
    echo "📁 Moved pipeline *.md artifacts → $SCOPED_DIR (root cleaned to prevent merge conflicts)"
  fi
  if [ -d "$UNSCOPED_DIR/documents" ]; then
    mkdir -p "$SCOPED_DIR/documents"
    find "$UNSCOPED_DIR/documents" -mindepth 1 -maxdepth 1 -exec mv {} "$SCOPED_DIR/documents/" \;
    rmdir "$UNSCOPED_DIR/documents" 2>/dev/null || true
    echo "📁 Relocated pipeline documents/ contents → $SCOPED_DIR/documents"
  fi
fi
if [ "$DATA_JSON_COUNT" -eq 0 ]; then
  echo "🚨 CRITICAL: Pipeline downloaded ZERO data. Agent MUST diagnose and fix — do NOT fabricate analysis."
fi
```

**Weekly aggregation**: Since this is a monthly-scope workflow, also aggregate the current week's daily analyses for complete context:

```bash
WEEK_LABEL=$(date -u +%G-W%V)
echo "📅 Running weekly aggregation for $WEEK_LABEL..."
source scripts/mcp-setup.sh && npx tsx scripts/pre-article-analysis.ts --aggregate weekly --date "$WEEK_LABEL" || echo "⚠️ Weekly aggregation failed (non-blocking)"
ls -la "analysis/weekly/$WEEK_LABEL/" 2>/dev/null || echo "⚠️ No weekly aggregation output"
```

These files are committed alongside articles for human review and continuous improvement.

### 🚨 MANDATORY: Analysis Artifacts Must ALWAYS Be Committed

**Before deciding whether to generate articles or call noop, you MUST:**

1. **Review the analysis artifacts** in `analysis/daily/YYYY-MM-DD/` and `analysis/weekly/` — read `synthesis-summary.md` and `significance-scoring.md` to understand what was found
2. **Summarize the analysis findings** — note how many documents were downloaded, their significance scores, key themes, and risk levels
3. **ALWAYS commit analysis artifacts** regardless of whether articles will be generated:

```bash
ARTICLE_DATE=$(date -u +%Y-%m-%d)
ANALYSIS_DIR="analysis/daily/$ARTICLE_DATE/month-ahead"
ANALYSIS_COUNT=0
if [ -d "$ANALYSIS_DIR" ]; then
  ANALYSIS_COUNT=$(find "$ANALYSIS_DIR" -type f | wc -l)
fi
WEEK_LABEL=$(date -u +%G-W%V)
WEEKLY_DIR="analysis/weekly/$WEEK_LABEL"
if [ -d "$WEEKLY_DIR" ]; then
  WEEKLY_COUNT=$(find "$WEEKLY_DIR" -type f | wc -l)
  ANALYSIS_COUNT=$((ANALYSIS_COUNT + WEEKLY_COUNT))
fi
if [ "$ANALYSIS_COUNT" -gt 0 ]; then
  echo "📊 Found $ANALYSIS_COUNT total analysis artifacts — these MUST be committed (do NOT use safeoutputs___noop)"
else
  echo "📊 Found 0 analysis artifacts — safeoutputs___noop is allowed (no files to commit)"
fi
```

> **🚨 CRITICAL RULE: Never call `safeoutputs___noop` if analysis artifacts exist.** If the pre-article analysis pipeline produced ANY output files, you MUST commit them via `safeoutputs___create_pull_request` — even if no articles are generated. Use an analysis-only PR with title: `📊 Analysis Only - Month Ahead - {date}` and label `analysis-only`. Only use `safeoutputs___noop` if the analysis pipeline produced ZERO output files (truly nothing to analyze).

### 🔬 Step 2b: Read ALL Analysis Files + Cross-Reference Sibling Types (MANDATORY)

> 🔴 **NON-NEGOTIABLE**: Month-ahead forecasting synthesizes across ALL article types. The AI MUST read ALL analysis files from ALL article types before generating the forecast. See SHARED_PROMPT_PATTERNS.md §"MANDATORY PRE-ARTICLE ANALYSIS READING".

```bash
ANALYSIS_SUBFOLDER="month-ahead"
ANALYSIS_BASE="analysis/daily/${ARTICLE_DATE}/${ANALYSIS_SUBFOLDER}"

echo "📖 Reading ALL analysis files from $ANALYSIS_BASE..."
if [ -d "$ANALYSIS_BASE" ]; then
  for MD_FILE in "$ANALYSIS_BASE"/*.md; do
    if [ -f "$MD_FILE" ]; then
      echo "--- Reading: $(basename $MD_FILE) ---"
      cat "$MD_FILE"
      echo ""
    fi
  done
fi

echo "🔍 Cross-referencing sibling analysis types for $ARTICLE_DATE..."
for SIBLING_DIR in analysis/daily/$ARTICLE_DATE/*/; do
  if [ -d "$SIBLING_DIR" ]; then
    SIBLING_TYPE="$(basename $SIBLING_DIR)"
    if [ "$SIBLING_TYPE" = "$ANALYSIS_SUBFOLDER" ]; then continue; fi
    echo "📖 Cross-referencing: $SIBLING_TYPE"
    for SIBLING_FILE in "$SIBLING_DIR/synthesis-summary.md" "$SIBLING_DIR/significance-scoring.md"; do
      if [ -f "$SIBLING_FILE" ]; then
        echo "--- Sibling ($SIBLING_TYPE): $(basename $SIBLING_FILE) ---"
        cat "$SIBLING_FILE"
        echo ""
      fi
    done
  fi
done
echo "✅ Cross-referencing complete — month-ahead MUST incorporate findings from all sibling types"
```

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
  --types=month-ahead \
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

### Step 3b: AI Title, Meta Description & Analysis References

> 🚨 **MANDATORY** — After article HTML is generated, the AI MUST improve titles, descriptions, and add analysis references. See `SHARED_PROMPT_PATTERNS.md` sections "AI-DRIVEN TITLE & META DESCRIPTION GENERATION" and "ANALYSIS FILE GITHUB REFERENCES" for full protocols.

**1. Generate newsworthy titles** — Replace script-generated title with: `[Active Verb] + [Specific Institution] + [Concrete Policy Action]`. BANNED: ❌ generic category labels or ": {Topic} in Focus".

**2. Generate AI meta descriptions** (150-160 chars) — Key political intelligence summary. BANNED: ❌ "Analysis of N documents".

**3. 🔴 Add analysis references (MANDATORY — VERIFY AFTER)** — Insert "📊 Analysis & Sources" HTML block (from SHARED_PROMPT_PATTERNS.md §ANALYSIS FILE GITHUB REFERENCES) linking to `analysis/daily/$ARTICLE_DATE/month-ahead/` files and `analysis/methodologies/ai-driven-analysis-guide.md`.

**After inserting, VERIFY** by running:
```bash
for FILE in news/$ARTICLE_DATE-month-ahead-*.html; do
  if [ -f "$FILE" ] && ! grep -q 'class="analysis-references"' "$FILE"; then
    echo "🔴 MISSING analysis-references in: $(basename $FILE) — MUST FIX NOW"
  fi
done
```

**4. Update all metadata** — `<title>`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">`, and `<h1>`.

### Step 4: Translate, Validate & Verify Analysis Quality

Run analysis references fix, validation, and HTMLHint before creating PR:
```bash
# 🔴 MANDATORY: Inject analysis references into any article missing them
npx tsx scripts/fix-analysis-references.ts --date "$ARTICLE_DATE" --rewrite --type month-ahead

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
      echo "❌ HTML validation failed after auto-fix. Please fix remaining issues before creating PR."
      exit 1
    fi
  fi
fi
# Playwright visual validation (accessibility, RTL, responsive)
npx tsx scripts/validate-articles-playwright.ts --filter "month-ahead"

# Validate JSON-LD cross-references
npx tsx scripts/validate-cross-references.ts news/*-month-ahead-*.html
```

**CRITICAL: Each article MUST contain real analysis, not just a list of translated event titles.**
Every generated article must include strategic outlook with political context, not merely translated calendar entries.

**Note**: News index files, metadata, and sitemap are generated automatically at build time by the `prebuild` script. Do NOT run generation scripts or commit their output — only commit the article HTML files.

## Article Content Structure

Month-ahead articles should include:
1. **Monthly Overview**: Summary of major upcoming legislative milestones
2. **Week-by-Week Preview**: Key events broken down by week
3. **Policy Agenda**: Government priorities and scheduled policy announcements
4. **Committee Calendar**: Which committees have significant work planned
5. **Watch Points**: Issues likely to generate political controversy
6. **International Context**: EU coordination, Nordic cooperation events

## 🌐 Translation Quality

EN/SV only: all headings, meta, content in correct language; no untranslated `data-translate` spans; Swedish API titles translated. Full rules: `news-translate.md`.