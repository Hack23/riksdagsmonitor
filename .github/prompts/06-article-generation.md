# 06 — Article Generation

Articles derive from analysis. Scripts produce HTML scaffolding; the AI writes every word of analytical content.

## Preconditions

- Module `05-analysis-gate.md` has passed.
- Every core analysis artifact has been read back in full in this run.

## Pre-flight: required analysis artifacts

Before any article section is drafted, the writer MUST have opened and read **every** artifact below from `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/`:

| Workflow class | Required artifacts | Gate checks that enforce citation |
|----------------|---------------------|------------------------------------|
| All workflows (single-type + Tier-C) | **23 artifacts** — Family A (9) + B (2) + C (5) + D (7) per `04-analysis-pipeline.md` §"23 required artifacts" | `05-analysis-gate.md` **check 1** (all 23 present), **check 2** (per-document coverage — one `{dok_id}-analysis.md` per manifest entry), **check 4** (evidence cites `dok_id` / primary-source URL), **check 5** (Mermaid + colour-coded style on all synthesis files), **check 7** (Family C structure — BLUF, ≥ 3 Key Judgments, ≥ 3 scenarios, ≥ 3 ACH hypotheses, ICD 203 audit, ≥ 2 comparators), **check 8** (Family D structure — ≥ 10 forward indicators, coalition seat table) |
| Tier-C aggregation (`news-evening-analysis`, `news-weekly-review`, `news-monthly-review`, `news-week-ahead`, `news-month-ahead`, `news-realtime-monitor`, `news-article-generator` deep-inspection) | Same 23 artifacts **plus** Tier-C depth multipliers and cross-type synthesis — see `ext/tier-c-aggregation.md` | All single-type checks **plus** Tier-C sibling-citation check (cross-type citations in `cross-reference-map.md`) |

If any required artifact is missing or empty, do **not** proceed to step 1 below — return to `04-analysis-pipeline.md` and produce it.

## Generation steps

1. **Invoke the script** (HTML scaffold only):

   ```
   npx tsx scripts/generate-news-enhanced.ts \
     --date "$ARTICLE_DATE" \
     --type "$ARTICLE_TYPE" \
     --languages "$CORE_LANGUAGES"   # always "en,sv" for automated workflows
   ```

2. **Read pre-computed analysis** in full before filling any section. Map article sections → analysis files:

   | Article section | Sourced from |
   |-----------------|--------------|
   | Analytical lede | `synthesis-summary.md` (lead story + DIW ranking) |
   | Per-document "Why it matters" | `documents/<dok_id>-analysis.md` |
   | Winners & losers | `stakeholder-perspectives.md` |
   | Key takeaways | `significance-scoring.md` top items |
   | Strategic context | `risk-assessment.md` + `threat-analysis.md` |
   | Economic context | `economic-data.json` + commentary paragraph |
   | SEO title / meta description | `synthesis-summary.md` §"AI-Recommended Article Metadata" |
   | Analysis references block | Hand-written footer linking to the 23 analysis files on GitHub — at minimum: `executive-brief.md`, `synthesis-summary.md`, `intelligence-assessment.md`, `scenario-analysis.md`, `risk-assessment.md`, `forward-indicators.md` (see "Mandatory sections" below) |

3. **Replace every `AI_MUST_REPLACE` marker** with evidence-cited analysis. Note: `05-analysis-gate.md` **check 3** only scans `$ANALYSIS_DIR` — it does **not** scan generated HTML. The article-side gate in step 5 below is the only mechanism that blocks unresolved markers from reaching the PR, so it is mandatory.

4. **Article Pass 2** — AI-FIRST principle applies (see `00-base-contract.md` rule 5). Read every generated article HTML back in full. Improve: tighten lede, strengthen quotes, expand stakeholder coverage, replace boilerplate sentences, verify every `dok_id` reference resolves. Minimum 8 minutes.

5. **Pre-commit article gate (MANDATORY, hard-blocking).** Before staging any article for commit, run the article-side banned-pattern detector against every generated HTML file:

   ```bash
   npx tsx scripts/check-banned-patterns.ts news/*committee-reports*$ARTICLE_DATE*.html \
     news/$YYYY/$MM/$DD/*.html 2>/dev/null
   GATE_EXIT=$?
   if [ "$GATE_EXIT" -ne 0 ]; then
     echo "❌ Article gate failed: $GATE_EXIT file(s) contain unresolved AI_MUST_REPLACE markers or banned patterns"
     echo "   Return to step 2 (read analysis) and step 3 (replace markers). Do NOT proceed to 07-commit-and-pr.md."
     exit 1
   fi
   ```

   Additionally, verify manifest/citation consistency — every `dok_id` cited in the article must exist as a file in `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/documents/`:

   ```bash
   CITED=$(grep -oE 'H[A-Z0-9]{2}[A-Z]{2,}[0-9]+' news/*$ARTICLE_DATE*.html | awk -F: '{print $2}' | sort -u)
   for d in $CITED; do
     if ! ls "analysis/daily/$ARTICLE_DATE/$SUBFOLDER/documents/${d}"*.md >/dev/null 2>&1; then
       echo "❌ Article cites $d but no analysis/daily/$ARTICLE_DATE/$SUBFOLDER/documents/${d}*.md exists"
       echo "   Either drop $d from the article or extend analysis to cover it. Do NOT proceed."
       exit 1
     fi
   done
   ```

   This gate catches the exact failure mode observed in past runs: article scaffold shipped with `<!-- AI_MUST_REPLACE: ... -->` HTML comments, `by Unknown` author fallbacks, and `dok_id`s that do not have matching analysis files.

## Mandatory sections (per article)

- Headline (60–80 chars, analysis-driven).
- Meta description (150–160 chars, no boilerplate).
- Analytical lede (2–3 sentences).
- ≥ 1 per-document "Why it matters" section citing `dok_id`.
- Winners & losers with named actors.
- Strategic context with explicit risk or threat reference.
- Election 2026 lens paragraph (every article, even single-type).
- Analysis & sources block linking to the 23 analysis files on GitHub (Families A+B+C+D), with direct callouts to `executive-brief.md`, `intelligence-assessment.md`, and `scenario-analysis.md`.

## Banned patterns (zero tolerance)

| Pattern | Example |
|---------|---------|
| Unresolved scaffold markers | Any `<!-- AI_MUST_REPLACE: * -->` comment in committed HTML. Blocked by step 5 pre-commit gate. |
| Section-name title leakage | Headlines built by concatenating section names, e.g. "X: What Happened, Timeline & Context, Why This Matters". |
| Manifest drift | Citing a `dok_id` in the article that has no matching `documents/<dok_id>-analysis.md` artifact. Blocked by step 5 manifest check. |
| Unresolved author fallback | `by Unknown`, `Author: Unknown` — the scaffold's default placeholder, never a valid shipped value. |
| Raw upstream HTML dump | Pasting raw `<p>…</p>` from `riksdagen.se` into the article body in place of original analysis. |
| Boilerplate filler | "This is an important development that will have significant implications." |
| Unattributed claims | "Experts say…", "Critics argue…" without named actor. |
| Title-only summaries | Re-stating the document title as the analysis. |
| Generic stakeholders | "The opposition", "Voters" without specific parties / groups. |
| Confidence mismatch | Article claims "high confidence" while analysis files state "low". |

## Visualisation

- Every chart container in the HTML must have a matching JSON file next to the analysis artifacts.
- Charts follow the specs in [Economic Data Contract](../aw/ECONOMIC_DATA_CONTRACT.md) and [`analysis/templates/`](../../analysis/templates/).

## Translations

- Automated article workflows produce only core languages (`en,sv`).
- Remaining 12 languages are dispatched to `news-translate` via `dispatch-workflow`.
- `news-translate` consumes completed articles; it never generates original analysis.

## Quality floor

Each article ≥ 1000 words, minimum 3 of 5 mandatory analytical sections present, ≥ 3 `dok_id` references. Below any of these = rewrite before commit.

## Next step

Run the **phase checkpoint** from `00-base-contract.md` with label `phase-06-article` to persist the generated articles to repo memory. Then stage all analysis + article + visualisation files, and call `07-commit-and-pr.md`.
