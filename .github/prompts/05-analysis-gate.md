# 05 — Analysis Gate (single blocking gate)

This is the **only** gate separating analysis from article generation. If it fails, fix the analysis and re-run it. Never bypass.

## Inputs

- `$ANALYSIS_DIR = analysis/daily/$ARTICLE_DATE/$SUBFOLDER`
- 23 required artifacts (Families A + B + C + D from `04-analysis-pipeline.md`) + per-document Family E.

## Checks (all must pass)

1. **Artifact existence** — every file in Families A, B, C, D is present and non-empty:
   - **Family A (9)** — `README.md`, `executive-brief.md`, `synthesis-summary.md`, `significance-scoring.md`, `classification-results.md`, `swot-analysis.md`, `risk-assessment.md`, `threat-analysis.md`, `stakeholder-perspectives.md`.
   - **Family B (2)** — `data-download-manifest.md`, `cross-reference-map.md`.
   - **Family C (5)** — `scenario-analysis.md`, `comparative-international.md`, `devils-advocate.md`, `intelligence-assessment.md`, `methodology-reflection.md` ⭐.
   - **Family D (7)** — `election-2026-analysis.md`, `voter-segmentation.md`, `coalition-mathematics.md`, `historical-parallels.md`, `media-framing-analysis.md`, `implementation-feasibility.md`, `forward-indicators.md`.
2. **Per-document coverage (Family E)** — `$ANALYSIS_DIR/documents/` contains one `.md` per `dok_id` listed in `data-download-manifest.md` (metadata-only documents are tagged, not skipped).
3. **No stubs** — zero occurrences of `AI_MUST_REPLACE`, `[REQUIRED]`, `TODO:`, or `Lorem ipsum` across all artifacts.
4. **Evidence citations** — `swot-analysis.md` and `significance-scoring.md` contain at least one piece of primary-source evidence per quadrant / ranked item. Accepted evidence patterns: a `dok_id` (e.g. `H901FiU1`, `HD01CU27`) **or** a primary-source URL host (`riksdagen.se`, `regeringen.se`, `scb.se`, `worldbank.org`, `data.imf.org`). Enforced against SWOT `### Strengths/Weaknesses/Opportunities/Threats` sections (bullets + table rows) and significance-scoring bullets **plus** ranking table rows and Mermaid node labels.
5. **Mermaid diagrams** — every Family A and Family D synthesis file contains ≥ 1 Mermaid diagram with colour-coded `style` directives (or `themeVariables` / `%%{init …}` block).
6. **Pass-2 done** — agent has read each Family A + C core artifact back after creation and committed improvements. (Enforced by file mtime diff: final file mtime > creation time + 3 min, OR two git-history snapshots on disk.)
7. **Family C structure checks** (extension-quality gate):
   - `executive-brief.md` contains a `## 🎯 BLUF` section **and** a `## 🧭 3 Decisions` (or `Decisions This Brief Supports`) section.
   - `intelligence-assessment.md` declares **≥ 3 Key Judgments** with confidence labels (`HIGH`, `MEDIUM`, `LOW`, `VERY HIGH`, `VERY LOW`) and references at least one PIR.
   - `scenario-analysis.md` declares **≥ 3 distinct scenarios** (headers matching `Scenario` count ≥ 3).
   - `comparative-international.md` declares a comparator set or **≥ 2 comparator rows** (structural check, see Tier-C gate).
   - `devils-advocate.md` declares **≥ 3 competing hypotheses** (headers matching `Hypothesis`/`H1`/`H2`/`H3` count ≥ 3, ACH-style).
   - `methodology-reflection.md` is non-empty and contains an **ICD 203 audit** marker or ≥ 3 named methodology improvements.
8. **Family D structure checks**:
   - `forward-indicators.md` declares **≥ 10 dated indicators** (bullet or table rows matching a date pattern across the four horizon sections).
   - `coalition-mathematics.md` contains a seat-count table (≥ 1 table row with `Ja`/`Nej`/`Avstår` or a party-to-seats mapping).

## Implementation

No dedicated validator script exists yet — implement the checks as an inline bash gate. Full implementation (covers checks 1–8):

```
set -Eeuo pipefail
: "${ARTICLE_DATE:?ARTICLE_DATE must be set}"
: "${SUBFOLDER:?SUBFOLDER must be set}"
ANALYSIS_DIR="analysis/daily/$ARTICLE_DATE/$SUBFOLDER"
[ -d "$ANALYSIS_DIR" ] || { echo "❌ ANALYSIS_DIR does not exist: $ANALYSIS_DIR"; exit 1; }

FAMILY_A=(README.md executive-brief.md synthesis-summary.md significance-scoring.md \
          classification-results.md swot-analysis.md risk-assessment.md \
          threat-analysis.md stakeholder-perspectives.md)
FAMILY_B=(data-download-manifest.md cross-reference-map.md)
FAMILY_C=(scenario-analysis.md comparative-international.md devils-advocate.md \
          intelligence-assessment.md methodology-reflection.md)
FAMILY_D=(election-2026-analysis.md voter-segmentation.md coalition-mathematics.md \
          historical-parallels.md media-framing-analysis.md \
          implementation-feasibility.md forward-indicators.md)
REQ=("${FAMILY_A[@]}" "${FAMILY_B[@]}" "${FAMILY_C[@]}" "${FAMILY_D[@]}")
SYNTHESIS=(synthesis-summary.md swot-analysis.md risk-assessment.md threat-analysis.md \
           stakeholder-perspectives.md significance-scoring.md classification-results.md \
           cross-reference-map.md executive-brief.md coalition-mathematics.md \
           forward-indicators.md)
DOK_RE='[Hh][A-Za-z0-9]{3,}[0-9]+'
EVIDENCE_RE='[Hh][A-Za-z0-9]{3,}[0-9]+|riksdagen\.se|regeringen\.se|scb\.se|worldbank\.org|data\.imf\.org'
FAIL=0

# Check 1 — artifact existence (all 23)
for f in "${REQ[@]}"; do
  [ -s "$ANALYSIS_DIR/$f" ] || { echo "❌ missing/empty: $f"; FAIL=1; }
done

# Check 2 — per-document coverage against manifest
if [ -s "$ANALYSIS_DIR/data-download-manifest.md" ]; then
  mapfile -t DOKS < <(grep -oE "$DOK_RE" "$ANALYSIS_DIR/data-download-manifest.md" | sort -u)
  [ "${#DOKS[@]}" -gt 0 ] || { echo "❌ manifest has no dok_id entries"; FAIL=1; }
  for d in "${DOKS[@]}"; do
    d_lc="${d,,}"
    if [ ! -s "$ANALYSIS_DIR/documents/${d}.md" ] \
       && [ ! -s "$ANALYSIS_DIR/documents/${d}-analysis.md" ] \
       && [ ! -s "$ANALYSIS_DIR/documents/${d_lc}.md" ] \
       && [ ! -s "$ANALYSIS_DIR/documents/${d_lc}-analysis.md" ]; then
      echo "❌ documents/${d}.md or documents/${d}-analysis.md missing (any case)"
      FAIL=1
    fi
  done
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
for f in "${SYNTHESIS[@]}"; do
  p="$ANALYSIS_DIR/$f"; [ -s "$p" ] || continue
  grep -qE '^```mermaid' "$p" || { echo "❌ $f: missing Mermaid block"; FAIL=1; }
  if ! grep -qE '^[[:space:]]*style[[:space:]]+' "$p" \
     && ! grep -qE 'themeVariables|%%\{[[:space:]]*init' "$p"; then
    echo "❌ $f: missing Mermaid colour-coded config (no 'style …' directive and no 'themeVariables' / '%%{init …}' block)"
    FAIL=1
  fi
done

# Check 6 — Pass-2 evidence (mtime ≥ birth + 180s, OR differing pass1 snapshot on disk)
# data-download-manifest.md is produced by module 03 and may legitimately be unchanged.
PASS2_REQ=(synthesis-summary.md swot-analysis.md risk-assessment.md threat-analysis.md \
           stakeholder-perspectives.md significance-scoring.md classification-results.md \
           cross-reference-map.md executive-brief.md README.md \
           scenario-analysis.md comparative-international.md devils-advocate.md \
           intelligence-assessment.md methodology-reflection.md \
           election-2026-analysis.md voter-segmentation.md coalition-mathematics.md \
           historical-parallels.md media-framing-analysis.md \
           implementation-feasibility.md forward-indicators.md)
for f in "${PASS2_REQ[@]}"; do
  p="$ANALYSIS_DIR/$f"; [ -s "$p" ] || continue
  ok=0
  B=$(stat -c %W "$p" 2>/dev/null || echo 0)
  M=$(stat -c %Y "$p" 2>/dev/null || echo 0)
  [ "${B:-0}" -gt 0 ] && [ "${M:-0}" -ge $((B + 180)) ] && ok=1
  [ -s "$ANALYSIS_DIR/pass1/$f" ] && ! cmp -s "$ANALYSIS_DIR/pass1/$f" "$p" && ok=1
  [ "$ok" -eq 1 ] || { echo "❌ $f: Pass-2 evidence missing (mtime<birth+180s and no pass1/ snapshot)"; FAIL=1; }
done

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

[ "$FAIL" -eq 0 ] || exit 1
```

Exit code 0 = pass, non-zero = fail with per-check report. Precondition for check 6: agent MUST save Pass-1 drafts to `$ANALYSIS_DIR/pass1/` before running Pass-2 improvements so the `cmp` fallback can fire when the same-session mtime window is too tight. If a future run needs reuse, factor the block into `scripts/validate-analysis-gate.ts` and update this module.

## Outcome

- **Pass** → run the **phase checkpoint** from `00-base-contract.md` with label `phase-05-gate`, then proceed to `06-article-generation.md`.
- **Fail** → fix flagged files (never delete them), re-run the gate, then proceed.
- **Unrecoverable fail after fixes** → stage whatever analysis exists, commit with label `analysis-only`, call `safeoutputs___create_pull_request` once (see `07-commit-and-pr.md`). Do **not** generate articles.

## Deduplication note

If today's article HTML already exists under `news/` **and** `force_generation=false`, skip article generation but still run analysis and still commit. The PR label is `analysis-only`. There is still exactly one PR call.
