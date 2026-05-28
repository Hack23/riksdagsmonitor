# Threat Analysis — Evening Analysis 2026-05-28

<!-- artifact: threat-analysis | family: C | pass: 2 -->

**Date**: 2026-05-28 | **Method**: STRIDE + OSINT threat taxonomy

---

## Threat Landscape Overview

The 2026-05-28 parliamentary batch reveals five distinct threat categories relevant to Sweden's democratic governance and national security architecture:

---

## Threat Category 1: Cybersecurity / National Security (FöU15)

**STRIDE classification**: Information Disclosure (current) → Spoofing, Tampering (mitigation target)

**Current threat**: Sweden's NCSC has been legally constrained from sharing classified cybersecurity threat intelligence across agencies (FRA, MSB, MUST, SÄPO, Polismyndigheten) due to offentlighets- och sekretesslagens (OSL) gaps. This created a de-facto information silo in Sweden's national cybersecurity architecture — threat actors could exploit the inter-agency coordination gap.

**FöU15 mitigation**: Three laws (prop. 2025/26:214) close the OSL gap, enabling FRA to share threat intelligence within the NCSC coordination framework. Force date 15 July 2026.

**Residual threat**: The 45-day window between FöU15 becoming law and the 15 July implementation date creates a known vulnerability window. Threat actors aware of the timeline may escalate activities before the information-sharing mechanism is operational.

**Intelligence assessment**: The NCSC consolidation is structurally important for NATO-member Sweden. The FöU15 package aligns Sweden's cybersecurity governance with allied standards (UK NCSC, German BSI, US CISA information-sharing models).

---

## Threat Category 2: Civil Liberties / Democratic Accountability (Prop 261 + Prop 267)

**STRIDE classification**: Elevation of Privilege (government capability expansion without proportionate oversight)

**Current threat**: Prop 261 (Skatteverket biometric comparison with Migrationsverket) and Prop 267 (expanded security-threat deportation scope) both expand state surveillance and coercive capabilities without equivalent expansions of oversight mechanisms.

**Opposition assessment (V+MP)**: Both V and MP raised "mission creep" concerns in their motions. The biometric mechanism creates a cross-agency data pipeline that — while initially scoped to welfare fraud (välfärdsbrott) — could be administratively expanded to other use cases without new legislation.

**Threat to rule-of-law**: Prop 267's lowered evidentiary threshold for security-threat categorisation, combined with expanded LSU scope, creates risk of wrongful categorisation for individuals with limited access to legal representation.

**Mitigation gaps**: Neither Prop 261 nor Prop 267 includes strengthened independent oversight mechanisms. The Advokatsamfundet and ICJ Sweden raised concerns in remisser. Government rejected all amendment motions.

---

## Threat Category 3: Migration / Human Rights (SfU34)

**STRIDE classification**: Denial of Service (detention system as coercive tool without proportionate governance)

**Riksrevisionen finding** (RiR 2025:32): Migration detention is described as "a costly tool without clear governance." This is not a political assessment — it is an official audit finding. The governance gap documented includes:
- Unclear criteria for detention decisions
- Inadequate Migrationsverket-Polismyndigheten coordination
- Insufficient child rights protections in detention contexts

**Threat**: Continued use of a governance-deficient detention system creates systematic human rights exposure (ECHR cases), creates administrative injustice for detainees, and undermines Sweden's international rule-of-law credibility.

**Political threat**: Government's rejection of all SfU34 opposition motions means the governance deficiencies will persist into the post-election period regardless of election outcome — the incoming government (whichever party) inherits an unreformed system.

---

## Threat Category 4: Electoral Integrity (Election Proximity)

**STRIDE classification**: Repudiation (attribution of legislative output as electioneering vs. genuine governance)

**Current threat**: The concentration of legislative force dates (JuU38: 2 July, FöU15: 15 July) immediately before the election creates a dual legitimacy challenge:
- **For Tidö**: Opposition can frame all spring legislation as "electioneering" rather than governance, undermining the delivery-evidence claim.
- **For Democracy**: Voters struggle to distinguish genuine policy delivery from pre-election marketing — a structural threat to informed voting.

**Mitigation**: Robust journalistic coverage and factual analysis (which this product supports) can help citizens assess policy substance vs. political timing.

---

## Threat Category 5: Energy Security (NU20)

**STRIDE classification**: Denial of Service (municipal veto as blocking mechanism for national energy security)

**Current threat**: Sweden's wind power expansion has been slowed by municipal veto rights on wind farm siting, creating bottlenecks in energy sovereignty targets. HD01NU20 removal of this veto addresses the constraint but creates local community conflict.

**SD-KD divergence threat**: If SD votes against NU20 in the chamber, the energy sovereignty gap persists. If government negotiates a compromise that preserves municipal consultation without full veto, implementation becomes complex and potentially slower.

---

## Threat Register Summary

| ID | Threat | Category | Severity | Mitigation Status |
|----|--------|----------|----------|-------------------|
| T-01 | NCSC inter-agency intelligence gap | Cybersecurity | HIGH | FöU15 in progress |
| T-02 | Biometric mission creep (Prop 261) | Civil Liberties | MEDIUM | Opposition motions tabled |
| T-03 | Migration detention governance failure | Human Rights | HIGH | Government rejected motions |
| T-04 | Electoral integrity / legislation timing | Democracy | MEDIUM | Inherent in parliamentary cycle |
| T-05 | Energy sovereignty gap (NU20) | National Security | MEDIUM | NU20 in progress |
| T-06 | L below 4% → Tidö majority loss | Electoral | HIGH | Britz interpellation pressure |

---

*STRIDE methodology applied to parliamentary threat surface. Not a classified security assessment.*
