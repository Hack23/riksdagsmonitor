# 04 — Analysis Pipeline

Analysis is the **primary product**. Articles are derived from analysis. Never write an article before analysis is complete.

## Output language

Every artifact you produce in this module is authored in **English prose**. Swedish proper nouns, source titles, party/agency names and direct quotes from `Riksdagen`/`Regeringen` documents are preserved verbatim with attribution — but headings, body paragraphs, table cells, bullet text, Mermaid node labels and analytical commentary are written in English. There is no per-language analysis. The single localized output channel is `executive-brief_<lang>.md`, produced by the separate `news-translate` workflow and consumed at render-time by the existing localized-brief cascade — see `00-base-contract.md §Output language — English only`.

Authoritative methodology & templates:

- **Read-me-first** → [`analysis/methodologies/artifact-catalog.md`](../../analysis/methodologies/artifact-catalog.md) (single source of truth for every artifact — family, template, depth floor, Mermaid type, MCP data source, gate check) and [`analysis/methodologies/per-artifact-methodologies.md`](../../analysis/methodologies/per-artifact-methodologies.md) (Inputs / Analytic-moves / Evidence-rules / Anti-patterns per artifact). Open these before any framework-specific methodology.
- Methodology → [`analysis/methodologies/ai-driven-analysis-guide.md`](../../analysis/methodologies/ai-driven-analysis-guide.md) (DIW weighting, tier depths, Pass 1/Pass 2 rules, F3EAD mapping)
- Indicator maps → [`imf-indicator-mapping.md`](../../analysis/methodologies/imf-indicator-mapping.md) (economic context — macro, fiscal, monetary, external-sector, trade, commodity, FX, interest rates — with vintage-tagged WEO+FM projections) + [`worldbank-indicator-mapping.md`](../../analysis/methodologies/worldbank-indicator-mapping.md) (governance WGI, environment, social / education participation, defence historicals, crime / justice). Statskontoret is the preferred Swedish public-sector governance / agency-capacity overlay for implementation feasibility and administrative-burden claims.
- Depth floors → [`reference-quality-thresholds.json`](../../analysis/methodologies/reference-quality-thresholds.json) (per-article-type × per-artifact line floors + tradecraft signals consumed by Pass-2 self-audit)
- Supporting frameworks → [`political-classification-guide.md`](../../analysis/methodologies/political-classification-guide.md), [`political-swot-framework.md`](../../analysis/methodologies/political-swot-framework.md), [`political-risk-methodology.md`](../../analysis/methodologies/political-risk-methodology.md), [`political-threat-framework.md`](../../analysis/methodologies/political-threat-framework.md), [`synthesis-methodology.md`](../../analysis/methodologies/synthesis-methodology.md), [`strategic-extensions-methodology.md`](../../analysis/methodologies/strategic-extensions-methodology.md), [`electoral-domain-methodology.md`](../../analysis/methodologies/electoral-domain-methodology.md), [`structural-metadata-methodology.md`](../../analysis/methodologies/structural-metadata-methodology.md), [`per-document-methodology.md`](../../analysis/methodologies/per-document-methodology.md), [`political-style-guide.md`](../../analysis/methodologies/political-style-guide.md), [`osint-tradecraft-standards.md`](../../analysis/methodologies/osint-tradecraft-standards.md) — **tradecraft canon: ICD 203 + Admiralty + WEP + SAT catalog + OSINT ethics + DIW alignment + PIR handoff**
- Templates → [`analysis/templates/*.md`](../../analysis/templates/) (one file per artifact — 23 always-on + per-document + 7 operational supplementary)

**Operational supplementary artifacts** — 7 enrichment templates that strengthen the AI-FIRST quality loop, cross-run memory, and MCP health auditability. **Recommended** for every `deep` run; **mandatory** for every `comprehensive` / Tier-C aggregation run; enforced by [`05-analysis-gate.md §Supplementary checks`](05-analysis-gate.md):

| Template | When to produce | Feeds |
|----------|-----------------|-------|
| [`analysis-index.md`](../../analysis/templates/analysis-index.md) | always for `deep`/`comprehensive` | downstream reviewers |
| [`reference-analysis-quality.md`](../../analysis/templates/reference-analysis-quality.md) | `comprehensive`; operationalises AI-FIRST | Pass-2 self-audit |
| [`mcp-reliability-audit.md`](../../analysis/templates/mcp-reliability-audit.md) | `comprehensive` or any MCP degradation | incident follow-up |
| [`workflow-audit.md`](../../analysis/templates/workflow-audit.md) | `comprehensive` | 11-principle compliance |
| [`cross-run-diff.md`](../../analysis/templates/cross-run-diff.md) | any article type with ≥ 2 runs | Bayesian update |
| [`cross-session-intelligence.md`](../../analysis/templates/cross-session-intelligence.md) | `weekly-review`, `monthly-review`, quarterly | session narrative |
| [`session-baseline.md`](../../analysis/templates/session-baseline.md) | any aggregation workflow | calendar + roster fact layer |

These are **not counted in the 23 mandatory artifacts** — the 23-artifact contract is unchanged.

**Analytical supplementary artifacts** — 4 optional deep-dive templates mapped to frameworks explicitly listed in the intelligence-operative agent's "Core Expertise" that previously had no template. **Never blocking** in `05-analysis-gate.md` and **never replace** a core artifact. Produce when the trigger condition applies; otherwise skip. See [`analytical-supplementary-methodology.md`](../../analysis/methodologies/analytical-supplementary-methodology.md) for composition rules and per-template analytic moves.

| Template | Produce when | Pairs with |
|----------|--------------|-----------|
| [`pestle-analysis.md`](../../analysis/templates/pestle-analysis.md) | event crosses ≥ 2 PESTLE dimensions | `swot-analysis.md`, `risk-assessment.md`, `scenario-analysis.md` |
| [`political-stride-assessment.md`](../../analysis/templates/political-stride-assessment.md) | election-adjacent / integrity incident / disinfo / critical-infra vote | `threat-analysis.md`, `risk-assessment.md` Institutional/Corruption |
| [`wildcards-blackswans.md`](../../analysis/templates/wildcards-blackswans.md) | long-horizon forecasting (`monthly-review`, election year) | `scenario-analysis.md`, `forward-indicators.md` |
| [`quantitative-swot.md`](../../analysis/templates/quantitative-swot.md) | decision memo needing scored ranking | `swot-analysis.md`, `significance-scoring.md`, `executive-brief.md` |

These are **not counted in the 23 mandatory artifacts** and **not counted in the 7 operational supplementary** — the contract is unchanged. Agents ignoring them still produce valid output.

## Role boundary

| Scripts do | AI does |
|------------|---------|
| Download data, catalogue documents, create file scaffolds | Every analytical judgement: SWOT, risks, threats, stakeholder mapping, significance weighting, classification, cross-references, scenarios, coalition math, historical parallels, media framing, forward indicators, methodology reflection |

Scripts never generate analysis prose. Any `AI_MUST_REPLACE` marker left in a committed file fails the gate.

## 23 required artifacts (every workflow, every run)

Produced in `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/`. The output set is **stable** — morning, evening, realtime, weekly, monthly and aggregation workflows all produce the same 23 files; only per-item **depth** adapts (see §Depth calibration). This matches [`ai-driven-analysis-guide.md` §Step 4 / §Step 5 / §Output Matrix](../../analysis/methodologies/ai-driven-analysis-guide.md#step-4--core-synthesis-f3ead-exploit--analyze).

### Family A — Core Synthesis (9 files · F3EAD: EXPLOIT → ANALYZE)

| # | File | Source template | Minimum body |
|:-:|------|-----------------|--------------|
| 1 | `README.md` | [`templates/README.md`](../../analysis/templates/README.md) § Folder README | Per-folder index linking every other file, generation date, run mode |
| 2 | `executive-brief.md` | [`executive-brief.md`](../../analysis/templates/executive-brief.md) | BLUF (2–4 sentences), ≥ 3 decisions supported, 60-second read bullets, top forward trigger, confidence label, ≥ 1 Mermaid |
| 3 | `synthesis-summary.md` | [`synthesis-summary.md`](../../analysis/templates/synthesis-summary.md) | Lead-story decision, DIW-weighted ranking, integrated intelligence picture, ≥ 1 Mermaid |
| 4 | `significance-scoring.md` | [`significance-scoring.md`](../../analysis/templates/significance-scoring.md) | DIW scores per document, sensitivity analysis, Mermaid rank diagram |
| 5 | `classification-results.md` | [`political-classification.md`](../../analysis/templates/political-classification.md) | 7-dimension classification per document, priority tiers, retention, access |
| 6 | `swot-analysis.md` | [`swot-analysis.md`](../../analysis/templates/swot-analysis.md) | S/W/O/T with evidence rows citing `dok_id` + TOWS matrix + cross-SWOT |
| 7 | `risk-assessment.md` | [`risk-assessment.md`](../../analysis/templates/risk-assessment.md) | 5-dimension register, L × I scores, cascading chains, posterior probabilities |
| 8 | `threat-analysis.md` | [`threat-analysis.md`](../../analysis/templates/threat-analysis.md) | Political Threat Taxonomy, attack tree, kill chain, MITRE-style TTP mapping |
| 9 | `stakeholder-perspectives.md` | [`stakeholder-impact.md`](../../analysis/templates/stakeholder-impact.md) | 6-lens stakeholder matrix, named actors, influence network |

### Family B — Structural Metadata (2 files)

| # | File | Source template | Minimum body |
|:-:|------|-----------------|--------------|
| 10 | `data-download-manifest.md` | [`data-download-manifest.md`](../../analysis/templates/data-download-manifest.md) | Every `dok_id` with source URL, retrieval time, data-depth tag (produced in module 03) |
| 11 | `cross-reference-map.md` | [`cross-reference-map.md`](../../analysis/templates/cross-reference-map.md) | Policy clusters, legislative chains, coordinated-activity patterns, sibling-folder citations (Tier-C) |

### Family C — Strategic Extensions (5 files · F3EAD: ANALYZE continued)

| # | File | Source template | Minimum body |
|:-:|------|-----------------|--------------|
| 12 | `scenario-analysis.md` | [`scenario-analysis.md`](../../analysis/templates/scenario-analysis.md) | ≥ 3 distinct scenarios + probabilities summing 100%, leading indicator per scenario |
| 13 | `comparative-international.md` | [`comparative-international.md`](../../analysis/templates/comparative-international.md) | ≥ 2 comparator jurisdictions (Nordic + EU minimum) with Outside-In analysis |
| 14 | `devils-advocate.md` | [`devils-advocate.md`](../../analysis/templates/devils-advocate.md) | ≥ 3 competing hypotheses via ACH matrix, Red-Team challenge, rejected alternatives logged |
| 15 | `intelligence-assessment.md` | [`intelligence-assessment.md`](../../analysis/templates/intelligence-assessment.md) | 3–7 Key Judgments with confidence labels, PIRs for next cycle, Key Assumptions Check |
| 16 ⭐ | `methodology-reflection.md` | [`methodology-reflection.md`](../../analysis/templates/methodology-reflection.md) | **VITAL run-audit gate.** Must include all 9 required sections: ICD 203 full audit grid; Devil's-Advocate KJ-coverage matrix (100%); confidence distribution with explicit posterior per KJ; Lagrådet/Statskontoret/SKR tracking; sibling-folder ingestion record; unified re-run log schema (`run_id`,`attempt`,`new dok_ids`,`artifacts extended`,`flags closed`,`vintage refresh`); banned-phrase zero-count grid; Pass 1→Pass 2 delta table; improvement opportunities linked to PIR roll-forward |

### Family D — Electoral & Domain Lenses (7 files)

| # | File | Source template | Minimum body |
|:-:|------|-----------------|--------------|
| 17 | `election-2026-analysis.md` | [`election-2026-analysis.md`](../../analysis/templates/election-2026-analysis.md) | Seat-projection deltas, coalition viability (converts to post-2026 context file after the election) |
| 18 | `voter-segmentation.md` | [`voter-segmentation.md`](../../analysis/templates/voter-segmentation.md) | Demographic / regional / ideological segment impact, baseline positions on procedural days |
| 19 | `coalition-mathematics.md` | [`coalition-mathematics.md`](../../analysis/templates/coalition-mathematics.md) | Current seat map, pivotal-vote table, Sainte-Laguë scenarios |
| 20 | `historical-parallels.md` | [`historical-parallels.md`](../../analysis/templates/historical-parallels.md) | Named precedent(s) ≤ 40 years with similarity score (or "no-precedent" finding with reasoning) |
| 21 | `media-framing-analysis.md` | [`media-framing-analysis.md`](../../analysis/templates/media-framing-analysis.md) | **v2.1 (no-neutral-media doctrine).** ≥ 3 frame packages with Entman 4-function decomposition; cognitive-vulnerability map (Cialdini / Kahneman / Roozenbeek-van der Linden); DISARM TTP map (verbatim `T####`) or explicit no-signal finding; narrative-laundering chain (fringe → alt → politician → mainstream → international); **Outlet Bias Audit (no outlet is neutral)** — every cited outlet declared with ownership group · funding mix percentages · board-appointment authority · documented editorial lean · Reuters Institute Trust score · PO/PON complaints · foreign-actor link, sourced from Nordicom / Reuters Institute / Förvaltningsstiftelsen / EUvsDisinfo / EU-EEAS; CIB ABCDE block (Camille François 2020); algorithmic-asymmetry rows naming each platform's optimisation target (engagement / watch-time / retention / ad-yield) with academic / transparency-report citations; ≥ 2 comparative-international frame cognates; strategic-doctrine detection table (firehose / doppelganger / gish gallop / reflexive control / active-measures spillover / interest-group capture / MAGA cognate); frame lifecycle + half-life + zombie-probability table; RRPA impact (Reach × Resonance × Persistence × Action) with dated action indicator; L1–L5 counter-resilience ladder per frame (procedural neutrality only — platform reports the ladder, never executes counter-framing); longitudinal frame-record entry. Frame C labelled "establishment / centrist-consensus" and Frame D labelled "public-broadcaster proceduralist" — never "neutral / impartial / balanced". Frame E (foreign overlay) only when state-affiliated or coordinated foreign amplification is observed. |
| 22 | `implementation-feasibility.md` | [`implementation-feasibility.md`](../../analysis/templates/implementation-feasibility.md) | Delivery-risk view (budget / IT / regulatory / workforce); backlog audit on no-bill days |
| 23 | `forward-indicators.md` | [`forward-indicators.md`](../../analysis/templates/forward-indicators.md) | ≥ 10 dated indicators across 4 horizons (72 h / week / month / election) |

### Family E — Per-document files (N files)

`documents/{dok_id}-analysis.md` — one per `dok_id` in `data-download-manifest.md`, using [`per-file-political-intelligence.md`](../../analysis/templates/per-file-political-intelligence.md) at the depth tier matching the document's DIW (L1 Surface / L2 Strategic / L2+ Priority / L3 Intelligence-grade). Cluster files (`{cluster}-cluster-analysis.md`) collapse related low-weight items.

> **Filename variants** — canonical `stakeholder-perspectives.md` ← template `stakeholder-impact.md`; canonical `classification-results.md` ← template `political-classification.md`; `comparative-international.md` ↔ `international-comparative.md`; `historical-parallels.md` ↔ `historical-baseline.md`; `election-2026-analysis.md` ↔ `election-cycle-analysis.md` ↔ `election-2026-implications.md` (all three map to the same cycle-parameterised template); `cycle-trajectory.md` and `parliamentary-season.md` are separate Family-D supplementary long-horizon tracking artifacts; `horizon-pir-rollforward.md` (supplementary — PIR carry-forward across horizon bands). For the general filename-variant rules, see [`ai-driven-analysis-guide.md` §Filename variants](../../analysis/methodologies/ai-driven-analysis-guide.md#-filename-variants-all-map-to-one-template--one-methodology-section); this prompt additionally accepts `election-cycle-analysis.md` as a local alias for the same election-cycle artifact.

## File-write contract (point-of-use reminder)

> 🛠 **All 23 artifacts on this page MUST be written with the `edit` tool** — Pass 1 creates, Pass 2 read-back-and-improves, improvement-mode extensions, `pass1/` snapshot copies (`cp` is fine), `documents/{dok_id}-analysis.md`, and the `## Re-run delta` appends in `methodology-reflection.md`. **Never** use `python3`, `node -e`, `sed -i`, `echo … > file`, `tee file`, or unquoted heredocs (`<<EOF`). The Tier-2 fallback (`cat <<'EOF_RAW' > file`) is only acceptable when `edit` has already failed for non-content-shape reasons and the content is pure ASCII without code fences / Mermaid / `$` / backticks / `EOF` markers. Any Mermaid block, any `ö ä å`, any RTL/CJK character, any non-trivial YAML/JSON sidecar ⇒ `edit` only. See [`01-bash-and-shell-safety.md` §File creation & overwrite strategy](01-bash-and-shell-safety.md) for the full hierarchy and banned-pattern list.

## Execution order

> **Improvement-mode path** (when `IMPROVEMENT_MODE=true` from `03-data-download.md §Pre-flight`): **do not skip**, **do not no-op**. The 23 artifacts already exist on disk — your job is to **extend and improve** them, not regenerate them from scratch. Replace step 3 (Pass 1 — Create) with step 3′ below; steps 1, 2, 4, 5 still run normally. The aggregate+render step in module 06 is **always executed** — `article.md` and `news/*.html` are regenerated on every run.
>
> **3′ — Improvement Pass (replaces Pass 1 — Create)**:
>
> 1. **Read every existing artifact in full** (one tool call per file, including `documents/*-analysis.md`).
> 2. **Re-run the download/discovery only** to identify new `dok_id`s, fresher `get_voteringar` results, new committee schedule entries, or updated regering.se / SCB / IMF / Statskontoret context. At this stage, do **not** append to artifacts, do **not** update `data-download-manifest.md`, and do **not** create any new `documents/{dok_id}-analysis.md` files yet — just capture what must be updated after the baseline snapshot in step 4 below.
> 3. **Prepare the extension plan only** (no writes yet): determine which artifacts need changes, which new evidence rows must be added, which time-sensitive sections must be refreshed (forward indicators, scenario probabilities, coalition mathematics, election-2026 deltas), which `[unconfirmed]` flags can now be closed with ≥ 3 sources, which Key Judgments must be sharpened, and what `## Re-run delta` notes will be appended to `methodology-reflection.md` after the baseline snapshot.
> 4. **Never delete** prior analysis content unless it is factually wrong; correct in place and note the correction.
> 5. **Apply the planned extensions only after step 4 below** has snapshotted the pre-improvement baseline into `pass1/`. Concretely: after the snapshot, append new entries to `data-download-manifest.md` under a new `## Re-run YYYY-MM-DD HH:MM UTC` heading, create `documents/{dok_id}-analysis.md` for each new document, extend each existing artifact, and append a `## Re-run delta` subsection to `methodology-reflection.md` documenting what changed and why.
> 6. **Floor**: at least 8 minutes of real read/review-and-extend work across the artifact set on a `standard` improvement re-run, 12 minutes on `deep`, 15 minutes on `comprehensive`. Improvement-mode runs that produce zero artifact changes are a quality failure — there is **always** something to extend after the baseline snapshot (newer voting outcomes, new dok_ids, sharper uncertainty disclosure, fresher economic vintage, new media frames).
>
> Pass 2 (step 5 below) is still mandatory in improvement-mode and applies to every artifact, including the unchanged ones (read them, decide whether last run's improvement still holds).

1. **Read all relevant methodologies first** (the primary methodology guide plus every supporting framework listed above, including `osint-tradecraft-standards.md`; one tool call per file; skipping fails the gate via `methodology-reflection.md §evidence` audit).
2. **Read all 23 templates first** — at minimum open each Family A/B/C/D template before writing its artifact.
3. **Pass 1 — Create** all 23 always-on artifacts + every per-document file. Minimum 20 minutes of real work. *(Improvement-mode replaces this with step 3′ above.)*
4. **Snapshot Pass-1** — copy every Pass-1 file into `$ANALYSIS_DIR/pass1/` before starting Pass 2: `mkdir -p "$ANALYSIS_DIR/pass1" && cp "$ANALYSIS_DIR"/*.md "$ANALYSIS_DIR/pass1/"`. The `pass1/` directory is the fallback evidence the gate uses when mtime windows are too tight. Do **not** stage `pass1/` in the PR (see `07-commit-and-pr.md`). *(Improvement-mode: take this snapshot **before** making any write/extend changes from step 3′ — until this snapshot exists, treat step 3′ as read/download/planning only and apply extensions only after step 4. Do not assume `pass1/` or its `.md` files are already present from the prior run; the broadened router (`03-data-download.md §Pre-flight`) may enter improvement-mode from a minimal carry-forward such as only `synthesis-summary.md`. The `mkdir -p` keeps the command valid in both cases. The snapshot overwrites any earlier baseline; the gate only needs the most recent pre-improvement copy for Pass-2 delta checks.)*
5. **Pass 2 — Improve**: read every Pass-1 file back in full and strengthen evidence, diagrams, cross-references, stakeholder coverage, uncertainty disclosure, Admiralty annotations, WEP language, PIR/EEI tags. Minimum 10 minutes.
6. **Pass-2 declaration (mandatory, fail-loud contract)** — append/update `methodology-reflection.md` with a single canonical status line before running the gate: `Pass-2 status: executed in full`. If Pass 2 cannot be completed in full by the minute-42 PR window, do **not** proceed as a normal success path; treat it as an explicit gate failure and document the failure in the same file (no silent "not executed in full" acceptance).

> ⏱  **Time-budget self-check at every step transition.** Before starting steps 3, 5 and 6 (and again before the aggregate+render in `06-article-generation.md`), run the `agent_minute` helper from `01-bash-and-shell-safety.md §Time-budget self-monitoring` and compare against the phase budget in `00-base-contract.md §Session timing → Phase budget`. If a phase is running past its budget, **adapt** (drop to depth floor, trim Pass 2 polish, render fewer languages last) rather than skipping; if `agent_minute ≥ 42`, follow `07-commit-and-pr.md §Emergency deadline order of operations`.

Pass 2 is mandatory. Completing earlier is a quality failure. `methodology-reflection.md` is the self-audit of Pass 2 — skipping it breaks the self-correction loop.

### Family parallelisation guidance (within dependency limits)

To reduce budget exhaustion, parallelise independent work where possible:

- Batch-read templates/methodologies in parallel tool calls before writing.
- In Pass 1, draft Families **A/B/C/D** as independent workstreams after `data-download-manifest.md` is stable.
- In Pass 2, run parallel read-back/improvement sweeps by family, then do one final coherence sweep (`synthesis-summary.md` + `cross-reference-map.md` + `methodology-reflection.md`).

Never parallelise steps with direct dependencies (`pass1/` snapshot → Pass 2 writes → gate).

## Depth calibration

Depth adapts per item by DIW tier (L1 Surface / L2 Strategic / L2+ Priority / L3 Intelligence-grade per [§Output Matrix](../../analysis/methodologies/ai-driven-analysis-guide.md#-output-matrix--every-file-every-family)) — **all 23 files are produced regardless**. What changes is word-count and framework richness per item.

| `analysis_depth` input | Pass 1 floor | Pass 2 floor | Use |
|-----------------------|--------------|--------------|-----|
| `standard` | 15 min | 7 min | Light day, single-type workflow, most items at L1–L2 |
| `deep` (default) | 20 min | 10 min | Standard news day, L2–L2+ items present |
| `comprehensive` | 25 min | 12 min | Tier-C aggregation, deep-inspection, L3 items likely |

Aggregation (Tier-C) workflows apply the period-scope multiplier from `ext/tier-c-aggregation.md` **on top of** these floors.

## Long-horizon forecasting

Workflows at quarter / year / election-cycle horizons apply **horizon stratification** — WEP confidence degrades as horizon lengthens, scenario trees branch deeper, and IMF projection-year stamps (T+1 … T+5) become first-class metadata. Full rules in [`ext/long-horizon-forecasting.md`](ext/long-horizon-forecasting.md). The **23-artifact contract** is the **base always-on** analysis set; long-horizon rules are **additive per type** and may make supplementary artifacts mandatory for specific article types, increasing the blocking requirement beyond 23 when those horizon-specific artifacts apply.

Cycle-rollover (file rename + PIR archival when the election anchor flips) is defined in [`ext/cycle-rollover.md`](ext/cycle-rollover.md) and activates within ± 30 days of the next Swedish election date.

## Evidence standard

Every analytical claim must cite at least one of: a real `dok_id` (e.g. `H901FiU1`) resolvable via `get_dokument`; a named MP / minister / party with role; vote counts from `get_voteringar`; or a primary-source URL (riksdagen.se, regeringen.se, scb.se, statskontoret.se, worldbank.org, api.imf.org, data.imf.org, www.imf.org). Annotate each evidence row with an **Admiralty Code** `[A–F][1–6]`. Apply the **Source Diversity Rule** — P0/P1 claims require ≥ 3 independent sources; single-source claims must be flagged `[unconfirmed]` (Pass-2 improvement target). Generic phrasing without evidence is rejected at the gate (`05-analysis-gate.md` check 4 and its Family-C/D extensions).

## Economic context

All economic / fiscal / monetary / external-sector / trade / COFOG / commodity / exchange-rate context is **IMF-first**. **IMF pre-warm is mandatory for every article type** — including accountability docs (interpellations, frågor) and committee reports. Even when the immediate document is procedural, fiscal/agency context anchors `implementation-feasibility.md`, `risk-assessment.md` (Economic dimension), `comparative-international.md` and `historical-parallels.md`. Skipping IMF on the assumption "this article is not economic" is a recurring methodology gap and is flagged in `methodology-reflection.md §Content Metrics`.

When the article type touches these topics:

1. **Discover** — look up the committee's required IMF indicators in [`analysis/imf/indicators-inventory.json → committeeMatrix`](../../analysis/imf/indicators-inventory.json) or call `findImfIndicatorsForCommittee(code)` from [`scripts/imf-context.ts`](../../scripts/imf-context.ts).
2. **Pre-warm status** — read `data/imf-context.json` written by `.github/actions/news-prewarm` before analysis. `status: degraded` means WEO/FM are usable but SDMX-only claims need cached evidence; `status: unavailable` (or `data/imf-unavailable.flag`) means inject the standard IMF-unavailable warning and use cached IMF / SCB fallback only. Do **not** use World Bank GDP/GNI/inflation/unemployment/debt as an economic substitute.
3. **Fetch** — prefer `compare` (batched, 1 call per indicator across Nordic peers) over parallel `weo`. Always pass `--persist`. `sleep 1` between invocations. Target ≤ 10 IMF calls per article. Use `scripts/imf-fetch.ts`; do not issue raw Datamapper fetches because the client carries the required IMF-safe User-Agent.
4. **Vintage-stamp every projection** — `(WEO Apr-2026, GGXWDG_NGDP)` is mandatory; un-stamped projection quotes fail the audit.
5. **Write** `economic-data.json` v2.0 per the [Economic Data Contract](../aw/ECONOMIC_DATA_CONTRACT.md) v3.0+. `source.imf[]` MUST be non-empty; `source.scb[]` carries Swedish-specific ground truth; `source.worldBank[]` carries governance, environment, social, defence-historical, and crime/justice codes when those are cited.
6. **Reference WB** for the non-economic context — WGI governance (`source=75`), environment (`EN.*`, `EG.*`, `AG.LND.FRST.ZS`), education participation (`SE.PRM.ENRR`), defence historicals (`MS.MIL.XPND.GD.ZS`), crime (`VC.IHR.PSRC.P5`). Use [`analysis/worldbank/indicators-inventory.json`](../../analysis/worldbank/indicators-inventory.json) for the catalogue.

**Cite IMF for every economic claim** — use the canonical IMF dataflow + indicator: `WEO:NGDP_RPCH` (real GDP growth), `WEO:NGDPD` (nominal GDP), `WEO:NGDPDPC` (GDP per capita), `WEO:PCPIPCH` (annual CPI inflation), `IFS:PCPI_IX` (monthly CPI), `WEO:LUR` (unemployment, with SCB AKU as Swedish-specific ground truth), `WEO:GGXWDG_NGDP` / `FM:GGXWDG_NGDP` (gross debt), `WEO:GGXCNL_NGDP` / `FM:GGXCNLB_NGDP` (fiscal balance), `WEO:GGR_NGDP` (revenue/GDP), `WEO:GGX_NGDP` (expenditure/GDP), `WEO:BCA_NGDPD` (current account), `WEO:TX_RPCH` / `WEO:TM_RPCH` (export/import volume growth), `DOTS:TXG_FOB_USD` / `DOTS:TMG_CIF_USD` (bilateral trade flows), `MFS_IR:FPOLM_PA` (Riksbank policy rate), `ER:ENDA_XDC_USD_RATE` / `ER:ENDE_XDC_EUR_RATE` (exchange rates), `PCPS:POILAPSP` / `PCPS:PALLFNF` (commodity prices). `INDICATOR_IDS` (`scripts/world-bank-client.ts`) catalogues the non-economic indicators handled by World Bank.

Chart.js specs live in the [Economic Data Contract](../aw/ECONOMIC_DATA_CONTRACT.md) — follow it exactly. Produce at least one economic chart data file (`economic-data.json`) per article that has an economic-context section.

## Statskontoret governance / implementation overlay

Statskontoret is the Swedish public-management source for agency capacity, administrative burden, governance effectiveness, inter-agency coordination, implementation backlogs and public-sector efficiency. When a document assigns work to an authority or depends on administrative delivery, integrate Statskontoret evidence into `implementation-feasibility.md`, `stakeholder-perspectives.md`, `risk-assessment.md`, `comparative-international.md` and `methodology-reflection.md`. Record source URL, report/page title, publication date, retrieval time and Admiralty grade in `data-download-manifest.md`; cite it as a public URL in analysis rows.

## Party-attribution discipline

When the source JSON for a document or speaker has an **empty or missing `parti` field** (a recurring data-quality issue with the Riksdag MCP for fresh motions and per-author dokument metadata), do **not** silently infer party from committee routing or thematic content alone. Apply this procedure:

1. **Verify** — issue a second MCP call (`search_ledamoter` keyed by author name + committee, or `get_ledamot` by `intressent_id` from the document JSON) to confirm the party. Record the verification call in `data-download-manifest.md`.
2. **If verification confirms** — use the confirmed party in analysis prose; no flag required.
3. **If verification fails or is ambiguous** — every party-specific claim derived from that document MUST be tagged `[unconfirmed]` in artifact prose (e.g. "*proposed by an SD-aligned author* `[unconfirmed]`"). Count the `[unconfirmed]` tags in `methodology-reflection.md §Content Metrics`.

Single-source thematic inference of party is **not** acceptable evidence for P0 / P1 claims; it must be flagged `[unconfirmed]` and is a Pass-2 closure target.

## Election-proximity significance multiplier

When the next general election is **≤ 6 months away** (Sweden's general election falls on the second Sunday of September of an election year — for 2026 the cutoff is **2026-03-13** through **2026-09-13**), apply a **1.5× multiplier** to the Detectability × Impact × Willingness DIW score for **opposition motions** and **government propositions in contested policy areas** (migration, defence, taxation, climate, criminal justice). Aggregate opposition motion bursts (≥ 5 motions filed the same day) receive an additional aggregation weight per `synthesis-methodology.md`. Record the multiplier explicitly in `significance-scoring.md` (e.g. `DIW = 4.2 × 1.5 (election ≤ 6 months) = 6.3`) and in `methodology-reflection.md §Content Metrics`.

## Single-agent review substitute (non-ICD control)

ICD 203 Standard 9 keeps its established repository meaning (per `osint-tradecraft-standards.md` and existing `methodology-reflection.md §ICD 203 Audit` checklists — see [`analysis/templates/methodology-reflection.md`](../../analysis/templates/methodology-reflection.md)) and is evidenced through the artifacts already mapped to it. Because riksdagsmonitor news workflows run as a single AI agent, they additionally require a separate **single-agent review substitute** internal control to compensate for the absence of live peer collaboration. This control has three concrete components, all of which MUST be evidenced in `methodology-reflection.md §Content Metrics` (row "Single-agent review substitute"):

1. **Pass 2 read-back** — every artifact (except `data-download-manifest.md`) is read back in full and improved (file mtime gate; `pass1/` snapshot in `$ANALYSIS_DIR/pass1/`).
2. **Devil's Advocate / ACH** — `devils-advocate.md` carries ≥ 3 competing hypotheses, with at least one rejecting the synthesis-summary lede.
3. **Cross-folder peer citation** — for aggregation workflows (Tier-C), at least one sibling-folder artifact is cited per `cross-reference-map.md` row; for single-type workflows, at least one **prior-cycle** artifact (same-subfolder previous run via `cross-run-diff.md`) is cited.

When all three components are evidenced, the substitute control is complete. When any is missing, record the control as incomplete and surface the gap as the top item in `methodology-reflection.md §What to Improve`. This control is **not** a renumbered ICD standard — assess each ICD 203 standard separately under its established repository terminology.

Full IMF integration reference: [`analysis/imf/README.md`](../../analysis/imf/README.md) · [`analysis/imf/agentic-integration.md`](../../analysis/imf/agentic-integration.md) (7-step playbook) · [`analysis/imf/data-dictionary.md`](../../analysis/imf/data-dictionary.md).

## Visualisation data

For each article with charts, produce accompanying JSON under `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/` (e.g. `vote-distribution.json`, `swot-summary.json`, `risk-heatmap.json`, `coalition-math.json`, `forward-indicators.json`) using the shapes defined in the templates. Scripts render the HTML containers; the AI writes the commentary paragraph adjoining each chart.

## Next step

Proceed to `05-analysis-gate.md`. Do not start article generation until the gate passes against all 23 artifacts.

## External references

- gh-aw runtime (v0.74.3): [abridged](https://github.github.com/gh-aw/llms-small.txt) · [complete](https://github.github.com/gh-aw/llms-full.txt) · [agentic-workflows blog](https://github.github.com/gh-aw/_llms-txt/agentic-workflows.txt) · [source](https://github.com/github/gh-aw)
- Methodology entry point: [`analysis/methodologies/ai-driven-analysis-guide.md`](../../analysis/methodologies/ai-driven-analysis-guide.md)
- Artifact ↔ gate-check mapping: [`analysis/templates/README.md`](../../analysis/templates/README.md) §"Artifact → workflow → gate check mapping"
