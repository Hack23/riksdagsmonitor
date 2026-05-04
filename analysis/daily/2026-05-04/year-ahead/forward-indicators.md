# Forward Indicators — Sweden Year Ahead 2026-05-04

**Gate requirement**: ≥12 dated indicators across month/quarter/year/cycle/election bands
**Indicator count**: 15 (exceeds minimum)

---

## Indicator Register

| # | Indicator | Band | Target Date | Threshold | Source | Horizon |
|---|---|---|---|---|---|---|
| FI-01 | Liberalerna polling average | election | 2026-09-07 | 4.0% threshold pass/fail | Sifo/Kantar 3-poll avg | [horizon:election] |
| FI-02 | SD polling percentage | election | 2026-09-07 | >21% = Tidö advantage; <18% = S advantage | Demoskop aggregator | [horizon:election] |
| FI-03 | Lagrådet ruling on HC03155 | quarter | 2026-07-01 | "Lagstiftning bör ändras" = medium risk; "inga anmärkningar" = low risk | Lagrådet.se | [horizon:quarter] |
| FI-04 | Sweden Q1-2026 GDP flash estimate | month | 2026-05-29 | ≥0.4% QoQ growth → economic recovery on track | SCB nationalräkenskaperna | [horizon:month] |
| FI-05 | Riksbank policy rate decision | quarter | 2026-06-25 | Rate ≤2.0% = continued stimulus; >2.5% = tightening risk | Riksbank penningpolitik | [horizon:quarter] |
| FI-06 | NATO Summit Sweden commitment | year | 2026-06-15 | Reaffirmation of 2.4% GDP target = HC03193 continuity signal | NATO Brussels Summit | [horizon:year] |
| FI-07 | HFD HC03203 uranium injunction | quarter | 2026-08-01 | Injunction granted = mining stalled; dismissed = government wins | HFD (Highest Administrative Court) | [horizon:quarter] |
| FI-08 | Swedish election campaign opening — crime statistics | election | 2026-08-01 | Gang-related shootings YTD < 50 = government campaign narrative viable | Polismyndigheten statistik | [horizon:election] |
| FI-09 | Centerpartiet congress resolution on government participation | election | 2026-08-15 | Resolution "neither bloc" = Scenario D risk; "support S" = Scenario B | C party congress | [horizon:election] |
| FI-10 | Industriavtalet collective bargaining outcome | quarter | 2026-04-30 (est.) | Real wage growth >2% = Segment 1 stabilises; <1% = SD voter attrition | Medlingsinstitutet | [horizon:quarter] |
| FI-11 | Sweden inflation (KPIF) May 2026 | month | 2026-06-12 | <2.5% = on target; >3% = Riksbank tightening risk | SCB KPI/KPIF | [horizon:month] |
| FI-12 | Säpo/MUST pre-election threat level | election | 2026-09-01 | Elevated threat level = HC03155 invocation risk; stable = normal election | Säpo annual report / pressmeddelande | [horizon:election] |
| FI-13 | EU Commission EMFA compliance assessment Sweden | year | 2026-10-01 | "Non-compliant" = enforcement risk; "compliant" = HC03197 success | EU Commission rule of law report | [horizon:year] |
| FI-14 | Riksdag dissolution / second election call | cycle | 2026-12-31 | Triggered = Scenario D confirmed; not triggered = government formed | Riksdag talman | [horizon:cycle] |
| FI-15 | Sweden public debt ratio (% GDP) | year | 2026-11-01 | <38% GDP = fiscal headroom maintained (IMF WEO Apr-2026 baseline: 37.8%) | SCB + IMF WEO Apr-2026 | [horizon:year] |

---

## Indicator Priority Rankings

**Critical path indicators** (election-determining):
1. FI-01 (Liberalerna threshold) — single most decisive variable
2. FI-09 (C party congress) — second most decisive
3. FI-08 (crime statistics) — SD narrative viability

**Leading indicators for economic scenario**:
4. FI-04 (Q1 GDP flash) — earliest economic signal
5. FI-05 (Riksbank rate) — monetary policy trajectory
6. FI-11 (KPIF inflation) — pricing pressure

**Security/constitutional tripwires**:
7. FI-03 (Lagrådet HC03155) — constitutional legitimacy
8. FI-07 (HFD uranium) — energy policy blocking risk
9. FI-12 (Säpo threat level) — election integrity risk

## Indicator Dashboard Template

```
STATUS AS OF 2026-05-04:
FI-01 Liberalerna: 3.8% (⚠️ BELOW THRESHOLD — monitor weekly)
FI-02 SD: 19.5% (→ NEUTRAL — within expected range)
FI-03 Lagrådet HC03155: PENDING (⚠️ awaited Q2-2026)
FI-04 Q1 GDP: PENDING (29 May SCB release)
FI-05 Riksbank: 2.25% (→ EXPECTED next decision June 25)
FI-06 NATO Summit: PENDING (June 2026)
FI-07 HFD uranium: PENDING (challenge not yet filed)
FI-10 Industriavtalet: PENDING (Q2-2026 completion)
```

## Collection Plan

| Indicator | Collection frequency | Agent | Method |
|---|---|---|---|
| FI-01, FI-02 | Weekly | news-journalist | riksdag-regering MCP + polling aggregator |
| FI-03 | Monthly | intelligence-operative | lagrådet.se parsing |
| FI-04, FI-11, FI-15 | Monthly (SCB release) | data-pipeline-specialist | SCB MCP |
| FI-05 | Per Riksbank meeting | data-pipeline-specialist | Riksbank API |
| FI-07 | Ad hoc (court filing) | intelligence-operative | HFD förvaltningsrätt |
| FI-09 | Ad hoc (congress) | news-journalist | C party press releases |
| FI-12 | Quarterly (Säpo) | intelligence-operative | Säpo.se |
