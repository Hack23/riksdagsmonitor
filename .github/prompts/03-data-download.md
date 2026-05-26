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
_(populated by \`scripts/download-parliamentary-data\` via \`writeManifest()\` — rewrites the manifest in full; agent uses the \`edit\` tool only for post-download amendments)_
EOF
  echo "✅ scaffold marker written: $SCAFFOLD"
fi
```

The scaffold above is **only** a pre-MCP fallback marker. Once `scripts/download-parliamentary-data` succeeds, its `writeManifest()` step (`scripts/download-parliamentary-data/pre-article-analysis/output-writer.ts`) rewrites `data-download-manifest.md` in full via `fs.writeFileSync` — the per-document table is script-generated, not agent-appended. If the agent must subsequently amend the manifest (e.g. recording a Statskontoret / Lagrådet enrichment retrieval added after the script ran), use the `edit` tool against the existing section anchors (`## MCP attempts`, `## Per-document table`, or the `_(populated by …)_` placeholder lines). See [`01-bash-and-shell-safety.md §File creation & overwrite strategy`](01-bash-and-shell-safety.md). When MCP is unreachable from start, the scaffold marker is the *only* version of the file and the MCP-attempts section explains why.

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

### Pre-publication committee documents (status `planerat` / `Dokumentet är inte publicerat`)

Newly assigned betänkanden frequently appear in `get_betankanden` with `status: planerat` and a future scheduled date. Calling `get_dokument_innehall` on them returns a metadata stub or the literal string `Dokumentet är inte publicerat` rather than substantive text. Recurring example: `HD01JuU47` / `HD01JuU48` / `HD01UU24` on 2026-05-26 — three of four committee documents in the run.

When this happens:

1. **Detect** — treat any of the following as "pre-publication": (a) the body of `get_dokument_innehall` contains `Dokumentet är inte publicerat` (or similar Swedish phrasing for "not yet published"), (b) `status === "planerat"` and the response body is shorter than ~500 chars, (c) the schedulingDate is in the future.
2. **Manifest tagging** — in `## MCP Coverage State` and `## Full-Text Fetch Outcomes`, set `coverage_state: pre_publication` (not `full_text`) and `full_text_available: false`. Add a notes column entry of the form `pre_publication — body unavailable until {scheduled_date}`.
3. **Defer, do not retry within the same run** — record the document in `## Deferred Retrieval Queue` with `resourceType: document_fulltext`, `reason: pre_publication`, `retryAfter: {scheduled_date or scheduled_date + 1d}`. Do **not** repeatedly call `get_dokument_innehall` for the same dok_id in one run.
4. **Methodology-reflection** — list pre-publication docs explicitly in `methodology-reflection.md §Analytical Limitations`. The analysis can proceed on title + committee + scheduling signals; mark every claim derived from them with confidence `LIKELY` / `POSSIBLE`, never `ALMOST CERTAIN`.

### Proposition full-text — HTML wrapper extraction failure

`get_dokument_innehall` on government propositions (e.g. `HD03250`, `HD03254`, `HD03265`, `HD03267`) frequently returns an HTML payload that wraps a PDF-converted body with extensive CSS, navigation chrome, and almost no extractable plaintext. Recurring example: propositions/2026-05-26 — *"HTML format returned but content embedded in CSS-heavy PDF-to-HTML conversion; substantive text extraction failed"* on 10/10 propositions.

When this happens:

1. **Detect** — the response is non-empty (so `full_text_available` looks `true`) but `stripHtmlTags(body).trim().length < 400` or the ratio of `<style>`/`<script>` bytes to plaintext bytes exceeds 5:1.
2. **Manifest tagging** — set `coverage_state: pdf_html_wrapper` and `full_text_available: partial` (not `true`). Add a notes column entry: `pdf_html_wrapper — extracted {N} chars of plaintext; PDF fallback recommended`.
3. **Fallback** — for propositions, the canonical text lives on `data.riksdagen.se/dokument/{dok_id}` as PDF. The current pipeline does not fetch PDFs; record the gap and use the title + committee + ministry signals plus any prior SOU report referenced in the proposition's metadata (`relateradedokument`).
4. **Methodology-reflection** — list affected propositions explicitly in `methodology-reflection.md §Data Quality Assessment`; downgrade content-extraction confidence to 🟧 MEDIUM with an explicit `pdf_html_wrapper` reason rather than the vague `MEDIUM — analysis based on metadata`.

## Prior-voteringar enrichment

For every committee-report, motion, or interpellation cycle, enrich the manifest with **prior-vote context** for the same committee + topic cluster. Call `search_voteringar` (riksdag-regering MCP), scoped to the **last 4 riksmöten** (`rm` filter). Record the 3–5 most relevant prior votes (Ja/Nej/Avstår tally + party split) under `## Prior-Voteringar Enrichment` in `data-download-manifest.md`. Required input for `historical-parallels.md`, `coalition-mathematics.md`, `swot-analysis.md` evidence rows. If no prior votes exist, state `Prior voteringar: no directly comparable vote found in last 4 riksmöten`.

### `search_voteringar` query shape — CRITICAL

**Do NOT pass a committee prefix in `bet`.** The `bet` parameter is a *specific* document beteckning (e.g. `AU10`, `JuU17`, `2024/25:JuU17`), not a committee abbreviation. Passing `bet: "JuU"` will deterministically return 0 rows — this is the leading cause of the recurring "API returned 0 results — likely indexing lag or query format issue" line in methodology-reflection files. Use one of the following query patterns:

1. **Topic keyword scoped to a riksmöte** — `{"avser": "brottslighet", "rm": "{CURRENT_RM}", "limit": 20}` (the `avser` field matches the vote subject). This is the preferred form for committee-scoped topic searches.
2. **Parent proposition beteckning** — for motions/betänkanden responding to a proposition, use the full beteckning of that proposition: `{"bet": "{CURRENT_RM}:JuU17", "limit": 20}`.
3. **Unfiltered window + post-filter** — `{"rm": "{CURRENT_RM}", "limit": 100}` then post-filter the returned `bet` field in your code/notes for the committee prefix (`bet.startsWith("JuU")`). Use this when the topic keyword is too narrow.
4. **Party + riksmöte slice** — `{"parti": "S", "rm": "{CURRENT_RM}", "limit": 50}` when the analysis hinges on a single party's voting pattern.

Never use `organ:` with `search_voteringar` — that parameter belongs to `search_dokument`, not `search_voteringar`.

### Voteringar fallback for new riksmöten

When a new riksmöte has begun and no votes are yet indexed for the current session (common in September–November, occasionally until the first betänkande vote in a committee cycle), apply this fallback hierarchy:

1. **Expand riksmöte scope** — widen `rm` filter from 4 to **6 riksmöten**.
2. **Search by proposition parent** — for motions responding to a proposition, search by the parent proposition's full beteckning (e.g. motion responds to prop. {CURRENT_RM}:242 → search `bet: "{CURRENT_RM}:242"`). Use a full `<rm>:<bet>` string, never a committee prefix alone.
3. **Search by topic keyword** — drop `bet` entirely and use `avser` plus the riksmöte (e.g. `avser: "brottslighet"`, `rm: "{CURRENT_RM}"`).
4. **Document the gap explicitly** — if all searches return empty, record: `Prior voteringar: new riksmöte — no votes indexed yet for {committee} in {CURRENT_RM}; using {PRIOR_RM} cycle proxy (most recent: {dok_id}, {date})`. Cite specific prior vote `dok_id`s rather than "historical patterns".
5. **Tag as methodology limitation** — mark `Prior-voteringar enrichment` row in `methodology-reflection.md §Content Metrics` as 🟡 (partial) with the fallback strategy.

> **Self-check before writing the manifest row:** if `search_voteringar` returned 0 for the current riksmöte, did you retry with the patterns above (`avser` keyword, full beteckning, unfiltered + post-filter)? A bare zero result without those retries is a Pass-2 improvement target.

## Statskontoret enrichment

Statskontoret pre-warm is a **mandatory checklist evaluation** for every cycle — the trigger list is **always evaluated**. For each downloaded document, judge against this list; if **any** trigger fires, perform a Statskontoret search; if **none** fires, record the negative finding:

| Trigger | Examples |
|---------|----------|
| Names a recognised agency | Kriminalvården, Polismyndigheten, Försäkringskassan, Skatteverket, Migrationsverket, Arbetsförmedlingen, Socialstyrelsen, Transportstyrelsen, Trafikverket, Naturvårdsverket, Energimyndigheten, SFV, Rymdstyrelsen, Statens institutionsstyrelse |
| Administrative-capacity / regulatory-burden / inter-agency-coordination claim | New mandate, expanded inspection, IT system, case backlog, procurement |
| Governance / public-sector-efficiency dimension | Government propositions touching authority structure, oversight, audit |
| Implementation feasibility risk | Any bill assigning timeline/budget to one or more agencies |

Use `web_fetch` to search the Statskontoret publications index — **do not** fetch the root domain `https://www.statskontoret.se/` and conclude "no relevant report found": the homepage is a marketing page and contains no searchable list of reports. Use the following concrete patterns instead:

1. **Publications index** — `https://www.statskontoret.se/publikationer/` lists recent reports with title + date. Fetch this page first and scan for the triggered agency name or topic keyword.
2. **Agency-scoped landing pages** — Statskontoret maintains topical landing pages such as `https://www.statskontoret.se/var-verksamhet/uppfoljning-av-statliga-myndigheter/` (agency-oversight reports) and `https://www.statskontoret.se/var-verksamhet/forvaltningspolitiska-utredningar/`. Use these when the trigger is "administrative capacity" or "governance".
3. **Site search** — `https://www.statskontoret.se/?s={URL-encoded-keyword}` returns a results page; cite the first 1–3 hits whose title plausibly matches the trigger.
4. **External fallback** — if `statskontoret.se` is unreachable, try `web_search` with `site:statskontoret.se {keyword}`. Cite the search result URL, not a Google search URL.

Cite the specific report/page URL (not the root domain), record it in `data-download-manifest.md` under `## Statskontoret Cross-Source Enrichment`. When **no** trigger fires, state `Statskontoret pre-warm: no trigger matched (no agency named, no administrative dimension)`. When a trigger fires, the publications index was reached, and no report within the last 24 months matches the trigger, state `Statskontoret: no directly relevant 2024–2026 report found for {trigger} (publications index scanned {URL})`. Without an explicit reference to the publications index, a "no source found" line is a Pass-2 improvement target.

## Lagrådet enrichment

When a downloaded document is a **government proposition** touching constitutional law, fundamental rights (RF / ECHR), criminal procedure, court organisation, secrecy / surveillance, taxation principles, or any matter where Lagrådet (Council on Legislation) review is statutorily required or politically expected, attempt one `web_fetch` for the proposition's referral and any published yttrande. The `lagradet.se` domain is allow-listed in every news workflow's `network.allowed`.

Use these concrete endpoints — **do not** fetch the root domain `https://www.lagradet.se/` and conclude "referral pending":

1. **Yttranden index** — `https://www.lagradet.se/yttranden/` lists Lagrådet's published yttranden in reverse-chronological order with the referring department and date. Scan for the proposition's title or related SOU/Ds keyword.
2. **Year-filtered yttranden** — `https://www.lagradet.se/yttranden/?_yr={YEAR}` (e.g. `?_yr=2026`).
3. **External fallback** — `web_search` with `site:lagradet.se "{proposition title or core keyword}"` if the on-site filter does not surface the referral.

If `lagradet.se` is unreachable (transient outage, firewall change), record `Lagrådet: site unreachable as of {retrieval timestamp}` under `## Lagrådet Tracking` in `data-download-manifest.md` and continue with the proposition text plus other reachable primary sources. Otherwise record one of:

- `Lagrådet: yttrande published {date} — {URL}` (with the yttrande PDF/page URL).
- `Lagrådet: referral registered {date}, yttrande pending — yttranden index scanned {URL}` (only if the proposition appears in the referrals page but no yttrande yet).
- `Lagrådet: no referral located for prop. {beteckning} as of {retrieval timestamp} (yttranden index scanned {URL})` — only after scanning the index, not based on a root-domain fetch.

The advisory text feeds `risk-assessment.md` (Institutional dimension), `threat-analysis.md` (procedural-legitimacy attack surface), `forward-indicators.md`. Add a forward indicator dated to the expected yttrande window when the referral is registered but no yttrande is yet published.

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
