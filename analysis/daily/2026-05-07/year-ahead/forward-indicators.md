# Forward Indicators — Year-Ahead 2026-05-07
# 12 Indicators Across 5 Time Bands

## Indicator Framework

Each indicator: ID, description, data source, monitoring frequency, trigger threshold, and associated scenario/PIR.

---

## Time Band 1: T+0 to T+30 (May 2026)

### FI-01: Lagrådet Yttrande on HD03267
**Description**: Swedish Council on Legislation (Lagrådet) publishes its opinion on the security expulsion proposition HD03267. This is a binary indicator: positive/neutral yttrande = law proceeds on track; negative yttrande with serious constitutional concerns = law faces reformulation delay.
**Source**: lagradet.se (weekly monitoring)
**Frequency**: Weekly
**Trigger threshold**: Negative yttrande mentioning ECHR Art. 3/8 non-refoulement as insurmountable = R05 activates
**Associated**: R05, T-R1, PIR-YA-2026-002, Wildcard W2
**Direction**: Positive yttrande → Scenario A/B both proceed; Negative → adds 3–6 months to timeline

### FI-02: Lagrådet Yttrande on HD03250
**Description**: Lagrådet opinion on the state e-ID proposition. Privacy/data protection concerns most likely focus.
**Source**: lagradet.se
**Frequency**: Weekly
**Trigger threshold**: Lagrådet requests substantial modifications = e-ID implementation slips T+6 months
**Associated**: R03, PIR-YA-2026-003

---

## Time Band 2: T+30 to T+90 (June–August 2026)

### FI-03: Riksdag Passage Vote — HD03250 (State e-ID)
**Description**: Riksdag TU committee report and chamber vote on state e-ID proposition. Cross-party support expected; minority motreservationer from MP (privacy) possible.
**Source**: riksdagen.se (voteringar)
**Frequency**: One-time event (expected June 2026)
**Trigger threshold**: Vote passes with >200 votes = strong mandate → implementation proceeds; Vote 175–199 = weak mandate → new government may review
**Associated**: PIR-YA-2026-003, Scenario A/B/C

### FI-04: Skatteverket Address Fraud Data (Q2 2026)
**Description**: Skatteverket publishes quarterly folkbokförings statistics including address discrepancy detection rate. Post-HD03261, this baseline measurement establishes the "before" picture for monitoring reform effectiveness.
**Source**: skatteverket.se (statistics portal)
**Frequency**: Quarterly
**Trigger threshold**: Address fraud detection rate > 2% of registrations = indicates scale of problem; < 0.5% = law may have limited impact
**Associated**: Implementation feasibility for HD03261

### FI-05: Riksdag Passage Vote — HD03267 (Security Expulsion)
**Description**: Riksdag JuU committee report and chamber vote on security expulsion proposition.
**Source**: riksdagen.se
**Frequency**: One-time event (expected June 2026 — conditional on Lagrådet positive yttrande)
**Trigger threshold**: Vote passes before election recess = law operative from Q3 2026; Vote delayed to post-election = new government decides
**Associated**: PIR-YA-2026-002, R05

### FI-06: Opinion Polls — Bloc Arithmetic (July–August 2026)
**Description**: Aggregated opinion polling for Riksdag election. Key watch points: L above/below 4.5% threshold; MP above/below 4.5% threshold; SD vs M balance within Tidö bloc.
**Source**: Demoskop, Ipsos, Kantar SIFO, Novus
**Frequency**: Weekly (accelerating to daily T+100 onwards)
**Trigger threshold**: L below 4.2% in 3 consecutive polls = Scenario A probability drops sharply; MP below 4.2% = Scenario B probability drops sharply
**Associated**: election-2026-analysis, coalition-mathematics, all scenarios

---

## Time Band 3: T+90 to T+129 (August–September 2026)

### FI-07: Housing Construction Permits (SCB, monthly)
**Description**: SCB monthly construction permits data. Continued decline = S campaign gains traction; Significant increase = Tidö incumbency benefit.
**Source**: SCB (Statistics Sweden) — bygglov statistics
**Frequency**: Monthly (SCB publication, ~8th of each month)
**Trigger threshold**: Permits below 15,000/quarter annualised = housing crisis narrative dominates; Above 20,000 = Tidö can claim progress
**Associated**: voter-segmentation Cohort 2 (housing voters); Scenario A/B tipping point

### FI-08: Gang Violence Statistics (BRÅ, quarterly)
**Description**: BRÅ (Swedish Crime Prevention Council) quarterly shooting and gang violence statistics. Security legislation (JuU32, HD03267) claims credibility if statistics show improvement.
**Source**: bra.se (statistics)
**Frequency**: Quarterly (Q2 2026 data expected August 2026)
**Trigger threshold**: Gang killings Q2 2026 > 15 = security legislation lacks visible effect → SD campaign advantage; < 8 = Tidö security narrative validated
**Associated**: voter-segmentation Cohort 1 (security voters), R01

### FI-09: Riksbank Interest Rate Decision (June/August 2026)
**Description**: Riksbank monetary policy meetings in June and August 2026. A rate cut (to 2.0%) would provide mortgage relief to homeowners = electoral benefit for incumbent.
**Source**: riksbank.se
**Frequency**: Quarterly policy decisions (June and August meetings)
**Trigger threshold**: Rate cut in August 2026 = 3–4pp boost to housing voter sentiment for incumbent
**Associated**: voter-segmentation Cohort 2, economic context
*economicProvenance: provider=imf, dataflow=WEO, vintage=2026-04; Riksbank independent assessment*

---

## Time Band 4: T+129 to T+180 (September–November 2026)

### FI-10: Election Result and Seat Distribution
**Description**: September 13 election result. The primary indicator for all subsequent year-ahead analysis. Seat distribution determines which scenarios are closed.
**Source**: valmyndigheten.se (election night and final certified count)
**Frequency**: One-time (election day T+129)
**Trigger threshold**: Any party below 4% = scenario recalibration required immediately
**Associated**: ALL PIRs, ALL scenarios, coalition-mathematics

### FI-11: Autumn Budget — Government's First Budget
**Description**: The new (or continuing) government's first budget proposal, expected early November 2026 (T+180). This reveals: state e-ID implementation funding, defence spending confirmation, welfare restoration ambition (S) or fiscal consolidation (Tidö), FiU37 operational budget.
**Source**: riksdagen.se (budget proposition)
**Frequency**: One-time (expected T+175–T+185)
**Trigger threshold**: State e-ID line item ≥ SEK 500 million = full implementation funded; < SEK 200 million = delayed
**Associated**: PIR-YA-2026-003, PIR-YA-2026-004, PIR-YA-2026-005, implementation-feasibility

---

## Time Band 5: T+180 to T+365 (November 2026 – May 2027)

### FI-12: First HD03267 Expulsion Under New Law
**Description**: The first publicly documented expulsion of a foreign national under the new HD03267 security threat provisions. This indicator establishes whether the law is operational and tests the EU/ECHR response.
**Source**: Migrationsverket press releases; ECHR interim measures register
**Frequency**: Ongoing monitoring
**Trigger threshold**: ECHR interim measure granted blocking expulsion = Wildcard W2 activated; Expulsion completed without challenge = law is operational and ECHR-compliant
**Associated**: PIR-YA-2026-002, R05, T-R1, Wildcard W2

---

## Forward Indicator Summary Dashboard

| ID | Band | Indicator | Monitoring | Next Action |
|----|------|-----------|-----------|-------------|
| FI-01 | T+0–30 | Lagrådet yttrande HD03267 | Weekly | Check lagradet.se |
| FI-02 | T+0–30 | Lagrådet yttrande HD03250 | Weekly | Check lagradet.se |
| FI-03 | T+30–90 | Riksdag vote HD03250 | One-time | June 2026 |
| FI-04 | T+30–90 | Skatteverket address fraud Q2 | Quarterly | August 2026 |
| FI-05 | T+30–90 | Riksdag vote HD03267 | One-time | June 2026 |
| FI-06 | T+30–90 | Opinion polls — bloc arithmetic | Weekly | Weekly |
| FI-07 | T+90–129 | SCB construction permits | Monthly | Monthly |
| FI-08 | T+90–129 | BRÅ gang violence statistics | Quarterly | August 2026 |
| FI-09 | T+90–129 | Riksbank rate decision | Quarterly | June/August 2026 |
| FI-10 | T+129–180 | Election result | One-time | September 13, 2026 |
| FI-11 | T+129–180 | Autumn Budget | One-time | November 2026 |
| FI-12 | T+180–365 | First HD03267 expulsion | Ongoing | Monitor continuously |
