# 03 — Data Download

## Pre-flight: existing analysis check

Run this check as the **first action** after MCP pre-warm, before any download:

```bash
ANALYSIS_DIR="analysis/daily/$ARTICLE_DATE/$SUBFOLDER"

# 23 required artifacts (Families A+B+C+D) — every workflow, every run
REQ=(
  # Family A — Core Synthesis (9)
  README.md executive-brief.md synthesis-summary.md significance-scoring.md \
  classification-results.md swot-analysis.md risk-assessment.md \
  threat-analysis.md stakeholder-perspectives.md \
  # Family B — Structural Metadata (2)
  data-download-manifest.md cross-reference-map.md \
  # Family C — Strategic Extensions (5)
  scenario-analysis.md comparative-international.md devils-advocate.md \
  intelligence-assessment.md methodology-reflection.md \
  # Family D — Electoral & Domain Lenses (7)
  election-2026-analysis.md voter-segmentation.md coalition-mathematics.md \
  historical-parallels.md media-framing-analysis.md \
  implementation-feasibility.md forward-indicators.md)

# Tier-C workflows add no new files — all 23 are already mandatory. What Tier-C
# adds is the cross-type synthesis + period multipliers enforced by
# ext/tier-c-aggregation.md and the gate in 05-analysis-gate.md.

SKIP_ANALYSIS=false
ALL_PRESENT=true
for f in "${REQ[@]}"; do
  [ -s "$ANALYSIS_DIR/$f" ] || { ALL_PRESENT=false; break; }
done
[ "$ALL_PRESENT" = "true" ] && SKIP_ANALYSIS=true
echo "SKIP_ANALYSIS=$SKIP_ANALYSIS  (required artifacts present: $ALL_PRESENT, count: ${#REQ[@]})"
```

| `SKIP_ANALYSIS` | Behaviour |
|-----------------|-----------|
| `false` | Continue with the full pipeline below → `04-analysis-pipeline.md` → `05-analysis-gate.md` → `06-article-generation.md` (aggregate + render) → `07-commit-and-pr.md`. |
| `true` | Analysis already exists from a prior run. Re-load it into context, **do not regenerate analysis files**, optionally re-query the API for new `dok_id`s, then go straight to `06-article-generation.md` to aggregate and render. The run still produces exactly one PR. |

> **Folder reuse rule**: the same `$ANALYSIS_DIR` is always reused across runs for the same `$ARTICLE_DATE` + `$SUBFOLDER` when `force_generation=false`. The legacy auto-suffix behaviour (`propositions-2`, `propositions-3`, …) is retained **only** as an explicit escape hatch when `force_generation=true`, so that a forced rerun on a merged day can produce a fresh parallel analysis without trampling the existing one.

## Goal

Populate `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/` with raw Riksdag/Regering data and a provenance manifest **before** any analysis starts.

## Subfolder naming

| Workflow | `$SUBFOLDER` |
|----------|--------------|
| news-propositions | `propositions` |
| news-motions | `motions` |
| news-committee-reports | `committeeReports` |
| news-interpellations | `interpellations` |
| news-week-ahead | `week-ahead` |
| news-month-ahead | `month-ahead` |
| news-weekly-review | `weekly-review` |
| news-monthly-review | `monthly-review` |
| news-evening-analysis | `evening-analysis` |
| news-realtime-monitor | `realtime-$HHMM` (per-event) or `realtime-pulse` (rolling 4-hour pulse) |

If `force_generation=true` is supplied on a day whose base subfolder already contains `synthesis-summary.md` from a prior merged run, auto-suffix the subfolder (`propositions-2`, `propositions-3`, …) so the forced rerun does not overwrite the merged analysis. Under the default `force_generation=false`, the same base subfolder is reused across runs — see §Pre-flight above.

## Download pipeline

For **document-type** workflows (propositions, motions, committee-reports, interpellations):

```
source scripts/mcp-setup.sh
npx tsx scripts/download-parliamentary-data.ts \
  --date "$ARTICLE_DATE" --limit 50 --doc-type "$DOC_TYPE" \
  2>&1 | tee /tmp/pipeline-output.log
```

For **aggregation** workflows (evening-analysis, week-ahead, month-ahead, weekly-review, monthly-review, realtime-monitor):

```
source scripts/mcp-setup.sh
npx tsx scripts/download-parliamentary-data.ts --date "$ARTICLE_DATE" --limit 50 \
  2>&1 | tee /tmp/pipeline-output.log
```

Then `npx tsx scripts/catalog-downloaded-data.ts --pending-only` to produce the per-document catalogue.

## Full-text enrichment

For every downloaded document reference, fetch full text when available (`get_dokument_innehall` with `include_full_text: true` on riksdag-regering). Documents without full text are allowed but must be tagged `metadata-only` in the manifest.

## Statskontoret enrichment

When a document affects an implementing authority, administrative capacity, regulatory burden, governance quality, public-sector efficiency, inspection/audit capacity, or inter-agency coordination, collect at least one relevant public Statskontoret source if available. Use `web_fetch` against `https://www.statskontoret.se/` or `https://statskontoret.se/`, cite the report/page URL, and record it in `data-download-manifest.md` under Cross-Source Enrichment. If no relevant Statskontoret source exists, state `Statskontoret: no directly relevant source found` rather than fabricating agency-capacity evidence.

## Lookback fallback

If the requested `$ARTICLE_DATE` returns zero documents, loop `DAYS_BACK = 1..7`:

```
LOOKBACK_DATE=$(date -u -d "$ARTICLE_DATE - $DAYS_BACK days" '+%Y-%m-%d')
```

Re-run the download script with `--date "$LOOKBACK_DATE"`, copy artifacts back under the original `$ARTICLE_DATE` subfolder, and note the lookback in `data-download-manifest.md`. Never commit empty analysis.

## Provenance manifest

Always produce `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/data-download-manifest.md` containing:

- Workflow name, run ID, UTC timestamp.
- Requested date, effective date (after lookback), window used.
- Per-document table: `dok_id`, title, type, `hangar_id`, committee, retrieval timestamp, full-text status.
- MCP server availability notes (any retries, partial failures).
- Non-MCP public sources used for enrichment, especially Statskontoret report/page URLs for implementation and agency-capacity evidence.

## Next step

On success, proceed to `04-analysis-pipeline.md`. Never start analysis while `data-download-manifest.md` is missing or empty.
