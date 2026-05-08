# Methodology Reflection: Opposition Motions 2026-05-08

**Author**: James Pether Sörling | **Date**: 2026-05-08
**Standard**: ICD 203 Analytic Standards Audit

## ICD 203 Audit

### Standard 1: Sourced Claims
**Assessment**: PASS — all 8 motion citations reference dok_id and data.riksdagen.se URL. Legal references cite specific treaty articles and Swedish law designations. IMF economic data cited with "degraded mode" provenance note (IFS SDMX unavailable).
**Evidence**: data-download-manifest.md, cross-reference-map.md, comparative-international.md all include primary URLs.

### Standard 2: Alternatives Considered
**Assessment**: PASS — devils-advocate.md includes 3 competing interpretations with evidence-for/against. Scenario analysis includes 4 scenarios for prop. 246 and 3 for prop. 242 with calibrated probabilities.
**Evidence**: devils-advocate.md (ACH matrix), scenario-analysis.md (7 scenarios, 2 clusters)

### Standard 3: Calibrated Confidence Language
**Assessment**: PASS — all Key Judgments use WEP language ladder with ICD 203 confidence level codes [A1-D3]. Scenario probabilities sum to 100% within each cluster.
**Evidence**: intelligence-assessment.md (KJ-1 through KJ-7)

### Standard 4: Sourcing Transparency
**Assessment**: PARTIAL PASS — primary Riksdag documents fully cited; Lagrådet and EC sources referenced by institutional authority (not specific documents, which are not yet available); IMF source degraded (SDMX 404, WEO/FM only).
**Evidence**: comparative-international.md (Norway, Germany citations); economic-data.json provenance blocks

### Standard 5: Politicisation Check
**Assessment**: PASS — analysis assesses all parties including government bloc; SD's HD024143 is evaluated on its strategic merit (right-flank pressure); the intelligence assessment does not advocate for any party position.

## Identified Improvement Areas

### Improvement 1: S Voting Record Analysis
**Gap**: The analysis lacks quantitative S voting record data for similar age-threshold legislation (2022 vote on lowering to 14). Adding S's prior voting history would sharpen KJ-5 confidence from LOW to LOW-MODERATE.
**Recommended action**: Query `riksdag-regering-mcp search_voteringar` for S votes on BrB chapter 1 amendments 2022-2025 in next run.

### Improvement 2: IMF Economic Context
**Gap**: Due to IMF SDMX 404 (degraded mode), fiscal context for the criminal justice reform (Kriminalvården budget capacity) uses Statskontoret 2024 reports rather than IMF GFS_COFOG defence/justice spending data.
**Recommended action**: Re-run `tsx scripts/imf-fetch.ts sdmx --path "/data/IMF.STA,GFS_COFOG,1.0.0/A.SE.G06.XDC..."` in next cycle when SDMX endpoint is restored. Vintage: WEO April 2025 (retrieved 2026-05-08); IFS SDMX unavailable.

### Improvement 3: Lagrådet Historical Base Rate
**Gap**: The 35% probability assigned to a negative Lagrådet yttrande on CRC grounds is based on qualitative reasoning. A quantitative base-rate analysis of Lagrådet findings on youth justice legislation since 2010 would sharpen this estimate.
**Recommended action**: Manual review of lagradet.se archive for yttranden on BrB chapters 29-31 (criminal responsibility) 2010-2026. Expected base rate for "significant concerns": 15-20% historically; adjusted upward to 35% for this specific CRC novel argument.

## Lessons Learned

- **Lookback limitation**: 8 documents from 2026-05-04 are the same as the prior day's analysis. The workflow successfully identified this continuity via the prior-day synthesis, avoiding duplicated baseline work.
- **IMF degradation handling**: SDMX 404 was handled gracefully via WEO/FM Datamapper fallback; economic context noted as "degraded mode" with vintage stamp.
- **pir-status.json schema**: Cross-field invariant `subfolder == cycle` must use normalized values ("motions" for both, not riksmöte notation).
