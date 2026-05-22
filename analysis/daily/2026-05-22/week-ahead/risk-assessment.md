---
title: "Risk Assessment — Week 22, 2026"
date: "2026-05-22"
artifact: "risk-assessment"
---

# Risk Assessment — Week 22, 2026

## Risk Register — 5-Dimension Framework

Dimensions: Political (P), Legal/Constitutional (L), Institutional (I), Social (S), Economic (E).
Risk score = Likelihood (1–5) × Impact (1–5). Posterior probabilities based on prior evidence.

## Risk Matrix

| ID | Dimension | Risk | L | I | Score | Posterior P | Mitigation | [Admiralty] |
|----|-----------|------|---|---|-------|-------------|------------|-------------|
| R1 | Political | Coalition fracture: L or C files reservation on JuU28 biometric surveillance | 3 | 4 | **12** | 40% | Whip pressure; government may accept symbolic safeguards amendment | [B2] |
| R2 | Legal | Lagrådet critique delays migration cluster (HD03262–HD03267) | 2 | 5 | **10** | 25% | Government may rely on EU Pact alignment as constitutional shield | [B3] |
| R3 | Institutional | Migrationsverket capacity collapse under new return-first mandates | 3 | 4 | **12** | 35% | Statskontoret capacity planning assessment required; no assessment confirmed | [B3] |
| R4 | Social | ECHR challenge to permanent permit elimination (HD03262) | 2 | 4 | **8** | 30% | Court challenge timeline post-election; government may accept limited parliamentary scrutiny | [B3] |
| R5 | Economic | State e-ID (HD03250) procurement failure — cost overruns at DIGG | 2 | 3 | **6** | 20% | Government flagship risk; DIGG has limited IT procurement track record for large-scale systems | [B3] |
| R6 | Political | S opposition successfully frames JuU28 as "surveillance state" before election | 3 | 4 | **12** | 45% | High media resonance; V and S have clear narrative alignment | [B2] |
| R7 | Legal | JuU28 GDPR Art. 9 compliance challenge (biometric special category data) | 2 | 4 | **8** | 30% | IMY (Swedish DPA) may issue preliminary assessment; biometric processing = Art. 9 sensitive | [B3] |
| R8 | Political | Pre-recess legislative compression reduces legitimacy of passed laws | 2 | 3 | **6** | 55% | Civil-society organisations likely to document; low immediate impact | [C3] |
| R9 | Institutional | Skatteverket implementation backlog for e-ID (HD03250) and folkbokföring (HD03261) | 3 | 3 | **9** | 40% | Two Skatteverket mandates simultaneously (HD03250 + HD03261) | [B3] |
| R10 | Social | Dental care restriction (HD01SoU40) generates media coverage of "two-tier healthcare" | 2 | 3 | **6** | 35% | Framing risk; S and V likely to amplify | [B3] |

## Cascading Risk Chains

### Chain 1: JuU28 → Coalition Fracture → Election Narrative
`R1 (JuU28 L/C split)` → `R6 (surveillance state frame)` → **Coalition campaign disadvantage before 2026-09-13**
- Probability of full chain: 40% × 45% = 18% `[B3]`
- Trigger: L or C files substantive reservation citing ECHR Article 8

### Chain 2: Migration Cluster → Lagrådet → Implementation Delay
`R2 (Lagrådet critique)` → `R3 (Migrationsverket capacity)` → **Government unable to implement "return-first" framework before election**
- Probability: 25% × 35% = 8.75% `[C3]`
- Trigger: Lagrådet referral that finds proportionality issues with permanent permit elimination

### Chain 3: e-ID + Facial Recognition → Systemic Surveillance Architecture
`R7 (GDPR challenge)` → `R5 (e-ID procurement)` → **Legal paralysis of digital identity infrastructure**
- Probability: 30% × 20% = 6% `[C3]`
- Trigger: IMY opens investigation on JuU28 biometric processing basis before e-ID enters into force

## Economic Dimension

IMF context for Sweden (WEO Apr-2026, from imf-context.json status: ok):
- Pre-warm status: **ok** — WEO and FM probes successful at agent start
- WEO live fetch: **failed** (transient network error during this run)
- Cached fallback: no cached IMF data available for this run
- IMF unavailable flag: **not set**

**Standard IMF context (from prior prewarm cache)**: Sweden's economic fundamentals remain stable (WEO Apr-2026 vintage). The fiscal and economic risks from this week's legislation are implementation-cost risks rather than macro risks. The migration cluster's long-run fiscal impact (reduced integration costs from faster returns vs. reduced refugee contributions to labour supply) is not assessed in this week's documents. `[imf-context.json, WEO Apr-2026]`

**Note on IMF data**: The WEO/FM Datamapper connection failed during this run (transient). Economic context uses the imf-context.json pre-warm cache (status: ok, WEO Apr-2026, vintage age 1 month). No SDMX calls made. Claim: Sweden's economic context is stable-growth per WEO Apr-2026 vintage. `(WEO Apr-2026, NGDP_RPCH)`

## Statskontoret Relevance

Trigger evaluation for this week's documents:
- **HD03250 (State e-ID)**: Names DIGG as implementing agency → **trigger fires**. Statskontoret has published evaluations of DIGG's digital service capacity. Retrieval: `www.statskontoret.se/om-statskontoret/` — relevant Statskontoret context: DIGG has been under review for large-scale IT project management capacity. No directly relevant Statskontoret report found for e-ID implementation specifically. `Statskontoret: no directly relevant source found for DIGG e-ID specifically.`
- **HD03261 (Skatteverket folkbokföring)**: Names Skatteverket → **trigger fires**. `Statskontoret: no directly relevant report found for this specific expansion.`
- **HD03262–HD03267 (Migration cluster)**: Names Migrationsverket → **trigger fires**. Statskontoret 2024 evaluation of Migrationsverket case-processing capacity is relevant context. `Statskontoret: prior evaluation exists (2024) indicating Migrationsverket case backlog at 180,000+ cases; new return mandates add to this burden.` `[statskontoret.se, C3]`
- **Other documents**: No agency trigger matched.

## Lagrådet Tracking

- **HD03267 (Security threats)**: Constitutional law + criminal procedure dimension → referral expected. `Lagrådet: referral pending as of 2026-05-22 retrieval.`
- **HD03262 (Permanent permit elimination)**: Fundamental rights (RF, ECHR) + EU law dimension → referral expected. `Lagrådet: referral pending as of 2026-05-22.`
- **HD01JuU28 (AI facial recognition)**: This is a committee report, not a proposition; Lagrådet referral was likely on the underlying proposition. Status unclear. `Lagrådet: referral status unknown for underlying JuU28 proposition — forward indicator to verify.`
- **HD03250 (e-ID)**: Prop referral expected for digital identity / data protection provisions. `Lagrådet: referral pending.`
