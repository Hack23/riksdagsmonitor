# Forward Indicators — 2026-05-07

**Purpose**: Specific observable events to monitor over next 7-128 days that will update analytical assessments  
**PIR alignment**: Each indicator maps to open PIRs or key scenario variables

---

## TIER 1 — Critical (Monitor within T+7 days)

### FI-01: Lagrådet Yttrande on HD03262/HD03265
**What to look for**: Riksdag publication of Lagrådets yttrande on the migration propositions  
**Where**: data.riksdagen.se — document search for "Lagrådets yttrande" + "HD03262" / "HD03265"  
**Why critical**: PIR-RT-001 (CRITICAL) — determines whether migration legislation faces substantive constitutional challenge  
**Expected window**: T+7 to T+30 days  
**If accepting**: Scenario A (consolidation) reinforced — PIR-RT-001 CLOSES  
**If critical**: Scenario B (complication) — government must amend or override  
**Monitoring tool**: riksdag-regering-mcp `search_dokument` with "lagrådet" + "HD03262"

---

### FI-02: HD03267 JuU Committee Assignment and First Hearing Date
**What to look for**: JuU committee scheduling hearing on Prop 2025/26:267  
**Where**: Riksdag committee calendar (get_calendar_events, org=JuU)  
**Why critical**: Timing for chamber vote — must be before summer recess for electoral banking  
**Expected window**: T+7 to T+21 days  
**If scheduled before May 28**: Summer passage confirmed (Scenario A)  
**If delayed**: Risk of post-recess treatment

---

## TIER 2 — High (Monitor within T+30 days)

### FI-03: New Novus/Demoskop Polling Release (PIR-RT-003)
**What to look for**: New party polling showing pre/post-migration-legislation voter movement  
**Where**: Novus.se/Demoskop.se public releases + Swedish media  
**Why important**: Post-migration polling trends — tests whether security legislation is delivering electoral gain  
**Key thresholds**:
- MP crossing below 4%: Opposition bloc loses effective majority claim
- SD above 22%: Security narrative working
- M below 17%: Coalition anchor weakening

---

### FI-04: Carlson Response on Ostlänken HD10458 (PIR-RT-005)
**What to look for**: Minister Carlson's formal response to interpellation HD10458 on Ostlänken  
**Deadline**: 2026-05-25 (18 days)  
**Why important**: Infrastructure policy clarity; SD constituency concerns in south Sweden  
**If substantive answer**: PIR-RT-005 CLOSES  
**If deflection**: PIR-RT-005 escalates — motion likely

---

### FI-05: HD03261 and HD03250 Full Text Publication
**What to look for**: Full text of Prop 2025/26:261 and 2025/26:250 (today submitted, full text pending in MCP)  
**Where**: riksdag-regering-mcp `get_dokument_innehall` with `include_full_text: true`  
**Why important**: Current analysis limited to metadata — full text will reveal key provisions  
**Expected**: T+1 to T+3 days (documents in pipeline)

---

## TIER 3 — Medium (Monitor within T+60 days)

### FI-06: Nuclear NU19 Energy Company Responses (PIR-RT-006)
**What to look for**: Swedish nuclear energy companies (Vattenfall, Uniper, OKG) filing applications or public statements on NU19 permitting  
**Deadline**: 2026-06-17 (law effective)  
**Where**: Klimat- och näringslivsdepartementet official channels; company announcements  
**Expected action**: Companies must respond to new permitting framework before or upon law entry

---

### FI-07: KU39 Constitutional Transparency Vote (PIR-3)
**What to look for**: Final KU39 committee report and chamber vote scheduling  
**Expected date**: 2026-06-16 (40 days)  
**Where**: Riksdag chamber calendar; KU committee documentation  
**Why critical**: Constitutional reform — if voted through, changes transparency obligations for future governments; if fails, S uses it as governance failure narrative

---

### FI-08: Datainspektionen (DI) Response to HD03261
**What to look for**: Swedish Data Protection Authority initiating review or issuing guidance on Skatteverket's new cross-matching powers  
**Why important**: Dutch SyRI precedent — DI review could impose conditions that delay implementation  
**Expected window**: T+30 to T+90 days after proposition publication

---

### FI-09: Civil Society Legal Challenge Preparation on HD03267
**What to look for**: Amnesty/Civil Rights Defenders issuing formal legal opinion or beginning ECtHR candidacy research  
**Where**: Amnesty.se/Civicrights.org press releases; Swedish media  
**Why important**: Gauges the seriousness of the international legal challenge  
**Expected**: T+14 to T+45 days

---

## TIER 4 — Watchlist (T+60-128 days, election window)

### FI-10: IMF IFS SDMX Restoration
**What to look for**: IMF IFS API at `sdmxcentral.imf.org` returning valid data for Sweden (SE) series  
**Why important**: PIR-RT-004 — enables monthly Swedish macro claims (CPI, employment, FX)  
**Monitoring**: `tsx scripts/imf-fetch.ts sdmx` test probe

### FI-11: First HD03267 Application Publicity
**What to look for**: News reports of first SÄPO application of the new detention powers (post-2027-03-01)  
**Why important**: Will test the human rights framing — a sympathetic case triggers Scenario C  
**Expected**: T+365+ days (well after election) unless existing cases are affected

### FI-12: BankID Response to State E-ID (HD03250)
**What to look for**: Bankgirocentralen/BankID AB issuing position paper or lobbying disclosure on state e-ID  
**Why important**: Commercial incumbent response determines implementation timeline  
**Expected**: T+30-60 days after proposition publication

---

## Indicator Summary Dashboard

| ID | Topic | Horizon | PIR | Priority |
|----|-------|---------|-----|---------|
| FI-01 | Lagrådet on migration props | T+7-30d | PIR-RT-001 | 🔴 CRITICAL |
| FI-02 | JuU hearing on HD03267 | T+7-21d | — | 🔴 CRITICAL |
| FI-03 | New polling | T+0-30d | PIR-RT-003 | 🟠 HIGH |
| FI-04 | Carlson/Ostlänken response | T+18d | PIR-RT-005 | 🟠 HIGH |
| FI-05 | Full text HD03261/HD03250 | T+1-3d | — | 🟠 HIGH |
| FI-06 | Nuclear NU19 responses | T+41d | PIR-RT-006 | 🟡 MEDIUM |
| FI-07 | KU39 vote | T+40d | PIR-3 | 🟠 HIGH |
| FI-08 | Datainspektionen/HD03261 | T+30-90d | — | 🟡 MEDIUM |
| FI-09 | Civil society challenge | T+14-45d | — | 🟡 MEDIUM |
| FI-10 | IMF IFS restoration | T+0-60d | PIR-RT-004 | 🟡 MEDIUM |
