# Political Classification Results — 2026-04-06

| **Key** | **Value** |
|---------|-----------|
| **ID** | CLS-2026-04-06-EVE |
| **Date** | 2026-04-06 |
| **Riksmöte** | 2025/26 |
| **Confidence** | HIGH |
| **Documents Classified** | 9 |

## Sensitivity Decision Tree

```mermaid
graph TD
    A["📄 9 Documents"] --> B{"Security<br/>Classified?"}
    B -->|Yes| C["🔴 SENSITIVE<br/>HD03214 Cybersecurity<br/>HD01FöU12 Civilian Prot<br/>HD03228 War Materiel"]
    B -->|No| D{"Affects<br/>Individuals?"}
    D -->|Yes| E["🟡 RESTRICTED<br/>HD01JuU15 Criminal Care<br/>HD11680 Israel Death Penalty"]
    D -->|No| F["🟢 PUBLIC<br/>HD11683, HD11682<br/>HD11679, HD11678, HD10428"]
    style A fill:#1565C0,color:#FFFFFF
    style C fill:#D32F2F,color:#FFFFFF
    style E fill:#FFC107,color:#000000
    style F fill:#4CAF50,color:#FFFFFF
```

## Per-Document Classification

| dok_id | Title | Sensitivity | Domain | Urgency | Significance (0-10) |
|--------|-------|-------------|--------|---------|---------------------|
| HD01JuU15 | Kriminalvårdsfrågor | RESTRICTED | Criminal Justice | Medium | 6/10 |
| HD01FöU12 | Starkare skydd för civilbefolkningen | SENSITIVE | Security & Defense | High | 8/10 |
| HD11683 | Förföljelse av kristna och minoriteter | PUBLIC | International/Human Rights | Low | 3/10 |
| HD11682 | Miljömålsberedningens nästa uppdrag | PUBLIC | Environment | Low | 4/10 |
| HD11681 | Norra Kärr | PUBLIC | Environment/Mining | Low | 2/10 |
| HD11680 | Israels nya dödsstraffslag | PUBLIC | International/Human Rights | Low | 3/10 |
| HD11679 | Arbetet med Stockholmsinitiativet | PUBLIC | International | Low | 3/10 |
| HD11678 | Bullerkameror lagändringar | PUBLIC | Transport/Environment | Low | 2/10 |
| HD10428 | Beredskapsflygplats Scandinavian Mountain Airport | PUBLIC | Infrastructure/Defense | Medium | 4/10 |

---
*Document Control: CLS-2026-04-06-EVE | Riksdagsmonitor Classification | 2026-04-06*
