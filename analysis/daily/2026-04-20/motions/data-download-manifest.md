# Data Download Manifest — Opposition Motions
**Date**: 2026-04-20 | **Riksmöte**: 2025/26 | **Analyst**: news-motions workflow
**Analysis Timestamp**: 2026-04-20 13:09 UTC

---

## 📦 Data Sources Used

| Source | MCP Tool | Documents Fetched | Date Range | Quality |
|--------|----------|-------------------|------------|---------|
| Riksdagen motions API | `get_motioner` | 30 documents | 2025/26 riksmöte | GOOD |
| Riksdagen document content | `get_dokument_innehall` | 3 documents (snippet) | April 14-17 | PARTIAL |
| World Bank economic data | `world-bank.get-economic-data` | 2 indicators (GDP, unemployment) | 2021-2025 | GOOD |
| Parliamentary speeches | `search_anforanden` | 0 matches (search limitation) | 2025/26 | N/A |

---

## 📋 Documents Selected for Analysis

### Primary Analysis Set (April 14–17, 2026 — not in previous run)

**Immigration Cluster — New Reception Law (prop. 2025/26:229)**:
- HD024080: mot. 2025/26:4080 — Ida Karkiainen m.fl. (S) — 2026-04-15
- HD024087: mot. 2025/26:4087 — Annika Hirvonen m.fl. (MP) — 2026-04-15
- HD024089: mot. 2025/26:4089 — Niels Paarup-Petersen m.fl. (C) — 2026-04-15
- HD024076: mot. 2025/26:4076 — Tony Haddou m.fl. (V) — 2026-04-13

**Immigration Cluster — Stricter Deportation (prop. 2025/26:235)**:
- HD024090: mot. 2025/26:4090 — Tony Haddou m.fl. (V) — 2026-04-16
- HD024097: mot. 2025/26:4097 — Annika Hirvonen m.fl. (MP) — 2026-04-16
- HD024095: mot. 2025/26:4095 — Niels Paarup-Petersen m.fl. (C) — 2026-04-16

**Integration/Housing (prop. 2025/26:215)**:
- HD024077: mot. 2025/26:4077 — Tony Haddou m.fl. (V) — 2026-04-14
- HD024079: mot. 2025/26:4079 — Ardalan Shekarabi m.fl. (S) — 2026-04-15
- HD024086: mot. 2025/26:4086 — Leila Ali Elmi m.fl. (MP) — 2026-04-15

**Fiscal/Climate — Fuel Tax Cut (prop. 2025/26:236)**:
- HD024082: mot. 2025/26:4082 — Mikael Damberg m.fl. (S) — 2026-04-15
- HD024098: mot. 2025/26:4098 — Janine Alm Ericson m.fl. (MP) — 2026-04-17

**Justice — Crime Victims (prop. 2025/26:222)**:
- HD024078: mot. 2025/26:4078 — Joakim Järrebring m.fl. (S) — 2026-04-15
- HD024084: mot. 2025/26:4084 — Andreas Lennkvist Manriquez m.fl. (V) — 2026-04-15
- HD024085: mot. 2025/26:4085 — Ulrika Westerlund m.fl. (MP) — 2026-04-15

**Healthcare (prop. 2025/26:216)**:
- HD024081: mot. 2025/26:4081 — Fredrik Lundh Sammeli m.fl. (S) — 2026-04-15
- HD024083: mot. 2025/26:4083 — Karin Rågsjö m.fl. (V) — 2026-04-15
- HD024094: mot. 2025/26:4094 — Christofer Bergenblock m.fl. (C) — 2026-04-16

**Arms Export (prop. 2025/26:228)**:
- HD024091: mot. 2025/26:4091 — Håkan Svenneling m.fl. (V) — 2026-04-16
- HD024096: mot. 2025/26:4096 — Jacob Risberg m.fl. (MP) — 2026-04-16

**Consumer Finance (prop. 2025/26:223)**:
- HD024088: mot. 2025/26:4088 — Alireza Akhondi m.fl. (C) — 2026-04-15

---

## 📊 Data Quality Notes

- **Full text**: Not available (text field returned null in all get_dokument_innehall calls); snippets available confirm document metadata
- **Summary quality**: Good — summaries include party, leading signatory, committee referral, and key policy decisions
- **Economic context**: World Bank data for Sweden confirmed (GDP growth 0.82% 2024, unemployment 8.69% 2025)
- **Speeches**: No matching speeches found for these specific motions via search_anforanden (search API limitation)

---

## ✅ Analysis Artifacts Generated (Reference-Exemplar File Set)

### Top-level synthesis & navigation
- [x] `README.md` — folder index, DIW-ranked reading order
- [x] `executive-brief.md` — 1-page decision-maker BLUF + 14-day watch window
- [x] `synthesis-summary.md` — master synthesis (BLUF, ACH, Red-Team, cross-cluster interference, analyst-confidence meter)

### Specialist-audience artifacts
- [x] `scenario-analysis.md` — ACH 3 hypotheses + 4-scenario tree + Bayesian priors + Red-Team critique
- [x] `comparative-international.md` — 4 policy axes × 8+ peer jurisdictions (Nordic + DE/NL/FR + RSF/V-Dem + EU law)
- [x] `methodology-reflection.md` — reference-exemplar self-audit + Rule 1–10 compliance matrix

### Analytic pillars (all L2 or better)
- [x] `classification-results.md` — 21 motions taxonomy + L-tier assignment
- [x] `significance-scoring.md` — Raw + DIW-weighted scoring + sensitivity analysis
- [x] `swot-analysis.md` — 4-cluster SWOT + **TOWS interference matrix** (4 critical WT vulnerabilities)
- [x] `risk-assessment.md` — 15 risks with L×I + ALARP + Bayesian priors + risk-interconnection graph
- [x] `threat-analysis.md` — 6 threats + Attack-Tree + Kill-Chain + Diamond Model + STRIDE-adapted
- [x] `stakeholder-perspectives.md` — 8 groups + 37-actor registry + influence network + fracture-probability tree
- [x] `cross-reference-map.md` — proposition → motion matrix + party coordination network

### Cluster-level deep dives (per-document L2+)
- [x] `documents/reception-law-cluster-analysis.md` — LEAD 4-party cluster L2+
- [x] `documents/deportation-cluster-analysis.md` — co-LEAD 3-party triangulation L2+
- [x] `documents/fuel-tax-cluster-analysis.md` — climate-fiscal cluster L2
- [x] `documents/arms-export-cluster-analysis.md` — post-NATO cluster L2

### Data
- [x] `economic-data.json` — World Bank Sweden macroeconomic context
