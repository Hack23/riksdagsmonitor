# Forward Indicators — Realtime Pulse 2026-05-11

**Author:** James Pether Sörling | **Date:** 2026-05-11 | **Workflow:** news-realtime-monitor
**PIR Integration:** Carry-forward + new triggers from today

---

## Priority Intelligence Requirements (PIRs) — Updated

### PIR-CONST-ABORT — NEW ACTIVE (from KU34)
**Requirement**: Track KU34 constitutional abortion protection through to first reading vote
**Status**: ACTIVE (KU34 filed, committee report published 2026-05-11)
**Tripwires**:
- T1: SD official statement on KU34 aborträtt track (expected: week 20, before 15 May)
- T2: KU34 first reading scheduled in Riksdag calendar (observable: riksdagen.se calendar)
- T3: S cross-bloc support announcement for KU34 aborträtt (observable: party press releases)
- T4: Any coalition dissent (M, KD, or L) on association restriction provisions

### PIR-CLIM-2026 — CONFIRMED OPEN/NO ACTION
**Requirement**: Monitor climate proposition timeline before election
**Status**: OPEN/NO ACTION — three independent confirmations 2026-05-11
**Tripwires**:
- T5: Government climate communication or statement (observable: riksdagen.se + media)
- T6: S/MP formal "missing proposition" campaign event (observable: party events calendar)
- T7: Riksbank/SNDO climate risk report citing policy gap (observable: riksbank.se)

### PIR-MIG-RETURN — ACTIVE/TRACKING
**Requirement**: Track prop. 263 (stärkt återvändande) implementation
**Status**: ACTIVE — V counter-motion HD024150 filed
**Tripwires**:
- T8: SfU committee vote on HD024150 (observable: riksdagen.se committee calendar)
- T9: Migrationsverket regulatory draft for prop. 263 (observable: Migrationsverket.se remiss)
- T10: S formal position on prop. 263 EKMR compatibility (observable: S riksdagsgrupp)

### PIR-COAL-STAB — MONITORING
**Requirement**: Monitor coalition stability until September election
**Status**: MONITORING — coalition majority confirmed (HD01CU25 vote, 2026-05-06)
**Tripwires**:
- T11: Any defection of SD, KD, or L from coalition on budget or confidence matters
- T12: Riksdag by-elections result shifting seat arithmetic

---

## Observable Indicators Calendar

| Date | Expected Observable | PIR |
|------|--------------------|----|
| 11–15 May 2026 | SD official KU34 position | PIR-CONST-ABORT T1 |
| 15–31 May 2026 | SfU committee begins V motion hearings | PIR-MIG-RETURN T8 |
| Late May 2026 | KU34 scheduled for first reading | PIR-CONST-ABORT T2 |
| June 2026 | Riksdag summer schedule released | All PIRs |
| 15 June 2026 | Riksdag goes into summer recess | PIR-CLIM-2026 T5 |
| August 2026 | Election campaign officially begins | PIR-COAL-STAB |
| September 2026 | General Election | All PIRs — final assessment |

---

## Data Collection Requirements

| Source | Cadence | For PIR |
|--------|---------|--------|
| riksdag-regering MCP — KU debates | Daily | PIR-CONST-ABORT |
| Partiernas pressmeddelanden (riksdagen.se) | Daily | PIR-CONST-ABORT T1 |
| IMF live data (restore when available) | Weekly | Economic context |
| SCB — Arbetsmarknadsstatistik Q2 2026 | June 2026 | Economic context |
| Migrationsverket.se — remiss | Weekly | PIR-MIG-RETURN |
| riksdagen.se calendar | Daily | All PIRs |
