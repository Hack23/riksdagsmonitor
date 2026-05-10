# Intelligence Assessment — Week Ahead 10–16 May 2026

**Classification**: PUBLIC  
**Admiralty Code**: B2 (Reliable source, Probably true)  
**Author**: James Pether Sörling  

## Prior-Cycle PIR Ingestion

*Per Tier-C rules: prior cycle PIRs ingested from analysis/daily/2026-05-08/week-ahead/pir-status.json*

### Carried-Forward PIRs

| PIR ID | Statement | Prior Status | This Week's Evidence | Updated Status |
|--------|-----------|-------------|---------------------|----------------|
| PIR-MIGR-001 | HD03262 scheduling before September 2026 | open | No new documents on this PIR | OPEN — carry forward |
| PIR-MIGR-002 | Migration proposition batch Q2 2026 | open | No new documents this week | OPEN — carry forward |
| PIR-MIGR-003 | Lagrådet negative opinion risk | open | No new Lagrådet yttranden this week | OPEN — carry forward |
| PIR-JUSTSEC-001 | Public gathering safety vote | answered | Confirmed week 20 vote — CLOSED | ANSWERED |
| PIR-JUSTSEC-002 | Security legislation Q2 2026 | answered | Confirmed — CLOSED | ANSWERED |
| PIR-EDUC-001 | UbU28 teacher credential vote | answered | HD01UbU28 confirmed for this week | ANSWERED |
| PIR-INTL-001 | Israel diplomatic response | open | HD11803 flotilla now confirmed — PARTIALLY ANSWERED | PARTIALLY ANSWERED |
| PIR-FIN-001 | FiU37 cross-party vote | open | No new FiU data this week | OPEN — carry forward |
| PIR-DIGITAL-001 | HD03250 e-legitimation submitted | answered | CLOSED | ANSWERED |
| PIR-DEFENCE-001 | FöU18 margin assessment | open | No vote data yet | OPEN — carry forward |
| PIR-ECON-001 | IMF IFS SDMX restoration | open | Still degraded as of 2026-05-10 | OPEN — carry forward |

## Key Judgments (This Cycle)

**KJ-1 [HIGH — B2]**: The governing coalition will pass CU31 (privatuthyrningslag) with M–KD–L–SD votes this week. This represents the single largest housing reform in Sweden in two decades. Opposition (S, V) will vote against.

**KJ-2 [MEDIUM — C2]**: SD's pressure on L over the veil ban (HD11802) is tactical electoral positioning and will not produce a formal coalition agreement amendment before the September 2026 election. Probability of coalition rupture on this issue: < 5%.

**KJ-3 [MEDIUM — C3]**: Foreign Minister Stenergard will issue a measured, legalistic written answer to HD11803 (Israel flotilla) that acknowledges the incident without naming specific diplomatic consequences. The answer will be judged insufficient by S, V, and MP but will not trigger an emergency debate unless a new incident occurs.

**KJ-4 [LOW-MEDIUM — D3]**: PIR-INTL-001 is now partially answered: Swedish citizens were aboard the Global Sumud Flotilla boarded by Israeli forces. Whether Sweden takes stronger diplomatic action (ambassador summons, aid conditionality) remains unknown. This is the highest-uncertainty judgment this cycle.

**KJ-5 [HIGH — B1]**: UbU28 (10-year elementary school teacher credentials) will pass on schedule. This judgment upgrades PIR-EDUC-001 from "answered" in prior cycle to confirmed passage.

## New PIRs This Cycle

| PIR ID | Statement | Priority | Horizon |
|--------|-----------|----------|---------|
| PIR-HOUS-001 | Will CU31's privatuthyrningslag produce measurable rental supply increase by Q4 2026? | HIGH | year |
| PIR-HOUS-002 | Will S's "landlord party" campaign framing on CU31 shift Sifo polling before September? | MEDIUM | month |
| PIR-INTL-002 | How will Sweden vote on UN Gaza resolutions in May–June 2026 after the flotilla incident? | MEDIUM | month |
| PIR-COAL-001 | Will SD table a formal veil ban motion in the Riksdag before the election? | MEDIUM | quarter |
| PIR-EDUC-002 | Will SKR (municipalities) formally contest the UbU28 implementation timeline for 2028/29? | LOW | quarter |

## Intelligence Gaps

1. **Voting data not yet available**: CU31–UbU28 chamber votes expected this week — no voteringsdata available as of 2026-05-10. To be populated next cycle.
2. **IMF SDMX degraded**: IFS real-time data unavailable. Using WEO Apr-2026 vintage. SDMX restoration timeline unknown.
3. **Flotilla outcome**: The immediate status of Swedish citizens aboard the Global Sumud Flotilla at the time of writing is not confirmed from parliamentary documents.

## Collection Plan

| Target | Method | Priority |
|--------|--------|----------|
| CU31 vote outcome | riksdag-regering MCP: search_voteringar(bet="CU31") | HIGH — by Thursday |
| Stenergard's HD11803 answer | riksdag-regering MCP: get_dokument(dok_id="HD11803") after publication | HIGH — by Wednesday |
| IMF SDMX status | Data/imf-context.json weekly check | MEDIUM — ongoing |
| SD veil ban follow-up | riksdag-regering MCP: search_dokument(parti="SD", doktyp="mot") | MEDIUM — ongoing |
