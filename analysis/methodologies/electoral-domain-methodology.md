<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">📕 Electoral & Domain Methodology</h1>

<p align="center">
  <strong>📊 Family D — Lens-Specific Analytical Depth</strong><br>
  <em>🎯 Current-cycle election · Next-cycle election · Voter Segmentation · Coalition Mathematics · Historical Parallels · Media Framing · Implementation Feasibility · Forward Indicators</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.4-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--05--01-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.4 | **📅 Last Updated:** 2026-05-01 (UTC)
**🔄 Review Cycle:** Quarterly | **⏰ Next Review:** 2026-07-21
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

---

<!-- BEGIN AI-FIRST METHODOLOGY CARD -->

## 🎯 AI-FIRST Methodology Card

> **🚦 Read this card before writing a single paragraph.** It names the artifact this methodology owns, the gate check it satisfies, the evidence-density target it must hit, and the Pass-1 / Pass-2 discipline required by `.github/copilot-instructions.md` §5 (AI-FIRST Quality Principle).

| Field | Value |
|-------|-------|
| **Purpose** | Family D — step-by-step production of the 7 electoral & domain-lens artifacts (election-2026, voter-segmentation, coalition-mathematics, historical-parallels, media-framing, implementation-feasibility, forward-indicators). |
| **Inputs** | Family A synthesis; Riksdagen voting records; SCB segment cuts; Sainte-Laguë seat math; Statskontoret reports |
| **Outputs** | All 7 Family D artifacts |
| **Owning artifact(s)** | All 7 Family D artifacts |
| **Owning gate check** | Check 8 (Family D structure: ≥ 10 dated forward indicators, seat-count table in coalition-mathematics, Statskontoret citation in implementation-feasibility when an agency is named) |
| **Citation density target** | ≥ 1 evidence anchor per coalition row; ≥ 1 dated source per forward indicator; ≥ 1 SCB segment cut per voter-segmentation cohort |
| **Banned phrases** | Enforced via [`political-style-guide.md` §Machine-readable banned-phrase list](political-style-guide.md#machine-readable-banned-phrase-list) |
| **Threshold source** | [`reference-quality-thresholds.json`](reference-quality-thresholds.json) → `thresholds[articleType][artifact]` (fallback `defaults.coreArtifactFloor`) |

### ✅ Pass-1 checklist (creation — minimal viable artifact)

- [ ] `coalition-mathematics.md` has a seat-count table with `Ja`/`Nej`/`Avstår` or party-to-seats mapping
- [ ] `forward-indicators.md` has ≥ 10 dated indicators across the 4 horizon sections
- [ ] `implementation-feasibility.md` cites `statskontoret.se` (or `none found`) when a recognised agency is named
- [ ] Produce every required sub-section listed in the owning template
- [ ] Add ≥ 1 evidence anchor (`dok_id`, vote id, named MP, or primary-source URL) per analytical claim
- [ ] Apply the correct WEP confidence band for the run's horizon (`72h / week / month / quarter / year / cycle`)
- [ ] Include ≥ 1 themed Mermaid diagram with `style …` or `themeVariables` config (where structurally meaningful)
- [ ] Cross-link the relevant template under `analysis/templates/` and the gate check it satisfies

### 🔁 Pass-2 checklist (read-back & improve — AI-FIRST mandatory)

- [ ] Re-run Sainte-Laguë for any new poll vintage; show working in coalition-mathematics
- [ ] Add ≥ 1 historical parallel with date + outcome to `historical-parallels.md`
- [ ] Verify media-framing reflects ≥ 3 outlets across the political spectrum
- [ ] Re-read the file end-to-end; flag every claim that lacks an evidence anchor and add one
- [ ] Replace every banned phrase listed in [`political-style-guide.md` §Machine-readable banned-phrase list](political-style-guide.md#machine-readable-banned-phrase-list) with an evidence-anchored alternative
- [ ] Tighten WEP language: never above **likely** without ≥ 3 cycle-aged sources for `year`/`cycle` horizons
- [ ] Strengthen Mermaid (color-coded `style …` directives, `themeVariables`, ≥ 5 nodes where the structure admits it)
- [ ] Add ≥ 1 second-order effect, cui-bono note, or counterfactual where the artifact admits one
- [ ] Verify citation density meets the per-file target below and the gate's evidence-density rules

### 🟢 Exemplar (good — pattern-match this)

> _(forward indicator)_ "**T+30 — `H902FiU1` budget final vote (2026-05-22)**: lead indicator = Ja votes from L bench; expected baseline 16/16. Disconfirming evidence: ≥ 2 L abstentions → coalition stress. Source: kammarens kalender (riksdagen.se)."

### 🔴 Anti-exemplar (failure mode — never ship this)

> _(failure mode)_ "Future events may shift the political landscape. The coalition's stability remains uncertain." — no dates, no indicators, no `dok_id`, banned phrases.

### 🔗 Cross-links

- **Template(s)**: `analysis/templates/election-2026-analysis.md`, `analysis/templates/voter-segmentation.md`, `analysis/templates/coalition-mathematics.md`, `analysis/templates/historical-parallels.md`, `analysis/templates/media-framing-analysis.md`, `analysis/templates/implementation-feasibility.md`, `analysis/templates/forward-indicators.md`
- **Gate check**: [`.github/prompts/05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md#checks-all-must-pass)
- **AI-FIRST canon**: [`.github/copilot-instructions.md` §5](../../.github/copilot-instructions.md) · [`ai-driven-analysis-guide.md`](ai-driven-analysis-guide.md)
- **Style canon**: [`political-style-guide.md`](political-style-guide.md) · [`osint-tradecraft-standards.md`](osint-tradecraft-standards.md)
- **Catalog row**: [`artifact-catalog.md`](artifact-catalog.md)

<!-- END AI-FIRST METHODOLOGY CARD -->

---


## 🔄 Tradecraft Anchors

| Element | Value | Reference |
|---------|-------|-----------|
| **F3EAD Stage** | **ANALYZE → DISSEMINATE** | This methodology applies domain lenses (electoral, historical, media, implementation, forward-watch) to enrich intelligence products |
| **PIRs Served** | `election-2026-analysis.md` (current-cycle) serves PIR-6 (Election Integrity); coalition-mathematics.md serves PIR-1 (Coalition Stability); implementation-feasibility.md serves PIR-5 (Fiscal Trajectory), PIR-7 (Democratic Norms) | See [`political-style-guide.md` §PIR/EEI Catalog](political-style-guide.md#-priority-intelligence-requirements-pir--essential-elements-of-information-eei) |
| **Admiralty Floor** | Polling data requires ≥[B2] (named pollster, date, sample); historical parallels require ≥[A1] (official records from Riksdag archive) | See [`political-style-guide.md` §Admiralty Code](political-style-guide.md#-admiralty-source-reliability-code-nato-stanag-2022) |
| **WEP Requirement** | `election-2026-analysis.md` (alias: `election-cycle-analysis.md`) seat projections with WEP probability; forward-indicators.md triggers with WEP likelihood; scenario probabilities must sum to 100% | See [`political-style-guide.md` §WEP + ODNI](political-style-guide.md#-words-of-estimative-probability-wep--odni-confidence-overlay) |
| **ICD 203 Gate** | Standard 5 (customer relevance — forward indicators), 6 (logical argumentation — coalition mathematics), 9 (visual information — all files) | See [`political-style-guide.md` §ICD 203](political-style-guide.md#-icd-203-analytic-tradecraft-standards-mapping) |
| **SAT(s)** | Morphological (election-2026, coalition-mathematics); Outside-In Thinking (historical-parallels, voter-segmentation, media-framing); Premortem Analysis (implementation-feasibility); Indicators and Signposts (forward-indicators) | See [`political-style-guide.md` §SATs](political-style-guide.md#-structured-analytic-techniques-sats-catalog) |

---

## 🔀 Multi-cycle electoral lens

This methodology is **cycle-parameterised**. Two separate fields govern cycle-anchor semantics — they must not be conflated:

- **`electionCycleAnchor`** (`analysis/article-types.json → types[*].electionCycleAnchor`) — the article-type registry field; one of `current | next | both | none`. Set per article type and consumed by workflows to decide which anchor(s) to generate.
- **`cycleAnchor`** (`scripts/horizon-context.ts → horizonContext(typeId, articleDate).cycleAnchor`) — the *date-derived* active cycle; **only** `current | next`. Resolved at run time from `analysis/article-types.json → electionCycles` by `activeCycleAnchor(articleDate)` — returns `next` when `articleDate` falls inside the next cycle's start..end window, `current` otherwise.

### Anchor enum

| Field | Value | Meaning |
|-------|-------|---------|
| `electionCycleAnchor` (article-type registry) | `current` | Article type is anchored to the in-progress mandate cycle |
| `electionCycleAnchor` (article-type registry) | `next` | Article type is anchored to the upcoming mandate cycle |
| `electionCycleAnchor` (article-type registry) | `both` | Dual-anchor run — produces artifacts for both cycles simultaneously; used during the ±30-day rollover window |
| `electionCycleAnchor` (article-type registry) | `none` | Article type does not use an election-cycle lens (e.g., realtime-monitor on a non-electoral event) |
| `cycleAnchor` (HorizonContext, date-derived) | `current` | `articleDate` falls before the next election anchor; in-progress cycle is authoritative |
| `cycleAnchor` (HorizonContext, date-derived) | `next` | `articleDate` falls on or after the next election anchor; upcoming cycle is authoritative |

### Swedish election-cycle anchor dates

| Cycle ID | Label | Start | End |
|----------|-------|-------|-----|
| `tido-2022` | Tidö Mandate (2022–2026) | 2022-09-11 | 2026-09-13 |
| `post-2026` | Post-2026 Mandate (2026–2030) | 2026-09-13 | 2030-09-08 |
| *(future — not yet in registry)* | Post-2030 Mandate (2030–2034) | 2030-09-08 | *(TBD)* |

The authoritative cycle registry lives in `analysis/article-types.json → electionCycles`. These dates are consumed by `scripts/horizon-context.ts → activeCycleAnchor()` and must not be hardcoded in any analysis template.

### Rollover trigger

The cycle rolls over when `ARTICLE_DATE` is within **±30 days** of the next election anchor. Activation is determined by the ext module's own shell predicate (comparing `$ARTICLE_DATE` against `analysis/article-types.json → electionCycles.next.start`), **not** by `horizonContext()` — workflows do not currently call `tsx scripts/horizon-context.ts`. The pseudo-code below illustrates the logic; the authoritative implementation is in [`.github/prompts/ext/cycle-rollover.md` §1](../../.github/prompts/ext/cycle-rollover.md):

```
# Ext-module shell predicate (simplified)
DAYS_DELTA=$(( ($(date -d "$ARTICLE_DATE" +%s) - $(date -d "$ELECTION_DATE" +%s)) / 86400 ))
cycleRolloverActive = abs(DAYS_DELTA) <= 30
```

When active, the ext module applies the phased dual-anchor behaviour defined in §Cycle-rollover playbook below. It does **not** mutate `analysis/article-types.json`; `electionCycleAnchor` in the registry stays whatever the operator has set and is flipped separately (T+45 to T+60 via a CEO-approved Normal change).

---

## 📋 Cycle-rollover playbook (date-triggered)

Full procedure: [`.github/prompts/ext/cycle-rollover.md`](../../.github/prompts/ext/cycle-rollover.md). The table below is an inline summary; always defer to the ext module for the authoritative runbook.

| Rule | Detail |
|------|--------|
| **Activation window** | `ARTICLE_DATE` within ±30 days of `analysis/article-types.json → electionCycles.next.start` |
| **T-30 → T-1** | Both anchors generated; `next/` artifacts marked `[provisional pre-election]` |
| **T+0 (election day)** | Emergency single-run via `news-realtime-monitor`; no cycle flip until results are locked |
| **T+1 → T+30** | Both anchors generated; `current/` artifacts gain `# 📜 Mandate retrospective` H1; `next/` upgraded from provisional |
| **T+31 → T+45** | Only `next/` regenerated; `current/` frozen as historical record |
| **Filename rename rule** | Post-rollover, workflows write `election-cycle-analysis.md` (the cycle-agnostic name); `election-2026-analysis.md` remains a valid alias indefinitely via `FILENAME_ALIASES` in `scripts/render-lib/aggregator/order.ts`. When **both** files exist in the same folder the aggregator de-duplicates by `AGGREGATION_ORDER` — `election-2026-analysis.md` appears first in that list, so the legacy filename is preferred at render time; write only one name per run to avoid the ambiguity |
| **Carry-forward rule** | Mandate-fulfilment scorecard, KU reprimands ledger, coalition cohesion trajectory archived to `analysis/cycles/<cycle-range>/`; PIRs with `inheritsCycle: true` carry forward verbatim |
| **PIR archival rule** | Cycle-scoped PIRs receive `status: "archived"`, `archivedReason: "cycle-rollover-<election-date>"`, and a `successor` where applicable; see ext module §4 |
| **Operator flip** | Registry flip (`electionCycleAnchor` in `analysis/article-types.json`) is a **CEO-approved Normal change** under `Change_Management.md`; typically T+45 to T+60 post-election once government formation is complete |
| **Audit trail** | Every activation appends a row to `analysis/cycles/rollover-log.md`. **Note:** `analysis/cycles/` does not exist in the repo yet — operators must `mkdir -p analysis/cycles/` as part of the manual runbook (see ext module §5); automated creation is deferred to the planned `scripts/cycle-rollover.ts` |

---

## 📈 Cycle-trajectory artefact

The **24th artifact** for the `news-election-cycle` workflow is `cycle-trajectory.md`. It provides a multi-year trend assessment of Swedish political-economic trajectory across the full 4-year mandate.

- **Template:** [`analysis/templates/cycle-trajectory.md`](../../analysis/templates/cycle-trajectory.md)
- **Produced by:** `news-election-cycle` **only** — all other workflows must not write this file
- **Save path:** `analysis/daily/${ARTICLE_DATE}/election-cycle/${CYCLE_ANCHOR}/cycle-trajectory.md`
- **Blocking gate:** required by `.github/prompts/05-analysis-gate.md` § long-horizon checks
- **Content:** ICD 203 BLUF + WEP per year + horizon bands T+1y / T+2y / T+5y, combining SCB national-accounts trajectory, IMF WEO multi-vintage projections, and Riksdag throughput metrics (vote counts, committee productivity, KU reprimands)
- **Cycle-rollover rewind:** on registry flip, this file's content rewinds to a T+0 baseline (empty trajectory for the opening cycle); subsequent runs accrete evidence organically — see ext module §3.3

---

## 🎯 Purpose

Family D supplies **issue-specific analytical lenses** that sharpen every workflow across electoral cycles, voter segments, coalition arithmetic, historical echoes, the media environment, delivery questions, and forward watch-lists.

These products are **core — every run produces all 7**. The output set is stable across morning, evening, realtime, weekly, and monthly workflows. What adapts per run is item-level depth (tier L1 → L3) and the substance inside each file — not whether the file exists.

### Core — every run produces all 7

| Template | Behaviour on a light-event day | Behaviour on a P0-dense day |
|----------|-------------------------------|-----------------------------|
| `election-2026-analysis.md` (alias: `election-cycle-analysis.md`) — **Note:** the alias is filename-only; the underlying template `analysis/templates/election-2026-analysis.md` remains 2026-scoped (pre-election window 2025-10 → 2026-09) until a cycle-parameterised template lands. Post-rollover, workflows write `election-cycle-analysis.md` but the content is generated from the same template with the cycle context injected at runtime via `electionCycleAnchor`. | Seat-projection delta vs. last poll + which parties crossed the 4 % threshold; for the current cycle it tracks the campaign; for the next cycle it tracks post-election government-formation context | Full seat projection + coalition viability + campaign-phase alignment of every P0 to the active cycle; `electionCycleAnchor` (article-type registry) determines which cycle lens is applied |
| `voter-segmentation.md` | Baseline segment positions (5 axes: age, geography, education, income, incumbency) | Per-document segment impact table with ≥5 cohorts and quantified swing estimates |
| `coalition-mathematics.md` | Current seat map + pivotal-vote reference + confidence-vote arithmetic | Scenario branching: each contested vote run through Sainte-Laguë, pivotal-actor detection, SD-Tidöbloc-opposition matrix |
| `historical-parallels.md` (variant: `historical-baseline.md`) | Closest baseline precedent ≤ 40 years with similarity score, or explicit "no-precedent" finding | Full parallel with outcome, stakeholder behaviour, and Bayesian base-rate update |
| `media-framing-analysis.md` | Per-party + per-press-quadrant framing of the day's lead story, plus longitudinal-frame delta | Per-document frame audit with quoted examples and platform-by-platform amplification scores |
| `implementation-feasibility.md` | Audit of in-flight delivery backlog (IT, budget, regulatory, workforce) when no new bill lands | Full RACI + milestone + risk-register for each new delivery obligation |
| `forward-indicators.md` | ≥10 indicators across 4 horizons (72 h / week / month / election) refreshed every run | Indicators + thresholds + trigger-to-hypothesis mapping for every P0/P1 |

```mermaid
flowchart LR
    classDef core fill:#1565C0,stroke:#0D47A1,color:#FFFFFF
    classDef electoral fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    classDef historical fill:#FFF8E1,stroke:#FFC107,color:#3E2723
    classDef media fill:#F3E5F5,stroke:#7B1FA2,color:#311B92
    classDef impl fill:#E8F5E9,stroke:#4CAF50,color:#1B5E20
    classDef fwd fill:#FFF3E0,stroke:#FF9800,color:#BF360C

    T[Family A/B complete<br/>→ Family D core run]:::core

    D1[election-2026-analysis.md<br/>alias: election-cycle-analysis.md]:::electoral
    D2[voter-segmentation.md]:::electoral
    D3[coalition-mathematics.md]:::electoral
    D4[historical-parallels.md]:::historical
    D5[media-framing-analysis.md]:::media
    D6[implementation-feasibility.md]:::impl
    D7[forward-indicators.md]:::fwd

    T --> D1
    T --> D2
    T --> D3
    T --> D4
    T --> D5
    T --> D6
    T --> D7
```

---

## 🗳️ Part 1 — Current-cycle Election Analysis (`election-2026-analysis.md`)

**Filename variants:** `election-2026-implications.md` — identical structure. The cycle-agnostic alias `election-cycle-analysis.md` maps to the same canonical artifact via `FILENAME_ALIASES` in [`scripts/render-lib/aggregator/order.ts`](../../scripts/render-lib/aggregator/order.ts); when both filenames exist in a folder the aggregator de-duplicates and emits only the first-encountered name. Post-2026-rollover, workflows may write `election-cycle-analysis.md` as the generalized name; `election-2026-analysis.md` remains a permanently valid alias.

### Purpose
Translate today's policy activity into **electoral consequences** for the active-cycle Riksdag election: seat trajectories, bloc viability, mandate strength, and pre-election narrative positioning. The active cycle is determined by `cycleAnchor` from `scripts/horizon-context.ts → horizonContext()`. During the ±30-day rollover window, both current-cycle and next-cycle sections are produced (see §Cycle-rollover playbook).

### Input
- synthesis-summary.md (current events)
- Opinion polling (SIFO, Novus, Demoskop, Sentio) — use only published, dated figures
- 2018 + 2022 election results (for baseline trajectory); 2026 results once available for next-cycle analysis
- Seat-allocation rules (Sainte-Laguë modified + 4 % threshold + 12 % regional)

### Output — required structure

1. **Bloc standing table** — for Tidöavtalet (M, KD, L, SD) vs Opposition (S, V, MP, C) vs cross-bloc:
   - Current poll average · 30-day change · 90-day change · Last election
2. **Seat-projection table** — per party, showing polling-average seat translation with 4 % threshold risk flag
3. **Threshold-risk watch** — any party within ±1.0 pp of 4 %
4. **Narrative positioning** — how today's event helps / hurts each party's election narrative
5. **Mobilisation implications** — turnout implications (young-voter, first-time, non-voter)
6. **Seat-projection Mermaid** — color-coded bar by party
7. **Bloc-standing Mermaid** — color-coded stacked bar

### Required Mermaid — bloc standing

```mermaid
graph LR
    classDef tido fill:#1565C0,stroke:#0D47A1,color:#FFFFFF
    classDef opp fill:#D32F2F,stroke:#B71C1C,color:#FFFFFF
    classDef cross fill:#FFC107,stroke:#F57F17,color:#3E2723

    M[M<br/>19.1 %<br/>🟦 Tidö]:::tido
    SD[SD<br/>18.4 %<br/>🟦 Tidö]:::tido
    KD[KD<br/>4.8 %<br/>🟦 Tidö]:::tido
    L[L<br/>3.9 %<br/>⚠️ threshold]:::tido
    S[S<br/>31.2 %<br/>🟥 opposition]:::opp
    V[V<br/>7.1 %<br/>🟥 opposition]:::opp
    MP[MP<br/>4.6 %<br/>🟥 opposition]:::opp
    C[C<br/>7.3 %<br/>🟧 cross-bloc]:::cross
```

### Quality gate
- [ ] All 8 parties covered
- [ ] Threshold risk explicit for any party <5 %
- [ ] Polling averages cite ≥2 pollsters with dates
- [ ] Seat math uses Sainte-Laguë modified
- [ ] Narrative-positioning section neutral (equal depth across parties)

---

## 👥 Part 2 — Voter Segmentation (`voter-segmentation.md`)

### Purpose
Identify which **voter segments** are materially affected by today's events and how each segment's pre-existing political alignment interacts with the new signal.

### Input
- SCB demographic microdata (age × region × income × education × sector)
- Polling cross-tabs (published segment-level data only)
- Prior election turnout + vote-by-segment data (SCB Statistiska Meddelanden)

### Output — required structure

1. **Segment panel** — for each of: Young-urban (18–34, storstad), Mid-career family (35–54), Retired (65+), Rural / glesbygd, High-income (top quintile), Low-income (bottom quintile), Secondary-sector workers, Public-sector workers:
   - Current political alignment · Policy exposure to today's events · Likely response
2. **Segment-issue Mermaid** — color-coded quadrant (alignment × exposure)
3. **Mobilisation index** — which segments are most "move-able" given the current evidence
4. **Disaggregation notes** — where SCB data permits further cuts (e.g. foreign-born, women 35–44, etc.)

### Required Mermaid — segment quadrant

```mermaid
quadrantChart
    title Segment alignment vs policy exposure
    x-axis "Low policy exposure" --> "High policy exposure"
    y-axis "Left-bloc leaning" --> "Right-bloc leaning"
    quadrant-1 "High-exposure right"
    quadrant-2 "High-exposure left"
    quadrant-3 "Low-exposure left"
    quadrant-4 "Low-exposure right"
    "Young-urban 18-34": [0.72, 0.28]
    "Retired 65+": [0.65, 0.71]
    "Rural / glesbygd": [0.41, 0.68]
    "Public-sector": [0.78, 0.35]
```

### Quality gate
- [ ] ≥8 segments covered
- [ ] Every segment has SCB-cited demographic magnitude
- [ ] Segment-issue quadrant includes all covered segments
- [ ] Mobilisation index explains movability with evidence
- [ ] Privacy rule: no segment drawn to <1000 persons to avoid re-identification

#### Segment privacy threshold — rationale (binding)

The **<1000 persons** threshold is not a stylistic preference; it is a derived control rooted in three converging concerns:

1. **GDPR Article 4(1) re-identification risk.** SCB-published microdata is anonymised at the *aggregate* level. A segment drawn to fewer than ~1000 persons in a country of 10.5M can become indirectly re-identifying when crossed with a second variable (e.g., "rural drivers in Norrbotten under 35 with K-bil sport") — the cross-tabulation can collapse to a handful of households. The Article 29 Working Party Opinion 05/2014 on Anonymisation Techniques names *singling-out*, *linkability*, and *inference* as the three risks; sub-1000 micro-cells defeat all three. SCB's own micro-data publication policy follows a related minimum-cell-size principle.
2. **Statistical confidence.** For a binary outcome (e.g., "voted SD") the 95 % CI half-width at p = 0.5, n = 1000 is ±3.1 pp; at n = 500 it widens to ±4.4 pp; at n = 100 to ±9.8 pp. Below n = 1000 the segment delta is generally **smaller than the confidence interval**, meaning the analysis cannot distinguish signal from sampling noise. Reporting such a segment as a quantitative finding is innumerate.
3. **Editorial avoidance of small-group stigmatisation.** Segments drawn small enough to be re-identifiable are also drawn small enough to invite the editorial sin of using a single named individual as a stand-in for the whole group. The 1000-person floor enforces narrative restraint — talk about "rural Norrbotten residents under 35" not "Karin from Boden, 28."

**Implementation rule:** when SCB cross-tabs collapse below 1000, **collapse one axis** (e.g., merge two adjacent age bands or two neighbouring counties) until the cell count clears 1000. Document the collapse in the segment definition; never report the sub-1000 cell. If the collapsed segment is still analytically interesting at n ≥ 1000, use it; if not, drop it from the analysis.

---

## 🧮 Part 3 — Coalition Mathematics (`coalition-mathematics.md`)

### Purpose
Compute the **arithmetic of government formation, confidence, and policy coalition** — which combinations clear 175 seats, which survive a misstatement of confidence, and which emerge as issue-specific coalitions for today's vote.

### Input
- Latest Riksdag seat distribution (349 seats)
- Current government composition
- Party-platform compatibility matrix (based on voting history from `search_voteringar`)
- Today's vote results when applicable

### Output — required structure

1. **Seat-count table** — per party, current seats
2. **Majority viability matrix** — all plausible 3–5 party coalitions with seat totals, tolerance to loss of 1 party, ideological coherence score
3. **Confidence arithmetic** — who can block a confidence vote, who can trigger it
4. **Issue-specific coalitions** — for today's top 3 items, which coalition actually materialised (from voting data)
5. **Cohesion indicators** — party vote-split percentages on today's items
6. **Coalition-viability Mermaid** — color-coded by viability status

### Required Mermaid — coalition viability

```mermaid
graph TB
    classDef maj fill:#4CAF50,stroke:#1B5E20,color:#FFFFFF
    classDef min fill:#FFC107,stroke:#F57F17,color:#3E2723
    classDef blocked fill:#D32F2F,stroke:#B71C1C,color:#FFFFFF
    classDef hypo fill:#9E9E9E,stroke:#424242,color:#FFFFFF

    C1[M+SD+KD+L<br/>175 seats · current]:::maj
    C2[S+V+MP+C<br/>158 seats]:::min
    C3[S+C+MP<br/>132 seats]:::min
    C4[M+S grand coalition<br/>186 seats · hypothetical]:::hypo
    C5[M+SD only<br/>140 seats · blocked by L/KD exit]:::blocked
```

### Quality gate
- [ ] All coalitions summed to exact seat counts
- [ ] Tolerance-to-defection column filled per coalition
- [ ] Issue-specific coalitions cite `dok_id` and vote counts from `search_voteringar`

### Worked example — Sainte-Laguë modified seat allocation

Sweden uses the **modified Sainte-Laguë method** with a **4 % national threshold** and a **12 % regional threshold** (a party scoring under 4 % nationally still gets seats from a constituency where it exceeds 12 %). The first divisor for any party is **1.4** (the modification), then 3, 5, 7, 9, … The seat goes to the party with the highest quotient at each round.

Worked example using a hypothetical 11-seat constituency (Stockholm county, simplified to illustrate the algorithm):

| Party | Votes | ÷1.4 (seat 1) | ÷3 (after 1) | ÷5 (after 2) | ÷7 | ÷9 | ÷11 | Final seats |
|-------|------:|--------------:|-------------:|-------------:|---:|---:|----:|:----------:|
| S  | 90 000 | **64 286** | 30 000 | 18 000 | 12 857 | 10 000 | 8 182 | 4 |
| M  | 75 000 | **53 571** | 25 000 | 15 000 | 10 714 | — | — | 3 |
| SD | 55 000 | **39 286** | 18 333 | 11 000 | — | — | — | 2 |
| V  | 30 000 | 21 429 | 10 000 | — | — | — | — | 1 |
| MP | 12 000 | 8 571  | — | — | — | — | — | 1 |
| L  |  9 000 | 6 429  | — | — | — | — | — | 0 — under 4 %, no regional override |

**Algorithm walk-through:** Round 1: highest quotient (S ÷ 1.4 = 64 286) → S gets seat 1. Round 2: re-divide S by 3 (= 30 000); highest of all current quotients is M ÷ 1.4 = 53 571 → M gets seat 2. Round 3: re-divide M by 3; SD ÷ 1.4 = 39 286 wins → SD gets seat 3. Continue until all 11 seats are awarded.

**Key gotchas the AI must respect:**
1. **The 1.4 modifier replaces the first division for every party** — not 1.0, not 0.7. Using straight Sainte-Laguë (3-5-7-…) inflates small-party seat counts and is wrong.
2. **Threshold check happens before allocation:** parties under 4 % nationally are excluded from the divisor table unless they cleared 12 % in this specific constituency.
3. **Tied quotients** are broken by total vote count (higher wins); document the tie-break rule used in the analysis.
4. **Constituency seats vs. levelling seats (utjämningsmandat) are separate phases.** Sweden has 310 fixed constituency seats + 39 levelling seats. The first phase distributes 310 by constituency-level Sainte-Laguë; the second phase reassigns 39 to make the national distribution proportional. Always state which phase is being modelled.
5. **Sources:** seat counts from `search_voteringar` and Valmyndigheten election archives; vote totals from SCB / Valmyndigheten primary CSVs (never approximated).

A coalition-mathematics file that asserts a seat outcome without showing the Sainte-Laguë computation **fails the gate**; copy this table form (or link to a calculator script's output) and adapt the numbers.

### Quality gate (continued)
- [ ] Cohesion indicators include numeric vote-split percentages
- [ ] Hypothetical coalitions clearly labelled

---

## 📜 Part 4 — Historical Parallels (`historical-parallels.md`)

**Filename variant:** `historical-baseline.md` — identical structure.

### Purpose
Locate today's event within a **named prior episode** (≤40 years back) and learn from what happened next last time.

### Input
- Riksdag archive (`search_dokument` with historical `rm` parameters)
- SOU (Statens offentliga utredningar) archive
- Statskontoret reports when historical implementation, public-management or agency-capacity lessons are relevant
- Academic political-history references where applicable

### Output — required structure

1. **Prior-episode cards** — ≥3 named parallels; per card:
   - Name + date · Actors · Policy domain · Outcome · Duration · Source
   - Similarity score (1–10) with justification
   - Difference callouts — what is not analogous
2. **Timeline Mermaid** — color-coded timeline of prior episodes
3. **Lesson-extraction table** — which lessons transfer, which do not
4. **Base-rate note** — based on prior parallels, prior probability of each scenario outcome

### Required Mermaid — timeline

```mermaid
timeline
    title Historical parallels for today's event
    section 1990s
        1994 : Maastricht pre-accession debate
        1999 : EMU referendum prep
    section 2000s
        2003 : Euro referendum
        2008 : Financial-crisis emergency budget
    section 2010s
        2013 : RUT-expansion opposition coordination
        2018 : Post-election 134-day formation crisis
    section 2020s
        2022 : Tidöavtalet ratification
        2024 : NATO ratification package
```

### Quality gate
- [ ] ≥3 named parallels with dates and sources
- [ ] Similarity score present with justification
- [ ] Difference callouts explicit (not every lesson transfers)
- [ ] Base-rate note quantifies prior-probability observation
- [ ] Timeline Mermaid covers full spread

---

## 📢 Part 5 — Media Framing & Influence-Operations Analysis (`media-framing-analysis.md`)

### Purpose
Document the **frames** being used by each actor and major media outlet, **and the manipulation / influence-operations layer riding on top of them**, so readers can separate substantive content from strategic communication and from coordinated inauthentic behaviour. v2.1 (2026-05-01) extends v2.0 with a **founding "no-neutral-media" doctrine**: every cited outlet must appear in an Outlet Bias Audit (ownership · funding mix · board-appointment authority · documented editorial lean · Reuters Institute Trust score · PO/PON complaints · foreign-actor link), every algorithmic claim must name the platform's optimisation target, and Frame C / D are labelled **establishment / centrist-consensus** and **public-broadcaster proceduralist** respectively — never "neutral / impartial / balanced". Procedural neutrality (equal analytical depth across all 8 Riksdag parties; equal evidentiary discipline) is the only neutrality the platform claims.

### Input
- Riksdag MCP: `search_anforanden`, `search_dokument`, `get_dokument` (named-MP frame language; longitudinal frame record).
- Swedish public press: DN, SvD, Aftonbladet, Expressen, SVT, SR, TV4, Dagens ETC, Kvartal, Nyheter Idag, Samhällsnytt, Riks, regional press sample.
- International quality press for frame lineage: Reuters / AP / DPA / AFP / Politico EU / FT / NYT / Le Monde / Der Spiegel / Helsingin Sanomat / Aftenposten / Berlingske.
- State-affiliated outlets — RT/Sputnik/RIA/TASS/CGTN/PressTV — used **only** as amplification fingerprint, never as factual source.
- Public CIB / disinformation dossiers: EUvsDisinfo, EU DisinfoLab, Meta CIB removal reports, NATO StratCom COE, GLOBSEC Vulnerability Index, Reuters Institute Digital News Report, Freedom House Nations in Transit, SÄPO/MUST/FRA/EU-EEAS public statements.
- Ownership / funding data: Nordicom Media Ownership Database (gu.se), Allmänhetens Pressombudsman public registry.

### Output — required structure (v2.1)

1. **Frame package inventory** — ≥ 3 frames (A government / B opposition / C establishment / centrist-consensus / D public-broadcaster proceduralist; **Frame E foreign-overlay** ONLY when a state-affiliated or coordinated foreign-amplification signal is observed in window). Per frame: name · carrier (actor / outlet) · keyword markers · first-use date · approximate share of coverage.
2. **Entman functions per frame** — problem definition · causal attribution · moral evaluation · treatment recommendation; every cell traces to a dated quote / `dok_id` / anförande.
3. **Cognitive vulnerability map** — bias exploited (Cialdini / Kahneman / Roozenbeek-van der Linden) · mechanism · inoculation lever; primary-literature citation per row.
4. **Manipulation indicators (DISARM)** — verbatim `T####` codes (Flooding T0049, Astroturfing T0086, Distort facts T0023, Amplify existing narrative T0118, Prepare assets impersonating legitimate entities T0099, Develop AI-generated text T0085, Develop AI-generated images / deepfakes T0088, etc.); `[unconfirmed]` flag for any indicator without ≥ 2 corroborations; explicit no-signal finding when nothing observed.
5. **Narrative-laundering chain** — fringe → alt-media → politician amplification → mainstream → international, with first-observed UTC timestamps and reach estimates from public metrics; missing nodes labelled, never invented.
6. **Source ecology / Outlet Bias Audit table** — every cited outlet listed with ownership group · funding mix percentages · board-appointment authority · documented editorial lean · Reuters Institute Trust score · PO/PON complaint history · foreign-actor link. **No bias audit row = no citation.** "Neutral / impartial / balanced / objective" labels rejected. Public-service broadcasters (SVT/SR/UR) carry a licence-fee + politically-appointed-board + institutional-editorial-culture caveat; commercial quality press (DN/Bonnier, SvD/Schibsted) carry an owner-ideology + audience-demographic caveat. Source: Nordicom, Reuters Institute, PO/PON, Förvaltningsstiftelsen, EUvsDisinfo, EU-EEAS / SÄPO.
7. **CIB ABCDE block** — Actor · Behaviour · Content · Degree · Effect (Camille François 2020) populated for any state-attribution claim. Observation ≠ attribution; state-attribution requires ≥ 3 ABCDE indicators + published SÄPO/MUST/FRA/EU-EEAS/EUvsDisinfo reference.
8. **Algorithmic-amplification asymmetry** — per-platform reach asymmetry; **every row must declare the platform's optimisation target** (engagement / watch-time / retention / ad-yield) and cite a documented partisan/emotional asymmetry (Huszár et al. 2022 PNAS for X; Rathje, Van Bavel & van der Linden 2021 for Facebook outrage-amplification; TikTok DSA transparency report; Ribeiro et al. 2020 / Hosseinmardi et al. 2024 for YouTube; NATO StratCom COE 2023 for Telegram). **There is no neutral algorithm** — uncited "the algorithm shows X" rejected at Pass 2.
9. **Comparative-international frame lineage** — ≥ 2 cognates traced to prior jurisdictions (FR 2011 Camus replacement frame, HU 2010 Fidesz elite-vs-people, RU 2014 firehose, PL 2015 PiS courts-vs-democracy, IT 2018 Lega/M5S, US 2017 alt-right, IL 2023 judicial reform, MAGA 2016/2020/2024). "No international cognate" for a major story is suspicious and triggers re-do.
10. **Strategic-doctrine detection** — match to public-doctrine catalogue (firehose-of-falsehood RAND PE-198 · doppelganger EU DisinfoLab 2022 · gish gallop · reflexive control · active-measures spillover NATO StratCom · interest-group capture · MAGA cognate populism). Detection ≠ attribution; ≥ MODERATE confidence floor for any 🟧/🟥 verdict.
11. **Frame lifecycle / longevity** — phase (rising / peak / decay / sleeper / zombie) · half-life days · zombie probability · reactivation trigger; xychart-beta horizon block over 8+ points (T-7d / T-3d / Today / T+3d / T+7d / T+14d / T+30d / T+90d).
12. **RRPA impact conversion** — Reach × Resonance × Persistence × Action with ≥ 1 dated action indicator per frame (poll move, petition signatures, donation flows, demonstration permit) or `[no action signal yet]`.
13. **Counter-resilience plan (L1–L5)** — prebunking · just-in-time inoculation · lateral-reading prompt · debunking truth-sandwich · algorithmic-friction / DSA Art. 40 escalation; per-frame layer assignment with rationale. Platform reports the ladder, never executes counter-framing.
14. **Forward watchlist** — ≥ 5 dated triggers with WEP band + Admiralty grade.
15. **Longitudinal frame record** — append today's snapshot so future runs can detect zombie reactivations.

### Required Mermaid — frame competition (with foreign-overlay tier when applicable)

```mermaid
graph LR
    classDef gov fill:#1565C0,stroke:#0D47A1,color:#FFFFFF
    classDef opp fill:#D32F2F,stroke:#B71C1C,color:#FFFFFF
    classDef establishment fill:#FFC107,stroke:#F57F17,color:#3E2723
    classDef proceduralist fill:#7B1FA2,stroke:#4A148C,color:#FFFFFF
    classDef foreign fill:#212121,stroke:#000000,color:#FFFFFF

    F1[Government frame<br/>'fiscal responsibility'<br/>dominant]:::gov
    F2[Opposition frame<br/>'welfare erosion']:::opp
    F3[Establishment / centrist-consensus frame<br/>'expert-led fiscal'<br/>moderate<br/>NOT 'neutral' — Bonnier/Schibsted owner ideology +<br/>centrist-urban audience documented]:::establishment
    F4[Public-broadcaster proceduralist frame<br/>'institutional remit framing'<br/>NOT 'impartial' — politically-appointed board +<br/>documented editorial culture]:::proceduralist
    F5[Foreign-overlay frame<br/>'NATO trap'<br/>state-affiliated amplification<br/>⚠️ only if observed]:::foreign

    F1 -.contests.- F2
    F3 -.synthesises.- F1
    F3 -.synthesises.- F2
    F4 -.emergent.- F1
    F5 -.amplifies.- F2
```

### Quality gate (v2.1)

- [ ] **Founding "no-neutral-media" doctrine honoured** — no outlet, algorithm, or broadcaster labelled "neutral / impartial / unbiased / balanced / objective" in the body without ≥ 1 documented-bias citation in the same paragraph.
- [ ] **Outlet Bias Audit populated for every cited outlet** — ownership group · funding mix · board-appointment authority · documented editorial lean · Reuters Institute Trust score · PO/PON complaint history · foreign-actor link. No bias audit row = no citation.
- [ ] **Public-service broadcaster caveat present** — every reliance on SVT / SR / UR / BBC / ARD / NRK / DR / YLE carries the licence-fee + politically-appointed-board + institutional-editorial-culture caveat.
- [ ] **Algorithmic-asymmetry rows declare optimisation target** — every platform row names the objective function and cites a documented partisan/emotional asymmetry.
- [ ] **Frame C / D label discipline** — "establishment / centrist-consensus" and "public-broadcaster proceduralist" respectively, never "neutral / analytical / impartial".
- [ ] ≥ 3 frames identified with keyword markers AND Entman 4-function decomposition.
- [ ] Cognitive-vulnerability map cites primary literature per row.
- [ ] DISARM TTP map populated with verbatim `T####` codes OR explicit no-signal finding.
- [ ] Narrative-laundering chain produced or absence justified by node-by-node inspection.
- [ ] CIB ABCDE block produced for any state-attribution claim; observation ≠ attribution discipline applied.
- [ ] Comparative-international frame lineage lists ≥ 2 cognates with year, jurisdiction, and source.
- [ ] Strategic-doctrine detection table executed (Yes/No per row).
- [ ] Frame Lifecycle / Longevity table + xychart-beta with ≥ 8 horizon points.
- [ ] RRPA composite per frame with ≥ 1 dated action indicator or honest `[no action signal yet]`.
- [ ] Counter-resilience layer mapping (L1–L5) per frame with rationale; **procedural neutrality** preserved (equal analytical depth across all 8 Riksdag parties; equal evidentiary discipline; full ownership/funding/lean disclosure) — never claimed as "neutral truth" or "neutral source".
- [ ] Forward watchlist ≥ 5 dated triggers with WEP and Admiralty grades.
- [ ] Frame E discipline: included only with observed signal; otherwise marked absent explicitly.

---

## 🛠️ Part 6 — Implementation Feasibility (`implementation-feasibility.md`)

### Purpose
Assess whether a proposed policy can **actually be delivered** given constitutional, legal, administrative, financial, and operational constraints.

### Input
- The target `dok_id` and its implementing-agency identification
- Myndighet (government agency) capacity indicators — staffing, budget, prior delivery record
- Riksrevisionen prior audits of the same agency / policy area
- EU-law and ECHR compatibility constraints

### Output — required structure

1. **Delivery-path table** — which agency owns delivery, legal basis, budget source, first-effect date, steady-state date
2. **Feasibility scorecard** — five dimensions × 0–10 score × evidence × confidence:
   - Legal feasibility · Administrative feasibility · Financial feasibility · Political feasibility · Operational feasibility
3. **Risk register** — ≥5 delivery risks, each with likelihood × impact × mitigation
4. **Capacity gap analysis** — staffing, IT, legal, training gaps identified
5. **Historical-delivery comparison** — against a prior similar policy (e.g. RUT, ROT, A-kassa reform)
6. **Feasibility Mermaid** — color-coded scorecard bar

### Required Mermaid — feasibility scorecard

```mermaid
graph TB
    classDef high fill:#4CAF50,stroke:#1B5E20,color:#FFFFFF
    classDef med fill:#FFC107,stroke:#F57F17,color:#3E2723
    classDef low fill:#FF9800,stroke:#E65100,color:#FFFFFF
    classDef crit fill:#D32F2F,stroke:#B71C1C,color:#FFFFFF

    Legal[Legal feasibility<br/>8/10<br/>🟩 HIGH]:::high
    Admin[Administrative feasibility<br/>5/10<br/>🟧 MEDIUM]:::med
    Fin[Financial feasibility<br/>7/10<br/>🟩 HIGH]:::high
    Pol[Political feasibility<br/>4/10<br/>🟥 LOW]:::low
    Ops[Operational feasibility<br/>3/10<br/>⬛ VERY LOW<br/>bottleneck]:::crit
```

### Quality gate
- [ ] Delivery-path table identifies a specific myndighet
- [ ] Scorecard scores are evidenced, not asserted
- [ ] Risk register ≥5 rows with mitigations
- [ ] Capacity-gap analysis quantified (FTEs, SEK, or time)
- [ ] Historical-delivery comparison present with sources

---

## 🔭 Part 7 — Forward Indicators (`forward-indicators.md`)

### Purpose
Pre-register **observable indicators** whose materialisation (or non-materialisation) will confirm or refute the current intelligence picture. This file is the platform's honesty mechanism — tomorrow's reality checks today's analysis.

### Input
- synthesis-summary.md · scenario-analysis.md · intelligence-assessment.md
- Committee calendars (motionstider, utskottsmöten) from Riksdag calendar
- Known government decision points over next 7 / 30 / 90 / 180 days

### Output — required structure

1. **Indicator table** — ≥10 indicators; per row:
   - Indicator · Horizon (7d / 30d / 90d / 180d) · Observation method · Trigger threshold · Confirms/refutes hypothesis · Confidence in prediction
2. **Time-horizon Mermaid** — Gantt / timeline of expected signal dates
3. **Hypothesis-mapping table** — which indicator maps to which ACH hypothesis from `devils-advocate.md`
4. **Null-hypothesis indicators** — ≥3 indicators whose non-appearance carries signal
5. **Reliability-of-prediction note** — how well previous forward-indicators files have scored (scoring is automated across runs)

### Required Mermaid — forward timeline

```mermaid
gantt
    dateFormat YYYY-MM-DD
    title Forward indicators — next 180 days
    section 7-day
    Committee vote on prop 108 :crit, a1, 2026-04-22, 3d
    Opposition response filing  :a2, 2026-04-24, 4d
    section 30-day
    Myndighet report deadline   :b1, 2026-05-05, 7d
    Coalition meeting signal    :b2, 2026-05-10, 3d
    section 90-day
    Budget motion window open   :c1, 2026-06-15, 14d
    section 180-day
    Pre-election kickoff        :milestone, 2026-10-01, 1d
```

### Quality gate
- [ ] ≥10 indicators across all four horizons
- [ ] Every indicator has an observation method (named source)
- [ ] Observation thresholds are concrete (numeric or named event)
- [ ] Null-hypothesis indicators present
- [ ] Hypothesis mapping links back to devils-advocate.md

---

## 🛠️ Production Workflow — step-by-step

```mermaid
flowchart TD
    classDef core fill:#1565C0,stroke:#0D47A1,color:#FFFFFF
    classDef step fill:#E8F5E9,stroke:#4CAF50,color:#1B5E20
    classDef gate fill:#FFF8E1,stroke:#FFC107,color:#3E2723
    classDef out fill:#F3E5F5,stroke:#7B1FA2,color:#311B92

    TC[Family A + B complete<br/>→ produce all 7 Family D files]:::core

    E1["election-2026-analysis<br/>(alias: election-cycle-analysis)"]:::step
    E2[voter-segmentation]:::step
    E3[coalition-mathematics]:::step
    H[historical-parallels]:::step
    MF[media-framing-analysis]:::step
    IF[implementation-feasibility]:::step
    FI[forward-indicators]:::step

    G{Quality-gate<br/>per-template}:::gate
    O[Family D complete]:::out

    TC --> E1
    TC --> E2
    TC --> E3
    TC --> H
    TC --> MF
    TC --> IF
    TC --> FI

    E1 --> G
    E2 --> G
    E3 --> G
    H --> G
    MF --> G
    IF --> G
    FI --> G
    G -->|pass| O
    G -->|fail| TC
```

---

## ✅ Family-D Completion Checklist

- [ ] All 7 Family D templates produced this run
- [ ] All 8 parties covered where applicable
- [ ] Polling, seat-math, and coalition-math use verifiable primary data
- [ ] Historical parallels have similarity scores and difference callouts (or an explicit "no-precedent" finding with reasoning)
- [ ] Media frames covered with equal depth across government/opposition
- [ ] Implementation feasibility names a delivery agency
- [ ] Forward indicators include null-hypothesis observations and ≥10 total
- [ ] All outputs use canonical color palette and 5-level confidence scale
- [ ] GDPR data-minimisation observed in voter-segmentation (no sub-1000 cohorts)

---

## 🔗 Template bindings

| Template | Methodology section | Cycle anchor |
|----------|--------------------|--------------|
| `analysis/templates/election-2026-analysis.md` — one template. **Pre-rollover** workflows write `election-2026-analysis.md`; **post-rollover** workflows write `election-cycle-analysis.md`. Both map to the same artifact via `FILENAME_ALIASES` in `scripts/render-lib/aggregator/order.ts`; when both exist the aggregator prefers `election-2026-analysis.md` (first in `AGGREGATION_ORDER`) — write only one name per run. | Part 1 above | `electionCycleAnchor` (article-type registry) |
| `analysis/templates/voter-segmentation.md` | Part 2 above | any |
| `analysis/templates/coalition-mathematics.md` | Part 3 above | any |
| `analysis/templates/historical-parallels.md` | Part 4 above | any |
| `analysis/templates/media-framing-analysis.md` | Part 5 above | any |
| `analysis/templates/implementation-feasibility.md` | Part 6 above | any |
| `analysis/templates/forward-indicators.md` | Part 7 above | any |
| `analysis/templates/cycle-trajectory.md` | §Cycle-trajectory artefact above | `current` or `next` |

---

## 📐 Cross-references to other methodology layers

- **Upstream:** [synthesis-methodology.md](./synthesis-methodology.md) (Family A)
- **Parallel:** [strategic-extensions-methodology.md](./strategic-extensions-methodology.md) (Family C)
- **Frameworks:** [political-swot-framework.md](./political-swot-framework.md) · [political-risk-methodology.md](./political-risk-methodology.md)
- **Style:** [political-style-guide.md](./political-style-guide.md)
- **Master protocol:** [ai-driven-analysis-guide.md](./ai-driven-analysis-guide.md)
- **Cycle rollover:** [`.github/prompts/ext/cycle-rollover.md`](../../.github/prompts/ext/cycle-rollover.md) — activation predicate, rename procedure, carry-forward rules, PIR archival
- **Cycle-trajectory template:** [`analysis/templates/cycle-trajectory.md`](../../analysis/templates/cycle-trajectory.md) — 24th artifact for `news-election-cycle`
- **Cycle anchor runtime:** [`scripts/horizon-context.ts`](../../scripts/horizon-context.ts) — `horizonContext()`, `activeCycleAnchor()`, `cycleRolloverActive`

---

## 🔐 ISMS Alignment

| Control | How this methodology satisfies it |
|---------|----------------------------------|
| ISO 27001 A.5.23 + A.5.34 | Voter-segmentation respects GDPR Art. 9 (political-opinion data) + re-identification threshold |
| ISO 27001 A.5.7 | Forward-indicators constitutes structured threat-intelligence horizon |
| NIST CSF ID.RA-6 (Risk responses) | Implementation-feasibility lists mitigations |
| NIST CSF DE.CM-8 | Forward indicators = continuous monitoring definition |
| CIS 17.3 (Policy reviews) | Historical-parallels maps prior policy cycles |
| GDPR Art. 9(2)(e)/(g) | Political-opinion data processed on public-interest basis |
| NIS2 Art. 21 | Implementation-feasibility considers resilience |

---

## 📄 Document Control

**Owner:** CEO (Intelligence Program) · **Reviewer:** CISO + Chief Analyst · **Review Cycle:** Quarterly
**Next Review:** 2026-07-21 · **Related:** [ai-driven-analysis-guide.md](./ai-driven-analysis-guide.md), [strategic-extensions-methodology.md](./strategic-extensions-methodology.md), [synthesis-methodology.md](./synthesis-methodology.md)

---

*Generated following Riksdagsmonitor Electoral & Domain Methodology v1.4 — Family D Lens-Specific Layer.*
