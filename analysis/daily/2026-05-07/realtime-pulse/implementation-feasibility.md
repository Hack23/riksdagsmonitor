# Implementation Feasibility — 2026-05-07

**Scope**: Practical implementation assessment for today's major legislative items  
**Focus**: HD03267, HD03261, HD03250, HD01FiU37

---

## HD03267 — Security Detention (Effective 2027-03-01)

### Implementation Readiness

**SÄPO capacity**: HIGH  
SÄPO's existing special control unit has managed the 2022:700 framework for 3 years. Transitioning to unlimited detention powers requires:
- Updated detention protocols and case management
- Training for staff on sänkt beviskrav applications
- Security wing infrastructure for children (§6.3 — children on security wings)

**Security wing infrastructure**: MEDIUM CONCERN  
The proposition requires that detained children can be placed on security wings. Sweden's existing detention/migration detention facilities do not universally have certified security wings suitable for children. The SiS (Statens institutionsstyrelse) would need to:
- Retrofit existing facilities OR build new capacity
- Hire specialist staff for child security detention
- Timeline: 2027-03-01 is tight if construction is required; retrofitting more feasible

**Migration courts/judicial capacity**: LOW CONCERN  
The proposition reduces the procedural burden on migration courts (lowered evidentiary standard). Paradoxically, this means fewer contested hearings but more complex cases as individuals challenge the lowered standard. Net workload approximately neutral.

**Cost assessment (§11.1)**: Referenced in the proposition — the government has conducted an economic consequence analysis. Costs are primarily in SÄPO case management and SiS facility adaptation. Medium-term costs estimated within normal operational budgets.

**Feasibility verdict**: ACHIEVABLE within timeline. Security wing infrastructure is the one potential bottleneck; 10-month lead time is adequate if procurement begins immediately.

---

## HD03261 — Skatteverket Expansion (Timeline: TBD)

### Implementation Readiness

**Technical infrastructure**: MEDIUM CONCERN  
Cross-system data matching between Skatteverket and welfare/benefits systems requires:
- API agreements with Social Insurance Agency (Försäkringskassan), municipalities, and other data holders
- GDPR Article 6 legal basis documentation for each data exchange
- Data minimisation controls — only folkbokföring-relevant data exchanged

**Dutch SyRI risk**: HIGH ATTENTION REQUIRED  
The Netherlands' SyRI system was struck down precisely because of insufficient technical safeguards around automated decision-making. Skatteverket must ensure HD03261's implementation includes:
- Human review of all automated flags before administrative action
- Transparency mechanism for individuals flagged
- GDPR impact assessment (DPIA) — mandatory under GDPR Article 35 for high-risk processing

**Timeline for full implementation**: 18-24 months (API development, data agreements, staff training)

**Feasibility verdict**: ACHIEVABLE but risks delays if GDPR safeguards are challenged at regulatory level. Datainspektionen (Swedish Data Protection Authority) review is mandatory and could impose additional requirements.

---

## HD03250 — State E-ID (Timeline: 2027 target)

### Implementation Readiness

**Technical architecture**: MEDIUM CONCERN  
A state e-ID requires:
- Trusted Identity Provider infrastructure (government-grade, high availability)
- Integration with all government services (MinaSidor, health records, tax services, etc.)
- Mobile application (Apple/Google app stores — complex international dependency)
- Identity proofing process (in-person enrollment for highest assurance levels)

**BankID transition**: HIGH COMPLEXITY  
~95% of Swedish digital identity currently uses BankID. The state e-ID must either:
1. Replace BankID (massive transition, commercial disruption) — likely 7-10 years
2. Coexist with BankID — eIDAS 2.0 compliance approach (mutual recognition)

Option 2 is more feasible and likely what the proposition implements. The 2027 target is achievable for initial rollout; full penetration takes a decade.

**Rural/digital inclusion**: CRITICAL DEPENDENCY  
Must include analog (non-digital) enrollment and service access pathways. Failure here creates legal obligation challenges (Diskrimineringslagen — discrimination in public services access).

**Feasibility verdict**: ACHIEVABLE for initial rollout by 2027. Full adoption requires 5-8 years and sustained commitment across multiple parliaments.

---

## HD01FiU37 — Financial Crisis Management Function

### Implementation Readiness

**Institutional design**: MEDIUM CONCERN  
The committee recommendation creates a new function but must clarify:
- Which institution leads (Riksbanken vs Finansinspektionen vs new entity)
- Mandate scope (banking sector only vs broader financial sector including insurance, funds)
- EU DORA compatibility (Digital Operational Resilience Act — effective January 2025)

**Staffing**: LOW-MEDIUM CONCERN  
Creating a specialist operational crisis team requires attracting expertise from Riksbanken/FI. Risk of talent competition between institutions.

**Coordination protocols**: HIGH PRIORITY  
The most critical implementation challenge is establishing clear command-and-control protocols for a crisis scenario — who has authority to act, on what timeline, with what triggers. Post-SVB (2023) analysis showed that unclear coordination was the primary operational failure in international banking stress events.

**Feasibility verdict**: ACHIEVABLE within 12-18 months if the institutional structure is clearly defined. Legislative ambiguity about which institution leads is the primary risk.

---

## Implementation Priority Matrix

| Proposition | Timeline | Feasibility | Key Risk | Action Required |
|------------|---------|------------|---------|----------------|
| HD03267 | 2027-03-01 | HIGH | Child security wing infrastructure | SÄPO procurement now |
| HD03261 | 18-24 months | MEDIUM | SyRI precedent / GDPR | DPIA + Datainspektionen |
| HD03250 | 2027 initial | MEDIUM-HIGH | BankID coexistence / rural inclusion | Standards consultation |
| HD01FiU37 | 12-18 months | MEDIUM | Institutional mandate clarity | Riksbanken/FI alignment |
