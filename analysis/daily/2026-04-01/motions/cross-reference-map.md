# Cross-Reference Map — 2026-04-01

**Generated**: 2026-04-02 06:30 UTC
**Map ID**: XRF-2026-04-01-MOT
**Data Sources**: riksdag-regering-mcp (get_motioner rm=2025/26)
**Documents Analyzed**: 50
**Confidence**: HIGH

---

## 🔗 Cross-Document Reference Network

```mermaid
graph TD
    subgraph Welfare["🏥 Welfare Reform Cluster"]
        P201["prop. 2025/26:201<br/>Försörjningsstöd reform"]
        P207["prop. 2025/26:207<br/>Aktivitetskrav"]
        P210["prop. 2025/26:210<br/>Bidragsspärr"]
        M17["HD024017 (S)"]
        M16["HD024016 (S)"]
        M28["HD024028 (V)"]
        M27["HD024027 (V)"]
        M32["HD024032 (C)"]
        M46["HD024046 (C)"]
        M51["HD024051 (MP)"]
    end
    subgraph Education["🎓 Education Reform Cluster"]
        P195["prop. 195 Stöd"]
        P193["prop. 193 Studiero"]
        P197["prop. 197 Betyg"]
        P194["prop. 194 Läroplaner"]
        MS19["HD024019 (S)"]
        MS18["HD024018 (S)"]
        MS25["HD024025 (S)"]
        MC44["HD024044 (C)"]
        MMP58["HD024058 (MP)"]
    end
    P201 --> M17
    P201 --> M28
    P201 --> M46
    P201 --> M51
    P207 --> M16
    P207 --> M27
    P207 --> M32
    P195 --> MS19
    P193 --> MS18
    P197 --> MS25
    P197 --> MC44
    P197 --> MMP58
    M17 -.->|same policy| M16
    M28 -.->|same target| M46
    style P201 fill:#dc3545,color:#fff
    style P207 fill:#fd7e14,color:#fff
    style P210 fill:#fd7e14,color:#fff
    style P197 fill:#ffc107,color:#000
```

## Reference Clusters

### Cluster 1: Welfare Reform (prop. 201 + 207 + 210)
| Motion | Party | Target Proposition | Relationship |
|--------|-------|-------------------|-------------|
| HD024017 | S | prop. 201 | Rejects benefit cap calculation |
| HD024016 | S | prop. 207 | Demands organized crime exclusion |
| HD024028 | V | prop. 201 | Full rejection — "devastating deterioration" |
| HD024027 | V | prop. 207 | Full rejection |
| HD024032 | C | prop. 207 | Demands monitoring provisions |
| HD024046 | C | prop. 201 | Demands impact assessment |
| HD024051 | MP | prop. 201 | Environmental/social justice opposition |
| HD024031 | V | prop. 210 | Opposes benefit lock sanctions |
| HD024052 | MP | prop. 210 | Opposes sanction fees |
| HD024045 | C | prop. 190 | National investigation function for prevention |

### Cluster 2: Education Package (props. 191–198)
| Motion | Party | Target Proposition | Relationship |
|--------|-------|-------------------|-------------|
| HD024019 | S | prop. 195 (school support) | Demands resource guarantees |
| HD024018 | S | prop. 193 (studiero) | Resources must accompany discipline |
| HD024025 | S | prop. 197 (grading) | Transition protections for students |
| HD024024 | S | prop. 191 (transparency) | Full offentlighetsprincipen for all schools |
| HD024022 | S | prop. 194 (curriculum) | Pedagogical freedom concerns |
| HD024023 | S | prop. 196 (teacher time) | Teacher workload concerns |
| HD024021 | S | prop. 198 (vocational) | Vocational education funding |
| HD024044 | C | prop. 197 (grading) | Transition provisions for current students |
| HD024058 | MP | prop. 197 (grading) | Alternative grading approach |

### Cluster 3: Housing/Civil (props. 180, 187, 188, 202, 224)
| Motion | Party | Target Proposition | Relationship |
|--------|-------|-------------------|-------------|
| HD024011 | S | prop. 187 (rental market) | Opposes deposit increase |
| HD024012 | S | prop. 188 (hyrköp) | Rejects rent-to-own proposal |
| HD024009 | S | prop. 202 (habitat) | Environmental compliance concerns |
| HD024047 | MP | prop. 202 (habitat) | Full rejection — EU law concerns |
| HD024040 | C | prop. 202 (habitat) | Environmental protection demands |

---

## 📂 MCP Data Files Used

| Tool | Parameters | Documents | Timestamp |
|------|-----------|-----------|-----------|
| `get_motioner` | `rm=2025/26, limit=50` | 50 | 2026-04-02T06:30Z |

---

*Document Control: Analysis by Riksdagsmonitor AI Agent | Classification: PUBLIC | Retention: 1 year*
