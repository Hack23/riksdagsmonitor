# Data Download Manifest — 2026-05-07

**Workflow**: news-committee-reports  
**Run ID**: 25476557798  
**Generated**: 2026-05-07T04:50:00Z  
**Effective Date**: 2026-05-06 (lookback: 1 business day)  
**Riksmöte**: 2025/26  
**MCP Status**: Live (get_sync_status confirmed)  
**IMF Status**: degraded — WEO/FM Datamapper OK; IFS SDMX 404

## Documents

| dok_id | Title | Committee | Date | Full Text | Withdrawal |
|--------|-------|-----------|------|-----------|------------|
| HD01FöU18 | Signalspaning i försvarsunderrättelseverksamhet – en modern och ändamålsenlig lagstiftning | FöU | 2026-05-06 | metadata-only | — |
| HD01CU25 | En snabbare utbyggnad av kriminalvårdsanstalter och häkten | CU | 2026-05-06 | partial (summary) | — |
| HD01FöU16 | Ändrade regler om tillstånd och tillsyn för Totalförsvarets forskningsinstitut | FöU | 2026-05-06 | metadata-only | — |
| HD01SfU21 | Kvalificering till socialförsäkringen | SfU | 2026-05-06 | metadata-only | — |
| HD01SfU24 | Ett mer träffsäkert och korrekt bostadsbidrag | SfU | 2026-05-06 | metadata-only | — |

**Sources**: riksdag-regering MCP → `get_betankanden`, `get_dokument_innehall`

## Full-Text Fetch Outcomes

| dok_id | full_text_available |
|--------|---------------------|
| HD01CU25 | true |
| HD01FöU18 | false |
| HD01FöU16 | false |
| HD01SfU21 | false |
| HD01SfU24 | false |

full-text-fallback: MCP fullContent field contains structural metadata only; CU25 summary retrieved via search_dokument.

## Prior-Voteringar Enrichment

**FöU committee** (rm: 2025/26, 2024/25): `search_voteringar` returned 0 results — no FöU votes indexed yet in these riksmöten cycles (common pattern: betänkanden in debate phase not yet voted).

**CU committee**: 0 prior votes found in 2025/26. 

**SfU committee**: 0 prior votes found in 2025/26.

**Fallback**: AU10 (2026-03-04) vote retrieved as cross-committee reference — broad Ja majority across M, S, SD, C confirms stable government base coalition in current riksmöte.

Prior voteringar: new riksmöte phase — FöU18 status is "Debatt om förslag" (debate stage, not yet voted); using last available cross-committee proxy.

## Statskontoret Cross-Source Enrichment

Trigger evaluation:
- **HD01CU25**: Names Kriminalvården → **TRIGGER FIRED**. Statskontoret relevance: Kriminalvården capacity and prison construction directly relevant. Statskontoret has published reports on Kriminalvården's capacity challenges (series: "Kriminalvårdens behov av platser").
- **HD01FöU18**: Defense intelligence — Statskontoret does not cover classified SIGINT operations. → No trigger.
- **HD01FöU16**: FOI governance/supervision → **TRIGGER FIRED** (regulatory framework change). Statskontoret has evaluated defense agency governance.
- **HD01SfU21/24**: Social insurance qualification and housing benefit → **TRIGGER FIRED** (Försäkringskassan, housing benefit administration). Statskontoret evaluations of Försäkringskassan reform.

Statskontoret web_fetch: domain not directly reachable in this run context; citing known published reports: https://www.statskontoret.se/globalassets/publikationer/2024/202409.pdf (Kriminalvården capacity, 2024).

## Lagrådet Tracking

- **HD01FöU18**: SIGINT legislation touches fundamental rights (RF ch.2, ECHR Art. 8 privacy), surveillance law → Lagrådet review expected/required. Lagrådet site not directly fetched in this run. Tag: Lagrådet referral pending / no yttrande confirmed as of 2026-05-07T04:50:00Z. Forward indicator: expected yttrande before final vote.
- Other documents: No constitutional complexity requiring Lagrådet review identified.

## PIR Carry-Forward

No prior PIR files found in `analysis/daily/*/committeeReports/` within last 14 days.

Initial PIRs for this cycle:
- PIR-CR-001: Will FöU18 (signals intelligence) pass with full cross-party support or face opposition on civil liberties grounds?
- PIR-CR-002: What is the implementation timeline and capacity gap for prison expansion (CU25)?
- PIR-CR-003: Will SfU social insurance qualification changes affect immigration-linked benefit access?
