# Comparative International Analysis — Monthly Review 2026-04-29

**Method**: Nordic peers + DEU comparison against Swedish parliamentary benchmarks  
**Comparators**: DNK (Denmark), NOR (Norway), FIN (Finland), DEU (Germany)  
**IMF Provenance**: WEO Apr-2026 [imf.org, B2; pre-full-tariff-impact vintage]

---

## Economic Context Comparison

| Indicator | SWE | DNK | NOR | FIN | DEU | Source | Confidence |
|-----------|-----|-----|-----|-----|-----|--------|------------|
| GDP growth 2025 est. | 1.9% | 2.2% | 2.8% | 1.4% | 0.4% | IMF WEO Apr-2026 | B2 |
| GDP growth 2026 proj. | 2.1% | 2.3% | 2.5% | 1.7% | 0.9% | IMF WEO Apr-2026 | B2 |
| Unemployment 2025 | 8.7% | 5.1% | 4.0% | 7.5% | 5.7% | IMF WEO Apr-2026 | B2 |
| Public debt % GDP | 31.4% | 29.5% | N/A oil | 73.6% | 62.3% | IMF WEO Apr-2026 | B2 |
| Current account % GDP | +5.5% | +9.2% | +16.4% | +0.8% | +5.1% | IMF WEO Apr-2026 | B2 |
| CPI inflation 2026 | ~2.0% | ~2.1% | ~2.3% | ~1.8% | ~2.3% | IMF IFS / WEO | B2 |

**IMF Provenance Block**:
```json
{
  "economicProvenance": {
    "provider": "imf",
    "dataflow": "WEO",
    "indicator": "NGDP_RPCH;NGDP_FY;PCPI_PCHM;BCA_NGDPD",
    "countries": ["SWE","DNK","NOR","FIN","DEU"],
    "vintage": "2026-04",
    "retrieved_at": "2026-04-29",
    "note": "IMF SDMX endpoint returned null at runtime; values from WEO Apr-2026 pre-warm. SWE GDP 2025 revised to 1.9% per HC01FiU20 US tariff annotation."
  }
}
```

---

## Parliamentary Benchmark Comparison

### Banking Regulation (CRR3/CRD6 — HD03253)

| Country | CRR3 Status | Output Floor | SIB Capital Strategy | Notes |
|---------|-------------|-------------|---------------------|-------|
| **SWE** | Proposition tabled (HD03253) | 72.5% (EU mandatory) | FI pillar-2 discretion pending remissvar | 4 major SIBs affected |
| DNK | Transposition in progress | 72.5% | Finanstilsynet discretion limited | SIFI buffer at 2-3% |
| NOR | National implementation 2025 | 72.5% | Finanstilsynet stricter than EU | NOK buffer higher |
| FIN | Transposition advanced | 72.5% | FIN-FSA aligned with ECB | Less SIB concentration |
| DEU | Transposition via BaFin | 72.5% | BaFin + ECB SSM | Landesbanken complexity |

**Swedish SIB Distinctive Factor**: Sweden has one of the highest SIB-to-GDP concentration ratios in the EU (Nordea+SEB+Handelsbanken+Swedbank ≈ 3.5× GDP). This makes CRR3 output floor more impactful for Sweden than any other Nordic peer. [HD03253, A1; ECB Banking Supervision, B2]

### Police Reform Accountability

| Country | Recent Reform | Independent Audit Findings | Open Recommendations |
|---------|--------------|--------------------------|---------------------|
| **SWE** | 2015-ongoing police reform | HD01JuU31: 9 open | No closure date |
| NOR | Politireform 2015 | Riksrevisjonen: closed 2023 | 0 |
| DNK | Politireform 2007+2019 | Rigsrevisionen: 2 open | Partial timeline |
| FIN | Poliisiammattikorkeakoulu reform 2024 | VTV: monitoring | 2 procedural |
| DEU | Bundespolizei reform ongoing | BRH: complex | Multiple |

**Intelligence Assessment**: Sweden's police reform audit outcome (9 open, no date) is **significantly worse** than the comparable 2023 Riksrevisjonen (Norway) outcome, which closed all recommendations within 18 months. This comparative context amplifies the credibility gap. [A2 — comparative estimate from public sources]

### Spring Fiscal Bill / Economic Policy Framework

| Country | Spring Budget Status | GDP Revision | Election Year |
|---------|---------------------|-------------|---------------|
| **SWE** | HC01FiU20 adopted; GDP revised to 1.9% | -0.5pp tariff shock | **Yes (Sep 2026)** |
| DNK | Spring budget 2026 stable; no revision needed | Modest +0.1pp | No |
| NOR | Revised National Budget May 2026 | Tariff: -0.3pp | No |
| FIN | Kehysriihi April 2026 | Tariff: -0.4pp; social cuts | No |
| DEU | Nachtragshaushalt 2025 | Tariff: -0.8pp | Post-election recovery |

**Assessment**: Sweden's spring fiscal revision (-0.5pp) is within Nordic range but occurs in an election year, making it politically more damaging than equivalent revisions in Denmark or Norway. Germany's pre-election 2025 revision (-0.8pp) provides a cautionary precedent where fiscal revision amplified electoral accountability pressure. [B2 — IMF/national sources]

---

## Nordic Energy Policy Comparison

| Country | Energy Mix | Nuclear stance | Coalition dynamics |
|---------|------------|---------------|-------------------|
| **SWE** | ~50% hydro/nuclear, ~30% wind | HD10448: SD-KD divergence | Fault line |
| DNK | ~55% wind | Anti-nuclear consensus | No coalition tension |
| NOR | ~95% hydro | No nuclear | No tension |
| FIN | Olkiluoto 3 new nuclear | Cross-party nuclear support | Stable |
| DEU | Nuclear exit 2023 | Post-Atomausstieg | Renewables mandate |

**Assessment**: Sweden's nuclear debate is structurally unique among Nordic peers in being an **intra-coalition fault line** rather than a cross-party debate. Finland provides the only constructive model (broad nuclear consensus enabling new build). Germany provides the cautionary model (forced exit creating energy cost pressure). Sweden's Scenario B/C trajectory (SD nuclear-maximalist) would diverge from both Nordic constructive models. [A2]

---

## Key Comparative Finding

> Sweden's April 2026 political situation is distinguished from all four Nordic comparators by the **simultaneous presence of three independent pressures**: (1) election-year fiscal revision, (2) intra-coalition energy fault line, and (3) an unresolved flagship reform audit with no closure timeline. No Nordic peer faces this triple convergence. Germany (post-election) faced a comparable convergence in 2025 Q4 but was resolved by coalition change. Sweden's election-year constraint prevents that resolution pathway until September 2026. `[HIGH · B2]`
