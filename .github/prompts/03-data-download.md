# 03 — Data Download

## Pre-flight: existing analysis check (improvement-mode router)

This pre-flight decides whether the run is a **first generation** (`IMPROVEMENT_MODE=false`) or an **improvement re-run** (`IMPROVEMENT_MODE=true`). Both branches run analysis work, regenerate `article.md`, regenerate rendered HTML, and produce one PR. The only legitimate exit conditions live in [`07-commit-and-pr.md §No-op policy`](07-commit-and-pr.md).

Run as the **first action** after MCP pre-warm, before any download:

```bash
ANALYSIS_DIR="analysis/daily/$ARTICLE_DATE/$SUBFOLDER"
NEWS_DIR="news"

IMPROVEMENT_MODE=false
ALL_PRESENT=true
EXPECTED=23
CHECKED=0
PRESENT=0
# 23 required artifacts (Families A+B+C+D) — every workflow, every run.
# We feed them via a here-doc so the loop never builds an inline bash array
# (the AWF sandbox flags `REQ=(...); for f in "${REQ[@]}"`; see
# 01-bash-and-shell-safety.md §Banned expansion patterns).
FIRST_MISSING=""
while IFS= read -r f; do
  [ -z "$f" ] && continue
  CHECKED=$((CHECKED + 1))
  if [ -s "$ANALYSIS_DIR/$f" ]; then
    PRESENT=$((PRESENT + 1))
  else
    ALL_PRESENT=false
    [ -z "$FIRST_MISSING" ] && FIRST_MISSING="$f"
  fi
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

# Tier-C workflows add no new files — all 23 are already mandatory. Tier-C
# adds cross-type synthesis + period multipliers via ext/tier-c-aggregation.md
# and the gate in 05-analysis-gate.md.

[ "$ALL_PRESENT" = "true" ] && IMPROVEMENT_MODE=true

# Broaden the router: a partial baseline (only synthesis-summary.md present) is
# also usable, matching `07-commit-and-pr.md §No-op policy` (no-op forbidden
# when any improvement baseline exists).
if [ "$IMPROVEMENT_MODE" = "false" ] && [ -s "$ANALYSIS_DIR/synthesis-summary.md" ]; then
  IMPROVEMENT_MODE=true
fi

# Existing rendered HTML for this date + subfolder. Matches renderer convention
# `news/$ARTICLE_DATE-$SUBFOLDER-{lang}.html` (subfolder may contain hyphens).
EXISTING_HTML_COUNT=$(find "$NEWS_DIR" -maxdepth 1 -type f -name "$ARTICLE_DATE-$SUBFOLDER-*.html" -print 2>/dev/null | wc -l | tr -d '[:space:]')
[ -z "$EXISTING_HTML_COUNT" ] && EXISTING_HTML_COUNT=0

echo "IMPROVEMENT_MODE=$IMPROVEMENT_MODE  (required artifacts: $PRESENT present of $EXPECTED checked, all-present: $ALL_PRESENT, first missing: ${FIRST_MISSING:-none}, existing news/*.html: $EXISTING_HTML_COUNT)"
```

## Early-scaffold marker (resilience — write **immediately** after pre-flight)

Writing a tracked on-disk file *before* the first MCP call guarantees a non-empty diff even when every MCP attempt fails — turning a would-be `safeoutputs___noop` into a partial `safeoutputs___create_pull_request` with the failure documented.

Run **once**, immediately after the pre-flight block above and **before** the first `download-parliamentary-data.ts` invocation:

```bash
set -euo pipefail
mkdir -p "$ANALYSIS_DIR"
SCAFFOLD="$ANALYSIS_DIR/data-download-manifest.md"
if [ ! -s "$SCAFFOLD" ]; then
  AGENT_START_EPOCH="$(cat /tmp/gh-aw/agent-start.epoch 2>/dev/null || date -u +%s)"
  AGENT_START_ISO="$(date -u -d "@$AGENT_START_EPOCH" '+%Y-%m-%dT%H:%M:%SZ')"
  # NOTE: this is the **only** allowed unquoted-heredoc file-write in the prompt
  # set — body is exclusively `$ENV_VAR` references + short literals, no agent
  # content, ≤ 20 lines. See `01-bash-and-shell-safety.md §Banned for file writes`.
  # All subsequent artifacts MUST use the `edit` tool.
  cat > "$SCAFFOLD" <<EOF
# Data download manifest — scaffold

**Workflow**: ${GITHUB_WORKFLOW:-unknown}
**Run**: ${GITHUB_RUN_ID:-unknown} attempt ${GITHUB_RUN_ATTEMPT:-1}
**Started (UTC)**: $AGENT_START_ISO
**Requested date**: $ARTICLE_DATE
**Subfolder**: $SUBFOLDER
**Improvement mode**: $IMPROVEMENT_MODE
**Status**: scaffold — populated as the pipeline progresses.

> This file is written before any MCP call so even a fully-failed run
> produces a non-empty diff and a partial PR rather than a silent no-op.

## MCP attempts
_(populated by 02-mcp-access.md §Three-attempt connect protocol)_

## Per-document table
_(populated by the download step via the \`edit\` tool — never \`cat >>\` and never \`python3\`)_
EOF
  echo "✅ scaffold marker written: $SCAFFOLD"
fi
```

The download step appends to this file using the `edit` tool (str-replace at the section anchor, or insert before the EOF marker line). See [`01-bash-and-shell-safety.md §File creation & overwrite strategy`](01-bash-and-shell-safety.md). When MCP is unreachable from start, the per-document table stays empty and the MCP-attempts section explains why.

| `IMPROVEMENT_MODE` | Behaviour |
|--------------------|-----------|
| `false` | First generation for this `$ARTICLE_DATE` + `$SUBFOLDER` (full 23 artifacts not all present **and** no `synthesis-summary.md` baseline). Some artifacts may already exist from a partial prior run — still first-generation unless all 23 are present or `synthesis-summary.md` exists. Continue: full pipeline → [`04-analysis-pipeline.md`](04-analysis-pipeline.md) (Pass 1 + Pass 2) → [`05-analysis-gate.md`](05-analysis-gate.md) → [`06-article-generation.md`](06-article-generation.md) (aggregate + render) → [`07-commit-and-pr.md`](07-commit-and-pr.md). |
| `true` | Prior analysis exists (all 23 artifacts, or at least `synthesis-summary.md`). Re-run the download script to pick up any new `dok_id`s, then enter **improvement mode** in [`04-analysis-pipeline.md`](04-analysis-pipeline.md): read every existing artifact, fill any missing required artifact, extend the rest with new evidence / sharper judgments / closed gaps, run a mandatory Pass 2 read-back, then **always** re-aggregate `article.md` (English only) and re-render `news/$ARTICLE_DATE-$SUBFOLDER-{en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh}.html` (all 14 languages) via the localized executive-brief cascade. Per-language Markdown `article.<lang>.md` files are forbidden by `scripts/validate-file-ownership.ts` ([`00-base-contract.md §Output language — English only`](00-base-contract.md), [`06-article-generation.md §Step 2`](06-article-generation.md)). The run produces exactly one PR. |

**Folder reuse rule**: `$ANALYSIS_DIR` is reused across runs for the same `$ARTICLE_DATE` + `$SUBFOLDER` when `force_generation=false`. The legacy auto-suffix (`propositions-2`, `propositions-3`, …) is the explicit escape hatch when `force_generation=true` — a forced rerun on a merged day produces a fresh parallel analysis without trampling the existing one.

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

If `force_generation=true` on a day whose base subfolder already contains `synthesis-summary.md` from a merged run, auto-suffix the subfolder (`propositions-2`, `propositions-3`, …) to preserve the merged analysis. Under default `force_generation=false`, reuse the same base subfolder.

## Download pipeline

**Document-type** workflows (propositions, motions, committee-reports, interpellations):

```
source scripts/mcp-setup.sh
npx tsx scripts/download-parliamentary-data.ts \
  --date "$ARTICLE_DATE" --limit 20 --doc-type "$DOC_TYPE" \
  2>&1 | tee /tmp/pipeline-output.log
```

File-budget constraint: safe-outputs `create_pull_request` hard-caps at **100 files** (E003). With 23 core artifacts + README + article.md + per-document analyses + HTML + JSON, `--limit 20` keeps the total under 80. Cap document-type workflows at `--limit 20`. Aggregation workflows may use `--limit 30` because they produce fewer per-document files.

**Aggregation** workflows (evening-analysis, week-ahead, month-ahead, weekly-review, monthly-review, realtime-monitor):

```
source scripts/mcp-setup.sh
npx tsx scripts/download-parliamentary-data.ts --date "$ARTICLE_DATE" --limit 30 \
  2>&1 | tee /tmp/pipeline-output.log
```

Then run `npx tsx scripts/catalog-downloaded-data.ts --pending-only` to produce the per-document catalogue.

## Full-text enrichment

For every downloaded document reference, fetch full text when available (`get_dokument_innehall` with `include_full_text: true` on riksdag-regering). Documents without full text are tagged `metadata-only` in the manifest.

**Top-N floor** (current download-order driven): full-text-fetch at least the **first 3 documents in the current filtered download order** (or all if < 3). For `comprehensive` / Tier-C runs the floor is **first 5**. Any L2+ Priority or L3 Intelligence-grade document MUST have full text — `metadata-only` for L2+ docs is an automatic Pass-2 improvement target and is reported in `methodology-reflection.md §Content Metrics`. Use `download-parliamentary-data.ts --auto-full-text-top-n=3` (`5` for Tier-C) where supported; the flag does **not** apply DIW significance ranking before selection (operates on current filtered array order — see `scripts/download-parliamentary-data.ts` parser comment). For DIW-ranked selection, determine the ordering separately. Gate check 10 enforces ≥ 2 successful retrievals when the manifest writes a `## Full-Text Fetch Outcomes` table.

## Prior-voteringar enrichment

For every committee-report, motion, or interpellation cycle, enrich the manifest with **prior-vote context** for the same committee + topic cluster. Call `search_voteringar` (riksdag-regering MCP) with the committee `bet` prefix (`KU`, `JuU`, `FöU`, `SoU`, `SfU`, `UbU`, `FiU`) and/or the proposition number a motion responds to, scoped to the **last 4 riksmöten** (`rm` filter). Record the 3–5 most relevant prior votes (Ja/Nej/Avstår tally + party split) under `## Prior-Voteringar Enrichment` in `data-download-manifest.md`. Required input for `historical-parallels.md`, `coalition-mathematics.md`, `swot-analysis.md` evidence rows. If no prior votes exist, state `Prior voteringar: no directly comparable vote found in last 4 riksmöten`.

### Voteringar fallback for new riksmöten

When a new riksmöte has begun and no votes are yet indexed for the current session (common in September–November, occasionally until the first betänkande vote in a committee cycle), apply this fallback hierarchy:

1. **Expand riksmöte scope** — widen `rm` filter from 4 to **6 riksmöten**.
2. **Search by proposition parent** — for motions responding to a proposition, search by the parent proposition's beteckning (e.g. motion responds to prop. 2025/26:242 → search `bet: "2025/26:242"`).
3. **Search by committee + keyword** — committee abbreviation plus a topic keyword from the document title (e.g. `organ: "JuU"` + `avser: "brottslighet"`).
4. **Document the gap explicitly** — if all searches return empty, record: `Prior voteringar: new riksmöte — no votes indexed yet for {committee} in 2025/26; using {rm} cycle proxy (most recent: {dok_id}, {date})`. Cite specific prior vote `dok_id`s rather than "historical patterns".
5. **Tag as methodology limitation** — mark `Prior-voteringar enrichment` row in `methodology-reflection.md §Content Metrics` as 🟡 (partial) with the fallback strategy.

## Statskontoret enrichment

Statskontoret pre-warm is a **mandatory checklist evaluation** for every cycle — the trigger list is **always evaluated**. For each downloaded document, judge against this list; if **any** trigger fires, perform a Statskontoret search; if **none** fires, record the negative finding:

| Trigger | Examples |
|---------|----------|
| Names a recognised agency | Kriminalvården, Polismyndigheten, Försäkringskassan, Skatteverket, Migrationsverket, Arbetsförmedlingen, Socialstyrelsen, Transportstyrelsen, Trafikverket, Naturvårdsverket, Energimyndigheten, SFV, Rymdstyrelsen, Statens institutionsstyrelse |
| Administrative-capacity / regulatory-burden / inter-agency-coordination claim | New mandate, expanded inspection, IT system, case backlog, procurement |
| Governance / public-sector-efficiency dimension | Government propositions touching authority structure, oversight, audit |
| Implementation feasibility risk | Any bill assigning timeline/budget to one or more agencies |

Use `web_fetch` against `https://www.statskontoret.se/` or `https://statskontoret.se/`, cite the report/page URL, record it in `data-download-manifest.md` under `## Statskontoret Cross-Source Enrichment`. When **no** trigger fires, state `Statskontoret pre-warm: no trigger matched (no agency named, no administrative dimension)`. When a trigger fires but no relevant report exists, state `Statskontoret: no directly relevant source found for {trigger}`.

## Lagrådet enrichment

When a downloaded document is a **government proposition** touching constitutional law, fundamental rights (RF / ECHR), criminal procedure, court organisation, secrecy / surveillance, taxation principles, or any matter where Lagrådet (Council on Legislation) review is statutorily required or politically expected, attempt one `web_fetch` against `https://www.lagradet.se/` for the proposition's referral and any published yttrande. The domain is allow-listed in every news workflow's `network.allowed`. If `lagradet.se` is unreachable (transient outage, firewall change), record `Lagrådet: site unreachable as of {retrieval timestamp}` under `## Lagrådet Tracking` in `data-download-manifest.md` and continue with the proposition text plus other reachable primary sources. Otherwise record the referral status (referred / yttrande published / not referred) under the same heading. The advisory text feeds `risk-assessment.md` (Institutional dimension), `threat-analysis.md` (procedural-legitimacy attack surface), `forward-indicators.md`. If reachable but no Lagrådet record exists yet, state `Lagrådet: referral pending / no yttrande published as of {retrieval timestamp}` and add a forward indicator dated to the expected referral window.

## Withdrawn-document handling

If a downloaded document has been **withdrawn**, **återtagen** or **avskrivet** before analysis, add it to `## Withdrawn Documents` in `data-download-manifest.md` with: `dok_id`, original title, original sponsor / committee, withdrawal date, withdrawal reason (if stated). Withdrawal is an analytic signal (internal coordination failure, strategic repositioning, lost majority) — examine it in `synthesis-summary.md` and `devils-advocate.md`.

## PIR carry-forward (pre-warm)

Read prior-cycle PIRs **before** the download proper:

```bash
PRIOR_PIR="$(find analysis/daily -maxdepth 4 -name pir-status.json -path "*/$SUBFOLDER/*" -newermt "$ARTICLE_DATE - 14 days" -print 2>/dev/null | sort | tail -n 5)"
[ -n "$PRIOR_PIR" ] && cat $PRIOR_PIR
```

Surface every `status: open` PIR into the analysis plan so the run actively tries to close it (drives `forward-indicators.md`, `intelligence-assessment.md §PIR section`, `methodology-reflection.md §Backlog`). Document carried-forward PIRs under `## PIR Carry-Forward` in `data-download-manifest.md`. PIRs answered this cycle flip to `answered` (with `answer_summary`) in the new `pir-status.json`; still-open PIRs propagate forward.

## Lookback fallback

If `$ARTICLE_DATE` returns zero documents, loop `DAYS_BACK = 1..7`:

```
LOOKBACK_DATE=$(date -u -d "$ARTICLE_DATE - $DAYS_BACK days" '+%Y-%m-%d')
```

Re-run the download script with `--date "$LOOKBACK_DATE"`, copy artifacts back under the original `$ARTICLE_DATE` subfolder, note the lookback in `data-download-manifest.md`. Empty analysis is not committed.

## Provenance manifest

Always produce `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/data-download-manifest.md` containing:

- Workflow name, run ID, UTC timestamp.
- Requested date, effective date (after lookback), window used.
- Per-document table: `dok_id`, title, type, `hangar_id`, committee, retrieval timestamp, full-text status, parti (or `[unconfirmed]` if missing in source — see [`04-analysis-pipeline.md §Party-attribution discipline`](04-analysis-pipeline.md)), withdrawal status.
- MCP server availability notes (retries, partial failures).
- Non-MCP public sources used: Statskontoret report/page URLs; Lagrådet referrals/yttrande for major bills.
- Sections (literal headings, when applicable): `## Full-Text Fetch Outcomes`, `## Prior-Voteringar Enrichment`, `## Statskontoret Cross-Source Enrichment`, `## Lagrådet Tracking`, `## Withdrawn Documents`, `## PIR Carry-Forward`.

## Next step

On success, proceed to [`04-analysis-pipeline.md`](04-analysis-pipeline.md). Do not start analysis while `data-download-manifest.md` is missing or empty.
