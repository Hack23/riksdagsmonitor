# 🏷️ Classification Results — 2026-04-09

**CLS-ID:** CLS-2026-04-09-EVE | **Date:** 2026-04-09 | **Riksmöte:** 2025/26
**Analyst:** news-evening-analysis | **Confidence:** HIGH

---

## 🌳 Sensitivity Decision Tree

```mermaid
graph TD
    A["Document Intake<br/>12 documents"] --> B{"National Security<br/>Implications?"}
    B -->|Yes| C["🔴 HIGH Sensitivity<br/>HD03220 NATO, HD01UU6 Security Policy"]
    B -->|No| D{"Criminal Justice<br/>Reform?"}
    D -->|Yes| E["🟠 ELEVATED Sensitivity<br/>HD03218 Doubled Penalties, HD03217 Civil Servant"]
    D -->|No| F{"Migration/Social<br/>Policy?"}
    F -->|Yes| G["🟡 MODERATE Sensitivity<br/>HD01SfU16 Migration, HD024073/74 Youth Crime"]
    F -->|No| H["🟢 STANDARD Sensitivity<br/>HD01TU15 Transport, HD01CU23 Rural, HD01UbU31 Ethics, HD01FöU8 Personnel"]
    style C fill:#D32F2F,color:#FFFFFF
    style E fill:#FF9800,color:#FFFFFF
    style G fill:#FFC107,color:#000000
    style H fill:#4CAF50,color:#FFFFFF
    style A fill:#1565C0,color:#FFFFFF
```

## 📊 Per-Document Classification

| dok_id | Title | Sensitivity | Domain | Urgency | Significance (0-10) |
|--------|-------|-------------|--------|---------|:---:|
| HD03220 | Swedish NATO Contribution to Finland | 🔴 HIGH | Defense/Security | IMMEDIATE | **9** |
| HD03218 | Double Penalties Criminal Networks | 🟠 ELEVATED | Criminal Justice | HIGH | **8** |
| HD03217 | Expanded Civil Servant Accountability | 🟠 ELEVATED | Governance/Accountability | HIGH | **8** |
| HD01UU6 | Security Policy | 🔴 HIGH | Foreign Affairs/Security | HIGH | **7** |
| HD01SfU16 | Migration Issues | 🟡 MODERATE | Migration/Social | MEDIUM | **7** |
| HD024073 | V Motion Youth Crime | 🟡 MODERATE | Criminal Justice | MEDIUM | **6** |
| HD024074 | MP Motion Youth Crime | 🟡 MODERATE | Criminal Justice | MEDIUM | **6** |
| HD01TU15 | Railway & Public Transport | 🟢 STANDARD | Infrastructure | LOW | **5** |
| HD01FöU8 | Defense Personnel | 🟢 STANDARD | Defense | MEDIUM | **5** |
| HD01CU23 | Rural Employment & Housing | 🟢 STANDARD | Social/Regional | LOW | **4** |
| HD01UbU31 | Research Ethics Exemptions | 🟢 STANDARD | Education/Science | LOW | **4** |
| HD11695 | Written Question | 🟢 STANDARD | Parliamentary | LOW | **2** |
