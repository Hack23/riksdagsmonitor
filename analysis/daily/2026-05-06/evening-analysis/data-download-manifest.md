---
title: "Data Download Manifest — Evening Analysis 2026-05-06"
date: 2026-05-06
subfolder: evening-analysis
---

# Data Download Manifest

## Sources Accessed

| Source | Tool | Documents | Status |
|--------|------|-----------|--------|
| riksdag-regering MCP | riksdag-regering-get_betankanden | HD01JuU30, HD01SfU21, HD01CU25, HD01FöU18, HD01FöU16, HD01SfU24 | ✅ Success |
| riksdag-regering MCP | riksdag-regering-get_propositioner | HD03249, HD03248, HD03258, HD03262-264 | ✅ Success |
| riksdag-regering MCP | riksdag-regering-get_motioner | HD024141-148 | ✅ Success |
| riksdag-regering MCP | riksdag-regering-get_dokument_innehall | HD01JuU30, HD01FöU18 full text | ✅ Success |
| riksdag-regering MCP | riksdag-regering-search_voteringar | JuU30, CU25 voting records | ✅ Partial (JuU30 confirmed) |
| riksdag-regering MCP | riksdag-regering-get_dokument | HD01JuU30, HD01CU25, HD01FöU18 | ✅ Success |
| IMF | npx tsx scripts/imf-fetch.ts | WEO Sweden | ⚠️ Degraded (SDMX endpoint) |
| Sibling analysis | File read | committeeReports, propositions, motions executive-briefs | ✅ Success |

## Key Documents

| dok_id | Type | Title | Date | Status |
|--------|------|-------|------|--------|
| HD01JuU30 | bet | Frihetsberövande påföljder för barn och unga | 2026-05-05 | ✅ Adopted |
| HD01SfU21 | bet | Kvalificering för socialförsäkringen | 2026-05-06 | ✅ Adopted |
| HD01CU25 | bet | Snabbare utbyggnad av kriminalvårdsanstalter | 2026-05-06 | ✅ Adopted |
| HD01FöU18 | bet | Signalspaning i försvarsunderrättelseverksamhet | 2026-05-06 | ✅ Adopted (unanimous) |
| HD01FöU16 | bet | Ändrade regler för FOI | 2026-05-06 | ✅ Adopted (unanimous) |
| HD01SfU24 | bet | Bostadsbidrag och beräkning | 2026-05-06 | ✅ Adopted |
| HD03249 | prop | EU-Uzbekistan EPCA | 2026-05-06 | Tabled, referred UU |
| HD03248 | prop | EU-Kyrgyzstan EPCA | 2026-05-06 | Tabled, referred UU |
| HD03262 | prop | Utmönstring av permanent uppehållstillstånd | 2026-04-30 | Tabled, referred SfU |
| HD03258 | prop | Ökad insyn i politiska processer | 2026-04-30 | Tabled, referred KU |
| HD024141-148 | mot | Opposition motions on forestry + youth crime | 2026-05-04 | In committee |

## MCP Reliability

- riksdag-regering MCP: LIVE ✅ (https://riksdag-regering-ai.onrender.com/mcp)
- IMF SDMX endpoint: DEGRADED ⚠️ (WEO Datamapper functional; SDMX endpoint unavailable)
- World Bank MCP: Not tested (economic data from IMF WEO cached/degraded)
- SCB: Not accessed (Swedish-specific ground truth not required for this synthesis)

## Voting Data Quality

JuU30 individual votes confirmed from API (20 sample records). Party grouping not yet available (sync delay). Based on individual votes: M, SD, S, C all voted Ja; MP voted Nej. Full tally not yet available.

## Data Vintage

- Betänkanden: Published 2026-05-05 to 2026-05-06 ✅ Fresh
- Propositioner: Published 2026-04-30 and 2026-05-06 ✅ Fresh
- IMF WEO: April 2026 vintage (< 6 months) ✅ Valid with annotation
- Sibling analyses: Generated same day 2026-05-06 ✅ Fresh
