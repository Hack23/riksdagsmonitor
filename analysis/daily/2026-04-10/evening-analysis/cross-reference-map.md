# 🔗 Cross-Reference Map — Evening Analysis 2026-04-10

| Field | Value |
|-------|-------|
| **Map ID** | XREF-2026-04-10-EVE-001 |
| **Analysis Date** | 2026-04-10 18:15 UTC |
| **Cross-References** | 12 clusters identified |
| **Produced By** | news-evening-analysis (AI-enriched) |

---

## Cross-Reference Network

```mermaid
graph TD
    subgraph "Migration Enforcement Cluster"
        P235["Prop. 235<br/>Deportation HD03235"]
        SfU31["SfU31<br/>Detention HD01SfU31"]
        SfU32["SfU32<br/>Returns HD01SfU32"]
        SfU36["SfU36<br/>Vandel HD01SfU36"]
        SfU16["SfU16<br/>Migration HD01SfU16"]
        P235 --> SfU31
        P235 --> SfU32
        P235 --> SfU36
        SfU16 --> SfU31
    end

    subgraph "Security/Defence Cluster"
        P214["Prop. 214<br/>Cyber HD03214"]
        P228["Prop. 228<br/>Arms HD03228"]
        S114["Skr. 114<br/>Export HD03114"]
        UU6["UU6<br/>Security HD01UU6"]
        FoU8["FoU8<br/>Personnel HD01FoU8"]
        P214 --> UU6
        P228 --> S114
        UU6 --> FoU8
    end

    subgraph "Opposition Challenge Cluster"
        M70["C mot. 4070<br/>Sida HD024070"]
        M71["V mot. 4071<br/>Sida HD024071"]
        M72["MP mot. 4072<br/>Sida HD024072"]
        M73["V mot. 4073<br/>Youth HD024073"]
        M74["MP mot. 4074<br/>Youth HD024074"]
    end

    style P235 fill:#D32F2F,color:#FFFFFF
    style P214 fill:#1565C0,color:#FFFFFF
    style P228 fill:#1565C0,color:#FFFFFF
    style SfU31 fill:#FF9800,color:#FFFFFF
    style SfU32 fill:#FF9800,color:#FFFFFF
    style SfU36 fill:#FF9800,color:#FFFFFF
    style M70 fill:#FFC107,color:#000000
    style M71 fill:#FFC107,color:#000000
    style M72 fill:#FFC107,color:#000000
```

## Cross-Reference Clusters

| Cluster | Documents | Pattern | Significance |
|---------|-----------|---------|:------------:|
| Migration Enforcement | HD03235, SfU31, SfU32, SfU36, SfU16 | 4-layer enforcement chain | 🔴 HIGH |
| Security/Defence | HD03214, HD03228, HD03114, UU6, FoU8 | Post-NATO capability build | 🟠 HIGH |
| Sida Accountability | HD024070, HD024071, HD024072 | Cross-party opposition (C+V+MP) | 🟡 MEDIUM |
| Youth Crime | HD024073, HD024074 | V+MP civil liberties challenge | 🟡 MEDIUM |
| Housing Policy | HD024012, HD024064, HD024067 | S+MP dual challenge | 🟡 MEDIUM |
| Welfare Reform | HD024016, HD024032 | Rare S-C alignment | 🟡 MEDIUM |

---

**Document Control:**
- **Template:** Cross-reference analysis
- **Methodology:** analysis/methodologies/ai-driven-analysis-guide.md v5.0
