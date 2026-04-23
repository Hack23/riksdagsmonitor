# Methodology Reflection — Riksdag Realtime Monitor 2026-04-22
**Analyst**: James Pether Sörling | **Standard**: ICD 203 + Admiralty Code + SAT Catalog
**Classification**: Public | **Cycle**: Realtime-2338

---

## ICD 203 Audit (9 Standards)

| Standard | Implementation in This Cycle | Assessment |
|---------|------------------------------|-----------|
| S-1: Accurately describe quality and reliability of underlying sources | All claims tagged [A1] (direct API), [A2] (confirmed secondary), [B2] (reported/inferred). Admiralty code applied per evidence type. | ✅ Met |
| S-2: Properly caveat analytic assessments | KJ-1/2/3 carry WEP band labels; PIR-2 explicitly states UNCERTAIN; KJ-2 uses MODERATE not HIGH. | ✅ Met |
| S-3: Distinguish between underlying intelligence and analyst judgment | Data retrieval (dok_id, titles, dates) separated from interpretive analysis (significance scoring, cluster logic). | ✅ Met |
| S-4: Avoid analytical assumptions with insufficient basis | RC2 (fuel tax electoral impact) explicitly deferred to observable outcome; constitutional amendments (PIR-5) flagged for full-text review before rating. | ✅ Met |
| S-5: Incorporate alternative hypotheses (ACH) | ACH matrix in devils-advocate.md with 3 primary + 3 red team hypotheses; probability distribution in scenario-analysis.md. | ✅ Met |
| S-6: Articulate and explain change in analytic judgments | Prior-cycle PIR ingestion table in intelligence-assessment.md shows what changed from sibling cycle analysis. "Sustained campaign" upgraded from WATCH to ACTIVE based on today's 4 interpellations. | ✅ Met |
| S-7: Identify information gaps that could affect judgments | PIR-4 (consumer response), PIR-5 (KU33/32 full text), RC1/RC2/RC3 evidentiary requirements all stated. | ✅ Met |
| S-8: Use consistent, unambiguous language with WEP terms | WEP terminology applied: "Almost certain" (KJ-3), "Likely" (KJ-1), "Roughly even" (KJ-2). No use of forbidden terms like "probable." | ✅ Met |
| S-9: Properly coordinate, acknowledge disagreement with other analysts | No other analyst team in this run; Tier-C sibling synthesis acknowledged and cited. | ✅ Met (single analyst acknowledged) |

---

## Structured Analytic Techniques (SAT) Applied

1. **ACH (Analysis of Competing Hypotheses)**: Applied in devils-advocate.md — 3 hypotheses + 3 red team challenges with evidentiary requirements specified.
2. **Scenario analysis**: 3 scenarios (breakthrough, containment, fragmentation) with probability distribution summing to 100% in scenario-analysis.md.
3. **Key Assumptions Check**: RC2 in devils-advocate.md challenges the assumption that the fuel tax cut will be electorally visible — explicit assumption surfacing.
4. **Cluster analysis**: Policy clusters A–E identified in cross-reference-map.md; legislative chains mapped (HD03236 → FiU48 → Law → motions).
5. **Evidence layering / source triangulation**: Sibling folder synthesis (4 parallel cycle analyses) cross-referenced before realtime analysis written — Tier-C synthesis standard met.
6. **Influence network mapping**: Mermaid stakeholder network in stakeholder-perspectives.md with directional arrows and colour coding.
7. **Forward indicators**: 10 dated indicators in forward-indicators.md across 4 time horizons.
8. **Pattern of Life / Coordinated Activity Detection**: S interpellation cluster identified as coordinated based on same-day filing, same author group, same target — documented in cross-reference-map.md.
9. **Red Team analysis**: RC1, RC2, RC3 in devils-advocate.md represent explicit red team challenges to the primary narrative.
10. **Probability calibration**: WEP 7-band scale applied consistently with Admiralty source quality codes.

---

## Methodology Improvements (Pass 2 Identified)

1. **Improve KJ-2 confidence**: KJ-2 (fuel tax electoral impact) is currently MODERATE because consumer response is unobservable. Next cycle should include SCB CPI data or consumer confidence indices from the SCB MCP server to provide a quantitative anchor.

2. **Enrich constitutional amendments (HD01KU33/32)**: PIR-5 is flagged title-only. The forward-indicators.md correctly notes the second reading as a future trigger, but the full text of the amendments should be retrieved in the next analysis run using `get_dokument_innehall` with `dok_id: HD01KU33`. This would upgrade PIR-5 from [B3] to [A1].

3. **Voter segmentation depth**: The voter-segmentation.md file covers demographic + regional segments but lacks subgroup modelling for the fuel-dependent rural Swedish electorate specifically. A SCB table query on rural/urban driving dependency would enrich this segment's quantitative grounding.

---

## Data Quality Limitations

| Limitation | Impact | Mitigation applied |
|-----------|--------|-------------------|
| No full-text for all propositions (title + summary only) | KJ-3 confidence based on submission count, not content review | Flagged in data-download-manifest.md |
| Constitutional amendments (HD01KU33/32) title-only | PIR-5 not rated | Explicitly deferred to follow-on |
| Consumer sentiment post-FiU48 not yet observable | KJ-2 capped at MODERATE | WEP MODERATE label applied |
| No vote record available for 2026-04-22 data | Voting patterns inferred from opposition motions | Cross-referenced with motion filing records [B2] |

---

## Tradecraft Context

All analysis in this cycle follows the osint-tradecraft-standards.md canon: ICD 203 audit above confirms 9/9 standards applied. Admiralty codes are [A1] (authoritative, confirmed), [A2] (authoritative, probably true), [B2] (reliable, probably true), [B3] (reliable, possibly true) — no fabricated or unrated claims committed to artifact files. PIR handoff to next cycle documented in intelligence-assessment.md §Prior-Cycle PIR Ingestion with full resolution status.
