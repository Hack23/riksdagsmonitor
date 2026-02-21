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
| **Browser Dashboards** | TypeScript + Chart.js / D3.js | 27 modules | Interactive political intelligence dashboards with bounded contexts |
| **Shared Infrastructure** | TypeScript | 7 modules | Types, theme, chart factory, data loader, DOM utils, logger |
| **CIA Intelligence** | TypeScript | 5 modules | CIA data pipeline, visualizations, election predictions, i18n |
| **News Generation** | TypeScript | 15+ modules | Automated intelligence reporting with 14-language support |
| **Type System** | TypeScript | 9 modules | Strict type definitions for the intelligence domain |
| **Build & Automation** | TypeScript / Vite | 10+ modules | Data validation, schema processing, and tooling |

---

## Three-Lens Documentation Framework

Every module in this API is documented through three strategic lenses:

### 🔍 Intelligence Perspective (`@intelligence`)
OSINT analysis methodology, data acquisition pipelines, risk assessment frameworks,
behavioral profiling models, and intelligence product design. Each module describes
its role in the intelligence collection-analysis-dissemination cycle.

### 💼 Business Perspective (`@business`)
Revenue model alignment, customer segment value delivery, competitive differentiation,
partnership opportunity, and scalability architecture. Evaluates each module's contribution
to the platform's commercial sustainability and market position.

### 📢 Marketing Perspective (`@marketing`)
Target audience engagement, content generation capability, SEO value, social media
shareability, and brand positioning contribution. Maps each module to specific
growth channels and user acquisition strategies.

---

## Intelligence Capabilities

### 🔍 OSINT Data Collection
- **`stats-loader`** / **`cia/data-loader`** — Multi-source data acquisition with fallback strategies
- Source credibility verification and data integrity validation
- GDPR-compliant political data processing

### ⚠️ Risk Assessment & Anomaly Detection
- **`risk-dashboard`** / **`anomaly-detection`** — 45-rule risk scoring engine for 349 MPs
- STRIDE threat modeling integration
- Z-score anomaly detection (|Z| >= 2.0 threshold)

### 📊 Predictive Intelligence
- **`cia/election-predictions`** / **`pre-election`** — Electoral forecasting models
- Coalition probability analysis and seat prediction algorithms
- Confidence interval calculations

### 🏛️ Political Analysis Dashboards
- **`politician-dashboard`** / **`party-dashboard`** / **`ministry-dashboard`** — Career trajectory analytics
- Voting discipline measurement and influence metrics
- Committee effectiveness evaluation

### 📅 Temporal Pattern Analysis
- **`seasonal-patterns`** / **`election-cycle`** — Legislative activity cycles
- Pre-election behavioral shifts and long-term political trends

### 🤝 Coalition Intelligence
- **`coalition-loader`** / **`coalition-dashboard`** — Coalition stability assessment
- Voting bloc analysis and cross-party cooperation patterns

### 📰 Intelligence Reporting
- **`generate-news-enhanced`** / **`article-template`** — Automated news generation
- 14-language narrative synthesis (EN, SV, DA, NO, FI, DE, FR, ES, NL, AR, HE, JA, KO, ZH)
- Editorial standards enforcement with quality scoring

---

## Business Value Architecture

| Customer Segment | Key Modules | Value Proposition |
|-----------------|-------------|-------------------|
| **Citizens & Voters** | politician-dashboard, party-dashboard, election-predictions | Informed voting decisions, MP accountability |
| **Journalists & Media** | risk-dashboard, anomaly-detection, pre-election | Investigative data, story leads, fact-checking |
| **Researchers & Academics** | seasonal-patterns, election-cycle, coalition-dashboard | Research-grade datasets, temporal analysis |
| **NGOs & Advocacy** | committees-dashboard, ministry-dashboard, legislative-monitoring | Transparency tracking, accountability tools |
| **Corporations & Government** | risk-dashboard, coalition-loader, election-predictions | Political risk assessment, regulatory stability |

## Marketing Content Pipeline

| Content Type | Source Modules | Distribution Channel |
|-------------|---------------|---------------------|
| **Risk Alerts** | risk-dashboard, anomaly-detection | Push notifications, email, social media |
| **Election Forecasts** | election-predictions, pre-election | Press releases, media partnerships |
| **Party Comparisons** | party-dashboard, coalition-dashboard | Social media infographics, blog posts |
| **MP Profiles** | politician-dashboard | SEO-optimized pages, voter tools |
| **Committee Reports** | committees-dashboard | Research publications, newsletters |
| **Trend Analysis** | seasonal-patterns, election-cycle | Thought leadership articles, webinars |

---

## Architecture

```
riksdagsmonitor/
├── src/browser/                 # TypeScript browser modules (27 files)
│   ├── main.ts                  # Entry point: 12 dashboards, parallel init
│   ├── cia-entry.ts             # CIA Intelligence Dashboard entry point
│   ├── shared/                  # Infrastructure (7 files)
│   │   ├── types.ts             # Intelligence domain type system
│   │   ├── theme.ts             # Cyberpunk design system constants
│   │   ├── chart-factory.ts     # Centralized Chart.js factory
│   │   ├── data-loader.ts       # Resilient data fetching pipeline
│   │   ├── dom-utils.ts         # Accessibility & loading states
│   │   ├── logger.ts            # Debug-gated logging
│   │   └── index.ts             # Barrel exports
│   ├── dashboards/              # Intelligence dashboards (12 files)
│   │   ├── stats-loader.ts      # OSINT statistics acquisition
│   │   ├── risk-dashboard.ts    # 45-rule political risk engine
│   │   ├── party-dashboard.ts   # 50-year party performance analytics
│   │   ├── ministry-dashboard.ts # Executive power assessment
│   │   ├── coalition-loader.ts  # Coalition dynamics data
│   │   ├── coalition-dashboard.ts # Voting pattern visualization
│   │   ├── committees-dashboard.ts # Committee network analytics
│   │   ├── politician-dashboard.ts # Individual MP profiling
│   │   ├── election-cycle.ts    # 40-year electoral cycle analysis
│   │   ├── seasonal-patterns.ts # Quarterly pattern intelligence
│   │   ├── pre-election.ts      # Pre-election monitoring
│   │   └── anomaly-detection.ts # Z-score early warning system
│   ├── cia/                     # CIA Platform integration (5 files)
│   │   ├── data-loader.ts       # 19+ product data pipeline
│   │   ├── visualizations.ts    # Rendering engine
│   │   ├── election-predictions.ts # Electoral forecasting
│   │   ├── i18n-translations.ts # 14-language translations
│   │   └── dashboard-init.ts    # Platform orchestrator
│   └── ui/                      # UI components (1 file)
│       └── back-to-top.ts       # WCAG back-to-top button
├── scripts/                     # Build & automation (42 files)
│   ├── types/                   # TypeScript type definitions (9 files)
│   ├── news-types/              # Article generators (5 files)
│   ├── data-transformers.ts     # Data transformation pipeline
│   ├── generate-news-enhanced.ts # News generation engine
│   ├── extract-news-metadata.ts # News article DB generator
│   ├── mcp-client.ts            # MCP JSON-RPC client
│   ├── article-template.ts      # HTML article rendering
│   └── ...
├── data/                        # Data assets
│   └── news-articles.json       # News metadata database (444 articles)
└── tests/                       # Test suite (35 files, 1200 tests)
```

---

## Documentation Standards

All documentation follows **intelligence analysis conventions** with three strategic perspectives:

| Tag | Purpose |
|-----|---------|
| `@module` | Intelligence capability module (e.g., "Dashboards/Risk") |
| `@category` | Intelligence domain grouping |
| `@intelligence` | **OSINT/risk/analysis perspective** — intelligence methodology and value |
| `@business` | **Revenue/market/competitive perspective** — commercial viability and positioning |
| `@marketing` | **Audience/growth/engagement perspective** — content and channel strategy |
| `@param` / `@returns` | Function signatures with type information |
| `@example` | Usage examples |
| `@see` | Cross-references to related modules |
| `@security` | Security considerations (CSP, XSS, data protection) |
| `@risk` | Risk assessment context |
| `@osint` | OSINT data source documentation |
| `@gdpr` | GDPR compliance notes |
| `@revenue` | Revenue model implications |
| `@market` | Market analysis context |
| `@audience` | Target audience information |
| `@competitive` | Competitive positioning |
| `@stakeholder` | Stakeholder impact |
| `@kpi` | Key performance indicators |

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
