# 🔒 Classification Results — Evening Analysis 2026-04-13

| Field | Value |
|-------|-------|
| **ID** | CLS-EVE-2026-04-13-001 |
| **Date** | 2026-04-13 |
| **Riksmöte** | 2025/26 |
| **Documents Classified** | 61 |
| **Confidence** | HIGH |
| **Generated** | 2026-04-13 17:56 UTC |

---

## Sensitivity Decision Tree

```mermaid
graph TD
    START["61 Documents<br/>2026-04-13"] --> Q1{"Contains fiscal<br/>projections?"}
    Q1 -->|"Yes (6 docs)"| RES["🔴 RESTRICTED<br/>HD03100, HD0399, HD03236<br/>HD0398, HD03101, HD03241"]
    Q1 -->|"No"| Q2{"Contains security/<br/>migration policy?"}
    Q2 -->|"Yes (15 docs)"| SEN["🟡 SENSITIVE<br/>UU6, FöU8, FöU12, SfU16<br/>SfU31/32/36, HD03220<br/>HD03218, HD10429, HD10430"]
    Q2 -->|"No"| Q3{"Legislative/<br/>committee action?"}
    Q3 -->|"Yes (24 docs)"| SEN2["🟡 SENSITIVE<br/>Committee reports, motions"]
    Q3 -->|"No"| PUB["🟢 PUBLIC<br/>Routine, procedural (16 docs)"]
    
    style RES fill:#D32F2F,color:#FFFFFF
    style SEN fill:#FFC107,color:#000000
    style SEN2 fill:#FFC107,color:#000000
    style PUB fill:#4CAF50,color:#FFFFFF
```

## Per-Document Classification

| dok_id | Type | Title | Sensitivity | Domain | Urgency | Significance |
|--------|------|-------|------------|--------|---------|-------------|
| HD03100 | prop | 2026 års ekonomiska vårproposition | 🔴 RESTRICTED | Fiscal Policy | CRITICAL | 10/10 |
| HD0399 | prop | Vårändringsbudget för 2026 | 🔴 RESTRICTED | Budget | IMMEDIATE | 9/10 |
| HD03236 | prop | Extra ändringsbudget — Sänkt skatt på drivmedel | 🔴 RESTRICTED | Energy/Tax | IMMEDIATE | 9/10 |
| HD03218 | prop | Dubbla straff för brott i kriminella nätverk | 🟡 SENSITIVE | Criminal Justice | HIGH | 8/10 |
| HD03220 | prop | Svenskt bidrag till Natos framskjutna närvaro | 🟡 SENSITIVE | Defence/NATO | HIGH | 8/10 |
| HD03217 | prop | Utökat straffrättsligt tjänstemannaansvar | 🟡 SENSITIVE | Public Admin | MODERATE | 7/10 |
| HD01SfU16 | bet | Migrationsfrågor | 🟡 SENSITIVE | Migration | HIGH | 40/50 |
| HD01MJU30 | bet | Klimatmål och klimatpolitik | 🟡 SENSITIVE | Climate | HIGH | 40/50 |
| HD01UU6 | bet | Säkerhetspolitik | 🟡 SENSITIVE | Security | HIGH | 39/50 |
| HD01FöU12 | bet | Totalförsvaret — civilt försvar | 🟡 SENSITIVE | Defence | HIGH | 38/50 |
| HD01FöU8 | bet | Försvarsmaktens personalförsörjning | 🟡 SENSITIVE | Defence | HIGH | 36/50 |
| HD10429 | ip | Skyddet för yttrandefriheten | 🟡 SENSITIVE | Constitutional | MODERATE | 7/10 |
| HD10430 | ip | Moskéer som sprider hat och hot | 🟡 SENSITIVE | Religious Extremism | MODERATE | 6/10 |
| HD0398 | skr | Redovisning av skatteutgifter 2026 | 🔴 RESTRICTED | Taxation | ROUTINE | 6/10 |
| HD03101 | skr | Årsredovisning för staten 2025 | �� RESTRICTED | Public Finance | ROUTINE | 6/10 |
| HD03241 | skr | Riksrevisionens rapport om finanspolitiska ramverket | 🔴 RESTRICTED | Fiscal Audit | ROUTINE | 6/10 |
| HD03219 | prop | Riksrevisionens rapport om tandvårdsstödet | 🟢 PUBLIC | Healthcare | LOW | 5/10 |

## Distribution Summary

| Sensitivity | Count | Percentage |
|------------|-------|-----------|
| 🔴 RESTRICTED | 6 | 10% |
| 🟡 SENSITIVE | 39 | 64% |
| 🟢 PUBLIC | 16 | 26% |
