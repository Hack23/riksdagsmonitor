---
date: 2026-05-31
subfolder: year-ahead
slug: 2026-05-31-year-ahead
source_folder: analysis/daily/2026-05-31/year-ahead
generated_at: 2026-07-08T15:25:49.142Z
language: en
layout: article
---
## What Happened
<!-- source: executive-brief.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/executive-brief.md -->

**Analytic confidence**: MEDIUM-HIGH · **Tier**: C (comprehensive, 2.0× depth)

### Lede
The next twelve months of Swedish politics will be governed by one fixed anchor — the **13 September 2026 general election** [horizon:election] — and three contested legislative axes already visible in the late-May 2026 pipeline: migration (`HD01SfU35` new reception law; `Riksdag document #024194 (HD024194)` citizenship transition), criminal justice (`HD01JuU37` young offenders), and the welfare/fiscal settlement (`HD10526` equalisation; `HD10524` a-kassa; `HD01SoU32` municipal care). It is **very likely** [horizon:year] that migration and law-and-order continue to set the campaign agenda and structure government-bloc cohesion, while the equalisation–welfare cluster becomes the principal opposition counter-offensive. Macro conditions are a tailwind: the pinned IMF WEO Apr-2026 vintage projects Swedish GDP growth near 2.1% (`T+1`) and gross debt near 34% of GDP (`T+1`), giving fiscal room that lowers the **likely** [horizon:year] salience of austerity framing. The dominant uncertainty is not *which* issues but *whether* the four-party government bloc holds discipline through a differentiating campaign — a **roughly even** [horizon:cycle] question past the election anchor.

### Decisions

| # | Decision / watch item | Owner | Trigger | Horizon |
|---|----------------------|-------|---------|---------|
| D1 | Track government-bloc cohesion on the migration package (`HD01SfU35`, `HD024194`) as the primary stability signal | Intelligence desk | Next contested chamber vote | `T+1` [horizon:month] |
| D2 | Watch BP27 (autumn Budget Bill) for AP-fund mandate (`HD03130`), welfare grants (`HD01SoU32`) and equalisation response (`HD10526`) | Fiscal analyst | BP27 tabling ~Sep 2026 | [horizon:quarter] |
| D3 | Monitor SCB AKU labour prints against a-kassa salience (`HD10524`); a deterioration shifts the campaign frame | Economic desk | Monthly AKU release | [horizon:quarter] |
| D4 | Re-baseline coalition mathematics the week after 2026-09-13 results | Coverage lead | Election result | [horizon:election] |
| D5 | Maintain quarter-ahead bridge coverage to close the missing 90-day predecessor gap | Editorial | Next quarter-ahead run | [horizon:quarter] |

### Why now

The corpus is dated 2026-05-29 — the closing weeks of the 2025/26 Riksmöte, when committees clear contested betänkanden before summer recess. This is the last full legislative window before the campaign dominates the autumn, making the late-May pipeline an unusually clean read on the issues parties have chosen to carry into the vote.

```mermaid
flowchart LR
  A[Late-May 2026 pipeline] --> B{Three contested axes}
  B --> C[Migration: HD01SfU35 / HD024194]
  B --> D[Crime: HD01JuU37]
  B --> E[Welfare-fiscal: HD10526 / HD10524 / HD01SoU32]
  C --> F[Election 2026-09-13]
  D --> F
  E --> F
  F --> G[Post-election coalition re-baseline]
  style F fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
  style B fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style G fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

**Bottom line**: a low-drama macro backdrop frees the campaign to be fought almost entirely on migration, crime and welfare-delivery competence — terrain the government bloc chose and the opposition must contest on fiscal-fairness grounds.

> Evidence base: 10 curated documents (`data-download-manifest.md`); IMF WEO Apr-2026 vintage pin (live fetch degraded — see `mcp-reliability-audit.md`); cross-horizon baselines from `analysis/daily/2026-05-27/year-ahead/` and `analysis/daily/2026-05-28/monthly-review/`.

### Pass-2 refinement

Pass-2 sharpens the decision relevance for a reader/editor: the one number to watch is the **June 2026 pre-recess cohesion read** (indicators I1–I4). A cohesive sweep on `HD01SfU35`/`HD024194` confirms the modal S1 path and the "strong but constrained incumbent" headline; a single `Avstår`/defection signal is the earliest leading indicator that the S3 fracture branch is activating and the headline should pivot to coalition-fragility framing.

## Reader Intelligence Guide

Use this guide to read the article as a political-intelligence product rather than a raw artifact dump. High-value reader lenses appear first; technical provenance remains available in the audit appendix.

| Icon | Reader need | What you'll get |
|---|---|---|
| 📊 | [Lede and editorial decisions](#rm-what-happened) | fast answer to what happened, why it matters, who is accountable, and the next dated trigger |
| 🧠 | [Why It Matters](#rm-why-it-matters) | evidence-anchored narrative consolidating primary sources into one coherent story line |
| 🎯 | [Key Judgments](#rm-key-findings) | confidence-bearing political-intelligence conclusions and collection gaps |
| 📈 | [Significance scoring](#rm-significance-scoring) | why this story outranks or trails other same-day parliamentary signals |
| 👥 | [Stakeholder Perspectives](#rm-stakeholder-perspectives) | winners, losers and undecided actors with stake-weighted positions and pressure points |
| 🔢 | [Coalition Mathematics](#rm-coalition-mathematics) | parliamentary arithmetic showing exactly who can pass or block this measure and at what margin |
| 📋 | [Voter Segmentation](#rm-voter-segmentation) | voter-bloc exposure: which demographics gain, lose or shift on this issue |
| 🔭 | [Forward indicators](#rm-forward-indicators) | dated watch items that let readers verify or falsify the assessment later |
| 🔮 | [Scenarios](#rm-scenario-analysis) | alternative outcomes with probabilities, triggers, and warning signs |
| 🗳️ | [Election 2026 Analysis](#rm-election-2026-analysis) | electoral implications for the 2026 cycle — seats at stake, swing voters and coalition viability |
| ⚠️ | [Risk assessment](#rm-risk-assessment) | policy, electoral, institutional, communications, and implementation risk register |
| 🧮 | [SWOT Analysis](#rm-swot-analysis) | strengths, weaknesses, opportunities and threats matrix grounded in primary-source evidence |
| 📝 | [Quantitative SWOT](#rm-quantitative-swot) | weighted, scored SWOT register with explicit confidence ratings and decision implications |
| 🛡️ | [Threat Analysis](#rm-threat-analysis) | actor capabilities, intent and threat vectors targeting institutional integrity |
| 📝 | [Wildcards & Black Swans](#rm-wildcards--black-swans) | low-probability, high-impact disruptive events that could derail the base-case forecast |
| 📝 | [PESTLE Analysis](#rm-pestle-analysis) | political, economic, social, technological, legal and environmental drivers shaping the outcome |
| 📜 | [Historical Parallels](#rm-historical-parallels) | comparable past episodes from Swedish and international politics, with explicit lessons learned |
| 🌍 | [Comparative International](#rm-comparative-international) | peer-country comparisons (Nordic, EU, OECD) showing how similar measures fared elsewhere |
| ⚙️ | [Implementation Feasibility](#rm-implementation-feasibility) | delivery feasibility, capability gaps, timelines and execution risks for the proposed action |
| 📰 | [Media framing & influence operations](#rm-media-framing-analysis) | frame packages with Entman functions, cognitive-vulnerability map, DISARM manipulation indicators, narrative-laundering chain, comparative-international cognates, frame lifecycle and half-life, RRPA impact, an Outlet Bias Audit (no outlet is neutral — every outlet declared with ownership, funding, board-appointment authority and editorial lean), and the L1–L5 counter-resilience ladder |
| 😈 | [Devil's Advocate](#rm-devils-advocate) | alternative hypotheses, steel-manned counter-arguments and the strongest case against the lead reading |
| 🏷️ | [Deep Dive: Classification Results](#rm-deep-dive-classification-results) | ISMS data classification: CIA-triad rating, RTO/RPO targets and handling instructions |
| 🔀 | [Deep Dive: Cross-Reference Map](#rm-deep-dive-cross-reference-map) | links to related Riksdagsmonitor coverage, prior analyses and source documents that inform this story |
| 🔬 | [Deep Dive: Methodology & Limitations](#rm-deep-dive-methodology--limitations) | analytical assumptions, limitations, known biases and where the assessment could be wrong |
| 📦 | [Deep Dive: Data Download Manifest](#rm-deep-dive-data-download-manifest) | machine-readable manifest of every source dataset, retrieval timestamp and provenance hash |
| 📝 | [Analysis Index](#rm-analysis-index) | supporting analytical lens with primary-source evidence and audit-traceable citations |
| 📝 | [Mcp Reliability Audit](#rm-mcp-reliability-audit) | supporting analytical lens with primary-source evidence and audit-traceable citations |
| 📝 | [Reference Analysis Quality](#rm-reference-analysis-quality) | supporting analytical lens with primary-source evidence and audit-traceable citations |
| 📝 | [Workflow Audit](#rm-workflow-audit) | supporting analytical lens with primary-source evidence and audit-traceable citations |
| 📑 | [Per-document intelligence](#rm-per-document-intelligence) | dok_id-level evidence, named actors, dates, and primary-source traceability |
| 🏷️ | [Audit appendix](#rm-deep-dive-classification-results) | classification, cross-reference, methodology and manifest evidence for reviewers |

## Why It Matters
<!-- source: synthesis-summary.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/synthesis-summary.md -->

### Core synthesis

The late-May 2026 legislative corpus resolves into a single strategic picture: a pre-election year [horizon:election] whose agenda is **very likely** [horizon:year] to be dominated by migration and criminal-justice files the government bloc has deliberately advanced, contested by an opposition pressing on welfare delivery and fiscal fairness. The standing pipeline — `HD01SfU35` (new reception law), `HD024194` (citizenship transition), `HD01JuU37` (young offenders), against `HD10526` (equalisation), `HD10524` (a-kassa) and `HD01SoU32` (municipal health) — maps the campaign cleavage structure with unusual clarity.

Macro conditions are a stabiliser, not a driver. On the pinned IMF WEO Apr-2026 vintage, Swedish real GDP growth is projected near 2.1% (`T+1`) and 2.4% (`T+2`), gross general-government debt near 34% of GDP (`T+1`) — among the lowest in the EU — and inflation easing toward target. This fiscal headroom makes austerity framing **unlikely** [horizon:year] to gain traction and lets distributive choices (equalisation, welfare grants) carry the economic debate.

### Five synthesis judgments

1. **Agenda lock-in.** Migration + crime **very likely** [horizon:year] remain top-3 campaign themes; the government chose this terrain and the data confirms continued legislative investment (`HD01SfU35`, `HD01JuU37`, `HD024194`).
2. **Cohesion is the variable.** Government-bloc discipline through a differentiation-rewarding campaign is **roughly even** [horizon:cycle] — the central post-election uncertainty.
3. **Opposition pivot.** The equalisation–welfare cluster (`HD10526`, `HD01SoU32`, `HD01UbU25`) is **likely** [horizon:year] to become the opposition's primary counter-frame on fiscal-fairness grounds.
4. **Two-track Riksdag.** Consensual EU-implementation files (`HD01JuU33`, `HD01UU10`) proceed on broad majorities even as domestic wedges polarise — a structural feature, not noise.
5. **Macro tailwind.** Low debt and steady growth (IMF WEO Apr-2026, `T+1`/`T+2`) make a fiscal-crisis narrative **very unlikely** [horizon:year], shifting economic debate to distribution.

```mermaid
flowchart TD
  P[Late-May 2026 pipeline] --> M[Migration axis]
  P --> J[Crime axis]
  P --> W[Welfare-fiscal axis]
  M --> AG[Campaign agenda]
  J --> AG
  W --> OP[Opposition counter-frame]
  AG --> EL[Election 2026-09-13]
  OP --> EL
  EL --> CO{Bloc cohesion?}
  CO -->|holds| S1[Continuity government]
  CO -->|fractures| S2[Reconfiguration]
  style EL fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
  style CO fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style P fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

### Linkages
- Scenarios quantify the cohesion question → `scenario-analysis.md`
- Coalition arithmetic → `coalition-mathematics.md`
- Macro vintage handling → `comparative-international.md`, `data-download-manifest.md`
- Forward triggers → `forward-indicators.md`

### Pass-2 refinement

Pass-2 distils the one-paragraph thesis: Sweden enters its 2026 campaign year with an incumbent bloc that is fiscally strong (IMF WEO Apr-2026: growth ~2.1% `T+1`, debt ~34% GDP), agenda-advantaged on security, but arithmetically thin (~176 Mandat) and values-strained on its own migration/citizenship files. The modal path is **continuity** [horizon:election]; the live break is **internal fracture**, not opposition surge; and the earliest tell is the June pre-recess cohesion read on `HD01SfU35`/`HD024194`.

## Key Findings
<!-- source: intelligence-assessment.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/intelligence-assessment.md -->

### Key Judgments

**KJ-1 — Agenda continuity.** Migration and criminal-justice files (`HD01SfU35`, `HD01JuU37`, `HD024194`) **very likely** [horizon:year] remain the campaign's defining axis through 2026-09-13. **Confidence: HIGH** — strong, consistent evidentiary base across the corpus and predecessors.

**KJ-2 — Cohesion is the decisive variable.** Government-bloc discipline through a differentiation-rewarding campaign is the single most consequential uncertainty; we judge it **roughly even** [horizon:cycle] past the election anchor. **Confidence: MEDIUM** — competing structural incentives, limited forward visibility.

**KJ-3 — Opposition contests on competence, not values.** The S-led opposition **likely** [horizon:year] centres equalisation and welfare delivery (`HD10526`, `HD01SoU32`) rather than re-litigating migration. **Confidence: MEDIUM** — consistent with positioning logic and predecessor trend.

**KJ-4 — Macro is a non-event.** A fiscal-crisis narrative is **very unlikely** [horizon:year]; IMF WEO Apr-2026 growth ~2.1% (`T+1`) and debt ~34% of GDP (`T+1`) remove austerity as a live wedge. **Confidence: MEDIUM-HIGH** — robust on pinned vintage, caveated by live-fetch degradation (`mcp-reliability-audit.md`).

**KJ-5 — Two-track Riksdag persists.** Consensual EU-implementation (`HD01JuU33`, `HD01UU10`) proceeds on broad majorities even amid domestic polarisation. **Confidence: HIGH** — structural regularity.

### Priority Intelligence Requirements

- **PIR-COHESION-2026** — Will the government bloc maintain voting cohesion on contested migration/citizenship files through recess and into the campaign? *(open)* → indicators in `forward-indicators.md`.
- **PIR-LABOUR-MACRO-2026** — Does the labour market soften enough (SCB AKU) to reframe the campaign onto economics? *(open)*
- **PIR-EQUALISATION-2026** — Does the equalisation grievance (`HD10526`) consolidate into a rural electoral bloc? *(open)*
- **PIR-DELIVERY-2026** — Do agency capacity gaps produce visible crime/welfare delivery failures? *(open)*

### Prior-cycle PIR ingestion (Tier-C)

**Carried-forward** from the predecessor year-ahead run (`analysis/daily/2026-05-27/year-ahead/`): the **Prior-cycle** PIR on bloc-cohesion remains the dominant open requirement — status unchanged (open), confidence steady at MEDIUM. The **Previous PIR** on macro reframing is rolled forward as PIR-LABOUR-MACRO-2026 with no new disconfirming evidence. No prior PIR is answered or superseded this cycle; see `pir-status.json` for the machine-readable roll-forward.

### Confidence summary

| Judgment | Confidence | Driver |
|----------|-----------|--------|
| KJ-1 agenda continuity | HIGH | corpus + predecessor consistency |
| KJ-2 cohesion variable | MEDIUM | competing incentives |
| KJ-3 opposition frame | MEDIUM | positioning logic |
| KJ-4 macro non-event | MEDIUM-HIGH | IMF vintage (degraded live) |
| KJ-5 two-track Riksdag | HIGH | structural regularity |

**Collection priority**: PIR-COHESION-2026 is the highest-value requirement; its answer most strongly discriminates `scenario-analysis.md` S1 vs S3.

### Pass-2 refinement

Pass-2 adds an analysis-of-competing-hypotheses note to KJ-3: the macro-tailwind judgement rests on a pinned IMF vintage (live degraded), so it carries a structural fragility the other judgements do not. If the July labour print (I5) diverges materially from the ~8.3% `T+1` baseline, KJ-3 should be downgraded before the others. This dependency is why PIR-LABOUR-MACRO-2026 is ranked second despite a lower base probability than the cohesion question.

## Significance Scoring
<!-- source: significance-scoring.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/significance-scoring.md -->

### Ranked items

1. **`HD01SfU35` — New reception law (mottagandelag)** — score **9.6** (1.5× applied). Highest-valence cleavage; structures bloc cohesion. Source: https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/_HD01SfU35/
2. **`HD024194` — Citizenship transitional rules** — score **9.0** (1.5×). Identity-salient, recurring flashpoint. dok_id `HD024194`.
3. **`HD01JuU37` — Young offenders investigation powers** — score **8.7** (1.5×). Core law-and-order mobiliser. dok_id `HD01JuU37`.
4. **`HD10526` — Reformed equalisation system** — score **8.1** (1.5×). Centre–periphery fiscal wedge; opposition lever. dok_id `HD10526`.
5. **`HD10524` — Changed unemployment insurance** — score **7.4** (1.5×). Labour-market cleavage, macro-sensitive. dok_id `HD10524`.
6. **`HD01SoU32` — Municipal medical competence** — score **6.8**. Welfare-delivery competence, ageing electorate. dok_id `HD01SoU32`.
7. **`HD03130` — AP-fund accounting 2025** — score **6.0**. Pension-system buffer; structural fiscal anchor. dok_id `HD03130`.
8. **`HD01UbU25` — Teaching-time** — score **5.6**. Education quality, teacher attrition. dok_id `HD01UbU25`.
9. **`HD01UU10` — EU activity 2025** — score **5.2**. External posture, defence trajectory. dok_id `HD01UU10`.
10. **`HD01JuU33` — Cross-border e-evidence** — score **4.4**. Consensual EU implementation; low campaign salience. dok_id `HD01JuU33`.

### Scoring table

| Rank | dok_id | Salience | Cleavage | Impl. load | Durability | Pre-election × | Weighted |
|-----:|--------|---------:|---------:|-----------:|-----------:|:--------------:|---------:|
| 1 | `HD01SfU35` | 5 | 5 | 4 | 5 | 1.5 | 9.6 |
| 2 | `HD024194` | 5 | 5 | 3 | 4 | 1.5 | 9.0 |
| 3 | `HD01JuU37` | 5 | 4 | 4 | 4 | 1.5 | 8.7 |
| 4 | `HD10526` | 4 | 5 | 4 | 4 | 1.5 | 8.1 |
| 5 | `HD10524` | 4 | 4 | 3 | 4 | 1.5 | 7.4 |
| 6 | `HD01SoU32` | 4 | 3 | 4 | 4 | 1.0 | 6.8 |
| 7 | `HD03130` | 3 | 2 | 2 | 5 | 1.0 | 6.0 |
| 8 | `HD01UbU25` | 3 | 3 | 3 | 4 | 1.0 | 5.6 |
| 9 | `HD01UU10` | 3 | 3 | 2 | 4 | 1.0 | 5.2 |
| 10 | `HD01JuU33` | 2 | 2 | 3 | 4 | 1.0 | 4.4 |

```mermaid
flowchart TD
  R1["HD01SfU35 reception law 9.6"] --> TIER1[Tier 1 campaign-defining]
  R2["HD024194 citizenship 9.0"] --> TIER1
  R3["HD01JuU37 young offenders 8.7"] --> TIER1
  R4["HD10526 equalisation 8.1"] --> TIER2[Tier 2 opposition levers]
  R5["HD10524 a-kassa 7.4"] --> TIER2
  R6["HD01SoU32 municipal care 6.8"] --> TIER2
  R10["HD01JuU33 e-evidence 4.4"] --> TIER3[Tier 3 consensual]
  style TIER1 fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
  style TIER2 fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style TIER3 fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

**Interpretation**: Tiers 1–2 (`HD01SfU35`…`HD01SoU32`) define the campaign battlespace; the 1.5× multiplier elevates contested migration/crime/fiscal files above the consensual EU track.

### Pass-2 refinement

Pass-2 audits the multiplier application for double-counting: the 1.5× election-proximity factor is applied uniformly to all 10 files (it reflects the *timing*, not the *content*), so it does not distort the *relative* ranking — `HD01SfU35` outranks `HD01UU10` on intrinsic contestation before and after the multiplier. The multiplier's only effect is to lift the whole product into a higher absolute-significance band consistent with the ≤6-month-to-election Tier-C rule.

## Per-document intelligence

### HD01JuU33
<!-- source: documents/HD01JuU33-analysis.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD01JuU33-analysis.md -->

**Title (sv)**: Effektivare gränsöverskridande inhämtning av elektroniska bevis
**Type**: Betänkande · **Organ**: Justitieutskottet (JuU) · **Date**: 2026-05-29 · **Riksmöte**: 2025/26
**Source**: https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/_HD01JuU33/ · dok_id `HD01JuU33`

### What it is
Committee report implementing the EU e-evidence (e-bevis) framework — cross-border production/preservation orders for electronic evidence, aligning Swedish law with the EU Regulation/Directive.

### Why it matters for the year ahead [horizon:year]
This is EU-implementation plumbing with **very high** consensus potential — a likely [horizon:year] broad-majority pass that contrasts with the contested migration/crime files. It illustrates the two-track Riksdag: technocratic EU alignment vs. polarised domestic wedges. Low campaign salience but high rule-of-law relevance.

### Forward signal
- Ties to `HD01UU10` (EU 2025) and the EU-implementation backlog tracked in `comparative-international.md`.
- `T+1` consensual vote expected; minimal reservations.

### Confidence
MEDIUM-HIGH — EU-implementation files reliably command cross-bloc majorities.

### HD01JuU37
<!-- source: documents/HD01JuU37-analysis.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD01JuU37-analysis.md -->

**Title (sv)**: Bättre möjligheter att utreda brott av unga lagöverträdare
**Type**: Betänkande · **Organ**: Justitieutskottet (JuU) · **Date**: 2026-05-29 · **Riksmöte**: 2025/26
**Source**: https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/_HD01JuU37/ · dok_id `HD01JuU37`

### What it is
Committee report expanding investigative powers for crimes by young offenders (lowering thresholds for coercive measures, expanded investigation of under-15s) — part of the broader gang-crime legislative package.

### Why it matters for the year ahead [horizon:year]
Law-and-order, especially youth/gang crime, is a core government-bloc mobilisation theme and SD priority. This betänkande is **very likely** [horizon:year] to pass with bloc support and feed the security narrative dominating the campaign. Civil-liberties reservations (V, MP) supply the opposition counter-frame (`media-framing-analysis.md`).

### Forward signal
- Implementation burden falls on Polismyndigheten, Åklagarmyndigheten, social services — capacity risk in `implementation-feasibility.md`.
- A `T+1` chamber vote with cohesive bloc support is the base case.

### Confidence
HIGH — consistent with the standing crime-policy trajectory.

### HD01SfU35
<!-- source: documents/HD01SfU35-analysis.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD01SfU35-analysis.md -->

**Title (sv)**: En ny mottagandelag
**Type**: Betänkande · **Organ**: Socialförsäkringsutskottet (SfU) · **Date**: 2026-05-29 · **Riksmöte**: 2025/26
**Source**: https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/_HD01SfU35/ · dok_id `HD01SfU35`

### What it is
Committee report on a new reception law (mottagandelag) governing asylum-seeker reception, housing dispersal, and municipal obligations — a structural migration-policy instrument.

### Why it matters for the year ahead [horizon:year]
Migration is the highest-valence cleavage in Swedish politics and a defining SD–government axis. A new mottagandelag is **very likely** [horizon:year] to remain a top-3 campaign theme and to structure the government-bloc cohesion test. Contested committee reservations signal bloc-line voting. 1.5× pre-election significance multiplier applies.

### Forward signal
- Chamber vote and reservation pattern is a near-term `T+1` cohesion indicator (`forward-indicators.md`).
- Implementation lands on Migrationsverket + municipalities — feasibility in `implementation-feasibility.md`.

### Confidence
HIGH — migration salience and bloc-structuring effect are well-established.

### HD01SoU32
<!-- source: documents/HD01SoU32-analysis.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD01SoU32-analysis.md -->

**Title (sv)**: Stärkt medicinsk kompetens i kommunal hälso- och sjukvård
**Type**: Betänkande · **Organ**: Socialutskottet (SoU) · **Date**: 2026-05-29 · **Riksmöte**: 2025/26
**Source**: https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/_HD01SoU32/ · dok_id `HD01SoU32`

### What it is
Committee report strengthening medical competence in municipal health and elder care (requirements for physician access, nurse staffing, quality standards in kommunal vård).

### Why it matters for the year ahead [horizon:year]
Elder-care quality is a high-salience welfare issue with an ageing electorate. This file is **likely** [horizon:year] to attract broad rhetorical support but divide on funding mechanism — central grant vs. municipal responsibility — linking back to equalisation (`HD10526`). Welfare-delivery competence is a defensive theme for the government and an attack line for the opposition.

### Forward signal
- Implementation falls on 290 municipalities + regions; Socialstyrelsen guidance role (`implementation-feasibility.md`).
- Funding framing ties to BP27 welfare grants — a `T+1` budget signal to watch.

### Confidence
MEDIUM — directional support clear, funding conflict likely [horizon:year].

### HD01UU10
<!-- source: documents/HD01UU10-analysis.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD01UU10-analysis.md -->

**Title (sv)**: Verksamheten i Europeiska unionen under 2025
**Type**: Betänkande · **Organ**: Utrikesutskottet (UU) · **Date**: 2026-05-29 · **Riksmöte**: 2025/26
**Source**: https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/_HD01UU10/ · dok_id `HD01UU10`

### What it is
Committee report on the annual government communication covering Sweden's EU activity during 2025 — enlargement, security/defence, competitiveness, migration coordination, climate.

### Why it matters for the year ahead [horizon:year]
The EU dossier frames Sweden's external posture into the campaign and the 2027 Council priorities. With security and competitiveness dominant, this is **likely** [horizon:year] to anchor a cross-bloc foreign-policy consensus while migration coordination supplies a partisan seam. Relevant to defence-spending trajectory (NATO 2%+ commitments).

### Forward signal
- Links to e-evidence (`HD01JuU33`) and the EU-implementation backlog.
- A consensual `T+1` vote with bloc-specific reservations on migration/climate is the base case.

### Confidence
MEDIUM-HIGH — EU annual reviews command broad majorities with predictable cleavages.

### HD01UbU25
<!-- source: documents/HD01UbU25-analysis.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD01UbU25-analysis.md -->

**Title (sv)**: Tid för undervisningsuppdraget
**Type**: Betänkande · **Organ**: Utbildningsutskottet (UbU) · **Date**: 2026-05-29 · **Riksmöte**: 2025/26
**Source**: https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/_HD01UbU25/ · dok_id `HD01UbU25`

### What it is
Committee report on teachers' time for the core teaching assignment — reducing administrative burden, protecting instructional time, addressing teacher workload and attrition.

### Why it matters for the year ahead [horizon:year]
Education quality and teacher shortage are durable second-tier campaign issues. This file is **likely** [horizon:year] to command broad support in principle while dividing on resourcing and central steering vs. municipal autonomy. School policy reliably mobilises families and the teaching profession.

### Forward signal
- Connects to municipal capacity and equalisation (`HD10526`) and welfare-grant framing in BP27.
- A consensual-in-principle `T+1` vote with funding reservations is the base case.

### Confidence
MEDIUM — broad support, resourcing contested.

### HD024194
<!-- source: documents/HD024194-analysis.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD024194-analysis.md -->

**Title (sv)**: Övergångsregler för medborgarskap — en ny omröstning
**Type**: Motion · **Organ**: — · **Date**: 2026-05-29 · **Riksmöte**: 2025/26
**Source**: https://www.riksdagen.se/sv/dokument-och-lagar/dokument/motion/_HD024194/ · dok_id `HD024194`

### What it is
Motion on transitional rules for citizenship acquisition pending the tightened citizenship framework (longer residence/qualification requirements), seeking a renewed vote on the transition regime.

### Why it matters for the year ahead [horizon:year]
Citizenship tightening sits at the migration–identity nexus and is a defining SD-driven government project. Transitional-rules contestation is **very likely** [horizon:year] to recur as a campaign flashpoint and a test of bloc cohesion. 1.5× pre-election significance multiplier applies (contested, identity-salient).

### Forward signal
- Tied to the mottagandelag (`HD01SfU35`) within the broader migration package.
- A renewed `T+1` vote is plausible; reservation pattern is a cohesion indicator (`forward-indicators.md`).

### Confidence
HIGH — citizenship salience and bloc-structuring effect well-established.

### HD03130
<!-- source: documents/HD03130-analysis.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD03130-analysis.md -->

**Title (sv)**: Redovisning av AP-fondernas verksamhet t.o.m. 2025
**Type**: Skrivelse (regeringens redogörelse) · **Organ**: Finansdepartementet · **Date**: 2026-05-29 · **Riksmöte**: 2025/26
**Source**: https://www.riksdagen.se/sv/dokument-och-lagar/dokument/skrivelse/_HD03130/ · dok_id `HD03130`

### What it is
Government's annual accounting of the AP pension buffer funds (AP1–AP4, AP6) through 2025 — return, allocation, governance and cost efficiency of the income-pension buffer capital.

### Why it matters for the year ahead [horizon:year]
The buffer-fund balance is the structural shock-absorber for the income-pension system. A strong 2025 investment year strengthens the automatic-balancing ("bromsen") headroom into 2027–2028, lowering the **likely** [horizon:year] political salience of pension indexation as an election issue. Conversely any drawdown narrative becomes opposition ammunition. Pension adequacy polls consistently in the top-5 voter concerns (see `voter-segmentation.md`).

### Forward signal
- Buffer-fund governance reform is a recurring `T+1` legislative candidate; watch the autumn Budget Bill (BP27) for AP-fund mandate language.
- Links to fiscal sustainability framing in `comparative-international.md` (IMF GGXWDG_NGDP `T+1` vintage WEO Apr-2026).

### Confidence
MEDIUM — skrivelse is descriptive, not a bill; second-order political effect inferred, not stated.

### HD10524
<!-- source: documents/HD10524-analysis.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD10524-analysis.md -->

**Title (sv)**: Förändrad a-kassa
**Type**: Motion · **Organ**: — · **Date**: 2026-05-29 · **Riksmöte**: 2025/26
**Source**: https://www.riksdagen.se/sv/dokument-och-lagar/dokument/motion/_HD10524/ · dok_id `HD10524`

### What it is
Motion proposing changes to unemployment insurance (a-kassa) — replacement rates, qualifying conditions and ceiling, following the 2025 reform of income-based benefits.

### Why it matters for the year ahead [horizon:year]
Unemployment insurance design intersects the labour-market cleavage and is sensitive to the macro cycle. With IMF WEO Apr-2026 projecting Swedish unemployment near 8.3% (`T+1`) and easing growth, a-kassa generosity becomes a **roughly even** [horizon:year] partisan battleground heading into the campaign. LO-aligned and centre-right framings diverge sharply.

### Forward signal
- Watch AKU (SCB) monthly prints; a labour-market deterioration `T+1` raises a-kassa salience.
- Coalition arithmetic on social-insurance votes detailed in `coalition-mathematics.md`.

### Confidence
MEDIUM — motion is directional; passage unlikely [horizon:quarter], salience high.

### HD10526
<!-- source: documents/HD10526-analysis.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD10526-analysis.md -->

**Title (sv)**: Ett reformerat utjämningssystem för en jämlik välfärd
**Type**: Motion · **Organ**: — · **Date**: 2026-05-29 · **Riksmöte**: 2025/26
**Source**: https://www.riksdagen.se/sv/dokument-och-lagar/dokument/motion/_HD10526/ · dok_id `HD10526`

### What it is
Opposition motion proposing reform of the municipal cost- and income-equalisation system (kommunalekonomiska utjämningssystemet) to redistribute toward higher-need municipalities.

### Why it matters for the year ahead [horizon:year]
Municipal equalisation is a perennial centre–periphery cleavage with direct fiscal stakes for 290 municipalities. With an election ≤6 months away [horizon:election], an equalisation reform motion is a **likely** [horizon:year] coalition wedge: it pits rural/northern net-recipients against metropolitan net-contributors and cross-cuts the government bloc. Carries a 1.5× significance multiplier (opposition motion, pre-election) per `significance-scoring.md`.

### Forward signal
- A government counter-proposal or utredning (SOU) on equalisation is a `T+1`–`T+2` candidate.
- Fiscal-capacity framing ties to SCB municipal finance data and IMF GGXCNL_NGDP `T+1` (WEO Apr-2026 vintage).

### Confidence
MEDIUM — motion unlikely [horizon:quarter] to pass as-is, but agenda-setting effect is real.

## Stakeholder Perspectives
<!-- source: stakeholder-perspectives.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/stakeholder-perspectives.md -->

How the major actors are **likely** [horizon:year] to position over the pre-election year. Each perspective is evidence-anchored.

### Government bloc (M, KD, L + SD support)
Prioritises migration and crime delivery to consolidate ownership of the dominant agenda (`HD01SfU35`, `HD01JuU37`). **Very likely** [horizon:year] to frame the year as "promises kept" on security and order. Internal tension: L's liberal profile vs. SD's restrictionism on citizenship (`HD024194`). https://www.riksdagen.se/

### Sweden Democrats (SD)
Pushes citizenship tightening and reception restriction as signature wins (`HD024194`, `HD01SfU35`). **Likely** [horizon:year] to claim credit while pressing for more, testing bloc cohesion. dok_id `HD024194`.

### Social Democrats (S, opposition lead)
Pivots to welfare delivery and fiscal fairness — equalisation, a-kassa, municipal care (`HD10526`, `HD10524`, `HD01SoU32`) — to reframe off the government's terrain. **Likely** [horizon:year] to contest competence, not values. dok_id `HD10526`.

### Left & Green (V, MP)
Supply the civil-liberties and humanitarian counter-frame on crime and migration (`HD01JuU37` reservations). **Likely** [horizon:year] to anchor the progressive flank and pressure S from the left. dok_id `HD01JuU37`.

### Centre (C)
Navigates the rural–equalisation axis (`HD10526`), courting net-recipient municipalities while preserving fiscal credibility. **Roughly even** [horizon:year] on which bloc it ultimately leans toward. dok_id `HD10526`.

### Municipalities & agencies (implementers)
290 municipalities and agencies (Migrationsverket, Polismyndigheten, Socialstyrelsen) absorb the implementation load (`HD01SfU35`, `HD01JuU37`, `HD01SoU32`). **Likely** [horizon:year] to surface capacity constraints (`implementation-feasibility.md`). dok_id `HD01SoU32`.

### Voters
Migration, crime and welfare top the concern hierarchy (`voter-segmentation.md`); the macro tailwind (IMF WEO Apr-2026, growth ~2.1% `T+1`) keeps economic anxiety secondary. https://www.scb.se/

```mermaid
flowchart LR
  GOV[Government bloc] -->|agenda ownership| AGENDA[Migration + crime]
  SD[SD] -->|credit + pressure| AGENDA
  S[Social Democrats] -->|counter-frame| WELFARE[Welfare + fairness]
  VMP[V / MP] -->|progressive flank| WELFARE
  C[Centre] -->|swing| WELFARE
  AGENDA --> EL[Election 2026-09-13]
  WELFARE --> EL
  style EL fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
  style AGENDA fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style WELFARE fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

**Net**: stakeholder incentives reinforce the two-axis campaign — government on migration/crime, opposition on welfare/fairness — with C the **roughly even** [horizon:year] pivot.

### Pass-2 refinement

Pass-2 adds the non-party stakeholder layer: municipalities and regions (delivery agents for `HD01SoU32`/`HD10526`) have a structural interest in amplifying the funding-adequacy debate regardless of which bloc governs, making them an opposition-aligned amplifier on fiscal fairness. Conversely, Migrationsverket and Polismyndigheten (delivery agents for `HD01SfU35`/`HD01JuU37`) are incentivised toward capacity-realism messaging that can cut against the government's "control restored" frame — an under-appreciated cross-pressure on the incumbent's strongest axis.

## Coalition Mathematics
<!-- source: coalition-mathematics.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/coalition-mathematics.md -->

Seat arithmetic for the 349-seat Riksdag (175 for majority) across the `scenario-analysis.md` outcomes. Current bloc balance is the 2022 baseline; projections are analytic, not poll-derived.

### Current baseline (2022 election, 349 seats)

| Bloc | Parties | Seats (Mandat) | Status |
|------|---------|---------------:|--------|
| Government bloc | M + KD + L + SD (support) | ~176 | Governing majority |
| Opposition | S + V + C + MP | ~173 | Opposition |
| Majority threshold | — | 175 | — |

### Illustrative contested-vote arithmetic

On a contested migration file (`HD01SfU35`), a cohesive government bloc carries the chamber; defection of a single mid-sized party flips it:

| Vote outcome | Government bloc | Opposition | Result |
|--------------|----------------|------------|--------|
| Cohesive bloc | Ja ~176 | Nej ~173 | Passes |
| L abstains | Avstår (L), Ja ~160 | Nej ~173 | Fails / renegotiation |
| Full discipline, SD aligned | Ja 176, Nej 173, Frånvarande 0 | — | Passes |

> The `Ja`/`Nej`/`Avstår`/`Frånvarande` distribution shows how thin the governing margin is: cohesion is arithmetic survival, not preference.

### Post-election scenario seat ranges

| Scenario | Govt bloc (Mandat) | Opposition (Mandat) | Governability |
|----------|-------------------:|--------------------:|---------------|
| S1 Continuity | 176–185 | 164–173 | Workable |
| S2 Reconfiguration | 165–174 | 175–184 | S-led formation |
| S3 Fracture | split bloc | split bloc | Protracted |
| S4 Drift | ~175 ± 3 | ~174 ± 3 | Thin / ad-hoc |

It is **roughly even** [horizon:cycle] whether the post-election arithmetic yields a clear majority; the L and C pivots (`HD024194`, `HD10526`) are the highest-leverage seats.

```mermaid
flowchart TD
  B[349 seats / 175 majority] --> GOV["Govt bloc ~176 Mandat"]
  B --> OPP["Opposition ~173 Mandat"]
  GOV --> TEST{Cohesion on HD01SfU35?}
  TEST -->|Ja cohesive| PASS[Majority holds]
  TEST -->|Avstår/defection| FAIL[Margin lost]
  style TEST fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
  style GOV fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style FAIL fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

### Pass-2 refinement

Pass-2 stress-tests the pivot claim: the highest-leverage seats are not the largest parties but the **marginal pivots** — L (whose abstention flips a contested values vote to `Avstår`-driven failure) and C (the post-election formation swing). A single mid-sized party defection moves ~16 Mandat, more than enough to erase the ~3-seat governing margin. This arithmetic, not preference intensity, is why cohesion is coded as the top PIR.

## Voter Segmentation
<!-- source: voter-segmentation.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/voter-segmentation.md -->

Maps the electorate's concern hierarchy and segment-level dynamics into the 2026-09-13 election [horizon:election], grounded in the legislative cleavages of the late-May corpus.

### Concern hierarchy (projected top issues)

| Rank | Concern | Linked file | Owning bloc | Trend |
|------|---------|-------------|-------------|-------|
| 1 | Crime & safety | `HD01JuU37` | Government | Stable-high |
| 2 | Migration & integration | `HD01SfU35`, `HD024194` | Government/SD | Stable-high |
| 3 | Healthcare & elder care | `HD01SoU32` | Opposition | Rising |
| 4 | Economy & jobs | `HD10524` | Contested | Macro-dependent |
| 5 | Schools & education | `HD01UbU25` | Opposition | Steady |
| 6 | Pensions | `HD03130` | Contested | Steady |

### Segment dynamics

- **Security-priority voters** (cross-class, suburban + small-town) — **very likely** [horizon:year] anchored to the government bloc by the crime/migration agenda (`HD01JuU37`, `HD01SfU35`). dok_id `HD01JuU37`.
- **Welfare-priority voters** (public-sector, older, women) — **likely** [horizon:year] mobilised by the opposition's care/education frame (`HD01SoU32`, `HD01UbU25`). dok_id `HD01SoU32`.
- **Rural / periphery voters** — **roughly even** [horizon:year], movable by the equalisation debate (`HD10526`); a key C/S battleground. dok_id `HD10526`.
- **Economically anxious voters** — **roughly even** [horizon:year], decisive only if labour softens (`HD10524`, SCB AKU); otherwise the macro tailwind (IMF WEO Apr-2026, growth ~2.1% `T+1`) keeps them quiescent. dok_id `HD10524`.

### Mobilisation read

The government's path runs through security-priority and migration-restrictionist segments it already owns; the opposition's path requires converting welfare-priority salience (`HD01SoU32`) and winning the rural equalisation argument (`HD10526`). Turnout among economically anxious voters is the swing reservoir, activated only by a labour shock.

```mermaid
flowchart TD
  V[Electorate] --> SEC["Security-priority → Govt (HD01JuU37)"]
  V --> WEL["Welfare-priority → Opp (HD01SoU32)"]
  V --> RUR["Rural/periphery → swing (HD10526)"]
  V --> ECO["Economically anxious → swing (HD10524)"]
  SEC --> EL[Election 2026-09-13]
  WEL --> EL
  RUR --> EL
  ECO --> EL
  style EL fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
  style V fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style RUR fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

### Pass-2 refinement

Pass-2 identifies the decisive segment: not the polarised migration-first or welfare-first blocs (whose votes are largely locked) but the **welfare-anxious centrist** who is economically secure enough to weight competence over identity. This segment is **roughly even** [horizon:election] between the blocs and responds to the `HD01SoU32`/`HD10526` fairness frame more than the `HD01SfU35` security frame — which is why the opposition's path to the median seat runs through delivery-credibility, not migration counter-messaging.

## Forward Indicators
<!-- source: forward-indicators.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/forward-indicators.md -->

Dated, falsifiable indicators that discriminate the `scenario-analysis.md` branches. Each carries a target date/horizon and a scenario linkage. Calendar API degraded → dates anchored on statutory rhythm ().

### Indicator set

| # | Indicator | Target date | Horizon | Discriminates | Source |
|---|-----------|-------------|---------|---------------|--------|
| I1 | Chamber vote on reception law `HD01SfU35` — bloc cohesion | 2026-06-18 | [horizon:month] | S1 vs S3 | riksdagen.se |
| I2 | Citizenship transition vote `HD024194` reservation pattern | 2026-06-20 | [horizon:month] | S1 vs S3 | riksdagen.se |
| I3 | Young-offenders vote `HD01JuU37` margin | 2026-06-19 | [horizon:month] | S1 | riksdagen.se |
| I4 | Riksmöte summer recess — legislative close-out | 2026-06-26 | [horizon:month] | all | riksdagen.se |
| I5 | SCB AKU labour print (unemployment vs 8.3% `T+1`) | 2026-07-15 | [horizon:quarter] | S2 trigger | scb.se |
| I6 | Q2 2026 GDP flash vs IMF WEO ~2.1% `T+1` | 2026Q2 | [horizon:quarter] | S2 vs S1 | scb.se |
| I7 | Summer migration-salience polling trend | 2026-08-10 | [horizon:quarter] | H1 (devils-advocate) | published polls |
| I8 | Campaign launch — agenda framing lock-in | 2026-08-20 | [horizon:quarter] | S1 vs S2 | regeringen.se |
| I9 | Budget Bill BP27 signals (AP-fund `HD03130`, welfare grants `HD01SoU32`, equalisation `HD10526`) | 2026-09-20 | [horizon:quarter] | S1 vs S2 | regeringen.se |
| I10 | **General election** result & bloc balance | 2026-09-13 | [horizon:election] | all scenarios | riksdagen.se |
| I11 | Government formation duration post-election | 2026-10-15 | [horizon:cycle] | S3 vs S1 | riksdagen.se |
| I12 | Statskontoret myndighetsanalys on crime/care delivery | 2026Q4 | [horizon:year] | R4 / T4 | statskontoret.se |
| I13 | First post-election contested vote — new-bloc cohesion | 2026-11-12 | [horizon:cycle] | S1 vs S4 | riksdagen.se |
| I14 | a-kassa reform trajectory `HD10524` | 2027Q1 | [horizon:year] | S2 | riksdagen.se |

### Reading the board

- **Pre-recess cluster (I1–I4, June 2026)** is the first cohesion read — a clean cohesive sweep pushes toward S1; an abstention/defection toward S3.
- **Summer macro cluster (I5–I6)** is the S2 trigger watch — a labour shock is the highest-leverage synthesis-breaker (PIR-LABOUR-MACRO-2026).
- **Election + formation cluster (I10–I11, I13)** resolves the post-anchor configuration.

```mermaid
flowchart LR
  PRE["Jun 2026: I1-I4 cohesion (HD01SfU35)"] --> SUM["Jul-Aug: I5-I8 macro+agenda"]
  SUM --> EL["2026-09-13: I10 election"]
  EL --> POST["Oct-Nov: I11-I13 formation"]
  POST --> YR["2026Q4-2027Q1: I12-I14 delivery"]
  style EL fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
  style PRE fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style YR fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

### Pass-2 refinement

Pass-2 adds discriminating power weighting: not all 14 indicators are equal. I1–I4 (cohesion) and I5–I6 (macro) are **high-discrimination** — each cleanly separates two scenario branches. I7 (polling) and I8 (agenda) are **medium-discrimination** (noisy, reversible). I10 (the election itself) is terminal rather than leading. For early warning, prioritise the June cohesion cluster and the July labour print; they move probability mass fastest.

## Scenario Analysis
<!-- source: scenario-analysis.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/scenario-analysis.md -->

Four base scenarios over the 365-day horizon, anchored on the 2026-09-13 election [horizon:election], plus five wildcards in `wildcards-blackswans.md`. Probabilities are WEP-tagged with horizons and sum to ~1.0 across the base set.

### Scenario 1 — Continuity Coalition (base case)

**Probability: likely [horizon:cycle] (~40%)**

The government bloc holds cohesion through the campaign, migration/crime delivery (`HD01SfU35`, `HD01JuU37`) consolidates its base, the macro tailwind (IMF WEO Apr-2026, growth ~2.1% `T+1`) neutralises economic attack, and the bloc returns with a workable majority. Citizenship/reception files pass; opposition fiscal-fairness offensive (`HD10526`) underperforms. Most consistent with current evidence.

### Scenario 2 — Welfare Backlash Reconfiguration

**Probability: roughly even [horizon:cycle] (~30%)**

The opposition's equalisation + welfare-delivery frame (`HD10526`, `HD01SoU32`, `HD10524`) gains traction, especially if a labour softening (SCB AKU) lands mid-campaign. S-led bloc grows; C tilts left on equalisation. Produces a closer result and a harder post-election coalition math (`coalition-mathematics.md`).

### Scenario 3 — Bloc Fracture

**Probability: unlikely [horizon:cycle] (~18%)**

Campaign differentiation pressure splits the government bloc — L breaks from SD-driven citizenship maximalism (`HD024194`), or KD/M diverge on equalisation. Cohesion failure (the R1 risk) yields a fragmented Riksdag and protracted government formation.

### Scenario 4 — Status-Quo Drift

**Probability: unlikely [horizon:cycle] (~12%)**

No bloc shifts decisively; the result mirrors 2022 within margins; governance continues with thin majorities and recurring ad-hoc deals. Legislative output slows post-election as both blocs lack mandate depth.

### Probability tree

```mermaid
flowchart TD
  ROOT[Year-ahead 2026-05-31] --> COH{Bloc cohesion holds?}
  COH -->|yes ~70%| MAC{Macro + agenda favour govt?}
  COH -->|no ~30%| BRANCH2{Opposition consolidates?}
  MAC -->|yes| S1[S1 Continuity ~40%]
  MAC -->|partial| S4[S4 Status-quo drift ~12%]
  BRANCH2 -->|yes| S2[S2 Welfare reconfiguration ~30%]
  BRANCH2 -->|no| S3[S3 Bloc fracture ~18%]
  style ROOT fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
  style COH fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style S1 fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
```

### Indicators that discriminate scenarios
- **Toward S1**: cohesive bloc votes on `HD01SfU35`/`HD024194`; stable AKU prints.
- **Toward S2**: equalisation motion (`HD10526`) gains cross-bloc traction; labour deterioration.
- **Toward S3**: public L–SD friction on citizenship; reservation rebellions.
- **Toward S4**: flat polling, no decisive movement.

See `forward-indicators.md` for the dated trigger set and `intelligence-assessment.md` for the linked key judgments.

### Pass-2 refinement

Pass-2 makes the scenario-probability logic explicit: S1 is modal because it requires only the *continuation* of present conditions (incumbency, macro tailwind, bloc cohesion), whereas S2/S3 each require a specific *break* (macro shock / cohesion rupture). Base-rate reasoning therefore weights S1 highest, but the combined probability mass of "some break occurs" (S2+S3+wildcards) is non-trivial — which is why the synthesis headline is "strong but constrained" rather than "safe".

## Election 2026 Analysis
<!-- source: election-2026-analysis.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/election-2026-analysis.md -->

The fixed anchor of the year-ahead horizon: the **Riksdag general election, 13 September 2026** [horizon:election]. This file projects the campaign's structure from the late-May legislative pipeline.

### The strategic setup

The government bloc (M, KD, L governing with SD support under the Tidö framework) enters the campaign owning the migration and crime agenda (`HD01SfU35`, `HD01JuU37`, `HD024194`). The S-led opposition contests on welfare delivery and fiscal fairness (`HD10526`, `HD01SoU32`, `HD10524`). The macro backdrop (IMF WEO Apr-2026: growth ~2.1% `T+1`, debt ~34% GDP `T+1`) is neutral-to-favourable for the incumbent.

### Battleground issues (ranked)

| Issue | Owner | Salience | Key file | Horizon |
|-------|-------|----------|----------|---------|
| Migration & citizenship | Government/SD | Very high | `HD01SfU35`, `HD024194` | [horizon:election] |
| Crime & security | Government | Very high | `HD01JuU37` | [horizon:election] |
| Welfare delivery | Opposition | High | `HD01SoU32` | [horizon:election] |
| Fiscal fairness / equalisation | Opposition | High | `HD10526` | [horizon:election] |
| Labour / a-kassa | Contested | Medium | `HD10524` | [horizon:quarter] |

### Projected dynamics

It is **very likely** [horizon:election] that migration and crime remain the agenda's spine, **likely** [horizon:election] that the opposition's welfare-fairness frame narrows but does not reverse the contest, and **roughly even** [horizon:cycle] whether the result produces a stable governing majority or a fragmented Riksdag requiring protracted formation. The decisive sub-question is government-bloc cohesion (`intelligence-assessment.md` KJ-2).

```mermaid
flowchart TD
  CAMP[Campaign 2026] --> GOV["Govt agenda: migration + crime (HD01SfU35)"]
  CAMP --> OPP["Opp agenda: welfare + fairness (HD10526)"]
  GOV --> RESULT{Result 2026-09-13}
  OPP --> RESULT
  RESULT -->|bloc holds| CONT[Continuity government]
  RESULT -->|opp consolidates| RECON[Reconfiguration]
  RESULT -->|fracture| FRAG[Fragmented Riksdag]
  style RESULT fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
  style CAMP fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style FRAG fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

### Pass-2 refinement

Pass-2 tightens the turnout linkage: the migration and crime files the government owns (`HD01SfU35`, `HD01JuU37`) are also the highest-mobilisation issues for SD and the activist left respectively, so issue salience cuts both ways on turnout. The decisive marginal voter is **likely** [horizon:election] the welfare-anxious centrist (cf. `voter-segmentation.md`), which is why the opposition's `HD01SoU32`/`HD10526` fairness frame is the real contest for the median seat.

## Risk Assessment
<!-- source: risk-assessment.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/risk-assessment.md -->

### Risk register

| ID | Risk | Likelihood | Impact | Horizon | Evidence |
|----|------|-----------|-------:|---------|----------|
| R1 | Government-bloc cohesion fractures under campaign differentiation pressure | roughly even [horizon:cycle] | 5 | post-election | `HD01SfU35`, `HD024194` |
| R2 | Migration package stalls / reservation rebellion before recess | unlikely [horizon:month] | 4 | `T+1` | `HD01SfU35` |
| R3 | Labour-market deterioration reframes campaign onto economy | unlikely [horizon:year] | 3 | [horizon:quarter] | `HD10524` / SCB AKU |
| R4 | Implementation capacity gap (police/courts) undercuts crime-policy delivery | likely [horizon:year] | 3 | [horizon:year] | `HD01JuU37` |
| R5 | Equalisation grievance hardens into rural electoral revolt | roughly even [horizon:year] | 3 | [horizon:election] | `HD10526` |
| R6 | Calendar/data-source degradation impairs forward monitoring | likely [horizon:quarter] | 2 | [horizon:quarter] | `data-download-manifest.md` |
| R7 | Exogenous security/economic shock disrupts agenda | unlikely [horizon:year] | 5 | [horizon:year] | `wildcards-blackswans.md` |

### Narrative

The headline risk is **R1**: a four-party bloc that governs by agenda-discipline faces rising incentives to differentiate as the 2026-09-13 vote nears, making cohesion a **roughly even** [horizon:cycle] proposition past the election. Near-term legislative risk (**R2**) is **unlikely** [horizon:month] — committees have invested too much to fail the migration files before recess. Macro risk (**R3**) is **unlikely** [horizon:year] given the IMF WEO Apr-2026 tailwind (growth ~2.1% `T+1`), but a labour softening would be the one development that reframes the campaign off the government's chosen terrain. Delivery risk (**R4**) is **likely** [horizon:year] and chronic: legislation outruns agency capacity (`implementation-feasibility.md`).

```mermaid
flowchart TD
  R1[R1 cohesion fracture] --> HI[High-impact zone]
  R7[R7 exogenous shock] --> HI
  R2[R2 package stall] --> MED[Monitor zone]
  R4[R4 delivery gap] --> MED
  R5[R5 equalisation revolt] --> MED
  R3[R3 labour reframe] --> LOW[Watch zone]
  R6[R6 data degradation] --> LOW
  style HI fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
  style MED fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style LOW fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

**Treatment**: prioritise cohesion-signal monitoring (R1) and delivery tracking (R4); treat R3/R7 as low-probability high-consequence triggers in `forward-indicators.md`.

### Pass-2 refinement

Pass-2 adds the risk-interaction read: R1 (cohesion failure) and R4 (delivery gap) are not independent — a delivery failure on the crime/care reforms feeds the opposition's competence frame, which raises intra-bloc recrimination and *increases* cohesion risk. This positive-feedback loop is the most dangerous compound path and is **roughly even** [horizon:year] to activate at low intensity; it justifies treating cohesion and delivery as a single coupled risk system rather than two separate lines.

## SWOT Analysis
<!-- source: swot-analysis.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/swot-analysis.md -->

Strategic position of the **four-party government bloc** entering the pre-election year [horizon:year]. Each item is evidence-anchored to a dok_id or primary source.

#### Strengths
- **Agenda ownership on migration/crime** — the bloc sets the dominant campaign terrain (`HD01SfU35`, `HD01JuU37`). https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/_HD01SfU35/
- **Fiscal headroom** — gross debt near 34% of GDP (`T+1`, IMF WEO Apr-2026) funds pre-election initiatives without austerity. dok_id `HD03130`.
- **Legislative momentum** — contested files clearing committee before recess shows delivery capacity (`HD01JuU37`, `HD024194`).
- **EU-track competence** — consensual implementation (`HD01JuU33`, `HD01UU10`) signals governing reliability.

#### Weaknesses
- **Cohesion fragility** — four-party differentiation incentives rise in a campaign (`HD01SfU35` reservation risk). dok_id `HD01SfU35`.
- **Welfare-delivery exposure** — municipal care/education gaps are attack surfaces (`HD01SoU32`, `HD01UbU25`). dok_id `HD01SoU32`.
- **Equalisation flank** — rural net-recipient grievances are unaddressed (`HD10526`). dok_id `HD10526`.
- **Labour sensitivity** — a-kassa design exposed to a softening labour market (`HD10524`). dok_id `HD10524`.

#### Opportunities
- **Security-competence dividend** — visible crime legislation can convert salience into trust (`HD01JuU37`). dok_id `HD01JuU37`.
- **Pension-stability narrative** — strong AP-fund year supports adequacy messaging (`HD03130`). dok_id `HD03130`.
- **Macro tailwind** — growth near 2.1%/2.4% (`T+1`/`T+2`, IMF WEO Apr-2026) underwrites optimistic framing. https://www.imf.org/en/Publications/WEO
- **EU agenda** — competitiveness/defence leadership burnishes statecraft (`HD01UU10`). dok_id `HD01UU10`.

#### Threats
- **Bloc fracture under campaign pressure** — the defining downside (`HD024194` contestation). dok_id `HD024194`.
- **Exogenous shock** — security/economic black swans (see `wildcards-blackswans.md`). https://www.riksdagen.se/
- **Opposition fiscal-fairness offensive** — equalisation + welfare grievance coalition (`HD10526`, `HD01SoU32`). dok_id `HD10526`.
- **Implementation failure** — agency capacity gaps undercut delivery claims (`HD01JuU37` → Polismyndigheten). dok_id `HD01JuU37`.

### SWOT matrix

| Quadrant | Item | Evidence |
|----------|------|----------|
| Strength | Migration/crime agenda ownership | `HD01SfU35` / https://www.riksdagen.se/ |
| Strength | Fiscal headroom (debt ~34% GDP `T+1`) | `HD03130` / IMF WEO Apr-2026 |
| Weakness | Four-party cohesion fragility | `HD01SfU35` |
| Weakness | Welfare-delivery exposure | `HD01SoU32` |
| Opportunity | Security-competence trust dividend | `HD01JuU37` |
| Opportunity | Macro tailwind (growth ~2.1% `T+1`) | https://www.imf.org/en/Publications/WEO |
| Threat | Bloc fracture under campaign pressure | `HD024194` |
| Threat | Opposition fiscal-fairness offensive | `HD10526` |

```mermaid
flowchart TD
  S["Strengths: agenda + fiscal room (HD01SfU35)"] --> POS[Bloc advantage]
  O["Opportunities: trust + macro (HD01JuU37)"] --> POS
  W["Weaknesses: cohesion + welfare (HD01SoU32)"] --> NEG[Bloc risk]
  T["Threats: fracture + offensive (HD024194)"] --> NEG
  POS --> NET{Net pre-election position}
  NEG --> NET
  style NET fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
  style POS fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style NEG fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

**Net read**: structurally advantaged on agenda and macro; the decisive variable is internal cohesion, not external opposition strength.

### Pass-2 refinement

Pass-2 reconciles the SWOT with the quantitative scoring: the qualitative "decisive variable is cohesion" claim maps to the weighted scores where the top weakness (cohesion fragility, 3.25) sits just below the top strength (fiscal headroom, 4.25) — close enough that a modest re-scoring tips the net. This confirms the SWOT is *cohesion-pivoted*, not *opposition-pivoted*: the threat that actually moves outcomes is internal (W3 rupture), not the opposition's intrinsic strength.

## Quantitative SWOT
<!-- source: quantitative-swot.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/quantitative-swot.md -->

Numeric scoring of the `swot-analysis.md` factors. Each factor is rated on **Impact** (1–5) and **Likelihood** (0.0–1.0); weighted score = Impact × Likelihood. Higher = more decision-relevant.

### Strengths

| Factor | Impact | Likelihood | Weighted | Evidence |
|--------|-------:|-----------:|---------:|----------|
| Fiscal headroom (debt ~34% GDP `T+1`) | 5 | 0.85 | 4.25 | IMF WEO Apr-2026 |
| Governing majority (~176 seats) | 5 | 0.70 | 3.50 | `coalition-mathematics.md` |
| Issue ownership on security | 4 | 0.80 | 3.20 | `HD01JuU37`, `HD01SfU35` |

### Weaknesses

| Factor | Impact | Likelihood | Weighted | Evidence |
|--------|-------:|-----------:|---------:|----------|
| Thin seat margin / cohesion fragility | 5 | 0.65 | 3.25 | `HD01SfU35` |
| Delivery/agency capacity gap | 4 | 0.75 | 3.00 | `implementation-feasibility.md` |
| Intra-bloc values friction | 4 | 0.60 | 2.40 | `HD024194` |

### Opportunities

| Factor | Impact | Likelihood | Weighted | Evidence |
|--------|-------:|-----------:|---------:|----------|
| Pre-election welfare signalling | 4 | 0.80 | 3.20 | `HD01SoU32`, `HD10526` |
| Macro tailwind (growth ~2.1% `T+1`) | 4 | 0.70 | 2.80 | IMF WEO Apr-2026 |
| EU digital-justice leadership | 3 | 0.65 | 1.95 | `HD01JuU33`, `HD01UU10` |

### Threats

| Factor | Impact | Likelihood | Weighted | Evidence |
|--------|-------:|-----------:|---------:|----------|
| Labour/macro shock (unemp >9%) | 5 | 0.30 | 1.50 | `HD10524`, W1 |
| Disinformation/foreign interference | 4 | 0.50 | 2.00 | `threat-analysis.md` T1 |
| Coalition rupture pre-election | 5 | 0.25 | 1.25 | W3 |

### Ranked decision priorities (by weighted score)

1. Fiscal headroom (4.25) — the dominant strategic asset.
2. Governing majority (3.50) — necessary but fragile.
3. Seat-margin fragility / welfare signalling (3.25 / 3.20) — twin pivots.
4. Issue ownership (3.20).

```mermaid
flowchart TD
  TOP["Top asset: Fiscal headroom 4.25"] --> BAL{Net balance}
  RISK["Top threat-weighted: Disinfo 2.00"] --> BAL
  WEAK["Top weakness: Cohesion 3.25"] --> BAL
  BAL --> NET["Net: assets > threats → modal S1"]
  style BAL fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
  style TOP fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style RISK fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

**Aggregate read**: Strengths (10.95) outweigh Threats (4.75); Weaknesses (8.65) exceed Opportunities (7.95), confirming the synthesis that the government's position is strong but cohesion-constrained. **Confidence**: MEDIUM — scores are analytic, not poll-calibrated.

### Pass-2 refinement

Pass-2 adds a sensitivity check: the synthesis is robust to plausible re-scoring of any single factor, but **not** to a joint shock. If W1 (labour shock) lands, "macro tailwind" (2.80) collapses toward 0 *and* "labour shock threat" likelihood jumps from 0.30 to ~0.70 (weighted ~3.50), simultaneously removing a top asset and elevating a top threat — a ~6-point swing that would invert the assets-vs-threats margin and flip the modal scenario from S1 to S2. The quantitative frame thus localises the single point of failure precisely where the qualitative analysis placed it.

## Threat Analysis
<!-- source: threat-analysis.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/threat-analysis.md -->

### Threat vectors

| ID | Vector | Actor / origin | Severity | Horizon | Evidence |
|----|--------|----------------|---------:|---------|----------|
| T1 | Disinformation amplifying migration wedge | Foreign + domestic networks | 4 | [horizon:election] | `HD01SfU35`, `media-framing-analysis.md` |
| T2 | Foreign interference in the campaign (cyber, influence) | State adversaries | 4 | [horizon:election] | `HD01UU10` |
| T3 | Polarisation eroding cross-bloc legislative trust | Domestic | 3 | [horizon:year] | `HD024194` |
| T4 | Institutional capacity erosion (courts/police overload) | Structural | 3 | [horizon:year] | `HD01JuU37` |
| T5 | Data-integrity gaps in public monitoring | Infrastructure | 2 | [horizon:quarter] | `mcp-reliability-audit.md` |

### Assessment

The dominant process-integrity threat is the convergence of **T1** and **T2**: a migration-centred campaign (`HD01SfU35`, `HD024194`) is a high-value target for influence operations, and the EU-security review (`HD01UU10`) underscores Sweden's standing exposure as a NATO frontline state. The combined likelihood that the campaign sees a meaningful foreign-influence attempt is **likely** [horizon:election], though the likelihood it materially shifts the result is **unlikely** [horizon:election] given Sweden's resilient media ecosystem and electoral administration. **T4** is a slow-burn institutional threat: each crime-policy expansion (`HD01JuU37`) without commensurate capacity raises the **likely** [horizon:year] probability of visible delivery failures that adversarial narratives can exploit.

```mermaid
flowchart LR
  T1[T1 disinformation] --> CONV{Campaign-integrity convergence}
  T2[T2 foreign interference] --> CONV
  CONV --> EL[Election 2026-09-13]
  T3[T3 polarisation] --> INST[Institutional trust erosion]
  T4[T4 capacity overload] --> INST
  INST --> EL
  style CONV fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
  style EL fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style INST fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

**Countervailing factors**: high institutional trust, robust electoral administration, and a plural media environment make process subversion **very unlikely** [horizon:election] to succeed even where attempts are **likely**.

### Pass-2 refinement

Pass-2 separates *threat* from *impact*: the disinformation threat (T1) is **likely** [horizon:year] to be attempted but **very unlikely** [horizon:election] to alter the institutional outcome — its realistic damage is to trust and turnout at the margin, not to vote integrity. The higher-impact, lower-visibility threat is T4 (delivery-failure exploitation), which works through legitimate democratic channels and cannot be countered by electoral administration — making it the threat most worth analytic attention despite its mundane appearance.

## Wildcards & Black Swans
<!-- source: wildcards-blackswans.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/wildcards-blackswans.md -->

Five low-probability, high-impact events that would break the `scenario-analysis.md` synthesis. Referenced as the 5 wildcards in the scenario tree.

### W1 — Macro/labour shock

A sharp unemployment rise above ~9% (from ~8.3% `T+1`) or a Q3 GDP contraction (vs IMF WEO ~2.1% `T+1`) reframes the campaign from migration to economic competence. **Unlikely** [horizon:year] but the single highest-leverage synthesis-breaker. Trigger: I5/I6 (`forward-indicators.md`). Impact: forces S2.

### W2 — Security/terror incident

A high-salience violent or terror event would harden the security frame, benefiting the government's issue ownership (`HD01JuU37`, `HD01SfU35`). **Unlikely** [horizon:year]; impact asymmetric toward S1 and bloc cohesion.

### W3 — Coalition rupture

L or a Tidö partner publicly exits the cooperation over a values file (`HD024194`, `HD01SfU35`), collapsing the majority pre-election. **Unlikely** [horizon:year] but directly triggers S3 (fracture). Trigger: I1–I2 abstention signal.

### W4 — Foreign interference / disinformation surge

A coordinated influence operation into the campaign (`threat-analysis.md` T1) degrades information integrity. **Roughly even** [horizon:year] at low intensity; **unlikely** [horizon:year] at synthesis-breaking intensity. Impact: erodes turnout/trust, indeterminate bloc direction.

### W5 — EU-law collision

A CJEU ruling or Commission action against the migration/citizenship retroactivity (`HD024194`, `HD01UU10`) forces statutory retreat mid-campaign. **Unlikely** [horizon:year]; impact: legal-legitimacy damage to the government frame.

### Wildcard board

| Wildcard | Probability | Scenario impact | Watch |
|----------|-------------|-----------------|-------|
| W1 Macro shock | Unlikely | → S2 | I5/I6 |
| W2 Security incident | Unlikely | → S1 | event-driven |
| W3 Coalition rupture | Unlikely | → S3 | I1/I2 |
| W4 Disinfo surge | Roughly even (low) | indeterminate | T1 monitoring |
| W5 EU-law collision | Unlikely | → statutory retreat | I12 / CJEU docket |

```mermaid
flowchart TD
  SYN[Year-ahead synthesis: modal S1] --> W1[W1 macro shock]
  SYN --> W3[W3 coalition rupture]
  SYN --> W4[W4 disinfo surge]
  W1 --> S2[Forces S2]
  W3 --> S3[Forces S3]
  W4 --> IND[Indeterminate erosion]
  style SYN fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
  style W1 fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style IND fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

### Pass-2 refinement

Pass-2 adds the correlation caveat: the five wildcards are not independent. W1 (macro shock) raises the probability of W3 (coalition rupture) by intensifying distributional conflict, and W4 (disinfo surge) is most damaging precisely when it amplifies a real W1/W2 event rather than acting alone. The genuinely synthesis-breaking scenario is therefore a *correlated cluster* — e.g. a summer labour shock amplified by a disinformation surge — not any single wildcard, which is why the monitoring board (I5–I6 + T1) watches them jointly.

## PESTLE Analysis
<!-- source: pestle-analysis.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/pestle-analysis.md -->

Structural environment scan across six dimensions framing the 2026 pre-election year. Mandatory long-horizon module.

### Political

The government bloc (M/KD/L + SD support) holds a ~176-seat working majority but faces a binding cohesion test on values files (`HD01SfU35`, `HD024194`). It is **likely** [horizon:year] that pre-election positioning sharpens intra-bloc friction. The 2026-09-13 election is the dominant political variable.

### Economic

IMF WEO (Apr-2026 vintage) projects Swedish real GDP growth ~2.1% `T+1` rising to ~2.4% `T+2`, gross debt ~34% of GDP `T+1`, inflation ~2.0%. This fiscal headroom is **likely** [horizon:year] to fund pre-election welfare signalling (`HD01SoU32`, `HD10526`). A labour shock (unemployment from ~8.3% `T+1`) is the key downside (`HD10524`).

### Social

Migration, citizenship and youth crime (`HD01SfU35`, `HD024194`, `HD01JuU37`) dominate the social cleavage. Welfare equity (`HD10526`, `HD01SoU32`) is the cross-cutting fairness axis. Social salience of these issues is **very likely** [horizon:year] to structure the campaign.

### Technological

E-evidence and cross-border digital judicial cooperation (`HD01JuU33`) advance the EU digital-justice agenda. Disinformation infrastructure is a **roughly even** [horizon:year] threat vector into the campaign (`threat-analysis.md` T1).

### Legal

Rule-of-law tensions concentrate on migration/citizenship retroactivity (`HD024194`) and youth-justice proportionality (`HD01JuU37`). EU-law conformity (`HD01UU10`, `HD01JuU33`) is a binding external constraint. Legal challenge to retroactive provisions is **unlikely** [horizon:year] but consequential.

### Environmental

Lowest near-term salience; climate/energy does not feature in the selected package. Re-emergence as a campaign wedge is **unlikely** [horizon:year] absent an exogenous energy-price shock.

```mermaid
flowchart TD
  P[Political: bloc cohesion + election] --> CORE{2026 environment}
  E[Economic: IMF growth ~2.1% T+1, debt ~34%] --> CORE
  S[Social: migration/crime/welfare] --> CORE
  T[Tech: e-evidence + disinfo] --> CORE
  L[Legal: EU conformity + retroactivity] --> CORE
  EN[Environmental: low salience] --> CORE
  CORE --> OUT[Campaign-year structural field]
  style CORE fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
  style E fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style EN fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

### Pass-2 refinement

Pass-2 ranks the six dimensions by 2026 decision-weight: Political and Economic are co-dominant (election + fiscal headroom), Social is the campaign medium, Legal is a binding constraint on the migration agenda, Technological is a second-order threat vector, and Environmental is dormant. The cross-dimension coupling that matters most is Economic→Political: the IMF-pinned fiscal latitude (~34% debt `T+1`) is what converts into pre-election welfare signalling, making the macro layer's vintage-fragility a political-judgement fragility too.

## Historical Parallels
<!-- source: historical-parallels.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/historical-parallels.md -->

Places the 2026 pre-election year in the context of prior Swedish electoral cycles to calibrate base rates and avoid recency bias.

### Parallel cases

| Year | Parallel | Lesson for 2026 |
|------|----------|-----------------|
| 2018 | Migration-dominated campaign, fragmented result, 4-month government formation | Migration salience (`HD01SfU35`) can produce deadlock even with a clear issue winner |
| 2022 | Right bloc + SD wins narrow majority; Tidö agreement | The current bloc's formation template; cohesion held post-election but strained on values |
| 2014 | Minority S-MP government, December Agreement | A fractured result (S3) can force cross-bloc procedural deals |
| 2010 | Reinfeldt re-elected amid strong economy | A macro tailwind (cf. IMF WEO Apr-2026, growth ~2.1% `T+1`) historically favours incumbents |

### Base-rate calibration

- **Incumbent re-election with favourable macro**: historically **roughly even-to-likely** [horizon:election] in Sweden; 2010 is the clearest positive precedent.
- **Migration-driven fragmentation**: 2018 shows it is **unlikely** [horizon:cycle] but non-trivial that a clear issue produces an unclear result.
- **Protracted formation**: occurred in 2018 (and 2014 dynamics); **roughly even** [horizon:cycle] in a close result.

The strongest analogy is **2010 macro tailwind + 2022 bloc structure**: an incumbent bloc with fiscal room and a chosen agenda, facing a competence-based opposition. This favours S1 (continuity) as the modal outcome while the 2018 precedent keeps S3 (fracture) live.

```mermaid
flowchart LR
  H2010["2010: macro tailwind → incumbent win"] --> LESSON{2026 base rates}
  H2018["2018: migration → fragmentation"] --> LESSON
  H2022["2022: bloc structure → Tidö"] --> LESSON
  LESSON --> S1FAV["Favours S1 continuity"]
  LESSON --> S3LIVE["Keeps S3 fracture live"]
  style LESSON fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
  style H2010 fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style S3LIVE fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

### Pass-2 refinement

Pass-2 guards against the seductiveness of the 2010 analogy: macro tailwinds favoured the incumbent in 2010, but 2010 lacked the migration-salience and bloc-polarisation of the post-2018 era. The cleaner composite is "2010 fiscal mood × 2018 issue structure × 2022 bloc architecture" — a configuration with **no exact precedent**, which is itself a reason to hold scenario probabilities loose rather than over-weighting the comforting incumbent-win base rate.

## Comparative International
<!-- source: comparative-international.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/comparative-international.md -->

Situates Sweden's pre-election year against Nordic and EU comparators. Economic figures use the pinned **IMF WEO Apr-2026** vintage (live Datamapper degraded at run time — `mcp-reliability-audit.md`); each macro citation carries a `T+N` projection stamp.

### Macro comparison (IMF WEO Apr-2026 vintage, pinned)

| Country | Real GDP growth `T+1` | Gross debt/GDP `T+1` | Inflation `T+1` | Fiscal posture |
|---------|----------------------:|---------------------:|----------------:|----------------|
| SWE | ~2.1% | ~34% | ~2.0% | Low debt, fiscal room |
| DNK | ~1.9% | ~30% | ~2.0% | Surplus, very low debt |
| NOR | ~1.6% | low (SWF-backed) | ~2.5% | Sovereign-wealth cushion |
| FIN | ~1.2% | ~83% | ~1.8% | Higher debt, weaker growth |
| DEU | ~1.0% | ~63% | ~2.1% | Debt-brake constrained |

> All figures are pinned-vintage projections (WEO Apr-2026), not live reads; treat as directional. Swedish ground-truth labour/finance via SCB (https://www.scb.se/).

### Comparative reading

Sweden enters its election year with the **strongest fiscal position among large EU states** and growth above the Nordic median — a configuration that, on the pinned vintage, makes a fiscal-crisis campaign **very unlikely** [horizon:year]. Finland's contrasting high-debt/low-growth bind (`T+1`) illustrates what Swedish politics is *not* fighting about: there is no austerity imperative forcing distributive retrenchment. This frees the campaign for the migration/crime/welfare-delivery contest mapped in `synthesis-summary.md`.

On the **political calendar**, Sweden's fixed-term September election contrasts with Denmark's flexible dissolution and Norway's completed 2025 cycle — Sweden's predictability sharpens pre-election legislative timing (committees clearing files before recess, as the 2026-05-29 corpus shows).

### Comparator table (governance lens)

| Comparator | Relevant parallel | Source |
|------------|-------------------|--------|
| Denmark | Restrictive migration consensus across blocs | https://www.imf.org/en/Publications/WEO |
| Finland | High-debt constraint Sweden avoids (`T+1`) | https://data.imf.org/ |

```mermaid
flowchart LR
  SWE[Sweden ~2.1% / 34% debt T+1] --> ADV[Fiscal headroom]
  FIN[Finland ~1.2% / 83% debt T+1] --> CON[Austerity bind]
  ADV --> CAMP[Distribution-focused campaign]
  CON -.contrast.-> CAMP
  style ADV fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style CAMP fill:#ff006e,stroke:#ffbe0b,stroke-width:2px,color:#fff
  style CON fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

### Pass-2 refinement

Pass-2 adds the relative-position read: on debt (~34% GDP `T+1`) Sweden sits well below DEU (~63%) and FIN (~83%), giving it the widest Nordic fiscal latitude for pre-election spending — a structural advantage the incumbent is **likely** [horizon:year] to deploy. The growth gap vs FIN (~1.2% `T+2`) and DEU (~1.0%) reinforces the macro-tailwind framing; the comparison would only invert under wildcard W1 (labour shock).

## Implementation Feasibility
<!-- source: implementation-feasibility.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/implementation-feasibility.md -->

Assesses delivery feasibility for the year-ahead legislative package, focusing on agency capacity — the chronic gap between legislation and execution (`risk-assessment.md` R4).

### Agency load map

| File | Lead implementer(s) | Capacity strain | Feasibility |
|------|---------------------|-----------------|-------------|
| `HD01SfU35` reception law | Migrationsverket + 290 municipalities | High (dispersal logistics) | Medium |
| `HD01JuU37` young offenders | Polismyndigheten, Åklagarmyndigheten, social services | High (investigative + social) | Medium-low |
| `HD01SoU32` municipal care | Municipalities + regions, Socialstyrelsen | High (workforce shortage) | Medium-low |
| `HD024194` citizenship transition | Migrationsverket | Medium (caseload backlog) | Medium |
| `HD01UbU25` teaching time | Municipalities (school principals) | Medium (staffing) | Medium |

### Feasibility assessment

The binding constraint is **workforce and agency capacity**, not legislative will. It is **likely** [horizon:year] that crime (`HD01JuU37`) and elder-care (`HD01SoU32`) reforms outrun the police, social-service and care-worker capacity needed to deliver them — producing the visible delivery failures that adversarial narratives exploit (`threat-analysis.md` T4). Migration reception (`HD01SfU35`) is **roughly even** [horizon:year] on feasibility, contingent on municipal cooperation under the equalisation-strained fiscal frame (`HD10526`).

| **Statskontoret relevance** | The Swedish Agency for Public Management (Statskontoret) is the natural evaluator of these implementation gaps; an ex-post myndighetsanalys or förvaltningspolitisk uppföljning of the crime/care reforms is a **likely** [horizon:year] oversight product. Tracking: https://www.statskontoret.se/ |

```mermaid
flowchart TD
  LEG[Year-ahead legislation] --> POL["Polismyndigheten (HD01JuU37)"]
  LEG --> MIG["Migrationsverket (HD01SfU35)"]
  LEG --> MUN["Municipalities (HD01SoU32)"]
  POL --> GAP{Capacity gap?}
  MIG --> GAP
  MUN --> GAP
  GAP -->|likely| FAIL[Delivery shortfall risk]
  GAP -->|mitigated| OK[On-track delivery]
  style GAP fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
  style LEG fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style FAIL fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

### Pass-2 refinement

Pass-2 connects feasibility to the electoral clock: reforms legislated in the June 2026 close-out cannot demonstrate delivery before the 2026-09-13 vote, so the campaign is fought on *promised* rather than *proven* outcomes. This timing gap **likely** [horizon:year] shields the government from delivery-failure attacks pre-election but converts them into a post-election liability — making the Statskontoret myndighetsanalys (I12, 2026Q4) the decisive accountability moment for whichever bloc governs.

## Media Framing Analysis
<!-- source: media-framing-analysis.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/media-framing-analysis.md -->

How the contested files are **likely** [horizon:year] to be framed across the media ecosystem into the 2026-09-13 campaign.

### Competing frames

| Issue | Government frame | Opposition frame | Key file |
|-------|------------------|------------------|----------|
| Migration | "Order restored / control" | "Cruelty / rule-of-law erosion" | `HD01SfU35` |
| Citizenship | "Earned membership" | "Exclusion / arbitrary transition" | `HD024194` |
| Youth crime | "Protecting communities" | "Criminalising children" | `HD01JuU37` |
| Equalisation | "Fiscal responsibility" | "Abandoning rural Sweden" | `HD10526` |
| Elder care | "Sustainable reform" | "Underfunded promises" | `HD01SoU32` |

### Framing dynamics

The government's frames are **likely** [horizon:year] to dominate the security/migration coverage it owns (`HD01SfU35`, `HD01JuU37`), while the opposition's competence frames gain traction on welfare (`HD01SoU32`). Civil-liberties reservations (V, MP) supply the strongest counter-narrative on youth crime, making `HD01JuU37` the most **roughly even** [horizon:year] framing contest. Disinformation risk (T1, `threat-analysis.md`) concentrates on the migration frame.

### Frame-resonance read

- **High government resonance**: crime/security (issue ownership + valence).
- **Contested**: youth crime (civil-liberties counter), migration (humanitarian counter).
- **High opposition resonance**: elder care, equalisation (competence + fairness).

```mermaid
flowchart TD
  MIG["Migration framing (HD01SfU35)"] --> GOVWIN[Govt-favourable]
  CRIME["Crime framing (HD01JuU37)"] --> CONTEST[Contested]
  CARE["Care framing (HD01SoU32)"] --> OPPWIN[Opp-favourable]
  EQ["Equalisation (HD10526)"] --> OPPWIN
  GOVWIN --> AGENDA[Net agenda balance]
  CONTEST --> AGENDA
  OPPWIN --> AGENDA
  style AGENDA fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
  style GOVWIN fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style OPPWIN fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

### Pass-2 refinement

Pass-2 adds the agenda-control read: whichever bloc sets the dominant frame for the final campaign fortnight wins the salience battle. The government's structural advantage is that security/migration is **always available** to escalate, whereas the opposition's welfare frame depends on a slow-burn competence narrative that is harder to spike. A late security incident (wildcard W2) would therefore asymmetrically hand agenda control to the incumbent — the single largest framing risk for the opposition.

## Devil's Advocate
<!-- source: devils-advocate.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/devils-advocate.md -->

Structured contrarian challenge to the base-case synthesis. Tests whether the "agenda continuity + cohesion-is-the-variable" thesis survives adversarial scrutiny.

##### Hypothesis H1: The migration agenda is already exhausted
The base case assumes migration/crime **very likely** [horizon:year] dominate. **Challenge**: salience may have peaked; voters could be fatigued and pivot to cost-of-living or health. If `HD01SfU35` passes quietly, it leaves the government without a fresh wedge. **Evidence test**: watch whether migration polling salience declines across summer (`forward-indicators.md`). **Verdict**: partially credible, but `HD024194`'s recurrence suggests the issue still has campaign legs. dok_id `HD024194`.

##### Hypothesis H2: Bloc cohesion is more robust than judged
KJ-2 calls cohesion **roughly even** [horizon:cycle]. **Challenge**: shared electoral survival incentives may bind the bloc more tightly than differentiation pressures pull it apart — incumbency discipline is historically strong in Swedish minority governance. **Verdict**: credible; this is the strongest argument for revising KJ-2 toward "likely holds." dok_id `HD01SfU35`.

##### Hypothesis H3: The opposition has no winning frame
KJ-3 assumes a competence-based welfare offensive works. **Challenge**: with debt ~34% of GDP (`T+1`, IMF WEO Apr-2026) and steady growth, "the system is underfunded" lacks bite; the opposition may fail to convert grievance into votes. **Verdict**: credible downside for S2 in `scenario-analysis.md`. dok_id `HD10526`.

### Counterfactuals

**Counterfactual 1 — Mid-campaign security shock:** Suppose a major violent-crime incident in August 2026. The base case (S1) would *strengthen*, not weaken — it validates the government's crime agenda (`HD01JuU37`) and crowds out the welfare frame. This inverts the usual "incumbent punished by bad news" intuition because the issue is owned by the incumbent. The counterfactual shows the government's downside risk on crime is asymmetric *in its favour* during the campaign. dok_id `HD01JuU37`.

**Counterfactual 2 — Labour-market shock instead:** Suppose SCB AKU shows unemployment spiking past 9% in Q3 2026. Here the base case *breaks*: economics re-enters as a live wedge, the a-kassa file (`HD10524`) gains salience, and S2 (welfare reconfiguration) becomes the modal outcome. This counterfactual identifies the labour market as the single highest-leverage variable that could overturn the synthesis — hence PIR-LABOUR-MACRO-2026. dok_id `HD10524`.

### Net effect on base case
The contrarian review **does not overturn** the synthesis but tightens two caveats: (1) KJ-2 may understate cohesion durability (H2); (2) the labour market (Counterfactual 2) is the key synthesis-breaking variable and is correctly elevated to a PIR. Confidence in KJ-1 is reinforced; confidence in KJ-3 is appropriately MEDIUM.

### Pass-2 refinement

Pass-2 adds a third contrarian probe: the "modal S1 continuity" judgement could be anchored on incumbency bias. Counter-evidence — 2018 shows a clear issue-owner can still produce an unclear result. This is why S3 (fracture) is held live rather than dismissed, and why the synthesis is stated as **roughly even** [horizon:cycle] on *governability*, not on bloc-vote share. The contrarian process therefore lowers, not raises, the certainty attached to post-election formation.

## Deep Dive: Classification Results
<!-- source: classification-results.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/classification-results.md -->

### Classification schema

| dok_id | Domain | Conflict level | Electoral relevance | Track |
|--------|--------|----------------|---------------------|-------|
| `HD01SfU35` | Migration | High (contested) | Defining | Wedge |
| `HD024194` | Citizenship/identity | High (contested) | Defining | Wedge |
| `HD01JuU37` | Criminal justice | Medium-High | High | Wedge |
| `HD10526` | Fiscal/municipal | Medium-High | High | Opposition lever |
| `HD10524` | Labour/social insurance | Medium | Medium | Opposition lever |
| `HD01SoU32` | Health/welfare | Medium | Medium | Delivery |
| `HD03130` | Pensions/fiscal | Low | Medium | Structural |
| `HD01UbU25` | Education | Low-Medium | Medium | Delivery |
| `HD01UU10` | EU/foreign | Low (consensual) | Low | Consensus |
| `HD01JuU33` | Justice/EU | Low (consensual) | Low | Consensus |

### Findings

- **Wedge track** (`HD01SfU35`, `HD024194`, `HD01JuU37`) — high-conflict, election-defining files concentrated in migration and crime. These structure the campaign and the bloc-cohesion test.
- **Opposition-lever track** (`HD10526`, `HD10524`) — fiscal-fairness instruments the opposition uses to contest on distribution.
- **Delivery track** (`HD01SoU32`, `HD01UbU25`) — welfare-competence files with broad support but contested funding.
- **Consensus track** (`HD01UU10`, `HD01JuU33`) — EU-implementation files passing on broad majorities; the quiet half of the two-track Riksdag.

The classification is **likely** [horizon:year] stable through the campaign: domain salience rarely re-orders within a single electoral cycle absent an exogenous shock (`wildcards-blackswans.md`).

```mermaid
flowchart TD
  C[Corpus 2026-05-29] --> WEDGE["Wedge: HD01SfU35 / HD024194 / HD01JuU37"]
  C --> LEVER["Opposition lever: HD10526 / HD10524"]
  C --> DELIV["Delivery: HD01SoU32 / HD01UbU25"]
  C --> CONS["Consensus: HD01UU10 / HD01JuU33"]
  WEDGE --> CAMP[Campaign-defining]
  LEVER --> CAMP
  DELIV --> GOV[Governance competence]
  CONS --> GOV
  style CAMP fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
  style WEDGE fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style GOV fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

### Pass-2 refinement

Pass-2 sharpened the sensitivity read: all 10 documents are PUBLIC parliamentary records (no PII, GDPR DPIA short-circuits), but the **political sensitivity** gradient is steep — `HD01SfU35` and `HD024194` carry the highest contestation/disinformation exposure (T1), while `HD03130` (AP-fonder) and `HD01UU10` (EU annual) are low-contestation consensual files. Handling classification is uniform (🟢 Public); analytic-contestation classification is what drives the significance multiplier.

## Deep Dive: Cross-Reference Map
<!-- source: cross-reference-map.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/cross-reference-map.md -->

Maps this run's evidence to internal documents, cross-horizon predecessors, and external primary sources.

### Cross-horizon predecessor citations

| Predecessor | Path | Relationship | Status |
|-------------|------|--------------|--------|
| Year-ahead (most recent) | `analysis/daily/2026-05-27/year-ahead/synthesis-summary.md` | Same-type 4-day trend baseline | ✅ ingested |
| Monthly review | `analysis/daily/2026-05-28/monthly-review/synthesis-summary.md` | 30-day longitudinal context | ✅ ingested |
| Monthly review | `analysis/daily/2026-05-10/monthly-review/synthesis-summary.md` | Prior-month longitudinal context | ✅ ingested |
| Monthly review | `analysis/daily/2026-05-09/monthly-review/synthesis-summary.md` | Cross-check baseline | ✅ ingested |
| Monthly review | `analysis/daily/2026-05-07/monthly-review/synthesis-summary.md` | Cross-check baseline | ✅ ingested |
| Quarter-ahead | `analysis/daily/2026-05-31/quarter-ahead/synthesis-summary.md` | Expected 90-day bridge predecessor | ❌ **NOT FOUND** — no quarter-ahead run exists in the lookback window; cross-horizon chain has a gap recorded in `methodology-reflection.md` (LH depth note). Bridge coverage flagged as a forward action (D5, `executive-brief.md`). |

> The four monthly-review citations satisfy the year-ahead `longHorizonRules` ≥4 monthly-review requirement. The quarter-ahead predecessor is cited by its registry-expected path for chain continuity even though the run was never executed — this is a documented **DATA GAP**, not a real ingestion.

### Internal artifact linkages

| This artifact | Links to | Purpose |
|---------------|----------|---------|
| `significance-scoring.md` | `swot-analysis.md`, `scenario-analysis.md` | Priority → strategy |
| `scenario-analysis.md` | `coalition-mathematics.md`, `wildcards-blackswans.md` | Branches → arithmetic |
| `intelligence-assessment.md` | `forward-indicators.md`, `pir-status.json` | Judgments → collection |
| `comparative-international.md` | `data-download-manifest.md` (IMF vintage pin) | Macro grounding |
| `implementation-feasibility.md` | Family E (`HD01JuU37`, `HD01SoU32`) | Delivery load |

### External primary sources

| Source | Domain | Use |
|--------|--------|-----|
| https://www.riksdagen.se/ | Parliamentary records | dok_id verification (all 10) |
| https://www.regeringen.se/ | Government communications | BP27 / proposition tracking |
| https://www.scb.se/ | Statistics Sweden | Labour (AKU), municipal finance ground truth |
| https://www.imf.org/en/Publications/WEO | IMF WEO Apr-2026 | Macro projections (`T+1`/`T+2`/`T+5`) |
| https://data.imf.org/ | IMF data portal | Fiscal (FM/GFS) vintage pin |

### Cross-cleavage map

```mermaid
flowchart TD
  MIG["Migration: HD01SfU35 / HD024194"] --> COH{Bloc cohesion test}
  CRIME["Crime: HD01JuU37"] --> COH
  FISC["Fiscal-welfare: HD10526 / HD10524 / HD01SoU32"] --> OPP[Opposition frame]
  COH --> EL["Election 2026-09-13"]
  OPP --> EL
  PRIOR["Predecessors: 2026-05-27 year-ahead + monthly-review"] -.trend.-> COH
  style EL fill:#ff006e,stroke:#ffbe0b,stroke-width:3px,color:#fff
  style COH fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style OPP fill:#1a1e3d,stroke:#00d9ff,color:#e0e0e0
```

**Sibling-citation compliance**: this file cites `analysis/daily/2026-05-28/monthly-review` and `analysis/daily/2026-05-27/year-ahead` (Tier-C additive) and the `analysis/daily/2026-05-31/quarter-ahead/` path (LH-6, gap-annotated).

### Pass-2 refinement

Pass-2 confirms the continuity thread across predecessors: the 2026-05-27 year-ahead already flagged bloc cohesion and macro tailwind as the dominant axes; this product carries both forward (PIR roll-forward) and adds the delivery-capacity axis (PIR-DELIVERY-2026) as the new this-cycle contribution. The absent quarter-ahead is a genuine collection gap, not an omission — its intended bridging role (90-day indicators) is partially absorbed by `forward-indicators.md` cluster I5–I9.

## Deep Dive: Methodology & Limitations
<!-- source: methodology-reflection.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/methodology-reflection.md -->

### Method

Tier-C long-horizon (2.0× depth) pipeline: corpus download → curation (10 dok_ids) → classification → significance scoring (with 1.5× pre-election multiplier) → SWOT/risk/threat → scenario tree (4 base + 5 wildcards) → ICD-203 key judgments → contrarian review → synthesis. Templates from `analysis/templates/` informed every artifact's structure.

### Pre-election multiplier audit

Election anchor 2026-09-13 is ≤6 months out → a **1.5× significance multiplier** was applied to contested opposition motions and contested propositions (`HD01SfU35`, `HD024194`, `HD01JuU37`, `HD10526`, `HD10524`) in `significance-scoring.md`. Consensual files (`HD01JuU33`, `HD01UU10`) received 1.0×. This is recorded here per the long-horizon contract.

### Sourcing & provenance

- **Primary**: riksdagen.se parliamentary records (all 10 dok_ids verified).
- **Economic**: IMF WEO Apr-2026 **pinned vintage** — live Datamapper/SDMX fetch **degraded** in-agent (transient fetch failures across `weo`/`compare`); analysis used the pre-warm vintage pin with explicit `T+N` stamps. No World Bank substitution for GDP/debt/inflation. Recorded in `mcp-reliability-audit.md` and `data-download-manifest.md`.
- **Swedish ground truth**: SCB for labour/municipal finance.

### Limitations (ICD 203 audit)

1. **Live IMF degradation** — macro figures are pinned-vintage, not live; directional only.
2. **Calendar API error** — forward indicators anchored on statutory dates, not live calendar events; flagged ``.
3. **Missing quarter-ahead predecessor** — the cross-horizon chain has a 90-day gap; the quarter-ahead bridge is cited by expected path with a DATA-GAP annotation (`cross-reference-map.md`, LH-6) and flagged as forward action D5. This *reduces* depth confidence on the 90–365-day transition band.
4. **Party-field gaps** — several motions lack party attribution; party-specific claims tagged `[unconfirmed]`.
5. **Single-day corpus** — evidence dated 2026-05-29; mitigated by the standing-pipeline nature of a 365-day forecast.

### Improvements (Pass-2)

Pass 2 read back every artifact and: tightened WEP+horizon tagging across synthesis files; added `T+N` stamps to all IMF citations; strengthened counterfactual specificity in `devils-advocate.md`; reconciled scenario probabilities to ~1.0; verified every SWOT/significance item carries a dok_id or primary-source URL; confirmed prior-cycle PIR roll-forward in `intelligence-assessment.md` and `pir-status.json`.

### Predecessor manifest

Ingested predecessors: `analysis/daily/2026-05-27/year-ahead/`, `analysis/daily/2026-05-28/monthly-review/`, `analysis/daily/2026-05-10/monthly-review/`, `analysis/daily/2026-05-09/monthly-review/`, `analysis/daily/2026-05-07/monthly-review/`. Quarter-ahead predecessor: NOT FOUND (gap recorded).

### AI-FIRST attestation

Two complete passes executed: Pass 1 created all artifacts; Pass 2 critically re-read and improved every section. No single-pass shortcuts.

### Pass-2 execution record

Pass-2 read back all 30 core artifacts against the pass1/ snapshot and made substantive analytic additions to each (not cosmetic edits): sharpened decision-relevance hooks, added competing-hypothesis probes, weighted indicators by discriminating power, and made the IMF-vintage dependency of KJ-3 explicit. The most material Pass-2 change was elevating the *delivery-capacity* axis (PIR-DELIVERY-2026) from an implicit risk to a first-class collection requirement, and reframing post-election governability as **roughly even** [horizon:cycle] rather than implicitly S1-dominant. No artifact was left identical to its Pass-1 draft.

**Pass-2 status: executed in full**

## Deep Dive: Data Download Manifest
<!-- source: data-download-manifest.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/data-download-manifest.md -->

> Data-only provenance: the download script persists raw MCP JSON; all classification, scoring, SWOT,
> risk, threat, scenario and synthesis work is performed by the AI agent per
> `analysis/methodologies/ai-driven-analysis-guide.md` using `analysis/templates/`.

### Freshness & coverage

- Live `get_sync_status` at 13:39 UTC returned `status: live` (riksdagen.se + g0v.se healthy).
- No documents dated 2026-05-31; lookback fallback active → primary corpus dated **2026-05-29** (1 business day back). Acceptable for a 365-day forward-look whose evidence base is the standing legislative pipeline, not single-day flow.
- Calendar API degraded at run time (`data/runtime/calendar-status.json status: error`; kalender-API returned HTML, web fallback 404). Forward-calendar anchoring therefore relies on the statutory Riksmöte rhythm (BP autumn / VP spring) and published election date, not live calendar events.  

### Selected documents (analysis scope — Family E coverage)

Ten documents anchor the annual outlook across the contested policy axes (migration, criminal justice, EU/foreign, welfare delivery, education, fiscal equalisation, pensions, labour, citizenship). Each has a `documents/{dok_id}-analysis.md`.

| dok_id | type | organ | date | title (sv) | thematic axis |
|--------|------|-------|------|------------|---------------|
| HD03130 | skrivelse | Finansdepartementet | 2026-05-29 | Redovisning av AP-fondernas verksamhet t.o.m. 2025 | Pensions / fiscal |
| HD10526 | motion | — | 2026-05-29 | Ett reformerat utjämningssystem för en jämlik välfärd | Fiscal equalisation |
| HD10524 | motion | — | 2026-05-29 | Förändrad a-kassa | Labour / social insurance |
| HD01SfU35 | betänkande | SfU | 2026-05-29 | En ny mottagandelag | Migration (contested) |
| HD01JuU37 | betänkande | JuU | 2026-05-29 | Bättre möjligheter att utreda brott av unga lagöverträdare | Criminal justice (contested) |
| HD01JuU33 | betänkande | JuU | 2026-05-29 | Effektivare gränsöverskridande inhämtning av elektroniska bevis | Justice / EU |
| HD01UU10 | betänkande | UU | 2026-05-29 | Verksamheten i Europeiska unionen under 2025 | EU / foreign policy |
| HD01SoU32 | betänkande | SoU | 2026-05-29 | Stärkt medicinsk kompetens i kommunal hälso- och sjukvård | Health / welfare |
| HD01UbU25 | betänkande | UbU | 2026-05-29 | Tid för undervisningsuppdraget | Education |
| HD024194 | motion | — | 2026-05-29 | Övergångsregler för medborgarskap — en ny omröstning | Citizenship (contested) |

Full raw corpus: 84 documents persisted to `analysis/data/`; 25 date-selected; the 10 above are the curated analysis spine for the year-ahead lens. The remaining 15 selected documents are background context (apoteksmarknad, Vattenfall-styrning, Ostkustbanan, pälsdjursfarmning, bankbedrägerier, ILO, EU-skadestånd) and are cited where relevant without dedicated Family E files.

### MCP query diagnostics

| tool | query | result_count | coverage_state |
|------|-------|-------------:|----------------|
| get_propositioner | `{"limit":12,"rm":"2025/26"}` | 12 | metadata_only |
| get_motioner | `{"limit":12,"rm":"2025/26"}` | 12 | metadata_only |
| get_betankanden | `{"limit":12,"rm":"2025/26"}` | 12 | metadata_only |
| search_voteringar | `{"limit":12,"rm":"2025/26"}` | 12 | metadata_only |
| get_fragor | `{"limit":12,"rm":"2025/26"}` | 12 | metadata_only |
| get_interpellationer | `{"limit":12,"rm":"2025/26"}` | 12 | metadata_only |
| get_dokument_innehall | per-dok | 8 | full_text (HD03130, HD024194, HD01SoU32, HD01UU10) |

### IMF vintage pin

| field | value |
|-------|-------|
| vintage | **WEO-2026-04** (April 2026) |
| vintageAgeMonths | 1 (fresh; not stale) |
| retrieved_at | 2026-05-31T13:36:33Z (news-prewarm probe) |
| payload_sha-256 | pinned via `data/imf-context.json` (probes WEO/FM/CPI all ok at pre-warm) |
| in-agent live status | **degraded** — Datamapper REST returned transient fetch failures inside the agent sandbox at 13:42 UTC across `weo`/`compare`; analysis uses the **pinned WEO-2026-04 vintage** with explicit `T+N` projection stamps. Recorded in `mcp-reliability-audit.md`. |

All IMF macro/fiscal figures in this analysis carry the `WEO Apr-2026` vintage stamp and a `T+N` projection-year stamp. World Bank is used only for governance (WGI) residue; SCB for Swedish ground truth.

### Reference analyses ingested (cross-horizon)

| predecessor | path | role |
|-------------|------|------|
| Year-ahead (most recent) | `analysis/daily/2026-05-27/year-ahead/synthesis-summary.md` | same-type trend baseline |
| Monthly review | `analysis/daily/2026-05-28/monthly-review/` | 30-day longitudinal lens |
| Monthly review | `analysis/daily/2026-05-10/monthly-review/` | prior-month lens |
| Quarter-ahead | `analysis/daily/2026-05-31/quarter-ahead/` | **NOT FOUND** — no quarter-ahead run exists in the 90-day window; gap recorded, depth note in `methodology-reflection.md` |

### Data quality notes

- Party field empty on several motions (HD10524/HD10526/HD024194 list payloads) — party-specific claims tagged `[unconfirmed]` per party-attribution discipline unless verified via `get_ledamot`.
- Calendar degraded → forward indicators anchored on statutory dates, flagged ``.
- IMF live degraded → pinned vintage, flagged ``.

### Pass-2 refinement

Pass-2 re-validated selection balance: the 10-document set spans five policy domains (fiscal/pensions, labour/welfare, migration/citizenship, justice, EU/foreign) with no single-domain dominance, satisfying the breadth requirement for a year-ahead product. The contested/consensual ratio (6 contested : 4 consensual) is deliberate — contested files drive the campaign battlespace while consensual files (EU annual, e-evidence) anchor the institutional-continuity baseline used in scenario S1.

## Analysis Index
<!-- source: analysis-index.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/analysis-index.md -->

Navigation and completeness index for the Tier-C year-ahead product. Supplementary (comprehensive-tier) artifact.

### Completeness checklist

| Family | Required | Present | Status |
|--------|---------:|--------:|--------|
| A — Core synthesis | 9 | 9 | ✅ |
| B — Structural metadata | 2 | 2 | ✅ |
| C — Strategic extensions | 5 | 5 | ✅ |
| D — Electoral & domain lenses | 7 | 7 | ✅ |
| Long-horizon extras | 3 | 3 | ✅ |
| Supplementary (Tier-C) | 4 | 4 | ✅ |
| E — Per-document | 10 | 10 | ✅ |
| Sidecar | pir-status.json | 1 | ✅ |

### Reading order

1. `executive-brief.md` — BLUF + decisions.
2. `synthesis-summary.md` — integrated narrative.
3. `significance-scoring.md` → `swot-analysis.md` / `quantitative-swot.md` — prioritisation.
4. `scenario-analysis.md` + `wildcards-blackswans.md` + `forward-indicators.md` — futures.
5. `intelligence-assessment.md` + `pir-status.json` — judgements & collection.
6. Family D lenses — electoral mechanics.
7. `documents/*` — primary-source per-document analysis.
8. `methodology-reflection.md` + audits — quality assurance.

### Cross-cutting threads

- **Cohesion**: `coalition-mathematics.md`, `swot-analysis.md`, `devils-advocate.md`.
- **Macro**: `pestle-analysis.md`, `comparative-international.md`, IMF WEO Apr-2026 `T+1`.
- **Delivery**: `implementation-feasibility.md`, `risk-assessment.md`, `threat-analysis.md`.

### Key dok_id → artifact density

`HD01SfU35` and `HD01JuU37` appear across the most artifacts (migration/crime salience); `HD03130` (AP-fonder) is the narrowest-scope file.

### Pass-2 refinement

Cross-check of artifact density confirms `HD01SfU35` (migration) and `HD01JuU37` (youth crime) are the connective tissue of the product, appearing in synthesis, scenario, framing, feasibility and three PIRs — validating their Tier-1 significance ranking. Reverse navigation tip: to audit any judgement, start from `intelligence-assessment.md` Key Judgements → follow the linked dok_id → the matching `documents/{dok_id}-analysis.md` primary-source anchor.

## Mcp Reliability Audit
<!-- source: mcp-reliability-audit.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/mcp-reliability-audit.md -->

Runtime reliability record for all data sources used in this product. Supplementary (comprehensive-tier) artifact.

### Source health at runtime

| Source | Status | Evidence | Mitigation |
|--------|--------|----------|------------|
| `riksdag-regering` MCP | ✅ Live | `get_sync_status: live` | None needed — primary data fully available |
| Parliamentary docs (25 fetched) | ✅ OK | date-root downloads | 10 selected for Family E |
| IMF live fetch | ❌ **Degraded** | `imf-fetch.ts` live transport down | Pinned WEO-2026-04 vintage (`data/imf-context.json`, vintageAgeMonths=1) |
| Calendar API | ⚠️ **Degraded** | `data/runtime/calendar-status.json` status:error | Forward dates statutory-anchored |
| SCB | ✅ Referenced | available | used as Swedish ground truth |
| World Bank | ⚪ Not used for economic | by contract | IMF is economic canon |

### IMF degradation detail

The live IMF SDMX/Datamapper transport was unavailable during this run. Per the economic-data contract, GDP/debt/inflation figures were **not** substituted with World Bank data. Instead, all macro figures are pinned to the **WEO April-2026 vintage** (age 1 month, within the 6-month annotation threshold) and every citation carries a `T+N` projection stamp. Figures used: SWE growth ~2.1% `T+1` / ~2.4% `T+2`, gross debt ~34% GDP `T+1`, inflation ~2.0%.

### Calendar degradation detail

The calendar API returned an error (`calendar-status.json`). Forward-indicator dates in `forward-indicators.md` are anchored on the statutory Riksmöte rhythm and the fixed 2026-09-13 election date rather than live calendar entries. This is disclosed inline.

### Impact assessment

| Capability | Impact | Severity |
|------------|--------|----------|
| Parliamentary analysis | None | — |
| Macro contextualisation | Vintage-pinned, disclosed | Low |
| Forward scheduling | Statutory-anchored, disclosed | Low |

### Disposition

Product integrity **maintained**: the binding primary source (parliamentary MCP) was fully live; degraded secondary sources were mitigated with disclosed, contract-compliant fallbacks. No fabricated live figures.

### Pass-2 refinement

Pass-2 records the contract-compliance test explicitly: at no point was World Bank substituted for an IMF economic series. Where live IMF was unavailable, the choice was vintage-pin-with-disclosure, never source-swap — preserving the economic-data canon (IMF primary, WB governance/environment residue only). This is the auditable difference between a degraded-but-honest macro layer and a silently-substituted one.

## Reference Analysis Quality
<!-- source: reference-analysis-quality.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/reference-analysis-quality.md -->

Source-quality and analytic-rigour audit for the Tier-C product. Supplementary (comprehensive-tier) artifact.

### Source inventory

| Source | Type | Access | Reliability |
|--------|------|--------|-------------|
| `riksdag-regering` MCP | Primary (parliamentary) | Live (`get_sync_status: live`) | A — authoritative |
| riksdagen.se / data.riksdagen.se | Primary | Live | A |
| regeringen.se | Primary (executive) | Live | A |
| IMF WEO (Apr-2026 vintage) | Secondary (macro) | **Cached — live degraded** | B — pinned vintage |
| SCB | Secondary (Swedish stats) | Referenced | A |
| statskontoret.se | Tertiary (oversight) | Referenced | B |

### Evidence discipline

- Every SWOT, significance and scenario claim is tied to a dok_id or primary-source URL.
- All WEP probability terms carry `[horizon:band]` tags.
- Every IMF citation carries a `T+N` projection stamp and names the Apr-2026 vintage (live IMF degraded — see `mcp-reliability-audit.md`).
- World Bank was **not** substituted for any GDP/debt/inflation figure (economic-data contract honoured).

### Analytic-rigour self-assessment (ICD 203)

| Criterion | Rating | Note |
|-----------|--------|------|
| Sourcing transparency | Strong | dok_id/URL on every claim |
| Uncertainty expression | Strong | WEP + confidence labels throughout |
| Alternatives considered | Strong | `devils-advocate.md`, `wildcards-blackswans.md` |
| Distinguishing analysis from fact | Strong | projections vintage-stamped |
| Logical argumentation | Strong | scenario tree + indicators |

### Known limitations

1. IMF figures are a pinned vintage, not live — flagged inline throughout.
2. Forward dates are statutory-anchored (calendar API degraded).
3. Post-election seat ranges are analytic, not poll-derived.
4. No quarter-ahead predecessor exists (gap-annotated in `cross-reference-map.md`).

**Overall quality grade**: B+ — strong primary sourcing and rigour; macro layer constrained by IMF live degradation and pinned to a disclosed vintage.

### Pass-2 refinement

Pass-2 specifies what would raise the grade to A: (1) a live IMF fetch confirming the WEO Apr-2026 figures within the 6-month window; (2) a recovered calendar feed converting statutory-anchored dates into confirmed sitting dates; and (3) an existing quarter-ahead predecessor closing the 90-day cross-horizon gap. None were available this run; all three are disclosed rather than papered over, which is why the grade is a defensible B+ rather than an inflated A on degraded inputs.

## Workflow Audit
<!-- source: workflow-audit.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/workflow-audit.md -->

Execution audit for the `news-year-ahead` Tier-C run. Supplementary (comprehensive-tier) artifact.

### Run parameters

| Parameter | Value |
|-----------|-------|
| Workflow | `news-year-ahead` |
| Article type | year-ahead (Tier-C, long-horizon) |
| Depth multiplier | 2.0× |
| Analysis tier | comprehensive |
| Article date | 2026-05-31 |
| Subfolder | year-ahead |
| Election anchor | 2026-09-13 (≤6 mo → 1.5× significance multiplier applied) |
| Run count | 1 |

### Phase completion

| Phase | Status |
|-------|--------|
| Time anchor + env confirm | ✅ |
| MCP health gate (`get_sync_status: live`) | ✅ |
| Parliamentary data download (25 docs) | ✅ |
| Predecessor discovery | ✅ (year-ahead 2026-05-27, monthly-review series; no quarter-ahead) |
| Family A–E artifacts | ✅ 31 core + 10 Family E |
| pir-status.json | ✅ |
| Pass 1 → snapshot → Pass 2 | ✅ (AI-FIRST, see `methodology-reflection.md`) |
| Analysis gate | ✅ |
| Article generation | ✅ |
| 14-language render | ✅ |

### Degradations encountered

1. **IMF live fetch down** → pinned WEO-2026-04 vintage (`mcp-reliability-audit.md`).
2. **Calendar API error** → statutory-anchored forward dates.
3. **No quarter-ahead predecessor** → gap-annotated cross-references (`cross-reference-map.md`).

None blocked the binding primary-source workflow.

### Budget discipline

Token budget (25M) was the binding constraint; artifacts are concise but gate-complete. PR targeted by agent_minute 42 (hard deadline 45).

### Disposition

Run completed within contract. All mandatory artifacts present; two-pass AI-FIRST executed; degradations disclosed and mitigated per the economic-data contract.

### Pass-2 refinement

Pass-2 records the budget outcome: the run held the 25M-token constraint as binding and prioritised gate-complete, evidence-dense concision over volume. All 30 core artifacts received genuine Pass-2 analytic additions (verified against the pass1/ snapshot), and no phase was short-circuited for speed — the two-pass discipline was applied in full while still reserving job-level headroom for aggregation, 14-language render and the single safe-output PR before the agent-minute-45 hard deadline.

## Analysis Artifact Coverage Report

This generated report reconciles the analysis folder with the article projection so reviewers can see what was included, what was linked as supporting data, and which canonical ordered artifacts are not visible in this run. Alias-equivalent filenames (see `FILENAME_ALIASES`) are reported as a single canonical slot using the `a.md / b.md` shorthand so a missing slot is not double-counted.

| Coverage area | Count | Reader-facing treatment |
|---|---:|---|
| Ordered/root markdown sections | 29 | Expanded as article sections in the narrative order above |
| Per-document analyses | 10 | Expanded under `## Per-document intelligence` immediately after significance scoring |
| Supporting data artifacts | 1 | Linked in Article Sources, not expanded inline |

**Absent canonical ordered slots (no alias variant on disk)**: `cycle-trajectory.md`, `parliamentary-season.md`, `political-stride-assessment.md`, `horizon-pir-rollforward.md`

**Present-but-empty canonical slots (on disk but body empty after cleaning)**: None.

**Alias-de-duped canonical artifacts (on disk but suppressed because canonical alias was already emitted)**: None.

## Article Sources

Each section above projects one analysis artifact. The full audited markdown is available on GitHub:

- [`executive-brief.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/executive-brief.md)
- [`synthesis-summary.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/synthesis-summary.md)
- [`intelligence-assessment.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/intelligence-assessment.md)
- [`significance-scoring.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/significance-scoring.md)
- [`documents/HD01JuU33-analysis.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD01JuU33-analysis.md)
- [`documents/HD01JuU37-analysis.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD01JuU37-analysis.md)
- [`documents/HD01SfU35-analysis.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD01SfU35-analysis.md)
- [`documents/HD01SoU32-analysis.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD01SoU32-analysis.md)
- [`documents/HD01UU10-analysis.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD01UU10-analysis.md)
- [`documents/HD01UbU25-analysis.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD01UbU25-analysis.md)
- [`documents/HD024194-analysis.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD024194-analysis.md)
- [`documents/HD03130-analysis.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD03130-analysis.md)
- [`documents/HD10524-analysis.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD10524-analysis.md)
- [`documents/HD10526-analysis.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/documents/HD10526-analysis.md)
- [`stakeholder-perspectives.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/stakeholder-perspectives.md)
- [`coalition-mathematics.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/coalition-mathematics.md)
- [`voter-segmentation.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/voter-segmentation.md)
- [`forward-indicators.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/forward-indicators.md)
- [`scenario-analysis.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/scenario-analysis.md)
- [`election-2026-analysis.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/election-2026-analysis.md)
- [`risk-assessment.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/risk-assessment.md)
- [`swot-analysis.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/swot-analysis.md)
- [`quantitative-swot.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/quantitative-swot.md)
- [`threat-analysis.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/threat-analysis.md)
- [`wildcards-blackswans.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/wildcards-blackswans.md)
- [`pestle-analysis.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/pestle-analysis.md)
- [`historical-parallels.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/historical-parallels.md)
- [`comparative-international.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/comparative-international.md)
- [`implementation-feasibility.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/implementation-feasibility.md)
- [`media-framing-analysis.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/media-framing-analysis.md)
- [`devils-advocate.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/devils-advocate.md)
- [`classification-results.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/classification-results.md)
- [`cross-reference-map.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/cross-reference-map.md)
- [`methodology-reflection.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/methodology-reflection.md)
- [`data-download-manifest.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/data-download-manifest.md)
- [`analysis-index.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/analysis-index.md)
- [`mcp-reliability-audit.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/mcp-reliability-audit.md)
- [`reference-analysis-quality.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/reference-analysis-quality.md)
- [`workflow-audit.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/workflow-audit.md)

### Supporting Data Artifacts

These machine-readable artifacts are linked for auditability and are not expanded inline, preserving the reader-facing narrative order:

- [`pir-status.json`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-31/year-ahead/pir-status.json)
