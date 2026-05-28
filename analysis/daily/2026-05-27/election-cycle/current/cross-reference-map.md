---
artifact_family: B
artifact_type: cross-reference-map
article_date: 2026-05-27
subfolder: election-cycle/current
classification: PUBLIC
workflow: news-election-cycle
horizon: cycle
---

# Cross-Reference Map — Election Cycle 2022-2026

## Document Relationship Network

This map traces the legislative relationships between the May 2026 wave of bills and the broader Tidö mandate framework.

### Migration Cluster (SD-driven policy axis)

```mermaid
graph TD
    style Tidoavtalet fill:#1a1e3d,color:#00d9ff
    style HD03262 fill:#2d1b4e,color:#ff006e
    style HD03263 fill:#2d1b4e,color:#ff006e
    style HD03264 fill:#2d1b4e,color:#ff006e
    style HD03265 fill:#2d1b4e,color:#ff006e
    style HD03267 fill:#2d1b4e,color:#ff006e
    style EUPact fill:#1a3d1e,color:#00ff88

    Tidoavtalet["Tidöavtalet<br>2022-2026<br>Migration Chapter"] --> HD03262
    Tidoavtalet --> HD03263
    Tidoavtalet --> HD03264
    Tidoavtalet --> HD03265
    HD03267["HD03267<br>Qualified security threats<br>(2026-05-07)"] --> HD03262
    EUPact["EU Migration<br>and Asylum Pact<br>2026 Implementation"] --> HD03262
    HD03262["HD03262<br>Abolish permanent<br>residence permits"] --> HD03263
    HD03263["HD03263<br>Stärkt återvändande"] --> HD03264
    HD03264["HD03264<br>Skärpta krav på vandel"] --> HD03265
    HD03265["HD03265<br>Skärpta regler<br>om uppsikt och förvar"]
```

### Security-Defence Cluster (NATO axis)

```mermaid
graph LR
    style NATOAccess fill:#1a1e3d,color:#00d9ff
    style HD03254 fill:#1e3d1a,color:#00ff88
    style HD01FöU15 fill:#1e3d1a,color:#00ff88

    NATOAccess["NATO Accession<br>March 2024"] --> HD03254
    NATOAccess --> HD01FöU15
    HD03254["HD03254<br>Operativt militärt samarbete<br>(2026-04-30)"]
    HD01FöU15["HD01FöU15<br>Nationellt cybersäkerhetscenter<br>(2026 betänkande)"]
```

### Social Policy Cluster (values axis)

```mermaid
graph TD
    style HD03271 fill:#4d1a1a,color:#ff006e
    style SfU fill:#2d2d1a,color:#ffbe0b

    HD03271["HD03271<br>En förändrad abortlag<br>(2026-05-26, signed Ebba Busch)"]
    HD01SfU25["HD01SfU25<br>Pensionsöverskott<br>utdelning"]
    HD01JuU38["HD01JuU38<br>Stärkt samhällsskydd<br>vid återfall i brott"]
    SfU["SfU<br>Social Affairs<br>Committee"] --> HD01SfU25
    JuU["JuU<br>Justice Committee"] --> HD01JuU38
```

## Cross-Document Policy Dependencies

| Source Document | Depends On | Relationship |
|----------------|-----------|--------------|
| HD03262 | EU Migration Pact | EU treaty obligation; must align with Regulation 2024/1351 |
| HD03262 | HD03267 | Security grounds for non-permanent status |
| HD03263 | HD03265 | Detention rules must align with enhanced oversight |
| HD03254 | NATO SOFA | Host Nation Support Agreement (Sweden-NATO) |
| HD01FöU15 | NIS2 Directive | EU cybersecurity framework transposition |
| HD03271 | HD01SfU34 (Riksrevision) | Government uses audit findings to shape social policy |

## Temporal Sequence (2025/26 riksmöte key moments)

| Date | Milestone | dok_id(s) |
|------|-----------|-----------|
| 2026-04-28 | Kristersson signs last propositions | HD03247, HD03257 |
| 2026-04-30 | Edholm signs 8 propositions | HD03251, HD03254, HD03258, HD03260, HD03262-HD03265 |
| 2026-05-07 | Security/digital cluster | HD03250, HD03261, HD03267 |
| 2026-05-26 | Busch signs abortion bill | HD03271 |
| 2026-06-est | SfU committee report on HD03271 | pending |
| 2026-09-13 | Election day | — |

## Artifact Cross-References

- Risk dependencies: See [`risk-assessment.md`](risk-assessment.md) R1, R3
- Electoral significance: See [`significance-scoring.md`](significance-scoring.md) Tier 1 items
- Stakeholder reactions: See [`stakeholder-perspectives.md`](stakeholder-perspectives.md) per-party positions
- Scenario branches: See [`scenario-analysis.md`](scenario-analysis.md) Scenario A-C

[A1] *IMF WEO Apr-2026 [horizon:cycle] T+0; vintage age 1 month, fresh.*
