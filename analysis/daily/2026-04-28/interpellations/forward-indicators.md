# Forward Indicators — Interpellations 2026-04-28

**Date**: 2026-04-28  
**Author**: James Pether Sörling

## Monitoring Dashboard — 12 Dated Indicators

| # | Indicator | Expected Date | Source | Threshold | Status |
|---|-----------|---------------|--------|-----------|--------|
| 1 | Minister Andreas Carlson files written response to HD10449 | ≤ 2026-05-18 | riksdagen.se dok-register | Response filed or constitutionally overdue | PENDING |
| 2 | Minister Anna Tenje files written response to HD10450 | ≤ 2026-05-22 | riksdagen.se dok-register | Response filed or constitutionally overdue | PENDING |
| 3 | Minister Gunnar Strömmer files written response to HD10451 | ≤ 2026-05-18 | riksdagen.se dok-register | Response filed or constitutionally overdue | PENDING |
| 4 | Trafikverket reviderar nationell plan — consultation notice | 2026-Q3 | Trafikverket.se press | Plan opened for supplemental consultation | WATCH |
| 5 | Government issues regleringsbrev supplement re: Alvesta-Växjö | 2026-Q2 or 2027 budget | Regeringen.se press | "Alvesta" or "Alvesta-Växjö" in regleringsbrev text | WATCH |
| 6 | Riksdag debate (interpellationsdebatt) HD10449 | 2026-05-19 – 2026-06-10 | riksdagen.se calendar | Debate listed in kammarens agenda | PENDING |
| 7 | Riksdag debate (interpellationsdebatt) HD10450 | 2026-05-23 – 2026-06-10 | riksdagen.se calendar | Debate listed in kammarens agenda | PENDING |
| 8 | Riksdag debate (interpellationsdebatt) HD10451 | 2026-05-19 – 2026-06-10 | riksdagen.se calendar | Debate listed in kammarens agenda | PENDING |
| 9 | Government table SOU or Ds on corporate crime follow-up | 2026-Q2–Q4 | Regeringen.se remiss | New Ds or Kommittédirektiv on bolagar-som-brottsverktyg | WATCH |
| 10 | ESO/Brå follow-up study on criminal economy methodology | 2026-H2 | ESO / Brå press | New publication refining the 352 BSEK estimate | WATCH |
| 11 | Budget autumn 2026 — rail infrastructure supplementary allocation | 2026-09-20 (likely) | Government autumn budget proposal | Additional BSEK allocation to Sydsverige rail | WATCH |
| 12 | S tables new motion on day-180 exception at autumn opening | 2026-09-16 (riksmöte opening) | riksdagen.se motioner | Motion filed citing Riksrevisionen findings | WATCH |

## Early Warning Signals

1. **GREEN — HDI delay signal**: If any ministerial response is filed late (>2026-05-22 for HD10450, >2026-05-18 for HD10449/HD10451), it signals government political difficulty with the topic
2. **RED — Corporate crime silence**: If no new legislative action on bolag-som-brottsverktyg within 12 months of January 2025 law, it validates HD10451's core claim
3. **AMBER — Rail budget exclusion**: If the autumn 2026 budget does not include Alvesta-Växjö funding, Carlson's position becomes electorally untenable in Sydsverige

## Collection Strategy

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'primaryColor': '#00d9ff', 'primaryTextColor': '#e0e0e0', 'primaryBorderColor': '#ff006e', 'lineColor': '#ffbe0b', 'background': '#0a0e27'}}}%%
gantt
    title Forward Indicator Timeline
    dateFormat YYYY-MM-DD
    section Ministerial Responses
    Carlson HD10449 response :active, i1, 2026-04-28, 2026-05-18
    Strömmer HD10451 response :active, i2, 2026-04-28, 2026-05-18
    Tenje HD10450 response :active, i3, 2026-04-28, 2026-05-22
    section Debates
    HD10449 debate window :d1, 2026-05-19, 22d
    HD10450 debate window :d2, 2026-05-23, 18d
    HD10451 debate window :d3, 2026-05-19, 22d
    section Budget / Legislative
    Autumn budget 2026 :b1, 2026-09-15, 2026-09-25
    Riksmöte opens :m1, 2026-09-16, 1d
    S new motioner :m2, 2026-09-16, 30d
```

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'primaryColor': '#00d9ff', 'primaryTextColor': '#e0e0e0', 'primaryBorderColor': '#ff006e', 'lineColor': '#ffbe0b', 'background': '#0a0e27'}}}%%
xychart-beta
    title "Indicator Priority by Impact (1-5)"
    x-axis ["Resp HD10449", "Resp HD10450", "Resp HD10451", "Rail debate", "Ins debate", "Corp debate", "Rail budget", "Corp SOU", "ESO study", "Autumn budget", "S motion", "Regleringsbrev"]
    y-axis "Impact" 0 --> 5
    bar [5, 5, 5, 4, 4, 4, 5, 3, 3, 5, 4, 3]
```
