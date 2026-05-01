# Threat Analysis — Realtime Pulse 2026-05-01

**Author**: James Pether Sörling | **Framework**: Political Threat Taxonomy + Attack Trees

## Threat Register (Political Threat Taxonomy)

### T1: Constitutional/Institutional Threats

**T1.1 — Lagrådet ECHR Block** (HD03265, riksdagen.se)
- **Mechanism**: Lagrådet issues negative advisory opinion citing Art 5 ECHR (right to liberty); government must either revise bill or proceed and accept political cost of "overriding Lagrådet"
- **Likelihood**: 65% (HD03265), 55% (HD03262)
- **Impact**: Campaign-grade disruption; signals authoritarian governance to European partners
- **Red Indicators**: Lagrådet hearing schedule published before May 15; constitutional experts publicly cite Art 5 violations

**T1.2 — Riksdag Constitutional Committee Challenge** (HD03262, riksdagen.se)
- **Mechanism**: Opposition requests KU (Konstitutionsutskottet) granskning of permanent residence abolition — legal basis under TF/RF
- **Likelihood**: 70% (opposition files KU review)
- **Impact**: Media cycle dominance; delays Riksdag schedule

### T2: Coalition/Political Threats

**T2.1 — SD Transparency Defection** (HD03258, riksdagen.se)
- **Mechanism**: Political transparency bill includes SD financing exposure. SD threatens to vote against in committee unless language narrowed.
- **Likelihood**: 25%
- **Impact**: Minority government defeat in committee; government credibility loss

**T2.2 — C (Center Party) Migration Opposition**
- **Mechanism**: C has historically supported managed migration over restrictive approaches. If HD03262 (abolish permanent residence) is deemed too extreme, C could abstain or vote against.
- **Likelihood**: 20% (abstention), 5% (vote against)
- **Impact**: Bill passes anyway (M-SD-KD-L majority), but headline "split coalition" narrative emerges

### T3: Accountability/Criminal Justice Threats

**T3.1 — Strömmer Eradication Pledge Accountability** (HD10458, riksdagen.se)
- **Mechanism**: Criminal Justice Minister Gunnar Strömmer pledged "eradication" of criminal gangs within parliamentary term. ESO report (HD10451) establishes 352 GSEK baseline. Interpellation creates formal parliamentary accountability record.
- **Likelihood of escalating to resignation pressure**: 30% (requires a high-profile incident before election)
- **Impact**: Strömmer replacement disrupts ministerial continuity; S gains crime credibility

**T3.2 — Criminal Economy Growth During Campaign** (HD10451, riksdagen.se)
- **Mechanism**: If police crime statistics published June-August 2026 show growth in organised crime revenue indicators, baseline becomes anchor for S attack
- **Likelihood**: 40%
- **Impact**: Central electoral vulnerability for government

### T4: Economic Threats

**T4.1 — IMF Downgrade Below 1.2%** (HC01FiU20, riksdagen.se)
- **Mechanism**: If IMF WEO October 2026 update or interim publication shows SWE GDP growth revised below 1.2%, government faces economic failure narrative on two fronts (migration cost + economic stagnation)
- **Likelihood**: 25% (based on global tariff uncertainty from DOTS/IFS data)
- **Impact**: S core electoral attack becomes dominant

## Attack Trees

### Attack Tree 1: Destabilising Migration Package

```
Goal: Prevent migration mega-package passage before election
├── Legal route: Lagrådet negative + KU granskning [P=65%×70%=46%]
│   ├── Art 5 ECHR detention challenge [HD03265]
│   └── Permanent residence abolition legality [HD03262]
├── Political route: C defection on one bill [P=20%]
│   └── Coalition split narrative even with passage
└── Administrative route: Migrationsverket capacity failure signal [P=50%]
    └── "Already overwhelmed" narrative pre-launch
```

### Attack Tree 2: Criminal Economy Accountability

```
Goal: Turn criminal economy into government-fatal issue
├── ESO baseline: 352 GSEK confirmed [HD10451] [ACHIEVED]
├── Pledgewatch: Strömmer "eradication" interpellated [HD10458] [ACHIEVED]
└── Trigger: High-profile gang violence June-August [P=35%]
    └── → "Strömmer must resign" campaign [S, V, MP coordinated]
```

## Priority Intelligence Requirements (PIRs) — Updated

**PIR-RT-001**: When will Lagrådet publish yttranden on HD03262 and HD03265?
- **Rationale**: Gates entire migration timeline; controls campaign timing
- **Status**: OPEN
- **Expected**: May-June 2026

**PIR-RT-002**: Will Riksdag schedule committee hearings on HD03258 before summer recess?
- **Rationale**: Determines SD intra-coalition friction timeline
- **Status**: OPEN

**PIR-RT-003**: What are latest Demoskop/Novus polling trends post-migration announcement?
- **Rationale**: Measures electoral impact of mega-package announcement
- **Status**: OPEN

**PIR-RT-004**: IMF IFS monthly SWE unemployment/inflation update
- **Rationale**: Confirms or undermines economic risk threat chain
- **Status**: OPEN
