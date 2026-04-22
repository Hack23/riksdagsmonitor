# Tier-C Aggregation Extension

Import this **in addition to** the 8 core modules for aggregation / reference-grade workflows:

- `news-evening-analysis`
- `news-weekly-review`
- `news-monthly-review`
- `news-week-ahead`
- `news-month-ahead`
- `news-realtime-monitor`
- `news-article-generator` when `article_types` contains `deep-inspection`

These are the flagship editorial surfaces of Riksdagsmonitor. The Tier-C rules are additive, not replacements.

## 14 required artifacts (9 core + 5 Tier-C)

In addition to the 9 artifacts from `04-analysis-pipeline.md`:

| File | Purpose |
|------|---------|
| `README.md` | Per-run index + navigation for editors |
| `executive-brief.md` | 2-page decision-maker brief, lead findings + implications |
| `scenario-analysis.md` | ≥ 3 alternative scenarios with posterior probabilities |
| `comparative-international.md` | Cross-country comparison via World Bank / IMF / SCB data |
| `methodology-reflection.md` | What worked, what failed, biases surfaced, uncertainty log |

## Period-scope multipliers (depth calibration)

Aggregation depth scales with the period covered. Multiply the `comprehensive` minimum times in `04-analysis-pipeline.md` by:

| Workflow | Multiplier | Rationale |
|----------|-----------|-----------|
| `news-realtime-monitor` | 0.8× | Single-event brief; may trim historical context. |
| `news-evening-analysis` | 1.0× | Standard day-in-review. |
| `news-week-ahead` / `news-weekly-review` | 1.2× | 5–7 day window synthesis. |
| `news-month-ahead` / `news-monthly-review` | 1.5× | 30-day window; longitudinal patterns required. |
| `news-article-generator` (deep-inspection) | 1.0× | Single-topic deep dive. |

All 14 artifacts remain mandatory regardless of multiplier.

## Cross-type synthesis (aggregation only)

Aggregation workflows **must** read sibling article-type analyses produced for the same period and cite them explicitly:

| Aggregation workflow | Sibling folders to read |
|----------------------|-------------------------|
| `news-evening-analysis` | Today's `propositions/`, `motions/`, `committeeReports/`, `interpellations/`, any `realtime-*/` |
| `news-week-ahead` / `news-weekly-review` | Last 7 days of per-type folders |
| `news-month-ahead` / `news-monthly-review` | Last 30 days of per-type folders |
| `news-realtime-monitor` | Prior 7 days' `realtime-*/` for continuity chain |

Cross-references go into `cross-reference-map.md`. Missing cross-type citations fail the gate.

## Recent-daily synthesis ingestion

For `news-week-ahead`, `news-month-ahead`, `news-weekly-review`, `news-monthly-review` and `news-realtime-monitor`, before Pass 1 analysis:

1. Read every `synthesis-summary.md` from the lookback window.
2. Extract unique `dok_id` references and stakeholder names.
3. Record the ingestion list in `data-download-manifest.md §Reference Analyses`.
4. Use the extracted entities as input to Pass 1 SWOT, risk, and stakeholder files.

## Tier-C gate

No dedicated Tier-C validator script exists — run the core-gate bash block from `05-analysis-gate.md`, then the additional checks below:

```
set -Eeuo pipefail
ANALYSIS_DIR="${ANALYSIS_DIR:-}"
[ -n "$ANALYSIS_DIR" ] || { echo "❌ ANALYSIS_DIR is not set; run the core-gate block from 05-analysis-gate.md first"; exit 1; }
[ -d "$ANALYSIS_DIR" ] || { echo "❌ ANALYSIS_DIR does not exist: $ANALYSIS_DIR"; exit 1; }
EXTRA="README.md executive-brief.md scenario-analysis.md \
       comparative-international.md methodology-reflection.md"
FAIL=0
for f in $EXTRA; do
  [ -s "$ANALYSIS_DIR/$f" ] || { echo "❌ tier-c missing: $f"; FAIL=1; }
done
# ≥ 3 scenarios with probability + leading indicator
awk '/^##? .*Scenario/{c++} END{exit (c<3)}' "$ANALYSIS_DIR/scenario-analysis.md" \
  || { echo "❌ scenario-analysis.md: fewer than 3 scenarios"; FAIL=1; }
# ≥ 2 external country references in comparative-international.md
grep -cE '\b(Finland|Norway|Denmark|Germany|France|Netherlands|UK|USA|Estonia)\b' \
  "$ANALYSIS_DIR/comparative-international.md" | awk '{exit ($1<2)}' \
  || { echo "❌ comparative-international.md: fewer than 2 countries"; FAIL=1; }
[ "$FAIL" -eq 0 ] || exit 1
```

If the block is promoted to `scripts/validate-tier-c-gate.ts`, update this module accordingly.

## Article expectations

Tier-C articles are the editorial flagship. Floor:

- ≥ 1500 words (vs 1000 for single-type).
- All 5 mandatory analytical sections present (vs 3 of 5).
- ≥ 5 `dok_id` references.
- ≥ 2 charts (economic + political).
- Executive brief linked from the article.
