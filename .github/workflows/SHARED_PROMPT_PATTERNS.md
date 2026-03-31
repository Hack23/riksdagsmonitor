# Shared Prompt Patterns for News Workflows

> **Internal reference document** — Not a live workflow. Copy-paste these standardised blocks into every `news-*.md` workflow to ensure consistency.

## 🚨 UNIVERSAL RULE: No Workflow Run Wasted — Always Perform Analysis (applies to ALL workflows)

> **NON-NEGOTIABLE FIRST PRINCIPLE**: Every agentic workflow run MUST produce improved analysis artifacts. No workflow run should ever complete without at least reviewing and improving existing analysis. This applies to ALL workflows — content generation, translation, monitoring, review, and any future workflow type.

````markdown
### Mandatory Analysis Improvement Protocol

> 🚨 **ABSOLUTE RULE**: ALL agentic workflows MUST follow `analysis/methodologies/ai-driven-analysis-guide.md` and produce or improve analysis artifacts on EVERY run. No exceptions. No workflow run is ever "wasted" — at minimum, existing analysis MUST be reviewed and improved.

#### Why This Rule Exists

Every workflow run consumes compute resources and has access to MCP tools, methodology documents, and analysis templates. Failing to produce analysis output from any workflow run is an unacceptable waste. Even workflows whose primary purpose is not analysis (e.g., translation, validation) MUST use their runtime to improve the analysis corpus.

#### Universal Requirements (ALL Workflows)

1. **Read `analysis/methodologies/ai-driven-analysis-guide.md`** — the master guide governing all analysis
2. **Read ALL 6 methodology guides** and **ALL 8 analysis templates** (see Step 2 and Step 3 below)
3. **Check for existing analysis** in `analysis/daily/` for the current date or relevant dates
4. **If existing analysis exists**: Improve, extend, correct, or complete it:
   - Add missing Mermaid diagrams
   - Fill empty SWOT quadrants with evidence-based entries
   - Add dok_id citations where missing
   - Improve risk scores with additional context from MCP data
   - Extend stakeholder analysis with newly available data
   - Correct any factual errors or outdated information
   - Complete any `[REQUIRED]` placeholders
5. **If no existing analysis exists**: Create new analysis following the full protocol (Steps 1–6 in the AI-Driven Analysis section below)
6. **Commit analysis artifacts** to the `analysis/` folder — analysis MUST always be committed alongside any other workflow output

#### For Non-Analysis Workflows (translation, validation, etc.)

Even workflows whose primary task is NOT analysis MUST:
1. **Before primary task**: Read the analysis guide and check for existing analysis needing improvement
2. **During primary task**: Note any new insights from MCP data or document processing
3. **After primary task**: Review and improve at least one existing analysis file (if any exist for the relevant date)
4. **At commit time**: Include improved analysis alongside primary workflow output

```bash
# Universal analysis check — run at the start of EVERY workflow
ARTICLE_DATE="${ARTICLE_DATE:-$(date -u +%Y-%m-%d)}"
echo "=== Mandatory Analysis Check ==="

# Check for existing analysis needing improvement
EXISTING_ANALYSIS=$(find "analysis/daily/${ARTICLE_DATE}/" -name "*.md" -type f 2>/dev/null | wc -l)
PENDING_ANALYSIS=$(find "analysis/daily/${ARTICLE_DATE}/" -name "*-analysis.md" -type f 2>/dev/null | wc -l)
REQUIRED_PLACEHOLDERS=$(grep -rl '\[REQUIRED\]' "analysis/daily/${ARTICLE_DATE}/" 2>/dev/null | wc -l)
MISSING_MERMAID=$(find "analysis/daily/${ARTICLE_DATE}/" -name "*.md" -type f -exec sh -c 'grep -qL "```mermaid" "$1" && echo "$1"' _ {} \; 2>/dev/null | wc -l)

echo "📊 Existing analysis files: $EXISTING_ANALYSIS"
echo "📊 Per-file analyses: $PENDING_ANALYSIS"
echo "⚠️ Files with [REQUIRED] placeholders: $REQUIRED_PLACEHOLDERS"
echo "⚠️ Files missing Mermaid diagrams: $MISSING_MERMAID"

if [ "$EXISTING_ANALYSIS" -gt 0 ]; then
  echo "📋 Existing analysis found — MUST review and improve during this workflow run"
else
  echo "📋 No existing analysis for $ARTICLE_DATE — check nearby dates for improvement opportunities"
  for DAYS_BACK in 1 2 3; do
    CHECK_DATE=$(date -u -d "$ARTICLE_DATE - $DAYS_BACK days" +%Y-%m-%d 2>/dev/null || date -u -v-${DAYS_BACK}d -j -f "%Y-%m-%d" "$ARTICLE_DATE" +%Y-%m-%d 2>/dev/null)
    [ -z "$CHECK_DATE" ] && continue
    NEARBY_ANALYSIS=$(find "analysis/daily/${CHECK_DATE}/" -name "*.md" -type f 2>/dev/null | wc -l)
    if [ "$NEARBY_ANALYSIS" -gt 0 ]; then
      echo "  📍 Found $NEARBY_ANALYSIS analysis files for $CHECK_DATE — improve these"
      break
    fi
  done
fi
echo "================================"
```

#### Analysis Improvement Checklist (for existing analysis files)

When improving existing analysis, apply these checks:
- [ ] Every file has ≥1 color-coded Mermaid diagram (add if missing)
- [ ] No `[REQUIRED]` placeholders remain (fill with evidence-based content)
- [ ] SWOT entries cite specific dok_id, vote counts, party names (not generic text)
- [ ] Risk matrix has numeric L×I scores (not placeholder values)
- [ ] Stakeholder analysis covers all 6 groups with evidence (not generic perspectives)
- [ ] Forward indicators have specific timelines and triggers (not vague predictions)
- [ ] Confidence labels (`[HIGH]`/`[MEDIUM]`/`[LOW]`) present on all analytical claims
- [ ] Writing follows `analysis/methodologies/political-style-guide.md` standards

> **Key principle**: If a workflow cannot create NEW analysis (e.g., no new data), it MUST still improve EXISTING analysis. The analysis corpus should get better with every workflow run, never stay the same or degrade.
````

## Shared Skill Block (copy into every workflow)

```markdown
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
```

## Standardised Analysis Depth Gate (copy into every workflow)

```markdown
### Standardised Analysis Depth Gate

> ⚠️ **Default is `deep`** — not `standard`. Analysis must always produce publication-quality output with Mermaid diagrams and evidence tables.

| Depth | AI iterations | SWOT stakeholders | Charts | Mindmap | Min. analysis time |
|-------|--------------|-------------------|--------|---------|-------------------|
| standard | 1-2 | ≥3 | ≥1 | optional | 10 minutes |
| deep | 2-3 | ≥5 | ≥2 | required | 15 minutes |
| comprehensive | 3+ | ≥7 | ≥3 | required | 20 minutes |

**Minimum requirement for ALL depths**: Every analysis file must contain at least 1 color-coded Mermaid diagram, structured evidence tables with dok_id citations, and follow the corresponding template structure exactly. Plain prose without tables/diagrams is NEVER acceptable regardless of depth level.
```

## MANDATORY Playwright Validation (copy into every content workflow)

````markdown
### Playwright Visual Validation
Run Playwright validation before creating the PR:
```bash
# HTMLHint validation
npx htmlhint "news/*-{type}-*.html"

# Playwright visual validation (accessibility, RTL, responsive)
npx tsx scripts/validate-articles-playwright.ts --filter "{type}"

# Validate JSON-LD cross-references
npx tsx scripts/validate-cross-references.ts news/*-{type}-*.html
```
````

## Standardised Deduplication Check (copy into every content workflow)

```bash
# Check if articles for today already exist
EXISTING=$(ls news/${ARTICLE_DATE}-${ARTICLE_TYPE}-en.html 2>/dev/null | wc -l)
if [ "$EXISTING" -gt 0 ] && [ "${FORCE_GENERATION}" != "true" ]; then
  echo "📋 Articles for $ARTICLE_DATE/$ARTICLE_TYPE already exist — skipping (use FORCE_GENERATION=true to override)"
  exit 0
fi
```

## 🚨 MANDATORY: AI-Driven Analysis Using Methods & Templates (copy into every analysis workflow)

> **NON-NEGOTIABLE**: The AI agent's PRIMARY job is to create real analysis for every piece of data or document downloaded from MCP. Scripts generate stubs — the AI MUST replace them with full template-compliant analysis. This is NOT optional.

````markdown
### AI-Driven Analysis Protocol

> 🚨 **ABSOLUTE RULE**: Every agentic workflow MUST:
> 1. **Download data** from MCP (scripts try first; if they fail or download 0, agent uses direct MCP tool calls and fixes scripts)
> 2. **Read ALL 6 methodology guides** before doing any analysis
> 3. **Read ALL 8 analysis templates** before writing any analysis files
> 4. **Spend AT LEAST 15 MINUTES on analysis** — this is a hard minimum, not a suggestion. Analysis that takes less than 15 minutes is REJECTED.
> 5. **Create analysis for EVERY document/data piece** following the templates exactly
> 6. **Pass the quality gate** (see below) — every analysis file must contain Mermaid diagrams, evidence tables, and dok_id citations
> 7. **Commit both data AND analysis** — never one without the other

#### ⏱️ Mandatory Minimum Analysis Time: 15 Minutes

> 🚨 **HARD RULE**: The AI agent MUST spend **at least 15 minutes** on analysis work. This means:
> - Reading ALL 6 methodology guides (not skimming — reading fully)
> - Reading ALL 8 analysis templates (not skimming — reading fully)
> - Creating analysis for EVERY document following templates EXACTLY
> - Including color-coded Mermaid diagrams with REAL data in every analysis file
> - Filling ALL evidence tables with dok_id, confidence, impact columns
>
> **Why 15 minutes?** The templates require structured tables, Mermaid diagrams, evidence citations, and multi-section analysis. This cannot be done properly in less than 15 minutes. PR #1452 demonstrated that rushing analysis (< 10 min) produces unacceptable results: plain text without tables, no Mermaid diagrams, no dok_id citations, no template structure.
>
> **Enforcement**: Before committing, run the quality gate check below. If it fails, you MUST spend more time improving the analysis until it passes.

#### Step 1: Download Data (scripts + fallback to direct MCP calls)

Try the script pipeline first:
```bash
source scripts/mcp-setup.sh && npx tsx scripts/pre-article-analysis.ts --date "$ARTICLE_DATE" --limit 50 2>&1 | tee /tmp/pipeline-output.log
```

Check results:
```bash
DATA_JSON_COUNT=$(find analysis/data/ -name "*.json" -type f 2>/dev/null | wc -l)
echo "📊 JSON data files: $DATA_JSON_COUNT"
```

If `DATA_JSON_COUNT=0`: **the agent MUST diagnose script failures (read error logs, fix code issues, re-run) OR use direct MCP tool calls as fallback.** Save each MCP response as JSON to `analysis/data/documents/{type}/{dok_id}.json`. Never give up on downloading data unless MCP itself is down.

#### Step 2: Read ALL Methodology Guides (MANDATORY — do this BEFORE any analysis)

The agent MUST read (using `view` or `cat`) every one of these files before writing any analysis. These define HOW to analyze:

1. **`analysis/methodologies/ai-driven-analysis-guide.md`** — Master guide with bad vs. good examples
2. **`analysis/methodologies/political-swot-framework.md`** — Evidence-based SWOT with confidence hierarchy
3. **`analysis/methodologies/political-risk-methodology.md`** — 5×5 Likelihood × Impact risk matrix
4. **`analysis/methodologies/political-threat-framework.md`** — Political Threat Taxonomy (Attack Trees, Kill Chain, Diamond Model)
5. **`analysis/methodologies/political-classification-guide.md`** — Sensitivity, domain, urgency taxonomy
6. **`analysis/methodologies/political-style-guide.md`** — Writing standards and evidence density

#### Step 3: Read ALL Analysis Templates (MANDATORY — do this BEFORE writing any files)

The agent MUST read every template. These define WHAT the output must look like:

1. **`analysis/templates/per-file-political-intelligence.md`** — Per-document analysis output format
2. **`analysis/templates/synthesis-summary.md`** — Daily synthesis (SYN-ID, Intelligence Dashboard)
3. **`analysis/templates/risk-assessment.md`** — Risk assessment (RSK-ID, Heat Map, L×I scores)
4. **`analysis/templates/political-classification.md`** — Classification (CLS-ID, Decision Tree)
5. **`analysis/templates/threat-analysis.md`** — Threat analysis (THR-ID, Threat Taxonomy Network)
6. **`analysis/templates/swot-analysis.md`** — SWOT analysis (SWT-ID, Quadrant Mapping)
7. **`analysis/templates/stakeholder-impact.md`** — Stakeholder impact (STA-ID, 6 Groups, Impact Radar)
8. **`analysis/templates/significance-scoring.md`** — Significance scoring (SIG-ID, 5 Dimensions)

#### Step 4: Create Per-File Analysis for EVERY Downloaded Document

For EACH document in `analysis/data/`:

1. **Read the JSON data** — extract dok_id, titel, datum, parti, organ, etc.
2. **Apply ALL 6 analytical lenses** using the methodologies:
   - **Classification** — Sensitivity (PUBLIC/SENSITIVE/RESTRICTED), Domain (13 codes), Urgency, Significance (0–10)
   - **SWOT** — Government + Opposition impact with evidence (cite dok_id, vote counts, party names)
   - **Risk** — 5×5 Likelihood × Impact matrix with numeric scores
   - **Political Threat Taxonomy** — 6 democratic function categories (Narrative Integrity, Legislative Integrity, Accountability, Transparency, Democratic Process, Power Balance)
   - **Stakeholders** — 6 groups (Citizens, Government, Opposition, Business, Civil Society, International)
   - **Forward Indicators** — Specific watch items with concrete timelines and triggers
3. **Write `{dok_id}-analysis.md`** alongside the data file, following `per-file-political-intelligence.md` template EXACTLY
4. **Include ≥1 Mermaid diagram** with REAL data from the document (not placeholder)
5. **Quality gate**: ≥3 evidence citations with dok_id, confidence labels on all claims, zero `[REQUIRED]` placeholders

> ⛔ **ANTI-PATTERN WARNING — REJECTED OUTPUT PATTERNS:**
> The following patterns indicate **unreplaced script stubs** and will FAIL the quality gate:
> - `"_No strengths identified_"` / `"_No weaknesses identified_"` — empty SWOT quadrants
> - `"this document requires assessment of policy execution"` — generic boilerplate perspective text
> - `"this document warrants scrutiny for alignment with citizen welfare"` — template filler, not analysis
> - `"this document may affect business environment"` — generic economic perspective
> - `"this document has low newsworthiness (score: XX/100)"` — script-generated placeholder
> - `"this document must be assessed for EU regulatory alignment"` — generic international perspective
> - SWOT quadrants with only `_No X identified_` entries — indicates AI skipped analysis
> - Stakeholder perspectives without SPECIFIC document data (dok_id, vote counts, party names)
> - Analysis with 0 Mermaid diagrams and 0 evidence table rows
>
> **CORRECT APPROACH**: Read the actual JSON data file, extract SPECIFIC facts (dok_id, committee, policy area, parties involved), then write REAL analysis citing those facts. Every SWOT entry must reference actual document content.

#### Step 5: Create/Rewrite ALL Daily Synthesis Files Following Templates

For each file in `analysis/daily/$ARTICLE_DATE/`, the agent MUST rewrite it to match its template EXACTLY:

| Daily File | Template to Follow | Minimum Requirements |
|------------|-------------------|---------------------|
| `synthesis-summary.md` | `analysis/templates/synthesis-summary.md` | SYN-ID, Intelligence Dashboard (Mermaid), Top Findings table, Aggregated SWOT, Risk Landscape, Threat Summary, Stakeholder Impact, Narrative Direction, Forward Indicators, Artifacts Inventory with ✅/⚠️/❌ status |
| `risk-assessment.md` | `analysis/templates/risk-assessment.md` | RSK-ID, Risk Heat Map (Mermaid quadrant chart), ≥2 risks with L×I numeric scores, Coalition Stability Risk, Escalation Rules |
| `classification-results.md` | `analysis/templates/political-classification.md` | CLS-ID, Sensitivity Decision Tree (Mermaid), per-document table with sensitivity/domain/urgency/significance |
| `threat-analysis.md` | `analysis/templates/threat-analysis.md` | THR-ID, Threat Taxonomy Network (Mermaid), ALL 6 threat categories with ≥1 threat each (severity 1-5), Threat Actor Mapping |
| `swot-analysis.md` | `analysis/templates/swot-analysis.md` | SWT-ID, Quadrant Mapping (Mermaid mindmap), ≥2 filled quadrants with dok_id evidence, Coalition + Opposition SWOT |
| `stakeholder-perspectives.md` | `analysis/templates/stakeholder-impact.md` | STA-ID, Impact Radar (Mermaid), ALL 6 stakeholder groups assessed with impact level and timeline |
| `significance-scoring.md` | `analysis/templates/significance-scoring.md` | SIG-ID, 5-dimension scoring (Parliamentary, Policy Impact, Public Interest, Urgency, Cross-party), Composite Score, Publication Decision |

**Template compliance checklist (ALL must be true):**
- [ ] Every file has its template's metadata header (ID, date, riksmöte, confidence)
- [ ] Every file has ≥1 Mermaid diagram with color-coded nodes and REAL data
- [ ] Every Mermaid diagram uses color-coded `style` directives (e.g., `fill:#dc3545,color:#fff` for red, `fill:#28a745,color:#fff` for green)
- [ ] Risk assessment has ≥2 risks with L×I numeric scores
- [ ] SWOT has structured evidence tables with columns: `#`, `Statement`, `Evidence (dok_id)`, `Confidence`, `Impact`, `Entry Date`
- [ ] SWOT has ≥2 filled quadrants with evidence citations (dok_id)
- [ ] Threat analysis covers ALL 6 Political Threat Taxonomy categories
- [ ] Significance scoring uses 5-dimension model with publication decision
- [ ] Synthesis references ALL sibling files with ✅/⚠️/❌ status
- [ ] No `[REQUIRED]` placeholders remaining in any file
- [ ] Every claim cites specific data (dok_id, vote counts, party names, dates)
- [ ] Markdown is human-readable with proper formatting (tables, emoji headers, structured sections)

#### Step 5b: MANDATORY Quality Gate — Run Before Committing

> 🚨 **BLOCKING**: Do NOT proceed to commit until this quality gate passes. If it fails, go back and improve the analysis files.

Run this bash check on ALL analysis files (daily synthesis AND per-file analyses in `documents/`) before committing:

```bash
ANALYSIS_DIR="analysis/daily/${ARTICLE_DATE:-$(date -u +%Y-%m-%d)}"
QUALITY_PASS=true
FAIL_COUNT=0
WARN_COUNT=0

echo "=== 🔍 Analysis Quality Gate Check ==="

# Collect ALL analysis markdown files (daily synthesis + per-file in documents/)
ALL_MD_FILES=$(find "$ANALYSIS_DIR" -name "*.md" -type f 2>/dev/null)
DAILY_MD_FILES=$(find "$ANALYSIS_DIR" -maxdepth 1 -name "*.md" -type f 2>/dev/null)
PERFILE_MD_FILES=$(find "$ANALYSIS_DIR/documents" -name "*-analysis.md" -type f 2>/dev/null)
PERFILE_COUNT=$(echo "$PERFILE_MD_FILES" | grep -c '.' 2>/dev/null || true)
echo "📊 Daily synthesis files: $(echo "$DAILY_MD_FILES" | grep -c '.' 2>/dev/null || true)"
echo "📊 Per-file analysis files: $PERFILE_COUNT"

# Check 1: Every daily synthesis file must contain at least 1 Mermaid diagram
echo ""
echo "--- Check 1: Mermaid diagrams in daily synthesis files ---"
for f in $DAILY_MD_FILES; do
  [ ! -f "$f" ] && continue
  MERMAID_COUNT=$(grep -c '```mermaid' "$f" 2>/dev/null) || true
  if [ "${MERMAID_COUNT:-0}" -eq 0 ]; then
    echo "❌ FAIL: $f has NO Mermaid diagrams (minimum: 1)"
    QUALITY_PASS=false
    FAIL_COUNT=$((FAIL_COUNT + 1))
  else
    echo "✅ PASS: $f has $MERMAID_COUNT Mermaid diagram(s)"
  fi
done

# Check 2: Mermaid diagrams must have color-coded style directives
echo ""
echo "--- Check 2: Color-coded style directives in Mermaid diagrams ---"
for f in $DAILY_MD_FILES; do
  [ ! -f "$f" ] && continue
  if grep -q '```mermaid' "$f" 2>/dev/null; then
    STYLE_COUNT=$(grep -c 'style.*fill:#' "$f" 2>/dev/null) || true
    if [ "${STYLE_COUNT:-0}" -eq 0 ]; then
      echo "❌ FAIL: $f has Mermaid diagram(s) but NO color-coded style directives"
      QUALITY_PASS=false
      FAIL_COUNT=$((FAIL_COUNT + 1))
    else
      echo "✅ PASS: $f has $STYLE_COUNT color-coded style directive(s)"
    fi
  fi
done

# Check 3: No [REQUIRED] placeholders remaining
echo ""
echo "--- Check 3: No [REQUIRED] placeholders ---"
for f in $ALL_MD_FILES; do
  [ ! -f "$f" ] && continue
  REQ_COUNT=$(grep -c '\[REQUIRED\]' "$f" 2>/dev/null) || true
  if [ "${REQ_COUNT:-0}" -gt 0 ]; then
    echo "❌ FAIL: $f has $REQ_COUNT unfilled [REQUIRED] placeholders"
    QUALITY_PASS=false
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done

# Check 4: SWOT analysis must have evidence tables with dok_id
echo ""
echo "--- Check 4: SWOT evidence tables ---"
SWOT_FILE="$ANALYSIS_DIR/swot-analysis.md"
if [ -f "$SWOT_FILE" ]; then
  TABLE_COUNT=$(grep -c '|.*dok_id\||.*Evidence' "$SWOT_FILE" 2>/dev/null) || true
  if [ "${TABLE_COUNT:-0}" -eq 0 ]; then
    echo "❌ FAIL: swot-analysis.md has NO evidence tables with dok_id columns"
    QUALITY_PASS=false
    FAIL_COUNT=$((FAIL_COUNT + 1))
  else
    echo "✅ PASS: swot-analysis.md has evidence tables"
  fi
fi

# Check 5: Analysis files must have structured tables (not just plain prose)
echo ""
echo "--- Check 5: Structured tables in daily synthesis ---"
for f in $DAILY_MD_FILES; do
  [ ! -f "$f" ] && continue
  TABLE_COUNT=$(grep -c '^|' "$f" 2>/dev/null) || true
  if [ "${TABLE_COUNT:-0}" -lt 3 ]; then
    echo "⚠️ WARNING: $f has only $TABLE_COUNT table rows — templates require structured tables"
    WARN_COUNT=$((WARN_COUNT + 1))
  fi
done

# Check 6: Per-file analyses in documents/ must NOT be stubs/boilerplate
echo ""
echo "--- Check 6: Per-file analyses are NOT stubs (documents/ subdirectory) ---"
STUB_PERFILE=0
for f in $PERFILE_MD_FILES; do
  [ ! -f "$f" ] && continue
  BASENAME=$(basename "$f")
  # Detect known stub/boilerplate patterns that scripts generate as placeholders
  STUB_SCORE=0
  # Pattern 1: Empty SWOT quadrants ("_No strengths identified_", "_No weaknesses identified_", etc.)
  EMPTY_SWOT=$(grep -cE '_No (strengths|weaknesses|opportunities|threats) identified_' "$f" 2>/dev/null || true)
  if [ "${EMPTY_SWOT:-0}" -ge 2 ]; then
    STUB_SCORE=$((STUB_SCORE + 2))
  fi
  # Pattern 2: Generic boilerplate perspective text (script-generated template text)
  BOILERPLATE=$(grep -c 'this document requires assessment of\|this document warrants scrutiny for\|this document may affect business\|this document has low newsworthiness\|this document must be assessed for' "$f" 2>/dev/null) || true
  if [ "${BOILERPLATE:-0}" -ge 2 ]; then
    STUB_SCORE=$((STUB_SCORE + 2))
  fi
  # Pattern 3: No Mermaid diagrams in per-file analysis
  MERMAID_COUNT=$(grep -c '```mermaid' "$f" 2>/dev/null) || true
  if [ "${MERMAID_COUNT:-0}" -eq 0 ]; then
    STUB_SCORE=$((STUB_SCORE + 1))
  fi
  # Pattern 4: No evidence table rows (per-file must have structured tables)
  TABLE_COUNT=$(grep -c '^|' "$f" 2>/dev/null) || true
  if [ "${TABLE_COUNT:-0}" -lt 2 ]; then
    STUB_SCORE=$((STUB_SCORE + 1))
  fi
  # FAIL if stub score >= 3 (multiple stub indicators = unreplaced boilerplate)
  if [ "${STUB_SCORE:-0}" -ge 3 ]; then
    echo "❌ FAIL: $BASENAME is a stub/boilerplate (score=$STUB_SCORE) — AI MUST replace with real template-compliant analysis"
    STUB_PERFILE=$((STUB_PERFILE + 1))
    QUALITY_PASS=false
    FAIL_COUNT=$((FAIL_COUNT + 1))
  elif [ "${STUB_SCORE:-0}" -ge 2 ]; then
    echo "⚠️ WARNING: $BASENAME has stub-like patterns (score=$STUB_SCORE) — verify analysis is real, not boilerplate"
    WARN_COUNT=$((WARN_COUNT + 1))
  else
    echo "✅ PASS: $BASENAME appears to be real analysis"
  fi
done
if [ "$STUB_PERFILE" -gt 0 ]; then
  echo ""
  echo "🚨 $STUB_PERFILE per-file analyses are stubs. AI MUST read per-file-political-intelligence.md template and REWRITE each stub file with:"
  echo "   - ≥1 Mermaid diagram with color-coded style directives"
  echo "   - Structured evidence tables with dok_id, confidence, impact columns"
  echo "   - Real SWOT analysis (not empty quadrants)"
  echo "   - Specific citations from the document data (not generic text)"
fi

# Check 7: Per-file analyses must exist for downloaded documents
echo ""
echo "--- Check 7: Per-file analysis coverage ---"
if [ -d "$ANALYSIS_DIR/documents" ]; then
  JSON_COUNT=$(find "$ANALYSIS_DIR/documents" -name "*.json" -type f 2>/dev/null | wc -l)
  ANALYSIS_MD_COUNT=$(find "$ANALYSIS_DIR/documents" -name "*-analysis.md" -type f 2>/dev/null | wc -l)
  if [ "${JSON_COUNT:-0}" -gt 0 ] && [ "${ANALYSIS_MD_COUNT:-0}" -lt "${JSON_COUNT:-0}" ]; then
    echo "❌ FAIL: Only $ANALYSIS_MD_COUNT analysis files for $JSON_COUNT data files — every document needs an analysis"
    QUALITY_PASS=false
    FAIL_COUNT=$((FAIL_COUNT + 1))
  elif [ "${JSON_COUNT:-0}" -gt 0 ]; then
    echo "✅ PASS: $ANALYSIS_MD_COUNT analysis files for $JSON_COUNT data files"
  fi
fi

echo ""
echo "=== Quality Gate Summary ==="
echo "Failures: $FAIL_COUNT | Warnings: $WARN_COUNT"
if [ "$QUALITY_PASS" = "true" ]; then
  echo "✅ Quality gate PASSED — analysis is ready to commit"
else
  echo ""
  echo "❌ Quality gate FAILED ($FAIL_COUNT failures) — you MUST improve analysis files before committing"
  echo "📋 Re-read the templates and methodology guides, then rewrite failing files"
  echo "📌 For per-file analyses: read analysis/templates/per-file-political-intelligence.md"
  echo "📌 For daily synthesis: read the corresponding template in analysis/templates/"
  echo "📌 Reference good examples: SWOT.md, THREAT_MODEL.md"
fi
```

> **If the quality gate FAILS**: Go back and rewrite the failing files. For per-file analyses in `documents/`, read `analysis/templates/per-file-political-intelligence.md` and replace stubs with real template-compliant analysis. For daily synthesis files, read the corresponding template in `analysis/templates/`. Do NOT commit until all checks pass.

#### Step 6: Commit Data AND Analysis Together

⚠️ **safe-outputs enforces a 100-file limit per PR.** Always scope `git add` to avoid conflicts between concurrent workflows and stay under the limit.

**Doc-type workflows** (committee-reports, motions, propositions, interpellations) MUST scope to their article-type subdirectory — NOT the parent date directory. Multiple doc-type workflows run on the same date and would conflict if they all stage `analysis/daily/$DATE/`.

**For doc-type workflows** — the `--doc-type` flag passed to `pre-article-analysis.ts` scopes output to a subdirectory (e.g., `analysis/daily/$DATE/committeeReports/`). Use the matching `DOC_TYPE` value in your `git add`:

| Workflow | `--doc-type` value | `DOC_TYPE` for git add |
|----------|-------------------|----------------------|
| news-committee-reports | `committeeReports` | `committeeReports` |
| news-motions | `motions` | `motions` |
| news-propositions | `propositions` | `propositions` |
| news-interpellations | `interpellations` | `interpellations` |

```bash
# Stage analysis scoped to article type — avoids conflicts with other doc-type workflows on the same date
DOC_TYPE="committeeReports"  # One of: committeeReports, motions, propositions, interpellations
git add "analysis/daily/${ARTICLE_DATE:-$(date -u +%Y-%m-%d)}/${DOC_TYPE}/" || true
git add analysis/weekly/ || true
# Enforce safe-outputs 100-file PR limit
STAGED_COUNT=$(git diff --cached --name-only | wc -l)
if [ "$STAGED_COUNT" -gt 90 ]; then
  echo "⚠️ Staged $STAGED_COUNT files exceeds 100-file PR limit. Removing weekly analysis."
  git reset HEAD -- analysis/weekly/ 2>/dev/null || true
  STAGED_COUNT=$(git diff --cached --name-only | wc -l)
fi
echo "📊 Final staged file count: $STAGED_COUNT"
git commit -m "📊 Data + Analysis ($DOC_TYPE) - $ARTICLE_DATE"
```

**For general workflows** (realtime-monitor, evening-analysis, article-generator — no `--doc-type`):
```bash
# Stage analysis scoped to current date
git add "analysis/daily/${ARTICLE_DATE:-$(date -u +%Y-%m-%d)}/" || true
git add analysis/weekly/ || true
git add analysis/data/ || true
# Enforce safe-outputs 100-file PR limit
STAGED_COUNT=$(git diff --cached --name-only | wc -l)
if [ "$STAGED_COUNT" -gt 90 ]; then
  echo "⚠️ Staged $STAGED_COUNT files exceeds 100-file PR limit. Removing bulk data."
  git reset HEAD -- analysis/data/ 2>/dev/null || true
  STAGED_COUNT=$(git diff --cached --name-only | wc -l)
fi
if [ "$STAGED_COUNT" -gt 90 ]; then
  echo "⚠️ Still $STAGED_COUNT files. Removing weekly analysis."
  git reset HEAD -- analysis/weekly/ 2>/dev/null || true
  STAGED_COUNT=$(git diff --cached --name-only | wc -l)
fi
echo "📊 Final staged file count: $STAGED_COUNT"
git commit -m "📊 Data + Analysis - $ARTICLE_DATE"
```

> ❌ **PROHIBITED**: Committing analysis without downloaded data files (unless pruned for 100-file limit)
> ❌ **PROHIBITED**: Committing stub/empty analysis when data exists
> ❌ **PROHIBITED**: Skipping analysis creation — every document MUST have analysis
> ❌ **PROHIBITED**: Writing analysis that doesn't follow the template structure
> ❌ **PROHIBITED**: Using broad `git add analysis/data/ analysis/daily/ analysis/weekly/` without scoping — this accumulates old files and exceeds the 100-file PR limit
> ❌ **PROHIBITED**: Doc-type workflows staging parent date directory `analysis/daily/$DATE/` — this causes conflicts when committee-reports, motions, propositions, and interpellations run on the same date. Always scope to `analysis/daily/$DATE/{docType}/`
````

## 🔧 MANDATORY: Script Debugging & Fixing (copy into every analysis workflow)

> **NON-NEGOTIABLE**: When scripts fail, the agent MUST diagnose and fix the code/script issues. If fixing fails, fall back to direct MCP tool calls for data download. Analysis is ALWAYS done by the AI using templates — not by scripts.

````markdown
### Script Debugging & Fixing Protocol

> 🚨 **ABSOLUTE RULE**: All agentic workflows must analyse and fix any code/script issues to be able to perform their task. When a script fails, the agent MUST NOT silently skip it.

#### When scripts fail or download 0 data:

1. **Read the error output**: `cat /tmp/pipeline-output.log | tail -30`
2. **Diagnose**: MCP_SERVER_URL not set? TypeScript errors? Missing deps? Connection refused?
3. **Fix the script**: read source with `view`, fix with `edit`, re-run
4. **If script fix fails after 2 attempts** → use direct MCP tool calls to download data, save as JSON
5. **If ALL MCP tools also fail** (server truly down) → call `safeoutputs___noop` with error details

#### Remember: Scripts download data, but the AI does the analysis

- Scripts (`pre-article-analysis.ts`) generate **stub files** — these are starting points only
- The AI agent MUST read all methods and templates, then **replace stubs with real analysis**
- This analysis work is the agent's PRIMARY job and must NEVER be skipped
- Even if scripts work perfectly, the agent still must enhance stubs to full template compliance
````

## 🔄 Data Lookback Fallback Strategy (copy into every analysis workflow)

> **MANDATORY**: Never produce empty analysis. If no data exists for today, look back up to 7 days to find data that still needs analysis. Weekend/holiday runs MUST still produce useful output.

````markdown
### Data Lookback Fallback Strategy

> 🚨 **CRITICAL RULE**: An agentic workflow must NEVER produce empty/stub analysis files. If no documents are found for today's date, the workflow MUST look back through previous dates to find data that still needs analysis. Empty analysis = wasted workflow run.

#### Fallback Protocol

After the initial data download attempt for `$ARTICLE_DATE`:

```bash
if [ -z "${ARTICLE_DATE:-}" ]; then
  ARTICLE_DATE="${{ github.event.inputs.article_date }}"
  [ -z "${ARTICLE_DATE:-}" ] && ARTICLE_DATE=$(date -u +%Y-%m-%d)
fi

# Step 1: Check if the requested article date has any analyzed documents (per-date, not session-wide)
MANIFEST_PATH="analysis/daily/$ARTICLE_DATE/data-download-manifest.md"
DATE_DOCS_ANALYZED=0
if [ -f "$MANIFEST_PATH" ]; then
  DATE_DOCS_ANALYZED=$(grep -E '^\*\*Documents Analyzed\*\*' "$MANIFEST_PATH" | sed -E 's/^\*\*Documents Analyzed\*\* *: *([0-9]+).*/\1/' || echo 0)
fi
[ -z "$DATE_DOCS_ANALYZED" ] && DATE_DOCS_ANALYZED=0
echo "📄 Documents analyzed for $ARTICLE_DATE: $DATE_DOCS_ANALYZED"

if [ "$DATE_DOCS_ANALYZED" -eq 0 ]; then
  echo "⚠️ No per-date data for $ARTICLE_DATE — activating lookback fallback"
  # Step 2: Try previous dates (up to 7 days back) until we find one with analyzed documents
  for DAYS_BACK in 1 2 3 4 5 6 7; do
    # Cross-platform date arithmetic: GNU date (-d) on Linux/GitHub Actions, BSD date (-v) on macOS
    LOOKBACK_DATE=$(date -u -d "$ARTICLE_DATE - $DAYS_BACK days" +%Y-%m-%d 2>/dev/null || date -u -v-${DAYS_BACK}d -j -f "%Y-%m-%d" "$ARTICLE_DATE" +%Y-%m-%d 2>/dev/null)
    [ -z "$LOOKBACK_DATE" ] && continue
    echo "🔍 Checking $LOOKBACK_DATE for analyzed data..."
    # First, check if a manifest already exists with non-zero Documents Analyzed
    MANIFEST_PATH="analysis/daily/$LOOKBACK_DATE/data-download-manifest.md"
    DATE_DOCS_ANALYZED=0
    if [ -f "$MANIFEST_PATH" ]; then
      DATE_DOCS_ANALYZED=$(grep -E '^\*\*Documents Analyzed\*\*' "$MANIFEST_PATH" | sed -E 's/^\*\*Documents Analyzed\*\* *: *([0-9]+).*/\1/' || echo 0)
    fi
    [ -z "$DATE_DOCS_ANALYZED" ] && DATE_DOCS_ANALYZED=0
    if [ "$DATE_DOCS_ANALYZED" -gt 0 ]; then
      echo "✅ Found $DATE_DOCS_ANALYZED documents already analyzed for $LOOKBACK_DATE — using this date without re-running analysis"
      ARTICLE_DATE="$LOOKBACK_DATE"
      break
    fi
    # No existing data — run pre-article analysis for this lookback date
    echo "ℹ️ No existing manifest data for $LOOKBACK_DATE — running pre-article analysis"
    # CRITICAL: Source mcp-setup.sh to set MCP_SERVER_URL for the gateway
    source scripts/mcp-setup.sh && npx tsx scripts/pre-article-analysis.ts --date "$LOOKBACK_DATE" --limit 50 2>/dev/null || true
    # Re-check manifest after running analysis
    DATE_DOCS_ANALYZED=0
    if [ -f "$MANIFEST_PATH" ]; then
      DATE_DOCS_ANALYZED=$(grep -E '^\*\*Documents Analyzed\*\*' "$MANIFEST_PATH" | sed -E 's/^\*\*Documents Analyzed\*\* *: *([0-9]+).*/\1/' || echo 0)
    fi
    [ -z "$DATE_DOCS_ANALYZED" ] && DATE_DOCS_ANALYZED=0
    if [ "$DATE_DOCS_ANALYZED" -gt 0 ]; then
      echo "✅ Successfully analyzed $DATE_DOCS_ANALYZED documents for $LOOKBACK_DATE — using this date"
      ARTICLE_DATE="$LOOKBACK_DATE"
      break
    fi
  done
  echo "🗓️ Using analysis date: $ARTICLE_DATE"

  # Persist selected ARTICLE_DATE for downstream steps
  if [ -n "${GITHUB_ENV:-}" ]; then
    echo "ARTICLE_DATE=$ARTICLE_DATE" >> "$GITHUB_ENV"
    echo "📌 Persisted ARTICLE_DATE=$ARTICLE_DATE to GITHUB_ENV for downstream steps"
  fi
fi

# Step 3: Report pending per-file analysis count for monitoring
PENDING=$(npx tsx scripts/catalog-downloaded-data.ts --pending-only 2>/dev/null | jq '.pendingAnalysis // 0' 2>/dev/null || echo "0")
PENDING=${PENDING:-0}
echo "📊 Total pending per-file analysis files (all dates): $PENDING"
```

**Key principle**: The lookback trigger uses the **per-date** "Documents Analyzed" count from `data-download-manifest.md`, NOT session-wide catalog totals. When a lookback date is selected, `$ARTICLE_DATE` is updated so downstream steps (daily synthesis rewrite, commit) target the correct directory.

**ARTICLE_DATE overwrite protection**: The resolved `ARTICLE_DATE` is persisted to `$GITHUB_ENV` after lookback selection. **Important**: any downstream bash snippet that initializes `ARTICLE_DATE` from inputs or `date -u` MUST use an idempotent guard to avoid overwriting the lookback-selected date. Place this snippet at the start of any step that runs AFTER the lookback loop:

```bash
# Idempotent ARTICLE_DATE initialization — only set if not already resolved by lookback
# Place at the top of any downstream bash step that would otherwise re-initialize ARTICLE_DATE
if [ -z "${ARTICLE_DATE:-}" ]; then
  ARTICLE_DATE="${{ github.event.inputs.article_date }}"
  [ -z "$ARTICLE_DATE" ] && ARTICLE_DATE=$(date -u +%Y-%m-%d)
fi
```

This ensures that once lookback persists `ARTICLE_DATE` to `$GITHUB_ENV`, subsequent steps reuse the resolved value rather than resetting to today's date.
````

## 📋 Daily Synthesis Template Compliance (copy into every analysis workflow)

> **MANDATORY**: Every daily analysis file in `analysis/daily/YYYY-MM-DD/` MUST follow its corresponding template from `analysis/templates/`. The script-generated stubs are starting points — the AI agent MUST rewrite them to full template compliance.

````markdown
### Daily Synthesis Template Compliance

> 🚨 **CRITICAL RULE**: The `pre-article-analysis.ts` script generates **stub files** as a starting point. These stubs do NOT follow the full template structure. You MUST read each template and rewrite the corresponding daily file to match the template's required sections, metadata fields, Mermaid diagrams, and evidence tables.

#### Template-to-File Mapping

| Daily File | Template to Follow | Required Sections |
|------------|-------------------|-------------------|
| `synthesis-summary.md` | **`analysis/templates/synthesis-summary.md`** | Synthesis Context (SYN-ID, date, confidence), Intelligence Dashboard (Mermaid), Top Findings table, Aggregated SWOT, Risk Landscape, Threat Summary, Stakeholder Impact, Narrative Direction, Forward Indicators, Artifacts Inventory |
| `risk-assessment.md` | **`analysis/templates/risk-assessment.md`** | Risk Context (RSK-ID, riksmöte, political context), Risk Heat Map (Mermaid), Risk Inventory table (L×I scores), Coalition Stability, Policy Implementation Risk, Budget Risk, Electoral Risk, Escalation Rules |
| `classification-results.md` | **`analysis/templates/political-classification.md`** | Classification Context (CLS-ID), Sensitivity Decision Tree (Mermaid), Per-document classification table (sensitivity, domain, urgency, scope, significance 0-10), Likelihood × Impact matrix |
| `threat-analysis.md` | **`analysis/templates/threat-analysis.md`** | Threat Context (THR-ID), Threat Taxonomy Network (Mermaid), 6 threat categories (NI/LI/AC/TR/DP/PB) with ≥1 threat each (severity 1-5), Threat Actor Mapping, Priority Mitigations, Escalation Decision |
| `swot-analysis.md` | **`analysis/templates/swot-analysis.md`** | SWOT Context (SWT-ID), Quadrant Mapping (Mermaid), Coalition SWOT, Opposition SWOT, Policy Domain SWOT — all entries with dok_id evidence, confidence, impact, entry date |
| `stakeholder-perspectives.md` | **`analysis/templates/stakeholder-impact.md`** | Stakeholder Context (STA-ID), Impact Radar (Mermaid), 6 stakeholder groups assessed (Citizens, Government, Opposition, Business, Civil Society, International), Impact Summary Matrix, Conflicting Impact Resolution |
| `significance-scoring.md` | **`analysis/templates/significance-scoring.md`** | Scoring Context (SIG-ID), 5-dimension scoring (Parliamentary, Policy Impact, Public Interest, Urgency, Cross-party) each 0-10, Composite Score, Publication Decision threshold |

#### Protocol

1. **Read each template** — use `view` or `cat` to read the full template file before rewriting the daily file
2. **Preserve script data** — keep any factual data (document counts, risk scores, anomalies) from the script output
3. **Keep existing filenames** — do **NOT** rename or create new files based on template filename suggestions; always rewrite the existing daily artifacts produced by `pre-article-analysis.ts` in-place (e.g., keep `classification-results.md`, `stakeholder-perspectives.md`)
4. **Add template structure** — add all required metadata fields, Mermaid diagrams, evidence tables, and confidence labels
5. **Fill with real data** — use downloaded documents, MCP data, and analysis results to fill every `[REQUIRED]` placeholder
6. **No empty sections** — if a section has no data, explain WHY (e.g., "No propositions found for this date — Parliament in recess") with confidence label

#### Minimum Compliance Check
- [ ] Every daily file has its template's metadata header (ID, date, riksmöte, confidence)
- [ ] Every daily file has ≥1 Mermaid diagram with color-coded nodes (using `style X fill:#hex,color:#fff` — not grey or unstyled)
- [ ] Risk assessment has ≥2 risks with L×I numeric scores in structured table
- [ ] SWOT has ≥2 filled quadrants with evidence citations (dok_id, vote counts) in structured tables
- [ ] SWOT follows template structure: Section 1 (Government Coalition), Section 2 (Opposition), Section 3 (Policy Domain)
- [ ] Threat analysis covers all 6 Political Threat Taxonomy categories with severity scores
- [ ] Significance scoring uses 5-dimension model with numeric scores and publication decision
- [ ] Synthesis references all sibling files with ✅/⚠️/❌ status
- [ ] No `[REQUIRED]` placeholders remain in any file
- [ ] Run the quality gate bash check from Step 5b — do NOT commit until it passes

> **❌ Anti-pattern (PR #1452)**: Plain prose SWOT with no tables, no Mermaid diagrams, no dok_id evidence, no template structure. This is REJECTED.
> **✅ Good example**: See [SWOT.md](../../SWOT.md) for the formatting standard — badges, evidence tables, color-coded Mermaid charts, structured sections.
````

## Per-File AI Analysis Block (copy into every analysis workflow)

> **Replaces script-based batch analysis.** The AI agent reads methodology documents and produces SWOT.md-quality per-file analysis for every downloaded MCP data file.

````markdown
### Per-File AI Political Intelligence Analysis

**Purpose:** Replace shallow script-based daily analysis with deep, AI-driven per-file analysis.
**Quality Standard:** Every analysis file must match [SWOT.md](../../SWOT.md) and [THREAT_MODEL.md](../../THREAT_MODEL.md) formatting quality.

#### Required Reading (before analyzing)
Read these methodology documents to guide your analysis:
- **`analysis/methodologies/ai-driven-analysis-guide.md`** — Master per-file analysis guide
- **`analysis/methodologies/political-swot-framework.md`** — Evidence-based SWOT
- **`analysis/methodologies/political-risk-methodology.md`** — 5×5 risk matrix
- **`analysis/methodologies/political-threat-framework.md`** — Political Threat Taxonomy
- **`analysis/methodologies/political-classification-guide.md`** — Sensitivity and domain taxonomy
- **`analysis/methodologies/political-style-guide.md`** — Writing standards and evidence density
- **`analysis/templates/per-file-political-intelligence.md`** — Per-file output template
- **`analysis/templates/synthesis-summary.md`** — Daily synthesis template
- **`analysis/templates/risk-assessment.md`** — Risk assessment template
- **`analysis/templates/political-classification.md`** — Classification template
- **`analysis/templates/threat-analysis.md`** — Threat analysis template
- **`analysis/templates/swot-analysis.md`** — SWOT analysis template
- **`analysis/templates/stakeholder-impact.md`** — Stakeholder impact template
- **`analysis/templates/significance-scoring.md`** — Significance scoring template
- **`scripts/prompts/v2/per-file-intelligence-analysis.md`** — Detailed analysis prompt

#### Protocol
1. **Catalog:** Run `npx tsx scripts/catalog-downloaded-data.ts --pending-only` to list files needing analysis
2. **Analyze each file:** Read the JSON, apply all 6 analytical lenses, fill the per-file template:
   - Political classification (sensitivity, domain, urgency)
   - SWOT impact (government + opposition, with evidence)
   - Risk assessment (5×5 matrix)
   - Political threat taxonomy assessment (where applicable)
   - Stakeholder impact matrix (6 lenses)
   - Forward indicators (specific watch items)
3. **Write analysis:** Save as `{dok_id}-analysis.md` alongside the data file
4. **Include Mermaid diagrams** — at least 1 per file, color-coded:
   ```
   style X fill:#dc3545,color:#fff   /* Red — critical */
   style X fill:#28a745,color:#fff   /* Green — low risk */
   style X fill:#0d6efd,color:#fff   /* Blue — informational */
   ```
5. **Rewrite daily synthesis files** — After per-file analysis, rewrite ALL daily files in `analysis/daily/YYYY-MM-DD/` to follow their corresponding templates (see "Daily Synthesis Template Compliance" section above)

#### Quality Gate — MANDATORY (must pass 10/12 minimum)

> 🚨 **BLOCKING**: Run the quality gate bash check from SHARED_PROMPT_PATTERNS Step 5b. Do NOT commit until it passes.

- [ ] ≥ 3 evidence points with dok_id (not generic references)
- [ ] Confidence labels (`[HIGH]`/`[MEDIUM]`/`[LOW]`) on every analytical claim
- [ ] At least 1 **color-coded** Mermaid diagram per file with `style` directives using real data
- [ ] SWOT has structured **evidence tables** (not plain prose) with `#`, `Statement`, `Evidence (dok_id)`, `Confidence`, `Impact` columns
- [ ] SWOT has ≥ 2 filled quadrants (not empty `[REQUIRED]` placeholders)
- [ ] Risk matrix has numeric L×I scores in structured table
- [ ] Forward indicators are specific with concrete timelines and triggers
- [ ] No `[REQUIRED]` placeholders remaining in any file
- [ ] Politicians named with party abbreviation (e.g., "Ulf Kristersson (M)")
- [ ] Intelligence-level analysis (not surface-level summaries or generic text)
- [ ] Daily synthesis files follow their corresponding `analysis/templates/` structure exactly
- [ ] Every daily file has template metadata header (ID, date, riksmöte, confidence)
````

## Minister-Response Cross-Reference (interpellations workflow only)

```markdown
### Step 3b — Cross-Reference Minister Responses

For each interpellation found:
1. Use `search_anforanden(talare=<minister-name>)` to fetch minister's response speech
2. Compare interpellation question with response to identify:
   - Unanswered questions (accountability gap → government SWOT weakness)
   - Evasive answers (opposition pressure → parliament SWOT opportunity)
   - Policy commitments (government strength)
   - Statistical claims (verify against SCB/World Bank data)
3. Assess response timeliness (4-week statutory deadline)
4. Include minister response summary in article body
5. Generate accountability scorecard per minister
```
