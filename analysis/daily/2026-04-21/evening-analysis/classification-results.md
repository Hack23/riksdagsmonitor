# Classification Results — Evening Analysis 2026-04-21

**CLS-ID**: CLS-2026-04-21-EVE001
**Classification Date**: 2026-04-21
**Riksmöte**: 2025/26

---

## Sensitivity Decision Tree

```mermaid
graph TD
    classDef pub fill:#2E7D32,color:#fff
    classDef int fill:#1565C0,color:#fff
    classDef priv fill:#C62828,color:#fff

    START["Document Classification<br/>2026-04-21 Corpus"]

    START --> Q1{"Contains PII?"}
    Q1 -->|"No"| Q2{"Electoral/<br/>Constitutional impact?"}
    Q1 -->|"Yes"| PRIV["PRIVATE — PII present"]:::priv

    Q2 -->|"High"| Q3{"Public parliamentary<br/>record?"}
    Q2 -->|"Low"| INT["INTERNAL — Monitor"]:::int

    Q3 -->|"Yes"| PUB["PUBLIC — Official record<br/>Free to publish"]:::pub
    Q3 -->|"No"| INT2["INTERNAL — Review needed"]:::int

    START --> DOC_LIST["Document Corpus"]
    DOC_LIST --> FIU48["HD01FiU48: PUBLIC<br/>Finance Committee bet."]:::pub
    DOC_LIST --> TU16["HD01TU16: PUBLIC<br/>Transport Committee bet."]:::pub
    DOC_LIST --> IP440["HD10440: PUBLIC<br/>Interpellation"]:::pub
    DOC_LIST --> IP441["HD10441: PUBLIC<br/>Interpellation"]:::pub
    DOC_LIST --> IP442["HD10442: PUBLIC<br/>Interpellation — sensitive<br/>(healthcare, eating disorders)"]:::pub
    DOC_LIST --> FRA730["HD11730: PUBLIC<br/>Written question"]:::pub
    DOC_LIST --> FRA731["HD11731: PUBLIC<br/>Written question — diplomatic"]:::pub
    DOC_LIST --> FRA732["HD11732: PUBLIC<br/>Written question"]:::pub
```

---

## Per-Document Classification Table

| dok_id | Title (abbreviated) | Sensitivity | Policy Domain | Urgency | Significance |
|--------|--------------------|-----------|----|---------|-------------|
| **HD01FiU48** | Extra ändringsbudget — fuel tax + energy | 🟢 PUBLIC | Fiscal/Energy | 🔴 CRITICAL | 10/10 |
| **HD01TU16** | Slopat krav introduktionsutbildning | 🟢 PUBLIC | Transport/Regulatory | 🟡 NORMAL | 4/10 |
| **HD10440** | Utbildningen för företagsläkare | 🟢 PUBLIC | Labour/Health | 🟡 NORMAL | 6/10 |
| **HD10441** | Rättssäkerheten inom rättsväsendet | 🟢 PUBLIC | Justice/Constitutional | 🟡 NORMAL | 6/10 |
| **HD10442** | Ätstörningsvård Region Stockholm | 🟢 PUBLIC | Healthcare/Welfare | 🟠 ELEVATED | 7/10 |
| **HD11730** | Utbetalningar till vindkraftskommuner | 🟢 PUBLIC | Energy/Finance | 🟡 NORMAL | 5/10 |
| **HD11731** | Gaza flotilla — Swedish citizens | 🟢 PUBLIC | Foreign Policy | 🔴 CRITICAL (potential) | 6/10 |
| **HD11732** | Skatteverket Vetlanda closure | 🟢 PUBLIC | Public Services | 🟡 NORMAL | 4/10 |
| **Gov/vindkraft** | Vindkraft revenue sharing | 🟢 PUBLIC | Energy Policy | 🟠 ELEVATED | 8/10 |
| **KU G16** | Svantesson hearing | 🟢 PUBLIC | Constitutional | 🔴 CRITICAL | 8/10 |
| **KU G34** | Wallström hearing | 🟢 PUBLIC | Constitutional | 🟡 NORMAL | 7/10 |

---

## Domain Classification

| Policy Domain | Documents | Combined Significance |
|---------------|----------|----------------------|
| Fiscal/Economic | HD01FiU48, HD11732 | **CRITICAL** (10/10 lead) |
| Energy/Climate | HD01FiU48, HD11730, gov/vindkraft | **HIGH** (9/10 cluster) |
| Constitutional/Legal | HD10441, KU G16, KU G34 | **HIGH** (8/10) |
| Healthcare/Welfare | HD10440, HD10442 | **MEDIUM** (7/10) |
| Transport | HD01TU16 | **LOW** (4/10) |
| Foreign Policy | HD11731 | **MEDIUM** (6/10) |

---

## Publication Decision

| Article | Status | Classification | Labels |
|---------|--------|---------------|--------|
| news/2026-04-21-evening-analysis-en.html | ✅ PUBLISH | PUBLIC | automated-news, evening-analysis |
| news/2026-04-21-evening-analysis-sv.html | ✅ PUBLISH | PUBLIC | automated-news, evening-analysis |

*Produced by Riksdagsmonitor Evening Analysis — Classification: PUBLIC*
