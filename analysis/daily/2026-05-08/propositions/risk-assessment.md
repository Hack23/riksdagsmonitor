# Risk Assessment — Government Propositions 2026-05-08

**Date**: 2026-05-08  
**Framework**: ISO 31000 risk management with intelligence-adapted likelihood/impact ratings  

---

## Risk Register

### Risk Category Legend
- **Probability**: 5=Very High (>80%), 4=High (60-80%), 3=Medium (40-60%), 2=Low (20-40%), 1=Very Low (<20%)
- **Impact**: 5=Catastrophic, 4=Major, 3=Significant, 2=Minor, 1=Negligible
- **Risk Score** = Probability × Impact (1-25)

---

## HD03267 — Security Expulsion Law Risks

| Risk ID | Risk Description | P | I | Score | Owner | Mitigation |
|---------|-----------------|---|---|-------|-------|------------|
| R-267-01 | ECHR Art. 5 challenge succeeds — Strasbourg strikes down detention extension | 3 | 5 | 15 | Justitiedepartementet | Robust lagrådsremiss; rights-compliant drafting; sunset clause |
| R-267-02 | Misidentification — Swedish citizen or legal resident wrongly detained | 2 | 4 | 8 | SÄPO / migration courts | Mandatory judicial review within 48h; independent oversight |
| R-267-03 | S/V/MP form post-election government and reverse legislation | 4 | 3 | 12 | Political risk | Cross-party consultation; embed in EU framework to raise reversal cost |
| R-267-04 | International reputation damage — Amnesty/UNHCR campaign | 3 | 3 | 9 | UD (Foreign Affairs) | Proactive rights-framework communication |
| R-267-05 | Implementation gap — SÄPO lacks capacity for expanded detention logistics | 2 | 3 | 6 | Kriminalvård / SÄPO | Capacity assessment before 1 March 2027 entry into force |

**Highest risk**: R-267-01 (ECHR challenge, score 15) — this is the existential legal risk for the legislation.

---

## HD03250 — State e-ID Risks

| Risk ID | Risk Description | P | I | Score | Owner | Mitigation |
|---------|-----------------|---|---|-------|-------|------------|
| R-250-01 | State IT system breach — centralised identity system compromised | 2 | 5 | 10 | DIGG / MSB | ISO 27001 compliance; penetration testing; incident response plan |
| R-250-02 | Procurement failure — cost overrun, delay, vendor lock-in | 4 | 4 | 16 | Finansdepartementet / DIGG | Competitive procurement; escrow requirements; modular architecture |
| R-250-03 | Low adoption — public prefers BankID; state e-ID becomes parallel system | 4 | 3 | 12 | DIGG | Mandated use for public services; transition plan |
| R-250-04 | GDPR violation — data architecture breaches Art. 5(1)(c) data minimisation | 3 | 3 | 9 | IMY / Datainspektionen | IMY consultation in design phase; privacy by design |
| R-250-05 | EUDIW non-conformity — Swedish state e-ID incompatible with EU wallet standard | 2 | 4 | 8 | EU/DIGG | Regular EUDIW working group participation |

**Highest risk**: R-250-02 (procurement failure, score 16) — Sweden's poor IT procurement history makes this the primary operational risk.

---

## HD03261 — Skatteverket Expansion Risks

| Risk ID | Risk Description | P | I | Score | Owner | Mitigation |
|---------|-----------------|---|---|-------|-------|------------|
| R-261-01 | GDPR proportionality challenge — IMY rules data matching powers disproportionate | 3 | 3 | 9 | Skatteverket / IMY | Pre-legislative IMY consultation; proportionality assessment |
| R-261-02 | Discriminatory enforcement — expanded powers disproportionately applied to immigrant communities | 3 | 4 | 12 | Skatteverket / DO (Diskrimineringsombudsmannen) | Equality impact assessment; DO review of enforcement guidelines |
| R-261-03 | Data breach — Skatteverket population register compromised | 2 | 5 | 10 | Skatteverket / MSB | Tiered access controls; encryption at rest; incident response |
| R-261-04 | Scope creep — expanded powers used beyond folkbokföring domain | 3 | 3 | 9 | Riksdag (legal oversight) | Explicit legislative scope limitation; annual report to parliament |
| R-261-05 | Political misuse — powers directed at political opponents or journalists | 1 | 5 | 5 | Riksdag / JO (Justitieombudsman) | JO oversight mandate; whistleblower protections |

**Highest risk**: R-261-02 (discriminatory enforcement, score 12) — civil rights risk elevated given migrant-background populations overrepresented in folkbokföring fraud investigations.

---

## Portfolio-Level Systemic Risks

| Risk ID | Risk Description | P | I | Score |
|---------|-----------------|---|---|-------|
| R-PORT-01 | Systemic architecture risk — three interconnected systems create single-point vulnerabilities | 3 | 5 | 15 |
| R-PORT-02 | Post-election reversal of the package creates legal uncertainty (partial repeal) | 4 | 3 | 12 |
| R-PORT-03 | EU scrutiny of Sweden's human rights record delays EU Council votes on Sweden | 2 | 3 | 6 |
| R-PORT-04 | Public trust erosion — surveillance state narrative takes hold, reducing digital service adoption | 3 | 3 | 9 |

---

## Risk Priority Matrix

**Critical (Score ≥ 15)**:
- R-267-01: ECHR challenge on detention (15)
- R-PORT-01: Systemic architecture vulnerability (15)
- R-250-02: e-ID procurement failure (16) — **HIGHEST PRIORITY**

**High (Score 10-14)**:
- R-267-03: Post-election reversal (12)
- R-261-02: Discriminatory enforcement (12)
- R-250-03: Low e-ID adoption (12)
- R-PORT-02: Partial legal uncertainty from reversal (12)
- R-250-01: State ID breach (10)
- R-261-03: Skatteverket breach (10)

**Medium (Score 5-9)**: R-267-02, R-267-04, R-250-04, R-250-05, R-261-01, R-261-04, R-PORT-04

**Low (Score <5)**: R-261-05, R-PORT-03

---

## Recommended Risk Response

1. **Government**: Commission independent legal assessment of ECHR compatibility for HD03267 before committee stage
2. **DIGG**: Publish procurement strategy for state e-ID with market consultation — reduce R-250-02
3. **Skatteverket**: Proactive equality impact assessment for HD03261 enforcement guidelines — reduce R-261-02
4. **Parliament**: Consider framework legislation linking all three bills with a single oversight mechanism (Riksrevisionen scope)
5. **Civil society**: Anticipated litigation — Advokatsamfundet, ECRE, and Civil Rights Defenders likely to mount Art. 5 challenge
