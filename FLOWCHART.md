<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🔄 Riksdagsmonitor — Flowcharts</h1>

<p align="center">
  <strong>📊 Process Flows and Data Pipelines for Democratic Transparency</strong><br>
  <em>🎯 CI/CD Workflows · Data Pipelines · Content Generation · User Journeys</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--02--20-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Review-Quarterly-orange?style=for-the-badge" alt="Review Cycle"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.0 | **📅 Last Updated:** 2026-02-20 (UTC)  
**🔄 Review Cycle:** Quarterly | **⏰ Next Review:** 2026-05-20  
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

---

## 🎯 Purpose

This document provides comprehensive flowcharts for all major processes in the Riksdagsmonitor platform. These visual process flows complement the [Architecture](ARCHITECTURE.md) (system structure), [State Diagrams](STATEDIAGRAM.md) (state transitions), and [Workflows](WORKFLOWS.md) (CI/CD automation) documentation.

## 📚 Related Architecture Documentation

| Document | Focus | Description |
|----------|-------|-------------|
| **[Architecture](ARCHITECTURE.md)** | 🏛️ C4 Models | System structure and components |
| **[Data Model](DATA_MODEL.md)** | 📊 Data | Entities, schemas, relationships |
| **[State Diagrams](STATEDIAGRAM.md)** | 🔄 Behavior | System state transitions |
| **[Workflows](WORKFLOWS.md)** | 🔧 DevOps | CI/CD pipeline documentation |
| **[Security Architecture](SECURITY_ARCHITECTURE.md)** | 🛡️ Security | Defense-in-depth controls |
| **[Threat Model](THREAT_MODEL.md)** | 🎯 Threats | STRIDE analysis |
| **[Future Flowcharts](FUTURE_FLOWCHART.md)** | 🚀 Future | Advanced process flows roadmap |

---

## 1. 🏗️ Build and Deployment Flow

```mermaid
flowchart TD
    A[Developer Push to Branch] --> B[GitHub Actions Triggered]
    B --> C[Install Dependencies]
    C --> D[HTMLHint Validation]
    D --> E{HTML Valid?}

    E -->|No| F[Report Errors]
    F --> G[Developer Fixes]
    G --> A

    E -->|Yes| H[ESLint JavaScript Check]
    H --> I[Vitest Unit Tests]
    I --> J{Tests Pass?}

    J -->|No| F
    J -->|Yes| K[Vite Build]

    K --> L[Cypress E2E Tests]
    L --> M{E2E Pass?}

    M -->|No| F
    M -->|Yes| N[Security Scans]

    N --> O[CodeQL Analysis]
    N --> P[Dependabot Check]
    N --> Q[Secret Scanning]

    O --> R{All Scans Clean?}
    P --> R
    Q --> R

    R -->|No| S[Block Merge]
    R -->|Yes| T[Create PR / Merge to Main]

    T --> U[GitHub Pages Deployment]
    U --> V[AWS CloudFront Cache Invalidation]
    V --> W[Production Live]

    style A fill:#4caf50
    style W fill:#4caf50
    style F fill:#f44336
    style S fill:#f44336
```

---

## 2. 📰 News Article Generation Flow

```mermaid
flowchart TD
    A[Scheduled Trigger: 02:00 CET] --> B[Fetch Political Data]
    B --> C[riksdag-regering-mcp: 32 Tools]

    C --> D[Fetch Government Propositions]
    C --> E[Fetch Opposition Motions]
    C --> F[Fetch Committee Reports]

    D --> G[Aggregate Data]
    E --> G
    F --> G

    G --> H{Sufficient Data >= 5 docs?}

    H -->|No| I[Skip Generation]
    H -->|Yes| J[Generate English Article]

    J --> K[Translate to 13 Languages]
    K --> L[SV, DA, NO, FI, DE, FR, ES, NL, AR, HE, JA, KO, ZH]

    L --> M[Add Schema.org Structured Data]
    M --> N[Validate HTML: HTMLHint]
    N --> O[Validate Translations]
    O --> P{All Valid?}

    P -->|No| Q[Fix Validation Errors]
    Q --> N

    P -->|Yes| R[Create Pull Request]
    R --> S[Human Review]
    S --> T{Approved?}

    T -->|No| U[Request Changes]
    U --> J

    T -->|Yes| V[Merge to Main]
    V --> W[Deploy to Production]

    style A fill:#4caf50
    style W fill:#4caf50
    style I fill:#ff9800
```

---

## 3. 📊 CIA Data Pipeline Flow

```mermaid
flowchart TD
    A[Daily Trigger: 03:00 CET] --> B[Fetch CIA Platform Exports]
    B --> C[19 Visualization Products]

    C --> D[Production Statistics JSON]
    C --> E[Party Performance CSV]
    C --> F[Election Forecast Data]
    C --> G[Risk Assessment Data]
    C --> H[Committee Network Data]

    D --> I[Schema Validation]
    E --> I
    F --> I
    G --> I
    H --> I

    I --> J{Schema Valid?}

    J -->|No| K[Alert: Data Quality Issue]
    K --> L[Use Cached Data]

    J -->|Yes| M[Update cia-data/ Directory]
    M --> N[Update Dashboard Statistics]
    N --> O[Invalidate LocalStorage Cache]

    O --> P[Commit Changes]
    P --> Q[GitHub Pages Deployment]
    Q --> R[CloudFront Cache Invalidation]
    R --> S[Fresh Data Available]

    L --> S

    style A fill:#4caf50
    style S fill:#4caf50
    style K fill:#ff9800
```

---

## 4. 👤 User Journey Flow

```mermaid
flowchart TD
    A[User Visits riksdagsmonitor.com] --> B[DNS Resolution: Route 53]
    B --> C[CloudFront Edge Location]
    C --> D[Serve Static HTML/CSS/JS]

    D --> E{Language Selection}

    E -->|English| F[index.html]
    E -->|Swedish| G[index_sv.html]
    E -->|Other 12| H[index_xx.html]

    F --> I[Load Dashboard]
    G --> I
    H --> I

    I --> J[Check LocalStorage Cache]
    J --> K{Cache Fresh?}

    K -->|Yes| L[Render from Cache]
    K -->|No| M[Fetch CIA Data from CDN]
    M --> N[Parse JSON/CSV]
    N --> O[Store in LocalStorage]
    O --> L

    L --> P[Interactive Dashboard Sections]
    P --> Q[Intelligence Overview]
    P --> R[Party Performance]
    P --> S[Government Cabinet]
    P --> T[Election Monitoring]
    P --> U[Risk Assessment]

    Q --> V[Chart.js / D3.js Visualizations]
    R --> V
    S --> V
    T --> V
    U --> V

    V --> W[User Interacts with Charts]
    W --> X{Navigate to News?}

    X -->|Yes| Y[News Article Index]
    Y --> Z[Read Article in Preferred Language]

    X -->|No| AA[Continue Dashboard Exploration]

    style A fill:#4caf50
    style V fill:#00bcd4
```

---

## 5. 🔒 Security Scanning Flow

```mermaid
flowchart TD
    A[Code Change Detected] --> B[GitHub Actions Security Pipeline]

    B --> C[step-security/harden-runner]
    C --> D[Egress Policy Audit]

    D --> E[CodeQL Analysis]
    E --> F{Vulnerabilities Found?}

    F -->|Yes Critical| G[Block Merge]
    F -->|Yes Low/Medium| H[Create Advisory]
    F -->|No| I[Continue Pipeline]

    I --> J[Dependabot Vulnerability Check]
    J --> K{Dependency CVEs?}

    K -->|Yes Critical| G
    K -->|Yes Low/Medium| L[Auto-Create PR for Update]
    K -->|No| M[Continue]

    M --> N[Secret Scanning]
    N --> O{Secrets Detected?}

    O -->|Yes| P[Block Immediately + Alert]
    O -->|No| Q[SLSA Provenance Attestation]

    Q --> R[Generate Build Provenance]
    R --> S[Sign with Sigstore]
    S --> T[All Security Checks Passed]

    style A fill:#4caf50
    style T fill:#4caf50
    style G fill:#f44336
    style P fill:#f44336
```

---

## 6. 🌐 Multi-Language Content Flow

```mermaid
flowchart TD
    A[Content Created in English] --> B[Generate Base HTML Structure]
    B --> C[Add Schema.org Metadata]
    C --> D[Add Open Graph Tags]

    D --> E[Translation Pipeline]
    E --> F[Nordic: SV, DA, NO, FI]
    E --> G[European: DE, FR, ES, NL]
    E --> H[Asian: JA, KO, ZH]
    E --> I[RTL: AR, HE]

    F --> J[Validate Nordic Translations]
    G --> K[Validate European Translations]
    H --> L[Validate Asian Translations]
    I --> M[Validate RTL Layout]

    J --> N{All Valid?}
    K --> N
    L --> N
    M --> N

    N -->|No| O[Fix Translation Issues]
    O --> E

    N -->|Yes| P[Update hreflang Tags]
    P --> Q[Update Sitemap.xml]
    Q --> R[Update Language Index Pages]
    R --> S[14 Language Files Ready]

    style A fill:#4caf50
    style S fill:#4caf50
```

---

## 📋 Process Inventory

| # | Process | Trigger | Duration | Frequency |
|---|---------|---------|----------|-----------|
| 1 | Build & Deploy | Git push | 5-8 min | Per commit |
| 2 | News Generation | Cron 02:00 CET | 10-15 min | Daily |
| 3 | CIA Data Pipeline | Cron 03:00 CET | 3-5 min | Daily |
| 4 | User Journey | Page visit | < 3s | On demand |
| 5 | Security Scanning | Code change | 5-10 min | Per commit |
| 6 | Multi-Language | Content creation | 15-30 min | Per article |

---

## 📚 Related Documents

### 🏗️ Architecture Documentation
- [🏗️ Architecture](ARCHITECTURE.md) — C4 models and system structure
- [📊 Data Model](DATA_MODEL.md) — Data entities and relationships
- [🔄 State Diagrams](STATEDIAGRAM.md) — System state transitions
- [🔧 Workflows](WORKFLOWS.md) — CI/CD pipeline documentation
- [🛡️ Security Architecture](SECURITY_ARCHITECTURE.md) — Defense-in-depth controls
- [🎯 Threat Model](THREAT_MODEL.md) — STRIDE threat analysis

### 🚀 Future Architecture
- [🚀 Future Flowcharts](FUTURE_FLOWCHART.md) — Advanced process flows roadmap
- [🏗️ Future Architecture](FUTURE_ARCHITECTURE.md) — System evolution plan
- [📊 Future Data Model](FUTURE_DATA_MODEL.md) — Enhanced data architecture

### 🛡️ ISMS Policies
- [🛠️ Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md)
- [📝 Change Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Change_Management.md)

---

**📋 Document Control:**  
**✅ Approved by:** James Pether Sörling, CEO  
**📤 Distribution:** Public  
**🏷️ Classification:** [![Confidentiality: Public](https://img.shields.io/badge/C-Public-lightgrey?style=flat-square)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md#confidentiality-levels)  
**📅 Effective Date:** 2026-02-20  
**⏰ Next Review:** 2026-05-20  
**🎯 Framework Compliance:** [![ISO 27001](https://img.shields.io/badge/ISO_27001-2022_Aligned-blue?style=flat-square&logo=iso&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) [![NIST CSF 2.0](https://img.shields.io/badge/NIST_CSF-2.0_Aligned-green?style=flat-square&logo=nist&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) [![CIS Controls](https://img.shields.io/badge/CIS_Controls-v8.1_Aligned-orange?style=flat-square&logo=cisecurity&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md)
