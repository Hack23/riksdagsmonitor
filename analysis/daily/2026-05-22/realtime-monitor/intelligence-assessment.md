# Intelligence Assessment — Realtime Monitor 2026-05-22

**Classification**: OSINT — Public  
**Admiralty Rating**: B2 (Reliable source, probably true)  
**ICD 203 Standards Applied**: 9/9  
**Kent Scale Confidence**: HIGH  
**Analyst**: James Pether Sörling  
**Date**: 2026-05-22  

---

## Key Judgments

**KJ-1** [HIGH confidence]: The Tidö government will pass proposition 2025/26:267 (security-threat foreigners) with a Riksdag majority, despite MP's motion HD024192. The coalition arithmetic (176 seats + 24 C support = 200/349) is decisive. Opposition challenge will be on record but will not change the outcome.

**KJ-2** [HIGH confidence]: Sweden's family reunification regime will be further restricted via HD01SfU37 before the 2026 summer recess. SfU committee is dominated by Tidö coalition parties; S is unlikely to provide decisive counter-majority.

**KJ-3** [MEDIUM confidence]: The child-detention provisions in prop. 2025/26:267 will generate between 2 and 10 days of sustained national media coverage, including at least one broadcast interview with Barnombudsmannen or a relevant NGO representative. International coverage is possible but unlikely to be sustained.

**KJ-4** [MEDIUM confidence]: Lagrådet advisory on prop. 2025/26:267 contains at least one reservation or recommendation regarding proportionality of child-detention provisions. This assessment cannot be confirmed without accessing the yttrande on `www.lagradet.se`.

**KJ-5** [LOW confidence]: C party will file formal reservations in JuU on child-detention provisions. Historical pattern suggests C's liberal-identity concerns will be expressed in reservations rather than voting against the government; the reservation route allows face-saving without defeating legislation.

---

## Intelligence Gaps

| Gap ID | Description | Impact | Collection Method |
|--------|-------------|--------|------------------|
| IG-001 | Lagrådet advisory status on prop. 2025/26:267 | HIGH — changes risk assessment significantly | web_fetch to www.lagradet.se |
| IG-002 | Full text of prop. 2025/26:261 (Skatteverket powers) | MEDIUM — needed for civil-liberties assessment accuracy | get_dokument_innehall prop_id |
| IG-003 | S party formal position on HD01SfU37 | MEDIUM — affects scenario probabilities | search_anforanden / press monitoring |
| IG-004 | Committee vote dates for JuU, SfU, SkU | MEDIUM — timeline precision | get_calendar_events riksdag |
| IG-005 | Full text of HD01SfU37 betänkande | MEDIUM — needed for precise restriction assessment | get_dokument_innehall HD01SfU37 |

---

## Source Assessment

| Source Type | Reliability | Information Quality | Combined |
|-------------|:----------:|:-------------------:|:-------:|
| Riksdagen API (official documents) | A — Completely reliable | 1 — Confirmed | A1 |
| Document metadata (dates, titles) | A — Confirmed | 1 — Confirmed | A1 |
| Inferred party positions (Tidö agreement) | B — Reliable | 2 — Probably true | B2 |
| Electoral impact projections | C — Fairly reliable | 3 — Possibly true | C3 |

---

## Analytical Assumptions

1. **Riksdag vote arithmetic** uses official seat counts from 2022 election results, assumed stable unless by-elections or party changes (none known as of 2026-05-22).
2. **Party positions** are inferred from: (a) Tidö government agreement text, (b) known party manifestos, (c) prior voting records — not from today's documents, which are committee-level.
3. **International comparison data** uses publicly available ECtHR case law and CoE monitoring reports — all OSINT.

---

## Confidence Calibration

The key judgments above apply the Kent Scale (ICD 203 §7):
- "Will pass with majority" = HIGH confidence (>80% probability)
- "Will generate media coverage" = MEDIUM confidence (55-75% probability)
- "Lagrådet has reservations" = MEDIUM confidence (55-65% probability)
- "C will file reservations" = LOW confidence (35-45% probability)

---

## PIR Handoff

| PIR-ID | Statement | Status | Due | Method |
|--------|-----------|--------|-----|--------|
| PIR-RT-001 | JuU dissenting reservations on child detention? | open | T+14d | Monitor JuU committee reports |
| PIR-RT-002 | S/MP/V vote on HD01SfU37? | open | T+7d | Monitor SfU vote announcement |
| PIR-RT-003 | Lagrådet advisory content on prop. 2025/26:267? | open | T+3d | web_fetch www.lagradet.se |
| PIR-RT-004 | Media cycle duration for child-detention story? | open | T+10d | Press monitoring |
