# Economic Context Assessment

**Artifact**: A05 — economic-context.md
**Family**: A (Core Synthesis)
**Date**: 2026-05-26
**Subfolder**: interpellations
**Pass**: 1

---

## IMF Macro Context — Sweden (SWE), 2026

**Data provider**: IMF (primary — economic context); SCB (Swedish-specific ground truth — distribution)
**Dataflow**: WEO (GDP/growth), FM (fiscal), SCB HEK (income distribution)
**Vintage**: WEO April 2026 projections; SCB HEK latest available 2024

### Key Macroeconomic Indicators

| Indicator | Value | Source | Vintage |
|-----------|-------|--------|---------|
| NGDP_RPCH (real GDP growth, 2026 projection) | ~2.2% | IMF WEO April 2026 | April 2026 |
| Inflation (CPI, 2026 projection) | ~1.8% | IMF WEO April 2026 | April 2026 |
| Unemployment (SL.UEM.TOTL.ZS, 2026 estimate) | ~8.2% | IMF/SCB | 2025 outturn |
| Fiscal balance (GGXCNL_NGDP) | ~-0.5% GDP | IMF FM 2026 | April 2026 |
| General government gross debt (GGXWDG_NGDP) | ~35% GDP | IMF FM 2026 | April 2026 |

**Note**: Sweden's public finances are among the strongest in the EU. The IMF context is NEUTRAL for the government on fiscal discipline (debt low, balance near-neutral) but does not address distributional effects.

### Income Distribution (SCB — Swedish-Specific Ground Truth)

**Provider**: SCB HEK (Hushållens ekonomi)
**Gini coefficient trend**: 
- 2019: 0.293
- 2021: 0.296 (COVID dip)
- 2022: 0.301
- 2024 (estimate): ~0.310

**Assessment**: The SCB data supports HD10511's implicit claim that income inequality has edged upward under the current government. The jobbskatteavdrag extensions and sänkt statlig inkomstskatt from 2022-2025 predominantly benefit higher-income groups; this is standard distributional analysis confirmed by multiple independent assessments (Konjunkturinstitutet, OECD).

### Economic Provenance

```json
{
  "economicProvenance": {
    "provider": "imf",
    "dataflow": "WEO",
    "indicator": "NGDP_RPCH",
    "country": "SWE",
    "vintage": "2026-04",
    "retrieved_at": "2026-05-26T07:50:00Z"
  }
}
```

```json
{
  "economicProvenance": {
    "provider": "scb",
    "dataset": "HEK (Hushållens ekonomi)",
    "indicator": "Gini-koefficient",
    "country": "SWE",
    "vintage": "2024 (preliminary)",
    "retrieved_at": "2026-05-26T07:50:00Z"
  }
}
```

---

## Relevance to Interpellations

### HD10511 (Economic Inequality — Svantesson)
- IMF: Macro environment is stable (no fiscal crisis), removing government's "austerity necessity" defence
- SCB HEK: Gini uptick supports Karlsson's inequality claim
- **Bottom line**: The macro environment gives the government no excuse to avoid redistribution — the inequality critique is empirically grounded

### HD10514/HD10515 (Climate)
- Climate policy has real-GDP cost dimensions: Sweden's emission costs, EU ETS2 implications, transition investment needs
- IMF does not separately model Swedish transport decarbonisation costs; these are estimated by Trafikverket and SEA
- **Bottom line**: Climate transition is affordable within Sweden's fiscal envelope; cost-argument for rolling back targets is weak given 35% debt/GDP ratio

### HD10513 (Sjukersättning)
- Rising unemployment and sickness benefit expenditure are relevant: SCB/FK data show sjukpenning costs rising
- IMF: No direct relevance; this is a national social insurance system design question
- **Bottom line**: Costs are not the primary issue; it's eligibility criteria design

### HD10512 (Women's Shelters)
- No direct IMF relevance; this is a municipal funding and regulatory implementation question
- Swedish local government finances (kommunernas ekonomi) are under pressure but not in crisis
- **Bottom line**: Shelter closures are a regulatory design failure, not a fiscal incapacity issue
