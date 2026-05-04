# Classification Results — Election Cycle Analysis

**Date**: 2026-05-04 | **Classification**: PUBLIC | **Data Sensitivity**: Low — all sources public parliamentary data

## Document Classification

| Artifact | Sensitivity | Public Release | GDPR Applicable | Notes |
|---|---|---|---|---|
| All analysis artifacts | PUBLIC | ✅ Yes | No (no personal data) | Open parliamentary data |
| Voting records referenced | PUBLIC | ✅ Yes | No | Riksdag open data |
| MP interpellation data | PUBLIC | ✅ Yes | No | Public legislative activity |
| Poll/opinion data cited | PUBLIC | ✅ Yes | No | Aggregated, no individuals |
| IMF economic data | PUBLIC | ✅ Yes | No | Public WEO data |

## Policy Area Classification

### HIGH POLITICAL SENSITIVITY (election-relevant)
- **Migration reform cluster** (HD03262–HD03265): Core SD agenda fulfillment; defines right-bloc electoral offer
- **Citizenship tightening** (HD01SfU28): Identity politics dimension; electoral mobilization potential
- **Gang crime** (interpellations HD10458): Government delivery promise vs. reality gap — opposition ammunition

### MEDIUM POLITICAL SENSITIVITY
- **NATO/Defence**: Bipartisan consensus; debate on implementation costs only
- **Nuclear power**: Party-specific controversy (MP strongly opposed); industry strategic
- **Political transparency**: Cross-party support; governance norm improvement

### LOWER POLITICAL SENSITIVITY (technical/administrative)
- **Court process reform** (HD01JuU9): Legal technicality, broad support
- **VAT fraud** (HD01SkU22): Administrative improvement
- **Social data register** (HD01SoU27): Welfare improvement, data privacy aspects

## Intelligence Classification (CIA-CIA Framework)

| Domain | Classification | Rationale |
|---|---|---|
| Electoral forecasting | ANALYSIS | Model-based, probabilistic — not factual claim |
| Legislative impact assessment | ASSESSMENT | Expert synthesis of public data |
| Coalition scenario analysis | SPECULATION | Forward-looking with uncertainty |
| Policy track record | FACTUAL | Documented legislative outputs |
| Opposition strategy inference | INFERENCE | Derived from interpellation patterns |

## Source Reliability Assessment

| Source | Reliability | Currency | Completeness |
|---|---|---|---|
| Riksdag MCP (propositions) | HIGH | Current (2026-04-30) | ~90% |
| Riksdag MCP (committee reports) | HIGH | Current (2026-05-04) | ~90% |
| Riksdag MCP (interpellations) | HIGH | Current (2026-05-04) | ~95% |
| IMF WEO pre-warm | MEDIUM | Apr 2025 vintage | ~70% |
| Nordic peer comparisons | MEDIUM | Indirect inference | ~60% |
| Electoral poll data | MEDIUM | Aggregated estimates | ~65% |

## Data Gaps Acknowledged
1. **Actual voting records**: search_voteringar returned zero counts — likely API grouping issue; individual vote counts not available for this analysis
2. **Internal party poll data**: Not public; electoral projections use aggregate public poll estimates
3. **IMF full WEO vintage**: Pre-warm returned null for compare; rely on known WEO Oct 2025 projections
4. **Post-election coalition negotiation dynamics**: Forward inference only
