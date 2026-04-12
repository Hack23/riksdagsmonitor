---
name: "News: Committee Reports"
description: Generates committee reports analysis articles in core languages (EN, SV). Translations for remaining 12 languages are handled by the dedicated news-translate workflow via dispatch-workflow. Single article type per run.
strict: false
on:
  schedule: daily around 4:00 on weekdays
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
  group: gh-aw-news-committee-reports-${{ inputs.article_date || 'today' }}
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

# 📋 Committee Reports Article Generator

You are the **News Journalist Agent** for Riksdagsmonitor generating **committee reports** analysis articles.

## 🔧 Workflow Dispatch Parameters

- **force_generation** = `${{ github.event.inputs.force_generation }}`
- **languages** = `${{ github.event.inputs.languages }}`
- **analysis_depth** = `${{ github.event.inputs.analysis_depth }}`

If **force_generation** is `true`, generate articles even if recent ones exist. Use the **languages** value to determine which languages to generate.

## 🚨 CRITICAL: Single Article Type Focus

**This workflow generates ONLY `committee-reports` articles.** Do not generate other article types.
This focused approach ensures:
- Smaller patch sizes (avoids safe_outputs failures)
- Faster execution within timeout
- Independent scheduling per article type

## 🧠 Repo Memory

Uses `memory/news-generation` branch. START: read `memory/news-generation/last-run-news-committee-reports.json` + `memory/news-generation/covered-documents/{YYYY-MM-DD}.json`. END: update both + `memory/news-generation/translation-status.json`. Skip already-covered dok_ids.

## ⏱️ Time Budget (45 minutes)
- **Minutes 0–3**: Date check, MCP warm-up with `get_sync_status()`
- **Minutes 3–6**: Run pre-article-analysis pipeline (download data)
- **Minutes 6–21**: 🚨 **AI Analysis (15 min minimum)**: Consult methodology guides + templates as needed. Create per-file analysis with color-coded Mermaid diagrams and evidence tables. Run quality gate bash check.
- **Minutes 21–25**: Query MCP tools for committee reports data
- **Minutes 25–33**: Generate articles for core languages (EN, SV) using `npx tsx scripts/generate-news-enhanced.ts`
- **Minutes 33–38**: Validate and fix any quality issues
- **Minutes 38–43**: Commit analysis artifacts + articles, create PR with `safeoutputs___create_pull_request`

> ⚠️ **Analysis phase is 15 minutes minimum** — every analysis file must contain color-coded Mermaid diagrams, structured evidence tables with dok_id citations, and follow template structure exactly.

## ⚠️ CRITICAL: Bash Tool Call Format

> **Full reference:** See `SHARED_PROMPT_PATTERNS.md` → "Bash Tool Call Format". Key rule: every `bash` call MUST have both `command` AND `description` parameters. Example: `bash({ command: "date -u '+%Y-%m-%d'", description: "Get current UTC date" })`

## 🛡️ AWF Shell Safety

> **Full reference:** See `SHARED_PROMPT_PATTERNS.md` → "AWF Shell Safety". Summary: use `$VAR` not `$`+`{VAR}`, use `find -exec` not `$(...)`, set defaults with `if/then` before using `$VAR`.

## 🔤 UTF-8 Encoding

> **Full reference:** See `SHARED_PROMPT_PATTERNS.md` → "UTF-8 Encoding". Summary: use native UTF-8 (`ö`, `ä`, `å`) — NEVER HTML entities (`&#246;`, `&#228;`). Author: `James Pether Sörling`.


## 🚫 CRITICAL: Article Generation Safety

**Articles MUST be generated using `npx tsx scripts/generate-news-enhanced.ts` — NEVER manually.**

The repository provides a complete article generation pipeline. You MUST use it (see Generation Steps below for the full `LANG_ARG` derivation from the `languages` dispatch input; default is `en,sv`):
```bash
source scripts/mcp-setup.sh && npx tsx scripts/generate-news-enhanced.ts --types=committee-reports --languages="$LANG_ARG" --skip-existing
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

Consult as needed — do NOT read all files upfront:
- **Skills:** `.github/skills/editorial-standards/SKILL.md`, `.github/skills/swedish-political-system/SKILL.md`, `.github/skills/legislative-monitoring/SKILL.md`, `.github/skills/riksdag-regering-mcp/SKILL.md`, `.github/skills/language-expertise/SKILL.md`, `.github/skills/gh-aw-safe-outputs/SKILL.md`
- **Analysis:** `scripts/prompts/v2/political-analysis.md`, `per-file-intelligence-analysis.md`, `quality-criteria.md`
- **Methodology:** `analysis/methodologies/ai-driven-analysis-guide.md` (v5.0) + `analysis/templates/per-file-political-intelligence.md`

## 📊 MANDATORY Multi-Step AI Analysis Framework

### Article Type Isolation

> 🚨 **This workflow writes analysis ONLY to `analysis/daily/$ARTICLE_DATE/committeeReports/`**. NEVER write to the parent date directory or another article type's folder. See SHARED_PROMPT_PATTERNS.md "Article Type Isolation" section.

### Standardised Analysis Depth Gate

> ⚠️ **Default is `deep`** — not `standard`. Analysis must always produce publication-quality output with Mermaid diagrams, evidence tables, and quantified risk matrices.

| Depth | AI iterations | SWOT stakeholders | Charts | Mindmap | Mermaid diagrams | Risk matrix (L×I) | Forward indicators | Min. analysis time |
|-------|--------------|-------------------|--------|---------|-----------------|-------------------|-------------------|-------------------|
| standard | 1-2 | ≥5 (of 8 groups) | ≥1 | optional | ≥1 color-coded | ≥2 risks scored | ≥2 with triggers | 10 minutes |
| deep | 2-3 | ≥7 (of 8 groups) | ≥2 | required | ≥2 color-coded | ≥4 risks scored | ≥3 with triggers | 15 minutes |
| comprehensive | 3+ | all 8 groups | ≥3 | required | ≥3 color-coded | ≥6 risks scored | ≥5 with triggers | 20 minutes |

**The 8 mandatory stakeholder groups are**: Citizens, Government Coalition, Opposition Bloc, Business/Industry, Civil Society, International/EU, Judiciary/Constitutional, Media/Public Opinion. Every group MUST be analyzed with specific evidence (dok_id, vote counts, named politicians).

**Minimum requirement for ALL depths**: Every analysis file must contain at least 1 color-coded Mermaid diagram, structured evidence tables with dok_id citations, quantified risk matrix with numeric L×I scores, forward indicators with specific triggers/timelines, and follow the corresponding template structure exactly. Plain prose without tables/diagrams is NEVER acceptable regardless of depth level.

> **Read `analysis_depth` input first** (default: `deep`). This controls iteration count and section requirements.

Based on the editorial profile for `committee-reports` (from `scripts/editorial-framework.ts`):
- **SWOT**: ALL 8 stakeholder groups analyzed with evidence tables (dok_id, vote counts, named politicians per entry)
- **Dashboard**: required (min. 1 chart for `standard`; min. 2 for `deep`/`comprehensive`) — include Mermaid diagrams
- **Mindmap**: optional for `standard`; required for `deep`/`comprehensive` — use CSS mindmap with committee jurisdiction branches
- **Risk Matrix**: required — numeric L×I scores (1-5 each) for ≥2 risks (standard), ≥4 risks (deep), ≥6 risks (comprehensive)
- **Forward Indicators**: required — ≥2 specific triggers with dates/timelines for `standard`, ≥3 for `deep`
- **Confidence Labels**: `[HIGH]`/`[MEDIUM]`/`[LOW]` on ALL analytical claims — no unlabeled assertions
- **Mermaid Diagrams**: ≥1 color-coded diagram per article showing committee referral flow, policy impact paths, or legislative pipeline
- **Classification Rationale**: 5-dimension significance scoring visible in article with numeric scores
- **AI iterations**: 1-2 (standard), 2-3 (deep), 3+ (comprehensive)

> 🚨 **ANTI-PATTERNS (REJECTED)**: "Requires committee review and chamber debate" (generic boilerplate), SWOT with only Government/Opposition/Civil Society (need all 8 groups), risk as "MEDIUM" text without L×I numbers, articles with 0 Mermaid diagrams, no dok_id citations in article body.

### 🗳️ Election 2026 Lens (Mandatory — v5.0)

Every analysis MUST include an **Election 2026 Implications** section assessing: Electoral Impact, Coalition Scenarios, Voter Salience, Campaign Vulnerability, and Policy Legacy. Use the **5-level confidence scale** (⬛VERY LOW → 🟥LOW → 🟧MEDIUM → 🟩HIGH → 🟦VERY HIGH). See `analysis/methodologies/ai-driven-analysis-guide.md` v5.0 for full criteria.

### Phase 1 — Data Collection & Initial Analysis
1. Fetch MCP data (`get_betankanden`, `get_sync_status`, cross-reference `search_voteringar`)
2. Detect policy domains for each report using `scripts/statistical-claims-detector.ts`
3. Build initial outline: lede, thematic groupings, key takeaways

### Phase 2 — Iterative Depth Enhancement (repeat per `analysis_depth`)
For each AI iteration:
1. **SWOT Analysis**: Generate multi-stakeholder SWOT with ALL 8 groups (Citizens, Government Coalition, Opposition Bloc, Business/Industry, Civil Society, International/EU, Judiciary/Constitutional, Media/Public Opinion). Use structured evidence tables with columns: `#`, `Statement`, `Evidence (dok_id)`, `Confidence`, `Impact`, `Entry Date`. Every entry MUST cite specific betänkande number (e.g., "MJU18"), committee decision, or voting outcome.
2. **Policy Dashboard**: Generate with ≥1 chart (≥2 for `deep`/`comprehensive`). Include ≥1 Mermaid diagram showing committee referral flow or legislative pipeline with color-coded nodes.
3. **Risk Matrix**: Generate quantified L×I risk assessment with numeric scores (Likelihood 1-5, Impact 1-5) for each committee report. Present as structured HTML table with color-coded risk levels.
4. **Forward Indicators**: Generate "What to Watch" section with ≥2 specific triggers (e.g., "FöU scheduling of Prop. 2025/26:214 by April 15 — if scheduled, signals government urgency [HIGH]").
5. **Mindmap**: Generate CSS mindmap showing policy domain connections (only for `deep`/`comprehensive`)
6. **Classification Rationale**: Include 5-dimension significance scoring (Parliamentary Impact, Policy Impact, Public Interest, Urgency, Cross-Party Significance) with numeric 0-10 scores per dimension.
7. **Confidence Labels**: Ensure ALL analytical claims have `[HIGH]`/`[MEDIUM]`/`[LOW]` labels.
8. **Quality Gate** (check before next iteration):
   - Verify no identical "Why It Matters" text across entries
   - Verify all Swedish API text is translated
   - Verify word count ≥ 800
   - Verify ≥1 Mermaid diagram with color-coded style directives
   - Verify ≥5 dok_id citations in article body
   - Verify ALL 8 stakeholder groups have evidence-based entries
   - Verify no generic boilerplate (grep for "Requires committee review and chamber debate" — must be 0)
   - If failing any check: re-generate the failing section before proceeding

### Phase 3 — Final Quality Gate Before PR
Run all validation checks from the **MANDATORY Quality Validation** section below before committing.

## MANDATORY Date Validation

**ALWAYS START by logging the current date:**
```bash
echo "=== Date Validation Check ==="
date -u "+Current UTC: %A %Y-%m-%d %H:%M:%S"
echo "Article Type: committee-reports"
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
ARTICLE_TYPE="committee-reports"
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

Branch: `news/content/{YYYY-MM-DD}/{article-type}` (e.g. `news/content/2026-03-23/committee-reports`). `safeoutputs___create_pull_request` handles this automatically.

## MANDATORY PR Creation

### HOW SAFE PR CREATION WORKS

> `safeoutputs___create_pull_request` handles branch creation, push, and PR opening — do NOT run `git push` or `git checkout -b` manually. Stage files, then call the tool directly.


```bash
# Stage articles and analysis — scoped to article type to stay within 100-file PR limit
# CRITICAL: Stage only this workflow's articles and metadata, NOT all of news/
# Using article-type pattern prevents merge conflicts with concurrent workflows
git add news/*committee-reports*.html news/*committee*.html 2>/dev/null || true
git add news/metadata/ 2>/dev/null || true
git add "analysis/daily/${ARTICLE_DATE:-$(date -u +%Y-%m-%d)}/committeeReports/" || true
# Enforce safe-outputs 100-file PR limit
STAGED_COUNT=$(git diff --cached --name-only | wc -l)
if [ "$STAGED_COUNT" -gt 90 ]; then
  echo "⚠️ Staged $STAGED_COUNT files exceeds 100-file PR limit. Removing per-document analysis files."
  git reset HEAD -- "analysis/daily/${ARTICLE_DATE:-$(date -u +%Y-%m-%d)}/committeeReports/documents/" 2>/dev/null || true
  STAGED_COUNT=$(git diff --cached --name-only | wc -l)
fi
if [ "$STAGED_COUNT" -gt 90 ]; then
  echo "⚠️ Still $STAGED_COUNT files. Removing all analysis artifacts."
  git reset HEAD -- "analysis/daily/${ARTICLE_DATE:-$(date -u +%Y-%m-%d)}/committeeReports/" 2>/dev/null || true
  STAGED_COUNT=$(git diff --cached --name-only | wc -l)
fi
echo "📊 Final staged file count: $STAGED_COUNT"
git commit -m "Add committee-reports articles and analysis artifacts"
```

- ✅ `safeoutputs___create_pull_request` for articles or analysis-only PRs (`analysis-only` + `committee-reports` labels)
- ✅ `safeoutputs___noop` ONLY if MCP unreachable after 3 attempts AND no analysis artifacts exist
- ❌ NEVER noop because articles already exist — analysis always runs
- ❌ Safe output tools are in your tool list — NEVER search for them via bash

## 🌐 Dispatch Translation Workflow

After creating the content PR, dispatch translations: `safeoutputs___dispatch_workflow({ "workflow_name": "news-translate", "inputs": { "article_date": "<YYYY-MM-DD>", "article_type": "<article-type>", "languages": "all-extra" } })`. See `news-translate.md` for full translation quality rules.

## MCP Tools

**ALWAYS call `get_sync_status()` FIRST** to warm up server and check data freshness.

**Primary tool:** `get_betankanden` — fetches latest committee reports
**Cross-reference:** `search_voteringar`, `search_anforanden`, `get_propositioner`
**Statistical enrichment:** SCB MCP + World Bank — enrich with data matching the reporting committee. Use domain-to-committee mappings from `scripts/scb-context.ts` (e.g., FiU reports→fiscal TAB1291, AU→labour TAB5765, JuU→crime TAB1172, MJU→environment TAB5404). World Bank indicators are mapped per committee in `scripts/world-bank-context.ts` (144 indicators covering all 12 committees). See `analysis/worldbank/indicators-inventory.json` for full inventory and `SHARED_PROMPT_PATTERNS.md` §"WORLD BANK ECONOMIC CONTEXT INTEGRATION" for Chart.js chart templates (`economic-comparison`, `economic-trend`, `nordic-radar`). MUST generate ≥1 economic chart when committee has mapped indicators.
**Fact-checking:** Use `scripts/statistical-claims-detector.ts` to detect statistical claims in related debates and cross-reference against official SCB/World Bank data.

```javascript
get_sync_status({})
get_betankanden({ rm: <calculated riksmöte>, limit: 20 })
```

## Generation Steps

### Step 1: Check Existing Articles (Analysis Always Runs)
Check if committee-reports articles already exist for the target date. If they do, skip article generation but **ALWAYS run the full deep political analysis phase** — analysis is the primary output and must execute on every run regardless of article existence.

### Step 2: Query MCP for Committee Reports
```javascript
get_sync_status({})
get_betankanden({ rm: <calculated riksmöte>, limit: 20 })
```

### Step 2.5: Run Pre-Article Analysis Pipeline

**CRITICAL: Run the analysis pipeline BEFORE article generation.** This downloads data from riksdag-regering-mcp, runs all 9 analysis steps (classification, risk assessment, SWOT, threat analysis, stakeholder perspectives, significance scoring, cross-references, synthesis), and writes structured artifacts to `analysis/daily/YYYY-MM-DD/committeeReports/`. The `--doc-type committeeReports` flag ensures ALL output goes directly to the scoped subdirectory. **NEVER write or copy analysis files to the parent date directory** — doing so causes merge conflicts when multiple doc-type workflows run on the same date. The `analysis-reader.ts` automatically scans subdirectories, so root-level copies are NOT needed.

```bash
# Idempotent: only set if not already resolved by lookback
if [ -z "${ARTICLE_DATE:-}" ]; then
  ARTICLE_DATE="${{ github.event.inputs.article_date }}"
  if [ -z "$ARTICLE_DATE" ]; then
    ARTICLE_DATE=$(date -u +%Y-%m-%d)
  fi
fi

# === Run Suffix Resolution (see SHARED_PROMPT_PATTERNS.md) ===
BASE_SUBFOLDER="committeeReports"
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
npx tsx scripts/pre-article-analysis.ts --date "$ARTICLE_DATE" --limit 50 --doc-type committeeReports 2>&1 | tee /tmp/pipeline-output.log
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
MANIFEST_PATH="analysis/daily/$ARTICLE_DATE/committeeReports/data-download-manifest.md"
DATE_DOCS_ANALYZED=0
if [ -f "$MANIFEST_PATH" ]; then
  DATE_DOCS_ANALYZED=$(grep -E '^\*\*Documents Analyzed\*\*' "$MANIFEST_PATH" | sed -E 's/^\*\*Documents Analyzed\*\* *: *([0-9]+).*/\1/' || echo 0)
fi
[ -z "$DATE_DOCS_ANALYZED" ] && DATE_DOCS_ANALYZED=0
echo "📄 Committee reports analyzed for $ARTICLE_DATE: $DATE_DOCS_ANALYZED"

if [ "$DATE_DOCS_ANALYZED" -eq 0 ]; then
  echo "⚠️ No committee report data for $ARTICLE_DATE — activating lookback fallback (up to 7 days)"
  DATA_DATE=""
  for DAYS_BACK in 1 2 3 4 5 6 7; do
    # Cross-platform date arithmetic: GNU date (-d) on Linux/GitHub Actions, BSD date (-v) on macOS
    LOOKBACK_DATE=$(date -u -d "$ARTICLE_DATE - $DAYS_BACK days" +%Y-%m-%d 2>/dev/null || date -u -v-${DAYS_BACK}d -j -f "%Y-%m-%d" "$ARTICLE_DATE" +%Y-%m-%d 2>/dev/null)
    [ -z "$LOOKBACK_DATE" ] && continue
    echo "🔍 Checking $LOOKBACK_DATE for analyzed committee reports..."
    # First, check if a manifest already exists with non-zero Documents Analyzed
    MANIFEST_PATH="analysis/daily/$LOOKBACK_DATE/committeeReports/data-download-manifest.md"
    DATE_DOCS_ANALYZED=0
    if [ -f "$MANIFEST_PATH" ]; then
      DATE_DOCS_ANALYZED=$(grep -E '^\*\*Documents Analyzed\*\*' "$MANIFEST_PATH" | sed -E 's/^\*\*Documents Analyzed\*\* *: *([0-9]+).*/\1/' || echo 0)
    fi
    [ -z "$DATE_DOCS_ANALYZED" ] && DATE_DOCS_ANALYZED=0
    if [ "$DATE_DOCS_ANALYZED" -gt 0 ]; then
      echo "✅ Found $DATE_DOCS_ANALYZED committee reports already analyzed for $LOOKBACK_DATE"
      DATA_DATE="$LOOKBACK_DATE"
      break
    fi
    # No existing data — run pre-article analysis for this lookback date
    echo "ℹ️ No existing manifest data for $LOOKBACK_DATE — running pre-article analysis"
    source scripts/mcp-setup.sh && npx tsx scripts/pre-article-analysis.ts --date "$LOOKBACK_DATE" --limit 50 --doc-type committeeReports 2>/dev/null || true
    # Re-check manifest after running analysis
    MANIFEST_PATH="analysis/daily/$LOOKBACK_DATE/committeeReports/data-download-manifest.md"
    DATE_DOCS_ANALYZED=0
    if [ -f "$MANIFEST_PATH" ]; then
      DATE_DOCS_ANALYZED=$(grep -E '^\*\*Documents Analyzed\*\*' "$MANIFEST_PATH" | sed -E 's/^\*\*Documents Analyzed\*\* *: *([0-9]+).*/\1/' || echo 0)
    fi
    [ -z "$DATE_DOCS_ANALYZED" ] && DATE_DOCS_ANALYZED=0
    if [ "$DATE_DOCS_ANALYZED" -gt 0 ]; then
      echo "✅ Successfully analyzed $DATE_DOCS_ANALYZED committee reports for $LOOKBACK_DATE"
      DATA_DATE="$LOOKBACK_DATE"
      break
    fi
  done
  # Lookback protection: copy analysis to today's directory instead of overwriting historical data
  if [ -n "$DATA_DATE" ] && [ "$DATA_DATE" != "$ORIGINAL_ARTICLE_DATE" ]; then
    SRC_DIR="analysis/daily/$DATA_DATE/committeeReports"
    DST_DIR="analysis/daily/$ORIGINAL_ARTICLE_DATE/committeeReports"
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
  # Persist the resolved ARTICLE_DATE for subsequent workflow steps
  if [ -n "${GITHUB_ENV:-}" ]; then
    echo "ARTICLE_DATE=$ARTICLE_DATE" >> "$GITHUB_ENV"
  fi
fi

# Report pending per-file analysis count for monitoring
PENDING=$(npx tsx scripts/catalog-downloaded-data.ts --pending-only --type committeeReports 2>/dev/null | jq '.pendingAnalysis // 0' 2>/dev/null || echo "0")
[ -z "$PENDING" ] && PENDING=0
echo "📊 Total pending committee report analysis files (all dates): $PENDING"
```

### Per-File AI Analysis Enhancement

> 🚨 **CRITICAL RULE:** You must **actually read the JSON data** in each file and base all analysis on real data found there. Every SWOT entry, risk score, and stakeholder assessment must cite specific data from the file (dok_id, vote counts, party names, reservation details). Generic or boilerplate analysis is a failure mode — see the "Concrete Example: What Good Analysis Looks Like" section in `analysis/methodologies/ai-driven-analysis-guide.md` for bad vs. good comparison.

After the script-based analysis, perform **AI-driven per-file analysis** for deeper intelligence:

1. Run `npx tsx scripts/catalog-downloaded-data.ts --pending-only` to list files needing analysis
2. **Read the master methodology guide and per-file template** (required upfront), then consult others as needed:
   - `analysis/methodologies/ai-driven-analysis-guide.md` — Master per-file analysis guide (includes bad/good examples)
   - `analysis/templates/per-file-political-intelligence.md` — Per-file output template
   - Consult the following as needed for the current analysis step:
   - `analysis/methodologies/political-swot-framework.md` — Evidence-based SWOT with confidence hierarchy
   - `analysis/methodologies/political-risk-methodology.md` — 5×5 Likelihood×Impact risk matrix
   - `analysis/methodologies/political-threat-framework.md` — Political Threat Taxonomy, Attack Trees, severity calibration
   - `analysis/methodologies/political-classification-guide.md` — Sensitivity and domain taxonomy
   - `analysis/methodologies/political-style-guide.md` — Writing standards and evidence density
   - `analysis/templates/synthesis-summary.md` — Daily synthesis template
   - `analysis/templates/risk-assessment.md` — Risk assessment template
   - `analysis/templates/political-classification.md` — Classification template
   - `analysis/templates/threat-analysis.md` — Threat template
   - `analysis/templates/swot-analysis.md` — SWOT template
   - `analysis/templates/stakeholder-impact.md` — Stakeholder template
   - `analysis/templates/significance-scoring.md` — Significance template
3. For each pending file:
   a. **Read** the JSON data file — use `view` or `cat` to read the actual content
   b. **Extract** key fields (dok_id, titel, datum, organ, reservationer, etc.)
   c. **Classify** — Sensitivity level, domain, urgency, significance (0–10)
   d. **SWOT** — Government + Opposition impact with evidence (cite specific dok_id, vote margins)
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

> **Root Cause**: The `pre-article-analysis.ts` script filters documents by exact date match. When no committee reports are published on the exact analysis date, batch files report "0 documents analyzed" — this violates `ai-driven-analysis-guide.md` quality requirements.

**After per-file analysis, check if batch files are empty and enrich them:**

1. Check `synthesis-summary.md` — if it reports "0 documents analyzed" but per-document analyses exist in `documents/`, aggregate the per-doc findings into all 9 batch files
2. If NO per-doc analyses exist AND batch files show "0 documents analyzed", use MCP `get_betankanden(rm="2025/26", limit=20)` directly to find recent committee reports and create meaningful analysis
3. Each enriched batch file MUST include: ≥1 Mermaid diagram, structured tables, evidence citations, confidence labels
4. **NEVER commit batch files that report "0 documents analyzed" when analysis data is available**
5. See `ai-driven-analysis-guide.md` "Deep-Inspection Batch Analysis Enrichment Protocol (v4.1)" for full requirements

### 📋 Rewrite Daily Synthesis Files to Follow Templates

> 🚨 **CRITICAL**: Script-generated stubs do NOT follow template structure. Rewrite each daily file to match its `analysis/templates/` counterpart. Read each template with `cat` before rewriting. Every file needs: metadata header (ID, date, riksmöte, confidence), ≥1 color-coded Mermaid diagram, evidence tables with dok_id citations, and no `[REQUIRED]` placeholders.

### 🚨 MANDATORY: Analysis Artifacts Must ALWAYS Be Committed

**Before deciding whether to generate articles or call noop, you MUST:**

1. **Review the analysis artifacts** in `analysis/daily/YYYY-MM-DD/committeeReports/` — read `synthesis-summary.md` and `significance-scoring.md` to understand what was found
2. **Summarize the analysis findings** — note how many documents were downloaded, their significance scores, key themes, and risk levels
3. **ALWAYS commit analysis artifacts** regardless of whether articles will be generated:

```bash
# Idempotent: only set if not already resolved by lookback
if [ -z "${ARTICLE_DATE:-}" ]; then
  ARTICLE_DATE="${{ github.event.inputs.article_date }}"
  [ -z "$ARTICLE_DATE" ] && ARTICLE_DATE=$(date -u +%Y-%m-%d)
fi
ANALYSIS_DIR="analysis/daily/$ARTICLE_DATE/committeeReports"
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

> **🚨 CRITICAL RULE: Never call `safeoutputs___noop` if analysis artifacts exist.** If the pre-article analysis pipeline produced ANY output files, you MUST commit them via `safeoutputs___create_pull_request` — even if no articles are generated. Use an analysis-only PR with title: `📊 Analysis Only - Committee Reports - {date}` and label `analysis-only`. Only use `safeoutputs___noop` if the analysis pipeline produced ZERO output files (truly nothing to analyze).

### 🔬 Step 2b: Read ALL Analysis Files (MANDATORY — before article generation)

> 🔴 **NON-NEGOTIABLE**: The AI agent MUST `cat` every analysis `.md` file BEFORE generating any article HTML. Analysis and articles are created in the **same workflow run** — there is zero excuse for not reading the analysis. Articles written without reading analysis are shallow and REJECTED. See SHARED_PROMPT_PATTERNS.md §"MANDATORY PRE-ARTICLE ANALYSIS READING".

```bash
ANALYSIS_SUBFOLDER="committeeReports"
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
  if [ -d "$ANALYSIS_BASE/documents" ]; then
    echo "📄 Reading per-document analyses..."
    for DOC_FILE in "$ANALYSIS_BASE/documents"/*.md; do
      if [ -f "$DOC_FILE" ]; then
        echo "--- Per-doc: $(basename $DOC_FILE) ---"
        cat "$DOC_FILE"
        echo ""
      fi
    done
  fi
  ANALYSIS_FILE_COUNT=$(find "$ANALYSIS_BASE" -name "*.md" -type f | wc -l)
  echo "✅ Read $ANALYSIS_FILE_COUNT analysis files — these MUST drive article content"
else
  echo "⚠️ No analysis directory found at $ANALYSIS_BASE — will use MCP fallback for article content"
fi
```

> **After reading, confirm you loaded the analysis** by noting: (1) number of files read, (2) top 3 significance-ranked findings, (3) key risk scores. If you cannot produce this summary, you have NOT read the analysis.

Parse the `languages` input and generate using the automated script:

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
  --types=committee-reports \
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

**2. Generate newsworthy titles from analysis** — Read each article's content AND the synthesis findings, then generate a title following: `[Active Verb] + [Specific Actor/Institution] + [Concrete Policy Action]`. The title MUST reference findings from the synthesis — not generic category labels. Apply to ALL languages (not just English). BANNED: ❌ "Committee Reports: Parliamentary Priorities This Week: Defense in Focus" or any title ending with ": {Topic} in Focus".

**3. Generate AI meta descriptions from analysis** (150-160 chars) — Summarize the #1 ranked finding from synthesis significance-scoring. BANNED: ❌ "Analysis of N documents covering Committee:, Published:" or any description starting with "Analysis of N documents".

**4. 🔴 Add analysis references section (MANDATORY — VERIFY AFTER)** — Insert the "📊 Analysis & Sources" HTML block (from SHARED_PROMPT_PATTERNS.md §ANALYSIS FILE GITHUB REFERENCES) before the article footer, linking to:
- `analysis/daily/$ARTICLE_DATE/committeeReports/synthesis-summary.md`
- `analysis/daily/$ARTICLE_DATE/committeeReports/swot-analysis.md`
- `analysis/daily/$ARTICLE_DATE/committeeReports/risk-assessment.md`
- `analysis/daily/$ARTICLE_DATE/committeeReports/threat-analysis.md`
- `analysis/daily/$ARTICLE_DATE/committeeReports/stakeholder-perspectives.md`
- `analysis/daily/$ARTICLE_DATE/committeeReports/significance-scoring.md`
- `analysis/daily/$ARTICLE_DATE/committeeReports/classification-results.md`
- `analysis/daily/$ARTICLE_DATE/committeeReports/cross-reference-map.md`
- `analysis/daily/$ARTICLE_DATE/committeeReports/data-download-manifest.md`
- `analysis/methodologies/ai-driven-analysis-guide.md`
- Per-document analyses in `documents/` subfolder

**After inserting, VERIFY** by running:
```bash
for FILE in news/$ARTICLE_DATE-committee-reports-*.html; do
  if [ -f "$FILE" ] && ! grep -q 'class="analysis-references"' "$FILE"; then
    echo "🔴 MISSING analysis-references in: $(basename $FILE) — MUST FIX NOW"
  fi
done
```

**5. Update all metadata in ALL languages** — For EVERY generated language file, ensure `<title>`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">`, `<h1>`, Schema.org `headline`, `alternativeHeadline`, and `description` all reflect the AI-generated title and description. Non-English articles MUST have properly translated AI titles — not English titles or generic templates.

### Step 3c: AI Content Quality Enforcement (v4.0 — MANDATORY)

> 🚨 **v4.0 CRITICAL**: The AI MUST read pre-computed analysis files and rewrite ALL script-generated stub content. See `SHARED_PROMPT_PATTERNS.md` §"AI ARTICLE CONTENT GENERATION" and `ai-driven-analysis-guide.md` v4.0 §"AI Article Content Generation Protocol".

**1. Read pre-computed analysis** — Before modifying article content, read:
```bash
cat "analysis/daily/$ARTICLE_DATE/committeeReports/synthesis-summary.md"
cat "analysis/daily/$ARTICLE_DATE/committeeReports/swot-analysis.md"
cat "analysis/daily/$ARTICLE_DATE/committeeReports/risk-assessment.md"
cat "analysis/daily/$ARTICLE_DATE/committeeReports/stakeholder-perspectives.md"
```

**2. Replace script-generated lede** — Find and replace any `<p class="lede">Analysis of N documents covering...` with an AI-generated analytical lede naming the most significant committee report, key actors, and political significance.

**3. Replace boilerplate "Why It Matters"** — For EACH committee report entry, replace any `"Touches on {X} policy..."` boilerplate with document-specific analysis citing the committee code, policy measure, budget impact, and party positions.

**4. Replace generic "Winners & Losers"** — Find and replace `"The political landscape remains fluid..."` with specific winners/losers naming parties (M, S, SD, V, MP, C, L, KD) with evidence from vote records or committee decisions.

**5. Replace excuse-as-analysis** — Find and replace `"No chamber debate data is available..."` with either: (a) actual debate data from MCP `search_anforanden`, or (b) analysis of the committee report text itself.

**6. 🔴 MANDATORY: Replace ALL Deep Analysis `AI_MUST_REPLACE` markers** — The script now generates `<!-- AI_MUST_REPLACE: ... -->` markers in EVERY Deep Analysis subsection (Timeline & Context, Why This Matters, Political Impact, Actions & Consequences, Critical Assessment). You MUST:
  - Search the generated HTML for ALL `AI_MUST_REPLACE` markers
  - Replace EACH marker with genuine, specific political intelligence analysis
  - "Timeline & Context" → Write about the specific scheduling strategy, why these reports come now, and how timing relates to the legislative calendar
  - "Why This Matters" → Explain the specific political significance of THESE particular items — which parties gain/lose, what policy areas shift, how it affects citizens
  - "Political Impact" → Name specific parties, vote margins, coalition dynamics, and which measures face the strongest resistance
  - "Actions & Consequences" → Detail specific implementation requirements, agency actions needed, budget implications, and timeline for each major item
  - "Critical Assessment" → Provide a genuine critical evaluation: what's the gap between stated intent and likely outcome? Where is the government overreaching or underdelivering?
  - ZERO `AI_MUST_REPLACE` markers may survive in the final committed HTML

**7. Add Key Takeaways** — If missing, add 3-5 bullet points with bold lead phrases, dok_id citations, and [HIGH/MEDIUM/LOW] confidence labels.

**8. Verify policy domain labels** — Ensure each committee report is classified by its committee code (FöU=Defence, JuU=Justice, SoU=Healthcare, etc.), NOT by keyword heuristics.

### Step 4: Translate Swedish Content & Verify Analysis Quality
All Swedish API data MUST be translated. Check every article for `data-translate="true"` markers.

**CRITICAL: Each article MUST contain real analysis, not just a list of translated links.**
Every generated article must include:
- An analytical lede paragraph providing political context (not just a document count)
- Thematic analysis section grouping reports by committee with interpretive commentary
- "What This Means" or "Why It Matters" analysis for each document
- Key Takeaways section summarizing political significance and implications
- Policy domain inference (fiscal, defence, healthcare, etc.) based on committee and title

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
4. **Iteration 2** — Address quality gaps, deepen committee analysis and voting context
5. **If still < 7**: Final iteration — add policy implications and parliamentary significance
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
- ❌ Identical "Why It Matters" text for all entries — DIFFERENTIATE analysis per report
- ❌ Flat list of reports without grouping — GROUP by committee or policy theme
- ❌ Article under 500 words — EXPAND with analytical sections

### Playwright Visual Validation
Run Playwright validation before creating the PR:
```bash
# HTMLHint validation
npx htmlhint "news/*-committee-reports-*.html"

# Playwright visual validation (accessibility, RTL, responsive)
npx tsx scripts/validate-articles-playwright.ts --filter "committee-reports"

# Validate JSON-LD cross-references
npx tsx scripts/validate-cross-references.ts news/*-committee-reports-*.html
```

### Bash Validation Commands:
```bash
# Check for unknown authors (should return 0)
grep -rl "Filed by: Unknown" news/ | grep "committee-reports" | wc -l || true

# Check for untranslated spans in English article (should return 0)
grep -c 'data-translate="true"' "news/$(date +%Y-%m-%d)-committee-reports-en.html" 2>/dev/null || true

# Check word count of English article text content (warn if < 500; HTML tags stripped)
FILE="news/$(date +%Y-%m-%d)-committee-reports-en.html"
if [ ! -f "$FILE" ]; then echo "WARNING: Expected article file not found: $FILE — check if generation succeeded"; else
  WORD_COUNT="$(sed 's/<[^>]*>/ /g' "$FILE" | tr -s '[:space:]' '\n' | grep -c '[[:alnum:]]' 2>/dev/null || echo 0)"
  echo "Content word count (HTML tags stripped): $WORD_COUNT"
  if [ "$WORD_COUNT" -lt 500 ]; then echo "WARNING: Article content may be too short ($WORD_COUNT words) — consider expanding before PR"; fi
fi

# Check for duplicate "Why It Matters" content (should return empty)
grep -o 'Why It Matters[^<]*' "news/$(date +%Y-%m-%d)-committee-reports-en.html" 2>/dev/null | sort | uniq -d || true
```
**Note**: Do NOT use `exit 1` in these validation snippets — use warnings so the agent can still create a PR or call noop.

### If Article Fails Quality Check:
1. Use bash to enhance the HTML with analytical sections
2. Replace generic "Why It Matters" with report-specific analysis
3. Add thematic grouping headers (e.g., by committee or policy domain)
4. Translate any remaining Swedish content

### Step 5: Build-time Generation Note

**Note**: News index files, metadata, and sitemap are generated automatically at build time by the `prebuild` script. Do NOT run generation scripts or commit their output — only commit the article HTML files. Run `npm run prebuild` (or `npm run build`) locally if you need to preview the generated indexes, metadata, or sitemap.

### Step 6: Validate & Create PR
Run analysis references fix, validation, and HTMLHint before creating PR:
```bash
# 🔴 MANDATORY: Inject analysis references into any article missing them
# This is deterministic — scans analysis/ dir for files created in this workflow run
npx tsx scripts/fix-analysis-references.ts --date "$ARTICLE_DATE" --rewrite --type committee-reports

bash scripts/validate-news-generation.sh
VALIDATION_EXIT=$?
if [ "$VALIDATION_EXIT" -ne 0 ]; then
  echo "❌ News generation validation failed. Fix the reported issues before creating a PR."
  exit "$VALIDATION_EXIT"
fi

# HTMLHint validation with auto-fix
NEWS_FILES=$(find news -maxdepth 1 -name '*-*.html' | wc -l)
if [ "$NEWS_FILES" -gt 0 ]; then
  if ! npx htmlhint "news/*-*.html" 2>/dev/null; then
    echo "⚠️ HTML validation errors found, attempting auto-fix..."
    npx tsx scripts/article-quality-enhancer.ts --fix
    if ! npx htmlhint "news/*-*.html"; then
      echo "❌ HTML validation errors remain after auto-fix. Please fix them before creating a PR."
      exit 1
    fi
  fi
fi
```

Then create PR:
```
safeoutputs___create_pull_request
```

## 🌐 Translation Quality

EN/SV only: all headings, meta, content in correct language; no untranslated `data-translate` spans; Swedish API titles translated. Full rules: `news-translate.md`.
## Article Naming Convention
Files: `YYYY-MM-DD-committee-reports-{lang}.html` (e.g., `2026-02-22-committee-reports-en.html`)