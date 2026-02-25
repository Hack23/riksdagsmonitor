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

## 📚 Architecture Documentation Map

| Document | Focus | Description |
|----------|-------|-------------|
| [🏛️ Architecture](ARCHITECTURE.md) | 🏗️ C4 Models | System context, containers, components |
| [📊 Data Model](DATA_MODEL.md) | 📊 Data | Entity relationships and data dictionary |
| **[🔄 Flowchart](FLOWCHART.md)** | **🔄 Processes** | **Business and data flow diagrams** |
| [📈 State Diagram](STATEDIAGRAM.md) | 📈 States | System state transitions and lifecycles |
| [🧠 Mindmap](MINDMAP.md) | 🧠 Concepts | System conceptual relationships |
| [💼 SWOT](SWOT.md) | 💼 Strategy | Strategic analysis and positioning |
| [🛡️ Security Architecture](SECURITY_ARCHITECTURE.md) | 🔒 Security | Current security controls and design |
| [🚀 Future Security](FUTURE_SECURITY_ARCHITECTURE.md) | 🔮 Security | Planned security improvements |
| [🎯 Threat Model](THREAT_MODEL.md) | 🎯 Threats | STRIDE/MITRE ATT&CK analysis |
| [🔧 Workflows](WORKFLOWS.md) | 🔧 DevOps | CI/CD automation and pipelines |
| [🛡️ CRA Assessment](CRA-ASSESSMENT.md) | ⚖️ Compliance | EU Cyber Resilience Act conformity |
| [🚀 Future Architecture](FUTURE_ARCHITECTURE.md) | 🔮 Evolution | Architectural evolution roadmap |
| [📊 Future Data Model](FUTURE_DATA_MODEL.md) | 🔮 Data | Enhanced data architecture plans |
| [🔄 Future Flowchart](FUTURE_FLOWCHART.md) | 🔮 Processes | Improved process workflows |
| [📈 Future State Diagram](FUTURE_STATEDIAGRAM.md) | 🔮 States | Advanced state management |
| [🧠 Future Mindmap](FUTURE_MINDMAP.md) | 🔮 Concepts | Capability expansion plans |
| [💼 Future SWOT](FUTURE_SWOT.md) | 🔮 Strategy | Future strategic opportunities |

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

## 📚 Architecture Documentation Map

| Document | Focus | Description |
|----------|-------|-------------|
| [🏛️ Architecture](ARCHITECTURE.md) | 🏗️ C4 Models | System context, containers, components |
| [📊 Data Model](DATA_MODEL.md) | 📊 Data | Entity relationships and data dictionary |
| **[🔄 Flowchart](FLOWCHART.md)** | **🔄 Processes** | **Business and data flow diagrams** |
| [📈 State Diagram](STATEDIAGRAM.md) | 📈 States | System state transitions and lifecycles |
| [🧠 Mindmap](MINDMAP.md) | 🧠 Concepts | System conceptual relationships |
| [💼 SWOT](SWOT.md) | 💼 Strategy | Strategic analysis and positioning |
| [🛡️ Security Architecture](SECURITY_ARCHITECTURE.md) | 🔒 Security | Current security controls and design |
| [🚀 Future Security](FUTURE_SECURITY_ARCHITECTURE.md) | 🔮 Security | Planned security improvements |
| [🎯 Threat Model](THREAT_MODEL.md) | 🎯 Threats | STRIDE/MITRE ATT&CK analysis |
| [🔧 Workflows](WORKFLOWS.md) | 🔧 DevOps | CI/CD automation and pipelines |
| [🛡️ CRA Assessment](CRA-ASSESSMENT.md) | ⚖️ Compliance | EU Cyber Resilience Act conformity |
| [🚀 Future Architecture](FUTURE_ARCHITECTURE.md) | 🔮 Evolution | Architectural evolution roadmap |
| [📊 Future Data Model](FUTURE_DATA_MODEL.md) | 🔮 Data | Enhanced data architecture plans |
| [🔄 Future Flowchart](FUTURE_FLOWCHART.md) | 🔮 Processes | Improved process workflows |
| [📈 Future State Diagram](FUTURE_STATEDIAGRAM.md) | 🔮 States | Advanced state management |
| [🧠 Future Mindmap](FUTURE_MINDMAP.md) | 🔮 Concepts | Capability expansion plans |
| [💼 Future SWOT](FUTURE_SWOT.md) | 🔮 Strategy | Future strategic opportunities |

---

---

## 7. 🏗️ Complete CI/CD Pipeline Data Flow

```mermaid
flowchart TD
    DEV[Developer Workstation] --> GIT[Git Commit and Push]
    GIT --> GH_TRIGGER[GitHub Actions Triggered]
    GH_TRIGGER --> HARDEN[step-security/harden-runner]
    HARDEN --> EGRESS[Egress Policy Enforcement]
    EGRESS --> CHECKOUT[actions/checkout]
    CHECKOUT --> NODE_SETUP[actions/setup-node v4]
    NODE_SETUP --> NPM_INSTALL[npm ci --frozen-lockfile]
    NPM_INSTALL --> NPM_AUDIT[npm audit --audit-level=high]
    NPM_AUDIT --> AUDIT_RESULT{Audit Result?}
    AUDIT_RESULT -->|Vulnerabilities Found| AUDIT_FAIL[Fail Build + Create Issue]
    AUDIT_RESULT -->|Clean| HTMLHINT[HTMLHint Validation]
    HTMLHINT --> HTML_RESULT{HTML Valid?}
    HTML_RESULT -->|Errors| HTML_FAIL[Report Line Errors]
    HTML_RESULT -->|Valid| ESLINT[ESLint JavaScript Linting]
    ESLINT --> LINT_RESULT{Lint Pass?}
    LINT_RESULT -->|Errors| LINT_FAIL[Block Pipeline]
    LINT_RESULT -->|Clean| VITEST[Vitest Unit Test Suite]
    VITEST --> TEST_RESULT{Tests Pass?}
    TEST_RESULT -->|Failures| TEST_FAIL[Publish Test Report]
    TEST_RESULT -->|Pass| VITE_BUILD[Vite Production Build]
    VITE_BUILD --> BUILD_ARTIFACTS[Build Artifacts Generated]
    BUILD_ARTIFACTS --> CYPRESS[Cypress E2E Test Suite]
    CYPRESS --> E2E_RESULT{E2E Pass?}
    E2E_RESULT -->|Failures| E2E_FAIL[Screenshot Evidence]
    E2E_RESULT -->|Pass| CODEQL[CodeQL Security Analysis]
    CODEQL --> CODEQL_RESULT{Security Issues?}
    CODEQL_RESULT -->|Critical| BLOCK_MERGE[Block Merge + Alert]
    CODEQL_RESULT -->|Low/Med| CREATE_ADVISORY[Create Security Advisory]
    CODEQL_RESULT -->|Clean| DEP_REVIEW[actions/dependency-review-action]
    DEP_REVIEW --> DEP_RESULT{Dependency Issues?}
    DEP_RESULT -->|Found| DEP_PR[Auto-Create Dependabot PR]
    DEP_RESULT -->|Clean| SLSA[SLSA Provenance Generation]
    SLSA --> SIGSTORE[Sigstore Signing]
    SIGSTORE --> DEPLOY[GitHub Pages Deploy]
    DEPLOY --> CDN[AWS CloudFront Invalidation]
    CDN --> PROD[Production Live at riksdagsmonitor.com]

    style DEV fill:#4caf50
    style PROD fill:#4caf50
    style AUDIT_FAIL fill:#f44336
    style HTML_FAIL fill:#f44336
    style LINT_FAIL fill:#f44336
    style TEST_FAIL fill:#f44336
    style E2E_FAIL fill:#f44336
    style BLOCK_MERGE fill:#f44336
```

---

## 8. 📰 News Generation Pipeline Data Flow

```mermaid
flowchart TD
    CRON[Cron Trigger 02:00 CET Daily] --> WORKFLOW[GitHub Actions Workflow]
    WORKFLOW --> MCP_INIT[Initialize MCP Client]
    MCP_INIT --> MCP_SERVER[riksdag-regering-mcp Server]
    MCP_SERVER --> TOOL_LIST[Enumerate 32 Available Tools]
    TOOL_LIST --> FETCH_PROPS[Fetch Government Propositions]
    TOOL_LIST --> FETCH_MOT[Fetch Opposition Motions]
    TOOL_LIST --> FETCH_BET[Fetch Committee Betankanden]
    TOOL_LIST --> FETCH_ANFOR[Fetch Anforanden Speeches]
    TOOL_LIST --> FETCH_VOT[Fetch Voteringar Voting Records]
    FETCH_PROPS --> RAW_DATA[Raw Data Aggregation]
    FETCH_MOT --> RAW_DATA
    FETCH_BET --> RAW_DATA
    FETCH_ANFOR --> RAW_DATA
    FETCH_VOT --> RAW_DATA
    RAW_DATA --> DATA_CHECK{Sufficient Data?}
    DATA_CHECK -->|Less than 5 docs| SKIP[Skip Generation Log]
    DATA_CHECK -->|5+ docs| TRANSFORM[Data Transformation Layer]
    TRANSFORM --> DEDUP[Deduplication Engine]
    DEDUP --> RELEVANCE[Relevance Scoring]
    RELEVANCE --> CONTEXT_BUILD[Context Package Assembly]
    CONTEXT_BUILD --> LLM_PROMPT[Claude Opus Prompt Construction]
    LLM_PROMPT --> BEDROCK[Amazon Bedrock API Call]
    BEDROCK --> LLM_RESPONSE[LLM Response Received]
    LLM_RESPONSE --> QUALITY_CHECK{Quality Score >= 0.8?}
    QUALITY_CHECK -->|Low Quality| RETRY[Retry with Enhanced Prompt]
    RETRY --> BEDROCK
    QUALITY_CHECK -->|High Quality| EN_ARTICLE[English Article Generated]
    EN_ARTICLE --> TRANSLATE_SV[Translate to Swedish]
    EN_ARTICLE --> TRANSLATE_DA[Translate to Danish]
    EN_ARTICLE --> TRANSLATE_NO[Translate to Norwegian]
    EN_ARTICLE --> TRANSLATE_FI[Translate to Finnish]
    EN_ARTICLE --> TRANSLATE_DE[Translate to German]
    EN_ARTICLE --> TRANSLATE_FR[Translate to French]
    EN_ARTICLE --> TRANSLATE_ES[Translate to Spanish]
    EN_ARTICLE --> TRANSLATE_NL[Translate to Dutch]
    EN_ARTICLE --> TRANSLATE_AR[Translate to Arabic RTL]
    EN_ARTICLE --> TRANSLATE_HE[Translate to Hebrew RTL]
    EN_ARTICLE --> TRANSLATE_JA[Translate to Japanese]
    EN_ARTICLE --> TRANSLATE_KO[Translate to Korean]
    EN_ARTICLE --> TRANSLATE_ZH[Translate to Chinese]
    TRANSLATE_SV --> SCHEMA_ORG[Schema.org NewsArticle Markup]
    TRANSLATE_DA --> SCHEMA_ORG
    TRANSLATE_NO --> SCHEMA_ORG
    TRANSLATE_FI --> SCHEMA_ORG
    TRANSLATE_DE --> SCHEMA_ORG
    TRANSLATE_FR --> SCHEMA_ORG
    TRANSLATE_ES --> SCHEMA_ORG
    TRANSLATE_NL --> SCHEMA_ORG
    TRANSLATE_AR --> SCHEMA_ORG
    TRANSLATE_HE --> SCHEMA_ORG
    TRANSLATE_JA --> SCHEMA_ORG
    TRANSLATE_KO --> SCHEMA_ORG
    TRANSLATE_ZH --> SCHEMA_ORG
    SCHEMA_ORG --> OG_TAGS[Open Graph Meta Tags]
    OG_TAGS --> HREFLANG[Hreflang Alternate Links]
    HREFLANG --> HTML_VALIDATE[HTMLHint Validation]
    HTML_VALIDATE --> HTML_OK{Valid HTML?}
    HTML_OK -->|Errors| FIX_HTML[Fix Template Errors]
    FIX_HTML --> HTML_VALIDATE
    HTML_OK -->|Valid| GIT_COMMIT[Git Commit with Metadata]
    GIT_COMMIT --> CREATE_PR[Create Pull Request]
    CREATE_PR --> HUMAN_REVIEW[Human Review Queue]
    HUMAN_REVIEW --> REVIEW_DECISION{Approved?}
    REVIEW_DECISION -->|Rejected| DISCARD[Discard Article]
    REVIEW_DECISION -->|Approved| MERGE[Merge to Main]
    MERGE --> DEPLOY_PIPELINE[Deployment Pipeline]
    DEPLOY_PIPELINE --> NEWS_LIVE[News Article Live in 14 Languages]

    style CRON fill:#2196f3
    style NEWS_LIVE fill:#4caf50
    style SKIP fill:#ff9800
    style DISCARD fill:#f44336
```

---

## 9. 📊 CIA Data Integration Data Flow

```mermaid
flowchart TD
    CRON2[Cron Trigger 03:00 CET Daily] --> CIA_FETCH[Fetch CIA Platform JSON Export]
    CIA_FETCH --> CIA_URL[https://cia.hack23.com/api/export]
    CIA_URL --> HTTP_CHECK{HTTP Response?}
    HTTP_CHECK -->|4xx/5xx| ERROR_LOG[Log Error + Use Cache]
    HTTP_CHECK -->|200 OK| SCHEMA_VAL[JSON Schema Validation]
    SCHEMA_VAL --> SCHEMA_CHECK{Schema Valid?}
    SCHEMA_CHECK -->|Invalid| SCHEMA_ERROR[Log Schema Error + Use Cache]
    SCHEMA_CHECK -->|Valid| PARSE[Parse JSON Data]
    PARSE --> PARTY_DATA[Party Statistics Extraction]
    PARSE --> MEMBER_DATA[Member Records Extraction]
    PARSE --> VOTE_DATA[Voting Records Extraction]
    PARSE --> COMMITTEE_DATA[Committee Data Extraction]
    PARSE --> DOCUMENT_DATA[Document Statistics Extraction]
    PARTY_DATA --> TRANSFORM_PARTY[Transform Party Stats]
    MEMBER_DATA --> TRANSFORM_MEMBERS[Transform Member Data]
    VOTE_DATA --> TRANSFORM_VOTES[Transform Vote Patterns]
    COMMITTEE_DATA --> TRANSFORM_COMMITTEES[Transform Committee Data]
    DOCUMENT_DATA --> TRANSFORM_DOCS[Transform Document Stats]
    TRANSFORM_PARTY --> DATA_MERGE[Data Merge Layer]
    TRANSFORM_MEMBERS --> DATA_MERGE
    TRANSFORM_VOTES --> DATA_MERGE
    TRANSFORM_COMMITTEES --> DATA_MERGE
    TRANSFORM_DOCS --> DATA_MERGE
    DATA_MERGE --> CACHE_WRITE[Write to Local Cache]
    CACHE_WRITE --> FRESHNESS_TAG[Tag with Timestamp]
    FRESHNESS_TAG --> INTEGRITY_HASH[Compute Integrity Hash]
    INTEGRITY_HASH --> CACHE_STORE[Store in cia-data/ Directory]
    CACHE_STORE --> DASHBOARD_RENDER[Dashboard Rendering Engine]
    DASHBOARD_RENDER --> CHART_DATA[Chart.js Data Preparation]
    CHART_DATA --> PARTY_CHARTS[Party Distribution Charts]
    CHART_DATA --> MEMBER_CHARTS[Member Activity Charts]
    CHART_DATA --> VOTE_CHARTS[Voting Pattern Charts]
    CHART_DATA --> COMMITTEE_CHARTS[Committee Charts]
    PARTY_CHARTS --> HTML_INJECT[Inject into Dashboard HTML]
    MEMBER_CHARTS --> HTML_INJECT
    VOTE_CHARTS --> HTML_INJECT
    COMMITTEE_CHARTS --> HTML_INJECT
    HTML_INJECT --> RESPONSIVE_CHECK[Responsive Layout Validation]
    RESPONSIVE_CHECK --> A11Y_CHECK[Accessibility Audit]
    A11Y_CHECK --> FINAL_DASHBOARD[Dashboard Ready]
    ERROR_LOG --> STALE_BANNER[Show Stale Data Banner]
    SCHEMA_ERROR --> STALE_BANNER
    STALE_BANNER --> FINAL_DASHBOARD

    style CRON2 fill:#2196f3
    style FINAL_DASHBOARD fill:#4caf50
    style ERROR_LOG fill:#ff9800
    style SCHEMA_ERROR fill:#ff9800
```

---

## 10. 🌐 User Request Data Flow

```mermaid
flowchart LR
    USER[User Browser] --> DNS[DNS Resolution]
    DNS --> ROUTE53[AWS Route 53]
    ROUTE53 --> HEALTH{Origin Healthy?}
    HEALTH -->|Healthy| CLOUDFRONT[AWS CloudFront CDN]
    HEALTH -->|Unhealthy| GHPAGES[GitHub Pages Fallback]
    CLOUDFRONT --> CACHE_HIT{Cache Hit?}
    CACHE_HIT -->|Hit| CACHED_RESP[Serve Cached Response]
    CACHE_HIT -->|Miss| S3_ORIGIN[S3 Origin Fetch]
    S3_ORIGIN --> REGION_CHECK{Primary Region?}
    REGION_CHECK -->|us-east-1 Up| S3_PRIMARY[S3 us-east-1]
    REGION_CHECK -->|us-east-1 Down| S3_SECONDARY[S3 eu-west-1]
    S3_PRIMARY --> TLS_RESP[TLS 1.3 Encrypted Response]
    S3_SECONDARY --> TLS_RESP
    TLS_RESP --> CLOUDFRONT
    CACHED_RESP --> BROWSER_RENDER[Browser Renders HTML]
    CLOUDFRONT --> BROWSER_RENDER
    GHPAGES --> BROWSER_RENDER
    BROWSER_RENDER --> CSS_LOAD[Load styles.css]
    BROWSER_RENDER --> JS_LOAD[Load Modules from js/]
    BROWSER_RENDER --> LANG_DETECT[Language Detection]
    LANG_DETECT --> LANG_REDIRECT{User Language?}
    LANG_REDIRECT -->|SV| SV_PAGE[index_sv.html]
    LANG_REDIRECT -->|DE| DE_PAGE[index_de.html]
    LANG_REDIRECT -->|FR| FR_PAGE[index_fr.html]
    LANG_REDIRECT -->|Other| EN_PAGE[index.html]
    SV_PAGE --> CHARTJS[Chart.js Initialization]
    DE_PAGE --> CHARTJS
    FR_PAGE --> CHARTJS
    EN_PAGE --> CHARTJS
    CHARTJS --> CIA_API[Fetch CIA Data JSON]
    CIA_API --> RENDER_CHARTS[Render Interactive Charts]
    RENDER_CHARTS --> LANG_SWITCHER[Language Switcher Component]
    LANG_SWITCHER --> FINAL_PAGE[Complete Interactive Page]

    style USER fill:#4caf50
    style FINAL_PAGE fill:#4caf50
    style GHPAGES fill:#ff9800
```

---

## 11. 🔒 Security Scanning Data Flow

```mermaid
flowchart TD
    CODE_CHANGE[Code Change or PR Created] --> SECURITY_PIPELINE[Security Pipeline Triggered]
    SECURITY_PIPELINE --> HARDEN_RUNNER[step-security/harden-runner]
    HARDEN_RUNNER --> EGRESS_AUDIT[Egress Traffic Audit Log]
    EGRESS_AUDIT --> PARALLEL_SCANS[Parallel Security Scans]
    PARALLEL_SCANS --> CODEQL_SCAN[CodeQL JavaScript/TypeScript Analysis]
    PARALLEL_SCANS --> DEP_SCAN[Dependency Vulnerability Scan]
    PARALLEL_SCANS --> SECRET_SCAN[GitHub Secret Scanning]
    PARALLEL_SCANS --> SCORECARD[OpenSSF Scorecard]
    CODEQL_SCAN --> CODEQL_QUERIES[Run CWE Query Suite]
    CODEQL_QUERIES --> XSS_CHECK[XSS Vulnerability Detection]
    CODEQL_QUERIES --> INJECTION_CHECK[Injection Pattern Detection]
    CODEQL_QUERIES --> DATAFLOW_CHECK[Data Flow Analysis]
    XSS_CHECK --> CODEQL_RESULTS[CodeQL Results]
    INJECTION_CHECK --> CODEQL_RESULTS
    DATAFLOW_CHECK --> CODEQL_RESULTS
    CODEQL_RESULTS --> CODEQL_SEVERITY{Severity?}
    CODEQL_SEVERITY -->|Critical/High| BLOCK_PR[Block PR Merge]
    CODEQL_SEVERITY -->|Medium/Low| CODEQL_ADVISORY[Create GitHub Advisory]
    CODEQL_SEVERITY -->|None| CODEQL_PASS[CodeQL Pass]
    DEP_SCAN --> DEP_CVE[CVE Database Lookup]
    DEP_CVE --> DEP_NVDB[National Vulnerability Database]
    DEP_NVDB --> DEP_SEVERITY{CVE Severity?}
    DEP_SEVERITY -->|Critical| BLOCK_PR
    DEP_SEVERITY -->|High| DEP_AUTO_PR[Auto Dependabot PR]
    DEP_SEVERITY -->|Low/Med| DEP_TRACK[Track in Security Tab]
    DEP_SEVERITY -->|None| DEP_PASS[Dependencies Pass]
    SECRET_SCAN --> PATTERN_MATCH[Pattern Matching Engine]
    PATTERN_MATCH --> TOKEN_DETECT[API Key Patterns]
    TOKEN_DETECT --> SECRET_RESULT{Secret Found?}
    SECRET_RESULT -->|Yes| IMMEDIATE_BLOCK[Immediate Block + Alert Owner]
    SECRET_RESULT -->|No| SECRET_PASS[Secret Scan Pass]
    SCORECARD --> BRANCH_PROT[Branch Protection Score]
    SCORECARD --> TOKEN_PERMS[Token Permissions Score]
    SCORECARD --> SIGNED_RELEASES[Signed Releases Score]
    SCORECARD --> DEPENDENCY_PINNED[Dependency Pinning Score]
    BRANCH_PROT --> SCORECARD_TOTAL[Overall Scorecard Score]
    TOKEN_PERMS --> SCORECARD_TOTAL
    SIGNED_RELEASES --> SCORECARD_TOTAL
    DEPENDENCY_PINNED --> SCORECARD_TOTAL
    SCORECARD_TOTAL --> BADGE_UPDATE[Update README Badge]
    CODEQL_PASS --> ALL_PASS{All Scans Pass?}
    DEP_PASS --> ALL_PASS
    SECRET_PASS --> ALL_PASS
    BADGE_UPDATE --> ALL_PASS
    ALL_PASS -->|Yes| SLSA_ATTEST[SLSA Provenance Attestation]
    SLSA_ATTEST --> SIGN[Sigstore Signing]
    SIGN --> BUILD_PROVENANCE[Build Provenance Record]
    BUILD_PROVENANCE --> MERGE_ALLOWED[PR Merge Allowed]
    ALL_PASS -->|No| BLOCK_PR

    style CODE_CHANGE fill:#4caf50
    style MERGE_ALLOWED fill:#4caf50
    style BLOCK_PR fill:#f44336
    style IMMEDIATE_BLOCK fill:#f44336
```

---

## 12. 🌐 Multi-Language Content Pipeline

```mermaid
flowchart TD
    SOURCE_EN[Source English Content] --> TEMPLATE[HTML Template Engine]
    TEMPLATE --> BASE_HTML[Base HTML Structure]
    BASE_HTML --> META_LAYER[Metadata Layer]
    META_LAYER --> SCHEMA_NEWS[Schema.org NewsArticle]
    META_LAYER --> OG_META[Open Graph Protocol]
    META_LAYER --> TWITTER_CARD[Twitter Card Tags]
    META_LAYER --> CANONICAL[Canonical URL]
    SCHEMA_NEWS --> HREFLANG_GEN[Hreflang Tag Generator]
    OG_META --> HREFLANG_GEN
    TWITTER_CARD --> HREFLANG_GEN
    CANONICAL --> HREFLANG_GEN
    HREFLANG_GEN --> TRANSLATE_ENGINE[Translation Engine]
    TRANSLATE_ENGINE --> NORDIC_BRANCH[Nordic Language Branch]
    TRANSLATE_ENGINE --> CENTRAL_EU_BRANCH[Central European Branch]
    TRANSLATE_ENGINE --> ROMANCE_BRANCH[Romance Language Branch]
    TRANSLATE_ENGINE --> ASIAN_BRANCH[Asian Language Branch]
    TRANSLATE_ENGINE --> RTL_BRANCH[RTL Language Branch]
    NORDIC_BRANCH --> SWEDISH[SV Swedish - index_sv.html]
    NORDIC_BRANCH --> DANISH[DA Danish - index_da.html]
    NORDIC_BRANCH --> NORWEGIAN[NO Norwegian - index_no.html]
    NORDIC_BRANCH --> FINNISH[FI Finnish - index_fi.html]
    CENTRAL_EU_BRANCH --> GERMAN[DE German - index_de.html]
    CENTRAL_EU_BRANCH --> DUTCH[NL Dutch - index_nl.html]
    ROMANCE_BRANCH --> FRENCH[FR French - index_fr.html]
    ROMANCE_BRANCH --> SPANISH[ES Spanish - index_es.html]
    ASIAN_BRANCH --> JAPANESE[JA Japanese - index_ja.html]
    ASIAN_BRANCH --> KOREAN[KO Korean - index_ko.html]
    ASIAN_BRANCH --> CHINESE[ZH Chinese - index_zh.html]
    RTL_BRANCH --> ARABIC[AR Arabic - index_ar.html]
    RTL_BRANCH --> HEBREW[HE Hebrew - index_he.html]
    SWEDISH --> VALIDATE_NORDIC[Validate Nordic Scripts]
    DANISH --> VALIDATE_NORDIC
    NORWEGIAN --> VALIDATE_NORDIC
    FINNISH --> VALIDATE_NORDIC
    GERMAN --> VALIDATE_EU[Validate EU Languages]
    DUTCH --> VALIDATE_EU
    FRENCH --> VALIDATE_EU
    SPANISH --> VALIDATE_EU
    JAPANESE --> VALIDATE_ASIAN[Validate Asian Scripts]
    KOREAN --> VALIDATE_ASIAN
    CHINESE --> VALIDATE_ASIAN
    ARABIC --> VALIDATE_RTL[Validate RTL Layout]
    HEBREW --> VALIDATE_RTL
    VALIDATE_NORDIC --> SITEMAP_UPDATE[Update Sitemap Files]
    VALIDATE_EU --> SITEMAP_UPDATE
    VALIDATE_ASIAN --> SITEMAP_UPDATE
    VALIDATE_RTL --> SITEMAP_UPDATE
    SITEMAP_UPDATE --> SITEMAP_EN[sitemap.html]
    SITEMAP_UPDATE --> SITEMAP_SV[sitemap_sv.html]
    SITEMAP_UPDATE --> SITEMAP_OTHERS[sitemap_xx.html x12]
    SITEMAP_EN --> SEO_AUDIT[SEO Quality Audit]
    SITEMAP_SV --> SEO_AUDIT
    SITEMAP_OTHERS --> SEO_AUDIT
    SEO_AUDIT --> SEO_CHECK{SEO Valid?}
    SEO_CHECK -->|Issues| SEO_FIX[Fix Meta Tags]
    SEO_FIX --> SEO_AUDIT
    SEO_CHECK -->|Valid| ALL_14_READY[14 Language Files Ready]

    style SOURCE_EN fill:#4caf50
    style ALL_14_READY fill:#4caf50
    style SEO_FIX fill:#ff9800
```

---

## 13. ✅ Data Validation and Quality Check Flow

```mermaid
flowchart TD
    DATA_INGEST[Data Ingestion from Riksdag API] --> SCHEMA_VAL[JSON Schema Validation]
    SCHEMA_VAL --> SCHEMA_OK{Schema Valid?}
    SCHEMA_OK -->|Invalid| SCHEMA_ERR[Log Schema Violation]
    SCHEMA_ERR --> FALLBACK_CACHE[Load from Cache]
    SCHEMA_OK -->|Valid| TYPE_CHECK[Type Coercion Check]
    TYPE_CHECK --> NULL_CHECK[Null Value Inspection]
    NULL_CHECK --> REQUIRED_CHECK[Required Fields Check]
    REQUIRED_CHECK --> REQUIRED_OK{All Required Fields Present?}
    REQUIRED_OK -->|Missing| FILL_DEFAULTS[Apply Default Values]
    FILL_DEFAULTS --> RANGE_CHECK
    REQUIRED_OK -->|Present| RANGE_CHECK[Numeric Range Validation]
    RANGE_CHECK --> RANGE_OK{Values in Range?}
    RANGE_OK -->|Out of Range| CLAMP[Clamp to Valid Range + Flag]
    CLAMP --> DATE_CHECK
    RANGE_OK -->|In Range| DATE_CHECK[Date Format Validation]
    DATE_CHECK --> DATE_OK{Dates Valid?}
    DATE_OK -->|Invalid| DATE_FIX[Normalize Date Formats]
    DATE_FIX --> ENCODING_CHECK
    DATE_OK -->|Valid| ENCODING_CHECK[Character Encoding Check UTF-8]
    ENCODING_CHECK --> ENCODE_OK{UTF-8 Valid?}
    ENCODE_OK -->|Invalid| ENCODE_FIX[Re-encode to UTF-8]
    ENCODE_FIX --> DEDUP_CHECK
    ENCODE_OK -->|Valid| DEDUP_CHECK[Duplicate Detection]
    DEDUP_CHECK --> DUP_FOUND{Duplicates?}
    DUP_FOUND -->|Yes| DEDUP_REMOVE[Remove Duplicates]
    DEDUP_REMOVE --> SEMANTIC_CHECK
    DUP_FOUND -->|No| SEMANTIC_CHECK[Semantic Consistency Check]
    SEMANTIC_CHECK --> CROSS_REF[Cross-Reference Validation]
    CROSS_REF --> XREF_OK{Cross-References Valid?}
    XREF_OK -->|Broken| XREF_FIX[Flag Broken References]
    XREF_FIX --> QUALITY_SCORE
    XREF_OK -->|Valid| QUALITY_SCORE[Compute Quality Score 0-100]
    QUALITY_SCORE --> SCORE_THRESHOLD{Score >= 75?}
    SCORE_THRESHOLD -->|Below Threshold| QUARANTINE[Quarantine for Review]
    SCORE_THRESHOLD -->|Above Threshold| APPROVED_DATA[Data Approved for Use]
    APPROVED_DATA --> HASH_SIGN[Compute SHA-256 Hash]
    HASH_SIGN --> STORE_VALIDATED[Store Validated Data]
    FALLBACK_CACHE --> STALE_FLAG[Mark Data as Stale]

    style DATA_INGEST fill:#2196f3
    style APPROVED_DATA fill:#4caf50
    style SCHEMA_ERR fill:#f44336
    style QUARANTINE fill:#ff9800
    style STALE_FLAG fill:#ff9800
```

---

## 14. 🔏 Content Integrity and Audit Trail Flow

```mermaid
flowchart TD
    CONTENT_CREATE[Content Created by Pipeline] --> METADATA[Attach Content Metadata]
    METADATA --> TIMESTAMP[UTC Timestamp]
    METADATA --> PIPELINE_ID[Pipeline Run ID]
    METADATA --> DATA_SOURCES[Source Data References]
    METADATA --> AUTHOR[Generation Method: LLM or Template]
    TIMESTAMP --> HASH_COMPUTE[Compute SHA-256 Hash]
    PIPELINE_ID --> HASH_COMPUTE
    DATA_SOURCES --> HASH_COMPUTE
    AUTHOR --> HASH_COMPUTE
    HASH_COMPUTE --> CONTENT_HASH[Content Hash Digest]
    CONTENT_HASH --> GIT_STAGE[Stage in Git]
    GIT_STAGE --> GIT_COMMIT[Git Commit with Signed Message]
    GIT_COMMIT --> COMMIT_HASH[Git Commit SHA]
    COMMIT_HASH --> PROVENANCE[SLSA Provenance Record]
    PROVENANCE --> SIGSTORE[Sigstore Transparency Log]
    SIGSTORE --> AUDIT_TRAIL[Immutable Audit Trail]
    AUDIT_TRAIL --> GH_AUDIT[GitHub Audit Log]
    AUDIT_TRAIL --> COMMIT_LOG[Git Commit Log]
    AUDIT_TRAIL --> SLSA_LOG[SLSA Build Log]
    GH_AUDIT --> INTEGRITY_MONITOR[Integrity Monitor]
    COMMIT_LOG --> INTEGRITY_MONITOR
    SLSA_LOG --> INTEGRITY_MONITOR
    INTEGRITY_MONITOR --> TAMPER_DETECT{Tamper Detected?}
    TAMPER_DETECT -->|Yes| INCIDENT_ALERT[Trigger Incident Response]
    INCIDENT_ALERT --> CONTENT_QUARANTINE[Quarantine Affected Content]
    CONTENT_QUARANTINE --> ROLLBACK[Git Revert to Last Known Good]
    TAMPER_DETECT -->|No| INTEGRITY_CONFIRMED[Integrity Confirmed]
    INTEGRITY_CONFIRMED --> PUBLISH_GATE[Publishing Gate]
    PUBLISH_GATE --> PUBLISHED[Content Published]

    style CONTENT_CREATE fill:#2196f3
    style PUBLISHED fill:#4caf50
    style INCIDENT_ALERT fill:#f44336
    style CONTENT_QUARANTINE fill:#f44336
```

---

## 15. 🏗️ GitHub Actions Runner Hardening Flow

```mermaid
flowchart TD
    RUNNER_START[GitHub Actions Runner Starts] --> HARDEN_INIT[step-security/harden-runner Action]
    HARDEN_INIT --> POLICY_LOAD[Load Egress Policy]
    POLICY_LOAD --> ALLOWED_DOMAINS[Allowed Domains Whitelist]
    ALLOWED_DOMAINS --> GITHUB_COM[github.com]
    ALLOWED_DOMAINS --> NPM_REG[registry.npmjs.org]
    ALLOWED_DOMAINS --> CODEQL_CDN[codeql.github.com]
    ALLOWED_DOMAINS --> SIGSTORE[sigstore.dev]
    GITHUB_COM --> IPTABLES[iptables Rules Applied]
    NPM_REG --> IPTABLES
    CODEQL_CDN --> IPTABLES
    SIGSTORE --> IPTABLES
    IPTABLES --> NETMON[Network Traffic Monitor]
    NETMON --> TRAFFIC_CAPTURE[Capture All Egress]
    TRAFFIC_CAPTURE --> ALLOWED_CHECK{Destination Allowed?}
    ALLOWED_CHECK -->|Allowed| PERMIT[Permit Traffic]
    ALLOWED_CHECK -->|Blocked| DENY_LOG[Log Denied Traffic]
    DENY_LOG --> ALERT_EGRESS[Alert Security Team]
    PERMIT --> JOB_EXEC[Job Steps Execute]
    JOB_EXEC --> STEP_PERMISSIONS[Per-Step Token Permissions]
    STEP_PERMISSIONS --> CHECKOUT_PERM[checkout: read contents]
    STEP_PERMISSIONS --> DEPLOY_PERM[deploy: write pages]
    STEP_PERMISSIONS --> SECURITY_PERM[security-events: write]
    CHECKOUT_PERM --> AUDIT_EVENT[Audit Event Emitted]
    DEPLOY_PERM --> AUDIT_EVENT
    SECURITY_PERM --> AUDIT_EVENT
    AUDIT_EVENT --> GH_AUDIT_LOG[GitHub Audit Log]
    JOB_EXEC --> JOB_COMPLETE[Job Completes]
    JOB_COMPLETE --> RUNNER_TEARDOWN[Runner Ephemeral Teardown]
    RUNNER_TEARDOWN --> NO_PERSIST[No Data Persists]

    style RUNNER_START fill:#2196f3
    style NO_PERSIST fill:#4caf50
    style DENY_LOG fill:#f44336
    style ALERT_EGRESS fill:#f44336
```

---

## Updated Process Inventory

| # | Process | Trigger | Duration | Frequency | Security Controls |
|---|---------|---------|----------|-----------|-------------------|
| 1 | Build and Deploy | Git push | 5-8 min | Per commit | SLSA, CodeQL, harden-runner |
| 2 | News Generation | Cron 02:00 CET | 10-15 min | Daily | Data validation, HTMLHint |
| 3 | CIA Data Pipeline | Cron 03:00 CET | 3-5 min | Daily | Schema validation, integrity hash |
| 4 | User Journey | Page visit | < 3s | On demand | TLS 1.3, CSP headers, HSTS |
| 5 | Security Scanning | Code change | 5-10 min | Per commit | CodeQL, Dependabot, secret scan |
| 6 | Multi-Language | Content creation | 15-30 min | Per article | HTMLHint, schema validation |
| 7 | CI/CD Full Pipeline | Git push | 8-12 min | Per commit | Full security gate suite |
| 8 | MCP News Pipeline | Cron daily | 10-15 min | Daily | LLM quality check |
| 9 | CIA Data Integration | Cron daily | 3-5 min | Daily | Schema validate, integrity hash |
| 10 | Data Validation | Per data fetch | 1-2 min | Per fetch | 9-stage validation pipeline |
| 11 | Content Integrity | Per content | < 1 min | Per article | Git signatures, Sigstore (build artifacts) |
| 12 | Runner Hardening | Per job | Continuous | Per job | iptables, egress audit |

---

**📋 Document Control:**  
**✅ Approved by:** James Pether Sörling, CEO  
**📤 Distribution:** Public  
**🏷️ Classification:** [![Confidentiality: Public](https://img.shields.io/badge/C-Public-lightgrey?style=flat-square)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md#confidentiality-levels)  
**📅 Effective Date:** 2026-02-25  
**⏰ Next Review:** 2026-05-25  
**🎯 Framework Compliance:** [![ISO 27001](https://img.shields.io/badge/ISO_27001-2022_Aligned-blue?style=flat-square&logo=iso&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) [![NIST CSF 2.0](https://img.shields.io/badge/NIST_CSF-2.0_Aligned-green?style=flat-square&logo=nist&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) [![CIS Controls](https://img.shields.io/badge/CIS_Controls-v8.1_Aligned-orange?style=flat-square&logo=cisecurity&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md)
