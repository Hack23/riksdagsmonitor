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

No dedicated validator script exists yet — run the six checks above as an inline bash gate. Canonical shape:

```
set -Eeuo pipefail
REQ="synthesis-summary.md swot-analysis.md risk-assessment.md threat-analysis.md \
     stakeholder-perspectives.md significance-scoring.md classification-results.md \
     cross-reference-map.md data-download-manifest.md"
FAIL=0
for f in $REQ; do
  [ -s "$ANALYSIS_DIR/$f" ] || { echo "❌ missing/empty: $f"; FAIL=1; }
done
grep -rIn -e 'AI_MUST_REPLACE' -e '\[REQUIRED\]' -e 'TODO:' -e 'Lorem ipsum' "$ANALYSIS_DIR" \
  && FAIL=1
grep -lE 'H[0-9]{3}[A-Za-z]{2,}[0-9]+' "$ANALYSIS_DIR/swot-analysis.md" >/dev/null \
  || { echo "❌ swot-analysis.md: no dok_id citation"; FAIL=1; }
grep -lE '^```mermaid' "$ANALYSIS_DIR/synthesis-summary.md" >/dev/null \
  || { echo "❌ synthesis-summary.md: missing Mermaid block"; FAIL=1; }
[ "$FAIL" -eq 0 ] || exit 1
```

Exit code 0 = pass, non-zero = fail with per-check report. If a future run needs reuse, factor the block into `scripts/validate-analysis-gate.ts` and update this module.

## Outcome

- **Pass** → proceed to `06-article-generation.md`.
- **Fail** → fix flagged files (never delete them), re-run the gate, then proceed.
- **Unrecoverable fail after fixes** → stage whatever analysis exists, commit with label `analysis-only`, call `safeoutputs___create_pull_request` once (see `07-commit-and-pr.md`). Do **not** generate articles.

## Deduplication note

If today's article HTML already exists under `news/` **and** `force_generation=false`, skip article generation but still run analysis and still commit. The PR label is `analysis-only`. There is still exactly one PR call.
