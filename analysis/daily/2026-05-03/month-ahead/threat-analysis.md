# Threat Analysis — Month Ahead 2026-05-03

**Framework**: Political Threat Taxonomy + Attack Tree + MITRE TTP analogue  
**Horizon**: June 2026 (immediate) + September 13, 2026 election

## Political Threat Taxonomy

### Category A: Legislative Threats (Government Proposals at Risk)

| Threat | dok_id | Mechanism | Likelihood | Impact |
|--------|--------|-----------|------------|--------|
| A1 ECHR-invalidation route | HD03262 | ECHR Art.8 Lagrådet yttrande → forced amendment → narrative collapse | MEDIUM | CRITICAL |
| A2 L defection | HD03262–HD03265 | L votes against → 175/349 majority lost → government minority crisis | LOW | CRITICAL |
| A3 EU infringement | HD03262 | Commission finds transposition incompatible with EU Asylum Directive | LOW-MEDIUM | HIGH |
| A4 Migrationsverket capacity | HD03263 | Agency unable to deliver → SD demands escalation → coalition tension | HIGH | HIGH |

### Category B: Opposition Offensive Threats

| Threat | dok_id | Mechanism | Likelihood | Impact |
|--------|--------|-----------|------------|--------|
| B1 S social vulnerability narrative | HD11775, HD11776, HD11778 | Media amplification of "government neglects poor" → polling shift | MEDIUM | MEDIUM |
| B2 Transparency counter-narrative | HD03258 | Civil society framing HD03258 as "silencing dissent" → European media | MEDIUM-HIGH | MEDIUM |
| B3 Ukraine aid SD fault-line | HD11772 | Opposition highlights SD ambivalence on Ukraine → NATO allies concern | MEDIUM | HIGH |
| B4 S healthcare blocking | HD03251 | S/V use committee stage to fundamentally amend KD reform | MEDIUM | MEDIUM |

### Category C: External / Systemic Threats

| Threat | Source | Mechanism | Likelihood | Impact |
|--------|--------|-----------|------------|--------|
| C1 Economic deterioration | SCB AKU / Riksbank | GDP growth < 1.5% + unemployment rise → S economic messaging gains | MEDIUM | HIGH |
| C2 Regional care implementation failure | HD03251 | Regions cite capacity/funding gaps → reform delayed post-election | MEDIUM | MEDIUM |
| C3 International human rights pressure | HD03262–65 | UNHCR/Council of Europe commentary → mobilizes diaspora and civil society | HIGH | MEDIUM |

## Attack Tree Analysis

```
TARGET: Overthrow Tidö Coalition before September 2026 election
├── Branch A: Destroy legislative majority
│   ├── A1: L defects on migration vote [2/5]
│   ├── A2: KD rebels on transparency (HD03258) [1/5]
│   └── A3: SD rebels on Ukraine aid (HD11772) [2/5]
├── Branch B: Delegitimize through legal failure
│   ├── B1: Lagrådet adverse yttrande on HD03262 [3/5]
│   ├── B2: Court of Justice EU finds HD03262 incompatible [2/5]
│   └── B3: Riksrevisionen critical audit of Migrationsverket [3/5]
├── Branch C: Electoral erosion
│   ├── C1: S social narrative erodes M/KD centrist voters [3/5]
│   ├── C2: Transparency framing alienates educated urban voters [3/5]
│   └── C3: Economic deterioration activates S electoral base [2/5]
└── Branch D: Coalition internal fracture
    ├── D1: L–SD conflict on migration floor escalates [2/5]
    ├── D2: M–SD Ukraine divergence becomes public rupture [2/5]
    └── D3: KD–M disagreement on healthcare regionalization [1/5]
```

## MITRE TTP Analogue (Political Tactics)

| TTP Code (Political Analogue) | Tactic | Technique | Observable Indicators |
|-------------------------------|--------|-----------|----------------------|
| P-T1591 | Reconnaissance | Opposition research on HD03262 ECHR gaps | Legal expert opinion pieces in Dagens Juridik, DN |
| P-T1560 | Credential manipulation | Framing HD03258 as anti-civil-society | ECFR/Freedom House press releases |
| P-T1489 | Service disruption | Blocking HD03251 in Social committee | Committee minority reservations filed |
| P-T1070 | Indicator removal | SD's HD11772 signals hidden Ukraine policy shift | Åkesson statements on Swedish Radio |
| P-T1598 | Legislative delay | Procedural delay of HD03262 Riksdag reading | Talmanskonferens scheduling decisions |

## Key Intelligence Questions (KIQs)

1. **KIQ-1**: Will Lagrådet deliver an adverse yttrande on HD03262? Timeline: before Riksdag second reading (est. June 2026). Watch: Lagrådet docket, Ministry legal submissions.
2. **KIQ-2**: How will L (Liberalerna) votes on HD03262 break? Watch: Johan Pehrson statements, L internal party communications, L voting record on ECHR motions.
3. **KIQ-3**: Will EU Commission engage informally with Sweden on asylum pact transposition before ratification? Watch: Brussels procedural communications.
4. **KIQ-4**: How will polling shift for S after social-welfare motions media cycle? Watch: Sifo/Novus polling June 2026.
