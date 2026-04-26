---
title: Forward Indicators — Committee Reports 2026-04-26
---

# Forward Indicators — April 2026 Committee Reports

## Indicator Framework

12+ dated indicators across 4 horizons (30/60/90/180 days) monitoring the April 2026 committee reports package.

---

## Horizon 1: 30 Days (by 2026-05-26)

**I-01: HD01FiU48 Royal Assent and Enactment** [Technical milestone]
- **Expected**: Royal Assent in May 2026; Skatteverket begins fuel tax reduction system update
- **Confirmation source**: Riksdagen plenary vote record; Skatteverket announcement
- **Signal value**: Confirms delivery timeline (HIGH confidence)

**I-02: HD01JuU10 Parliamentary Plenary Vote** [Political milestone]
- **Expected**: Vote scheduled for May 2026 plenary session
- **Watch for**: Margin of victory; number of Ja votes from SD/KD rural MPs
- **If margin > 300 Ja**: Broad consensus; legal challenge risk lower
- **If margin 176-200**: Narrow passage; higher legal challenge motivation from affected parties
- **Source**: Riksdagen vote records (riksdagen.se)

**I-03: Jägarförbundet Legal Challenge Filing** [Risk indicator]
- **Expected**: Challenge filed within 30 days of Royal Assent or before June 2026
- **Watch for**: Filing at Förvaltningsrätten; application for interim injunction
- **If filed with interim injunction request**: HD01JuU10 implementation at high risk
- **Source**: Förvaltningsrätten public case register

**I-04: IMF WEO April 2026 Sweden Revision** [Economic baseline]
- **Expected**: IMF WEO April 2026 edition released; Sweden GDP projection confirmed
- **Watch for**: Sweden growth rate > or < +1.5% for 2026
- **If Sweden GDP projection ≥ +1.5%**: Economic tailwind for coalition
- **Source**: IMF WEO April 2026; `scripts/imf-fetch.ts weo --country SWE --indicator NGDP_RPCH`

---

## Horizon 2: 60 Days (by 2026-06-26)

**I-05: HD01FiU48 Fuel Price Impact Measurement** [Economic indicator]
- **Expected**: June data from Statistics Sweden (SCB) showing petrol/diesel price change at pump
- **Watch for**: Actual consumer price reduction ≥ 0.50 SEK/litre
- **If visible reduction**: Government can point to tangible delivery; electoral benefit crystallises
- **If prices rise despite cut**: Middle East/global commodity price overwhelms relief; narrative fails
- **Source**: SCB consumer price index (CPI); Preem/Circle K retail price data

**I-06: HD01CU25 First Prison Site Announcement** [Capital delivery]
- **Expected**: Kriminalvården announces one or more identified sites for new prison construction
- **Watch for**: Municipal government response; legal challenge from Kommunförbundet
- **If announcement with site**: Implementation on schedule
- **If delayed**: PBL challenge complexity has stalled site selection
- **Source**: Kriminalvården press releases; local media in targeted municipalities

**I-07: HD01JuU10 Weapons Surrender Data** [Implementation compliance]
- **Expected**: First month post-June 2026 compliance data from Polismyndigheten
- **Watch for**: Number of weapons surrendered vs estimated stock of banned weapons
- **If compliance > 60%**: Law functioning; enforcement credible
- **If compliance < 30%**: Enforcement crisis; black market expansion risk
- **Source**: Polismyndigheten annual/quarterly statistics

---

## Horizon 3: 90 Days (by 2026-07-26)

**I-08: Pre-Election Coalition Poll Average** [Electoral indicator]
- **Expected**: Sifo/Demoskop/Novus July 2026 polls with pre-summer consolidation
- **Watch for**: Tidö bloc at > or < 49%
- **If Tidö > 49%**: HD01FiU48 and CU25 are working; scenario A (Coalition Continuity) strengthens
- **If Tidö < 47%**: HD01JuU31 police failure narrative dominating; scenario B (Electoral Disruption) strengthens
- **Source**: SCB; Sifo; Novus poll aggregates

**I-09: HD01JuU31 Police Incident Test** [Institutional stress indicator]
- **Expected**: Any major criminal incident (gang violence, organised crime) in June-July 2026
- **Watch for**: Opposition use of HD01JuU31 findings in response to incident
- **If major incident occurs before election**: Police reform failure narrative explodes — high impact
- **If no major incident**: JuU31 impact contained — technical governance story
- **Source**: BRÅ (Brottsförebyggande rådet) incident statistics; media monitoring

**I-10: HD01FiU23 Riksbank Dividend Pressure** [Fiscal independence indicator]
- **Expected**: Government budget discussions for 2027 begin in July 2026
- **Watch for**: Any government statement suggesting Riksbank dividend may be reconsidered
- **If zero dividend maintained**: Institutional independence preserved; FiU23 precedent holds
- **If government requests extraordinary dividend**: Institutional risk elevated; T2.3 threat activated
- **Source**: Finance Ministry statements; Riksdag Finance Committee minutes

---

## Horizon 4: 180 Days (by 2026-10-26, post-election)

**I-11: September 2026 Election Result** [Ultimate validation]
- **Expected**: Riksdag election 20 September 2026
- **Watch for**: Tidö margin vs S-led bloc; C kingmaker role; KD and L threshold performance
- **This indicator validates or refutes all electoral predictions in election-2026-analysis.md**
- **Source**: Valmyndigheten (Election Authority) official results

**I-12: Post-Election HD01FiU48 Survival Test** [Policy persistence]
- **Expected**: New government's 2027 budget (October-November 2026) will confirm or reverse fuel tax cut
- **Watch for**: If S-led government reverses cut: confirms electoral positioning hypothesis (H2)
- **If Tidö continues and extends cut**: Confirms substantive policy hypothesis (H1)
- **Source**: Riksdag budget proposition 2027; Finance Ministry press releases

**I-13: HD01CU25 First Construction Contract Award** [Capital delivery milestone]
- **Expected**: First prison construction contract awarded by Q4 2026
- **Watch for**: Contract size; contractor; municipal acceptance or legal challenge outcome
- **Source**: Upphandlingsmyndigheten (public procurement authority) contract register

## Indicator Summary Table

| Code | Indicator | Horizon | Priority | Source |
|------|-----------|---------|----------|--------|
| I-01 | FiU48 Royal Assent | 30 days | HIGH | Riksdagen.se |
| I-02 | JuU10 plenary vote margin | 30 days | HIGH | Riksdagen.se votes |
| I-03 | Jägarförbundet legal challenge | 30 days | HIGH | Förvaltningsrätten |
| I-04 | IMF WEO Apr-2026 Sweden | 30 days | MEDIUM | IMF API |
| I-05 | Fuel price impact at pump | 60 days | HIGH | SCB CPI |
| I-06 | First prison site announcement | 60 days | HIGH | Kriminalvården |
| I-07 | Weapons surrender rate | 60 days | MEDIUM | Polismyndigheten |
| I-08 | Pre-election polls | 90 days | VERY HIGH | Sifo/Novus |
| I-09 | Police incident test | 90 days | HIGH | BRÅ + media |
| I-10 | Riksbank dividend pressure | 90 days | MEDIUM | Finance Ministry |
| I-11 | Election result | 180 days | CRITICAL | Valmyndigheten |
| I-12 | FiU48 policy survival | 180 days | HIGH | Budget 2027 |
| I-13 | CU25 first contract | 180 days | MEDIUM | Upphandlingsmyndigheten |

