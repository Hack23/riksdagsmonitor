# Document Classification — 2026-04-08

| **Key** | **Value** |
|---------|-----------|
| **ID** | CLS-2026-04-08-CR01 |
| **Generated** | 2026-04-08 04:32 UTC |
| **Data Sources** | get_betankanden (20 reports) |
| **Documents Analyzed** | 20 |
| **Riksmöte** | 2025/26 |
| **Overall Confidence** | HIGH |
| **Produced By** | AI-enhanced analysis (news-journalist agent) |

## Summary

Classified 20 committee reports by policy domain, sensitivity level, and urgency. Reports span 12 committees and 8 policy domains. Defence and climate-related reports carry highest sensitivity.

## Classification Table

| dok_id | Committee | Policy Domain | Sensitivity | Urgency | Priority |
|--------|-----------|--------------|-------------|---------|----------|
| HD01FöU12 | FöU | Defence & Security | HIGH | HIGH | P1 |
| HD01MJU30 | MJU | Climate & Environment | HIGH | HIGH | P1 |
| HD01UU6 | UU | Foreign & Security Policy | HIGH | MEDIUM | P1 |
| HD01SoU37 | SoU | Health/EU Governance | MEDIUM | MEDIUM | P2 |
| HD01JuU15 | JuU | Justice & Corrections | MEDIUM | MEDIUM | P2 |
| HD01CU18 | CU | Housing Policy | MEDIUM | HIGH | P2 |
| HD01KU38 | KU | Parliamentary Governance | MEDIUM | LOW | P3 |
| HD01KU31 | KU | Cultural/Language Rights | MEDIUM | MEDIUM | P3 |
| HD01SoU16 | SoU | Healthcare | MEDIUM | MEDIUM | P3 |
| HD01SoU17 | SoU | Healthcare | MEDIUM | MEDIUM | P3 |
| HD01SoU19 | SoU | Social Services | MEDIUM | MEDIUM | P3 |
| HD01AU11 | AU | Equality | LOW | LOW | P3 |
| HD01AU12 | AU | Work Environment | LOW | LOW | P3 |
| HD01FöU11 | FöU | Maritime Emergency Response | MEDIUM | LOW | P3 |
| HD01JuU16 | JuU | Police Matters | MEDIUM | MEDIUM | P3 |
| HD01SfU18 | SfU | Social Insurance | LOW | LOW | P3 |
| HD01MJU18 | MJU | EU Trade/Agriculture | MEDIUM | MEDIUM | P3 |
| HD01CU17 | CU | Consumer Rights | LOW | LOW | P3 |
| HD01NU17 | NU | Energy Markets | MEDIUM | MEDIUM | P3 |
| HD01KrU10 | KrU | Cultural Policy/EU | LOW | LOW | P3 |

## Classification Distribution

```mermaid
pie title Sensitivity Distribution (20 Reports)
    "HIGH" : 3
    "MEDIUM" : 12
    "LOW" : 5
```

```mermaid
pie title Priority Distribution
    "P1 — Critical" : 3
    "P2 — Important" : 3
    "P3 — Standard" : 14
```

```mermaid
flowchart LR
    classDef p1 fill:#e74c3c,stroke:#c0392b,color:#fff
    classDef p2 fill:#f39c12,stroke:#e67e22,color:#fff
    classDef p3 fill:#3498db,stroke:#2980b9,color:#fff

    P1["P1 — Critical"]:::p1
    P2["P2 — Important"]:::p2
    P3["P3 — Standard"]:::p3

    P1 --> FoU12["FöU12<br/>Defence"]:::p1
    P1 --> MJU30["MJU30<br/>Climate"]:::p1
    P1 --> UU6["UU6<br/>Security Policy"]:::p1

    P2 --> SoU37["SoU37<br/>Health/EU"]:::p2
    P2 --> JuU15["JuU15<br/>Justice"]:::p2
    P2 --> CU18["CU18<br/>Housing"]:::p2

    P3 --> OTHER["14 additional reports<br/>across 9 committees"]:::p3
```

## Data Quality Notes

Classification confidence: **HIGH** for domain assignment (committee-based), **MEDIUM** for sensitivity assessment. [HIGH] confidence in committee mapping verified against Riksdag committee codes. Cross-referenced against 12 active committees in riksmöte 2025/26.
