# Threat Analysis — Government Propositions 2026-05-08

**Date**: 2026-05-08  
**Framework**: STRIDE threat model adapted for legislative/political intelligence  

---

## STRIDE in Political Context

For legislative analysis, STRIDE dimensions are:
- **S (Spoofing)**: Misrepresentation of legislative intent; false attribution of policy authorship
- **T (Tampering)**: Amendment that changes legislative character in committee; lobbying that corrupts design
- **R (Repudiation)**: Governments disavowing policy outcomes; accountability evasion
- **I (Information Disclosure)**: Unintended privacy/data exposure from new statutory powers
- **D (Denial of Service)**: Constitutional blocking mechanisms; court-ordered freezes
- **E (Elevation of Privilege)**: Expanded government power beyond stated scope

---

## HD03267 — Security Expulsion Law

### STRIDE Analysis

**S — Spoofing Threats**:
- Government frames this as "EU-compatible" when ECHR conformity is contested → false assurance to parliament and public
- Risk: Lagrådet may not be asked for full opinion → transparency deficiency

**T — Tampering Threats**:
- Committee stage: SD may push for further hardening (lower threshold, longer detention) beyond government proposal
- L deputies may dilute civil liberties provisions under party pressure
- External: SÄPO institutional lobbying for maximum operational discretion

**R — Repudiation Threats**:
- If ECHR challenge succeeds, government may disavow that the law was intended to go beyond Convention → accountability vacuum
- Responsible minister (Strömmer) at risk of individual accountability if misapplication occurs

**I — Information Disclosure**:
- SÄPO classification of "qualified security threats" is classified → targets cannot effectively challenge their designation
- Risk: procedural opacity in security designation process enables abuse

**D — Denial of Service**:
- Constitutional risk: IF Lagrådet issues negative opinion, coalition faces governance crisis
- Justitieombudsmannen (JO) investigation may freeze implementation
- ECHR interim measures (Art. 39) could halt specific expulsions mid-case

**E — Elevation of Privilege**:
- Extended detention powers create template for future expansion beyond "qualified security threats" to broader categories
- Precedent risk: once lower evidentiary bar is established in one law, pressure to replicate in others (terrorism prevention, organised crime)

**Primary STRIDE threats**: E (privilege elevation) and D (DoS via ECHR) are highest probability

---

## HD03250 — State e-ID

### STRIDE Analysis

**S — Spoofing Threats**:
- Hostile state actors (Russia, China) attempting to spoof or duplicate state e-ID credentials → national security threat
- Phishing attacks against Swedish residents exploiting new state e-ID onboarding process
- Foreign interference in e-ID governance process

**T — Tampering Threats**:
- Procurement process subject to vendor manipulation → single vendor captures design → lock-in
- If DIGG outsources core cryptography, algorithm tampering by subcontractor is a risk
- Committee amendments: opposition could insert privacy-by-design requirements that increase cost/delay

**R — Repudiation**:
- Government disclaims responsibility if state e-ID system is breached → "independent agency" buffer
- No-fault liability framework for identity theft enabled by state e-ID breach

**I — Information Disclosure**:
- Centralised digital identity creates highest-value single attack target in Swedish digital infrastructure
- Correlation risk: if state e-ID is linked to other state databases (Skatteverket, healthcare), effective profiling of all Swedish residents becomes trivial
- GDPR Art. 5(1)(c) data minimisation: any architecture linking e-ID to behaviour tracking is unlawful

**D — Denial of Service**:
- State e-ID system outage = denial of digital public services for all users → critical infrastructure dependency
- Cyber-physical: DDoS attack on state e-ID at election time (September 2026) would be highest-impact timing for adversary

**E — Elevation of Privilege**:
- State identity layer can be extended by future governments to include surveillance, travel restrictions, or benefit conditionality without new legislation
- Risk of "mission creep" from authentication to identification to tracking

**Primary STRIDE threats**: I (data exposure/correlation risk) and T (procurement tampering/vendor capture)

---

## HD03261 — Skatteverket Expansion

### STRIDE Analysis

**S — Spoofing Threats**:
- Fraudsters adapting to new detection methods → arms race dynamic; spoofing of legitimate addresses to evade enhanced monitoring

**T — Tampering Threats**:
- Vendor of Skatteverket data analytics systems gains access to expanded population data → insider threat
- Lobbying by data analytics companies for expanded scope to their advantage

**R — Repudiation**:
- Individual Skatteverket officials may refuse to implement in full → implementation discretion creates accountability gaps
- Government disclaims discriminatory enforcement by citing operational independence of Skatteverket

**I — Information Disclosure**:
- Expanded data matching means breach of one register propagates to all linked registers
- Risk: Skatteverket data shared with third parties under vague "public interest" justification in new law

**D — Denial of Service**:
- JO/IMY investigation into discrimination or GDPR violation could freeze data matching operations

**E — Elevation of Privilege**:
- New powers scoped to folkbokföring but Skatteverket has broad mandate → administrative expansion to tax enforcement, benefits administration
- Risk of using folkbokföring powers to monitor political activists or migrants

---

## Portfolio Threat Matrix

| Threat Vector | HD03267 | HD03250 | HD03261 | Portfolio Risk |
|---------------|---------|---------|---------|---------------|
| Spoofing | Medium | High | Low | High |
| Tampering | Medium | High | Medium | High |
| Repudiation | High | Medium | Medium | High |
| Information Disclosure | High | High | High | **Critical** |
| Denial of Service | High | High | Medium | High |
| Elevation of Privilege | **Critical** | High | High | **Critical** |

**Highest portfolio threat**: Information Disclosure (three interconnected systems each exposing sensitive data) and Elevation of Privilege (each law creates template for future expansion). The **combination** of state e-ID + population register expansion + security expulsion powers in a single legislative session creates a threat matrix qualitatively larger than any single bill.

---

## Threat Actor Assessment

| Actor | Motivation | Capability | Threat to Legislative Package |
|-------|-----------|-----------|-------------------------------|
| Russian GRU/FSB | Disrupt Swedish NATO integration + e-ID infrastructure | High | Offensive cyber against state e-ID; disinformation on HD03267 |
| Chinese APT groups | Long-term data collection on Swedish residents | High | Infiltration of e-ID procurement/implementation |
| Domestic civil society | Challenge civil liberties provisions | Medium | Legal challenges; ECHR petitions; political pressure |
| Opposition parties (S, V, MP) | Reverse legislative package post-election | High | Electoral strategy; committee obstruction |
| Criminal networks | Adapt to Skatteverket expansion; countermeasures | Medium | Fraud evolution; corrupt official targeting |
