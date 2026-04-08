# CLS-20260408-EVE — Political Classification Results

**📋 Document Owner:** CEO | **📄 Version:** 1.0 | **📅 Date:** 2026-04-08
**🏢 Owner:** Hack23 AB | **��️ Classification:** Public

---

## 🔀 Classification Decision Tree

```mermaid
graph TD
    START["14 Documents<br/>2026-04-08"]
    START --> PROP["Propositions (2)"]
    START --> BET["Committee Reports (1)"]
    START --> MOT["Motions (3)"]
    START --> IP["Interpellations (8)"]

    PROP --> P1["HD03230 Artskydd<br/>Domain: Environment<br/>Sensitivity: NORMAL<br/>Urgency: MEDIUM"]
    PROP --> P2["HD03219 Tandvård<br/>Domain: Healthcare<br/>Sensitivity: NORMAL<br/>Urgency: LOW"]

    BET --> B1["HD01NU18 Förnybart<br/>Domain: Energy<br/>Sensitivity: NORMAL<br/>Urgency: HIGH"]

    MOT --> M1["HD024070-72 Sida<br/>Domain: Foreign Aid<br/>Sensitivity: NORMAL<br/>Urgency: MEDIUM"]

    IP --> I1["HD11690 Defence<br/>Domain: Security<br/>Sensitivity: ELEVATED<br/>Urgency: MEDIUM"]
    IP --> I2["HD11691-94 Mixed<br/>Domain: Various<br/>Sensitivity: NORMAL<br/>Urgency: LOW"]

    style START fill:#6f42c1,color:#fff
    style PROP fill:#28a745,color:#fff
    style BET fill:#0d6efd,color:#fff
    style MOT fill:#ffc107,color:#000
    style IP fill:#fd7e14,color:#fff
    style P1 fill:#28a745,color:#fff
    style P2 fill:#28a745,color:#fff
    style B1 fill:#0d6efd,color:#fff
    style M1 fill:#ffc107,color:#000
    style I1 fill:#fd7e14,color:#fff
    style I2 fill:#fd7e14,color:#fff
```

## 📋 Per-Document Classification

| dok_id | Type | Domain | Sensitivity | Urgency | Significance (0-10) |
|--------|------|--------|-------------|---------|---------------------|
| HD01NU18 | Committee Report | Energy/Environment | NORMAL | HIGH | 7.0 |
| HD03230 | Proposition | Environment/Property | NORMAL | MEDIUM | 6.0 |
| HD03219 | Government Writing | Healthcare | NORMAL | LOW | 5.0 |
| HD024070 | Motion (C) | Foreign Aid | NORMAL | MEDIUM | 5.0 |
| HD024071 | Motion (V) | Foreign Aid | NORMAL | MEDIUM | 5.0 |
| HD024072 | Motion (MP) | Foreign Aid | NORMAL | MEDIUM | 5.0 |
| HD11690 | Interpellation | Defence/Security | ELEVATED | MEDIUM | 5.0 |
| HD11693 | Interpellation | Democracy/Governance | NORMAL | LOW | 4.5 |
| HD11689 | Interpellation | Environment | NORMAL | LOW | 4.2 |
| HD11687 | Interpellation | Healthcare | NORMAL | LOW | 3.8 |
| HD11688 | Interpellation | Transport/Energy | NORMAL | LOW | 3.8 |
| HD11692 | Interpellation | Defence/Civil Security | NORMAL | LOW | 3.8 |
| HD11691 | Interpellation | Foreign Policy | NORMAL | LOW | 3.5 |
| HD11694 | Interpellation | Democracy/Governance | NORMAL | LOW | 3.5 |
