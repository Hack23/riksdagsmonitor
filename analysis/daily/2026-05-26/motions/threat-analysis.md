# Threat Analysis — MP Motions on Security and Taxation, 2026-05-26

**Framework**: Political Threat Taxonomy + Kill Chain + Attack Tree
**Date**: 2026-05-26 | **Analyst**: James Pether Sörling

---

## Political Threat Taxonomy

### Threat Category A: Institutional Legitimacy

| Threat | Actor | Target | Vector | TTP |
|--------|-------|--------|--------|-----|
| T-A1 | Swedish state / Tidö-coalition | Children's rights (ECHR, CRC) | Legislative override of binding international obligations | TTP-A1: Majority-imposed security exception to fundamental rights |
| T-A2 | Riksdag majority | Barnkonventionen (SFS 2018:1197) | De facto nullification via security override | TTP-A2: Security-exceptionalism legislative pattern |
| T-A3 | Skatteverket | Individual data privacy | Expanded database authority without adequate safeguards | TTP-A3: Administrative power creep via incremental mandate expansion |

### Threat Category B: Democratic Process

| Threat | Actor | Target | Vector | TTP |
|--------|-------|--------|--------|-----|
| T-B1 | Tidö-coalition | Opposition minority voice | Procedural majority override of rights-based objections | TTP-B1: Numerical majority displacing constitutional review |
| T-B2 | SD (Sweden Democrats) | Immigration policy discourse | Securitization framing that conflates child/family rights with security threat | TTP-B2: Threat framing escalation |

### Threat Category C: Rights Erosion

| Threat | Actor | Target | Vector | TTP |
|--------|-------|--------|--------|-----|
| T-C1 | Prop. 2025/26:267 (if enacted unchanged) | Children in migration system | Extended detention authority | TTP-C1: Detention-as-deterrence policy pattern |
| T-C2 | Prop. 2025/26:261 (if enacted without safeguards) | Population register data subjects | Disproportionate surveillance infrastructure | TTP-C2: Administrative surveillance expansion |

---

## Kill Chain Analysis

### Kill Chain — HD024192 (Constitutional Rights Path to ECHR Violation)

```
Stage 1: Reconnaissance (State interest in security framework)
   ↓
Stage 2: Weaponization (Proposition 2025/26:267 drafted — security threat framework)
   ↓
Stage 3: Delivery (Proposition tabled in Riksdagen → JuU committee)
   ↓
Stage 4: Exploitation (HD024192 MP motion filed — JuU deliberation triggers rights review)
   ↓
Stage 5: Installation (JuU votes; proposition passed with or without amendment)
   ↓
Stage 6: Command & Control (Enacted law applies to children in migration detention)
   ↓
Stage 7: Action on Objectives (Domestic court challenge / ECtHR application)
```

**MP's intervention at Stage 4** (filing motion, forcing rights-review into JuU deliberation) is the primary disruption point. If Lagrådet acts at Stage 3, it provides a second disruption point.

### Kill Chain — HD024191 (Administrative Surveillance Path)

```
Stage 1: Problem framing (Ghost addresses, benefit fraud, identity crime)
   ↓
Stage 2: Solution design (Prop. 2025/26:261 expanding Skatteverket powers)
   ↓
Stage 3: Delivery (Proposition to SkU)
   ↓
Stage 4: Exploitation (HD024191 filed — data protection objection raised)
   ↓
Stage 5: Installation (SkU votes; Skatteverket mandate expanded)
   ↓
Stage 6: Command & Control (Population register data used for expanded verification)
   ↓
Stage 7: Action on Objectives (Privacy erosion / disproportionate monitoring)
```

---

## Attack Tree — Children's Detention (HD024192)

```mermaid
graph TD
    ROOT[Children's detention\nenacted unchanged]
    A[Lagrådet silent] --> ROOT
    B[JuU majority approves\nwithout amendment] --> ROOT
    C[S+V support government] --> B
    D[C abstains or supports] --> B
    E[MP isolated] --> B
    ROOT --> F[Domestic challenge\n(Barnkonventionen)]
    ROOT --> G[ECtHR application]
    ROOT --> H[UN CRC review\ncriticism]
    style ROOT fill:#ff006e,stroke:#cc0000,color:#fff
    style F fill:#ffa500,stroke:#cc7700
    style G fill:#ffa500,stroke:#cc7700
    style H fill:#ffa500,stroke:#cc7700
```

---

## MITRE-Style TTP Mapping

| TTP ID | Name | Description | Mitigations |
|--------|------|-------------|-------------|
| TTP-A1 | Security-exception override | Majority uses security framing to override ECHR obligations | Lagrådet review; constitutional challenge post-enactment |
| TTP-A2 | Barnkonventionen nullification | Security exception de facto voids children's rights convention | Domestic court challenge; UN CRC reporting cycle |
| TTP-A3 | Administrative power creep | Incremental expansion of Skatteverket mandate | GDPR Art. 5 proportionality review; IMY oversight |
| TTP-B2 | Threat framing escalation | Security narrative conflates child welfare with security threat | Opposition counter-framing; media scrutiny |
| TTP-C1 | Detention-as-deterrence | Children detained to deter migration | ECtHR jurisprudence; individual legal challenges |
| TTP-C2 | Administrative surveillance expansion | Population register used for disproportionate monitoring | GDPR enforcement; proportionality requirement |

---

## Procedural Legitimacy Assessment

Both propositions appear to have adequate formal procedural legitimacy (government-backed, properly tabled, committee-routed). The **substantive legitimacy** question is:

- **HD024192**: Does the rights override for children meet ECHR/CRC proportionality? **Contested** — medium procedural risk.
- **HD024191**: Does Skatteverket expansion meet GDPR Art. 5 proportionality? **Unclear without seeing full proposition text** — low-medium procedural risk.

---

*Sources: HD024192 [A2], HD024191 [A2]; ECHR Art. 5/8 [A1]; GDPR Art. 5 [A1]; Barnkonventionen SFS 2018:1197 [A1]*
