# 05 — Analysis Gate (single blocking gate)

This is the **only** gate separating analysis from article generation. If it fails, fix the analysis and re-run it. Never bypass.

## Inputs

- `$ANALYSIS_DIR = analysis/daily/$ARTICLE_DATE/$SUBFOLDER`
- 9 required core artifacts (see `04-analysis-pipeline.md`).

## Checks (all must pass)

1. **Artifact existence** — every required file exists and is non-empty:
   `synthesis-summary.md`, `swot-analysis.md`, `risk-assessment.md`, `threat-analysis.md`, `stakeholder-perspectives.md`, `significance-scoring.md`, `classification-results.md`, `cross-reference-map.md`, `data-download-manifest.md`.
2. **Per-document coverage** — `$ANALYSIS_DIR/documents/` contains one `.md` per `dok_id` listed in `data-download-manifest.md` (metadata-only documents are tagged, not skipped).
3. **No stubs** — zero occurrences of `AI_MUST_REPLACE`, `[REQUIRED]`, `TODO:`, or `Lorem ipsum` across all artifacts.
4. **Evidence citations** — `swot-analysis.md` and `significance-scoring.md` contain at least one piece of primary-source evidence per quadrant / ranked item. Accepted evidence patterns (matches the standard in `04-analysis-pipeline.md` §Evidence standard): a `dok_id` (e.g. `H901FiU1`, `HD01CU27`) **or** a primary-source URL host (`riksdagen.se`, `regeringen.se`, `scb.se`, `worldbank.org`, `data.imf.org`). Named-actor / vote-count evidence without one of the above still counts as a Pass-2 target for human review but is not machine-enforced here. Enforced against SWOT `### Strengths/Weaknesses/Opportunities/Threats` sections (bullets + table rows) and significance-scoring bullets **plus** ranking table rows and Mermaid node labels.
5. **Mermaid diagrams** — every daily synthesis file contains ≥ 1 Mermaid diagram with colour-coded `style` directives.
6. **Pass-2 done** — agent has read each core artifact back after creation and committed improvements. (Enforced by file mtime diff: final file mtime > creation time + 3 min, OR two git-history snapshots on disk.)

## Implementation

No dedicated validator script exists yet — implement the six checks as an inline bash gate. Full implementation (covers checks 1–6):

```
set -Eeuo pipefail
: "${ARTICLE_DATE:?ARTICLE_DATE must be set}"
: "${SUBFOLDER:?SUBFOLDER must be set}"
ANALYSIS_DIR="analysis/daily/$ARTICLE_DATE/$SUBFOLDER"
[ -d "$ANALYSIS_DIR" ] || { echo "❌ ANALYSIS_DIR does not exist: $ANALYSIS_DIR"; exit 1; }
REQ=(synthesis-summary.md swot-analysis.md risk-assessment.md threat-analysis.md \
     stakeholder-perspectives.md significance-scoring.md classification-results.md \
     cross-reference-map.md data-download-manifest.md)
SYNTHESIS=(synthesis-summary.md swot-analysis.md risk-assessment.md threat-analysis.md \
           stakeholder-perspectives.md significance-scoring.md classification-results.md \
           cross-reference-map.md)
DOK_RE='[Hh][A-Za-z0-9]{3,}[0-9]+'
# Check 4 evidence pattern — accepts dok_id OR primary-source URL host
# (per 04-analysis-pipeline.md §Evidence standard).
EVIDENCE_RE='[Hh][A-Za-z0-9]{3,}[0-9]+|riksdagen\.se|regeringen\.se|scb\.se|worldbank\.org|data\.imf\.org'
FAIL=0

# Check 1 — artifact existence
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
    # skip table separator rows like |---|---|
    if ($0 ~ /^[[:space:]|:\-]+$/) next
    trow++
    if (trow == 1) next          # header row
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
    # skip table separator rows like |---|---|
    if ($0 ~ /^[[:space:]|:\-]+$/) next
    trow++
    if (trow == 1) next          # header row
    if ($0 !~ re) {
      printf "❌ significance-scoring.md ranking table row missing evidence (dok_id or primary-source URL): %s\n", $0; bad=1
    }
    next
  }
  !in_mermaid && /^[[:space:]]*$/ { reset_table(); next }
  in_mermaid {
    # Skip Mermaid structural / configuration lines; validate likely node-label lines.
    if ($0 ~ /^[[:space:]]*(%%|style\b|classDef\b|class\b|linkStyle\b|subgraph\b|end\b|graph\b|flowchart\b|quadrantChart\b|mindmap\b|timeline\b|journey\b|gantt\b|pie\b|xychart-beta\b|sequenceDiagram\b|stateDiagram(-v2)?\b|erDiagram\b|sankey-beta\b|gitGraph\b|requirementDiagram\b|block-beta\b)/) next
    # A node-label line typically has bracketed/parenthesised/braced text, e.g. A[Label] or B(Label) or C{Label}.
    if ($0 ~ /[\[\(\{][^][(){}]+[\]\)\}]/ && $0 !~ re) {
      printf "❌ significance-scoring.md Mermaid ranked item missing evidence (dok_id or primary-source URL): %s\n", $0; bad=1
    }
    next
  }
  END { exit bad+0 }
' "$ANALYSIS_DIR/significance-scoring.md" || FAIL=1

# Check 5 — Mermaid + colour-coded config (explicit `style …` directive OR
# Mermaid init-block `themeVariables` — the SWOT template uses `quadrantChart`
# with `themeVariables` instead of literal `style` lines; either satisfies
# the "colour-coded" requirement).
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
# `data-download-manifest.md` is produced by the download step and may legitimately
# be unchanged during Pass 2, so it's excluded here (its Pass-2 correctness is
# covered by check 2's per-document coverage against its dok_id list).
PASS2_REQ=(synthesis-summary.md swot-analysis.md risk-assessment.md threat-analysis.md \
           stakeholder-perspectives.md significance-scoring.md classification-results.md \
           cross-reference-map.md)
for f in "${PASS2_REQ[@]}"; do
  p="$ANALYSIS_DIR/$f"; [ -s "$p" ] || continue
  ok=0
  B=$(stat -c %W "$p" 2>/dev/null || echo 0)
  M=$(stat -c %Y "$p" 2>/dev/null || echo 0)
  [ "${B:-0}" -gt 0 ] && [ "${M:-0}" -ge $((B + 180)) ] && ok=1
  [ -s "$ANALYSIS_DIR/pass1/$f" ] && ! cmp -s "$ANALYSIS_DIR/pass1/$f" "$p" && ok=1
  [ "$ok" -eq 1 ] || { echo "❌ $f: Pass-2 evidence missing (mtime<birth+180s and no pass1/ snapshot)"; FAIL=1; }
done

[ "$FAIL" -eq 0 ] || exit 1
```

Exit code 0 = pass, non-zero = fail with per-check report. Precondition for check 6: agent MUST save Pass-1 drafts to `$ANALYSIS_DIR/pass1/` before running Pass-2 improvements so the `cmp` fallback can fire when the same-session mtime window is too tight. If a future run needs reuse, factor the block into `scripts/validate-analysis-gate.ts` and update this module.

## Outcome

- **Pass** → run the **phase checkpoint** from `00-base-contract.md` with label `phase-05-gate`, then proceed to `06-article-generation.md`.
- **Fail** → fix flagged files (never delete them), re-run the gate, then proceed.
- **Unrecoverable fail after fixes** → stage whatever analysis exists, commit with label `analysis-only`, call `safeoutputs___create_pull_request` once (see `07-commit-and-pr.md`). Do **not** generate articles.

## Deduplication note

If today's article HTML already exists under `news/` **and** `force_generation=false`, skip article generation but still run analysis and still commit. The PR label is `analysis-only`. There is still exactly one PR call.
