# Forward Indicators — Week Ahead 10–16 May 2026

**Author**: James Pether Sörling  
**Collection timeline**: T+72h through T+30d  

## Leading Indicators to Monitor

### Housing Policy (CU31)

| Indicator | Source | Threshold | Horizon | Signal direction |
|-----------|--------|-----------|---------|-----------------|
| CU31 Riksdag vote outcome | riksdag MCP: search_voteringar(bet="CU31") | Any abstentions by SD | T+72h | Coalition stress |
| Hyresgästföreningen statement | hyresgastforeningen.se press release | "We will legally challenge CU31" | T+7d | Escalation |
| Fastighetsägarna registration of new private rentals | Fastighetsägarna quarterly | >5,000 new registrations | T+90d | Supply growth |
| Stockholm median rent index | SCB Hyresindex Q2 2026 | >3% increase vs Q1 | T+90d | Price pressure on S/V narrative |

### Coalition Cohesion (HD11802)

| Indicator | Source | Threshold | Horizon | Signal direction |
|-----------|--------|-----------|---------|-----------------|
| L minister Mohamsson's answer text | riksdag MCP: get_dokument(HD11802) | Explicit rejection of ban | T+48h | SD escalation risk |
| SD follow-up motion on veil ban | riksdag MCP: search_dokument(parti="SD", titel="slöja") | Filed before June 2026 | T+30d | Coalition pressure escalation |
| L Sifo polling | Sifo/Novus May 2026 | L falls below 4% | T+30d | Existential electoral risk |

### Diplomatic (HD11803)

| Indicator | Source | Threshold | Horizon | Signal direction |
|-----------|--------|-----------|---------|-----------------|
| Foreign Minister answer to HD11803 | riksdag MCP: get_dokument(HD11803) | Language: "condemn" / "summoning" | T+48h | Escalation |
| Israeli government statement on flotilla | UD (Swedish MFA) press | Formal Israeli apology or confrontation | T+7d | Bilateral tension |
| EU coordination call on flotilla | European Council agenda | Joint EU statement on flotilla incidents | T+14d | Multilateral escalation |

### Economic (IMF Context)

| Indicator | Source | Threshold | Horizon | Signal direction |
|-----------|--------|-----------|---------|-----------------|
| IMF SDMX restoration | data/imf-context.json weekly check | Status changes from "degraded" | T+30d | Analysis quality improvement |
| Riksbank inflation data | riksbank.se May 2026 | CPI above 3% triggers | T+14d | M economic management pressure |
| Sweden Q1 GDP publication | SCB nationalräkenskaper | Below 1.5% growth | T+30d | Fiscal narrative shift |

## Priority Intelligence Requirements (New)

| PIR | Collection trigger | Priority |
|----|-------------------|----------|
| PIR-HOUS-001: CU31 supply impact | Fastighetsägarna Q3 2026 report | MEDIUM |
| PIR-INTL-002: Swedish UN Gaza vote | UN GA/SC vote scheduling | MEDIUM |
| PIR-COAL-001: SD veil ban motion | riksdag document alert | MEDIUM |
| PIR-ECON-001: IMF SDMX restoration | Weekly context check | LOW |

## Dashboard: Forward Indicator Heatmap

```
Legend: 🟢 Low risk/positive | 🟡 Monitor | 🔴 High risk/negative

Domain           T+72h    T+7d     T+30d
Housing (CU31)   🟢      🟡       🟡
Coalition (L/SD) 🟡      🟡       🔴
Diplomacy (IL)   🟡      🔴       🟡
Economy (IMF)    🟡      🟡       🟢
Education (UbU)  🟢      🟢       🟡
```
