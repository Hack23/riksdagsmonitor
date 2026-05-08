# Cross-Reference Map — Government Propositions 2026-05-08

**Date**: 2026-05-08  
**Purpose**: Map inter-document linkages, legal dependencies, and thematic coherence  

---

## Document Linkage Map

```
HD03267 (Security Expulsion)
    │
    ├── Legal basis: lag (2022:700) om särskild kontroll av vissa utlänningar
    │       └── Amends: §§ [detention period, evidentiary standard, penalties]
    │
    ├── Dependencies: HD03261 (Skatteverket) — population register integrity
    │       └── Clean data → reliable identity for security proceedings
    │
    ├── Enables: HD03250 (State e-ID) — verified digital identity
    │       └── State identity layer underpins security threat identification
    │
    └── EU frameworks: EU Returns Directive 2008/115/EC, ECHR Art. 5

HD03250 (State e-ID)
    │
    ├── Legal basis: new lag (2025/26:250) — original legislation
    │
    ├── EU mandate: EUDIW Regulation 2024/1183 — compliance deadline Q3 2026
    │
    ├── Enables: HD03261 (Skatteverket) — verified identity in folkbokföring
    │       └── State e-ID reduces fraudulent registration attempts
    │
    ├── Enables: HD03267 (Security) — reliable identity for expulsion proceedings
    │       └── State-verified identity reduces misidentification risk
    │
    └── Agency: DIGG (Myndigheten för digital förvaltning) — primary implementer

HD03261 (Skatteverket Powers)
    │
    ├── Legal basis: amendments to folkbokföringslag + Skatteverket mandate law
    │
    ├── Feeds: HD03267 — population register quality underpins security identification
    │       └── Reduces "ghost address" problem for security proceedings
    │
    ├── Feeds: HD03250 — population register is identity substrate for state e-ID
    │       └── Clean register enables reliable e-ID issuance
    │
    └── GDPR: Art. 6(1)(e) (public task), Art. 9 (special categories), Art. 5(1)(c) (data minimisation)
```

---

## Thematic Clusters

### Cluster 1: Identity Infrastructure (HD03250 + HD03261)
Both bills strengthen Sweden's digital identity substrate:
- HD03250: Creates the digital expression of identity (state e-ID)
- HD03261: Strengthens the physical/civil expression of identity (population register)
- Together: Sweden moves from fragmented, private-sector-dominated identity architecture toward a unified state-controlled identity layer

### Cluster 2: Security State Capability (HD03267 + HD03261)
Both bills expand state power over individuals in the security domain:
- HD03267: Security threat foreigners — expanded detention and expulsion
- HD03261: Extended Skatteverket investigation powers (overlap: tracking individuals)
- Together: Swedish state gains more coercive and investigative capacity over resident populations

### Cluster 3: EU Compliance Architecture (HD03250 + HD03267)
Both bills must be compatible with EU law:
- HD03250: Must conform to EUDIW Regulation 2024/1183
- HD03267: Must conform to EU Returns Directive and ECHR
- Together: Sweden's EU compliance record is contingent on both — one violation affects the other's perceived credibility

---

## Legal Dependency Map

| Law | Depends on / Amends | New Law Created |
|-----|--------------------|----|
| HD03267 | Amends lag (2022:700); references utlänningslagen (2005:716) | No |
| HD03250 | Creates new lag om statlig e-legitimation | Yes — original |
| HD03261 | Amends folkbokföringslag (1991:481) + Skatteverketsinstruktion | No |

---

## Timeline Cross-Reference

| Event | HD03267 | HD03250 | HD03261 |
|-------|---------|---------|---------|
| Submission to Riksdag | 2026-05-07 | 2026-05-07 | 2026-05-07 |
| Committee (planned) | JuU | TU | SkU |
| Plenary vote (est.) | Late May / June 2026 | Late May / June 2026 | Late May / June 2026 |
| Entry into force | 1 March 2027 | TBD (est. 2027) | TBD (est. 2026-07 or 2027) |
| Election (context) | 2026-09-13 | 2026-09-13 | 2026-09-13 |

All three bills are submitted simultaneously and will proceed through committee in parallel — suggesting coordinated rollout. Entry into force varies, with HD03267 explicitly stating 1 March 2027 (post-election, regardless of outcome).

---

## Economic Data Cross-Reference

**Note**: IMF economic data unavailable on analysis date (API degraded). Swedish economic context from prior vintage:
- Sweden GDP growth 2025: estimated ~2.0-2.5% (WEO April 2026, unconfirmed due to API failure)
- Public sector investment in digital infrastructure: Tidö budget 2025/26 includes allocations for digital government capacity (specific amounts not confirmed)
- Skatteverket operating budget 2026: not confirmed; expanded mandate will require supplementary appropriation

**Provenance**: D6 (reliability unknown for economic data due to API unavailability)

---

## Cross-Reference to Prior Sessions

These propositions relate to a larger Tidö migration/security legislative sprint that included earlier propositions (contextual):
- Prop. 2025/26:262: Utmönstring av permanent uppehållstillstånd (earlier session)
- Prop. 2025/26:263: Stärkt återvändandeverksamhet
- Prop. 2025/26:264: Skärpta och tydligare krav på vandel
- Prop. 2025/26:265: Skärpta regler om uppsikt och förvar
- Prop. 2025/26:254: Förbättrade förutsättningar för operativt militärt samarbete

HD03267 is the **latest hardening measure** in an ongoing security-migration legislative sequence. Together, the 2025/26 riksmöte represents an unprecedented tightening of Swedish security-migration law.
