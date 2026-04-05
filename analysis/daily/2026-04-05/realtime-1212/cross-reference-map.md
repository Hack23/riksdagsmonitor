# 🔗 Cross-Reference Map — 2026-04-05

## 📋 Cross-Reference Context

| Field | Value |
|-------|-------|
| **Map ID** | XREF-2026-04-05-001 |
| **Analysis Date** | 2026-04-05 12:15 UTC |
| **Documents Mapped** | 5 |
| **Produced By** | news-realtime-monitor |

---

## 📊 Cross-Reference Network

```mermaid
graph TD
    subgraph "🔗 Legislative Cross-Reference Network — April 2026"
        HD235["📋 HD03235<br/>Deportation Rules<br/>Justitiedepartementet"]
        HD228["📋 HD03228<br/>Arms Export<br/>Utrikesdepartementet"]
        HD214["📋 HD03214<br/>Cybersecurity Center<br/>Försvarsdepartementet"]
        FOU12["📋 FöU12<br/>Civilian Protection<br/>Defense Committee"]
        JUU15["📋 JuU15<br/>Criminal Justice<br/>Justice Committee"]
    end

    HD235 -->|"enforcement capacity"| JUU15
    HD214 -->|"defense coordination"| FOU12
    HD228 -->|"defense industry"| FOU12
    HD235 -->|"criminal justice pipeline"| JUU15
    HD214 -->|"national security"| HD228

    style HD235 fill:#dc3545,color:#fff
    style HD228 fill:#28a745,color:#fff
    style HD214 fill:#0d6efd,color:#fff
    style FOU12 fill:#fd7e14,color:#fff
    style JUU15 fill:#ffc107,color:#000
```

---

## 📋 Cross-Reference Pairs

| Source | Target | Relationship | Strength |
|--------|--------|-------------|:--------:|
| HD03235 (Deportation) | HD01JuU15 (Criminal Justice) | Deportation requires prison/enforcement capacity addressed in JuU15 | Strong |
| HD03214 (Cybersecurity) | HD01FöU12 (Civilian Protection) | Cyber defense component of total defense in FöU12 | Strong |
| HD03228 (Arms Export) | HD01FöU12 (Civilian Protection) | Defense industrial base supports civil defense equipment | Medium |
| HD03214 (Cybersecurity) | HD03228 (Arms Export) | Both reflect NATO membership integration requirements | Medium |
| HD03235 (Deportation) | HD03228 (Arms Export) | Both represent Tidö Agreement security agenda delivery | Weak |

**Key Finding:** The 5 documents form a coherent legislative cluster centered on security and criminal justice — the government's twin-track strategy for pre-election policy delivery.

---

**Document Control:** Template: cross-reference-map.md v2.1 | Classification: Public
