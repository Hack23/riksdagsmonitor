# ⚠️ Political Risk Assessment — 2026-04-10 Realtime-1424

## 📋 Risk Context

| Field | Value |
|-------|-------|
| **Risk Assessment ID** | RSK-2026-04-10-1424 |
| **Assessment Date** | 2026-04-10 14:24 UTC |
| **Assessment Period** | 2026-04-10 |
| **Produced By** | news-realtime-monitor (realtime-1424) |
| **Political Context** | Kristersson government (M+KD+L, SD support) in third year. Migration enforcement is core Tidö Agreement priority. Three SfU committee reports advance migration policy cluster. |
| **Riksmöte** | 2025/26 |
| **Overall Risk Level** | MEDIUM |

---

## 🗂️ Risk Inventory

### Risk Heat Map

```mermaid
graph TD
    subgraph "Political Risk Landscape — 2026-04-10"
        R1["RSK-001: Deportation capacity gap<br/>L:4 x I:3 = 12"]
        R2["RSK-002: Detention infrastructure<br/>L:3 x I:3 = 9"]
        R3["RSK-003: Vandel criteria inconsistency<br/>L:3 x I:3 = 9"]
        R4["RSK-004: Climate Act non-compliance<br/>L:3 x I:2 = 6"]
        R5["RSK-005: ECHR legal challenges<br/>L:2 x I:3 = 6"]
    end
    subgraph "Risk Score Tiers"
        TH["HIGH Score 10-14"]
        TM["MEDIUM Score 5-9"]
    end
    R1 -.-> TH
    R2 -.-> TM
    R3 -.-> TM
    R4 -.-> TM
    R5 -.-> TM
    style R1 fill:#FF9800,color:#FFFFFF
    style R2 fill:#FFC107,color:#000000
    style R3 fill:#FFC107,color:#000000
    style R4 fill:#FFC107,color:#000000
    style R5 fill:#FFC107,color:#000000
    style TH fill:#FF9800,color:#FFFFFF
    style TM fill:#FFC107,color:#000000
```

### Risk Register

| Risk ID | Description | L (1-5) | I (1-5) | Score | Tier | Evidence | Mitigation |
|---------|-------------|:-------:|:-------:|:-----:|:----:|----------|------------|
| RSK-001 | Polisen and Migrationsverket lack operational capacity for expanded deportation (HD01SfU32) | 4 | 3 | 12 | HIGH | HD01SfU32, enforcement capacity context | Additional budget allocation, recruitment |
| RSK-002 | Detention facility infrastructure insufficient for new regulatory framework (HD01SfU31) | 3 | 3 | 9 | MEDIUM | HD01SfU31, Migrationsverket capacity | Phased implementation, facility expansion |
| RSK-003 | Vandel assessment criteria subjective, leading to inconsistent application (HD01SfU36) | 3 | 3 | 9 | MEDIUM | HD01SfU36, implementation context | Detailed Migrationsverket guidelines |
| RSK-004 | Government delays climate policy instrument investigation, risking Climate Act non-compliance (HD11702) | 3 | 2 | 6 | MEDIUM | HD11702, klimatlagen | Publish klimathandlingsplan on schedule |
| RSK-005 | New detention and deportation rules challenged under ECHR (HD01SfU31, HD01SfU32) | 2 | 3 | 6 | MEDIUM | HD01SfU31, HD01SfU32, ECHR context | Proportionality review, judicial oversight |

### Cascading Risk Chain — RSK-001

```mermaid
graph TD
    TRIGGER["SfU approves HD01SfU32 Strengthened Deportation"]
    TRIGGER --> EXEC["Polisen/Migrationsverket begin expanded enforcement"]
    EXEC --> GAP["Capacity gap: insufficient officers and resources"]
    GAP --> FAIL["High-profile enforcement failure or wrongful action"]
    FAIL --> MEDIA["Negative media coverage"]
    MEDIA --> POLL["Government polling impact"]
    POLL --> COAL["SD pressure for even stronger measures"]
    style TRIGGER fill:#4CAF50,color:#FFFFFF
    style EXEC fill:#FFC107,color:#000000
    style GAP fill:#FF9800,color:#FFFFFF
    style FAIL fill:#D32F2F,color:#FFFFFF
    style MEDIA fill:#D32F2F,color:#FFFFFF
    style POLL fill:#FF9800,color:#FFFFFF
    style COAL fill:#FFC107,color:#000000
```

---

## 🔮 Risk Outlook

| # | Forecast Risk | Timeline | Trigger | Priority |
|---|--------------|----------|---------|:--------:|
| 1 | Enforcement capacity gap exposed | 3-6 months post-implementation | Migrationsverket reports resource constraints | 🟠 |
| 2 | ECHR litigation on detention rules | 6-18 months | First formal ECHR complaint filed | 🟡 |
| 3 | Climate Act compliance deadline pressure | 6-12 months | Opposition interpellations escalate | 🟡 |

---

**Document Control:**
- **Template:** analysis/templates/risk-assessment.md v2.2
- **Methodology:** analysis/methodologies/political-risk-methodology.md
