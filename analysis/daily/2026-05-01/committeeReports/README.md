# README — Committee Reports Analysis 2026-05-01

**Folder**: `analysis/daily/2026-05-01/committeeReports/`
**Generated**: 2026-05-01T05:00:00Z
**Effective analysis date**: 2024/25 riksmöte final week (June 2025)
**Type**: Tier-C Aggregation (14 artifacts + per-document files)

## Overview

This folder contains the complete political intelligence analysis of the Swedish Riksdag committee reports (betänkanden) for the 2024/25 riksmöte final week. The analysis was triggered for ARTICLE_DATE=2026-05-01 but applies a lookback fallback per `03-data-download.md §Lookback` as no new betänkanden exist for that date.

**Key documents analysed**: 10 betänkanden from Finance (FiU), Social Affairs (SfU), Social Services (SoU), Constitutional (KU), Civil Law (CU), Transport (TU), Tax (SkU) committees.

## Artifact Index

### Family A — Core Analysis
| File | Description | Status |
|------|-------------|--------|
| `executive-brief.md` | BLUF, key decisions, 60-second bullets | ✅ |
| `synthesis-summary.md` | DIW-weighted synthesis, integrated picture | ✅ |
| `significance-scoring.md` | 10-document DIW scoring, priority tiers | ✅ |
| `classification-results.md` | 7-dimension classification per document | ✅ |
| `stakeholder-perspectives.md` | 6-lens stakeholder matrix | ✅ |
| `risk-assessment.md` | 5-dimension risk register, cascade chain | ✅ |
| `threat-analysis.md` | Threat actor matrix, attack tree, TTPs | ✅ |

### Family B — Evidence and Provenance
| File | Description | Status |
|------|-------------|--------|
| `data-download-manifest.md` | Full provenance, full-text outcomes | ✅ |
| `cross-reference-map.md` | Policy clusters, legislative chains | ✅ |

### Family C — Alternative Analysis
| File | Description | Status |
|------|-------------|--------|
| `scenario-analysis.md` | 3 scenarios (A/B/C), P=40/45/15% | ✅ |
| `comparative-international.md` | Denmark, Germany, Netherlands comparators | ✅ |
| `devils-advocate.md` | H1/H2/H3 competing hypotheses (ACH) | ✅ |
| `intelligence-assessment.md` | 6 Key Judgements + 5 PIRs | ✅ |
| `methodology-reflection.md` | ICD 203 audit, 3 improvements | ✅ |

### Family D — Electoral and Forward Analysis
| File | Description | Status |
|------|-------------|--------|
| `election-2026-analysis.md` | Seat projections, coalition viability | ✅ |
| `voter-segmentation.md` | Demographic/regional segments | ✅ |
| `coalition-mathematics.md` | Seat map, pivotal vote analysis | ✅ |
| `historical-parallels.md` | 3 named precedents (GFC 2008, Tidö, Apotek) | ✅ |
| `media-framing-analysis.md` | Per-party + press framing | ✅ |
| `implementation-feasibility.md` | Delivery risk, Statskontoret relevance | ✅ |
| `forward-indicators.md` | 15 dated indicators across 4 horizons | ✅ |

### Sidecar Files
| File | Description | Status |
|------|-------------|--------|
| `pir-status.json` | PIR completion status (gate check 9) | ✅ |
| `swot-analysis.md` | SWOT + TOWS matrix | ✅ |

### Per-Document Files (`documents/`)
| File | Document | Status |
|------|----------|--------|
| `HC01FiU20-analysis.md` | Vårproposition economic framework | ✅ |
| `HC01FiU24-analysis.md` | Riksbank evaluation | ✅ |
| `HC01SfU22-analysis.md` | Detention coercive powers | ✅ |
| `HC01FiU33-analysis.md` | APL pharma acquisition | ✅ |
| `HC01SoU29-analysis.md` | Fritidskort | ✅ |

### Pass 1 Snapshot (`pass1/`)
Initial pass snapshots stored for iterative improvement tracking.

## Key Intelligence Findings

1. **SD leverage at peak**: Sverigedemokraterna has achieved maximum policy leverage through HC01SfU22 (SfU22 detention powers). [KJ-2, A2]
2. **US tariff shock primary economic risk**: HC01FiU20 formally acknowledges lågkonjunktur driven by trade uncertainty. [KJ-1, A2]  
3. **APL acquisition justified but monitoring required**: HC01FiU33 is primarily security-driven but without performance benchmarks. [KJ-4, A2]
4. **SfU22 legal durability moderate**: ECHR challenge probability ~25% significant modification. [KJ-3, B3]
5. **2026 election trajectory**: Continuity under Scenario B (P=45%) with SD consolidation. [KJ-5, B3]

## Collection Gaps
- IMF WEO Apr-2026 cache unavailable (economic claims from betänkande context)
- Voteringar for FiU20/SfU22/FiU33 not retrieved (API bet= parameter quirk)
- 7 of 10 documents without full text
- Lagrådet SfU22 consultation status unconfirmed
