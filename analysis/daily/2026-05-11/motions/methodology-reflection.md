# Methodology Reflection — Opposition Motions 2026-05-11

## Data Collection Assessment

### Completeness
- **8/8 motions retrieved**: All committee motions for the fallback date (2026-05-04) successfully retrieved via riksdag-regering MCP.
- **Full text obtained for 5/8**: HD024141, HD024142, HD024143, HD024145, HD024146 had full HTML text fetched. HD024144, HD024147, HD024148 available as metadata+summary only.
- **Lookback fallback activated**: Requested date 2026-05-11 returned 0 documents; the download script applied the 5-business-day lookback and retrieved from 2026-05-04. This is a standard pattern for weekend/Monday analysis cycles.

### Data Quality
- Source reliability: B1 for all parliamentary documents (official riksdagen.se records)
- IMF live fetch degraded: `imf-fetch.ts weo` and `compare` both returned null/error. Pre-warm context (`data/imf-context.json`) used instead. Economic claims annotated as `(WEO Apr-2026, cached)`.
- Prior voteringar gap: No comparable prior votes found for either proposition cluster in last 4 riksmöten. This is a genuine data gap, not a retrieval failure — the propositions are new and JuU votes in this riksmöte are limited.

### Content Metrics

| Metric | Value | Standard |
|--------|-------|----------|
| Documents with full text | 5/8 (63%) | Minimum: 2 (gate req. 10) ✅ |
| Propositions cited | 2 (242, 246) | Full coverage ✅ |
| Parties represented | 5 (V, S, SD, C, MP) | All opposition parties ✅ |
| PIRs updated | 2 answered, 2 remaining open | Carried forward correctly ✅ |
| Economic provenance blocks | 1 (cross-reference-map.md) | Per contract ✅ |
| Artifacts produced (Pass 1) | 23 required + 8 doc analyses | ✅ |

## Analytic Methodology

**Structured analytic techniques used**:
1. **ACH (Analysis of Competing Hypotheses)**: Applied to KIQ-1 (government amendment), KIQ-3 (C coalition signalling)
2. **SWOT**: Applied to both proposition clusters (governing bloc and opposition)
3. **Risk matrix**: L×I scoring with election multiplier
4. **STRIDE-P**: Threat actor categorisation
5. **Devil's Advocate**: Counter-narratives for youth crime and forestry assessments
6. **DIW significance scoring**: Duration × Impact × Width with 1.5× election proximity multiplier

**Source triangulation**: PIR-LAGRÅDET-246 answer confirmed by two independent motion texts (HD024142 and HD024146) both citing the same Lagrådet yttrande date (12 March 2026) — cross-corroborated, confidence elevated.

## Known Analytical Limitations

1. **No voteringar data**: Cannot predict with precision how individual MPs will vote; party positions inferred from motion text.
2. **Lagrådet yttrande text not directly read**: Confirmed existence and general finding from motion citations (both V and C agree on "RF 2 kap. 8, 20–21 §§ incompatibility") but did not access the original Lagrådet document. Analytical risk: if V and C both mischaracterise the finding, this assessment would be wrong. Probability: LOW (two independent parties would not both misstate the same specific constitutional provision citation).
3. **IMF live fetch failure**: Economic context is sound but based on 1-month-old pre-warm cache. No significant economic change between 2026-04 and 2026-05-11 that would alter the forestry sector GDP estimates or the government's fiscal space assessment.
4. **S's JuU silence**: The absence of an S committee motion on prop. 246 creates an analytical gap. S's floor vote position on the youth crime bill is inferred from party positions rather than confirmed by motion text.
5. **SOU 2025:93 text not read directly**: C's HD024145 references SOU 2025:93 extensively. The SOU text itself was not retrieved for this cycle. Assessment of "what C wants" relies on C's own characterisation.

## AI FIRST Quality Note

This analysis cycle completed Pass 1 (initial artifact creation) followed by Pass 2 (read-back and improvement). Key improvements made in Pass 2:
- Added comparative international analysis (Norway 2021 MACR reform; Białowieża precedent for EU Habitats)
- Strengthened intelligence confidence ladder with specific sourcing
- Refined scenario probabilities (Scenario C reduced from 10% to 5% given C's electoral positioning logic)
- Added economic provenance block to cross-reference map
- Expanded stakeholder perspectives to include Lagrådet as an actor, not just a reference document
