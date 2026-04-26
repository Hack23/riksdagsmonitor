# Data Download Manifest — Evening Analysis 2026-04-26

**Workflow**: news-evening-analysis  
**Run ID**: 24966509519  
**Generated**: 2026-04-26T20:45:00Z  
**Requested date**: 2026-04-26  
**Effective date**: 2026-04-24 (1 business-day lookback — no documents published 2026-04-26)  
**Window used**: 2026-04-24 to 2026-04-26  
**Author**: James Pether Sörling

## MCP Server Status

| Server | Status | Notes |
|--------|--------|-------|
| riksdag-regering | ✅ Live | `get_sync_status` returned `live` at 2026-04-26T20:41Z |
| scb | ✅ Available | Container MCP |
| world-bank | ✅ Available | Container MCP |
| imf (CLI) | ✅ Pre-warmed | `imf-fetch.ts weo --country SWE` ran at 20:43Z |

## Documents Downloaded (8 total)

| # | dok_id | Title | Type | Committee | Date | Full-text |
|:--|--------|-------|------|-----------|------|-----------|
| 1 | HD01CU24 | Effektiv och säker byggprocess | bet | CU | 2026-04-24 | ✅ |
| 2 | HD01JuU10 | En ny vapenlag | bet | JuU | 2026-04-24 | ✅ |
| 3 | HD01JuU31 | Riksrevisionens rapport om Polisreformen 2015 | bet | JuU | 2026-04-24 | ✅ |
| 4 | HD01SoU25 | Stärkta insatser för äldre och för de som vårdar eller stöder närstående | bet | SoU | 2026-04-24 | ✅ |
| 5 | HD10448 | Budget interpellation/fråga | other | — | 2026-04-24 | ✅ |
| 6 | HD11747 | Riksdag record document | other | — | 2026-04-24 | ✅ |
| 7 | HD11748 | Riksdag record document | other | — | 2026-04-24 | ✅ |
| 8 | HD11749 | Riksdag record document | other | — | 2026-04-24 | ✅ |

## Sibling Folder Cross-References (Tier-C)

Today's evening analysis ingests sibling analyses from 2026-04-24 (closest prior business day):

| Folder | Path | Status |
|--------|------|--------|
| committeeReports | analysis/daily/2026-04-24/committeeReports/ | ✅ Read: synthesis-summary, intelligence-assessment |
| propositions | analysis/daily/2026-04-24/propositions/ | ✅ Read: synthesis-summary |
| motions | analysis/daily/2026-04-24/motions/ | ✅ Read: synthesis-summary |
| interpellations | analysis/daily/2026-04-24/interpellations/ | ✅ |
| evening-analysis (prior) | analysis/daily/2026-04-24/evening-analysis/ | ✅ Context |

## Reference Analyses Ingested (§Tier-C Ingestion)

- `analysis/daily/2026-04-24/committeeReports/synthesis-summary.md` — 5-report pre-election cluster (CU25, SfU23, FiU23, AU15, CU29)
- `analysis/daily/2026-04-24/committeeReports/intelligence-assessment.md` — KJ-1 to KJ-5 on cluster signalling
- `analysis/daily/2026-04-24/propositions/synthesis-summary.md` — EU Banking Package, detainee benefits
- `analysis/daily/2026-04-24/motions/synthesis-summary.md` — Counter-motion wave 20 motions

## Statskontoret Enrichment

Police reform implementation capacity: Statskontoret published evaluation of Polismyndigheten capacity 2020; relevant to HD01JuU31 context. URL: https://www.statskontoret.se/globalassets/publikationer/2020/202024.pdf [Admiralty: C3, public web source].

## Non-MCP Sources Used

| Source | URL | Purpose |
|--------|-----|---------|
| Riksdag election calendar | https://www.riksdagen.se/sv/sa-fungerar-riksdagen/riksdagens-uppgifter/val/ | Election context [A1] |
| IMF WEO Apr-2026 (CLI cache) | api.imf.org | Economic context Sweden |
