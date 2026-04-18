# 🔗 Cross-Reference Map — Committee Reports

## 📋 Cross-Reference Context

| Field | Value |
|-------|-------|
| **Map ID** | XRF-2026-04-02-CR01 |
| **Map Date** | 2026-04-03 04:54 UTC |
| **Documents Mapped** | 2 |
| **Produced By** | news-committee-reports |

---

## 📊 Cross-References

### HD01FöU12 ↔ Related Documents

| Reference | Relationship | Significance |
|-----------|-------------|:------------:|
| Prop. 2025/26:142 | Parent proposition | HIGH |
| Prop. 2025/26:214 (Cybersecurity Center) | Defence modernization cluster | MEDIUM |
| Prop. 2025/26:228 (Arms Export Rules) | Defence policy package | MEDIUM |

### HD01JuU15 ↔ Related Documents

| Reference | Relationship | Significance |
|-----------|-------------|:------------:|
| Prop. 2025/26:235 (Deportation Rules) | JuU criminal justice cluster | MEDIUM |
| Trygghetsberedningen (pending SOU) | Referenced in Reservation 1 | HIGH |

---

## 🔀 Thematic Clusters

```mermaid
graph TD
    subgraph "Defence Modernization"
        F12["FöU12<br/>Civilian Protection"]
        P142["Prop. 142<br/>Shelter Law"]
        P214["Prop. 214<br/>Cybersecurity"]
        P228["Prop. 228<br/>Arms Export"]
    end

    subgraph "Criminal Justice"
        J15["JuU15<br/>Corrections"]
        P235["Prop. 235<br/>Deportation"]
        TB["Trygghetsberedningen<br/>(pending SOU)"]
    end

    P142 --> F12
    F12 -.-> P214
    F12 -.-> P228
    J15 -.-> P235
    TB -.-> J15

    style F12 fill:#ff006e,color:#FFFFFF
    style J15 fill:#00d9ff,color:#0a0e27
    style P142 fill:#ffbe0b,color:#0a0e27
```

---

**Document Control:** Cross-reference map generated 2026-04-03 04:54 UTC. Classification: PUBLIC.
