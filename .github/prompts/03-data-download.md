# 03 — Data Download

## Pre-flight: existing analysis check (improvement-mode router)

> 🔴 **No-op is forbidden.** This pre-flight never decides "skip" — it only decides whether the run is a **first generation** (`IMPROVEMENT_MODE=false`) or an **improvement re-run** (`IMPROVEMENT_MODE=true`). In both branches the workflow runs analysis work, regenerates `article.md`, regenerates the rendered HTML, and produces exactly one PR. See `07-commit-and-pr.md §No-op policy` for the (very narrow) exit conditions.

Run this check as the **first action** after MCP pre-warm, before any download:

```bash
ANALYSIS_DIR="analysis/daily/$ARTICLE_DATE/$SUBFOLDER"
NEWS_DIR="news"

IMPROVEMENT_MODE=false
ALL_PRESENT=true
EXPECTED=23
CHECKED=0
# 23 required artifacts (Families A+B+C+D) — every workflow, every run.
# We feed them via a here-doc so the loop never builds an inline bash array
# (the AWF sandbox flags `REQ=(...); for f in "${REQ[@]}"`; see
# 01-bash-and-shell-safety.md §Banned expansion patterns).
# The loop continues to the end so $CHECKED counts how many artifacts are
# already on disk — useful telemetry for partial improvement re-runs.
while IFS= read -r f; do
  [ -z "$f" ] && continue
  CHECKED=$((CHECKED + 1))
  [ -s "$ANALYSIS_DIR/$f" ] || ALL_PRESENT=false
done <<'REQUIRED_ARTIFACTS'
README.md
executive-brief.md
synthesis-summary.md
significance-scoring.md
classification-results.md
swot-analysis.md
risk-assessment.md
threat-analysis.md
stakeholder-perspectives.md
data-download-manifest.md
cross-reference-map.md
scenario-analysis.md
comparative-international.md
devils-advocate.md
intelligence-assessment.md
methodology-reflection.md
election-2026-analysis.md
voter-segmentation.md
coalition-mathematics.md
historical-parallels.md
media-framing-analysis.md
implementation-feasibility.md
forward-indicators.md
REQUIRED_ARTIFACTS

# Tier-C workflows add no new files — all 23 are already mandatory. What
# Tier-C adds is the cross-type synthesis + period multipliers enforced by
# ext/tier-c-aggregation.md and the gate in 05-analysis-gate.md.

[ "$ALL_PRESENT" = "true" ] && IMPROVEMENT_MODE=true

# Detect previously rendered article HTML for this date + subfolder.
# Match the renderer's filename convention: news/$ARTICLE_DATE-$SUBFOLDER-{lang}.html
# (subfolder may contain hyphens, e.g. `evening-analysis`, `weekly-review`).
EXISTING_HTML_COUNT=$(ls -1 "$NEWS_DIR/$ARTICLE_DATE-$SUBFOLDER-"*.html 2>/dev/null | wc -l | tr -d ' ')
[ -z "$EXISTING_HTML_COUNT" ] && EXISTING_HTML_COUNT=0

echo "IMPROVEMENT_MODE=$IMPROVEMENT_MODE  (required artifacts present: $ALL_PRESENT, on-disk: $CHECKED of $EXPECTED, existing news/*.html: $EXISTING_HTML_COUNT)"
```

| `IMPROVEMENT_MODE` | Behaviour |
|--------------------|-----------|
| `false` | First generation for this `$ARTICLE_DATE` + `$SUBFOLDER` (or partial prior run with missing artifacts). Continue with the full pipeline below → `04-analysis-pipeline.md` (Pass 1 + Pass 2) → `05-analysis-gate.md` → `06-article-generation.md` (aggregate + render) → `07-commit-and-pr.md`. |
| `true` | Prior analysis exists. **Do not skip and do not no-op.** Re-run the download script to pick up any new `dok_id`s, then enter **improvement mode** in `04-analysis-pipeline.md` — read every existing artifact back, extend it with new evidence / new documents / sharper judgments / closed gaps, run a mandatory Pass 2 read-back, then **always** re-aggregate and re-render `article.md` + `news/$ARTICLE_DATE-$SUBFOLDER-{en,sv}.html`. The run still produces exactly one PR. |

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
