# Session Baseline — Monthly Review, May 2026

**Date**: 2026-05-09 | **Purpose**: Reproducibility baseline for this analysis run  

---

## Environment

| Variable | Value |
|----------|-------|
| ARTICLE_DATE | 2026-05-09 |
| SUBFOLDER | monthly-review |
| IMPROVEMENT_MODE | false |
| ELECTION_DATE | 2026-09-13 |
| DAYS_TO_ELECTION | 128 |
| DIW_MULTIPLIER | 1.5× |
| IMF_STATUS | DEGRADED |
| RIKSDAG_MCP_STATUS | OPERATIONAL |

## Data Provenance

| Source | Records | Date | Status |
|--------|---------|------|--------|
| Riksdag MCP (download-parliamentary-data.ts) | 204 files | 2026-05-08 (lookback) | ✅ |
| IMF WEO Apr-2026 | Context memory | 2026-04 vintage | ⚠️ DEGRADED |
| Prior monthly-review (2026-05-07) | 23 + 7 artifacts | 2026-05-07 | ✅ |

## Document IDs in Analysis

HD01CU31, HD01CU34, HD01SoU36, HD01UbU20, HD01UbU28, HD01UU13, HD10480, HD11800, HD11801, HD11802, HD11803

## Analysis Versions

| Artifact | Pass 1 | Pass 2 |
|---------|--------|--------|
| All 23 required | ✅ CREATED | IN PROGRESS |
| 11 per-doc | ✅ CREATED | IN PROGRESS |
| 7 supplementary | ✅ CREATED | IN PROGRESS |

## Reproducibility Note

This analysis cannot be exactly reproduced due to:
1. IMF CLI degradation (economic figures are context memory, not live)
2. Single-analyst review limitation
3. Riksdag batch data may differ if re-fetched on a different date
