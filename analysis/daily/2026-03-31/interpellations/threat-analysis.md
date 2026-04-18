# Threat Analysis — 2026-03-31

**Generated**: 2026-03-31 07:42 UTC
**Documents Analyzed**: 2 (HD10424, HD10425)
**Riksmöte**: 2025/26
**Confidence**: HIGH

---

## Threat Summary

```mermaid
graph TD
    subgraph "🎭 Political Threat Taxonomy — 2026-03-31"
        IE["🔴 institutional-erosion<br/>Severity: HIGH<br/>Trafikverket vs government priorities"]
        SI["🟡 societal-impact<br/>Severity: MEDIUM<br/>Regional connectivity loss"]
        ED["🟡 economic-disruption<br/>Severity: MEDIUM<br/>Rural economic impact"]
        DD["🟡 democratic-deficit<br/>Severity: MEDIUM<br/>Unfunded mandates to municipalities"]
    end

    subgraph "📄 Source Documents"
        HD24["HD10424<br/>Regional airline closure"]
        HD25["HD10425<br/>Defence infrastructure costs"]
    end

    HD24 --> IE
    HD24 --> SI
    HD24 --> ED
    HD25 --> IE
    HD25 --> DD
    HD25 --> ED

    style IE fill:#D32F2F,color:#FFFFFF
    style SI fill:#FFC107,color:#000000
    style ED fill:#FFC107,color:#000000
    style DD fill:#FFC107,color:#000000
```

| Threat Category | Severity | Evidence | Affected Function |
|----------------|:--------:|----------|-------------------|
| institutional-erosion | 🔴 HIGH | Trafikverket simultaneously (a) recommends airline route closure against "hela Sverige" policy, (b) threatens municipal plan appeal for defence base infrastructure — systematic agency–government misalignment | Legislative & Executive Integrity |
| societal-impact | 🟡 MEDIUM | Torsby/Hagfors populations (and Munkfors, Sunne, Forshaga, SW Dalarna) face loss of air connectivity affecting commuters, healthcare access (ambulance flights), emergency services | Power Balance |
| economic-disruption | 🟡 MEDIUM | Regional economic impact from route closures (HD10424) and infrastructure cost uncertainty for defence host communities (HD10425) | Democratic Process |
| democratic-deficit | 🟡 MEDIUM | Municipalities bear costs of national policy decisions without consent or adequate funding framework — "unfunded mandates" | Democratic Process |

---

## Data Quality Notes

- **Threat categories**: Mapped to canonical ThreatCategory slugs per political-threat-framework.md
- **Only applicable categories included** — polarization and regulatory-overreach not relevant to these documents
