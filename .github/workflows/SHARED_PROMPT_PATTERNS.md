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

## 🔄 Data Lookback Fallback Strategy (copy into every analysis workflow)

> **MANDATORY**: Never produce empty analysis. If no data exists for today, look back up to 7 days to find data that still needs analysis. Weekend/holiday runs MUST still produce useful output.

````markdown
### Data Lookback Fallback Strategy

> 🚨 **CRITICAL RULE**: An agentic workflow must NEVER produce empty/stub analysis files. If no documents are found for today's date, the workflow MUST look back through previous dates to find data that still needs analysis. Empty analysis = wasted workflow run.

#### Fallback Protocol

After the initial data download attempt for `$ARTICLE_DATE`:

```bash
ARTICLE_DATE="${{ github.event.inputs.article_date }}"
[ -z "$ARTICLE_DATE" ] && ARTICLE_DATE=$(date -u +%Y-%m-%d)

# Step 1: Check if today's download yielded documents
PENDING=$(npx tsx scripts/catalog-downloaded-data.ts --pending-only 2>/dev/null | jq '.pendingAnalysis // 0')
TOTAL=$(npx tsx scripts/catalog-downloaded-data.ts 2>/dev/null | jq '.totalFiles // 0')

if [ "$PENDING" -eq 0 ] && [ "$TOTAL" -eq 0 ]; then
  echo "⚠️ No data for $ARTICLE_DATE — activating lookback fallback"
  # Step 2: Try downloading data for previous dates (up to 7 days back)
  for DAYS_BACK in 1 2 3 4 5 6 7; do
    # Cross-platform date arithmetic: GNU date (-d) on Linux/GitHub Actions, BSD date (-v) on macOS
    LOOKBACK_DATE=$(date -u -d "$ARTICLE_DATE - $DAYS_BACK days" +%Y-%m-%d 2>/dev/null || date -u -v-${DAYS_BACK}d -j -f "%Y-%m-%d" "$ARTICLE_DATE" +%Y-%m-%d 2>/dev/null)
    [ -z "$LOOKBACK_DATE" ] && continue
    echo "🔍 Checking $LOOKBACK_DATE for unanalyzed data..."
    npx tsx scripts/pre-article-analysis.ts --date "$LOOKBACK_DATE" --limit 50 2>/dev/null || true
    PENDING=$(npx tsx scripts/catalog-downloaded-data.ts --pending-only 2>/dev/null | jq '.pendingAnalysis // 0')
    if [ "$PENDING" -gt 0 ]; then
      echo "✅ Found $PENDING files needing analysis from $LOOKBACK_DATE"
      break
    fi
  done
fi

# Step 3: Even if no new downloads, check for ANY pending analysis across all dates
PENDING=$(npx tsx scripts/catalog-downloaded-data.ts --pending-only 2>/dev/null | jq '.pendingAnalysis // 0')
echo "📊 Total pending analysis files: $PENDING"
```

**Key principle**: The catalog tracks ALL data files across ALL dates. Even if today yields zero new downloads, there may be previously downloaded files that still lack `.analysis.md` sidecar files. The workflow must analyze those.
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
3. **Add template structure** — add all required metadata fields, Mermaid diagrams, evidence tables, and confidence labels
4. **Fill with real data** — use downloaded documents, MCP data, and analysis results to fill every `[REQUIRED]` placeholder
5. **No empty sections** — if a section has no data, explain WHY (e.g., "No propositions found for this date — Parliament in recess") with confidence label

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
