# Tier-C Aggregation Extension

Import this **in addition to** the 8 core modules for aggregation / reference-grade workflows:

- `news-evening-analysis`
- `news-weekly-review`
- `news-monthly-review`
- `news-week-ahead`
- `news-month-ahead`
- `news-quarter-ahead` (long-horizon — also imports `ext/long-horizon-forecasting.md`)
- `news-year-ahead` (long-horizon — also imports `ext/long-horizon-forecasting.md`)
- `news-election-cycle` (long-horizon — also imports `ext/long-horizon-forecasting.md` and `ext/cycle-rollover.md`)
- `news-realtime-monitor`

These are the flagship editorial surfaces of Riksdagsmonitor. Tier-C rules are **additive**, not replacements — all 23 Family A/B/C/D artifacts from `04-analysis-pipeline.md` are already mandatory for every workflow. Tier-C adds depth multipliers, cross-type synthesis, sibling-citation requirements and a higher article-output floor.

> 🛠 **File-write contract**: every aggregation artifact, every cross-type extension to `cross-reference-map.md`, every depth-multiplier expansion of Family A/B/C/D files MUST be written with the `edit` tool. **Never** use `python3`, `node -e`, `sed -i`, `echo … > file`, `tee file`, or unquoted heredocs (`<<EOF`). See [`01-bash-and-shell-safety.md` §File creation & overwrite strategy](../01-bash-and-shell-safety.md).

## Artifact count — identical to single-type workflows

All aggregation workflows produce the same **23 always-on artifacts** (Family A 9 + Family B 2 + Family C 5 + Family D 7) defined in [`04-analysis-pipeline.md`](../04-analysis-pipeline.md#23-required-artifacts-every-workflow-every-run). No extra files are added at the Tier-C level. What changes is:

- **Depth** — each artifact is expanded under the period-scope multiplier below.
- **Cross-type synthesis** — aggregation workflows must read sibling per-type folders and cite them in `cross-reference-map.md`.
- **Article floor** — Tier-C articles require ≥ 1 500 words vs 1 000 for single-type.

## Period-scope multipliers (depth calibration)

Aggregation depth scales with the period covered. Multiply the `comprehensive` minimum times in `04-analysis-pipeline.md` §Depth calibration by:

| Workflow | Multiplier | Rationale |
|----------|-----------|-----------|
| `news-realtime-monitor` | 0.8× | Single-event brief; may trim historical context. |
| `news-evening-analysis` | 1.0× | Standard day-in-review. |
| `news-week-ahead` / `news-weekly-review` | 1.2× | 5–7 day window synthesis. |
| `news-month-ahead` / `news-monthly-review` | 1.5× | 30-day window; longitudinal patterns required. |
| `news-quarter-ahead` | 1.7× | 90-day window; parliamentary-season lens; long-horizon-forecasting rules apply. |
| `news-year-ahead` | 2.0× | 365-day window; PESTLE blocking; full Nordic-peer IMF compare. |
| `news-election-cycle` | 2.5× | 4-year mandate; 24th artifact (`cycle-trajectory.md`); PESTLE + STRIDE + wildcards blocking. |

All 23 artifacts remain mandatory regardless of multiplier. The multiplier extends per-item body length and framework richness (e.g. month-ahead `coalition-mathematics.md` carries five party-coalition Sainte-Laguë variants vs one for realtime).

## Cross-type synthesis (aggregation only)

Aggregation workflows **must** read sibling article-type analyses produced for the same period and cite them explicitly in `cross-reference-map.md §Sibling folders`:

| Aggregation workflow | Sibling folders to read |
|----------------------|-------------------------|
| `news-evening-analysis` | Today's `propositions/`, `motions/`, `committeeReports/`, `interpellations/`, any `realtime-*/` |
| `news-week-ahead` / `news-weekly-review` | Last 7 days of per-type folders |
| `news-month-ahead` / `news-monthly-review` | Last 30 days of per-type folders |
| `news-quarter-ahead` | Last 90 days of per-type folders + most recent `week-ahead` + `month-ahead` |
| `news-year-ahead` | Last 180 days of per-type folders + ≥ 2 `quarter-ahead` + ≥ 4 `monthly-review` |
| `news-election-cycle` | Last 365 days of per-type folders + ≥ 2 `year-ahead` + ≥ 12 `monthly-review` |
| `news-realtime-monitor` | Prior 7 days' `realtime-*/` for continuity chain |

Cross-references go into `cross-reference-map.md` with one entry per sibling folder read. Missing cross-type citations fail the gate.

## Recent-daily synthesis ingestion

For `news-week-ahead`, `news-month-ahead`, `news-weekly-review`, `news-monthly-review` and `news-realtime-monitor`, before Pass 1 analysis:

1. Read every `synthesis-summary.md` **and** `intelligence-assessment.md` from the lookback window.
2. Extract unique `dok_id` references, stakeholder names, and open PIRs.
3. Record the ingestion list in `data-download-manifest.md §Reference Analyses`.
4. Use the extracted entities as input to Pass 1 SWOT, risk, stakeholder, scenario, and forward-indicators files.
5. Propagate every unresolved PIR from prior-cycle `intelligence-assessment.md` into the current-cycle version.

## Tier-C additive gate

The 23-artifact gate in `05-analysis-gate.md` already runs on every workflow. Tier-C adds the following **additive** check block — run it **after** the core gate passes:

```
set -Eeuo pipefail
ANALYSIS_DIR="${ANALYSIS_DIR:-}"
[ -n "$ANALYSIS_DIR" ] || { echo "❌ ANALYSIS_DIR is not set; run the core-gate block from 05-analysis-gate.md first"; exit 1; }
[ -d "$ANALYSIS_DIR" ] || { echo "❌ ANALYSIS_DIR does not exist: $ANALYSIS_DIR"; exit 1; }
FAIL=0

# Tier-C additive check 1 — cross-reference-map.md cites ≥ 1 sibling folder under analysis/daily/
if [ -s "$ANALYSIS_DIR/cross-reference-map.md" ]; then
  grep -qE 'analysis/daily/[0-9]{4}-[0-9]{2}-[0-9]{2}/[A-Za-z0-9_-]+' "$ANALYSIS_DIR/cross-reference-map.md" \
    || { echo "❌ tier-c: cross-reference-map.md missing sibling-folder citations (expected analysis/daily/<date>/<type>)"; FAIL=1; }
fi

# Tier-C additive check 2 — intelligence-assessment.md ingests prior-cycle PIRs (Tier-C only)
if [ -s "$ANALYSIS_DIR/intelligence-assessment.md" ]; then
  grep -qE '(Prior[- ]cycle|Carried[- ]forward|Previous[- ]PIR|Open[[:space:]]+PIR)' "$ANALYSIS_DIR/intelligence-assessment.md" \
    || { echo "❌ tier-c: intelligence-assessment.md missing prior-cycle PIR ingestion section"; FAIL=1; }
fi

[ "$FAIL" -eq 0 ] || exit 1
```

The core structural checks (scenario count ≥ 3, comparator rows ≥ 2, Key Judgments ≥ 3, ACH hypotheses ≥ 3, forward indicators ≥ 10, ICD 203 audit, BLUF section) are enforced by `05-analysis-gate.md` checks 7–8 and apply to **every** workflow. If the Tier-C additive block is promoted to `scripts/validate-tier-c-gate.ts`, update this module accordingly.

## Article expectations

Tier-C articles are the editorial flagship. Floor:

- ≥ 1 500 words (vs 1 000 for single-type).
- All 5 mandatory analytical sections present (vs 3 of 5).
- ≥ 5 `dok_id` references.
- ≥ 2 charts (economic + political).
- Executive brief linked from the article.
- Scenario table (from `scenario-analysis.md`) embedded in the article.
- Forward-watch block (from `forward-indicators.md` top 3 triggers) embedded in the article.
