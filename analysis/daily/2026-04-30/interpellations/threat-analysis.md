# Threat Analysis — Interpellations 30 April 2026

**Author**: James Pether Sörling  
**Date**: 2026-04-30  

## Political Threat Taxonomy

### Threat Class 1: Strategic Incoherence (HD10461 — Space/ESA)

**MITRE ATT&CK-style mapping** (political domain):
- **Tactic**: Resource denial via budget under-allocation
- **Technique**: Ministry approval of below-threshold budget (100 MSEK vs. required level)
- **Kill chain phase**: Impact — already materialising (Sweden at ESA rank 17/23 [A2])

**Attack tree**:
```
Root goal: Maintain Swedish space industry competitiveness
├── Path 1 (THREATENED): ESA programme participation
│   ├── Prerequisite: Adequate ESA budget allocation ← BLOCKED by 100 MSEK ceiling
│   └── Consequence: Reduced programme share → contract exclusion
├── Path 2 (CONTINGENT): Bilateral EU space agreements
│   └── Status: Available but insufficient substitute for ESA programme access
└── Path 3 (PARTIAL): National space programmes (Rymdstyrelsen domestic)
    └── Status: Active but ESA market access not replaceable domestically
```

### Threat Class 2: Stewardship Failure (HD10460 — Cultural Heritage)

**Political Threat Taxonomy**:
- **Category**: Governance failure via deferred maintenance
- **Actor**: Government (SFV + Culture Ministry) — failure to act is the threat
- **Vector**: Riksrevisionen RiR 2025:30 documents under-resourcing [A1]

**Kill chain**:
```
Step 1: Grant properties under-funded (structural, not acute)
Step 2: Riksrevisionen audit identifies gap (RiR 2025:30) [A1]
Step 3: SD interpellation (HD10460) forces public ministerial accountability
Step 4: [Pending] Ministerial response → plan/no plan
Step 5: [Risk if no plan] Escalation via KU hearing or media/civil society pressure
```

## TTP Catalogue

| TTP | Description | Evidence [Admiralty] |
|-----|-------------|---------------------|
| TTP-1 | Parliamentary accountability via interpellation | HD10460, HD10461 filed 2026-04-29 [A1] |
| TTP-2 | Audit citation to strengthen political challenge | RiR 2025:30 cited in HD10460 [A1]; Rymdstyrelsen budget request cited in HD10461 [A2] |
| TTP-3 | Quantitative benchmarking (ESA rank, Nordic comparisons) | HD10461: Sweden rank 17/23, behind all Nordic neighbours [A2] |
| TTP-4 | Intra-coalition friction (SD → M oversight) | HD10460 challenges coalition culture minister [B2] |

