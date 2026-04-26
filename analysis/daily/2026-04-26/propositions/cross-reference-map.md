# Cross-Reference Map — Swedish Government Propositions 23 April 2026

**Author**: James Pether Sörling  
**Date**: 2026-04-26  
**Classification**: UNCLASSIFIED // PUBLIC SOURCE

---

## Policy Clusters

### Cluster A: EU Financial Regulation (FiU)
- **HD03253** (EU:s bankpaket, CRD6/CRR3) ← **continues** prior EU banking regulation
- **HD03104** (Skuldförvaltning evaluation) ← **amends** government accountability on debt policy
- Cross-link: Both submitted by Niklas Wykman (Finansdepartementet) to FiU on 2026-04-23. [A1]

### Cluster B: Law-and-Order Coalition (SfU)
- **HD03252** (Socialförsäkringsförmåner fängelsestraff) ← **continues** pattern:
  - HC03202 (rm 2024/25): Electronic monitoring (fängelsestraff) — same Justitiedepartementet, same SD-M coalition
  - HC03204 (rm 2024/25): Rules on suspension of state employees (Finansdepartementet)
  - Prior: Security detention reform 2024/25 — same legislative chain [B2]
- Cross-link: SD electoral programme 2022–26 systematically restricts welfare entitlements for those under criminal justice control. [C3]

### Cluster C: EU Transport Enforcement (TU)
- **HD03256** (Färdskrivare) ← **continues** EU ITS/tachograph reform:
  - EU Regulation (EU) 2020/1054 Article 103 (smart tachograph)
  - EU Commission 2030 Road Safety Strategy
  - Prior Swedish transposition: rm 2023/24 tachograph digital transition [B2]

## Legislative Chains

```mermaid
%%{init: {"theme": "dark", "themeVariables": {"primaryColor": "#00d9ff", "primaryTextColor": "#e0e0e0", "lineColor": "#ff006e"}}}%%
graph LR
    EU_CRD6["EU CRD6 Dir. 2024/1619\n+ CRR3 Reg. 2024/1623"] -->|transposition| HD03253["HD03253\nEU Bankpaket"]
    HC03202["HC03202 rm 2024/25\nElectronic Monitoring"] -->|continues| HD03252["HD03252\nSocialförsäkring"]
    EU_TACHO["EU Reg. 2020/1054\nSmart Tachograph"] -->|enforcement| HD03256["HD03256\nFärdskrivare"]
    RIKSGALDEN_REPORT["Riksgälden Årsredov.\n2021–2025"] -->|evaluation| HD03104["HD03104\nSkuldförvaltning"]

    style EU_CRD6 fill:#00d9ff,color:#000
    style HC03202 fill:#ffbe0b,color:#000
    style EU_TACHO fill:#00d9ff,color:#000
    style RIKSGALDEN_REPORT fill:#ffbe0b,color:#000
    style HD03253 fill:#ff006e,color:#fff
    style HD03252 fill:#1a1e3d,color:#e0e0e0
    style HD03256 fill:#1a1e3d,color:#e0e0e0
    style HD03104 fill:#1a1e3d,color:#e0e0e0
```

## Coordinated Filing Patterns

- **Same-day submission (2026-04-23)**: All four documents submitted on the same date — consistent with end-of-spring-session legislative batch filing (typical April government calendar). [A1]
- **FiU doubling**: Two documents (HD03253 + HD03104) routed to the same committee (FiU) on the same day — committee workload concentration.
- **Minister cluster**: Niklas Wykman responsible for 2 of 4 items — highest ministerial exposure this cycle.

## Edge Labels (Canonical Cross-Reference Vocabulary)

| Edge | From | To | Label |
|------|------|----|-------|
| EU → SE transposition | EU CRD6/CRR3 | HD03253 | `continues` |
| Law-and-order chain | HC03202 | HD03252 | `continues` |
| Enforcement enhancement | EU Reg. 2020/1054 | HD03256 | `amends` |
| Accountability | Riksgälden evaluation | HD03104 | `bundle` |
