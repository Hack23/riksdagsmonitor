# 🔗 Cross-Reference Map

## 📋 Reference Context

| Field | Value |
|-------|-------|
| **Map ID** | `XREF-2026-03-31-001` |
| **Analysis Date** | 2026-03-31 12:06 UTC |
| **Documents Mapped** | 6 |
| **Cross-References Found** | 8 |

---

## 📊 Document Relationship Network

```mermaid
graph TD
    subgraph "Migration Reform Package"
        HD03229["HD03229<br/>New Reception Law"]
        HD03215["HD03215<br/>Settlement Law"]
    end

    subgraph "Justice Reform Package"
        HD03222["HD03222<br/>Crime Victim Comp."]
        HD03223["HD03223<br/>Consumer Credit"]
    end

    subgraph "Security & Environment"
        HD01JuU29["HD01JuU29<br/>Security Protection"]
        HD01MJU30["HD01MJU30<br/>Climate Goals"]
    end

    HD03229 <-->|"Companion legislation"| HD03215
    HD03222 <-->|"Same minister, same dept"| HD03223
    HD03229 -->|"Municipal implementation"| HD01CU18["HD01CU18<br/>Housing Policy"]
    HD01JuU29 -->|"Security framework"| HD03229

    style HD03229 fill:#dc3545,stroke:#333,color:#fff
    style HD03215 fill:#dc3545,stroke:#333,color:#fff
    style HD03222 fill:#ffc107,stroke:#333,color:#000
    style HD03223 fill:#ffc107,stroke:#333,color:#000
    style HD01JuU29 fill:#fd7e14,stroke:#333,color:#000
    style HD01MJU30 fill:#28a745,stroke:#333,color:#fff
    style HD01CU18 fill:#6c757d,stroke:#333,color:#fff
```

## 📋 Cross-Reference Table

| Source | Target | Relationship | Strength |
|--------|--------|-------------|:--------:|
| HD03229 | HD03215 | Companion migration legislation | STRONG |
| HD03222 | HD03223 | Same minister (Strömmer), same department | MEDIUM |
| HD03229 | HD01CU18 | Housing policy context for settlement | MEDIUM |
| HD03215 | HD01CU18 | Municipal housing obligations | MEDIUM |
| HD01JuU29 | HD03229 | Security framework for migration infrastructure | WEAK |
| HD03222 | HD03227 | Criminal justice reform package | MEDIUM |
| HD01MJU30 | HD03229 | Opposition strategy — climate vs migration debate | WEAK |
| HD03229 | HD03215 | Tidö Agreement implementation cluster | STRONG |
