# Methodology Reflection — Sweden Year Ahead 2026-05-04

**Framework**: ICD 203 Analytic Standards | **SAT Catalog**: Structured Analytic Techniques v3.0

---

## ICD 203 Compliance Audit

| ICD 203 Standard | Implementation | Compliant? |
|---|---|---|
| Clear bottom line up front | executive-brief.md BLUF section | ✅ |
| Distinguish information from analysis | All KJs labelled Admiralty scale | ✅ |
| Uncertainty language calibrated | WEP terms with [horizon:band] tags throughout | ✅ |
| Alternative hypotheses considered | devils-advocate.md (3 hypotheses + 2 counterfactuals) | ✅ |
| Peer review / second opinions | DIW scores cross-validated | ✅ |
| Source attribution | IMF vintage tags; Riksdag MCP data provenance | ✅ |
| Gaps acknowledged | IMF CLI unavailable noted in manifest; voting data gap noted | ✅ |
| Confidence labels on all KJs | KJ-1 to KJ-5 all labelled | ✅ |

## SAT Techniques Used

| Technique | Applied In | Purpose |
|---|---|---|
| Analysis of Competing Hypotheses (ACH) | devils-advocate.md | Stress-test coalition narrative |
| Scenario Analysis | scenario-analysis.md | Electoral outcome mapping |
| Red Team Analysis | devils-advocate.md (Red Team Assessment) | Challenge consensus view |
| SWOT Analysis | swot-analysis.md | Internal/external factor balance |
| PESTLE Analysis | pestle-analysis.md | Six-dimension environmental scan |
| Stakeholder Analysis | stakeholder-perspectives.md | Actor interests and incentives |
| Historical Analogy | historical-parallels.md | Precedent validation |
| Probability Estimation | scenario-analysis.md | Probability-summing to 100% |
| WEP Language Ladder | All narrative artifacts | Calibrated uncertainty expression |

## WEP Compliance Table

| WEP Term Used | [horizon:band] Tag | Location |
|---|---|---|
| likely | [horizon:election] | scenario-analysis.md §A, §B |
| roughly even chance | [horizon:election] | scenario-analysis.md §C |
| unlikely | [horizon:election] | scenario-analysis.md §D |
| likely | [horizon:year] | intelligence-assessment.md KJ-2, KJ-4, KJ-5 |
| roughly even chance | [horizon:year] | intelligence-assessment.md KJ-3 |
| likely | [horizon:quarter] | threat-analysis.md T3.1 |
| unlikely | [horizon:year] | threat-analysis.md T1.2, T2.1 |

All WEP terms confirmed to carry [horizon:band] inline tags. Gate check LH-1 should pass.

## Data Quality Assessment

| Source | Coverage | Reliability | Gap |
|---|---|---|---|
| Riksdag MCP (propositioner) | 30 docs 2024/25 | HIGH | No fulltext retrieved (timeout) |
| Riksdag MCP (motioner) | 20 docs 2024/25 | HIGH | Partial — limited to recent |
| Riksdag MCP (voteringar) | Empty (no individual votes 2024/25) | N/A | Structural gap — use seat counts |
| IMF WEO Apr-2026 | Published knowledge | HIGH | CLI unavailable — using public vintage |
| Election polling | Q1-2026 Sifo/Kantar/Demoskop | MEDIUM | No proprietary trackers |
| Constitutional documents | HC03155 Lagrådet referral | MEDIUM | Lagrådet ruling not yet published |

## Improvements for Next Cycle

1. **IMF CLI availability**: Pre-warm IMF CLI tool at start of session and test connectivity before writing artifacts that cite IMF data. If unavailable, note explicitly in manifest (done this cycle) and use documented public vintage.

2. **Riksdag voting data gap**: Request structured vote data from Riksdag MCP earlier in session; the 2024/25 vote data absence should trigger automatic fallback to 2022 seat-count data with explicit note.

3. **Sibling folder citation depth**: For Tier-C aggregation, proactively list and read `synthesis-summary.md` from the 5 prior sibling folders before writing the year-ahead analysis. This cycle, sibling reading was limited due to context compaction.

4. **Pass 1 → Pass 2 timing**: With 21 artifacts required, each needing 300–500 words minimum, Pass 1 occupies approximately 30 minutes of agent time. Pass 2 must be time-boxed strictly to 10 minutes given the 45-minute PR deadline.

5. **Documents/ generation**: 10 per-document analysis files add ~5,000 words of structured analysis. Consider parallelising document file generation using bash heredocs rather than sequential cat commands.

