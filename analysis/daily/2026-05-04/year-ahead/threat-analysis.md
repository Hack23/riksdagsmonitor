# Threat Analysis — Sweden Year Ahead 2026-05-04

**Framework**: Political Threat Taxonomy (PTT) v2.1 | **Classification**: PUBLIC

---

## Threat Landscape Overview

Sweden faces a compound threat environment during the pre-election period (May–September 2026): (1) an external security threat from Russian hybrid operations targeting the election; (2) an internal constitutional integrity risk from emergency power legislation (HC03155); (3) a social cohesion threat from concentrated gang violence despite legislative response.

## PTT Category Analysis

### Category 1 — State-Level External Threats

**T1.1 Russian hybrid influence operations [horizon:election]**
- Actor: GRU/SVR aligned information operations
- Target: Swedish election integrity — SD voter mobilisation messaging, anti-NATO narratives
- Method: Social media manipulation, leaked government documents, disinformation via proxies
- Likelihood: likely [horizon:election] (assessed HIGH by MUST/Säpo 2025)
- Impact: 2–5 percentage points swing in key constituencies
- Countermeasure: HC03197 (EU EMFA), Psykologisk försvarsoperationer under MSB HC03205

**T1.2 Critical infrastructure sabotage [horizon:year]**
- Actor: State-sponsored, potentially Russian GRU Unit 29155
- Target: Baltic undersea cables, power grid interconnects (Norden Ring)
- Likelihood: unlikely [horizon:year] (previous incidents 2023–2024 in Baltic Sea suggest capability)
- Impact: Catastrophic if successful; HD03155 triggers

### Category 2 — Internal Constitutional Threats

**T2.1 HC03155 emergency power misuse [horizon:year]**
- Actor: Government of Sweden (Tidö coalition)
- Mechanism: Emergency ordinance under new constitutional beredskap framework invoked without proportionate threat
- Risk: Opposition political activity restricted during election campaign window
- Likelihood: unlikely [horizon:year] — but the mere existence of mechanism raises OSCE concern
- Countermeasure: Constitutional Court review; international observation mission

**T2.2 Pre-election electoral law amendment [horizon:election]**
- Actor: SD or M parliamentary majority seeking advantage
- Mechanism: Threshold manipulation or ballot-access rules
- Risk: Reduces opposition representation
- Likelihood: very unlikely [horizon:election]

### Category 3 — Societal Cohesion Threats

**T3.1 Gang violence escalation [horizon:quarter]**
- Current state: Gang-related shootings declined 22% in 2025 vs 2024 (Polismyndigheten data); however, organised crime migration from major cities to smaller municipalities accelerating
- Legislative response: HC03186 (police firearms expanded authority), HC03208 (company secrets / organised crime financing)
- Residual risk: Lone-actor inspired attacks on political figures (lone-actor terrorism nexus with gang networks)
- Likelihood: likely [horizon:quarter] to see at least one high-profile municipality crisis

**T3.2 Social cohesion fracture — immigration backlash [horizon:year]**
- Trigger: If election campaign produces extreme anti-immigration rhetoric from SD beyond current level
- Mechanism: Targeting of asylum-seeker centres, civil society organisations
- Countermeasure: HC03189 (virginity check criminalisation signals values commitment)

## Attack Tree — Election Integrity

```
Election integrity compromised
├── External influence operations (T1.1)
│   ├── Voter suppression targeting specific demographics
│   └── Disinformation about party positions / vote-counting
├── Internal administrative failure
│   ├── Electoral register errors (database vulnerability)
│   └── Postal vote manipulation (low risk in SE context)
└── Physical disruption
    ├── Attack on polling station (T3.1 nexus)
    └── Attack on candidate/campaign event
```

## DISARM Framework Alignment

| DISARM TTP | Observed Vector | Countermeasure |
|---|---|---|
| T0003 — Leverage existing narratives | Anti-immigration sentiment amplification | MSB Psykologisk försvar monitoring |
| T0008 — Conduct false flag action | Fake police document leak | Säpo counterintelligence |
| T0057 — Acquire/rent PII | Voter targeting micro-profiling | GDPR enforcement by IMY |
| T0049 — Flooding | Pro-SD social media saturation | EU DSA platform obligations |
