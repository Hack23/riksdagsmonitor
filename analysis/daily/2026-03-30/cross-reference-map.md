# 🔗 Cross-Reference Map — 2026-03-30

## 📋 Cross-Reference Context

| Field | Value |
|-------|-------|
| **Map ID** | `XRF-2026-03-30-001` |
| **Assessment Date** | `2026-03-30 01:14 UTC` |
| **Produced By** | news-realtime-monitor |

---

## 🔗 Event Relationship Network

```mermaid
graph TD
    subgraph "🔗 Cross-Reference Network — 2026-03-30"
        MP["HD0I100<br/>MP leaves M"]
        KU1["HDC220260330ou1<br/>KU Carlson hearing"]
        KU2["HDC220260330ou2<br/>KU Northvolt hearing"]
        KU3["HDA3KU39<br/>KU committee meeting"]
        P227["HD03227<br/>Youth crime prop"]
        JU29["HD01JuU29<br/>Security protection"]
    end

    MP -->|"weakens govt before"| KU1
    KU1 -->|"same session as"| KU2
    KU2 -->|"governed by"| KU3
    JU29 -->|"security theme"| KU1
    P227 -->|"justice theme"| JU29

    style MP fill:#dc3545,color:#fff
    style KU1 fill:#fd7e14,color:#fff
    style KU2 fill:#fd7e14,color:#fff
    style KU3 fill:#ffc107,color:#000
    style P227 fill:#ffc107,color:#000
    style JU29 fill:#ffc107,color:#000
```

| Source Event | Related Event | Relationship | Strength |
|-------------|---------------|--------------|:--------:|
| HD0I100 (MP defection) | HDC220260330ou1 (KU hearing) | Temporal + coalition impact | HIGH |
| HDC220260330ou1 (Carlson) | HDC220260330ou2 (Holm) | Same KU session | HIGH |
| HD01JuU29 (Security) | HDC220260330ou1 (Lantmäteriet) | Security theme | MEDIUM |
| HD03227 (Youth crime) | HD03213 (Honour violence) | Justice reform package | MEDIUM |

---

**Document Control:**
- **Classification:** Public
