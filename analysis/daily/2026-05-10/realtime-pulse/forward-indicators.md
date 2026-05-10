# Forward Indicators — Realtime Pulse 2026-05-10

## Priority Intelligence Requirements (PIR) Forward Indicators

### PIR-1 Forward: Coalition Stability

| Indicator | Observable Event | Threshold | Monitoring |
|---|---|---|---|
| L position on criminal age | L committee spokesperson press statement or JuU hearing position | "L conditionally supports" = stable; "L opposes" = fracture | Next 4 weeks |
| KD/SD energy temperature | New interpellation or parliamentary question on grid/wind from SD | 2+ new interpellationer in 30 days = elevated tension | Monthly |
| Coalition crisis language | Coalition parties using words like "bryta" or "lämna" in media | Any single use in party leadership interview = HIGH alert | Weekly |

### PIR-3 Forward: Opposition Legislative Capacity

| Indicator | Observable Event | Threshold | Monitoring |
|---|---|---|---|
| S-led coalition coordination | S files motions referencing C or MP positions | Joint press conference by S+C = unusual, HIGH coordination signal | Weekly |
| MP threshold poll | Novus/SIFO monthly party preference for MP | <4.5% = existential risk; <4.0% = HIGH concern | Monthly |
| JuU hearing outcome on prop 2025/26:246 | JuU committee report published | Majority reservation = coalition defeat | 6–10 weeks |

### PIR-5 Forward: Election-Proximity Policy Acceleration

| Indicator | Observable Event | Threshold | Monitoring |
|---|---|---|---|
| Proposition tabling rate | Number of propositions tabled per week in May–June 2026 | >3/week = sprint confirmed; >5/week = exceptional sprint | Weekly |
| Lagrådet referral timeline | Lagrådet yttrande publication for HD03267 | Critical yttrande = immediate HIGH alert | 2–8 weeks |
| Budget tabling | Any pre-election supplementary budget proposals | Rare; if occurs = major signal of pre-election spending | Weekly |

---

## Key Milestone Calendar

| Date (estimated) | Event | Significance |
|---|---|---|
| 2026-05-17 to 2026-05-31 | JuU hearing schedule for HD03267 and prop 2025/26:246 | First real test of L's position |
| 2026-06-01 to 2026-06-15 | Lagrådet yttrande on HD03267 expected | CRITICAL — determines security prop fate |
| 2026-06-15 | Approximate riksmöte summer recess begins | Deadline for government to complete spring delivery |
| 2026-06-30 | Latest for JuU betänkande on HD03267 (if no Lagrådet delay) | |
| 2026-07-01 to 2026-08-15 | Summer recess — party leader debates | Almedalen political week (early July) — parties present their election accounts |
| 2026-08-15 | Swedish election campaign officially begins | |
| 2026-09-13 | **Election Day** | |

---

## Early Warning Signals

### DEFCON-equivalent: Legislative Crisis

**Green**: All three major props proceed without Lagrådet critique; L holds; coalition enters election campaign with strong delivery narrative.

**Yellow**: Lagrådet issues minor observations on HD03267 requiring technical amendments; L abstains on criminal age (forcing modifications); one prop delayed to autumn.

**Orange**: Lagrådet issues critical yttrande on ECHR; L votes with opposition on criminal age; media narrative shifts to "coalition crisis."

**Red**: Two or more props withdrawn or defeated; coalition partners publicly distance from government; pre-election poll shift >3 percentage points against coalition.

---

## Economic Leading Indicators to Monitor

*IMF data sources for follow-up (currently degraded — retry in 48 hours)*:

| Indicator | Dataflow | Target | Note |
|---|---|---|---|
| Sweden real GDP growth | WEO / NGDP_RPCH | 2026: ~2.1% | Economic space for new myndigheter |
| Fiscal balance | WEO / GGXCNL_NGDP | 2026: ~+0.2% GDP | Budget headroom for HD03250 costs |
| Government gross debt | WEO / GGXWDG_NGDP | ~34% GDP | Low — confirming implementation capacity |
| Unemployment | WEO / LUR | 2026: ~8.2% | Context for Skatteverket fraud incentive |

*Provenance: provider=imf, dataflow=WEO, vintage=Apr-2026, retrieved_at=2026-05-10, status=degraded (IFS 404 — WEO Datamapper only)*

---

## T+7d Priority Collection Plan

1. **Lagrådet.se**: Check for yttrande publication on prop 2025/26:267 (HD03267 security foreigners)
2. **Riksdag MCP**: Run `search_dokument` for JuU committee hearing schedule (kalenderdata) for HD03267 and prop 2025/26:246
3. **IMF API retry**: Attempt SDMX endpoint again (may recover from 404 within 48–72h); focus on IFS/M/SE.PCPI_IX for Swedish CPI data to contextualize fiscal space
4. **L party statement monitoring**: Any press release or speech by Johan Pehrson (L leader) on criminal age proposition
5. **SIFO/Novus polling**: Latest party preference data for M, SD, L, MP — track shifts from current baseline
6. **Statskontoret**: If domain accessible — check for ongoing evaluation of Skatteverket's folkbokföring capacity or any evaluation mandate from Finansdepartementet
