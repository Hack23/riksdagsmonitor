# 🕵️ Riksdagsmonitor Intelligence Platform — API Reference

> **Political Intelligence Analysis & OSINT Platform for Swedish Parliament Monitoring**

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](https://github.com/Hack23/riksdagsmonitor/blob/main/LICENSE)
[![TypeDoc](https://img.shields.io/badge/docs-TypeDoc-blue.svg)](https://riksdagsmonitor.com/api/)

---

## Overview

This API documentation covers the complete **Riksdagsmonitor Intelligence Platform** — a mixed TypeScript & JavaScript codebase implementing sophisticated intelligence collection, analysis, and visualization for democratic transparency.

### Platform Scope

| Layer | Technology | Files | Description |
|-------|-----------|-------|-------------|
| **Dashboard Visualizations** | JavaScript + Chart.js / D3.js | 14 modules | Interactive political intelligence dashboards |
| **Data Pipeline** | JavaScript | 5 modules | CIA data loading, i18n, and visualization orchestration |
| **News Generation** | TypeScript | 15+ modules | Automated intelligence reporting with 14-language support |
| **Type System** | TypeScript | 9 modules | Strict type definitions for the intelligence domain |
| **Utilities** | TypeScript / JavaScript | 10+ modules | Data validation, schema processing, and tooling |

---

## Intelligence Capabilities

### 🔍 OSINT Data Collection
- **`stats-loader`** / **`cia-data-loader`** — Multi-source data acquisition with fallback strategies
- Source credibility verification and data integrity validation
- GDPR-compliant political data processing

### ⚠️ Risk Assessment & Anomaly Detection
- **`risk-dashboard`** / **`anomaly-detection-dashboard`** — 45-rule risk scoring engine for 349 MPs
- STRIDE threat modeling integration
- Behavioral anomaly detection algorithms

### 📊 Predictive Intelligence
- **`election-predictions`** / **`pre-election-dashboard`** — Electoral forecasting models
- Coalition probability analysis and seat prediction algorithms
- Confidence interval calculations

### 🏛️ Political Analysis Dashboards
- **`politician-dashboard`** / **`party-dashboard`** / **`ministry-dashboard`** — Career trajectory analytics
- Voting discipline measurement and influence metrics
- Committee effectiveness evaluation

### 📅 Temporal Pattern Analysis
- **`seasonal-patterns-dashboard`** / **`election-cycle-dashboard`** — Legislative activity cycles
- Pre-election behavioral shifts and long-term political trends

### 🤝 Coalition Intelligence
- **`coalition-loader`** / **`coalition-dashboard`** — Coalition stability assessment
- Voting bloc analysis and cross-party cooperation patterns

### 📰 Intelligence Reporting
- **`generate-news-enhanced`** / **`article-template`** — Automated news generation
- 14-language narrative synthesis (EN, SV, DA, NO, FI, DE, FR, ES, NL, AR, HE, JA, KO, ZH)
- Editorial standards enforcement with quality scoring

---

## Architecture

```
riksdagsmonitor/
├── js/                          # Browser dashboard modules (14 files)
│   ├── chart-utils.js           # Chart.js utility functions
│   ├── stats-loader.js          # CIA statistics data loader
│   ├── coalition-loader.js      # Coalition data processing
│   ├── risk-dashboard.js        # Risk assessment engine
│   ├── party-dashboard.js       # Party analytics
│   ├── politician-dashboard.js  # MP profiling
│   ├── ministry-dashboard.js    # Government analysis
│   ├── election-cycle-dashboard.js
│   ├── pre-election-dashboard.js
│   ├── seasonal-patterns-dashboard.js
│   ├── anomaly-detection-dashboard.js
│   └── ...
├── dashboard/                   # Dashboard infrastructure (5 files)
│   ├── cia-data-loader.js       # CIA data pipeline
│   ├── cia-visualizations.js    # Visualization engine
│   ├── dashboard-init.js        # Initialization orchestrator
│   ├── election-predictions.js  # Forecasting models
│   └── i18n-translations.js     # 14-language translations
├── scripts/                     # Build & automation (42 files)
│   ├── types/                   # TypeScript type definitions (9 files)
│   ├── news-types/              # Article generators (5 files)
│   ├── data-transformers.ts     # Data transformation pipeline
│   ├── generate-news-enhanced.ts # News generation engine
│   ├── mcp-client.ts            # MCP JSON-RPC client
│   ├── article-template.ts      # HTML article rendering
│   └── ...
└── tests/                       # Test suite (35 files, 1188 tests)
```

---

## Documentation Standards

All documentation follows **intelligence analysis conventions**:

| Tag | Purpose |
|-----|---------|
| `@module` | Intelligence capability module (e.g., "OSINT/DataAcquisition") |
| `@category` | Intelligence domain grouping |
| `@param` / `@returns` | Function signatures with type information |
| `@example` | Usage examples |
| `@see` | Cross-references to related modules |

---

## Compliance & Security

This platform aligns with:
- **[SECURITY_ARCHITECTURE.md](https://github.com/Hack23/riksdagsmonitor/blob/main/SECURITY_ARCHITECTURE.md)** — ISO 27001:2022, NIST CSF 2.0, CIS Controls v8.1
- **[THREAT_MODEL.md](https://github.com/Hack23/riksdagsmonitor/blob/main/THREAT_MODEL.md)** — STRIDE threat analysis
- **[ARCHITECTURE.md](https://github.com/Hack23/riksdagsmonitor/blob/main/ARCHITECTURE.md)** — C4 model system architecture
- **[DATA_MODEL.md](https://github.com/Hack23/riksdagsmonitor/blob/main/DATA_MODEL.md)** — CIA platform data schemas

---

## Links

- **Live Platform**: [riksdagsmonitor.com](https://riksdagsmonitor.com)
- **Repository**: [github.com/Hack23/riksdagsmonitor](https://github.com/Hack23/riksdagsmonitor)
- **CIA Data Platform**: [github.com/Hack23/cia](https://github.com/Hack23/cia)
- **ISMS Documentation**: [github.com/Hack23/ISMS-PUBLIC](https://github.com/Hack23/ISMS-PUBLIC)

---

**Mission**: Systematic political transparency through rigorous intelligence analysis  
**License**: Apache-2.0  
**Maintained by**: [Hack23 AB](https://hack23.com)
