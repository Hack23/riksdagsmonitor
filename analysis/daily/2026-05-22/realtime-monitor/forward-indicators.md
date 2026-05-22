# Forward Indicators — Realtime Monitor 2026-05-22

**Analyst**: James Pether Sörling  
**Date**: 2026-05-22  
**Purpose**: PIR-aligned early warning indicators for T+72h through T+90d horizon  

---

## Indicator Tier 1: T+72 Hours (2026-05-22 to 2026-05-25)

### FI-RT-001 — Lagrådet Advisory Announcement
**Definition**: Lagrådet publishes advisory on prop. 2025/26:267 or prop. 2025/26:261  
**Trigger condition**: Advisory appears on www.lagradet.se  
**Intelligence value**: A critical advisory on child-detention or Skatteverket powers would delay legislation and shift media cycle to constitutional law dimension  
**Current status**: Unconfirmed (IG-001 gap)  
**Monitoring source**: www.lagradet.se, Swedish legal news feeds  
**Alert threshold**: Any advisory rated "allvarlig erinran" (serious objection) = HIGH IMPACT  

### FI-RT-002 — Opposition Motion Counter-Filing
**Definition**: S, V, or MP files counter-motions (följdmotioner) in response to prop. 2025/26:267  
**Trigger condition**: Motioner filed with Riksdagen within 2 weeks of proposition submission  
**Intelligence value**: Motion content reveals whether opposition will seek amendments or outright rejection  
**Monitoring source**: Riksdag MCP (doktyp=mot, relaterat_id=prop. 2025/26:267)  
**Alert threshold**: If >10 counter-motions filed = COORDINATED OPPOSITION CAMPAIGN  

### FI-RT-003 — Barnombudsmannen Statement
**Definition**: Sweden's Child Ombudsman issues public comment on child-detention provisions  
**Trigger condition**: Press release or public statement from BO  
**Intelligence value**: BO statements typically generate immediate media coverage and force government response  
**Monitoring source**: barnombudsmannen.se, TT newswire  
**Alert threshold**: Any public statement = MEDIUM-HIGH IMPACT on news cycle  

---

## Indicator Tier 2: T+7 Days (2026-05-22 to 2026-05-29)

### FI-RT-004 — Committee Deliberation Signals
**Definition**: SfU (Social Försäkringsutskottet) and JuU (Justitieutskottet) schedule committee hearings on today's documents  
**Trigger condition**: Hearing scheduled on Riksdag calendar within 14 days  
**Intelligence value**: Hearing format and invited experts reveal committee's analytical focus  
**Monitoring source**: Riksdag MCP (get_calendar_events, from=2026-05-22)  
**Alert threshold**: If experts from EU fundamental rights bodies invited = INTERNATIONAL DIMENSION SIGNAL  

### FI-RT-005 — Opinion Poll on Immigration Tightening
**Definition**: Major polling institute (Demoskop, SIFO, Novus) publishes poll on family reunification or security expulsion policies  
**Trigger condition**: Poll published with direct question on these specific policies  
**Intelligence value**: Will reveal whether the legislation generates net positive or negative response for Tidö parties  
**Monitoring source**: SVT political news; Aftonbladet, DN  
**Alert threshold**: If >55% of respondents oppose family reunification tightening = ELECTORAL RISK for government  

---

## Indicator Tier 3: T+30 Days (through 2026-06-22)

### FI-RT-006 — Committee Vote Timing
**Definition**: Committee (SfU, JuU, FiU) votes announced for prop. 2025/26:267 and HD01SfU37  
**Trigger condition**: Vote scheduled for week of June 15-19 (final Riksdag session)  
**Intelligence value**: Rushed timeline = government confidence in majority; extended deliberation = minority coalition risk  
**Alert threshold**: If vote postponed past June 20 = HIGH RISK OF LEGISLATION NOT PASSING BEFORE SUMMER RECESS  

### FI-RT-007 — L (Liberalerna) Public Position Statement
**Definition**: L party group (Erik Bengtzboe or Anna Starbrink) issues formal position statement on HD024192 / prop. 2025/26:267 child-detention provisions  
**Trigger condition**: Press conference, press release, or Riksdag debate statement  
**Intelligence value**: L's support (16 seats) is mathematically required. If L expresses "serious concern", government must negotiate amendments.  
**Alert threshold**: L calls for amendment in child-detention provisions = NEGOTIATION SIGNAL  
**Note**: L historically has a record of extracting concessions on civil liberties provisions within Tidö coalition  

### FI-RT-008 — C (Centerpartiet) Abstention Signal
**Definition**: C party group announces abstention rather than opposition vote on family reunification  
**Trigger condition**: C press statement or TV4/SVT interview  
**Intelligence value**: C abstention provides effective government majority without formal support; would enable passage  
**Alert threshold**: C abstention announcement = LEGISLATION WILL PASS  

---

## Indicator Tier 4: T+90 Days (through 2026-08-22)

### FI-RT-009 — Election Polling Shift Post-Legislation
**Definition**: Aggregate of 3+ polls shows statistically significant shift (>2%) in party support following legislation passage  
**Trigger condition**: Published polling in July-August 2026  
**Intelligence value**: Will reveal whether the pre-election legislative sprint had the intended electoral effect  
**Alert threshold**: If M+SD+KD polls UP vs pre-legislation baseline = GOVERNMENT STRATEGY VALIDATED  

### FI-RT-010 — EU/CoE Formal Response
**Definition**: EU Commission or Council of Europe Commissioner issues formal statement on Sweden's family reunification or security-expulsion measures  
**Trigger condition**: Press release from DG Home or CoE PACE (Parliamentary Assembly)  
**Intelligence value**: Formal EU/CoE response escalates to European level; rare but possible given CoE reports (HD01UU12) in today's cluster  
**Alert threshold**: Any formal EU statement = SWEDISH GOVERNMENT MUST RESPOND within 30 days  

---

## Forward Indicator Summary Dashboard

| ID | Horizon | Indicator | Priority | Status |
|----|---------|-----------|:--------:|:------:|
| FI-RT-001 | T+72h | Lagrådet advisory | 🔴 HIGH | Unconfirmed |
| FI-RT-002 | T+72h | Opposition counter-motions | 🟡 MED | Pending |
| FI-RT-003 | T+72h | Barnombudsmannen statement | 🟡 MED | Pending |
| FI-RT-004 | T+7d | Committee hearings | 🟡 MED | Pending |
| FI-RT-005 | T+7d | Public opinion polls | 🟡 MED | Pending |
| FI-RT-006 | T+30d | Committee vote timing | 🔴 HIGH | Pending |
| FI-RT-007 | T+30d | L position statement | 🔴 HIGH | Pending |
| FI-RT-008 | T+30d | C abstention signal | 🔴 HIGH | Pending |
| FI-RT-009 | T+90d | Election polling shift | 🟡 MED | Pending |
| FI-RT-010 | T+90d | EU/CoE formal response | 🟡 MED | Pending |

**Next scheduled review**: FI-RT-001 and FI-RT-002 should be rechecked at next realtime-monitor run (2026-05-23 morning cycle).

---

## Pass 2 Additions

### FI-RT-011 — HD01FiU47 Content Publication (New — Pass 2)
**Definition**: Finance Committee betänkande 2025/26:FiU47 content published on Riksdag website  
**Trigger condition**: Title and summary become available at data.riksdagen.se/dokument/HD01FiU47  
**Intelligence value**: Subject unknown; scheduled for chamber debate/vote 16–17 June 2026 — potential significance for fiscal or regulatory agenda  
**Monitoring source**: Riksdag MCP `get_dokument_innehall(dok_id="HD01FiU47")`  
**Alert threshold**: If subject relates to immigration, security, or major fiscal changes = escalate to L2+ priority
