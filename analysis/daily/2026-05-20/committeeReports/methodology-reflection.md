# Methodology Reflection — Committee Reports 2026-05-19

**Date**: 2026-05-20  
**Analyst**: James Pether Sörling  

## Data Sources Used

| Source | Coverage | Reliability | Limitations |
|--------|----------|-------------|-------------|
| Riksdag open data API (data.riksdagen.se) | 9 betänkanden | HIGH | Full text for 5, metadata-only for 4 |
| MCP riksdag-regering (live) | Documents, speeches | HIGH | No voterings data for current riksmöte |
| IMF WEO-2026-04 | Macro context | HIGH | 1-month vintage; not stale |
| Historical betänkanden | Cross-reference | MEDIUM | Manual recall only |

## Analytical Methods Applied

1. **Document significance scoring**: L1-L3 scale applied to all 9 betänkanden using policy salience, vote contested-ness, and entry-into-force timing as primary variables.
2. **Thematic clustering**: PMESII-based cluster analysis identified 5 policy clusters from 9 documents.
3. **SWOT**: Applied to security cluster (JuU36+MJU25) as the highest-significance thematic pair.
4. **Scenario analysis**: Two-horizon (T+30d, T+1y) scenarios constructed using base/adverse/wildcard framing.
5. **Comparative international**: Selected 3-5 comparable countries for each major policy domain.
6. **Devil's Advocate**: Counter-hypotheses constructed for top 4 prevailing analytical assumptions.

## Coverage Gaps

1. **Voteringar unavailable**: Full voting record for 2025/26 riksmöte not indexed in current MCP dataset. Historical patterns from 2023/24 used as reference.
2. **Committee debate anföranden not retrieved**: Time constraint prevented full retrieval of committee debate speeches which would enrich stakeholder analysis.
3. **Lagrådet yttranden not retrieved**: Lagrådet opinions on MJU25 and JuU36 not directly accessed; noted as "reviewed by Lagrådet" per document text only.
4. **Statskontoret data**: No Statskontoret evaluation reports retrieved for the relevant policy areas.

## Confidence Calibration Notes

- KJs marked [HIGH CONFIDENCE] based on direct document evidence (A2 = source directly access, reliable)
- KJs marked [MEDIUM CONFIDENCE] based on inference from document text + political context knowledge (B2)
- Economic context claims use IMF WEO-2026-04 vintage (1 month old, not stale per >6-month policy)
