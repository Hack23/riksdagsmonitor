# Forward Indicators
**Date**: 2026-05-20 | **Subfolder**: realtime-pulse  
**Scope**: Trigger events and monitoring signals for KU34, SoU29/30, JuU43  
**Horizon**: T+7d / T+30d / T+90d / T+120d (election)  
**Framework**: Signal intelligence per monitoring-indicators.md + intelligence-assessment.md PIRs

---

## Immediate Indicators (T+1 to T+7 days)

| ID | Indicator | Source | Trigger threshold | PIR link |
|----|-----------|--------|------------------|----------|
| FI-01 | KU34 vote tallies published | riksdagen.se/voteringar | Any party with unexpectedly low YES count | PIR-RT-1 |
| FI-02 | Party leadership statements on KU34 | SVT/SR/party websites | Any party hedging on second reading commitment | PIR-RT-1 |
| FI-03 | SD internal communications post-vote | SD party comms / Samtiden | Conservative base criticism of abortion support | PIR-RT-3 |
| FI-04 | SOU/SFS publication for SoU30 | regeringen.se/rattsliga-dokument | Not published by May 27 = ALERT | PIR-RT-4 |
| FI-05 | HD03267 committee referral date | riksdagen.se/dokument | JuU referral for Lagrådet language review | PIR-PROP-1 |

*API query for FI-01*: `riksdag-regering/search_voteringar?bet=KU34&rm=2025/26`  
*API query for FI-04*: `riksdag-regering/search_dokument?dok_type=SFS&titel=SoU30&from_date=2026-05-20`

---

## Short-Term Indicators (T+7 to T+30 days)

| ID | Indicator | Source | Trigger threshold | PIR link |
|----|-----------|--------|------------------|----------|
| FI-10 | SKR guidance for SoU30 municipalities | skr.se/nyheter | Not published by June 1 = CRITICAL ALERT | PIR-RT-4 |
| FI-11 | Försäkringskassan IT system readiness bulletin | fk.se/nyheter | Any mention of delay or "transition period" | PIR-RT-4 |
| FI-12 | Red Cross/UNHCR legal challenge filing | Amnesty/UNHCR Sweden press releases | Any formal notification of challenge | PIR-RT-5 |
| FI-13 | Poll tracking post-vote | SIFO/Demoskop Swedish tracker | S+left bloc ≥ 50% or any single party shift ≥ 2pp | PIR-ELECT-01 |
| FI-14 | L threshold polling | SIFO tracker | L below 4.0% in any major poll | PIR-ELECT-03 |
| FI-15 | KD/M messaging on constitutional package | Party press releases | KD downplaying abortion provision = ALERT | PIR-RT-1 |

---

## Medium-Term Indicators (T+30 to T+90 days)

| ID | Indicator | Source | Trigger threshold | PIR link |
|----|-----------|--------|------------------|----------|
| FI-20 | SoU30 implementation error reports | SVT Nyheter, socialstyrelsen.se | First visible wrongful denial case = media trigger | PIR-RT-4 |
| FI-21 | Municipal social service stress signals | SKR ärendekorg / kommunpressar | Välfärd commune requesting delay = ALERT | PIR-RT-4 |
| FI-22 | S campaign messaging on welfare | S valmanifest preview | Welfare reversal ranked #1 campaign priority? | PIR-ELECT-02 |
| FI-23 | HD03267 (security threat) committee passage | riksdagen.se/dokument | JuU betänkande publication date | PIR-PROP-1 |
| FI-24 | C campaign positioning | C partiledardebatt statements | C explicitly commits to left-center coalition? | coalition-mathematics |
| FI-25 | SD conservative backlash media coverage | SD social media / Samtiden | 5+ prominent SD members critical of abortion vote | PIR-RT-3 |

---

## Pre-Election Indicators (T+90 to T+120 days)

| ID | Indicator | Source | Trigger threshold | PIR link |
|----|-----------|--------|------------------|----------|
| FI-30 | Final pre-election polls | All major pollsters | Left-center ≥ 52% or Tidö ≥ 52% | PIR-ELECT-01 |
| FI-31 | KU34 "second reading intention" party statements | All party programs | Any wavering on second reading = CRITICAL | PIR-RT-1 |
| FI-32 | SD threshold polling | SIFO | SD below 15% = structural coalition shift | coalition-mathematics |
| FI-33 | Implementation lawsuit filed | Förvaltningsrätten / Kammarrätten | Any case challenging SoU30 provisions | PIR-RT-5 |
| FI-34 | European Social Charter complaint filed | Council of Europe ECSR | Any formal complaint registered | PIR-RT-5 |

---

## Monitoring Calendar

| Date | Required monitor action |
|------|------------------------|
| 2026-05-22 | Check riksdagen.se for KU34 vote tallies (FI-01) |
| 2026-05-27 | SFS/förordning publication check (FI-04) |
| 2026-06-01 | SKR guidance alert (FI-10) — CRITICAL |
| 2026-06-15 | Försäkringskassan readiness check (FI-11) |
| 2026-07-01 | SoU30 implementation day — monitor first cases (FI-20) |
| 2026-08-14 | Pre-campaign final polling check (FI-30) |
| 2026-09-13 | ELECTION DAY — all electoral indicators resolved |

---

## Intelligence Requirements Update

Based on today's analysis, the following NEW PIRs are added to the tracking register:

- **PIR-ELECT-01**: Which party's messaging on KU34 second reading generates greatest voter mobilization?
- **PIR-ELECT-02**: Can S successfully frame SoU30 as welfare attack without alienating moderate voters?
- **PIR-ELECT-03**: Will L cross the 4% threshold? (Existential for Tidö majority)
- **PIR-ELECT-04**: SD conservative base reaction to abortion constitutional support

These PIRs inherit from existing PIR-RT-1 through PIR-RT-5 and supplement the propositions/motions PIR cluster.
