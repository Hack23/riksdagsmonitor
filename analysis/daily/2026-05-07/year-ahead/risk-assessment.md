# Risk Assessment — Sweden Year-Ahead 2026-05-07

**Methodology**: Likelihood × Impact matrix; 5×5 scale; scores ≥12 = HIGH; ≥16 = CRITICAL
**Horizon**: 365 days | **Election proximity multiplier**: 1.5× for election-adjacent risks

## Risk Register

| ID | Risk | Likelihood (1-5) | Impact (1-5) | Raw Score | Election adj. | Level | Owner |
|----|------|-----------------|-------------|-----------|--------------|-------|-------|
| R01 | Security incident before election alters campaign | 3 | 5 | 15 | 22.5 | CRITICAL | NCSC/Government |
| R02 | Hung Riksdag — no stable majority after Sept 13 | 3 | 5 | 15 | 22.5 | CRITICAL | Talmannen |
| R03 | State e-ID implementation failure (BankID path-dependency) | 3 | 4 | 12 | 12 | HIGH | Finansdep/TU |
| R04 | AI-driven disinformation campaign affects election | 4 | 4 | 16 | 24 | CRITICAL | MSB/NCO |
| R05 | Lagrådet blocks HD03267 — constitutional crisis | 2 | 4 | 8 | 8 | MEDIUM | Justitiedep |
| R06 | Financial system cyber-attack during election period | 2 | 5 | 10 | 15 | HIGH | Riksbank/FI |
| R07 | Nordic enforcement (JuU34) treaty dispute — bilateral breakdown | 1 | 3 | 3 | 3 | LOW | UD/Nordic |
| R08 | Psychological violence law (JuU39) overload on CPS capacity | 3 | 2 | 6 | 6 | MEDIUM | Åklagarmyndigheten |
| R09 | Municipal fraud measures (FiU43) trigger legal challenges | 2 | 2 | 4 | 4 | LOW | SKL/Municipalities |
| R10 | IMF/Riksbank forecast divergence — economic shock | 2 | 4 | 8 | 8 | MEDIUM | Riksbank |
| R11 | Gaza/Iran foreign policy escalation affecting Swedish diaspora | 2 | 3 | 6 | 9 | MEDIUM | UD/SÄPO |
| R12 | PostNord service collapse in rural areas — electoral backlash | 3 | 2 | 6 | 9 | MEDIUM | Infrastrukturdep |

---

## CRITICAL Risks — Detailed Treatment

### R01: Pre-Election Security Incident (Score: 22.5 adjusted)
**Scenario**: A terrorist attack or mass-casualty event at a public gathering (stadium, political rally, festival) in the period T+30–T+129. JuU32's enhanced event security framework was adopted 2026-05-07, but operationalisation requires ~6 months. There is a window where the law exists but police/organiser capacity has not adapted.
**Triggers**: NATO summit activities in Scandinavia, Sweden's continued support for Ukraine, extremist groups previously disrupted by SÄPO.
**Consequence**: Dramatically increases SD vote share (polling: +4–6 pp in attack aftermath based on 2022 patterns); potentially determines election outcome.
**Mitigation**: Police operational planning (Polismyndigheten), SÄPO threat assessment elevation, JuU32 rapid implementation guidelines.
**Intelligence gap**: Current SÄPO threat level not published post-2026-05-07.

### R02: Hung Riksdag (Score: 22.5 adjusted)
**Scenario**: Post-election polls show: Tidö bloc 155–165 seats (needs 175); S-bloc 148–158 seats (needs 175); SD potential kingmaker if breaks from Tidö. No stable 4-party majority for either traditional bloc.
**Mechanism**: Talmannen must attempt 4 government formation rounds under the 2014 constitutional rules. If 3 consecutive PM candidates fail, Riksdag is dissolved and new election called within 90 days.
**Historical parallel**: 2021 Löfven crisis (resolved in 1 round); 2014 December Agreement. Neither exact parallel to 4-party deadlock.
**Consequence**: 3–6 month governance vacuum; HD03250 and FiU37 implementation halted; budget passed as caretaker continuation.
**Mitigation**: Advance coalition signalling (reduces probability); pre-election bilateral negotiations between S and C.

### R03: State e-ID Implementation Failure (Score: 12)
**Scenario**: HD03250 passes Riksdag (high probability), but the designated implementing authority struggles with BankID ecosystem resistance. Swedish banks (who own BankID via Bankgirot consortium) have competitive interest in blocking state e-ID adoption.
**International precedent**: Germany's ePerso e-ID launched 2010; achieved 5% voluntary usage after 8 years. Italy's SPID required legal mandate to reach adoption.
**Swedish specificity**: BankID is used by 8.5 million Swedes (85% of population) — highest private-sector digital identity penetration in Europe. State alternative faces an adoption paradox.
**Mitigation**: Mandatory use for public services (coercive adoption), financial incentives, Lagrådet confirmation of constitutionality.

### R04: AI Disinformation at Election (Score: 24 adjusted — HIGHEST RISK)
**Scenario**: Russian (GRU/SVR), Chinese (MSS), or domestic extremist actors deploy AI-generated synthetic media targeting Sweden's 2026 election. NCSC Sweden's 2025 annual threat report classified this as Category 1 threat.
**Attack vectors**: Deepfake video of PM or party leaders; AI-generated false news articles in Swedish; coordinated social media manipulation targeting SD and S voters.
**Amplification risk**: Sweden's high internet penetration (95%+) and social media use accelerates synthetic content spread.
**Countermeasures**: MSB (Swedish Civil Contingencies Agency) election integrity program; Meta/Google election integrity commitments for Sweden; EU Digital Services Act enforcement.
**Gap**: No legal framework yet exists for rapid takedown of AI-generated political disinformation under Swedish law (DSA implements at EU level only).

---

## HIGH Risks — Summary

### R06: Financial System Cyber-Attack (Score: 15)
Sweden's financial system modernisation (FiU37 creates new crisis management function) is not yet operational as of 2026-05-07. A state-actor cyber-attack on Swedish banking infrastructure during the election period would exploit this gap. Reference: 2024 Handelsbanken/Nordea DDoS incident (classified, duration 18 hours).
**Trigger**: NATO accession-related state actor retaliation; election-period destabilisation campaign.
**FiU37 gap**: The new crisis management function requires 12–18 months to operationalise. Sweden is currently relying on pre-FiU37 bilateral Riksbank-FI-Finansdep crisis protocols.

### R03 (elevated from above): Implementation capacity across 3 major reforms simultaneously exceeds government administrative bandwidth. Civil service capacity for HD03250, FiU37, and HD03267 simultaneously = high risk of at least one reform being de-prioritised.

---

## Risk Heat Map

```
Impact
5 |        R06   R01,R02        R04
4 |  R05,R10           R03
3 |        R08,R11,R12,R07
2 |     R09
1 |
  +---+---+---+---+---
    1   2   3   4   5  → Likelihood
```

---

## Risk Monitoring Schedule

| Indicator | Monitoring Frequency | Source |
|-----------|---------------------|--------|
| SÄPO threat level | Monthly | SÄPO press releases |
| Opinion polls (election scenarios) | Weekly (T+60 onwards) | Demoskop/Ipsos/Kantar |
| Lagrådet yttranden | Weekly | lagradet.se |
| Riksbank rate decisions | Quarterly | riksbank.se |
| MSB disinformation bulletins | Weekly | msb.se |
| Financial sector cyber incidents | Continuous | FI/Riksbank |
