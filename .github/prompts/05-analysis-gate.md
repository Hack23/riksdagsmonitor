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
4. **Evidence citations** — `swot-analysis.md` and `significance-scoring.md` contain at least one `dok_id` reference per quadrant / ranked item.
5. **Mermaid diagrams** — every daily synthesis file contains ≥ 1 Mermaid diagram with colour-coded `style` directives.
6. **Pass-2 done** — agent has read each core artifact back after creation and committed improvements. (Enforced by file mtime diff: final file mtime > creation time + 3 min, OR two git-history snapshots on disk.)

## Implementation

No dedicated validator script exists yet — implement the six checks as an inline bash gate. Full implementation (covers checks 1–6):

```
set -Eeuo pipefail
REQ=(synthesis-summary.md swot-analysis.md risk-assessment.md threat-analysis.md \
     stakeholder-perspectives.md significance-scoring.md classification-results.md \
     cross-reference-map.md data-download-manifest.md)
SYNTHESIS=(synthesis-summary.md swot-analysis.md risk-assessment.md threat-analysis.md \
           stakeholder-perspectives.md significance-scoring.md classification-results.md \
           cross-reference-map.md)
DOK_RE='H[0-9]{3}[A-Za-z]{2,}[0-9]+'
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
    [ -s "$ANALYSIS_DIR/documents/$d.md" ] || { echo "❌ documents/$d.md missing"; FAIL=1; }
  done
fi

# Check 3 — no stubs
grep -rIn -e 'AI_MUST_REPLACE' -e '\[REQUIRED\]' -e 'TODO:' -e 'Lorem ipsum' "$ANALYSIS_DIR" \
  && { echo "❌ stub placeholders detected"; FAIL=1; }

# Check 4 — evidence citations per quadrant / ranked item
awk -v re="$DOK_RE" '
  /^##[[:space:]]+(Strengths|Weaknesses|Opportunities|Threats)\b/ { sec=$0; next }
  sec != "" && /^[[:space:]]*[-*][[:space:]]+/ && $0 !~ re {
    printf "❌ swot-analysis.md %s: bullet missing dok_id: %s\n", sec, $0; bad=1
  }
  END { exit bad+0 }
' "$ANALYSIS_DIR/swot-analysis.md" || FAIL=1
awk -v re="$DOK_RE" '
  /^[[:space:]]*([0-9]+\.[[:space:]]+|[-*][[:space:]]+)/ && $0 !~ re {
    printf "❌ significance-scoring.md ranked item missing dok_id: %s\n", $0; bad=1
  }
  END { exit bad+0 }
' "$ANALYSIS_DIR/significance-scoring.md" || FAIL=1

# Check 5 — Mermaid + colour-coded style directives in every synthesis file
for f in "${SYNTHESIS[@]}"; do
  p="$ANALYSIS_DIR/$f"; [ -s "$p" ] || continue
  grep -qE '^```mermaid' "$p" || { echo "❌ $f: missing Mermaid block"; FAIL=1; }
  grep -qE '^[[:space:]]*style[[:space:]]+' "$p" || { echo "❌ $f: missing Mermaid style directive"; FAIL=1; }
done

# Check 6 — Pass-2 evidence (mtime ≥ birth + 180s, OR differing pass1 snapshot on disk)
for f in "${REQ[@]}"; do
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

- **Pass** → proceed to `06-article-generation.md`.
- **Fail** → fix flagged files (never delete them), re-run the gate, then proceed.
- **Unrecoverable fail after fixes** → stage whatever analysis exists, commit with label `analysis-only`, call `safeoutputs___create_pull_request` once (see `07-commit-and-pr.md`). Do **not** generate articles.

## Deduplication note

If today's article HTML already exists under `news/` **and** `force_generation=false`, skip article generation but still run analysis and still commit. The PR label is `analysis-only`. There is still exactly one PR call.
