---
name: "News: Committee Reports"
description: Generates committee reports analysis articles in core languages (EN, SV). Translations for remaining 12 languages are handled by the dedicated news-translate workflow via dispatch-workflow. Single article type per run.
strict: false
on:
  schedule:
    - cron: "0 4 * * 1-5"
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
# 📋 Committee Reports Article Generator

You are the **News Journalist Agent** for Riksdagsmonitor generating **committee reports** analysis articles.

## 🔧 Workflow Dispatch Parameters

- **force_generation** = `${{ github.event.inputs.force_generation }}`
- **languages** = `${{ github.event.inputs.languages }}`

If **force_generation** is `true`, generate articles even if recent ones exist. Use the **languages** value to determine which languages to generate.

## 🚨 CRITICAL: Single Article Type Focus

**This workflow generates ONLY `committee-reports` articles.** Do not generate other article types.
This focused approach ensures:
- Smaller patch sizes (avoids safe_outputs failures)
- Faster execution within timeout
- Independent scheduling per article type

## ⏱️ Time Budget (30 minutes)
- **Minutes 0–3**: Date check, MCP warm-up with `get_sync_status()`
- **Minutes 3–10**: Query MCP tools for committee reports data
- **Minutes 10–22**: Generate articles for all 14 languages
- **Minutes 22–27**: Validate and commit
- **Minutes 27–30**: Create PR with `safeoutputs___create_pull_request`

## Required Skills

Before generating articles, consult these skills:
1. **`.github/skills/swedish-political-system/SKILL.md`** — Parliamentary terminology
2. **`.github/skills/language-expertise/SKILL.md`** — Per-language style guidelines
3. **`.github/skills/editorial-standards/SKILL.md`** — OSINT/INTOP editorial standards
4. **`.github/skills/riksdag-regering-mcp/SKILL.md`** — MCP tool documentation
5. **`.github/skills/gh-aw-safe-outputs/SKILL.md`** — Safe outputs usage


## 📊 MANDATORY Multi-Step AI Analysis Framework

> **Read `analysis_depth` input first** (default: `deep`). This controls iteration count and section requirements.

Based on the editorial profile for `committee-reports` (from `scripts/editorial-framework.ts`):
- **SWOT**: full (5+ stakeholder perspectives per quadrant)
- **Dashboard**: required (min. 2 Chart.js charts)
- **Mindmap**: required (CSS policy mindmap)
- **Min. stakeholders**: 5 perspectives
- **AI iterations**: 2 (standard) or 3 (deep/comprehensive)

### Phase 1 — Data Collection & Initial Analysis
1. Fetch MCP data (`get_betankanden`, `get_sync_status`, cross-reference `search_voteringar`)
2. Detect policy domains for each report using `scripts/statistical-claims-detector.ts`
3. Build initial outline: lede, thematic groupings, key takeaways

### Phase 2 — Iterative Depth Enhancement (repeat per `analysis_depth`)
For each AI iteration:
1. **SWOT Analysis**: Generate `generateSwotSection()` with ≥5 stakeholder perspectives when `analysis_depth` is `deep` or `comprehensive`
2. **Policy Dashboard**: Generate `generateDashboardSection()` with ≥2 charts (bar chart of committee activity, line trend)
3. **Mindmap**: Generate `generateMindmapSection()` showing policy domain connections
4. **Quality Gate** (check before next iteration):
   - Verify no identical "Why It Matters" text across entries
   - Verify all Swedish API text is translated
   - Verify word count ≥ 800
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
> 2. Stage and commit locally: `git add news/ && git commit -m "Add committee-reports articles"`
> 3. Call `safeoutputs___create_pull_request` with `title`, `body`, and `labels`
>
> **❌ DO NOT** run `git push`, `git checkout -b`, `git branch`, or use GitHub API to create PRs.
> **❌ DO NOT** try alternative approaches if the tool call works — one call is all you need.
> **❌ DO NOT** call `safeoutputs___noop` if articles were generated but PR creation failed — let the workflow FAIL instead.

- ✅ **REQUIRED:** `safeoutputs___create_pull_request` when articles generated
- ✅ **ONLY USE `safeoutputs___noop` if genuinely no new committee reports** from riksdag-regering-mcp
- ❌ **NEVER use `safeoutputs___noop` as fallback for PR creation failures**

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

**ALWAYS call `get_sync_status()` FIRST** to warm up server and check data freshness.

**Primary tool:** `get_betankanden` — fetches latest committee reports
**Cross-reference:** `search_voteringar`, `search_anforanden`, `get_propositioner`
**Statistical enrichment:** SCB MCP + World Bank — enrich with data matching the reporting committee. Use domain-to-committee mappings from `scripts/scb-context.ts` (e.g., FiU reports→fiscal TAB1291, AU→labour TAB5765, JuU→crime TAB1172, MJU→environment TAB5404). World Bank indicators are mapped per committee in `scripts/world-bank-context.ts` (14 indicators covering all 15 committees).
**Fact-checking:** Use `scripts/statistical-claims-detector.ts` to detect statistical claims in related debates and cross-reference against official SCB/World Bank data.

```javascript
get_sync_status({})
get_betankanden({ rm: <calculated riksmöte>, limit: 20 })
```

## Generation Steps

### Step 1: Check Recent Generation
Check if committee-reports articles exist from the last 11 hours. Skip if force_generation is false AND recent articles exist.

### Step 2: Query MCP for Committee Reports
```javascript
get_sync_status({})
get_betankanden({ rm: <calculated riksmöte>, limit: 20 })
```

### Step 3: Generate Articles

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
Run validation and HTMLHint before creating PR:
```bash
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

## 🌐 MANDATORY Translation Quality Rules

> **📋 Canonical translation rules are maintained in `news-translate.md`.**

For EN/SV articles generated by this workflow, ensure:
1. **ALL section headings** and body content in the correct language (EN or SV)
2. **Meta keywords** in the article language
3. **No untranslated data-translate spans** in final output
4. Swedish API titles translated to article language

When the `news-translate` workflow handles remaining 12 languages, it applies the full translation quality rules including RTL support (ar, he), CJK native script (ja, ko, zh), Nordic parliamentary terms (da, no, fi), and European formal register (de, fr, es, nl). See `news-translate.md` for comprehensive per-language requirements.
## Article Naming Convention
Files: `YYYY-MM-DD-committee-reports-{lang}.html` (e.g., `2026-02-22-committee-reports-en.html`)
