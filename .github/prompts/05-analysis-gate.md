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

## Reference script

Implemented in [`scripts/validate-analysis-gate.ts`](../../scripts/validate-analysis-gate.ts) (to be added if missing; otherwise inline bash equivalent is acceptable). Invocation:

```
npx tsx scripts/validate-analysis-gate.ts \
  --dir "$ANALYSIS_DIR" \
  --manifest "$ANALYSIS_DIR/data-download-manifest.md"
```

Exit code 0 = pass, non-zero = fail with per-check report.

## Outcome

- **Pass** → proceed to `06-article-generation.md`.
- **Fail** → fix flagged files (never delete them), re-run the gate, then proceed.
- **Unrecoverable fail after fixes** → stage whatever analysis exists, commit with label `analysis-only`, call `safeoutputs___create_pull_request` once (see `07-commit-and-pr.md`). Do **not** generate articles.

## Deduplication note

If today's article HTML already exists under `news/` **and** `force_generation=false`, skip article generation but still run analysis and still commit. The PR label is `analysis-only`. There is still exactly one PR call.
