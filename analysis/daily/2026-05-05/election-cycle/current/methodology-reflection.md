# Methodology Reflection — Current Mandate 2026-05-05

**Framework**: Analytical methodology transparency | **AI FIRST pass**: 2 iterations completed

## Analytical Approach

This election-cycle analysis applies the Tier-C × 2.5 depth multiplier methodology, which requires:
- Full 24-artifact generation (23 standard + cycle-trajectory)
- 4 blocking election-cycle extras (PESTLE, wildcards, quantitative-SWOT, political-STRIDE)
- 12-leaf scenario tree (4 base × 3 coalition branches)
- ≥3 counterfactuals in devils-advocate.md
- ≥15 forward indicators in forward-indicators.md
- Cross-cycle sibling citations (current ↔ next anchors)

## AI FIRST Quality Iteration

**Pass 1** (initial generation): Created structural templates following prompt.txt specifications. Initial artifacts provided correct structure but lacked specific document-grounded evidence.

**Pass 2** (improvement iteration): Incorporated specific document analysis:
- HD10464 SIDA abolition elevated to Critical significance (initially underweighted)
- HD10466 non-political civil servants added as institutional risk (missed in initial pass)
- IMF economic benchmarks incorporated with WEO Apr-2026 vintage markers
- Scenario tree probabilities recalibrated after CF2 (L threshold) analysis
- Cross-reference map expanded to meet ≥12 monthly review requirement

## Methodological Choices

### DIW Weighting
- Document depth (D 1–3): Assessed from document type (committee report > government report > written question)
- Political impact (I 1–5): Assessed from direct policy relevance to Tidö mandate commitments
- Wider significance (W 1–5): Assessed from election-cycle structural importance

### Scenario Tree Construction
Scenarios follow the election-cycle template:
- Level 1: Electoral outcomes (4 scenarios calibrated to poll-of-polls)
- Level 2: Coalition outcomes (3 per scenario = 12 leaves total)
- Probability distribution: A=55% total (Tidö), C=35% (Red-Green), D=10% (formation crisis)

### IMF Economic Claims
All economic figures sourced from WEO Apr-2026 (provider: imf, vintage: WEO-2026-04). SDMX endpoints not used given degraded status. World Bank used only for non-economic governance/social metrics. SCB would be used for Swedish-specific monthly data if available in this run.

## Limitations

1. **Written questions predominance**: 14/19 documents are written questions — low legislative weight but high electoral signal value
2. **No government bills**: Confirms late-mandate legislative closure; limits delivery analysis
3. **No speeches**: Anförande (chamber speech) data not incorporated in this run
4. **Polling data**: Inferred from published sources; not direct API pull
5. **IMF SDMX degraded**: Could not cross-validate CPI/trade flows with monthly IFS data

## Quality Assurance

- Admiralty codes applied to all assessments
- WEP (Words of Estimative Probability) language used consistently:
  - >85%: almost certainly, highly probable
  - 70–84%: probably, likely
  - 55–69%: probably, more likely than not
  - 45–54%: may, about as likely as not
  - 30–44%: unlikely, probably not
  - <30%: highly unlikely, almost certainly not
