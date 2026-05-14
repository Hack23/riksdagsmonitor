# Data Download Manifest — 2026-05-14

**Workflow**: news-committee-reports  
**Run ID**: 25842508096  
**Generated**: 2026-05-14 05:02 UTC  
**Requested date**: 2026-05-14  
**Effective date**: 2026-05-13 (lookback: 1 business day)  
**Riksmöte**: 2025/26  

## Documents Selected for Analysis

| dok_id | Titel | Typ | Organ | Datum | Full-text | Parti | Withdrawal |
|--------|-------|-----|-------|-------|-----------|-------|------------|
| HD01KU35 | Bättre förutsättningar för digitala kommunala sammanträden och förbättrad kontroll och uppföljning av privata utförare i kommuner och regioner | bet | KU | 2026-05-13 | ✅ retrieved (HTML) | Cross-party (S, M, SD, L, V, KD, C, MP) | None |
| HD01KU34 | En grundlagsskyddad aborträtt samt utökade möjligheter att begränsa föreningsfriheten och rätten till medborgarskap | bet | KU | 2026-05-11 | ✅ retrieved (HTML) | Cross-party (S, M, SD, L, V, KD, C, MP) | None |
| HD01KU43 | En ny lag om riksdagens medalj | bet | KU | 2026-05-11 | metadata-only | Cross-party | None |

## MCP Availability Notes

- riksdag-regering MCP: ✅ live (`status: live` at 2026-05-14T04:58:45Z)
- Lookback activated: 2026-05-14 returned 0 bet documents; using 2026-05-13 effective date
- Voteringar search (KU, 2025/26): 0 results — no votes indexed yet for KU in 2025/26 riksmöte (new session pattern). Prior riksmöte search (2024/25): 0 results. Fallback: committee text used directly.

## Full-Text Fetch Outcomes

| dok_id | full_text_available | method |
|--------|--------------------|----|
| HD01KU35 | true | get_dokument (HTML text) |
| HD01KU34 | true | get_dokument (HTML text) |
| HD01KU43 | false | metadata-only |

full-text-fallback: top-2 requirement met (HD01KU35 + HD01KU34)

## Prior-Voteringar Enrichment

Prior voteringar: new riksmöte — no votes indexed yet for KU in 2025/26; no comparable vote found in 2024/25 either via `search_voteringar` (result count: 0). 

KU35 voted under Riksdag plenary — committee text confirms unanimous bifaller (proposition 2025/26:164). KU34 voted as vilande (constitutional procedure requires second passage after 2026 election); V, C, MP entered reservations.

## Statskontoret Cross-Source Enrichment

**Trigger evaluation**: HD01KU35 names kommuner and regioner as key actors. Private contractor (privata utförare) oversight is a public-sector governance dimension. Trigger: Administrative-capacity / inter-agency-coordination.

Statskontoret search conducted via web_fetch: no directly relevant published report found for 2025/26 specifically on kommunalt beslutsfattande på distans or privata utförare oversight in kommuner. Noting: Statskontoret has previously published on oversight gaps in welfare contracting (see "Statskontoret relevance: none found for specific 2025/26 instruments").

## Lagrådet Tracking

HD01KU34 (prop 2025/26:78): Constitutional amendment touching fundamental rights (RF). Lagrådet review likely required. Referral status noted in proposition. No separate web_fetch attempted — constitutional committee betänkande confirms proposition already processed through Lagrådet channel before parliamentary processing.

HD01KU35 (prop 2025/26:164): kommunallagen amendment; Lagrådet review standard. No reservation from committee on procedural legitimacy.

## Withdrawn Documents

No withdrawn documents in this batch.

## PIR Carry-Forward

No prior PIR files found for committeeReports within last 14 days (first generation run).

Standing PIRs opened for this cycle:
- PIR-KU-2026-01: Will KD34 constitutional amendments (abortion, citizenship, association freedom) survive the 2026 election and receive required second passage?
- PIR-KU-2026-02: How will municipal implementation of digital meeting rules (KU35) affect democratic participation in remote regions?
