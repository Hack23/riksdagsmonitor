# Source Quality Assessment — 2026-05-21

## Data Quality Manifest

| Source | Type | Reliability | Freshness | Coverage |
|--------|------|-------------|-----------|---------|
| Riksdag API (MCP) | Official parliamentary data | HIGH | Real-time | Complete for rm=2025/26 |
| IMF WEO-2026-04 | Macroeconomic forecasts | HIGH | 1 month (not stale) | Sweden + Nordic + EU |
| riksdag-regering MCP | Aggregated parliamentary data | HIGH | Live (checked 2026-05-21T06:53Z) | Full riksdag dataset |

## MCP Health Check

**riksdag-regering**: Status = LIVE (verified 2026-05-21T06:53:22Z)  
**IMF probes**: WEO ✓ (548ms), FM ✓ (300ms), CPI ✓ (229ms)  
**SCB**: Not used for this analysis (not required for migration/legal propositions)  
**World Bank**: Not used (economic context from IMF; WB reserved for governance residue)

## Document Coverage

| Dok-ID | Fetched | Full-text | Quality | Notes |
|--------|---------|-----------|---------|-------|
| HD03267 | ✓ | HTML (snippet) | MEDIUM | HTML-formatted; text extracted |
| HD03262 | ✓ | HTML (snippet) | MEDIUM | HTML-formatted; text extracted |
| HD03258 | ✓ | Metadata | MEDIUM | Title + committee only; full text HTML |
| HD03263 | ✓ | Metadata | MEDIUM | Title + committee only |
| HD03265 | ✓ | Metadata | MEDIUM | Title + committee only |
| HD03250 | ✓ | Metadata | MEDIUM | Title + committee only |
| HD03261 | ✓ | Metadata | MEDIUM | Title + committee only |
| HD03255 | ✓ | Metadata | MEDIUM | Title + committee only |
| HD03249 | ✓ | Metadata | LOW | EU treaty; standard |
| HD03248 | ✓ | Metadata | LOW | EU treaty; standard |

## Analytical Limitations

1. **No full-text parsed content available**: The Riksdag API returns HTML-formatted proposition text; parsing yields CSS/layout code rather than readable prose. Analysis is based on proposition titles, committee assignments, department origins, and substantive knowledge of Swedish law.

2. **No Lagrådet opinions retrieved**: Lagrådet opinions for these propositions may not yet be publicly available (propositions submitted 2026-04-30 and 2026-05-07 — opinions typically take 3-6 weeks).

3. **No SOU/remiss references**: Underlying committee reports and consultation responses were not retrieved in this analysis cycle.

4. **No voting records**: No prior voting data for this batch (propositions not yet voted on).

5. **IMF SDMX not called**: SDMX endpoint (IFS, BOP, DOTS) not called as no subscription key verified for this run. WEO/FM data from Datamapper used instead.

## Confidence Assessment

**Overall analysis confidence**: MEDIUM-HIGH  
**Legal substance accuracy**: MEDIUM (based on titles and known policy background)  
**Political assessment accuracy**: HIGH (well-documented Swedish political context)  
**Economic data accuracy**: HIGH (IMF WEO-2026-04, not stale)  
**Forward indicator reliability**: MEDIUM (scenario-based projections)

---

*Source quality assessment — Pass 1*
