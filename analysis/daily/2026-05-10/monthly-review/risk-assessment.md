# Risk Assessment — Monthly Review 2026-05-10

**Author**: James Pether Sörling | **Date**: 2026-05-10  
**Method**: 5-dimension political risk register; L × I scoring; posterior probabilities  
**Framework**: political-risk-methodology.md

---

## Risk Register

| Risk ID | Description | Likelihood (1-5) | Impact (1-5) | L×I | Dimension | Cascades |
|---------|-------------|-----------------|-------------|-----|-----------|---------|
| R-COAL-01 | L falls below 4% threshold → Tidö loses majority | 3 | 5 | **15** | Coalition | R-COAL-02, R-ECON-01 |
| R-COAL-02 | SD congress nuclear-maximalist platform → KD coalition friction before election | 3 | 4 | **12** | Coalition | R-COAL-01 |
| R-HOU-01 | Rental reform (HD01CU31) generates tenant backlash: housing affordability crisis framing | 3 | 4 | **12** | Socioeconomic | R-POL-01 |
| R-FP-01 | Flotilla incident (HD11803) escalates: formal diplomatic crisis Sweden-Israel | 2 | 4 | **8** | International | R-POL-02 |
| R-POL-01 | S wins election on housing/affordability mandate: rental reform reversal risk | 2 | 5 | **10** | Political | R-HOU-01 |
| R-POL-02 | Gaza policy paralysis: Sweden unable to maintain EU solidarity + bilateral protest simultaneously | 2 | 3 | **6** | Political/International | — |
| R-SEC-01 | Police reform credibility: no closure timeline on 9 Riksrevisionen recommendations | 3 | 3 | **9** | Institutional | R-POL-01 |
| R-RURAL-01 | Trafikverket lighting removal (HD11801): KD rural voter defection | 2 | 3 | **6** | Political | R-COAL-01 |
| R-TAX-01 | Stadigvarande vistelse (HD10480) delay: tax uncertainty for cross-border workers | 2 | 2 | **4** | Economic | — |
| R-ECON-01 | IMF "degraded" status: SDMX IFS probe failed; if WEO/FM also degrade, economic claims lose primary source | 1 | 3 | **3** | Data/Methodological | — |

## Cascading Risk Chain Analysis

**Primary cascade: Coalition minority scenario**

```
R-COAL-01 (L threshold failure) 
  → Tidö loses working majority
    → R-COAL-02 (SD pressure escalates without L buffer)
      → Early election scenario or minority government
        → R-HOU-01 amplified (rental reform becomes election issue, not settled law)
          → R-POL-01 (reversal mandate for incoming S-led government)
```

Posterior probability assignment:
- P(R-COAL-01) = 0.18 [B2 — L at 4.2% ± 0.8pp; 1.4pp above threshold is within polling uncertainty]
- P(R-HOU-01 | R-COAL-01 = True) = 0.65 [B2 — rental reform is central campaign narrative]
- P(R-POL-01 | R-HOU-01 + R-COAL-01) = 0.45 [B2 — S has declared reversal intent]

**Foreign policy cascade:**

```
R-FP-01 (Flotilla escalation)
  → Malmer Stenergard issues formal protest
    → Swedish-Israeli bilateral tension
      → R-POL-02 (EU Gaza policy alignment conflict)
        → Sweden isolated in Nordics if Norway/Denmark diverge
```

P(R-FP-01) = 0.20 [A2 — incident confirmed; diplomatic response uncertain]

## 5-Dimension Risk Profile

| Dimension | Top Risk | Score | Status |
|-----------|----------|-------|--------|
| Political | R-COAL-01 (L threshold) | 15 | 🔴 HIGH |
| Socioeconomic | R-HOU-01 (rental backlash) | 12 | 🟠 MEDIUM-HIGH |
| Institutional | R-SEC-01 (police reform) | 9 | 🟡 MEDIUM |
| International | R-FP-01 (flotilla) | 8 | 🟡 MEDIUM |
| Environmental/Infrastructure | R-RURAL-01 (lighting) | 6 | 🟢 LOW-MEDIUM |

