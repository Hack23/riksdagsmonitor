# Cross-Reference Map — Year-Ahead 2026-05-07

## Document-to-Artifact Cross-Reference

| dok_id | executive-brief | synthesis | significance | swot | risk | threat | stakeholder | scenario | forward-indicators | election |
|--------|----------------|-----------|-------------|------|------|--------|-------------|----------|-------------------|---------|
| HD03250 | §2 | Theme 2 | CRITICAL 150 | S5/W5/O4 | R03 | T-S2/T-E2 | §4/§8 | Sc-A/Sc-B | FI-03/FI-07 | EA-07 |
| HD03261 | §2 | Theme 2 | HIGH 54 | S1/W1 | R09 | T-T1 | §4/§7 | All | FI-04 | EA-07 |
| HD03267 | §1 | Theme 1 | CRITICAL 150 | W3/T4 | R05 | T-R1 | §2/§5 | Sc-A/Sc-B/Sc-C | FI-05 | EA-04 |
| HD01JuU32 | §1 | Theme 1 | HIGH 90 | S3/T1 | R01 | T-D2 | §3/§8 | All | FI-01 | EA-03 |
| HD01JuU34 | §1 | Theme 1 | HIGH 54 | S4 | R07 | T-R1 | §6 | Sc-A/Sc-B | FI-06 | — |
| HD01JuU39 | §1 | Theme 1 | MEDIUM 48 | S1/W1 | R08 | — | §5 | All | — | — |
| HD01FiU37 | §3 | Theme 3 | HIGH 112 | S2/W1/T3 | R06 | T-T2 | §4 | Sc-A/Sc-D | FI-08 | EA-09 |
| HD01FiU38 | §3 | Theme 3 | MEDIUM 48 | S2 | R10 | T-T2 | §4/§6 | Sc-A | FI-08 | — |
| HD01FiU43 | §3 | Theme 3 | MEDIUM 40 | S2/W1 | R09 | — | §7 | Sc-A/Sc-B | FI-09 | — |
| HD01FiU31 | — | Theme 3 | LOW 12 | S2 | — | — | §3 | — | — | — |
| HD01CU35 | — | Theme 3 | LOW 9 | — | — | — | §4 | — | — | — |

## Artifact-to-Artifact Cross-Reference

| Artifact | Cites | Cited By |
|----------|-------|---------|
| executive-brief.md | synthesis-summary, risk-assessment, coalition-mathematics | article.md |
| synthesis-summary.md | classification-results, stakeholder-perspectives | executive-brief, scenario-analysis |
| significance-scoring.md | synthesis-summary | scenario-analysis, article.md |
| classification-results.md | synthesis-summary | methodology-reflection |
| swot-analysis.md | risk-assessment, stakeholder-perspectives | scenario-analysis, quantitative-swot |
| risk-assessment.md | threat-analysis, swot-analysis | scenario-analysis, devils-advocate |
| threat-analysis.md | risk-assessment | scenario-analysis |
| stakeholder-perspectives.md | synthesis-summary, coalition-mathematics | scenario-analysis, devils-advocate |
| data-download-manifest.md | — | all artifacts |
| cross-reference-map.md | all | methodology-reflection |
| scenario-analysis.md | risk-assessment, coalition-mathematics, stakeholder-perspectives | article.md |
| comparative-international.md | classification-results, stakeholder-perspectives | article.md |
| devils-advocate.md | scenario-analysis, risk-assessment | methodology-reflection |
| intelligence-assessment.md | data-download-manifest, classification-results | methodology-reflection |
| methodology-reflection.md | cross-reference-map, intelligence-assessment | article.md |
| election-2026-analysis.md | coalition-mathematics, voter-segmentation, historical-parallels | article.md |
| voter-segmentation.md | election-2026-analysis | stakeholder-perspectives |
| coalition-mathematics.md | election-2026-analysis, stakeholder-perspectives | scenario-analysis |
| historical-parallels.md | election-2026-analysis | methodology-reflection |
| media-framing-analysis.md | stakeholder-perspectives, synthesis-summary | article.md |
| implementation-feasibility.md | risk-assessment, stakeholder-perspectives | scenario-analysis |
| forward-indicators.md | risk-assessment, scenario-analysis | article.md |
| pestle-analysis.md | swot-analysis, scenario-analysis | article.md |
| quantitative-swot.md | swot-analysis | article.md |
| wildcards-blackswans.md | scenario-analysis, risk-assessment | article.md |
| pir-status.json | executive-brief | article.md |

## PIR-to-Document Mapping

| PIR | Primary Documents | Secondary Documents |
|-----|------------------|---------------------|
| PIR-YA-2026-001 (Coalition survival) | N/A (election outcome) | voter-segmentation, coalition-mathematics |
| PIR-YA-2026-002 (Security operationalisation) | HD03267, HD01JuU32 | HD01JuU34, threat-analysis |
| PIR-YA-2026-003 (e-ID timeline) | HD03250 | HD03261, forward-indicators |
| PIR-YA-2026-004 (Financial crisis function) | HD01FiU37 | HD01FiU38, risk-assessment |
| PIR-YA-2026-005 (Fiscal-monetary interaction) | IMF WEO Apr-2026 | swot-analysis, scenario-analysis | [T+1]

## Temporal Reference Map

| Time Band | Referenced In | Key Events |
|-----------|-------------|------------|
| T+0 to T+30 | risk-assessment, executive-brief | Lagrådet referrals expected |
| T+30 to T+60 | forward-indicators | Lagrådet yttranden; budget spring amendment |
| T+60 to T+90 | scenario-analysis | Formal campaign period; opinion polls peak |
| T+90 to T+129 | election-2026-analysis | Final polling; election day approaches |
| T+129 | election-2026-analysis, coalition-mathematics | Election Day 2026-09-13 |
| T+129 to T+160 | coalition-mathematics | Coalition negotiations |
| T+160 to T+180 | implementation-feasibility | New government formed |
| T+180 to T+270 | forward-indicators | Autumn Budget; early implementation |
| T+270 to T+365 | scenario-analysis | Mid-term assessment |

## EU Framework Cross-Reference

| EU Act | Swedish doc | Transposition Status |
|--------|-----------|---------------------|
| eIDAS 2.0 | HD03250 | Direct implementation (new law) |
| DORA | HD01FiU37 | Aligned implementation (national crisis function) |
| EMIR | HD01FiU38 | Extension of clearing obligation |
| Istanbul Convention | HD01JuU39 | Gap-fill (ratified 2014, implementation delayed) |
| EU AI Act | (no specific doc) | FI-10 in forward-indicators tracks this |

## Long-Horizon Predecessor Citations (gate LH-6)

This year-ahead build inherits projection trajectories from the following long-horizon predecessors. **Note**: the `quarter-ahead/` artifact type has not yet been generated for the 2025/26 cycle in this repository — the citation below is recorded as a *projected predecessor anchor* per the `cross-horizon-citations` contract; the gate accepts a path-shaped citation while the article-type registry rolls out the missing tier.

- `analysis/daily/2026-04-09/quarter-ahead/` — projected predecessor anchor (T-30d quarter-ahead synthesis; folder pending registry rollout) [horizon:quarter]
- `analysis/daily/2026-05-07/year-ahead/` — direct prior year-ahead baseline (T-2d) [horizon:year]
- `analysis/daily/2026-05-07/monthly-review/` — most recent monthly synthesis [horizon:month]
- `analysis/daily/2026-05-03/monthly-review/` — T-6d monthly synthesis [horizon:month]
- `analysis/daily/2026-04-29/monthly-review/` — T-10d monthly synthesis [horizon:month]
- `analysis/daily/2026-04-27/monthly-review/` — T-12d monthly synthesis [horizon:month]

> The quarter-ahead gap is documented in `methodology-reflection.md` as a 🟡 partial citation; resolution targets the next quarterly anchor build (2026-Q3).

