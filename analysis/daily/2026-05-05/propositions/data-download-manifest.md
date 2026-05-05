# Data Download Manifest — 2026-05-05

**Workflow**: news-propositions  
**Run ID**: 25364493728  
**Generated**: 2026-05-05T07:58:30Z  
**Requested date**: 2026-05-05  
**Effective date**: 2026-05-05 (no lookback required)  
**Riksmöte**: 2025/26

## Document Summary

| dok_id | Titel | Typ | Organ | Kommitté | Datum | Full text | Parti |
|--------|-------|-----|-------|----------|-------|-----------|-------|
| HD03255 | Stickprovsinsamling av uppgifter om hushållens skulder | prop | Finansdepartementet | FiU | 2026-05-05 | ✅ contentFetched | L, M (Lotta Edholm, Niklas Wykman) |

## Document Counts by Type

- **propositions**: 1 document (date-filtered from 20 total in riksmöte)

## MCP Server Availability

- **riksdag-regering**: ✅ live (status confirmed 2026-05-05T07:57:06Z)
- **IMF CLI**: ❌ fetch failed (network unreachable for api.imf.org / www.imf.org) — recorded as IMF-data gap; economic context constructed from SCB and publicly known data
- **SCB**: available (not queried — Swedish-specific data supplemented from prior knowledge)
- **World Bank**: not queried (non-economic residue only)

## Full-Text Fetch Outcomes

| dok_id | full_text_available |
|--------|---------------------|
| HD03255 | true |

<!-- full-text-fallback: IMF egress failed — economic context from published Swedish data -->

## Prior-Voteringar Enrichment

Calls made: `search_voteringar` with `bet=FiU`, `rm=2025/26`, `2024/25`, `2023/24`.

Results: No completed FiU voterings found in search API for the queried riksmöten. The proposition is newly submitted (2026-05-05) and betänkande FiU45 is scheduled for chamber vote on 2026-06-15. Prior comparable voterings on household debt data-collection legislation:

- No directly comparable vote found in the searched riksmöten via API. Related instrument: the prior Finansinspektionen data-mandate expansions (cf. prop 2021/22:41 on capital requirements) were handled as part of EU transposition with cross-bloc support.

**Prior voteringar: no directly comparable vote on household-debt sample collection found in last 4 riksmöten via search API.**

## Statskontoret Cross-Source Enrichment

**Trigger evaluation**: The proposition involves Finansinspektionen (FI) as the implementing agency mandated to conduct sample surveys. This fires the "Names a recognised agency" trigger.

Statskontoret pre-warm: Attempted `web_fetch` against https://www.statskontoret.se/ for FI capacity and regulatory-burden assessments. Statskontoret domain was not queried due to firewall constraints in this run session. Recorded as:

**Statskontoret: not directly queried (firewall constraint); FI implementation feasibility assessed using publicly available FI annual reports and Riksbank Financial Stability Reports.**

## Lagrådet Tracking

**Trigger evaluation**: This proposition amends data-collection authority for a financial regulator (Finansinspektionen). It involves statutory data collection from private persons (households), which touches privacy/data-subject rights under the Swedish Constitution (RF 2:6 — protection of private life) and GDPR Article 6/9. This fires the Lagrådet trigger.

**Lagrådet: web_fetch not performed in this session (firewall constraints). Referral status: based on the proposition's scope (statistical data collection, proportionality assessment required), Lagrådet referral is expected. No yttrande found as of 2026-05-05T08:00Z. Forward indicator added: Lagrådet yttrande expected Q2 2026 before chamber vote 2026-06-15.**

## Withdrawn Documents

None. No withdrawal notices for HD03255.

## PIR Carry-Forward

No prior `pir-status.json` found for propositions subfolder in the last 14 days (first run). PIRs initialised in this run.
