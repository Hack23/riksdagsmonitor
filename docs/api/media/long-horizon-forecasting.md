# ext — Long-Horizon Forecasting (Quarter / Year / Election-Cycle)

> **Bounded-context module.** Loaded by `news-quarter-ahead.md`, `news-year-ahead.md`, `news-election-cycle.md`, and (additively) by `news-week-ahead.md` + `news-month-ahead.md`. Adds rules **on top of** `ext/tier-c-aggregation.md`. Never replaces the 23-artifact contract from `04-analysis-pipeline.md` — it raises the bar.

This module exists because forward-looking analysis at horizons ≥ 90 days has structurally different evidence rules from same-day or week/month-ahead reporting:

- WEP language must degrade as the horizon lengthens (you cannot say "very likely" about an event 4 years out without ≥ 3 cycle-aged sources).
- Scenario trees must branch deeper (year-ahead = 4 + 5 wildcards; cycle = 4 × 3 = 12 leaves).
- Counterfactuals are no longer optional — they are the safeguard against narrative momentum.
- Cross-horizon citation prevents the analysis from drifting away from its own recent shorter-horizon work.
- IMF projection-year stamps (T+1, T+2, T+5) become first-class metadata, not a footnote.

> 🛠 **File-write contract**: every horizon-tagged artifact extension (`synthesis-summary.md`, `intelligence-assessment.md`, `scenario-analysis.md`, `risk-assessment.md`, `threat-analysis.md`, `forward-indicators.md`, `cross-reference-map.md`, supplementary `cycle-trajectory.md` / `parliamentary-season.md` / `horizon-pir-rollforward.md`) MUST be written with the `edit` tool. **Never** use `python3`, `node -e`, `sed -i`, `echo … > file`, `tee file`, or unquoted heredocs (`<<EOF`). See [`01-bash-and-shell-safety.md` §File creation & overwrite strategy](../01-bash-and-shell-safety.md).

The single source of truth for which workflows trigger which rules is **`analysis/article-types.json`** (consumed via `scripts/horizon-context.ts`).

---

## 1 — Horizon stratification (every Family-C/D artifact)

Every probabilistic judgement in `synthesis-summary.md`, `intelligence-assessment.md`, `scenario-analysis.md`, `risk-assessment.md`, `threat-analysis.md`, `forward-indicators.md`, and `cross-reference-map.md` MUST be tagged with one of the canonical horizon bands declared in `analysis/article-types.json → horizonBands`:

| Band | Days | WEP floor / review expectation |
|------|------|--------------------------------|
| `72h` | 3 | very likely / very unlikely permitted |
| `week` | 7 | likely / unlikely permitted |
| `month` | 30 | likely / unlikely permitted |
| `quarter` | 90 | roughly even / about even permitted |
| `year` | 365 | roughly even / about even expected; stronger confidence requires explicit corroboration in analysis (≥ 3 cycle-aged sources) |
| `cycle` | 1460 | roughly even / unlikely / very unlikely expected; avoid likely / very likely unless explicitly corroborated by ≥ 3 cycle-aged sources |
| `election` | 1460 | scenario-driven; coalition-formation outcomes never above "likely" |

**Operational rule.** A judgement at the `year` band that uses "very likely" without three corroborated cycle-aged sources should trigger a **Pass-2 rewrite** during author review. The gate at `05-analysis-gate.md` does **not** currently verify corroboration counts; it only checks that WEP terms carry a horizon-band tag.

**Tag format (machine-grep-able).** Inline marker `[horizon:<band>]` immediately after the WEP term, e.g.: `… is **likely** [horizon:quarter] to pass before recess …`. The gate uses `grep -n -E '\b(very likely|likely|roughly even|about even|unlikely|very unlikely)\b' artifact.md` and asserts every match line carries a `[horizon:` token within ± 80 characters; this validates horizon tagging proximity only, not source-count corroboration.

---

## 2 — Scenario-tree depth

Every long-horizon `scenario-analysis.md` MUST declare scenarios at the depth specified in the registry's `longHorizonRules`:

| Article type | `scenarioCount` | `wildcardCount` (in `wildcards-blackswans.md`) | Branches per scenario |
|--------------|-----------------|------------------------------------------------|-----------------------|
| `quarter-ahead` | 4 | 0 | 1 |
| `year-ahead` | 4 | 5 | 1 |
| `election-cycle` | 4 | 5 | **3 governing-coalition branches per scenario** = 12 leaves |

Scenario probabilities at every level MUST sum to 100 %. Branch probabilities under each scenario MUST also sum to 100 %. These are authoring and review requirements for the canonical scenario summary table. **Current long-horizon gate enforcement does not yet automatically audit `## Scenario` / `### Branch` header counts or probability-sum arithmetic** — those checks are planned follow-up work; until they land, scenario depth and probability-sum compliance are validated only at Pass-2 review. The gate currently enforces the surrounding long-horizon checks that are implemented in `05-analysis-gate.md` (horizon-band tags on WEP terms, IMF `T+N` projection-year stamps, counterfactual paragraph minimums via grep, PESTLE artifact presence for year/cycle, the 24th-artifact requirement for election-cycle, and predecessor-horizon citation in `cross-reference-map.md`).

---

## 3 — Counterfactual reasoning

Long-horizon runs MUST include explicit counterfactual paragraphs in `devils-advocate.md`:

| Article type | `counterfactualParagraphs` minimum |
|--------------|-------------------------------------|
| `week-ahead` | 1 |
| `month-ahead` | 1 |
| `quarter-ahead` | 2 |
| `year-ahead` | 2 |
| `election-cycle` | 3 |

Each counterfactual paragraph is structured as `**Counterfactual N — <name>:**` followed by a 4–8 sentence narrative (a) restating the assumption being challenged, (b) constructing the alternative world, (c) listing the falsification trigger that would update the analysis. Anchored on a primary-source `dok_id` or URL.

---

## 4 — IMF projection-year stamps

Every WEO / FM / GFS_COFOG citation in long-horizon artifacts MUST carry the **projection-year stamp** in the inline citation:

```
[IMF WEO Apr-2026 vintage; SWE NGDP_RPCH 2.1% T+1, 2.4% T+2, 2.0% T+5]
```

The `projectionYear` field MUST also appear in every `economicProvenance` block in machine-readable artifacts (`economic-data.json` v2.0+).

The gate at `05-analysis-gate.md` audits via:

```
grep -nE '\bIMF (WEO|FM|GFS_COFOG)\b.*\bT\+[0-9]+\b' \
  synthesis-summary.md scenario-analysis.md risk-assessment.md \
  intelligence-assessment.md
```

Missing projection-year stamps are a **Pass-2 rewrite trigger**, not a soft note.

---

## 5 — PESTLE mandatory thresholds

`pestle-analysis.md` is normally an **analytical-supplementary** template (never blocking — see `analytical-supplementary-methodology.md`). For year-ahead and cycle workflows it becomes **blocking**:

| Article type | PESTLE mandatory? |
|--------------|-------------------|
| `quarter-ahead` | optional (encouraged at `analysis_depth=comprehensive`) |
| `year-ahead` | **YES — blocking** |
| `election-cycle` | **YES — blocking** |

Floors (when blocking): ≥ 4 dimension tables, ≥ 3 cross-dimension interactions, line-floor per `reference-quality-thresholds.json`.

---

## 6 — Cross-horizon citation rule

Long-horizon analyses MUST cite shorter-horizon analyses to prevent narrative drift. The registry's `longHorizonRules.crossHorizonCitations` declares the required predecessors:

| Article type | Required citations in `cross-reference-map.md` |
|--------------|-----------------------------------------------|
| `quarter-ahead` | most recent `week-ahead` AND `month-ahead` |
| `year-ahead` | ≥ 2 most recent `quarter-ahead` + ≥ 4 most recent `monthly-review` |
| `election-cycle` | ≥ 2 most recent `year-ahead` + ≥ 12 most recent `monthly-review` |

Citation format in `cross-reference-map.md`: each cited predecessor appears in a row with its `analysis/daily/YYYY-MM-DD/<subfolder>/synthesis-summary.md` GitHub blob URL plus the **delta finding** that has emerged since (one-sentence note on what changed). The current automated gate verifies presence of at least one configured predecessor path; it does **not** currently count rows by predecessor type or enforce the numeric `monthly-review` minima above. Treat the table as the required analysis standard, with per-type counts confirmed during review until the gate is expanded.

---

## 7 — PIR roll-forward

Every prior-cycle PIR from the most recent matching horizon folder MUST be ingested into `intelligence-assessment.md` and tagged in `pir-status.json`. New PIRs created during this run carry an explicit `obsolescenceDate` field. Roll-forward is recorded in the supplementary `horizon-pir-rollforward.md` (never blocking on its own — but if missing, a `<!-- horizon-pir-rollforward: skipped — <reason> -->` annotation MUST appear in `methodology-reflection.md`).

`scripts/roll-forward-pirs.ts` (extended for this module) consumes the most recent same-type predecessor folder and emits the genealogy table.

---

## 8 — Forward-indicator horizon bands

`forward-indicators.md` baseline is ≥ 10 indicators across 4 bands (72 h / week / month / election). Long-horizon overrides:

| Article type | Horizon bands required | Indicator floor |
|--------------|------------------------|-----------------|
| `quarter-ahead` | 5 — `week / month / quarter / year / election` | 12 |
| `year-ahead` | 5 — `month / quarter / year / cycle / election` | 12 |
| `election-cycle` | 4 — `quarter / year / cycle / election` | 15 |

Each indicator carries: name, threshold, source URL/dok_id, current observed value, watch-trigger condition, owning PIR.

---

## 9 — Pass-2 audit additions

Append the following items to the Pass-2 self-audit checklist in `methodology-reflection.md`:

- [ ] **Horizon stratification** — every WEP term carries a `[horizon:<band>]` tag.
- [ ] **WEP-band degradation** — no `very likely`/`very unlikely` at `year`/`cycle` bands without ≥ 3 corroborated sources.
- [ ] **Scenario tree depth** — count matches `longHorizonRules.scenarioCount` × branches.
- [ ] **Counterfactuals** — ≥ N explicit `**Counterfactual N — <name>**` paragraphs in `devils-advocate.md`.
- [ ] **IMF projection-year stamp** — every WEO/FM citation includes `T+N`.
- [ ] **PESTLE mandatory** — blocking artifact present (year-ahead / cycle).
- [ ] **Cross-horizon citation** — predecessors counted per registry rule.
- [ ] **PIR roll-forward** — predecessor PIRs ingested or annotated as skipped.

---

## 10 — Determinism + reproducibility

Long-horizon analyses are designed to be **trend-aware** — they ingest their own predecessors and roll PIRs forward. To keep this auditable:

- Every long-horizon `methodology-reflection.md` includes a `## Predecessor manifest` block listing the exact predecessor folder paths consumed.
- Every long-horizon `data-download-manifest.md` includes a `## IMF vintage pin` block with `vintage`, `retrieved_at`, `payload_sha256`.
- Every long-horizon run that **fails** to ingest a required predecessor records a `<!-- predecessor-ingestion: skipped — <subfolder> not found -->` note in `methodology-reflection.md` AND lowers the analysis-depth label to `standard` for that run.

---

## 11 — Out of scope (for this module)

- **`election-cycle` cycle-rollover at the 2026-09-13 election** — handled in `ext/cycle-rollover.md`.
- **WEP / Admiralty / ICD 203 base rules** — already in `04-analysis-pipeline.md` + `political-style-guide.md`.
- **Tier-C period multipliers** — already in `ext/tier-c-aggregation.md`. This module **adds** rules on top; it does not duplicate them.
