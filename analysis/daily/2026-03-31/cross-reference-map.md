# Cross-Reference Map — 2026-03-31

**Generated**: 2026-03-31 14:34 UTC
**Data Sources**: riksdag-regering-mcp
**Documents Analyzed**: 6
**Confidence**: HIGH

---

## Summary

Key cross-document relationships identified. The migration reform package (Prop 229 + 215) shows strongest internal linkage. Justice reforms (Prop 222, 223) share ministerial origin. Security policy (UU6) is thematically independent.

---

## Cross-Reference Network

```mermaid
graph TD
    P229["HD03229<br/>Reception Act"] <-->|"Migration Package"| P215["HD03215<br/>Settlement Law"]
    P222["HD03222<br/>Crime Victim Rules"] <-->|"Justice Cluster"| P223["HD03223<br/>Consumer Credit"]
    P229 -->|"Ebba Busch<br/>(signatory)"| P222
    P229 -->|"Ebba Busch<br/>(signatory)"| P223
    P229 -->|"Ebba Busch<br/>(signatory)"| P215
    UU6["HD01UU6<br/>Security Policy"] -.->|"Thematic<br/>independence"| P229
    MJU18["HD01MJU18<br/>UTP Directive"] -.->|"EU regulatory"| P223
    style P229 fill:#dc3545,stroke:#333,color:#fff
    style P215 fill:#dc3545,stroke:#333,color:#fff
    style P222 fill:#ffc107,stroke:#333,color:#000
    style P223 fill:#28a745,stroke:#333,color:#fff
    style UU6 fill:#0d6efd,stroke:#333,color:#fff
    style MJU18 fill:#28a745,stroke:#333,color:#fff
```

---

## Relationship Details

| Source | Target | Relationship Type | Strength |
|--------|--------|-------------------|:--------:|
| HD03229 | HD03215 | Legislative package (migration reform) | 🔴 Strong |
| HD03222 | HD03223 | Shared ministry (Justitiedepartementet) | 🟡 Medium |
| HD03229 | HD03222 | Shared signatory (Ebba Busch) | 🟡 Medium |
| HD03229 | HD03223 | Shared signatory (Ebba Busch) | 🟡 Medium |
| HD01UU6 | All | Independent committee initiative | 🟢 Weak |

## Data Quality Notes

Cross-references based on document metadata linkages (shared signatories, ministry, policy domain). Full-text cross-referencing pending.
