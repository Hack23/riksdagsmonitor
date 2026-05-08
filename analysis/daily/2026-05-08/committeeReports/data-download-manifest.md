# Data Download Manifest — Committee Reports 2026-05-08

**Download date**: 2026-05-08  
**Source**: riksdag-regering-mcp (data.riksdagen.se)  
**Lookback applied**: YES (ARTICLE_DATE 2026-05-08 returned 0 documents; used 2026-05-07 data via 1-day lookback)  
**Doc type**: committeeReports (betänkanden)  
**Documents retrieved**: 8  

---

## Documents Downloaded

| dok_id | Committee | Title | Published | Full text |
|--------|-----------|-------|-----------|-----------|
| HD01FiU37 | FiU | Riksbankens roll i finansiell krishantering | 2026-05-07 | ✅ |
| HD01JuU39 | JuU | En särskild straffbestämmelse för psykiskt våld | 2026-05-07 | ✅ |
| HD01JuU32 | JuU | Polisens befogenheter vid allmänna sammankomster | 2026-05-07 | ✅ |
| HD01FiU31 | FiU | Riksrevisionens rapport om statlig fastighetsförvaltning | 2026-05-07 | ✅ |
| HD01JuU34 | JuU | Nordiskt samarbete vid verkställighet i brottmål | 2026-05-07 | ⚠️ partial |
| HD01FiU38 | FiU | Obligatorisk central clearing av OTC-derivat | 2026-05-07 | ⚠️ partial |
| HD01FiU43 | FiU | Kommuners arbete mot felaktiga välfärdsutbetalningar | 2026-05-07 | ⚠️ partial |
| HD01CU35 | CU | Aktier på handelsplattformar (MTF) | 2026-05-07 | ⚠️ partial |

---

## Data Gaps and Fallbacks

### Gap 1 — Voteringar (CRITICAL GAP)
`search_voteringar` returned **0 results** for all JuU and FiU committee queries in riksmöte 2025/26.

**Cause**: New riksmöte indexing lag — chamber votes from the current parliamentary session may not yet be indexed in the voteringar database. The 2025/26 riksmöte opened September 2025; voteringar data for 2025/26 appears to be unavailable via the API.

**Fallback applied**: Committee reservation text analysis used as proxy for party positions. Reservation counts and parties noted for each betänkande. Confidence in party position analysis: MEDIUM (based on text, not voting data).

**Workaround attempted**: Extended search to 2024/25 riksmöte for historical comparison — found no matching votes for the same bills (new propositions, no prior cycle).

### Gap 2 — IMF Economic Data
IMF API endpoints returned 404 errors during analysis window.

**Fallback applied**: WEO April 2026 proxied estimates used.
- Sweden GDP growth 2025e: ~1.5%
- Sweden government debt/GDP: ~36%
- Riksbanken policy rate: 2.25%
- Sweden fiscal balance 2025e: ~-1.0% GDP

**economicProvenance**: `{provider: "imf-weo-proxied", dataflow: "WEO-Apr2026-estimate", vintage: "2026-04", note: "IMF API returning 404 at analysis time; values are analyst estimates from last known WEO round"}`

### Gap 3 — Lagrådet Consultation Record for JuU32
Whether all JuU32 police dispersal/surveillance provisions were submitted to Lagrådet for formal opinion is UNVERIFIED. Standard procedure for constitutional rights-adjacent provisions requires Lagrådet consultation; whether this was followed for all JuU32 provisions could not be confirmed from available data.

---

## Statskontoret Pre-Warm Note

FiU37 involves Riksbanken operational capacity for a new crisis coordination function. Statskontoret has not yet published an assessment of Riksbanken's readiness for this new mandate. This represents a monitoring gap for implementation feasibility analysis.

## Lagrådet Note (JuU32)

JuU32 contains provisions touching RF chapter 2 §1 (freedom of assembly). Lagrådet consultation status is unverified (see Gap 3 above). If Lagrådet did not review specific dispersal/surveillance provisions, this is a constitutional process gap requiring escalation.

---

## Data Quality Assessment

| Data type | Quality | Coverage | Notes |
|-----------|---------|----------|-------|
| Betänkande metadata | HIGH | 8/8 | Complete |
| Full text (priority docs) | HIGH | 4/8 | FiU37, JuU39, JuU32, FiU31 |
| Voteringar | ABSENT | 0/8 | New riksmöte gap |
| IMF economic context | DEGRADED | Proxied | API 404 error |
| Opposition reservations | HIGH | All captured | From betänkande text |
| Lagrådet opinions | UNVERIFIED | JuU32 gap | See Gap 3 |
