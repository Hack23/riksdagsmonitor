# Intelligence Gaps — 2026-05-18 realtime-pulse

**Article date**: 2026-05-18  
**Purpose**: Document known unknowns and data acquisition needs  
**Classification**: Internal analysis note  

---

## Priority Intelligence Requirements (PIR)

### PIR-1: Government composition and PM transition timing [HIGH PRIORITY]

**Gap**: Ebba Busch confirmed as PM from proposition signatures (HD03267, HD03263 etc., May 2026) but transition from Ulf Kristersson not formally documented in Riksdag open data. The cause and timing of the PM change is unknown.

**Required to confirm**:
- Official government press release on new government formation (Regeringen website)
- Riksdag committee report on government composition
- Date of vote of confidence / investiture

**Impact of gap**: If timeline is wrong, political-landscape analysis and scenario analysis need revision.

**Collection method**: Fetch from regeringen.se government composition page; check for Riksdag investiture vote records

**Priority**: Collect in next run

---

### PIR-2: IMF WEO Sweden 2026 GDP projections [MEDIUM PRIORITY]

**Gap**: Direct IMF WEO API call not executed; economic-context.md based on parliamentary document summaries only (vintage 2025-04).

**Required**:
- IMF WEO April 2026 vintage: Sweden GDP growth forecast 2026 and 2027
- IMF fiscal balance (GGXWDG_NGDP) Sweden
- Nordic comparison: SWE vs DNK, NOR, FIN growth rates

**Collection method**: `npx tsx scripts/imf-fetch.ts weo --country SWE --indicator NGDP_RPCH --years 5 --persist`

**Impact**: Economic-context analysis currently uses 2025-04 vintage data; may be outdated by 12 months.

---

### PIR-3: Migrationsverket operational capacity assessment [MEDIUM PRIORITY]

**Gap**: No official capacity assessment from Migrationsverket on readiness to implement HD03262-HD03265 available from Riksdag sources.

**Required**:
- Migrationsverket årsredovisning (annual report) 2025
- IT system WILMA documentation/upgrade plans
- Budget request for additional resources

**Impact**: Risk-2 assessment (IT/capacity collapse) would benefit from stronger evidence base.

---

### PIR-4: SfU committee hearings and reservation (motioner) filing [LOW PRIORITY]

**Gap**: HD03262-HD03265 are in committee referral; committee deliberations not yet public.

**Required**:
- SfU committee hearing transcripts (when published)
- Party reservations and motioner against the bills
- SfU rapporteur assignments

**Collection method**: Monitor data.riksdagen.se/utskott/SfU in next run

---

### PIR-5: KD internal party position on abortion rights [LOW PRIORITY]

**Gap**: KD's support for constitutional abortion right (HD01KU34) represents a significant ideological shift. Internal party debate dynamics not captured in official Riksdag documents.

**Required**:
- KD party congress proceedings
- KD parliamentary group meeting minutes (if public)
- KD press statements by party chair

---

## Data Quality Notes

| Document | Data quality | Completeness | Notes |
|----------|-------------|--------------|-------|
| HD03267 full text | Good (retrieved) | Partial | Full text 103KB retrieved |
| HD03262 summary | Good | Summary only | Full text not retrieved |
| HD01KU34 | Good | Summary | Bet summary sufficient for analysis |
| Voteringar AU10 | Good | Partial | Only 2024/25 vote retrieved; 2025/26 not yet |
| Economic data | Indirect | Low | Via parliamentary document references only |
| Government composition | Inferred | Gap | Not formally confirmed |

---

## Roll-Forward to Next Run

The following PIRs should be addressed in the next realtime-pulse run (tomorrow, 2026-05-19 or when KU34 vote occurs):

1. Confirm KU34 chamber vote result and margin
2. Fetch IMF WEO Sweden data
3. Confirm PM Busch government composition from Regeringen source
4. Check SfU hearing schedule for migration package
5. Monitor ECtHR for any petitions related to Swedish security expulsions

