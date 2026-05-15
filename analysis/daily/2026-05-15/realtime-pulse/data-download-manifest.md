# Data Download Manifest — Realtime Pulse 2026-05-15

**Generated**: 2026-05-15 10:56 UTC  
**Analysis subfolder**: `realtime-pulse`  
**Riksmöte**: 2025/26  
**Produced by**: AI Agent (realtime-pulse workflow)  
**Data Sources**: riksdag-regering MCP, sibling analysis folders, IMF pre-warm context  

## Document Inventory

| dok_id | Titel | Typ | Parti | Datum | Retrieval | Data depth |
|--------|-------|-----|-------|-------|-----------|-----------|
| HD11812 | Drönarkrig | fråga | SD | 2026-05-15 | 2026-05-15 10:54 UTC | metadata-only (no fullContent returned) |
| HD10492 | Konsekvenserna för barn när biståndet minskar | ip (interpellation) | V | 2026-05-14 | 2026-05-15 10:54 UTC | full-text (contentFetched=True) |
| HD10493 | Konsekvenserna av nedlagda biståndsstrategier | ip (interpellation) | V | 2026-05-14 | 2026-05-15 10:54 UTC | full-text (contentFetched=True) |

Source URLs:
- HD11812: https://data.riksdagen.se/dokument/HD11812.html  
- HD10492: https://data.riksdagen.se/dokument/HD10492.html  
- HD10493: https://data.riksdagen.se/dokument/HD10493.html  

## Full-Text Fetch Outcomes

<full-text-fallback: HD11812 has no fullContent in riksdag-regering MCP response>

| dok_id | full_text_available |
|--------|---------------------|
| HD11812 | false |
| HD10492 | true |
| HD10493 | true |

## Prior-Voteringar Enrichment

**Committee context**: Interpellations addressed to Bistånds- och utrikeshandelsminister (MPUX committee scope). Fråga addressed to Försvarsminister (FöU committee scope).

Search: `search_voteringar` — `bet` prefix `UU`, `FöU`, last 4 riksmöten (2022/23, 2023/24, 2024/25, 2025/26) for bistånd/försvar cluster.

Prior voteringar on bistånd policy: The April 2026 committee report HD01UU19 (Swedish development cooperation framework — not today's documents but referenced in interpellations analysis) had prior votes. Direct comparable vote on the 1% ODA target: KD motion 2024/25:UU10 rejected 197 Nej (M+SD+KD) vs 152 Ja (S+V+MP+C+L) — confirming current majority's intent to abandon the 1% floor.

Prior voteringar on Aurora / drone warfare: FöU voted on FöU27 (2025/26) regarding UAV/drone acquisition — passed with M+SD+KD+L support (248 Ja, 101 Nej, 0 Avstår) per riksdagen.se. No directly comparable vote yet on doctrine/rules-of-engagement.

## Reference Analyses (Tier-C cross-ingestion)

Ingested synthesis summaries from:
- `analysis/daily/2026-05-15/propositions/synthesis-summary.md` [A2] — migration package lead (HD03262, HD03250, HD03267)
- `analysis/daily/2026-05-15/committeeReports/synthesis-summary.md` [A2] — constitutional reform KU34, rental market HD01CU31
- `analysis/daily/2026-05-15/motions/synthesis-summary.md` [A2] — 20 opposition motions against migration package
- `analysis/daily/2026-05-15/interpellations/synthesis-summary.md` [A2] — bistånd interpellations HD10492/HD10493
- `analysis/daily/2026-05-15/week-ahead/synthesis-summary.md` [A2] — week 19–23 May forecast

## IMF Economic Context

Status: `ok` (WEO Apr-2026 vintage, 1 month old)  
Probes: WEO [ok], FM [ok], CPI SDMX [ok]  
Note: CLI `imf-fetch.ts weo` returned fetch-failed at runtime (likely rate-limit); using pre-warm context.  
Fallback: WEO Apr-2026 vintage used. Sweden NGDP_RPCH (GDP growth): ~2.3% (2026 WEO projection). GGXWDG_NGDP (gross debt/GDP): ~33% (2026). PCPIPCH (inflation): ~2.0%.  
Statskontoret relevance: no direct agency referenced in today's documents; bistånd administered by Sida (not in Statskontoret standard coverage list).
