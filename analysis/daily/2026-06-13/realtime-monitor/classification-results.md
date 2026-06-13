# Classification Results — Realtime Monitor 2026-06-13

## ISMS Security Classification

In accordance with Hack23 ISMS Policy, all political intelligence products, data sources, and analytical files for the extraordinary Saturday session are classified regarding their Confidentiality, Integrity, and Availability (CIA) rating.

| Asset / File | Primary Data Source | Confidentiality | Integrity | Availability | Classification | RTO / RPO |
|---|---|:---:|:---:|:---:|---|---|
| **Consolidated Analysis** (`article.md`) | Combined Synthesis | 🟢 Public | 🔴 High | 🟡 Medium | **PUBLIC** | 24 Hours / 1 Hour |
| **PIR Status Register** (`pir-status.json`) | Internal Tracking | 🟡 Restricted | 🔴 High | 🔴 High | **RESTRICTED** | 4 Hours / 1 Hour |
| **Biometric Metadata** (`HD01SkU30`) | Riksdag Open Data | 🟢 Public | 🔴 High | 🟡 Medium | **PUBLIC** | 24 Hours / 4 Hours |
| **Vandel Evaluations** (`HD01SfU36`) | Riksdag Open Data | 🟢 Public | 🔴 High | 🟡 Medium | **PUBLIC** | 24 Hours / 4 Hours |
| **Sentencing Metrics** (`HD01JuU42`) | Riksdag Open Data | 🟢 Public | 🔴 High | 🟡 Medium | **PUBLIC** | 24 Hours / 4 Hours |
| **Officer Secrecy Data** (`HD01JuU44`) | Riksdag Open Data | 🟢 Public | 🔴 High | 🟡 Medium | **PUBLIC** | 24 Hours / 4 Hours |

---

## Detailed Handling Instructions

### 🟢 PUBLIC Assets
* **Scope**: Includes `article.md`, all localized HTML files (`news/*.html`), and the 23 markdown artifacts.
* **Storage**: Public GitHub repository.
* **Access**: Open to the public.
* **Data Protection Compliance**: Contains no Personally Identifiable Information (PII) or high-risk private data. All sources are public parliamentary files, fully compliant with GDPR.

### 🟡 RESTRICTED Assets
* **Scope**: Includes `pir-status.json` and internal pipeline tracking manifests.
* **Storage**: Restricted repository metadata, accessible only to authenticated Hack23 engineers and agents.
* **Handling**: Must not be leaked to the public or committed to unprotected public repositories without sanitization.

```mermaid
flowchart TD
  A[\"Riksdag Open Data\"] -->|Process & Sanitize| B[\"Consolidated Analysis\"]
  B -->|Export| C[\"Public HTML Articles\"]
  B -->|Internal Tracking| D[\"Restricted pir-status.json\"]

  style B fill:#00d9ff,stroke:#0a0e27,color:#0a0e27
  style C fill:#ffbe0b,stroke:#0a0e27,color:#0a0e27
  style D fill:#ff006e,stroke:#0a0e27,color:#ffffff
```
