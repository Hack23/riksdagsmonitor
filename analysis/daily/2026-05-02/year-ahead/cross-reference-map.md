# Cross-Reference Map — Year Ahead 2026-05-02

**Horizon**: 365 days · **Tier**: C  
**Requirement**: ≥2 quarter-ahead + ≥4 monthly-review citations  
**Quarter-ahead available**: 0 (gap noted below)  
**Monthly-review available**: 7 (≥4 requirement satisfied)

---

## § Predecessor Gap Notice

**Quarter-ahead predecessors**: 0 found in analysis archive as of 2026-05-02.  
The Riksdagsmonitor year-ahead workflow is the first of its kind in this analysis cycle. No `quarter-ahead` type analyses exist in `analysis/daily/*/quarter-ahead/` as of the publication date. This gap is noted per [`.github/prompts/05-analysis-gate.md`] requirement for cross-horizon citation transparency.

**Impact on analysis**: The year-ahead synthesis relies on aggregated monthly-review cycles for the 90-day horizon context that would normally be provided by quarter-ahead analyses. The 7 monthly-review cycles available (April 2026) provide sufficient coverage at the 30-day granularity; the 90-day layer is interpolated.

**Recommendation for future cycles**: The first `quarter-ahead` analysis should be created for 2026-06-02 (or next available date >60 days ahead) to establish the quarter-ahead → year-ahead citation chain.

---

## § Monthly-Review Citations (≥4 of 7 required — 7 cited)

| # | Source folder | Date | Artifact cited | Key intelligence extracted |
|---|--------------|------|----------------|--------------------------|
| M1 | analysis/daily/2026-04-29/monthly-review/ | 2026-04-29 | synthesis-summary.md | April 2026 economic baseline; SD–KD fault line; migration architecture |
| M2 | analysis/daily/2026-04-29/monthly-review/ | 2026-04-29 | intelligence-assessment.md | PIR-A through PIR-E carry-forward |
| M3 | analysis/daily/2026-04-29/monthly-review/ | 2026-04-29 | coalition-mathematics.md | Seat projections; threshold scenarios T1–T4 |
| M4 | analysis/daily/2026-04-29/monthly-review/ | 2026-04-29 | pir-status.json | PIR registry v1.0; 5 open PIRs |
| M5 | analysis/daily/2026-04-27/monthly-review/ | 2026-04-27 | synthesis-summary.md | Prior month intelligence; economic trajectory |
| M6 | analysis/daily/2026-04-25/monthly-review/ | 2026-04-25 | synthesis-summary.md | Prior month reference |
| M7 | analysis/daily/2026-04-23/monthly-review/ | 2026-04-23 | synthesis-summary.md | April mid-month reference |

---

## § Week-Ahead Citations

| # | Source folder | Date | Artifact cited | Key intelligence extracted |
|---|--------------|------|----------------|--------------------------|
| W1 | analysis/daily/2026-05-01/week-ahead/ | 2026-05-01 | synthesis-summary.md | Near-term: migration architecture launch; criminal economy ESO report |

---

## § Primary Document Citations (from current cycle download)

| # | dok_id | Title | Cited in |
|---|--------|-------|---------|
| D1 | HD03262 | Abolition of permanent residence permits | synthesis-summary.md, election-2026-analysis.md, scenario-analysis.md, risk-assessment.md, threat-analysis.md, implementation-feasibility.md, intelligence-assessment.md |
| D2 | HD03263 | Expanded deportation machinery | synthesis-summary.md, implementation-feasibility.md, stakeholder-perspectives.md |
| D3 | HD03264 | Character requirements for residence | risk-assessment.md, scenario-analysis.md |
| D4 | HD03265 | Detention expansion | risk-assessment.md, threat-analysis.md |
| D5 | HD03254 | NATO military cooperation framework | synthesis-summary.md, stakeholder-perspectives.md, forward-indicators.md |
| D6 | HC01FiU20 | Spring Fiscal Bill 2026 | synthesis-summary.md, risk-assessment.md, pestle-analysis.md |
| D7 | HD10448 | SD–KD energy interpellation | swot-analysis.md, risk-assessment.md, scenario-analysis.md |
| D8 | HD01JuU31 | Police reform audit | synthesis-summary.md, stakeholder-perspectives.md, scenario-analysis.md |
| D9 | HC01FiU24 | Riksbank evaluation | synthesis-summary.md, pestle-analysis.md |

---

## § Horizon Band Citations by Artifact

| Artifact | T+72h | T+7d | T+30d | T+90d | T+365d | T+1460d | election |
|----------|-------|------|-------|-------|--------|---------|---------|
| synthesis-summary.md | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| scenario-analysis.md | — | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| executive-brief.md | — | — | ✓ | ✓ | ✓ | — | ✓ |
| election-2026-analysis.md | — | — | ✓ | ✓ | ✓ | — | ✓ |
| forward-indicators.md | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| risk-assessment.md | — | — | ✓ | ✓ | ✓ | — | ✓ |
| pestle-analysis.md | — | — | — | ✓ | ✓ | ✓ | — |
| wildcards-blackswans.md | — | — | — | ✓ | ✓ | ✓ | ✓ |

**All long-horizon horizon-band tags** present across year-ahead artifacts: T+90d, T+365d, election confirmed. T+1460d present in scenario and pestle.

---

## § IMF Economic Data Cross-Reference

| Source | Indicator | Vintage | Cited in | Notes |
|--------|-----------|---------|---------|-------|
| IMF WEO Apr-2026 (cached) | NGDP_RPCH (Sweden) | Apr-2026 | synthesis-summary.md, pestle-analysis.md | API unavailable; cache at analysis/data/imf/ngdp-rpch/swe.json — null response from API; estimate from Spring Bill |
| IMF WEO Apr-2026 | GGXWDG_NGDP | Apr-2026 | synthesis-summary.md | Debt ~33% GDP |
| IMF WEO Apr-2026 | GGXCNL_NGDP | Apr-2026 | synthesis-summary.md | Fiscal balance ~-0.5% |

**economicProvenance block**:
```json
{
  "provider": "imf",
  "dataflow": "WEO",
  "indicator": "NGDP_RPCH",
  "vintage": "Apr-2026",
  "retrieved_at": "2026-05-02T19:50:00Z",
  "note": "API returned null; estimate from HC01FiU20 Spring Bill analysis"
}
```

