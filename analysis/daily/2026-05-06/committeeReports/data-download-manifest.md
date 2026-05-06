# Data Download Manifest — 2026-05-06

**Generated**: 2026-05-06 20:09 UTC
**Workflow**: news-committee-reports
**Run ID**: 25458125185
**Data Sources**: riksdag-regering MCP (get_betankanden, get_dokument_innehall)
**Documents Downloaded**: 20 (date-filtered to 5)
**Effective Date**: 2026-05-06
**Riksmöte**: 2025/26

## Document Table

| dok_id | Title | Committee | Date | Full Text | Withdrawal |
|--------|-------|-----------|------|-----------|------------|
| HD01CU25 | En snabbare utbyggnad av kriminalvårdsanstalter och häkten | CU | 2026-05-06 | true | none |
| HD01FöU16 | Ändrade regler om tillstånd och tillsyn för Totalförsvarets forskningsinstitut | FöU | 2026-05-06 | true | none |
| HD01FöU18 | Signalspaning i försvarsunderrättelseverksamhet – en modern och ändamålsenlig lagstiftning | FöU | 2026-05-06 | true | none |
| HD01SfU21 | Kvalificering till socialförsäkringen | SfU | 2026-05-06 | true | none |
| HD01SfU24 | Ett mer träffsäkert och korrekt bostadsbidrag | SfU | 2026-05-06 | true | none |

## Full-Text Fetch Outcomes

| dok_id | full_text_available | method |
|--------|--------------------|----|
| HD01CU25 | true | get_dokument_innehall |
| HD01FöU16 | true | get_dokument_innehall |
| HD01FöU18 | true | get_dokument_innehall |
| HD01SfU21 | true | get_dokument_innehall |
| HD01SfU24 | true | get_dokument_innehall |

## Prior-Voteringar Enrichment

Search conducted via `search_voteringar` for committees SfU, FöU, CU across last 4 riksmöten (2022/23–2025/26).

- **New riksmöte 2025/26**: No votes yet indexed for current session. Applied fallback: searched by committee + expanded riksmöte scope. `Prior voteringar: new riksmöte — no votes indexed yet for SfU/FöU in 2025/26; using 2024/25 cycle proxy.`
- **SfU (socialförsäkring, 2024/25)**: AU10 vote found, 2025-05-14 — related to labour market committee, not direct SfU equivalent.
- Per 03-data-download.md §Voteringar fallback for new riksmöten, this is tagged as 🟡 partial under methodology limitations.

## Statskontoret Cross-Source Enrichment

**Triggers evaluated for each document:**

- **HD01CU25**: Names Kriminalvården (agency trigger). Statskontoret search conducted via web_fetch. Result: `Statskontoret: no directly relevant current report found for Kriminalvårdens expansion (trigger: agency capacity for prison construction)`.
- **HD01FöU16**: Names FOI (Totalförsvarets forskningsinstitut) — government research agency. `Statskontoret: no directly relevant source found for FOI supervisory framework change`.
- **HD01FöU18**: FRA signal intelligence — no Statskontoret dimension. `Statskontoret pre-warm: no trigger matched (no agency named with administrative capacity dimension)`.
- **HD01SfU21**: Försäkringskassan (agency trigger — administers socialförsäkringen). `Statskontoret: no directly relevant current report found for Försäkringskassan qualification implementation`.
- **HD01SfU24**: Försäkringskassan (bostadsbidrag administration). `Statskontoret: no directly relevant source found for bostadsbidrag monthly calculation reform`.

## Lagrådet Tracking

- **HD01CU25** (prop. 2025/26:209): Touches plan- och bygglagen. Lagrådet referral expected for emergency powers clause (16 kap. 12a § PBL). `Lagrådet: referral pending / yttrande not confirmed as of 2026-05-06T20:09 UTC`.
- **HD01FöU18** (prop. 2025/26:179): Signal intelligence legislation touches fundamental rights (RF Ch. 2, ECHR Art. 8). Lagrådet review statutorily required. `Lagrådet: referral conducted per proposition beredning; specific yttrande URL not retrieved due to lagradet.se access limitation during run`.
- **HD01SfU21** (prop. 2025/26:136): Welfare qualification touches RF Ch. 2 equal treatment, ECHR Protocol 1. `Lagrådet: referral expected; specific yttrande URL not retrieved`.
- **HD01FöU16**, **HD01SfU24**: Administrative/technical changes. `Lagrådet: no Lagrådet review required for administrative harmonization`.

## PIR Carry-Forward

No prior-cycle PIRs found within 14-day lookback window for committeeReports subfolder. New PIRs established in this cycle.

## MCP Server Notes

- riksdag-regering MCP: Live (status confirmed at 20:07 UTC)
- IMF: Degraded (WEO/FM Datamapper OK; SDMX/IFS unavailable — standard warning block applied)
- World Bank: Not queried (governance/WGI indicators not primary for this article type)
