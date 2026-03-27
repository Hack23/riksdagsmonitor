---
name: "News: Government Propositions"
description: Generates government propositions analysis articles in core languages (EN, SV). Translations for remaining 12 languages are handled by the dedicated news-translate workflow via dispatch-workflow. Single article type per run.
strict: false
on:
  schedule:
    - cron: "0 5 * * 1-5"
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
        default: standard

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
    - regeringen.se
    - "*.se"
    - "*.com"
    - "*.org"
    - "*.io"
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

safe-outputs:
  allowed-domains:
    - riksdag-regering-ai.onrender.com
    - api.scb.se
    - api.worldbank.org
    - data.riksdagen.se
    - www.riksdagen.se
    - www.regeringen.se
    - github.com
  create-pull-request: {}
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

## ⏱️ Time Budget (45 minutes)
- **Minutes 0–3**: Date check, MCP warm-up with `get_sync_status()`
- **Minutes 3–8**: Run pre-article-analysis pipeline (download data + generate analysis artifacts)
- **Minutes 8–15**: Query MCP tools for propositions data
- **Minutes 15–28**: Generate articles for core languages (EN, SV) using `npx tsx scripts/generate-news-enhanced.ts`
- **Minutes 28–35**: Validate and fix any quality issues
- **Minutes 35–40**: Commit analysis artifacts + articles, create PR with `safeoutputs___create_pull_request`
- **Minutes 40–45**: Dispatch translation workflow

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
3. If no data AND no analysis artifacts, use `safeoutputs___noop` with a descriptive message
4. Do NOT attempt to manually create articles as a fallback

## Required Skills

Before generating articles, consult these skills:
1. **`.github/skills/editorial-standards/SKILL.md`** — OSINT/INTOP editorial standards
2. **`.github/skills/swedish-political-system/SKILL.md`** — Parliamentary terminology
3. **`.github/skills/legislative-monitoring/SKILL.md`** — Voting patterns, committee tracking, bill progress
4. **`.github/skills/riksdag-regering-mcp/SKILL.md`** — MCP tool documentation
5. **`.github/skills/language-expertise/SKILL.md`** — Per-language style guidelines
6. **`.github/skills/gh-aw-safe-outputs/SKILL.md`** — Safe outputs usage
7. **`scripts/prompts/v1/political-analysis.md`** — Core political analysis framework (6 analytical lenses)
8. **`scripts/prompts/v1/stakeholder-perspectives.md`** — Multi-perspective analysis instructions
9. **`scripts/prompts/v1/quality-criteria.md`** — Quality self-assessment rubric (minimum 7/10)

## 📊 MANDATORY Multi-Step AI Analysis Framework

### Standardised Analysis Depth Gate

| Depth | AI iterations | SWOT stakeholders | Charts | Mindmap |
|-------|--------------|-------------------|--------|---------|
| standard | 1-2 | ≥3 | ≥1 | optional |
| deep | 2-3 | ≥5 | ≥2 | required |
| comprehensive | 3+ | ≥7 | ≥3 | required |

> **Read `analysis_depth` input first** (default: `standard`). This controls iteration count and section requirements.

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

Before generating articles, verify no duplicate articles exist for the target date:
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
  echo "📋 Articles for $ARTICLE_DATE/$ARTICLE_TYPE already exist — skipping (set force_generation=true to override)"
  exit 0
fi
```

If articles already exist and `force_generation` is not `true`, call `safeoutputs___noop` with a message explaining that articles already exist for the target date.

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
> 2. Stage and commit locally: `git add news/ analysis/daily/ analysis/weekly/ && git commit -m "Add propositions articles and analysis artifacts"`
> 3. Call `safeoutputs___create_pull_request` with `title`, `body`, and `labels`
>
> **❌ DO NOT** run `git push`, `git checkout -b`, `git branch`, or use GitHub API to create PRs.
> **❌ DO NOT** try alternative approaches if the tool call works — one call is all you need.
> **❌ DO NOT** call `safeoutputs___noop` if articles were generated but PR creation failed — let the workflow FAIL instead.

- ✅ `safeoutputs___create_pull_request` when articles generated
- ✅ `safeoutputs___create_pull_request` with analysis-only PR when no articles but analysis artifacts exist — title: `📊 Analysis Only - Propositions - {date}`, labels: `["analysis-only", "propositions"]`
- ✅ `safeoutputs___noop` ONLY if genuinely no new propositions AND no analysis artifacts
- ❌ NEVER use `safeoutputs___noop` as fallback for PR creation failures
- ❌ NEVER use `safeoutputs___noop` if analysis artifacts exist in `analysis/daily/$ARTICLE_DATE/` for the current run

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

### Step 1: Check Recent Generation
Check if propositions articles exist from the last 11 hours.

### Step 2: Query MCP
```javascript
get_sync_status({})
get_propositioner({ rm: <calculated riksmöte>, limit: 20 })
```

### Step 2.5: Run Pre-Article Analysis Pipeline

**CRITICAL: Run the analysis pipeline BEFORE article generation.** This downloads data from riksdag-regering-mcp, runs all 9 analysis steps (classification, risk assessment, SWOT, threat analysis, stakeholder perspectives, significance scoring, cross-references, synthesis), and writes structured artifacts to `analysis/daily/YYYY-MM-DD/propositions/`. The 9 batch artifacts are also copied to the unscoped `analysis/daily/YYYY-MM-DD/` directory so existing enrichment readers (`readDailyAnalysis`, `getAnalysisEnrichment`) find them at the default path. Per-document files (`documents/*.json`, `documents/*-analysis.md`) remain only under the scoped directory.

```bash
ARTICLE_DATE="${{ github.event.inputs.article_date }}"
if [ -z "$ARTICLE_DATE" ]; then
  ARTICLE_DATE=$(date -u +%Y-%m-%d)
fi
echo "📊 Running pre-article analysis for $ARTICLE_DATE..."
npx tsx scripts/pre-article-analysis.ts --date "$ARTICLE_DATE" --limit 50 --doc-type propositions || echo "⚠️ Analysis failed (non-blocking) — article generation will proceed without enrichment"
echo "✅ Analysis artifacts written to analysis/daily/$ARTICLE_DATE/propositions/"
ls -la "analysis/daily/$ARTICLE_DATE/propositions/" 2>/dev/null || echo "⚠️ No analysis output (pipeline may have found no documents for this date)"
```

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

### 🚨 MANDATORY: Analysis Artifacts Must ALWAYS Be Committed

**Before deciding whether to generate articles or call noop, you MUST:**

1. **Review the analysis artifacts** in `analysis/daily/YYYY-MM-DD/propositions/` — read `synthesis-summary.md` and `significance-scoring.md` to understand what was found
2. **Summarize the analysis findings** — note how many documents were downloaded, their significance scores, key themes, and risk levels
3. **ALWAYS commit analysis artifacts** regardless of whether articles will be generated:

```bash
ARTICLE_DATE="${{ github.event.inputs.article_date }}"
[ -z "$ARTICLE_DATE" ] && ARTICLE_DATE=$(date -u +%Y-%m-%d)
ANALYSIS_DIR="analysis/daily/$ARTICLE_DATE"
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
Apply the quality rubric from **`scripts/prompts/v1/quality-criteria.md`** (minimum score: 7/10).

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
