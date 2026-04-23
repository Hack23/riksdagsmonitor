# Data Download Manifest — Committee Reports 2026-04-23

**Workflow**: news-committee-reports
**Run ID**: 24817022343
**UTC Timestamp**: 2026-04-23T04:45:00Z
**Article Date**: 2026-04-23
**Effective Date**: 2026-04-21 (most recent reports)
**Data Window**: 2025/26 riksmöte, from_date 2026-04-01
**Riksdag Session**: 2025/26
**MCP Status**: live (riksdag-regering: OK, sync confirmed 2026-04-23T04:39:41Z)

## Document Table

| dok_id | Title | Committee | Date | Type | Data Depth | URL |
|--------|-------|-----------|------|------|-----------|-----|
| HD01FiU48 | Extra ändringsbudget för 2026 – Sänkt skatt på drivmedel samt el- och gasprisstöd | FiU | 2026-04-21 | bet | SUMMARY+METADATA | https://data.riksdagen.se/dokument/HD01FiU48 |
| HD01KU33 | Insyn i handlingar som inhämtas genom beslag och kopiering vid husrannsakan | KU | 2026-04-17 | bet | SUMMARY+METADATA | https://data.riksdagen.se/dokument/HD01KU33 |
| HD01KU32 | Tillgänglighetskrav för vissa medier | KU | 2026-04-17 | bet | SUMMARY+METADATA | https://data.riksdagen.se/dokument/HD01KU32 |
| HD01CU27 | Identitetskrav vid lagfart och åtgärder mot kringgåenden av bostadsrättslagen | CU | 2026-04-17 | bet | SUMMARY+METADATA | https://data.riksdagen.se/dokument/HD01CU27 |
| HD01CU28 | Ett register för alla bostadsrätter | CU | 2026-04-17 | bet | SUMMARY+METADATA | https://data.riksdagen.se/dokument/HD01CU28 |
| HD01CU22 | Ett ställföreträdarskap att lita på | CU | 2026-04-17 | bet | SUMMARY+METADATA | https://data.riksdagen.se/dokument/HD01CU22 |
| HD01MJU21 | Riksrevisionens rapport om statens insatser för jordbrukets klimatomställning | MJU | 2026-04-20 | bet | METADATA-ONLY | https://data.riksdagen.se/dokument/HD01MJU21 |
| HD01MJU19 | Reformering av avfallslagstiftningen för ökad materialåtervinning | MJU | 2026-04-16 | bet | SUMMARY+METADATA | https://data.riksdagen.se/dokument/HD01MJU19 |
| HD01SfU20 | Ett slopat krav på anmälan före ansökan om föräldrapenning | SfU | 2026-04-16 | bet | SUMMARY+METADATA | https://data.riksdagen.se/dokument/HD01SfU20 |
| HD01TU16 | Slopat krav på introduktionsutbildning för övningskörning | TU | 2026-04-21 | bet | SUMMARY+METADATA | https://data.riksdagen.se/dokument/HD01TU16 |

**Total documents**: 10
**Full text available**: 0 (API confirms fulltext_available=true; not fetched in this run to preserve rate limits)
**Summary available**: 9/10 (HD01MJU21 has no summary — METADATA-ONLY)

## MCP Server Notes

- `riksdag-regering` MCP: Available and live; sync at 2026-04-23T04:39:41Z
- Retrieval performed via `get_betankanden` + `search_dokument` + `get_dokument_innehall`
- `scb` MCP: Not queried in this manifest phase
- `world-bank` MCP: Not queried in this manifest phase
- IMF data: Not queried in this manifest phase

## Data Quality

- All 10 documents confirmed from riksdagen.se primary source [A1] per Admiralty Code
- Zero hallucinated dok_ids — all verified via API response
- Article date 2026-04-23 is current; lookback not required (multiple documents from 2026-04-14 to 2026-04-21)
