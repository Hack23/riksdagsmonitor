# Forward Indicators — Realtime Monitor 2026-05-26

**Analyst:** James Pether Sörling | **Date:** 2026-05-26
**Requirement:** ≥10 forward indicators with PIR linkage, horizon, and data source

---

## Forward Indicator Register

| FI-ID | Indicator | Threshold / Trigger | PIR | Horizon | Source | Current State |
|-------|-----------|-------------------|-----|---------|--------|--------------|
| FI-01 | Full text of HD03271 published and analysed | Text available on data.riksdagen.se; confirms/denies gestational limit change | PIR-E2 | T+3d | Riksdag API | NOT YET FETCHED — key gap |
| FI-02 | L party formal position on HD03271 | Explicit statement by Johan Pehrson or L parliamentary group | PIR-E3 | T+7d | L press releases, riksdagen.se | Unknown as of 2026-05-26 |
| FI-03 | Riksdagen vote date announced for HD03271 | Speaker/agenda confirms vote week | PIR-E4 | T+14d | Riksdag calendar (riksdagen.se) | Not yet scheduled |
| FI-04 | Opinion poll (Sifo/Ipsos/Novus) after HD03271 news | M below 19% or S above 33% = electoral shift | PIR-E1 | T+7–14d | Novus, Sifo, Ipsos poll trackers | Next standard poll expected 2026-06-02 |
| FI-05 | Lagrådet referral of HD03271 confirmed | Government announces referral to Lagrådet (obligatory per RF 8:22 for rights-affecting legislation) | R02, R04 | T+7–14d | Government publication (SFS/prop) | Not yet announced |
| FI-06 | Lagrådet yttrande on HD03271 | Adverse finding = R04 triggered; supportive = S1/S2 path | R02 | T+30–45d | Lagrådet.se (not in current firewall) | Pending |
| FI-07 | V/MP/S joint communication on reproductive rights | Press conference or parliamentary debate initiated on HD03271 | T1 (SWOT) | T+1–3d | Party press releases, riksdagen.se debates | Anticipated within 24–48h |
| FI-08 | FöU17 (Ukraine support) Riksdagen vote result | >280 votes Yes = bipartisan majority confirmed; <250 = erosion | R04, O1 | T+14–21d | Riksdagen voteringar (API) | Vote scheduled in near-term |
| FI-09 | KD polling vs. 4% threshold | KD below 3.8% in any major poll = threshold risk activated | R09 | T+14–30d | Novus, Sifo, Ipsos | Current: 3.8–4.5% (estimated) |
| FI-10 | S formal election strategy document published | S annual party conference strategy or Midsommar statement signals election priorities | T1, S scenario | T+30d | S party website, media reporting | Expected June–July 2026 |
| FI-11 | Arbetsmarknadsutskott (AU) report on employment | New data on the ~500,000 unemployed (HC10746 context); confirms/refutes government economic narrative | W3 (SWOT) | T+30d | SCB, Riksdag AU | Next Labour Force Survey mid-June 2026 |
| FI-12 | Russian foreign ministry response to FöU17 | Russian statement = elevated hybrid threat indicator | R04 | T+3–7d | Russian MFA press releases (open source) | Pending |

---

## High-Priority Indicators (Action Required)

### FI-01 — HD03271 Full Text (URGENT — T+3d)
**Why critical:** The entire electoral and legal risk model for HD03271 depends on the full text. The proposition's key provisions (gestational limit, counselling requirements, medical exceptions) are UNKNOWN as of this analysis. This is the single most important intelligence gap.

**Collection action:** Fetch `https://data.riksdagen.se/dokument/HD03271/text` in next workflow run. This URL is in the firewall allowlist (riksdagen.se domain).

### FI-03 — Vote Date (T+14d)
**Why critical:** The vote date determines whether HD03271 becomes the dominant pre-election story (vote before summer recess = 10 weeks of campaign) or is deferred to autumn (after election).

### FI-05 — Lagrådet Referral (T+14d)
**Why critical:** If the government does NOT refer HD03271 to Lagrådet, it signals confidence in the text. If it DOES refer, it signals potential constitutional concerns and opens an escape route (see Scenario S4).

---

## Indicator Tracking Protocol

**Update frequency:** Each subsequent realtime-monitor run for 2026-05-26+7d should update FI-01 through FI-12 status
**PIR closure:** An indicator is "closed" when the observable evidence unambiguously resolves the underlying PIR
**Carry-forward:** Open indicators FI-01, FI-02, FI-03, FI-05 are automatically carried into the next analysis cycle (T+7d)

---

## Cross-Reference to Sibling Forward Indicators

**committee-reports/forward-indicators.md:** Established FI indicators for FöU17/UFöU3/JuU48/UU24 committee stage — this list carries those forward and adds HD03271-specific indicators (FI-01 through FI-06)
**propositions/forward-indicators.md:** Contains proposition-level indicators — this list extends with day-of session observables
