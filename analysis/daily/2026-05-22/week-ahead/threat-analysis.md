---
title: "Threat Analysis — Week 22, 2026"
date: "2026-05-22"
artifact: "threat-analysis"
---

# Threat Analysis — Week 22, 2026

## Political Threat Taxonomy (PTT)

### Tier 1: Systemic Threats to Democratic Accountability

| Threat ID | Threat Name | Mechanism | Evidence | Severity |
|-----------|-------------|-----------|----------|----------|
| T1 | Biometric surveillance normalisation | JuU28 enables real-time AI facial recognition by police; once statutory foundation exists, scope creep is predictable | HD01JuU28 legislative text, EU AI Act Art. 5 exemptions allow law-enforcement real-time biometric use `[A2]` | **Critical** |
| T2 | Permanent precarity institutionalised | HD03262 eliminates permanent residence permits; replaces with time-limited permits → perpetual administrative dependency on state `[HD03262, A2]` | UNHCR previous statements on Nordic "race to the bottom" `[B3]` | **High** |
| T3 | Legislative speed defeating scrutiny | 16+ betänkanden in 3-day sprint; committee hearing compression; civil-society response time structurally impossible | Calendar analysis, number of betänkanden, riksdag recess timeline `[B2]` | **High** |

### Tier 2: Coalition Coherence Threats

| Threat ID | Threat Name | Mechanism | Evidence | Severity |
|-----------|-------------|-----------|----------|----------|
| T4 | L/C civil-liberties fracture | JuU28 forces L and C to choose between coalition loyalty and civil-liberties brand | JuU28 biometric provisions; L's historically strong data-rights position `[B2]` | **Medium-High** |
| T5 | SD boundary-testing | SD may use security measures as a floor to demand further hardening; government must signal enough to retain SD without alienating L/C | Migration cluster scope; SD manifesto commitments `[B3]` | **Medium** |
| T6 | Government accountability gap | PIR-WA-01 (OPEN): no impact assessments on discontinued aid — government ignoring accountability obligation `[pir-status.json 2026-05-15, B2]` | Aid cut documentation gap `[B2]` | **Medium** |

### Tier 3: Institutional Capacity Threats

| Threat ID | Threat Name | Mechanism | Evidence | Severity |
|-----------|-------------|-----------|----------|----------|
| T7 | Migrationsverket capacity collapse | New return-first mandates on an agency already handling 180,000+ case backlog `[C3]` | Statskontoret 2024 evaluation context `[C3]` | **Medium-High** |
| T8 | DIGG e-ID procurement failure | Large-scale IT project at an agency without established large-system delivery track record | DIGG history `[B3]` | **Medium** |
| T9 | Skatteverket dual mandate overload | Simultaneous HD03250 (e-ID) and HD03261 (folkbokföring) implementation requirements | Dual document cluster `[B2]` | **Medium** |

## Attack Tree Analysis

### Attack Tree 1: Delegitimising JuU28 (Opposition Strategy)

```
Root: Block or discredit JuU28 before election
├── Legal route
│   ├── ECHR Article 8 challenge (post-enactment)
│   ├── GDPR Art. 9 IMY referral (biometric = special category)
│   └── Constitutional Court referral (Lagrådet follow-up)
├── Parliamentary route
│   ├── L or C reservation → "coalition divided on surveillance"
│   ├── Interpellation to Justice Minister on ECHR compliance
│   └── S motion for repeal/amendment in autumn
└── Media/public route
    ├── NGO campaigns (Amnesty, Civil Rights Defenders)
    ├── Expert testimony in media (AI safety, biometrics)
    └── Personal story framing (misidentification risk, diaspora impact)
```

### Attack Tree 2: Undermining Migration Cluster (Opposition + Civil Society)

```
Root: Delay or delegitimise HD03262–HD03267
├── Lagrådet procedural challenge
│   ├── RF Chapter 2 proportionality finding
│   └── EU Pact inconsistency finding
├── ECHR future case (individual complainant)
│   └── Temporary permit cycle → indefinite precarity → Art. 8 breach
├── Political route
│   ├── S narrative: "government creates permanent underclass"
│   └── V + MP solidarity frame
└── Agency route
    └── Migrationsverket implementation failure → policy collapses in practice
```

## MITRE-Style TTP Mapping (Political Operations)

| TTP ID | Tactic | Technique | Actor | Target | Example |
|--------|--------|-----------|-------|--------|---------|
| PO-T1 | Narrative Injection | Frame as "surveillance state" | S, V, MP | Undecided voters | JuU28 biometric surveillance → election narrative |
| PO-T2 | Accountability Gap Exploitation | Highlight missing impact assessments | S | Media / Riksdag | PIR-WA-01: aid cuts no impact assessment |
| PO-T3 | Coalition Wedge | Amplify L/C reservation signals | S, V | L/C leadership | JuU28 → L civil-liberties voters |
| PO-T4 | Legislative Scrutiny Compression | Document speed of sprint | Civil society | International observers | 16 betänkanden / 3 days |
| PO-T5 | Institutional Failure Attribution | Blame Migrationsverket backlog on government | S | Civil service narrative | Return-mandate + existing backlog |
| PO-T6 | ECHR Litigation Seeding | Identify perfect plaintiffs for post-enactment cases | Human rights NGOs | European Court | HD03262 permanent permit elimination |

## Threat Assessment Summary

**Highest severity, highest likelihood threat**: T1 (biometric normalisation) × T4 (L/C fracture). The interaction of JuU28's surveillance architecture with coalition fragility creates a dual threat: the law passes, setting a structural precedent, while simultaneously generating an electoral fault line.

**Most tractable threat**: T3 (legislative speed). This can be partially mitigated by opposition using the 21-day remiss (referral) mechanism and civil-society amplification to create media pressure for slower passage. However, pre-recess timing makes this difficult.

**Wildcard threat**: If IMY (Swedish Data Protection Authority) opens a preliminary GDPR investigation into JuU28 before the election, this would activate both the Legal route of Attack Tree 1 and PO-T1, simultaneously slowing implementation and generating media coverage.
