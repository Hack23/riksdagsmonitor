# Election 2026 Analysis — Evening Analysis, 4 May 2026

**Author**: James Pether Sörling | **Date**: 2026-05-04  
**Days to election**: 132 (September 13, 2026)

---

## Current Electoral Landscape

### Polling Snapshot (Latest composite, through 2026-05-01)

| Party | Current % | Seats (est.) | vs. 2022 | Threshold risk |
|-------|----------|-------------|---------|---------------|
| **S** | 32.1% | 113 | +1 | None |
| **SD** | 18.2% | 63 | -4 | None |
| **M** | 19.8% | 69 | -3 | None |
| **MP** | 4.1% | 0–14 | -8 | LOW (4.1% is above 4% but fragile) |
| **V** | 7.8% | 27 | +2 | None |
| **KD** | 4.9% | 17 | +2 | None |
| **C** | 5.2% | 18 | -5 | None |
| **L** | 4.4% | 15 | -5 | HIGH (4.0% hard floor risk) |

*Source: Composite from election-cycle sibling analysis (Novus/IPSOS/Demoskop average)*

### Bloc Arithmetic

| Bloc | % | Seats | Majority test |
|------|---|-------|--------------|
| **Tidö (M+KD+SD+L)** | 47.3% | 164 | 5 seats below 175 |
| **S-bloc (S+V+MP)** | 44.0% | 154–168 | Depends on MP threshold |
| **C (unaligned)** | 5.2% | 18 | Kingmaker if both blocs below 175 |

**Critical observation**: Neither bloc has a guaranteed majority. C (18 seats) is the swing actor if both blocs fall short of 175. C's historical preference is for a non-SD government — if deployed, C more likely supports S than Tidö.

---

## Seat Projection by Scenario

### Scenario 1: Stable Delivery (45% probability)

| Party | Seats |
|-------|-------|
| S | 113 |
| SD | 64 |
| M | 70 |
| MP | 14 (just above threshold) |
| V | 27 |
| KD | 17 |
| C | 19 |
| L | 15 |
| **Total** | **349** |

Tidö: 166 | S-bloc: 154 | C: 19  
→ No bloc at 175. C needed. Given C's preference, potential minority government options:  
- Tidö + C: 185 seats (sufficient, but C demands no SD in formal power)  
- S + V + MP + C: 173 (insufficient alone; would need further support)

→ Most likely: M-led government with C support, SD relegated to confidence-and-supply from outside formal coalition. **Tidö in power but weakened**.

### Scenario 2: Criminal Age Crisis (25% probability)

| Party | Seats (estimated shift) |
|-------|------------------------|
| SD | 67 (+3, benefiting from "L betrayed coalition" narrative) |
| L | 13 (-2, punishment for being perceived as responsible for crisis) |
| S | 115 (+2) |
| Others | As scenario 1 |

Tidö: 164 | S-bloc: 157 | C: 19  
→ No majority; S + V + MP + C = 176 (marginal majority). Andersson government with C support possible.

### Scenario 3: Regional Accountability Cascade (20% probability)

3 seats shift from M/KD to S in Östergötland and adjacent constituencies:  
Tidö: 161 | S-bloc: 162 | C: 19  
→ S-bloc + C = 181 (sufficient). Andersson PM.

---

## Key Threshold Analysis

### L at 4% Floor

If L polls at 3.9% on election day, L exits parliament (17 seats disappear). This leaves:
- Tidö (M+KD+SD): 149 seats — far below 175
- Even with C (19 seats): 168 — insufficient
- S-bloc (155) + C (19) = 174 — just short of majority
- S + V + MP + C + L-successor-votes = complex hung parliament

**Verdict**: L exit is catastrophic for all parties and would produce Sweden's most complex government formation since 1978–79.

### MP at 4% Floor

If MP polls below 4%:
- S-bloc loses 14 seats: 140–154 seats
- S + V + C: 113 + 27 + 19 = 159 — insufficient
- S forced to work with a broader support base

**Verdict**: MP exit makes a S-bloc majority impossible; probably requires S to form minority government with C support (and implicit SD tolerance).

---

## Electoral Map — Competitive Constituencies

| Constituency | 2022 margin | Key issue 2026 | At-risk party |
|-------------|------------|----------------|--------------|
| Östergötland | M+0.8% over S | Ostlänken (HD10463) | KD/M |
| Jönköping | M+1.2% | Infrastructure, nuclear | M |
| Halland | M+2.1% | Energy security | Low risk |
| Stockholm suburb ring | S+0.5% | Crime, housing | M/SD |
| Malmö suburbs | SD+1.4% | Migration, crime | SD (if passage deflates voters) |

---

## IMF Economic Context

Swedish economic fundamentals remain supportive for the incumbent:  
- GDP growth 2.1% (IMF WEO Apr-2026) — above eurozone average (~1.7%)
- Debt/GDP ~34% — EU minimum, well below Maastricht 60%
- Unemployment 8.2% — slightly elevated but stable

Economic conditions do not independently favor a government change; the election will turn on social/security issues (crime, migration, infrastructure).

```json
{
  "economicProvenance": {
    "provider": "imf",
    "dataflow": "WEO",
    "indicator": "NGDP_RPCH",
    "country": "SWE",
    "value": 2.1,
    "vintage": "2026-04",
    "retrieved_at": "2026-05-04"
  }
}
```
