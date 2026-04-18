# 📚 Weekly Review Analysis Package — Riksdag Week 16, 2026

| Field | Value |
|-------|-------|
| **Folder** | `analysis/daily/2026-04-18/weekly-review/` |
| **Run ID** | WKR-2026-W16 |
| **Period Covered** | 2026-04-11 — 2026-04-17 (Riksmöte 2025/26) |
| **Generated** | 2026-04-18 |
| **Quality Tier** | 🟦 **Reference-Grade Exemplar** (per `ai-driven-analysis-guide.md` v5.1 Rule 7) |
| **Methodologies** | DIW v1.0 · TOWS · STRIDE · Attack-Tree · Kill Chain · Diamond · ACH · Bayesian · Scenario Analysis · Comparative Politics |
| **Documents in Pipeline** | 11 dok files persisted + economic-data.json + ≈150 documents tagged in weekly catalog |
| **Lead Decision** | Spring Fiscal Trilogy (HD03100 + HD0399 + HD03236) — DIW-weighted **10.0** · with KU33 (constitutional press-freedom narrowing, weighted **9.80**) as binding co-prominent thread |
| **Classification** | Public · Time-to-read for full package ≈ 60 min · Executive brief ≤ 4 min |
| **Author** | News Journalist agent (Copilot, claude-opus-4.7) under James Pether Sörling editorial responsibility |

---

## 🎯 Purpose of This Package

This is a **reference-grade weekly intelligence package** covering the most legislatively consequential week of Sweden's 2025/26 spring term. The week aggregates four interlocking developments — the Spring Fiscal Package, the Ukraine accountability architecture (HD03231 + HD03232), the constitutional press-freedom amendments (HD01KU32 + HD01KU33), and a coordinated migration / criminal-justice tightening — into a single pre-election political‑intelligence picture.

The package was upgraded on 2026-04-18 to the **realtime-1434 reference-exemplar bar** following the merge of the analysis & articles improvement PR. Every analytical file:

- Carries an explicit **5-level confidence scale** (⬛ VERY LOW · 🟥 LOW · 🟧 MEDIUM · 🟩 HIGH · 🟦 VERY HIGH)
- Cites **dok_id evidence** for every major claim
- Includes **color-coded Mermaid diagrams** with real data
- Applies **Democratic-Impact Weighting (DIW)** to lead-story selection
- Names a **methodology footer** (specific guide(s) applied)
- Cross-references siblings in this folder
- Concludes with a **next-watchpoint window** with explicit triggers

---

## 🗺️ How to Read This Package — Reading Orders by Audience

| If you are a … | Read these files in this order | Time |
|---------------|-------------------------------|:----:|
| **Newsroom editor** (publication decision) | `executive-brief.md` → `synthesis-summary.md` (§Lead-Story Decision + §Top-5 Developments) → `significance-scoring.md` | 8 min |
| **Policy advisor** (briefing senior officials) | `executive-brief.md` → `synthesis-summary.md` → `risk-assessment.md` → `scenario-analysis.md` → `comparative-international.md` | 25 min |
| **Political intelligence analyst** (full picture) | All 14 files in numerical order below | 60 min |
| **Tracker / monitor** (forward indicators only) | `risk-assessment.md` §90-Day Calendar → `synthesis-summary.md` §Forward Indicators → `scenario-analysis.md` §Monitoring Indicators | 12 min |
| **Methodology owner** (template / process review) | `methodology-reflection.md` → `data-download-manifest.md` → `synthesis-summary.md` (DIW table) | 18 min |
| **Cross-bloc journalist** (international context) | `comparative-international.md` → `stakeholder-perspectives.md` → `synthesis-summary.md` | 22 min |

---

## 📁 File Index (14 files)

### Tier-A — Decision-Maker Reference
| # | File | Purpose | Length |
|:-:|------|---------|:------:|
| 1 | [`README.md`](README.md) | This index — entry point and reading orders | — |
| 2 | [`executive-brief.md`](executive-brief.md) | One-page TL;DR for editors / policy advisors | ~250 lines |
| 3 | [`synthesis-summary.md`](synthesis-summary.md) | Master narrative · DIW lead-story decision · cluster map · forward indicators | ~340 lines |

### Tier-B — Core Analytical Artefacts
| # | File | Purpose | Length |
|:-:|------|---------|:------:|
| 4 | [`significance-scoring.md`](significance-scoring.md) | 5-dimension raw + DIW-weighted scoring of all 23 documents tracked, sensitivity analysis | ~250 lines |
| 5 | [`classification-results.md`](classification-results.md) | Per-document CIA-triad, urgency, domain classification | ~200 lines |
| 6 | [`swot-analysis.md`](swot-analysis.md) | Government SWOT + 6 stakeholder lenses (S, V, C, SD, MP, KD/L/Government) + cross-bloc TOWS | ~300 lines |
| 7 | [`risk-assessment.md`](risk-assessment.md) | 8 risk indicators · 90-day calendar · coalition-fragility quadrant · Bayesian update rules · ALARP ladder | ~280 lines |
| 8 | [`threat-analysis.md`](threat-analysis.md) | STRIDE + Attack-Tree + Kill Chain + Diamond Model on Russian hybrid, constitutional gap, ECHR challenge | ~280 lines |
| 9 | [`stakeholder-perspectives.md`](stakeholder-perspectives.md) | 6-lens stakeholder matrix · party perspectives · civil society · international · Election 2026 lens | ~280 lines |
| 10 | [`cross-reference-map.md`](cross-reference-map.md) | 6 thematic clusters · Mermaid policy mindmap · cross-cluster linkages · prior-run continuity | ~220 lines |

### Tier-C — Reference-Grade Extensions (new 2026-04-18)
| # | File | Purpose | Length |
|:-:|------|---------|:------:|
| 11 | [`scenario-analysis.md`](scenario-analysis.md) | 3 base scenarios (continuity / opposition success / coalition collapse) + 2 wildcards · 90-day priors | ~210 lines |
| 12 | [`comparative-international.md`](comparative-international.md) | Nordic + EU benchmarks: fiscal stance, migration regimes, constitutional change, Ukraine accountability | ~250 lines |
| 13 | [`methodology-reflection.md`](methodology-reflection.md) | Self-audit: methodologies applied, uncertainty hot-spots, known limitations, codification recommendations | ~240 lines |
| 14 | [`data-download-manifest.md`](data-download-manifest.md) | Provenance · MCP source attribution · 11 persisted dok files + economic-data.json | ~150 lines |

> The `documents/` subfolder contains the 11 raw dok JSON files (HD01CU22, HD01CU27, HD01CU28, HD01CU42, HD01KU32, HD01KU33, HD024098, HD10437, HD10438, HD11718, HD11719) plus `economic-data.json` (World Bank GDP / unemployment time series).

---

## 🏛️ Lead-Story Decision — At a Glance

> **Decision** `[HIGH]`: The week's lead story is the **Spring Fiscal Package** (Vårproposition `HD03100` + Vårändringsbudget `HD0399` + Extra ändringsbudget `HD03236`). It scores **10.0 weighted** under DIW v1.0 — the highest single rank of the week — and frames the entire pre‑election fiscal narrative.
>
> The **Constitutional Press-Freedom Reforms** (`HD01KU32` + `HD01KU33`) score **8.75 / 9.80 weighted** and are mandatory **co-prominent secondary coverage** under the Coverage-Completeness Rule (≥ 7.0 weighted). The grundlag carries higher *democratic-infrastructure durability* than the fiscal package, but the fiscal package carries higher *immediate electoral and citizen-impact magnitude* during a budget week ⇒ both the DIW-applied scoring and the editorial decision converge here.
>
> **Ukraine Accountability** (`HD03231` Special Tribunal + `HD03232` Damages Commission, weighted 8.55 / 7.60) and the **Migration / Criminal-Justice tightening** (`HD03246` + `HD01SfU22`, weighted 9.0 / 8.55) are also above the 7.0 coverage gate — they appear as dedicated H3 sections in the published article.

The **lead-story rationale**, the **DIW table**, and **sensitivity analysis** under five plausible weighting variants live in [`significance-scoring.md`](significance-scoring.md). The **Top-5 Developments** ranking lives in [`synthesis-summary.md`](synthesis-summary.md).

---

## 📋 Top-Line Findings (Copy-Paste Safe)

1. **Spring Fiscal Trilogy** dominates the week. Vårproposition + Vårändringsbudget + Extra ändringsbudget (fuel-tax cut + el/gas relief). Backdrop: Sweden 0.82 % GDP growth 2024 (vs Denmark 3.5 %, Norway 2.1 %, Finland 0.4 %); unemployment 8.7 % 2025 (highest since pandemic). `[VERY HIGH]`
2. **Razor-thin coalition validation**: JuU15 (criminal-justice) passed 145–142 — pure bloc vote, zero cross-aisle defections, 3-vote government margin. The thinnest functional majority of the spring term. `[VERY HIGH]`
3. **Ukraine accountability architecture** completed as a twin package: HD03231 (Special Tribunal — first aggression tribunal since Nuremberg) + HD03232 (International Compensation Commission). Cross-party consensus ≈ 349 MPs. `[VERY HIGH]`
4. **Constitutional press-freedom amendments** (HD01KU32 + HD01KU33) at first reading. Two-election rule (8 kap. RF) means the 2026 valrörelse becomes a de-facto referendum on the second reading. KU33 is the first substantive narrowing of TF (1766) in years. `[HIGH]`
5. **Migration tightening triple**: SfU22 inhibition orders + Prop 235 (deportation expansion) + Prop 229 (new reception law) attract coordinated three-party opposition (V + C + MP) with simultaneous counter-motions — a prepared ECHR-litigation strategy. `[HIGH]`
6. **Energy / green-transition tension**: Prop 240 (electricity-system rewrite) + Prop 239 (wind-power municipal revenue sharing) signal serious climate ambition; the Extra Amendment Budget fuel-tax cut sits in obvious rhetorical tension with both. `[HIGH]`
7. **NATO eFP Finland**: 1,200 Swedish troops deployed (HD01UFöU3) — first major operational expression of NATO membership. `[VERY HIGH]`
8. **Average weekly significance 7.5 / 10**, exceptional vs the parliamentary-week baseline (~3.8). Week 16 sits in the top 5 % of legislatively-loaded weeks since 2010. `[HIGH]`

---

## 🛡️ Methodology Provenance

Each file contains its own methodology footer naming the specific guide(s) applied. The package as a whole follows:

- [`analysis/methodologies/ai-driven-analysis-guide.md`](../../../methodologies/ai-driven-analysis-guide.md) **v5.1** — master protocol (Rules 0–8, including DIW Rule 5, Reference-Grade Tiers Rule 6, Self-Audit Rule 7, Comparative Benchmarking Rule 8)
- [`analysis/methodologies/political-swot-framework.md`](../../../methodologies/political-swot-framework.md) **v3.0** — TOWS interference matrix
- [`analysis/methodologies/political-risk-methodology.md`](../../../methodologies/political-risk-methodology.md) **v2.x** — Bayesian, ALARP, cascading-risk
- [`analysis/methodologies/political-threat-framework.md`](../../../methodologies/political-threat-framework.md) **v2.0** — STRIDE, Attack Tree, Kill Chain, Diamond
- [`analysis/methodologies/political-classification-guide.md`](../../../methodologies/political-classification-guide.md) **v3.0** — CIA triad, sensitivity tiers
- [`analysis/methodologies/political-style-guide.md`](../../../methodologies/political-style-guide.md) — evidence density, attribution conventions

The reference exemplar against which this package was benchmarked: [`analysis/daily/2026-04-17/realtime-1434/`](../../2026-04-17/realtime-1434/).

---

## 🔁 Update / Re-Review Cycle

| Trigger | Action | Owner |
|---------|--------|-------|
| Lagrådet yttrande on KU32/KU33 published | Bayesian-update R2 in `risk-assessment.md`; refresh `scenario-analysis.md` priors | Analyst on duty |
| Riksdag chamber vote on HD03236 / FiU48 (Extra budget, scheduled 2026-04-22) | Refresh `synthesis-summary.md` §Vote Tracker | Analyst on duty |
| KU annual granskning hearings open (2026-04-27) | Risk-assessment R2 + R4 update (parliamentary accountability + coalition discipline) | Analyst on duty |
| Sep 2026 election results | Full package re-review; scenario tree collapses to one branch | Methodology owner |
| Quarterly methodology sweep (next 2026-07-18) | Review whether new doctrine has shifted DIW weights | CEO + methodology owner |

**Next package review (event-driven)**: First Bayesian update window expected before 2026-04-25.

---

## ✅ Quality Gate Checklist (filled per `ai-driven-analysis-guide.md` v5.1 §Rule 4 + §Rule 6)

| Requirement | Met? | Where Verified |
|-------------|:----:|----------------|
| ≥ 1 color-coded Mermaid diagram per file | ✅ | All 13 analysis files |
| 5-level confidence scale (⬛ / 🟥 / 🟧 / 🟩 / 🟦) | ✅ | Visible in scoring + risk + threat tables |
| Election 2026 lens in every analytical file | ✅ | Mandatory section in all Tier-A/B files |
| DIW weighting applied to significance | ✅ | `significance-scoring.md` §Five-Dimension Scoring |
| ≥ 6 stakeholder perspectives in SWOT | ✅ | `swot-analysis.md` §Stakeholder Perspectives |
| ≥ 8 risk indicators with Bayesian update rules | ✅ | `risk-assessment.md` §Top Risk Indicators + §Bayesian Updates |
| ≥ 6 thematic clusters in cross-reference | ✅ | `cross-reference-map.md` §Thematic Clusters |
| ≥ 6 jurisdictions in comparative-international | ✅ | `comparative-international.md` §Nordic + EU + UK + DE |
| Cross-references between sibling files | ✅ | All files contain inline links |
| Methodology footer on every file | ✅ | Final paragraph of each file |
| 5 reference-grade extensions present | ✅ | README + executive-brief + scenarios + comparative + methodology-reflection |

---

**Classification**: Public · **Next Review**: 2026-04-25 (event-driven) · **Methodology**: `analysis/methodologies/ai-driven-analysis-guide.md` v5.1 (Rules 0–8 applied)
