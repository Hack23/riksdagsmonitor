# Methodology Reflection — Committee Reports 2026-05-12

## ICD 203 Analytic Standards Audit

Based on ICD 203 (Analytic Standards), DNI Office, adapted to Swedish parliamentary intelligence context.

### Standard 1: Proper Sourcing and Attribution

**Compliance**: PARTIAL ✅⚠️  
**Status**: All factual claims cite dok_id + Admiralty rating. Voteringsdata gap documented (D5 tag where applicable). IMF data referenced as WEO Apr-2026 vintage but not cached locally.  
**Gap**: No voteringsdata for riksmöte 2025/26 — fallback to 2024/25 proxy. Tagged throughout.

### Standard 2: Proper Use of Uncertainty Language (WEP/WEL)

**Compliance**: PARTIAL ✅⚠️  
**Status**: Key Judgments use WEP levels (LIKELY, ALMOST CERTAINLY, HIGHLY UNLIKELY). Scenario probabilities sum to 100%.  
**Gap**: Some supporting evidence in SWOT and stakeholder sections uses informal confidence language rather than formal WEP labels. Pass 2 improvement: standardize all confidence language.

### Standard 3: Alternative Hypotheses Considered

**Compliance**: FULL ✅  
**Status**: Devil's Advocate section provides 3 competing hypotheses via ACH with evidence matrix. Steelman arguments presented.

### Standard 4: Cognitive Bias Mitigation

**Identified biases**:
- *Availability bias*: KU34 may be over-weighted because it is most politically salient and full-text was retrieved. FiU37 full-text not retrieved — risk of under-weighting financial systemic impact.
- *Confirmation bias*: Finnish rental deregulation 1995 used as positive comparator. German Mietpreisbremse counterfactual included to mitigate.
- *Anchoring*: 2022 election seat data used as baseline. Polling uncertainty not fully quantified.

**Mitigation applied**: Historical parallels section deliberately includes cases that challenge primary hypothesis. Comparative-international section includes both pro and con comparators.

### Standard 5: Timeliness and Currency of Sources

**Compliance**: PARTIAL ✅⚠️  
**Status**: Committee report full texts are current (riksmöte 2025/26, retrieved 2026-05-12). IMF WEO Apr-2026 is most recent vintage.  
**Gap**: 🟡 Polling data is proxy/unconfirmed (C3/D4). Opinion data would need Novus/Demoskop subscription verification.

## ≥3 Improvement Recommendations

### Improvement 1: Voteringsdata Gap (HIGH PRIORITY)

**Issue**: 2025/26 riksmöte voteringar ej indexerade i MCP-databas. Coalition analysis relies on 2022 election baseline + 2024/25 proxy.  
**Recommended action**: Re-run analysis after voteringar indexed (est. June 2026). PIR-1 and PIR-2 resolution requires this data.  
**ICD 203 reference**: Source evaluation standard — fill collection gap when data becomes available.

### Improvement 2: IMF Economic Data Persistence (MEDIUM PRIORITY)

**Issue**: IMF pre-warm script ran but no data persisted to `analysis/data/imf/`. Swedish macroeconomic context (GDP, inflation, housing cost) should be grounded in IMF WEO SWE data.  
**Recommended action**: Create `analysis/data/imf/` directory structure and cache WEO Apr-2026 SWE indicators before next run.  
**ICD 203 reference**: Proper sourcing — economic claims require verifiable primary data citation.

### Improvement 3: Standardize WEP Language in Supporting Evidence (MEDIUM PRIORITY)

**Issue**: SWOT, stakeholder, and historical sections use informal confidence expressions ("likely", "probably") rather than formal WEP labels aligned with IC standard WEP scale.  
**Recommended action**: Pass 2 sweep to upgrade all informal confidence language to WEP labels with Admiralty codes.  
**ICD 203 reference**: Analytical standards §6 (uncertainty language).

### Improvement 4: Full-Text FiU37 Needed (LOW PRIORITY)

**Issue**: FiU37 full-text not retrieved due to time constraints. Analysis based on metadata + abstracts only (B3 → C3 downgrade).  
**Recommended action**: Fetch `get_dokument_innehall HD01FiU37 include_full_text=true` in next run.  
**ICD 203 reference**: Source depth — critical documents should be analyzed from full text.

## Voteringsdata Gap Declaration

🟡 **PARTIAL ANALYSIS**: Voteringsdata för riksmöte 2025/26 ej tillgänglig vid analystillfället (2026-05-12). Koalitionsanalysen baseras på:
1. 2022 riksdagsval mandatfördelning (A2)  
2. 2024/25 voteringsdata som proxyfallback (B3)  
3. Historiska partipositioner (B3)  

All röstintentionsanalys är märkt [unconfirmed] eller D4-D5. Analysen bör uppdateras när 2025/26 voteringsdata indexeras.

