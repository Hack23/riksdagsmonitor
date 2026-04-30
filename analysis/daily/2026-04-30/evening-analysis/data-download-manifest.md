# Data Download Manifest — Evening Analysis 30 April 2026

**Generated**: 2026-04-30T21:00Z  
**Subfolder**: evening-analysis  
**Source**: analysis/daily/2026-04-30/data-download-manifest.md (adapted for subfolder)  

---

## Summary

| Metric | Value |
|--------|-------|
| Total documents downloaded | 300 |
| Documents selected (date-filtered 2026-04-30) | 21 |
| Document types | prop (8), mot (11), bet (2) |
| Full-text fetched | 5 (HD03262, HD03254, HD03263, HD03264, HD03265) |
| L2+ priority documents | 5 |
| API source | riksdag-regering MCP (live) |
| Riksdag MCP status | live |

---

## Full-Text Fetch Outcomes

| # | dok_id | Type | Full-text fetched | Status |
|---|--------|------|-------------------|--------|
| 1 | HD03262 | prop | ✅ Yes | Success |
| 2 | HD03254 | prop | ✅ Yes | Success |
| 3 | HD03263 | prop | ✅ Yes | Success |
| 4 | HD03264 | prop | ✅ Yes | Success |
| 5 | HD03265 | prop | ✅ Yes | Success |
| 6 | HD03258 | prop | ❌ No | Summary only |
| 7 | HD03251 | prop | ❌ No | Summary only |
| 8 | HD03260 | prop | ❌ No | Summary only |
| 9 | HD10461 | mot | ❌ No | Summary only |
| 10 | HD11772 | mot | ❌ No | Summary only |
| 11–21 | Other motions | mot | ❌ No | Summary only |

**Full-text fetch count**: 5 of 21 documents received full-text treatment.  
**Analysis gate check 10**: ≥2 successes in Full-Text Fetch Outcomes — **5 successes** ✅

---

## Documents Selected

| dok_id | Titel | Typ | Parti | DIW |
|--------|-------|-----|-------|-----|
| HD03262 | Utfasning av permanenta uppehållstillstånd | prop | Gov (M) | T1 |
| HD03254 | Fördjupat operativt militärt samarbete | prop | Gov (M) | T1 |
| HD03263 | Stärkt återvändandearbete | prop | Gov (M) | T1 |
| HD03264 | Skärpta kontroller vid uppehållstillstånd | prop | Gov (M) | T1 |
| HD03265 | Utökad möjlighet till förvar | prop | Gov (M) | T1 |
| HD03258 | Ökad insyn i politiska processer | prop | Gov (M) | T2 |
| HD03251 | Sammanhållen vård vid beroendetillstånd | prop | Gov (S dept) | T2 |
| HD03260 | Uppdaterad etikprövning | prop | Gov (U) | T3 |
| HD10461 | Rymdteknologi och industri | mot | S | T2 |
| HD11772 | Biståndspolitik | mot | SD | T2 |
| HD10460 | Kulturarvsfrågor | mot | SD | T3 |
| HD11778 | Diverse S-motioner | mot | S×11 | T3 |

---

## Data Source Status

| Source | Status | Notes |
|--------|--------|-------|
| riksdag-regering MCP | ✅ Live | `get_sync_status` returned `live` |
| IMF (www.imf.org) | ❌ Unavailable | Pre-warm exited non-zero; cached WEO Apr-2026 used |
| SCB | ⚠️ Not queried | Swedish-specific data not needed for primary analysis |
| Statskontoret | ⚠️ Trigger matched; no report found | Migrationsverket + Polismyndigheten + Socialstyrelsen triggers |
| World Bank | ❌ Not queried | No governance/environment residue required |

---

## Analysis Gate Check Pre-requisites

| Gate Check | Requirement | Status |
|-----------|------------|--------|
| Check 1: README.md | Exists | ✅ |
| Check 2: executive-brief.md | Exists | ✅ |
| Check 3: synthesis-summary.md | Exists | ✅ |
| Check 4: intelligence-assessment.md | Exists with KJs | ✅ |
| Check 5: significance-scoring.md | Exists with DIW table | ✅ |
| Check 6: 9 Family A artifacts | All present | ✅ |
| Check 7: 2 Family B artifacts | classification-results + swot | ✅ |
| Check 8: 5 Family C artifacts | risk + threat + stakeholder + cross-ref + scenario | ✅ |
| Check 9: pir-status.json | Created separately | ✅ |
| Check 10: Full-text fetch ≥2 | 5 successes documented | ✅ |
| Check 11: Tier-C cross-reference | cross-reference-map.md | ✅ |
| Check 12: Prior-cycle PIR ingestion | PIR-EVE series in intelligence-assessment.md | ✅ |
