# Threat Analysis — Year-Ahead 2026-05-09
# STRIDE-Adapted Political Threat Model

## Threat Model Scope

System: Swedish democratic governance system
Horizon: T+365 (2026-05-09 → 2027-05-07)
Election: 2026-09-13 (T+129) — primary threat surface

## STRIDE-Adapted Political Threats

### S — Spoofing (Identity/Legitimacy)
**T-S1: Candidate/party impersonation via AI synthetic media**
- Description: AI-generated video/audio deepfakes of political leaders making false statements
- Probability: MEDIUM-HIGH (40%)
- Impact: HIGH — could shift 1–3% of undecided voters
- Countermeasure: MSB pre-bunking campaign; EU DSA enforcement; party authentication hashes
- Reference: R04 from risk-assessment.md

**T-S2: State e-ID spoofing before implementation**
- Description: During the transition period (HD03250 passed but not implemented), fraudulent claims of state e-ID to access public services
- Probability: LOW (15%)
- Impact: MEDIUM — reputational damage to reform
- Countermeasure: Phased rollout with BankID parallel validity maintained

### T — Tampering (Data/Process Integrity)
**T-T1: Electoral roll tampering via Skatteverket vulnerabilities**
- Description: Before HD03261 (Skatteverket expanded powers) is fully operationalised, systematic address fraud could affect electoral roll accuracy
- Probability: LOW (10%)
- Impact: MEDIUM — targeted electoral district manipulation
- Countermeasure: Valmyndigheten manual verification; HD03261 cross-referencing

**T-T2: Financial data manipulation targeting Swedish institutions**
- Description: State-actor modification of transaction records or clearing data targeting OTC derivatives (FiU38 context)
- Probability: LOW (8%)
- Impact: HIGH — market stability impact
- Countermeasure: FiU37 crisis management function (once operationalised); Riksbank supervision

### R — Repudiation (Accountability)
**T-R1: Security expulsion orders challenged post-execution**
- Description: After HD03267 security expulsions are carried out, expelled individuals or advocacy groups challenge the evidentiary basis in domestic or ECHR courts
- Probability: MEDIUM (35%)
- Impact: MEDIUM-HIGH — legal costs, diplomatic complications, possible forced returns
- Countermeasure: Robust documentation; Lagrådet pre-clearance; legal aid restrictions (already in HD03267)

**T-R2: AI-generated political communications without attribution**
- Description: Campaign materials using AI without disclosure; no Swedish law requires AI attribution in political advertising as of 2026-05-09
- Probability: HIGH (60%)
- Impact: MEDIUM — democratic legitimacy erosion
- Countermeasure: Voluntary party commitments; EU AI Act political advertising provisions (coming 2027)

### I — Information Disclosure
**T-I1: SÄPO intelligence on foreign interference disclosed pre-election**
- Description: Unauthorised disclosure of Swedish security service assessments on election interference
- Probability: LOW (10%)
- Impact: MEDIUM — public panic, party-politicisation of security
- Countermeasure: Classification protocols; whistleblower legislation provisions

**T-I2: PostNord customer data breach (election period)**
- Description: HD10477 question on PostNord service disruptions signals systemic stress; PostNord handles election ballot distribution
- Probability: LOW (5%)
- Impact: HIGH — election integrity risk if ballot distribution is compromised
- Countermeasure: Valmyndigheten contingency planning; postal backup systems

### D — Denial of Service (Institutional/Infrastructure)
**T-D1: DDoS against Riksdag or Valmyndigheten during election**
- Description: State-actor coordinated DDoS attack against riksdagen.se or valmyndigheten.se during election week
- Probability: MEDIUM (25%)
- Impact: MEDIUM — disruption but election proceeds (physical voting booths as primary channel)
- Countermeasure: DDoS protection contracts; Riksdag IT hardening (referenced in prior riksmöte appropriations)

**T-D2: Physical event security breach at campaign event**
- Description: Despite HD01JuU32 enhanced event security, attack on a major party campaign rally
- Probability: LOW-MEDIUM (15%)
- Impact: VERY HIGH — potential mass casualties; political earthquake
- Countermeasure: JuU32 operationalisation sprint; SÄPO advance threat assessment for campaign events

### E — Elevation of Privilege (Power Concentration)
**T-E1: Coalition formation abuse — extra-constitutional pressure**
- Description: During coalition negotiations post-election, one party uses media/market pressure tactics to extract disproportionate concessions
- Probability: MEDIUM (30%)
- Impact: MEDIUM — democratic norms erosion
- Countermeasure: Transparent Talmannen process; public pressure; EU peer review

**T-E2: State e-ID as surveillance infrastructure**
- Description: HD03250 state e-ID, once operational, could be repurposed by a future government for population tracking beyond stated purpose
- Probability: LOW (10%) — within T+365; higher in T+365–T+730 range
- Impact: HIGH — privacy and civil liberties
- Countermeasure: Datainspektionen oversight; GDPR Art. 5 purpose limitation; Offentlighetsprincipen

---

## Threat Priority Matrix

| Threat | Priority | Time Band | Mitigation Status |
|--------|----------|-----------|------------------|
| T-R2: AI in political communications | HIGH | T+60–T+129 | Inadequate (no law) |
| T-D2: Physical attack on campaign event | HIGH | T+60–T+129 | Partial (JuU32 new) |
| T-S1: Deepfake candidate impersonation | HIGH | T+60–T+129 | Partial (MSB program) |
| T-D1: DDoS on election infrastructure | MEDIUM | T+120–T+134 | Partial (technical) |
| T-R1: Security expulsion legal challenge | MEDIUM | T+30–T+365 | Partial (Lagrådet) |
| T-E1: Coalition formation pressure | MEDIUM | T+129–T+180 | Constitutional |
| T-T1: Electoral roll tampering | LOW | T+0–T+129 | HD03261 mitigates |
| T-E2: e-ID surveillance creep | LOW (T+365) | T+365+ | GDPR/Datainspektionen |

---

## State-Actor Threat Assessment

| Actor | Primary Vector | Capability | Intent (2026) | Confidence |
|-------|---------------|-----------|--------------|-----------|
| Russia | Election disinformation; financial sector disruption | High | High (NATO expansion reaction) | HIGH |
| China | Economic leverage; diaspora influence | Medium | Medium (trade relations) | MEDIUM |
| Iran | Diaspora mobilisation; consular pressure | Low-Medium | Medium (HD11795 question context) | MEDIUM |
| Non-state extremism | Physical attacks; domestic political violence | Medium | Medium (security services active) | MEDIUM |
