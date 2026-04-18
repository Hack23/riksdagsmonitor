# ⚠️ Political Risk Assessment — Committee Reports

## 📋 Risk Context

| Field | Value |
|-------|-------|
| **Risk Assessment ID** | RSK-2026-04-02-CR01 |
| **Assessment Date** | 2026-04-03 04:53 UTC |
| **Assessment Period** | 2026-04-02 committee reports |
| **Produced By** | news-committee-reports |
| **Political Context** | M-KD-L minority government with SD supply-and-confidence agreement. Pending chamber votes on JuU15, FöU12. Civil defence reform and criminal justice policy in focus. |
| **Riksmöte** | 2025/26 |
| **Overall Risk Level** | MEDIUM |

---

## 🗂️ Risk Inventory

### Risk Heat Map

```mermaid
graph TD
    subgraph "⚖️ Political Risk Landscape — 2026-04-02"
        R1["R1: Municipal readiness<br/>failure for shelter law<br/>L:3 × I:4 = 12"]
        R2["R2: Prison overcrowding<br/>policy vacuum<br/>L:3 × I:3 = 9"]
        R3["R3: Disability accessibility<br/>cross-party consensus<br/>L:2 × I:3 = 6"]
        R4["R4: Trygghetsberedningen<br/>tillkännagivande risk<br/>L:2 × I:3 = 6"]
        R5["R5: Public anxiety from<br/>shelter audit findings<br/>L:2 × I:4 = 8"]
    end

    R1 --> R5
    R2 --> R4

    style R1 fill:#D32F2F,color:#FFFFFF
    style R2 fill:#FF9800,color:#FFFFFF
    style R3 fill:#FFC107,color:#000000
    style R4 fill:#FFC107,color:#000000
    style R5 fill:#FF9800,color:#FFFFFF
```

### Risk Register

| Risk ID | Risk Description | Source | Likelihood (1-5) | Impact (1-5) | L×I Score | Risk Level | Confidence |
|---------|-----------------|--------|:-----------------:|:------------:|:---------:|:----------:|:----------:|
| R1 | Municipal shelter readiness failure by June 1, 2026 | HD01FöU12 | 3 | 4 | 12 | HIGH | MEDIUM |
| R2 | Prison overcrowding escalation without policy response | HD01JuU15 | 3 | 3 | 9 | MEDIUM | MEDIUM |
| R3 | Disability accessibility becomes cross-party consensus forcing government concession | HD01FöU12 | 2 | 3 | 6 | MEDIUM | MEDIUM |
| R4 | Opposition forces tillkännagivande on Trygghetsberedningen implementation | HD01JuU15 | 2 | 3 | 6 | MEDIUM | MEDIUM |
| R5 | Public anxiety spike from shelter condition audits | HD01FöU12 | 2 | 4 | 8 | MEDIUM | LOW |

---

## 🔗 Cascading Risk Chain

```mermaid
graph TD
    TRIGGER["June 1, 2026<br/>Law Effective Date"] --> CHECK["Municipal<br/>Readiness Check"]
    CHECK -->|"FAIL"| GAP["Shelter Gaps<br/>Identified"]
    GAP --> MEDIA["Media Coverage<br/>of Deficiencies"]
    MEDIA --> PUBLIC["Public Anxiety<br/>About Preparedness"]
    PUBLIC --> POLITICAL["Political Pressure<br/>on Government"]
    POLITICAL --> OPPOSITION["Opposition Leverages<br/>Reservation 1 Predictions"]

    CHECK -->|"PASS"| SUCCESS["Government Claims<br/>Policy Delivery Win"]

    style TRIGGER fill:#FF9800,color:#FFFFFF
    style GAP fill:#D32F2F,color:#FFFFFF
    style SUCCESS fill:#4CAF50,color:#FFFFFF
    style OPPOSITION fill:#D32F2F,color:#FFFFFF
```

---

## 🔮 Forward Indicators

| # | Indicator | Trigger | Timeline | Confidence |
|---|-----------|---------|----------|:----------:|
| 1 | MSB shelter inventory audit results | Agency publication | April-May 2026 | HIGH |
| 2 | Kriminalvården monthly occupancy statistics | Agency reporting | Monthly | HIGH |
| 3 | Chamber vote dynamics on FöU12 and JuU15 | Kammarens scheduling | 1-2 weeks | HIGH |
| 4 | Municipal budget allocation for shelter upgrades | Municipal council decisions | Q2 2026 | MEDIUM |

---

**Document Control:** Risk assessment generated 2026-04-03 04:53 UTC. Classification: PUBLIC.
