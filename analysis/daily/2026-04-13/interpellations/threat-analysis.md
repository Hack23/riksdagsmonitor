# Political Threat Analysis — Interpellations 2026-04-13

| Field | Value |
|-------|-------|
| **ID** | THREAT-IP-2026-04-13-001 |
| **Date** | 2026-04-13 |
| **Riksmöte** | 2025/26 |
| **Documents Analyzed** | 2 |
| **Overall Threat Level** | MODERATE |
| **Generated** | 2026-04-13 07:20 UTC |

## Threat Dashboard

```mermaid
graph TD
    subgraph "🎭 Political Threat Analysis — 2026-04-13"
        T1["AC: Accountability Erosion<br/>Ministers may give evasive<br/>responses to SD interpellations<br/>🟡 MODERATE"]
        T2["NI: Normative Integrity<br/>Prop 133 may undermine<br/>constitutional freedom norms<br/>🟠 ELEVATED"]
        T3["DP: Democratic Polarisation<br/>Religious extremism framing<br/>increases social division<br/>🟡 MODERATE"]
    end
    style T1 fill:#ffc107,color:#000
    style T2 fill:#fd7e14,color:#fff
    style T3 fill:#ffc107,color:#000
```

## Threat Categories

| Category | Code | Level | Evidence | Confidence |
|----------|:----:|:-----:|----------|:----------:|
| **Accountability Erosion** | AC | 🟡 MODERATE | Ministers Strömmer and Forssmed face interpellation pressure from SD but may respond evasively to avoid coalition conflict | MEDIUM |
| **Normative Integrity** | NI | 🟠 ELEVATED | Prop 2025/26:133 broad language ("säkerheten för människors liv eller hälsa") creates potential for demonstration rights erosion | HIGH |
| **Democratic Polarisation** | DP | 🟡 MODERATE | HD10430 framing of mosque hate speech may increase social division in communities like Kristianstad | MEDIUM |

## Democratic Function Impact Assessment

| Democratic Function | Impact | Evidence (dok_id) | Confidence |
|-------------------|:------:|-------------------|:----------:|
| Freedom of Expression | 🟠 MEDIUM-HIGH | frs 2025/26:429: Prop 133 may restrict demonstration rights via "heckler's veto" mechanism | HIGH |
| Parliamentary Accountability | 🟢 POSITIVE | Both interpellations demonstrate functioning accountability — ministers must respond within statutory deadlines | HIGH |
| Rule of Law | 🟡 MEDIUM | frs 2025/26:429: Police discretion under Prop 133 may lead to inconsistent enforcement | MEDIUM |
| Social Cohesion | 🟡 MEDIUM | frs 2025/26:430: Mosque hate speech narrative may increase inter-community tensions | MEDIUM |

## Attack Tree: Heckler's Veto Institutionalisation

```mermaid
graph TD
    ROOT["Heckler's Veto<br/>Institutionalised"] --> A["Prop 133 gives police<br/>broad discretion"]
    ROOT --> B["Violence threats against<br/>controversial demonstrations"]
    A --> C["Police deny permits<br/>citing 'safety concerns'"]
    B --> C
    C --> D["Demonstrations effectively<br/>suppressed by threat actors"]
    D --> E["Constitutional norm<br/>erosion over time"]
    style ROOT fill:#dc3545,color:#fff
    style C fill:#fd7e14,color:#fff
    style E fill:#dc3545,color:#fff
```
