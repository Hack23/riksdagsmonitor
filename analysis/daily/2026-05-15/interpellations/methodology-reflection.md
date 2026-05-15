# Methodology Reflection — Interpellations 2026-05-15

**Standard**: ICD 203 Analytic Standards Audit  
**Version**: v2.1 with improvement notes  

---

## ICD 203 Compliance Audit

| Standard | Requirement | Status | Notes |
|----------|------------|--------|-------|
| 1. Objectivity | Distinguish facts from estimates | ✅ | Admiralty codes used throughout |
| 2. Independence | Avoid policy advocacy | ✅ | KJ3 explicitly notes V:s strategic motivation |
| 3. Timeliness | Timely product | ✅ | Analysis for 2026-05-15 data |
| 4. Based on all available information | Full corpus search | ⚠️ | Dousa's internal UD documents inaccessible |
| 5. Proper citation | Source attribution | ✅ | Admiralty codes A-C, 1-3 on all claims |
| 6. Analytical tradecraft | SATs used | ✅ | ACH, scenario analysis, SWOT |
| 7. Key judgments prominently stated | KJ table | ✅ | intelligence-assessment.md |
| 8. Uncertainty expressed | Confidence levels | ✅ | HIGH/MODERATE/LOW labels |
| 9. Distinguish analytic lines from intelligence gaps | Gap table | ✅ | intelligence-assessment.md §Gaps |

---

## Admiralty Code Usage

**Source reliability codes used**:
- A (completely reliable): Riksdag open data, official documents
- B (usually reliable): Established NGO reports, accredited media
- C (fairly reliable): Secondary analysis, speculation

**Information accuracy codes used**:
- 1 (confirmed by other sources): Cross-validated
- 2 (probably true): Strong evidence, single source
- 3 (possibly true): Plausible, limited evidence

---

## Analytical Assumptions

| Assumption | Basis | Sensitivity |
|-----------|-------|------------|
| Dousa lacks formal konsekvensanalys | No public document found | High — if wrong, main thesis changes |
| V:s interpellationer are strategically motivated | Timing + opposition role | Low — doesn't affect substance |
| IMF WEO-2026-04 represents valid economic baseline | IMF prerelease April 2026 | Medium — GDP growth may deviate |

---

## Degraded Data Notes

**IMF fetch degraded**: `imf-fetch.ts compare` and `weo` returned null/empty during this run. WEO-2026-04 vintage used via imf-context.json. Economic claims have been minimized and scoped to Swedish economic baseline only. This is noted in economic-data.json.

**Missing documents**: Dousa's internal decision-making documents are state secrets (sekretessbelagda). Analysis relies on publicly available reform documents and NGO reports.

---

## Improvements from Pass 1 to Pass 2

1. Strengthened evidence citations in scenario probabilities
2. Added competing H3 (V performative) for balanced analysis
3. Expanded international comparators to include Netherlands
4. Added electoral resonance caveat on KJ6 (bistånd lågt på väljar-agenda)
5. IMF degradation explicitly flagged in all economic claims
