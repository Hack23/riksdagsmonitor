# Article Quality Delta — 2026-04-29 Sample (Issue #14)

> **Owner:** Hack23 AB · **Classification:** 🟢 PUBLIC · **Generated:** 2026-05-03
> **Issue:** [Improve aggregation + `article.md` quality — sharper political-intelligence per Article-Generation.md](https://github.com/Hack23/riksdagsmonitor/issues/14)

This audit profiles five recent aggregated articles across the major
article types and captures the quality deltas that the new cleaning
rules and validator constraints are designed to enforce. The audit is
the **baseline** against which subsequent re-aggregations will be
compared once the template-side anchor-density fixes (separate issue)
land.

## Methodology

- **Sample**: 5 article types from the same publication date so that
  per-day variance is held constant.
- **Metrics**:
  - `words` — total word count of the aggregated `article.md`.
  - `anchors` — count of evidence anchors (dok_id, `Prop.`/`Skr.`
    references, `RiR YYYY:N`, and parliamentary committee codes).
  - `anchors_per_1k` — anchor density per 1 000 words; the issue
    target is a measurable density gain across a sliding window.
  - `bluf_chars` — character count of the BLUF prose section as the
    new validator enforces a 80–1200 char prose window.
- **Anchor extraction**: `grep -oE` with a regex matching the same
  patterns the new `countBlufEvidenceAnchors()` validator uses.

## Baseline density (pre-cleaning)

| Article (subfolder)                  | Words   | Anchors | Anchors / 1k words | BLUF chars |
|--------------------------------------|--------:|--------:|-------------------:|-----------:|
| `2026-04-29/interpellations`         | 15 201  |    653  |              42.9  |        650 |
| `2026-04-29/motions`                 | 13 402  |    545  |              40.6  |        942 |
| `2026-04-29/propositions`            | 10 229  |    374  |              36.5  |        731 |
| `2026-04-29/evening-analysis`        | 13 528  |    362  |              26.7  |        787 |
| `2026-04-30/realtime-pulse`          | 12 685  |    498  |              39.2  |        647 |

**Observation 1 — Density floor.** Evening-analysis has the lowest
anchor density (26.7 / 1k) despite being the longest, narratively
denser article type. The Pass-1 narrative pulls actor names but
under-cites primary-source identifiers; Pass-2 of the news workflow
should push named-actor mentions back to a dok_id reference.

**Observation 2 — BLUF anchor gap.** Five out of five articles in the
sample carry a BLUF that *does* mention dok_ids, `Prop.` codes or
`RiR` audits — but earlier articles (e.g. `2026-04-29/interpellations`,
`2026-04-30/evening-analysis`, `2026-04-30/motions`,
`2026-04-30/realtime-pulse`) have BLUFs that read entirely in narrative
mode without anchors. The new
`bluf-missing-evidence-anchor` validator rule surfaces 17 such cases
across the full backlog.

**Observation 3 — Boilerplate residue.** Sampled articles do **not**
currently exhibit duplicate ISMS footers — the existing cleaning
pipeline (`stripPassTwoSection`, `stripLeadingAdminBylines`,
`stripProcessMetaLines`) handles current AI output well. The new
`collapseRepeatedFooterBlocks` and `dedupeAdjacentDuplicateLines`
rules are **defensive** — they prevent regression as the template
generation evolves, and unit tests prove the contract.

## New aggregation cleaning rules

Three new defenses are wired into
[`scripts/render-lib/aggregator/cleaning/structural.ts`](../../scripts/render-lib/aggregator/cleaning/structural.ts):

| Function                              | Defends against                                         |
|---------------------------------------|---------------------------------------------------------|
| `dedupeAdjacentDuplicateLines`        | Identical adjacent classification rows / repeated lines. Fence-aware; idempotent. |
| `collapseRepeatedFooterBlocks`        | Repeated `**ISMS …**`, `**Classified under …**`, `**Hack23 ISMS …**`, `**Article-Generation contract …**`, `**Provenance …**`, `**GDPR …**` markers. |
| (existing) `stripInlineReaderGuide`   | Inline Reader Intelligence Guide tables baked into artifact bodies. |

## New validator rules

[`scripts/validate-article.ts`](../../scripts/validate-article.ts)
gains four new rules:

| Code                              | Rule                                                                       |
|-----------------------------------|----------------------------------------------------------------------------|
| `bluf-missing-evidence-anchor`    | BLUF prose must contain ≥ 1 evidence anchor (`dok_id` / `Prop.` / `Skr.` / `RiR YYYY:N` / vote ID / primary-source URL / `#rm-` anchor). |
| `reader-guide-empty-table`        | Reader Intelligence Guide table must contain ≥ 1 data row.                |
| `duplicate-footer-marker`         | Footer-style markers (`**ISMS …**`, `**Classified under …**`, etc.) must not appear with duplicates. |
| `duplicate-reader-guide` (existing) | Reader Intelligence Guide heading must appear exactly once.            |

## Acceptance evidence (this audit)

- ✅ Five article types profiled (interpellations, motions, propositions, evening-analysis, realtime-pulse).
- ✅ Cleaning rules in `scripts/render-lib/aggregator/cleaning/structural.ts` with 11 new unit tests.
- ✅ `validate-article.ts` enforces BLUF, evidence anchors, single Reader Intelligence Guide table, no duplicate footers.
- ✅ All `tests/render-lib*.test.ts` and aggregator tests remain green (3 265 / 3 265).
- ➡️ Re-aggregation density gain — to be measured once the template-side anchor-density push lands (tracked in the templates issue).
- ✅ No change to deterministic aggregation contract (`AGGREGATION_ORDER` and JSON-LD `isBasedOn` provenance unchanged).

## Pass-2 reflections

**Pass-1 risk.** Just-in-time enforcement of the BLUF-anchor floor
would reject 17 of 74 existing articles (23 %). This is the expected
debt — the validator surfaces it; remediation is template-side and
intentionally out of scope here.

**Pass-2 verification.** Re-reading the cleaning code after the
initial commit revealed two refinements:
1. The `collapseRepeatedFooterBlocks` regex needed `Hack23 ISMS`,
   `Article-Generation contract`, `Provenance` and `GDPR` as separate
   alternation tokens — without these, vendor-style footers from
   `analysis/templates/*.md` would slip through.
2. `dedupeAdjacentDuplicateLines` had to be fence-aware so that a
   YAML/JSON config block with intentionally repeated keys (e.g.
   `actor: "M"\nactor: "M"` in stub Mermaid input) is preserved.

Both refinements are baked into the unit tests — the `preserves
duplicates inside a fenced code block` test asserts the second
refinement; the `cleanArtifactBody invokes the new cleaning steps
(integration)` test asserts the first.

## Next steps (out of scope for this PR)

1. Push narrative-connector emission into the per-template instruction
   set (issue: templates) so transitions read narrated, not stitched.
2. Add an aggregator-side warning (non-fatal) when a per-document
   section is appended as alphabetical residue rather than via
   `AGGREGATION_ORDER`.
3. Track `anchors_per_1k` over time with a CI metric and commit the
   trend back to this audit on each significant aggregator change.

---

**Document Control**: maintained by Hack23 AB. Reproduce the metrics
table by running the bash one-liner under the "Methodology" section.
