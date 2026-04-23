# Forward Indicators — Committee Reports 2026-04-23

**Methodology**: `analysis/methodologies/electoral-domain-methodology.md` §Forward Indicators
**Analyst**: James Pether Sörling | **Date**: 2026-04-23

## 72-Hour Horizon

| Indicator | Date | Observable sign | Significance |
|-----------|------|-----------------|--------------|
| I-01: FiU48 Riksdag vote | 2026-04-24 | Vote count, party positions | Confirms coalition unity |
| I-02: KU33 Riksdag vote | 2026-04-24 | Vilande adoption formal | Constitutional process confirmed |
| I-03: KU32 Riksdag vote | 2026-04-24 | Vilande adoption formal | Constitutional process confirmed |
| I-04: Party press releases | 2026-04-23 | S, V, MP framing of FiU48 | Measures opposition effectiveness |

## One-Week Horizon

| Indicator | Date | Observable sign | Significance |
|-----------|------|-----------------|--------------|
| I-05: Media polling reaction | 2026-04-28 | Novus/Demoskop poll shift | Energy policy salience |
| I-06: Industry response CU28 | 2026-04-28 | HSB/Riksbyggen statement | Registry implementation resistance signal |
| I-07: IVO comment on CU22 | 2026-04-28 | IVO press release | Supervisory reform signal |
| I-08: Riksdag committee follow-up | 2026-04-30 | CU/KU post-decision notes | Any reconsideration signals |

## One-Month Horizon

| Indicator | Date | Observable sign | Significance |
|-----------|------|-----------------|--------------|
| I-09: Government proposition on CU22 | 2026-05-20 | Government bill for new authority | Implementation commitment |
| I-10: Lantmäteriet CU28 consultation | 2026-05-15 | Lantmäteriet public consultation | Registry timeline |
| I-11: Opposition manifesto energy | 2026-05-01 | S/V/MP climate manifesto | Counter-narrative strength |
| I-12: Riksbank inflation report | 2026-05-15 | Rate decision + forecast | Coalition economic context |
| I-13: SCB housing price data | 2026-05-06 | Swedish housing market indicators | CU27/CU28 implementation environment |

## Election-Cycle Horizon

| Indicator | Date | Observable sign | Significance |
|-----------|------|-----------------|--------------|
| I-14: Party manifestos published | 2026-07-01 | Constitutional commitment language | KU33/KU32 second vote commitment |
| I-15: Election result Sept 2026 | 2026-09-13 | Seat distribution | Constitutional amendment fate |
| I-16: Post-election KU33/KU32 second vote | 2026-11-01 | New Riksdag decision | Constitutional outcome |
| I-17: CU28 registry launched | 2027-06-01 | Lantmäteriet public registry live | Implementation completion |
| I-18: CU22 new authority established | 2027-01-01 | Authority operational | Guardianship reform completion |
| I-19: FiU48 renewable energy investment outcome | 2026-12-31 | Government progress report | Policy effectiveness |

## Confidence Note

Indicator dates are derived from legislative timelines stated in KU33/KU32 documentation [A1], government procedural norms [B2], and standard Swedish legislative cycles [B3]. Election date 2026-09-13 is the statutory election Sunday [A1].

---

## 🔄 Tradecraft Context (Pass 2)

**Key milestones matrix**:

| Horizon | Most critical indicator | Monitoring method |
|---------|------------------------|-------------------|
| 72h | I-01: FiU48 vote 2026-04-24 | riksdagen.se voteringer API |
| 1 week | I-05: Polling reaction 2026-04-28 | Novus/Demoskop public releases |
| 1 month | I-12: Riksbank 2026-05-15 | riksbank.se |
| Election | I-15: Election result 2026-09-13 | valmyndigheten.se |

**Collection gap**: No automated trigger monitoring available in current system — all indicators require manual collection. Recommend Agentic Workflow realtime-monitor to watch riksdagen.se for I-01, I-02, I-03 votes.
