# 06 — Article Generation

Articles derive from analysis. Scripts produce HTML scaffolding; the AI writes every word of analytical content.

## Preconditions

- Module `05-analysis-gate.md` has passed.
- Every core analysis artifact has been read back in full in this run.

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
   | Per-document "Why it matters" | `documents/<dok_id>.md` |
   | Winners & losers | `stakeholder-perspectives.md` |
   | Key takeaways | `significance-scoring.md` top items |
   | Strategic context | `risk-assessment.md` + `threat-analysis.md` |
   | Economic context | `economic-data.json` + commentary paragraph |
   | SEO title / meta description | `synthesis-summary.md` §"AI-Recommended Article Metadata" |
   | Analysis references block | Hand-written footer linking to the 9 analysis files on GitHub (see "Mandatory sections" below) |

3. **Replace every `AI_MUST_REPLACE` marker** with evidence-cited analysis. The gate in step 7 enforces zero markers.

4. **Article Pass 2** — AI-FIRST principle applies (see `00-base-contract.md` rule 5). Read every generated article HTML back in full. Improve: tighten lede, strengthen quotes, expand stakeholder coverage, replace boilerplate sentences, verify every `dok_id` reference resolves. Minimum 8 minutes.

## Mandatory sections (per article)

- Headline (60–80 chars, analysis-driven).
- Meta description (150–160 chars, no boilerplate).
- Analytical lede (2–3 sentences).
- ≥ 1 per-document "Why it matters" section citing `dok_id`.
- Winners & losers with named actors.
- Strategic context with explicit risk or threat reference.
- Election 2026 lens paragraph (every article, even single-type).
- Analysis & sources block linking to the 9 analysis files on GitHub.

## Banned patterns (zero tolerance)

| Pattern | Example |
|---------|---------|
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

Stage all analysis + article + visualisation files, then call `07-commit-and-pr.md`.
