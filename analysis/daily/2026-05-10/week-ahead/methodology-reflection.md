# Methodology Reflection — Week Ahead 10–16 May 2026

**Author**: James Pether Sörling  

## Source Assessment

### Primary Sources (HIGH confidence)
- **riksdag-regering MCP**: Official parliamentary documents (betänkanden, frågor, interpellationer). Direct from Riksdagen's open data API. No interpretation layer.
- **IMF WEO Apr-2026**: Official IMF World Economic Outlook, April 2026 vintage. Sweden NGDP_RPCH, GGXWDG_NGDP, etc. Reliable but 1 month old.

### Degraded Sources
- **IMF SDMX (IFS, DOTS, GFS)**: Status: degraded (404). Cannot retrieve SDMX-based indicators (monthly CPI, trade flows, M2). Fallback: WEO/FM Datamapper only.

### Missing Sources
- **Chamber voting data (voteringsdata)**: CU31 and UbU28 votes not yet held — will be available later this week. Analysis relies on committee betänkanden as proxies for expected vote outcomes.
- **Ministerial answers**: HD11803, HD11802, HD10480 answers pending. Analysis based on question text only.
- **SCB real-time data**: Not retrieved this cycle due to agent time constraints. Swedish rental market and housing production data would strengthen CU31 analysis.

## Methodological Choices

### Lookback Application
Standard week-ahead analysis uses a 1-business-day lookback (source documents dated 2026-05-08) since 2026-05-10 is a Sunday with no new Riksdag publications. This is per protocol and does not introduce data quality risk — Riksdag publishes committee reports on Fridays.

### 1.5× DIW Multiplier
Applied uniformly to all documents in contested policy areas given 127-day election proximity. The multiplier threshold is 180 days (< 180 = active). This correctly identifies CU31, UbU28, HD11803, HD11802, and HD10480 as high-significance items.

### Confidence Calibration
Admiralty B2 (reliable source, probably true) is assigned to the primary analytical conclusions based on official document sourcing. Where answers are pending (HD11803), downgraded to C3 (fairly reliable, possibly true).

## Analytical Limitations

1. **Single-source dependency**: The riksdag-regering MCP is the primary data source. Alternative parliamentary data sources (Riksdagen's web scraping, Lagstiftningskedjan) are not integrated.
2. **No open-source HUMINT**: Analysis relies entirely on official documents. No civil society, media, or social media signals were processed.
3. **IMF degradation**: Economic context is limited to WEO Apr-2026 vintage. Monthly economic signals (CPI, trade) are missing.

## Pass-2 Improvement Notes

- **Added**: Comparative international analysis (Denmark, Netherlands housing; UK/Germany teacher credentials; EU flotilla diplomatic context)
- **Strengthened**: SD–L friction analysis with longer-horizon concern (90-day vs 30-day threshold)
- **Clarified**: IMF degraded status impact on analysis — SCB recommended as supplement rather than omission
- **Refined**: PIR carry-forward from prior cycle with explicit evidence assessment for each PIR
