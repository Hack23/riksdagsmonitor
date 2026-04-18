# Political Classification Results — 2026-04-02

**CLS-ID**: CLS-2026-04-02-001
**Generated**: 2026-04-02 18:15 UTC
**Riksmöte**: 2025/26
**Documents Classified**: 9
**Confidence**: MEDIUM

---

## Classification Decision Tree

```mermaid
graph TD
    START["9 Documents"] --> BET["Committee Reports (2)"]
    START --> FRG["Written Questions (6)"]
    START --> IPL["Interpellations (1)"]

    BET --> B1["HD01JuU15<br/>Criminal Justice<br/>🟠 Sensitivity: MEDIUM"]
    BET --> B2["HD01FöU12<br/>Civilian Protection<br/>🔴 Sensitivity: HIGH"]

    FRG --> F1["HD11678<br/>Noise Cameras<br/>🟢 Sensitivity: LOW"]
    FRG --> F2["HD11679<br/>Stockholm Initiative<br/>🟠 Sensitivity: MEDIUM"]
    FRG --> F3["HD11680<br/>Israel Death Penalty<br/>🔴 Sensitivity: HIGH"]
    FRG --> F4["HD11681<br/>Norra Kärr Mining<br/>🟠 Sensitivity: MEDIUM"]
    FRG --> F5["HD11682<br/>Environment Committee<br/>🟢 Sensitivity: LOW"]
    FRG --> F6["HD11683<br/>Syria Minorities<br/>🔴 Sensitivity: HIGH"]

    IPL --> I1["HD10428<br/>Emergency Airport<br/>🟢 Sensitivity: LOW"]

    style B2 fill:#D32F2F,color:#FFFFFF
    style F3 fill:#D32F2F,color:#FFFFFF
    style F6 fill:#D32F2F,color:#FFFFFF
    style B1 fill:#FF9800,color:#FFFFFF
    style F2 fill:#FF9800,color:#FFFFFF
    style F4 fill:#FF9800,color:#FFFFFF
    style F1 fill:#4CAF50,color:#FFFFFF
    style F5 fill:#4CAF50,color:#FFFFFF
    style I1 fill:#4CAF50,color:#FFFFFF
```

## Per-Document Classification Table

| dok_id | Title | Type | Sensitivity | Domain | Urgency | Significance (0-10) |
|--------|-------|------|-------------|--------|---------|---------------------|
| HD01JuU15 | Kriminalvårdsfrågor | bet | MEDIUM | Justice & Law | MEDIUM | 6 |
| HD01FöU12 | Starkare skydd civilbefolkningen | bet | HIGH | Defense & Security | HIGH | 7 |
| HD11678 | Bullerkameror | fråga | LOW | Justice & Infrastructure | LOW | 3 |
| HD11679 | Stockholmsinitiativet | fråga | MEDIUM | Foreign Policy & Arms Control | MEDIUM | 5 |
| HD11680 | Israels dödsstraffslag | fråga | HIGH | Foreign Policy & Human Rights | HIGH | 7 |
| HD11681 | Norra Kärr | fråga | MEDIUM | Environment & Economy | MEDIUM | 5 |
| HD11682 | Miljömålsberedningen | fråga | LOW | Environment | LOW | 4 |
| HD11683 | Kristna i Syrien | fråga | HIGH | Foreign Policy & Human Rights | HIGH | 6 |
| HD10428 | Beredskapsflygplats | ip | LOW | Infrastructure & Defense | LOW | 4 |

## Data Quality Notes

Classification based on document metadata, titles, and available summaries. Full-text unavailable for committee reports. Confidence: MEDIUM.
