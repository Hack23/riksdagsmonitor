---
name: "News: Monthly Review"
description: Generates monthly review retrospective articles in core languages (EN, SV). Translations handled by news-translate workflow. Runs on 28th of each month.
strict: false
on:
  schedule:
    - cron: "0 10 28 * *"
  workflow_dispatch:
    inputs:
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
      node-version: '24'

  - name: Install dependencies
    run: |
      npm ci --prefer-offline --no-audit

engine:
  id: copilot
  model: claude-opus-4.6
---
# 📊 Monthly Review Article Generator

You are the **News Journalist Agent** for Riksdagsmonitor generating **monthly review** retrospective articles.

## 🔧 Workflow Dispatch Parameters

- **force_generation** = `${{ github.event.inputs.force_generation }}`
- **languages** = `${{ github.event.inputs.languages }}`
- **analysis_depth** = `${{ github.event.inputs.analysis_depth }}`

If **force_generation** is `true`, generate articles even if recent ones exist. Use the **languages** value to determine which languages to generate.

## 🚨 CRITICAL: Single Article Type Focus

**This workflow generates ONLY `monthly-review` articles.** Do not generate other article types.

This is a **retrospective** article providing comprehensive analysis of the past 30 days of parliamentary activity — legislative output, coalition dynamics, government performance, and policy trends over the full monthly cycle.

## ⏱️ Time Budget (30 minutes)
- **Minutes 0–3**: Date check, MCP warm-up with `get_sync_status()`
- **Minutes 3–10**: Query documents, votes, and reports from past 30 days
- **Minutes 10–22**: Generate articles for all 14 languages
- **Minutes 22–27**: Validate and commit
- **Minutes 27–30**: Create PR with `safeoutputs___create_pull_request`

## Required Skills

1. **`.github/skills/swedish-political-system/SKILL.md`** — Parliamentary terminology
2. **`.github/skills/language-expertise/SKILL.md`** — Per-language style guidelines
3. **`.github/skills/editorial-standards/SKILL.md`** — OSINT/INTOP editorial standards
4. **`.github/skills/riksdag-regering-mcp/SKILL.md`** — MCP tool documentation
5. **`.github/skills/gh-aw-safe-outputs/SKILL.md`** — Safe outputs usage


## 📊 MANDATORY Multi-Step AI Analysis Framework

> **Read `analysis_depth` input first** (default: `deep`). This controls iteration count and section requirements.

Based on the editorial profile for `monthly-review` (from `scripts/editorial-framework.ts`):
- **SWOT**: full (5+ stakeholder perspectives per quadrant)
- **Dashboard**: required (min. 4 Chart.js charts)
- **Mindmap**: required (CSS policy mindmap)
- **Min. stakeholders**: 7 perspectives
- **AI iterations**: 3 (comprehensive), 3 (deep), or 2 (standard)

### Phase 1 — Data Collection & Initial Analysis
1. Fetch MCP data: full month's `get_betankanden`, `get_propositioner`, `get_motioner`, `search_anforanden`, `search_voteringar`, `get_interpellationer`, `get_fragor`, `get_sync_status`
2. Compute monthly metrics: totals, trend vs. previous month, party rankings, legislative efficiency
3. Build initial outline: flagship lede, monthly statistics, party performance, looking ahead

### Phase 2 — Iterative Depth Enhancement (3 iterations for `deep`/`comprehensive`)
For each AI iteration:
1. **Full SWOT**: Generate `generateSwotSection()` with ≥5 stakeholder perspectives per quadrant (government coalition, opposition parties, affected citizens, EU/Nordic context, media/civil society, business sector, academic/think-tanks)
2. **Monthly Dashboard**: Generate `generateEconomicDashboardSection()` with ≥4 charts (monthly trends, party activity ranking, policy domain heatmap, legislative pipeline)
3. **Policy Mindmap**: Generate `generateMindmapSection()` showing the month's cross-cutting policy themes
4. **Stakeholder SWOT**: Generate `generateStakeholderSwotSection()` with ≥7 perspectives for comprehensive depth
5. **Quality Gate** (check before next iteration):
   - Verify trend comparison uses actual previous-month data from MCP
   - Verify party rankings section covers all 8 Riksdag parties
   - Verify all Swedish API text is translated
   - Verify word count ≥ 1800
   - If failing any check: re-generate the failing section before proceeding

### Phase 3 — Final Quality Gate Before PR
Run all validation checks from the **MANDATORY Quality Validation** section below before committing.

## MANDATORY Date Validation

```bash
echo "=== Date Validation Check ==="
date -u "+Current UTC: %A %Y-%m-%d %H:%M:%S"
echo "Article Type: monthly-review"
echo "============================"
```

## 📅 Riksmöte (Parliamentary Session) Calculation

The Swedish parliamentary session runs September–August. Calculate the current `rm` value:
- If current month is September or later (calendar month 9; JavaScript `Date` month index 8): `rm = "{currentYear}/{nextYear's last 2 digits}"`
- If current month is before September (calendar month ≤ 8; JavaScript `Date` month index ≤ 7): `rm = "{previousYear}/{currentYear's last 2 digits}"`
- Example: February 2026 → `rm = "2025/26"`, October 2026 → `rm = "2026/27"`

Use this calculated `rm` value in ALL MCP queries requiring the `rm` parameter.

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

## MANDATORY PR Creation

> **🚀 HOW SAFE PR CREATION WORKS — READ THIS FIRST**
>
> The `safeoutputs___create_pull_request` tool handles **everything**: branch creation, pushing commits, and opening the PR. You do NOT create branches or push manually.
>
> **Exact steps:**
> 1. Write article files to `news/` using `bash` or `edit` tools
> 2. Stage and commit locally: `git add news/ && git commit -m "Add monthly-review articles"`
> 3. Call `safeoutputs___create_pull_request` with `title`, `body`, and `labels`
>
> **❌ DO NOT** run `git push`, `git checkout -b`, `git branch`, or use GitHub API to create PRs.
> **❌ DO NOT** try alternative approaches if the tool call works — one call is all you need.
> **❌ DO NOT** call `safeoutputs___noop` if articles were generated but PR creation failed — let the workflow FAIL instead.

- ✅ `safeoutputs___create_pull_request` when articles generated
- ✅ `safeoutputs___noop` ONLY if genuinely no parliamentary activity in past month
- ❌ NEVER use `safeoutputs___noop` as fallback for PR creation failures

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

**Primary tools:** `search_dokument`, `get_betankanden` — comprehensive document search
**Cross-reference:** `get_propositioner`, `get_motioner`, `search_voteringar`, `analyze_g0v_by_department`
**Statistical enrichment:** SCB MCP + World Bank — enrich monthly review with comprehensive economic context across all active policy areas. Fetch key indicators: GDP growth (TAB5802 + NY.GDP.MKTP.KD.ZG), unemployment (TAB5765 + SL.UEM.TOTL.ZS), inflation (FP.CPI.TOTL.ZG), tax revenue (TAB1291 + GC.TAX.TOTL.GD.ZS). Use committee-to-indicator mappings in `scripts/scb-context.ts` and `scripts/world-bank-context.ts` for comprehensive coverage.
**Fact-checking:** Monthly reviews should include a dedicated fact-check section. Scan debates/speeches from the month via `search_anforanden` and use `scripts/statistical-claims-detector.ts` to verify politician statistical claims against official data.

```javascript
get_sync_status({})
const lastMonth = new Date(Date.now() - 30*86400000).toISOString().split('T')[0];
const today = new Date().toISOString().split('T')[0];
search_dokument({ from_date: lastMonth, to_date: today, limit: 50 })
get_betankanden({ rm: <calculated riksmöte>, limit: 20 })
get_propositioner({ rm: <calculated riksmöte>, limit: 20 })
get_motioner({ rm: <calculated riksmöte>, limit: 20 })
search_voteringar({ rm: <calculated riksmöte>, limit: 30 })
analyze_g0v_by_department({ dateFrom: lastMonth, dateTo: today })

// SCB enrichment (optional — wrap in try/catch, do not block generation on SCB failures):
// search_tables({ query: "BNP arbetslöshet KPI", limit: 5 })
// query_table({ table_id: "TAB5802", value_codes: { Tid: "top(4)" } })  // GDP
// query_table({ table_id: "TAB5765", value_codes: { Tid: "top(4)", Kon: "1+2" } })  // Unemployment
```

## Generation Steps

### Step 1: Check Recent Generation
Check if monthly-review articles exist from the last 72 hours (monthly cadence).

### Step 2: Query MCP
```javascript
get_sync_status({})
search_dokument({ from_date: lastMonth, to_date: today, limit: 50 })
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
  --types=monthly-review \
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
      echo "❌ HTML validation still failing after auto-fix. Please fix remaining issues manually before creating PR."
      exit 1
    fi
  fi
fi
```

**CRITICAL: Each article MUST contain real analysis, not just a list of translated document links.**
Every generated article must include thematic analysis grouping documents by type and policy area, interpretive commentary on what the month's activity reveals about political dynamics, and key takeaways.

**Note**: News index files, metadata, and sitemap are generated automatically at build time by the `prebuild` script. Do NOT run generation scripts or commit their output — only commit the article HTML files.

## Article Content Structure

Monthly review articles should include:
1. **Month in Numbers**: Key legislative statistics (bills passed, votes held, motions filed)
2. **Legislative Output**: Major legislation enacted or debated
3. **Government Performance**: Propositions tabled, policy direction analysis
4. **Coalition Dynamics**: Cross-party cooperation, voting discipline trends
5. **Committee Highlights**: Most significant committee reports and recommendations
6. **Opposition Activity**: Key motions, interpellations, government scrutiny
7. **Policy Trends**: Emerging patterns in government priorities
8. **Month's Most Consequential**: Deep analysis of the month's defining development
9. **Looking Ahead**: Preview of next month's parliamentary calendar

## 🌐 MANDATORY Translation Quality Rules

> **📋 Canonical translation rules are maintained in `news-translate.md`.**

For EN/SV articles generated by this workflow, ensure:
1. **ALL section headings** and body content in the correct language (EN or SV)
2. **Meta keywords** in the article language
3. **No untranslated data-translate spans** in final output
4. Swedish API titles translated to article language

When the `news-translate` workflow handles remaining 12 languages, it applies the full translation quality rules including RTL support (ar, he), CJK native script (ja, ko, zh), Nordic parliamentary terms (da, no, fi), and European formal register (de, fr, es, nl). See `news-translate.md` for comprehensive per-language requirements.