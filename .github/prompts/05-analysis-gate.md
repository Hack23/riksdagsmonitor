# 05 — Analysis Gate (single blocking gate)

This is the **only** gate separating analysis from article generation. If it fails, fix the analysis and re-run it. Never bypass.

## Inputs

- `$ANALYSIS_DIR = analysis/daily/$ARTICLE_DATE/$SUBFOLDER`
- 23 required artifacts (Families A + B + C + D from `04-analysis-pipeline.md`) + per-document Family E.
- Authoritative reference — [`analysis/methodologies/artifact-catalog.md`](../../analysis/methodologies/artifact-catalog.md) (single source of truth for every artifact), [`analysis/methodologies/per-artifact-methodologies.md`](../../analysis/methodologies/per-artifact-methodologies.md) (per-artifact Inputs / Analytic-moves / Evidence-rules / Anti-patterns), [`analysis/methodologies/reference-quality-thresholds.json`](../../analysis/methodologies/reference-quality-thresholds.json) (per-article-type line floors + tradecraft signals).

## Checks (all must pass)

1. **Artifact existence** — every file in Families A, B, C, D is present and non-empty:
   - **Family A (9)** — `README.md`, `executive-brief.md`, `synthesis-summary.md`, `significance-scoring.md`, `classification-results.md`, `swot-analysis.md`, `risk-assessment.md`, `threat-analysis.md`, `stakeholder-perspectives.md`.
   - **Family B (2)** — `data-download-manifest.md`, `cross-reference-map.md`.
   - **Family C (5)** — `scenario-analysis.md`, `comparative-international.md`, `devils-advocate.md`, `intelligence-assessment.md`, `methodology-reflection.md` ⭐.
   - **Family D (7)** — `election-2026-analysis.md`, `voter-segmentation.md`, `coalition-mathematics.md`, `historical-parallels.md`, `media-framing-analysis.md`, `implementation-feasibility.md`, `forward-indicators.md`.
2. **Per-document coverage (Family E)** — `$ANALYSIS_DIR/documents/` contains one `.md` per `dok_id` listed in `data-download-manifest.md` (metadata-only documents are tagged, not skipped).
3. **No stubs** — zero occurrences of `AI_MUST_REPLACE`, `[REQUIRED]`, `TODO:`, or `Lorem ipsum` across all artifacts.
4. **Evidence citations** — `swot-analysis.md` and `significance-scoring.md` contain at least one piece of primary-source evidence per quadrant / ranked item. Accepted evidence patterns: a `dok_id` (e.g. `H901FiU1`, `HD01CU27`) **or** a primary-source URL host (`riksdagen.se`, `regeringen.se`, `scb.se`, `statskontoret.se`, `worldbank.org`, `api.imf.org`, `data.imf.org`, `www.imf.org`). Enforced against SWOT `### Strengths/Weaknesses/Opportunities/Threats` sections (bullets + table rows) and significance-scoring bullets **plus** ranking table rows and Mermaid node labels.
5. **Mermaid diagrams** — every Family A and Family D synthesis file contains ≥ 1 Mermaid diagram with colour-coded `style` directives (or `themeVariables` / `%%{init …}` block).
6. **Pass-2 done** — agent has read back each enforced Pass-2 artifact after creation and committed improvements: all Family A, B, C, and D artifacts except `data-download-manifest.md`. (Enforced by file mtime diff: final file mtime > creation time + 3 min, OR two git-history snapshots on disk.)
7. **Family C structure checks** (extension-quality gate):
   - `executive-brief.md` contains a `## 🎯 BLUF` section **and** a `## 🧭 3 Decisions` (or `Decisions This Brief Supports`) section.
   - `intelligence-assessment.md` declares **≥ 3 Key Judgments** (enforced structurally by `Key Judgment` / `KJ-*` header count ≥ 3) each carrying at least one confidence label (`VERY HIGH`, `HIGH`, `MEDIUM`, `LOW`, `VERY LOW`) — the confidence-label presence is audited by the implementation's `grep -cE '(VERY HIGH|HIGH|MEDIUM|LOW|VERY LOW)'` check on the same file — and the file references at least one PIR.
   - `scenario-analysis.md` declares **≥ 3 distinct scenarios** (headers matching `Scenario` count ≥ 3).
   - `comparative-international.md` declares a comparator set or **≥ 2 comparator rows** (structural check, see Tier-C gate).
   - `devils-advocate.md` declares **≥ 3 competing hypotheses** (headers matching `Hypothesis`/`H1`/`H2`/`H3` count ≥ 3, ACH-style).
   - `methodology-reflection.md` is non-empty and contains an **ICD 203 audit** marker or ≥ 3 named methodology improvements.
8. **Family D structure checks**:
   - `forward-indicators.md` declares **≥ 10 dated indicators** (bullet or table rows matching a date pattern across the four horizon sections).
   - `coalition-mathematics.md` contains a seat-count table (≥ 1 table row with `Ja`/`Nej`/`Avstår` or a party-to-seats mapping).
9. **Supplementary artifacts** — see §Supplementary checks below (blocking for aggregation/Tier-C/multi-run).
10. **Top-2 full-text availability** — when `data-download-manifest.md` contains a `## Full-Text Fetch Outcomes` table (written by `download-parliamentary-data.ts --auto-full-text-top-n`), at least 2 top documents must have `full_text_available=true`. Add `<!-- full-text-fallback: <reason> -->` to the manifest to bypass (e.g. when full text is genuinely unavailable from the MCP server or the flag was not used).

## Implementation

No dedicated validator script exists yet — implement the checks as an inline bash gate. Full implementation (covers checks 1–10, with checks 9 and 10 conditional where applicable):

```bash
set -Eeuo pipefail
: "${ARTICLE_DATE:?ARTICLE_DATE must be set}"
: "${SUBFOLDER:?SUBFOLDER must be set}"
ANALYSIS_DIR="analysis/daily/$ARTICLE_DATE/$SUBFOLDER"
[ -d "$ANALYSIS_DIR" ] || { echo "❌ ANALYSIS_DIR does not exist: $ANALYSIS_DIR"; exit 1; }
DOK_RE='[Hh][A-Za-z0-9]{3,}[0-9]+'
EVIDENCE_RE='[Hh][A-Za-z0-9]{3,}[0-9]+|riksdagen\.se|regeringen\.se|scb\.se|statskontoret\.se|worldbank\.org|api\.imf\.org|data\.imf\.org|www\.imf\.org'
FAIL=0

# Materialise required-file lists via /tmp lists so we never build an inline
# bash array — the AWF sandbox rejects `REQ=(...); "${REQ[@]}"` (see
# 01-bash-and-shell-safety.md §Banned expansion patterns).
GATE_REQ_LIST="/tmp/gate-req-$$"; GATE_PASS2_LIST="/tmp/gate-pass2-$$"
GATE_SYNTH_LIST="/tmp/gate-synth-$$"; GATE_DOK_LIST="/tmp/gate-doks-$$"
trap 'rm -f "$GATE_REQ_LIST" "$GATE_PASS2_LIST" "$GATE_SYNTH_LIST" "$GATE_DOK_LIST"' EXIT

write_list() { local out="$1"; shift; printf '%s\n' "$@" > "$out"; }

write_list "$GATE_REQ_LIST" \
  README.md executive-brief.md synthesis-summary.md significance-scoring.md classification-results.md \
  swot-analysis.md risk-assessment.md threat-analysis.md stakeholder-perspectives.md \
  data-download-manifest.md cross-reference-map.md \
  scenario-analysis.md comparative-international.md devils-advocate.md intelligence-assessment.md methodology-reflection.md \
  election-2026-analysis.md voter-segmentation.md coalition-mathematics.md historical-parallels.md \
  media-framing-analysis.md implementation-feasibility.md forward-indicators.md

write_list "$GATE_SYNTH_LIST" \
  synthesis-summary.md swot-analysis.md risk-assessment.md threat-analysis.md stakeholder-perspectives.md \
  significance-scoring.md classification-results.md cross-reference-map.md executive-brief.md \
  election-2026-analysis.md voter-segmentation.md coalition-mathematics.md historical-parallels.md \
  media-framing-analysis.md implementation-feasibility.md forward-indicators.md

# data-download-manifest.md is produced by module 03 and may legitimately be
# unchanged at Pass 2 — exclude it from the Pass-2 evidence check.
write_list "$GATE_PASS2_LIST" \
  synthesis-summary.md swot-analysis.md risk-assessment.md threat-analysis.md stakeholder-perspectives.md \
  significance-scoring.md classification-results.md cross-reference-map.md executive-brief.md README.md \
  scenario-analysis.md comparative-international.md devils-advocate.md intelligence-assessment.md methodology-reflection.md \
  election-2026-analysis.md voter-segmentation.md coalition-mathematics.md historical-parallels.md \
  media-framing-analysis.md implementation-feasibility.md forward-indicators.md

# Check 1 — artifact existence (all 23)
while IFS= read -r f; do
  [ -z "$f" ] && continue
  [ -s "$ANALYSIS_DIR/$f" ] || { echo "❌ missing/empty: $f"; FAIL=1; }
done < "$GATE_REQ_LIST"

# Check 2 — per-document coverage against manifest
if [ -s "$ANALYSIS_DIR/data-download-manifest.md" ]; then
  # Avoid `mapfile -t … < <(…)` — process substitution is best-avoided
  # under the AWF sandbox (01-bash-and-shell-safety.md §Shell hygiene).
  grep -oE "$DOK_RE" "$ANALYSIS_DIR/data-download-manifest.md" | sort -u > "$GATE_DOK_LIST"
  DOK_COUNT=$(wc -l < "$GATE_DOK_LIST" | tr -d ' ')
  [ "${DOK_COUNT:-0}" -gt 0 ] || { echo "❌ manifest has no dok_id entries"; FAIL=1; }
  while IFS= read -r d; do
    [ -z "$d" ] && continue
    d_lc="${d,,}"
    if [ ! -s "$ANALYSIS_DIR/documents/${d}.md" ] \
       && [ ! -s "$ANALYSIS_DIR/documents/${d}-analysis.md" ] \
       && [ ! -s "$ANALYSIS_DIR/documents/${d_lc}.md" ] \
       && [ ! -s "$ANALYSIS_DIR/documents/${d_lc}-analysis.md" ]; then
      echo "❌ documents/${d}.md or documents/${d}-analysis.md missing (any case)"
      FAIL=1
    fi
  done < "$GATE_DOK_LIST"
fi

# Check 3 — no stubs
grep -rIn -e 'AI_MUST_REPLACE' -e '\[REQUIRED\]' -e 'TODO:' -e 'Lorem ipsum' "$ANALYSIS_DIR" \
  && { echo "❌ stub placeholders detected"; FAIL=1; }

# Check 4 — evidence citations per quadrant / ranked item (dok_id OR primary-source URL)
awk -v re="$EVIDENCE_RE" '
  function reset_table() { trow=0 }
  /^###[[:space:]]+.*(Strengths|Weaknesses|Opportunities|Threats)\b/ { sec=$0; reset_table(); next }
  /^#{1,6}[[:space:]]+/ { sec=""; reset_table(); next }
  sec != "" && /^[[:space:]]*[-*][[:space:]]+/ && $0 !~ re {
    printf "❌ swot-analysis.md %s: bullet missing evidence (dok_id or primary-source URL): %s\n", sec, $0; bad=1; next
  }
  sec != "" && /^[[:space:]]*\|/ {
    if ($0 ~ /^[[:space:]|:\-]+$/) next
    trow++
    if (trow == 1) next
    if ($0 !~ re) {
      printf "❌ swot-analysis.md %s: table row missing evidence (dok_id or primary-source URL): %s\n", sec, $0; bad=1
    }
    next
  }
  sec != "" && /^[[:space:]]*$/ { reset_table(); next }
  END { exit bad+0 }
' "$ANALYSIS_DIR/swot-analysis.md" || FAIL=1

awk -v re="$EVIDENCE_RE" '
  function reset_table() { trow=0 }
  /^```mermaid[[:space:]]*$/ { in_mermaid=1; reset_table(); next }
  in_mermaid && /^```[[:space:]]*$/ { in_mermaid=0; next }
  !in_mermaid && /^[[:space:]]*([0-9]+\.[[:space:]]+|[-*][[:space:]]+)/ && $0 !~ re {
    printf "❌ significance-scoring.md ranked item missing evidence (dok_id or primary-source URL): %s\n", $0; bad=1; next
  }
  !in_mermaid && /^[[:space:]]*\|/ {
    if ($0 ~ /^[[:space:]|:\-]+$/) next
    trow++
    if (trow == 1) next
    if ($0 !~ re) {
      printf "❌ significance-scoring.md ranking table row missing evidence (dok_id or primary-source URL): %s\n", $0; bad=1
    }
    next
  }
  !in_mermaid && /^[[:space:]]*$/ { reset_table(); next }
  in_mermaid {
    if ($0 ~ /^[[:space:]]*(%%|style\b|classDef\b|class\b|linkStyle\b|subgraph\b|end\b|graph\b|flowchart\b|quadrantChart\b|mindmap\b|timeline\b|journey\b|gantt\b|pie\b|xychart-beta\b|sequenceDiagram\b|stateDiagram(-v2)?\b|erDiagram\b|sankey-beta\b|gitGraph\b|requirementDiagram\b|block-beta\b)/) next
    if ($0 ~ /[\[\(\{][^][(){}]+[\]\)\}]/ && $0 !~ re) {
      printf "❌ significance-scoring.md Mermaid ranked item missing evidence (dok_id or primary-source URL): %s\n", $0; bad=1
    }
    next
  }
  END { exit bad+0 }
' "$ANALYSIS_DIR/significance-scoring.md" || FAIL=1

# Check 5 — Mermaid + colour-coded config on core synthesis + key extension files
while IFS= read -r f; do
  [ -z "$f" ] && continue
  p="$ANALYSIS_DIR/$f"; [ -s "$p" ] || continue
  grep -qE '^```mermaid' "$p" || { echo "❌ $f: missing Mermaid block"; FAIL=1; }
  if ! grep -qE '^[[:space:]]*style[[:space:]]+' "$p" \
     && ! grep -qE 'themeVariables|%%\{[[:space:]]*init' "$p"; then
    echo "❌ $f: missing Mermaid colour-coded config (no 'style …' directive and no 'themeVariables' / '%%{init …}' block)"
    FAIL=1
  fi
done < "$GATE_SYNTH_LIST"

# Check 6 — Pass-2 evidence (mtime ≥ birth + 180s, OR differing pass1 snapshot on disk)
while IFS= read -r f; do
  [ -z "$f" ] && continue
  p="$ANALYSIS_DIR/$f"; [ -s "$p" ] || continue
  ok=0
  B=$(stat -c %W "$p" 2>/dev/null || echo 0)
  M=$(stat -c %Y "$p" 2>/dev/null || echo 0)
  [ "${B:-0}" -gt 0 ] && [ "${M:-0}" -ge $((B + 180)) ] && ok=1
  [ -s "$ANALYSIS_DIR/pass1/$f" ] && ! cmp -s "$ANALYSIS_DIR/pass1/$f" "$p" && ok=1
  [ "$ok" -eq 1 ] || { echo "❌ $f: Pass-2 evidence missing (mtime<birth+180s and no pass1/ snapshot)"; FAIL=1; }
done < "$GATE_PASS2_LIST"

# Check 7 — Family C structure
if [ -s "$ANALYSIS_DIR/executive-brief.md" ]; then
  grep -qE '^##[[:space:]].*BLUF' "$ANALYSIS_DIR/executive-brief.md" \
    || { echo "❌ executive-brief.md: missing '## BLUF' section"; FAIL=1; }
  grep -qE '^##[[:space:]].*(Decision|Decisions[[:space:]]+This[[:space:]]+Brief)' "$ANALYSIS_DIR/executive-brief.md" \
    || { echo "❌ executive-brief.md: missing 'Decisions' section"; FAIL=1; }
fi
if [ -s "$ANALYSIS_DIR/intelligence-assessment.md" ]; then
  KJ=$(grep -cE '(Key[[:space:]]+Judgment|KJ-?[0-9]+)' "$ANALYSIS_DIR/intelligence-assessment.md" || true)
  [ "${KJ:-0}" -ge 3 ] || { echo "❌ intelligence-assessment.md: fewer than 3 Key Judgments (found ${KJ:-0})"; FAIL=1; }
  CONF=$(grep -cE '(VERY[[:space:]]+HIGH|VERY[[:space:]]+LOW|\bHIGH\b|\bMEDIUM\b|\bLOW\b)' "$ANALYSIS_DIR/intelligence-assessment.md" || true)
  [ "${CONF:-0}" -ge 3 ] || { echo "❌ intelligence-assessment.md: fewer than 3 confidence labels (VERY HIGH/HIGH/MEDIUM/LOW/VERY LOW) — found ${CONF:-0}"; FAIL=1; }
  grep -qE 'PIR' "$ANALYSIS_DIR/intelligence-assessment.md" \
    || { echo "❌ intelligence-assessment.md: no PIR reference"; FAIL=1; }
fi
if [ -s "$ANALYSIS_DIR/scenario-analysis.md" ]; then
  SC=$(awk '/^##? .*Scenario/{c++} END{print c+0}' "$ANALYSIS_DIR/scenario-analysis.md")
  [ "$SC" -ge 3 ] || { echo "❌ scenario-analysis.md: fewer than 3 scenarios (found $SC)"; FAIL=1; }
fi
if [ -s "$ANALYSIS_DIR/devils-advocate.md" ]; then
  HY=$(grep -cE '^#{2,4}[[:space:]]*(Hypothesis|H[0-9]+[[:space:]]*[:.—-])' "$ANALYSIS_DIR/devils-advocate.md" || true)
  [ "${HY:-0}" -ge 3 ] || { echo "❌ devils-advocate.md: fewer than 3 competing hypotheses (found ${HY:-0})"; FAIL=1; }
fi
if [ -s "$ANALYSIS_DIR/methodology-reflection.md" ]; then
  grep -qE 'ICD[[:space:]]+203|Methodology[[:space:]]+Improvements|Improvement[[:space:]]+1|#{2,4}[[:space:]]+.*Improvements' "$ANALYSIS_DIR/methodology-reflection.md" \
    || { echo "❌ methodology-reflection.md: missing ICD 203 audit or named Methodology Improvements section"; FAIL=1; }
fi
if [ -s "$ANALYSIS_DIR/comparative-international.md" ]; then
  awk '
    BEGIN { comparator_set=0; comparator_rows=0 }
    /^[[:space:]]*\*{0,2}Comparator set\*{0,2}[[:space:]]*:/ {
      value = $0
      sub(/^[^:]*:[[:space:]]*/, "", value)
      if (value !~ /^[[:space:]]*$/ && value !~ /^[[:space:]]*[-–—]+[[:space:]]*$/) comparator_set = 1
    }
    /^\|/ {
      if ($0 !~ /^\|[[:space:]:-]+(\|[[:space:]:-]+)+\|?[[:space:]]*$/ && $0 !~ /^\|[[:space:]]*(Jurisdiction|Comparator|Country)[[:space:]]*\|/) comparator_rows++
    }
    END { exit !(comparator_set || comparator_rows >= 2) }
  ' "$ANALYSIS_DIR/comparative-international.md" \
    || { echo "❌ comparative-international.md: missing comparator set or fewer than 2 comparator rows"; FAIL=1; }
fi

# Check 8 — Family D structure
if [ -s "$ANALYSIS_DIR/forward-indicators.md" ]; then
  DI=$(grep -cE '20[0-9]{2}-[0-1][0-9]-[0-3][0-9]|20[0-9]{2}Q[1-4]|\+[0-9]+[[:space:]]*(h|d|day|week|month)' "$ANALYSIS_DIR/forward-indicators.md" || true)
  [ "${DI:-0}" -ge 10 ] || { echo "❌ forward-indicators.md: fewer than 10 dated indicators (found ${DI:-0})"; FAIL=1; }
fi
if [ -s "$ANALYSIS_DIR/coalition-mathematics.md" ]; then
  grep -qE '^\|.*(Ja|Nej|Avstår|Frånvarande|Seats|Mandat)' "$ANALYSIS_DIR/coalition-mathematics.md" \
    || { echo "❌ coalition-mathematics.md: missing seat-count / vote-breakdown table"; FAIL=1; }
fi

# Check 10 — top-2 full-text availability (auto-full-text-top-n gate)
# When the manifest contains a "Full-Text Fetch Outcomes" table (written by
# download-parliamentary-data.ts --auto-full-text-top-n), verify that at least
# 2 top documents have full_text_available=true. A fallback annotation
# <!-- full-text-fallback: <reason> --> anywhere in the manifest bypasses
# this check so that runs without the flag, or runs where full text is
# genuinely unavailable from the MCP server, are not blocked.
if [ -s "$ANALYSIS_DIR/data-download-manifest.md" ]; then
  if grep -q "## Full-Text Fetch Outcomes" "$ANALYSIS_DIR/data-download-manifest.md"; then
    if grep -q "full-text-fallback:" "$ANALYSIS_DIR/data-download-manifest.md"; then
      : # Fallback annotation present — bypass check
    else
      FT_SUCCESS=$(grep -cE '^\|[[:space:]]*[A-Za-z0-9_-]+[[:space:]]*\|[[:space:]]*true' \
        "$ANALYSIS_DIR/data-download-manifest.md" || true)
      [ "${FT_SUCCESS:-0}" -ge 2 ] \
        || { echo "❌ data-download-manifest.md: Full-Text Fetch Outcomes table present but fewer than 2 top documents have full_text_available=true (found ${FT_SUCCESS:-0}). Add <!-- full-text-fallback: <reason> --> to the manifest to bypass."; FAIL=1; }
    fi
  fi
fi

[ "$FAIL" -eq 0 ] || exit 1
```

Exit code 0 = pass, non-zero = fail with per-check report. Precondition for check 6: agent MUST save Pass-1 drafts to `$ANALYSIS_DIR/pass1/` before running Pass-2 improvements so the `cmp` fallback can fire when the same-session mtime window is too tight. If a future run needs reuse, factor the block into `scripts/validate-analysis-gate.ts` and update this module.

## Outcome

- **Pass** → proceed to `06-article-generation.md`.
- **Fail** → fix flagged files (never delete them), re-run the gate, then proceed.
- **Unrecoverable fail after fixes** → stage whatever analysis exists, commit with label `analysis-only`, call `safeoutputs___create_pull_request` once (see `07-commit-and-pr.md`). Do **not** generate articles.

## Deduplication note

If today's article HTML already exists under `news/` **and** `force_generation=false`, skip article generation but still run analysis and still commit. The PR label is `analysis-only`. There is still exactly one PR call.

## Supplementary checks

Non-blocking for `standard` / `deep` runs; **blocking for `comprehensive` / Tier-C aggregation runs**. These checks consume the 7 operational supplementary artifacts defined in [`analysis/templates/README.md §Operational Supplementary`](../../analysis/templates/README.md) and catalogued in [`analysis/methodologies/artifact-catalog.md §Operational Supplementary`](../../analysis/methodologies/artifact-catalog.md#-operational-supplementary-artifacts-7).

| S# | File | Blocking when | Methodology §link |
|:--:|------|---------------|-------------------|
| S1 | `analysis-index.md` | `comprehensive` | [`per-artifact-methodologies.md#analysis-index`](../../analysis/methodologies/per-artifact-methodologies.md#analysis-index) |
| S2 | `reference-analysis-quality.md` | `comprehensive` | [`per-artifact-methodologies.md#reference-analysis-quality`](../../analysis/methodologies/per-artifact-methodologies.md#reference-analysis-quality) |
| S3 | `mcp-reliability-audit.md` | `comprehensive`, or any run with ≥ 1 MCP endpoint failure | [`per-artifact-methodologies.md#mcp-reliability-audit`](../../analysis/methodologies/per-artifact-methodologies.md#mcp-reliability-audit) |
| S4 | `workflow-audit.md` | `comprehensive` | [`per-artifact-methodologies.md#workflow-audit`](../../analysis/methodologies/per-artifact-methodologies.md#workflow-audit) |
| S5 | `cross-run-diff.md` | any article type with ≥ 2 production runs | [`per-artifact-methodologies.md#cross-run-diff`](../../analysis/methodologies/per-artifact-methodologies.md#cross-run-diff) |
| S6 | `cross-session-intelligence.md` | `weekly-review`, `monthly-review` (the aggregation article types the probe detects) | [`per-artifact-methodologies.md#cross-session-intelligence`](../../analysis/methodologies/per-artifact-methodologies.md#cross-session-intelligence) |
| S7 | `session-baseline.md` | `weekly-review`, `monthly-review` (the aggregation article types the probe detects) | [`per-artifact-methodologies.md#session-baseline`](../../analysis/methodologies/per-artifact-methodologies.md#session-baseline) |

Inline bash probe — append to the main block after `FAIL=0` bookkeeping completes. Supplementary artifacts have **three independent blocking triggers**, not a single tier-only rule: **aggregation article types** (`weekly-review`, `monthly-review`) require the aggregation artifacts; any run whose **tier** is `comprehensive` (the Tier-C run mode) requires the Tier-C supplementary set; and `cross-run-diff.md` is blocking whenever the workflow has **≥ 2 production runs** of the same article type, including `standard` and `deep` runs. `ARTICLE_TYPE` encodes the workflow family; `ANALYSIS_TIER` (when set) encodes the depth tier (`standard` | `deep` | `comprehensive`); `ANALYSIS_RUN_COUNT` (when set) is the numeric count of runs for the same article-generation cycle (if unset or non-numeric, treated as `1`).

```bash
# Check 9 — supplementary artifacts (blocking for aggregation types, any Tier-C run, and S5 when run-count >= 2)
IS_AGGREGATION=0
IS_TIER_C=0
IS_MULTI_RUN=0
RUN_COUNT=1
[[ "${ARTICLE_TYPE:-}" =~ ^(weekly-review|monthly-review)$ ]] && IS_AGGREGATION=1
[[ "${ANALYSIS_TIER:-standard}" == "comprehensive" ]] && IS_TIER_C=1
[[ "${ANALYSIS_RUN_COUNT:-}" =~ ^[0-9]+$ ]] && RUN_COUNT="${ANALYSIS_RUN_COUNT}"
(( RUN_COUNT >= 2 )) && IS_MULTI_RUN=1
if (( IS_AGGREGATION == 1 || IS_TIER_C == 1 || IS_MULTI_RUN == 1 )); then
  # Avoid building a bash array (`SUPP+=(...)`); materialise the filenames
  # via printf into a temp file and loop over that — see
  # 01-bash-and-shell-safety.md §Banned expansion patterns.
  SUPP_LIST="/tmp/gate-supp-$$"
  : > "$SUPP_LIST"
  if (( IS_AGGREGATION == 1 || IS_TIER_C == 1 )); then
    printf '%s\n' analysis-index.md reference-analysis-quality.md mcp-reliability-audit.md workflow-audit.md >> "$SUPP_LIST"
  fi
  (( IS_AGGREGATION == 1 )) && printf '%s\n' cross-session-intelligence.md session-baseline.md >> "$SUPP_LIST"
  (( IS_MULTI_RUN == 1 )) && printf '%s\n' cross-run-diff.md >> "$SUPP_LIST"
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    [ -s "$ANALYSIS_DIR/$f" ] || { echo "❌ supplementary missing (agg=$IS_AGGREGATION tier-c=$IS_TIER_C multi-run=$IS_MULTI_RUN): $f"; FAIL=1; }
  done < "$SUPP_LIST"
  rm -f "$SUPP_LIST"
fi
```

Depth floors for S1–S7 are configured under `thresholds.breaking.*` / per-type sections in [`reference-quality-thresholds.json`](../../analysis/methodologies/reference-quality-thresholds.json); when a floor is absent the `defaults.supplementaryFloor` (120 lines) applies.

**Pass-2 quality audit — recommendation, not enforced in the bash probe** — the bash check above does **not** parse `reference-analysis-quality.md §5`. When the artifact is produced, agents SHOULD re-read its `§5 Overall Benchmark Judgement` total and trigger another Pass-2 iteration if the score is below **7.0/10** before invoking this gate. This is a non-enforced self-discipline rule (no blocking logic); an enforced numeric-floor check would require adding a YAML/JSON score block to the template and a dedicated parser, which is deferred to a follow-up change.
