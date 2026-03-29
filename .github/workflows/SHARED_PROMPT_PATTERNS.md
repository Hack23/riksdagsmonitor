# Shared Prompt Patterns for News Workflows

> **Internal reference document** — Not a live workflow. Copy-paste these standardised blocks into every `news-*.md` workflow to ensure consistency.

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
8. **`scripts/prompts/v1/stakeholder-perspectives.md`** — Multi-perspective analysis instructions (v1; no v2 equivalent yet)
9. **`scripts/prompts/v2/quality-criteria.md`** — Quality self-assessment rubric (minimum 7/10)
```

## Standardised Analysis Depth Gate (copy into every workflow)

```markdown
### Standardised Analysis Depth Gate

| Depth | AI iterations | SWOT stakeholders | Charts | Mindmap |
|-------|--------------|-------------------|--------|---------|
| standard | 1-2 | ≥3 | ≥1 | optional |
| deep | 2-3 | ≥5 | ≥2 | required |
| comprehensive | 3+ | ≥7 | ≥3 | required |
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

## 🚨 MANDATORY: Data Download Enforcement (copy into every analysis workflow)

> **NON-NEGOTIABLE**: ALL analysis MUST be based on actually downloaded data files. The agent must NEVER fabricate, hallucinate, or manually write analysis content based on MCP query responses alone. MCP queries during event detection (Step 2) are for significance assessment ONLY — they do NOT replace the data download pipeline.

````markdown
### Data Download Enforcement

> 🚨 **ABSOLUTE RULE**: Every agentic workflow MUST download actual data via the `pre-article-analysis.ts` pipeline before producing any analysis artifacts. Analysis files that are not backed by downloaded data files are PROHIBITED.

#### What "downloading data" means

1. **Run the pipeline**: `npx tsx scripts/pre-article-analysis.ts --date "$ARTICLE_DATE" --limit 50`
2. **Pipeline downloads JSON files** from MCP to `analysis/data/documents/`, `analysis/data/votes/`, etc.
3. **Pipeline generates analysis artifacts** in `analysis/daily/YYYY-MM-DD/` based on the downloaded data
4. **Pipeline writes `data-download-manifest.md`** with the actual count of downloaded documents

#### What is PROHIBITED

- ❌ **NEVER manually write analysis files** (synthesis-summary.md, risk-assessment.md, swot-analysis.md, etc.) using bash/edit tools based on MCP query responses from event detection
- ❌ **NEVER create analysis files that claim "enriched with real MCP data"** when no data files were actually downloaded by the pipeline
- ❌ **NEVER overwrite pipeline-generated stub files** with AI-fabricated content that doesn't reference actual downloaded data file paths
- ❌ **NEVER commit analysis artifacts that contain 0 downloaded documents** but pretend to have analysis results (e.g., SWOT with 4 quadrants filled when manifest says "Documents Analyzed: 0")

#### What is REQUIRED

- ✅ **ALWAYS verify data was downloaded** after running the pipeline — check that `data-download-manifest.md` shows > 0 documents
- ✅ **ALWAYS commit actual data files** (JSON from MCP) alongside analysis artifacts
- ✅ **ALWAYS ensure analysis references specific downloaded file paths** (e.g., `analysis/data/documents/H901JuU29.json`)
- ✅ **If pipeline downloads 0 documents**: commit the honest stub files (showing 0 documents) OR call `safeoutputs___noop` — do NOT fabricate analysis
- ✅ **If pipeline fails**: diagnose and fix the failure (see "Script Debugging & Fixing" section below)

#### Post-Pipeline Data Verification

After running `pre-article-analysis.ts`, ALWAYS run this verification:

```bash
# Verify actual data was downloaded
ARTICLE_DATE_DIR="analysis/daily/${ARTICLE_DATE:-$(date -u +%Y-%m-%d)}"
DATA_FILES=$(find analysis/data/ -name "*.json" -newer "$ARTICLE_DATE_DIR/data-download-manifest.md" 2>/dev/null | wc -l)
MANIFEST_DOCS=$(grep -E '^\*\*Documents Analyzed\*\*' "$ARTICLE_DATE_DIR/data-download-manifest.md" 2>/dev/null | sed -E 's/^\*\*Documents Analyzed\*\* *: *([0-9]+).*/\1/' || echo 0)
[ -z "$MANIFEST_DOCS" ] && MANIFEST_DOCS=0
echo "📊 Data verification: $MANIFEST_DOCS documents in manifest, $DATA_FILES new JSON files"
if [ "$MANIFEST_DOCS" -eq 0 ]; then
  echo "⚠️ Pipeline downloaded 0 documents — analysis will reflect empty data honestly. Do NOT fabricate content."
fi
```
````

## 🔧 MANDATORY: Script Debugging & Fixing (copy into every analysis workflow)

> **NON-NEGOTIABLE**: When scripts fail, the agent MUST diagnose and attempt to fix the failure. Silent fallback to manual content creation is PROHIBITED.

````markdown
### Script Debugging & Fixing Protocol

> 🚨 **ABSOLUTE RULE**: All agentic workflows must analyse and fix any code/script issues to be able to perform their task. When a script fails, the agent MUST NOT silently skip it and fabricate output manually.

#### When `pre-article-analysis.ts` fails:

1. **Capture the error output** — re-run with verbose logging:
   ```bash
   npx tsx scripts/pre-article-analysis.ts --date "$ARTICLE_DATE" --limit 50 2>&1 | tee /tmp/pipeline-error.log
   PIPE_EXIT=$?
   if [ "$PIPE_EXIT" -ne 0 ]; then
     echo "❌ Pipeline failed with exit code $PIPE_EXIT"
     echo "=== Last 50 lines of error output ==="
     tail -50 /tmp/pipeline-error.log
   fi
   ```

2. **Read the script source** to understand the failure:
   ```bash
   # Check for TypeScript compilation errors
   npx tsc --noEmit scripts/pre-article-analysis.ts 2>&1 | head -20
   # Check if dependencies are installed
   ls node_modules/.package-lock.json 2>/dev/null && echo "node_modules exists" || echo "❌ node_modules missing — run npm ci"
   ```

3. **Diagnose common failures**:
   - **MCP connection refused**: Check if `scripts/mcp-setup.sh` was sourced; verify `MCP_SERVER_URL` is set
   - **TypeScript compilation error**: Read the error, fix the import/type issue
   - **Missing dependency**: Run `npm ci`
   - **Date parsing error**: Verify `$ARTICLE_DATE` format is `YYYY-MM-DD`
   - **Network timeout**: Retry with smaller `--limit`

4. **Fix the script** if possible:
   - Use `view` to read the failing code section
   - Use `edit` to fix the issue (type errors, missing imports, logic bugs)
   - Re-run the pipeline after fixing
   - If the fix is non-trivial, note it in the PR description

5. **Only after exhausting fix attempts** (≥2 attempts), fall back to:
   - Committing whatever the pipeline produced (even if empty)
   - Adding a clear error note in the PR body
   - NEVER fabricating analysis content manually

#### When `generate-news-enhanced.ts` fails:

Apply the same protocol: capture error → read source → diagnose → fix → retry. Only use manual article generation as last resort, and only for HTML article files (NEVER for analysis artifacts).

#### When `catalog-downloaded-data.ts` fails:

```bash
npx tsx scripts/catalog-downloaded-data.ts --pending-only 2>&1 | tee /tmp/catalog-error.log
CATALOG_EXIT=$?
if [ "$CATALOG_EXIT" -ne 0 ]; then
  echo "❌ Catalog script failed — reading error output"
  cat /tmp/catalog-error.log
  # Check if analysis/data directory exists and has files
  find analysis/data/ -name "*.json" 2>/dev/null | head -10
fi
```
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
    npx tsx scripts/pre-article-analysis.ts --date "$LOOKBACK_DATE" --limit 50 2>/dev/null || true
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
| `threat-analysis.md` | **`analysis/templates/threat-analysis.md`** | Threat Context (THR-ID), STRIDE Network (Mermaid), 6 STRIDE categories (S/T/R/I/D/E) with ≥1 threat each (severity 1-5), Threat Actor Mapping, Priority Mitigations, Escalation Decision |
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
- [ ] Every daily file has ≥1 Mermaid diagram with color-coded nodes (not grey placeholders)
- [ ] Risk assessment has ≥2 risks with L×I numeric scores
- [ ] SWOT has ≥2 filled quadrants with evidence citations
- [ ] Threat analysis covers all 6 STRIDE categories
- [ ] Significance scoring uses 5-dimension model
- [ ] Synthesis references all sibling files with ✅/⚠️/❌ status
- [ ] No `[REQUIRED]` placeholders remain in any file
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
- **`analysis/methodologies/political-threat-framework.md`** — STRIDE political mapping
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
   - STRIDE threat analysis (where applicable)
   - Stakeholder impact matrix (6 lenses)
   - Forward indicators (specific watch items)
3. **Write analysis:** Save as `{id}.analysis.md` alongside the data file
4. **Include Mermaid diagrams** — at least 1 per file, color-coded:
   ```
   style X fill:#dc3545,color:#fff   /* Red — critical */
   style X fill:#28a745,color:#fff   /* Green — low risk */
   style X fill:#0d6efd,color:#fff   /* Blue — informational */
   ```
5. **Rewrite daily synthesis files** — After per-file analysis, rewrite ALL daily files in `analysis/daily/YYYY-MM-DD/` to follow their corresponding templates (see "Daily Synthesis Template Compliance" section above)

#### Quality Gate (minimum 8/10)
- [ ] ≥ 3 evidence points with dok_id
- [ ] Confidence labels on all claims
- [ ] At least 1 Mermaid diagram with real data
- [ ] SWOT has ≥ 2 filled quadrants
- [ ] Risk matrix has numeric scores
- [ ] Forward indicators are specific
- [ ] No `[REQUIRED]` placeholders remaining
- [ ] Politicians named with party abbreviation
- [ ] Intelligence-level analysis (not surface)
- [ ] No boilerplate or generic text
- [ ] Daily synthesis files follow their corresponding `analysis/templates/` structure
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
