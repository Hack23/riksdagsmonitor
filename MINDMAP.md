<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🗺️ Riksdagsmonitor — System Mindmaps</h1>

<p align="center">
  <strong>🧠 Conceptual Maps for Democratic Intelligence Architecture</strong><br>
  <em>🎯 System Overview · Security · CI/CD · Data Integration · Compliance</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/>
  <img src="https://img.shields.io/badge/Version-1.5-555?style=for-the-badge" alt="Version"/>
  <img src="https://img.shields.io/badge/Effective-2026--05--06-success?style=for-the-badge" alt="Effective Date"/>
  <img src="https://img.shields.io/badge/Review-Quarterly-orange?style=for-the-badge" alt="Review Cycle"/>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.5 | **📅 Last Updated:** 2026-05-06 (UTC)  
**🔄 Review Cycle:** Quarterly | **⏰ Next Review:** 2026-08-03  
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

---

## 🎯 Purpose

This document provides conceptual mindmaps for Riksdagsmonitor, offering intuitive visual representations of the system's organization, workflows, and architecture. These mindmaps complement the detailed technical documentation and serve as entry points for understanding the platform's structure.

## 📚 Architecture Documentation Map

| Document | Focus | Description |
|----------|-------|-------------|
| [🏛️ Architecture](ARCHITECTURE.md) | 🏗️ C4 Models | System context, containers, components |
| [📊 Data Model](DATA_MODEL.md) | 📊 Data | Entity relationships and data dictionary |
| [🔄 Flowchart](FLOWCHART.md) | 🔄 Processes | Business and data flow diagrams |
| [📈 State Diagram](STATEDIAGRAM.md) | 📈 States | System state transitions and lifecycles |
| **[🧠 Mindmap](MINDMAP.md)** | **🧠 Concepts** | **System conceptual relationships** |
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

## 1. 🏗️ System Overview Mindmap

```mermaid
mindmap
  root((🗳️ Riksdagsmonitor))
    🎯 Mission
      Swedish Parliament Intelligence
      Real-time Monitoring
      Historical Analysis
      Coalition Predictions
    📊 Data Products
      Intelligence Dashboard
      Party Performance
      Government Cabinet
      Top 10 Rankings
    🔐 Security
      ISO 27001 Aligned
      STRIDE Threat Model
      Defense-in-Depth
      99.7% Risk Reduction
    🌐 Technology
      Static HTML/CSS
      GitHub Pages
      CI/CD Automation
      Global CDN
    📋 ISMS Compliance
      Security Architecture
      Threat Model
      Workflows Documentation
      Future Roadmap
    📦 Platform v0.9.40
      7,500+ Tests (237 files)
      24 Agents · 93 Skills
      14 Languages
      8 MCP Servers
```

---

## 2. 🔐 Security Architecture Mindmap

```mermaid
mindmap
  root((🛡️ Security<br/>Architecture))
    🌐 Network Layer
      TLS 1.3 Encryption
      HTTPS-Only
      GitHub CDN
      DDoS Protection
    🛡️ Application Layer
      Static Files Only
      No Server-Side Code
      No User Input Processing
      XSS/SQLi Immune
    🔑 Access Control
      GitHub MFA Required
      SSH Key Authentication
      GPG Commit Signing
      Branch Protection
    📋 Data Integrity
      Git Immutable History
      Branch Protection Rules
      Code Review Required
      Audit Trail Complete
    🔍 Monitoring
      Dependabot Alerts
      CodeQL Scanning
      Secret Scanning
      GitHub Security Dashboard
    🚨 Incident Response
      Documented Procedures
      Rollback Capability
      17-Minute RTO
      Audit Logs Available
```

---

## 3. 🔄 CI/CD Workflows Mindmap

```mermaid
mindmap
  root((🔄 CI/CD<br/>Workflows))
    ✅ Quality Checks
      HTML Validation
        HTMLHint
        Zero Errors
      Link Checking
        Linkinator v6
        Internal + External
      Summary Report
        Artifacts
        30-Day Retention
    🔒 Dependency Review
      Vulnerability Scanning
        Critical/High Block
        Medium Warning
      License Compliance
        Apache 2.0 Required
        SBOM Generation
      PR Comments
        Always Visible
        Actionable
    🤖 Copilot Setup
      MCP Server Init
        Filesystem
        GitHub API
        Git Operations
      Agent Environment
        Memory
        Sequential Thinking
        Playwright
      Permissions
        Least Privilege
        Scoped Tokens
    🚀 Deployment
      GitHub Pages
        Automatic
        CDN Distribution
      HTTPS Enforced
        TLS 1.3
        Valid Certificate
      Global Availability
        Low Latency
        High Uptime
```

---

## 4. 📊 Data Integration Mindmap

```mermaid
mindmap
  root((📊 Data<br/>Integration))
    🏛️ CIA Platform
      Intelligence Dashboard
      Party Performance
      Government Cabinet
      Politician Analysis
    🇸🇪 Swedish Parliament
      Votes Database
      Documents Archive
      Committee Work
      MP Information
    🗳️ Election Authority
      Results Data
      Voter Turnout
      Electoral Statistics
      Historical Trends
    💰 Financial Authority
      Budget Data
      Spending Analysis
      Ministry Finances
      Cost Tracking
    🌍 World Bank
      Country Indicators
      Economic Data
      Development Metrics
      Comparative Analysis
    🌐 IMF
      WEO (NGDP_RPCH, PCPIPCH, LUR, GGXWDG_NGDP, BCA_NGDPD)
      Fiscal Monitor
      IFS (monthly monetary/FX/BOP)
      GFS_COFOG (committee-aligned spending)
      SDMX 3.0 + Datamapper JSON
      T+5 Projections (2031 horizon)
      Pure-TS client (scripts/imf-client.ts, no MCP)
```

---

## 5. 🛡️ ISMS Compliance Mindmap

```mermaid
mindmap
  root((🛡️ ISMS<br/>Compliance))
    📋 ISO 27001:2022
      7 Controls Implemented
        Access Control
        Cryptography
        Network Security
        Monitoring
        Incident Response
        Secure Development
        Logging
      Control Mapping
        Security Architecture
        Threat Model
        Evidence Documentation
    🎯 NIST CSF 2.0
      6 Functions Aligned
        Identify Assets
        Protect Systems
        Detect Threats
        Respond to Incidents
        Recover Operations
        Govern Security
      Implementation Evidence
        Workflows
        Architecture Docs
        Security Controls
    🏆 CIS Controls v8.1
      6 Controls Active
        IG1: 3 Controls
          Encryption
          Account Inventory
          Audit Logs
        IG2: 3 Controls
          RBAC
          Security Alerting
          Secure Development
      Compliance Checklist
        Regular Reviews
        Evidence Collection
```

---

## 6. 🚀 Future Evolution Mindmap

```mermaid
mindmap
  root((🚀 Future<br/>Evolution))
    🔐 Post-Quantum Crypto
      2027 Assessment
      2027 Hybrid Mode
      2028 Full PQC
      NIST Standards
    🤖 AI-Augmented Security
      Anomaly Detection
      Threat Intelligence
      Behavioral Analysis
      Predictive Security
    🛡️ Zero-Trust Architecture
      Contributor Access
      Infrastructure Verify
      Network Isolation
      Micro-Segmentation
    📊 Advanced Monitoring
      APM Integration
      SIEM Deployment
      Distributed Tracing
      Real-Time Analytics
    🌐 Platform Evolution
      CloudFlare Pages
      Multi-CDN Strategy
      AWS Migration Option
      Enhanced WAF
```

---

## 7. 👥 Stakeholder Interaction Mindmap

```mermaid
mindmap
  root((👥 Stakeholders))
    🌍 End Users
      Global Audience
      Multi-Language Support
      Mobile + Desktop
      Accessibility Focus
    🏛️ Swedish Citizens
      Election Monitoring
      MP Performance
      Coalition Tracking
      Historical Data Access
    📰 Media & Journalists
      Data Journalism
      Fact-Checking
      Investigation Support
      Open Data Access
    🎓 Researchers
      Academic Research
      Political Science
      Data Analysis
      Historical Studies
    👨‍💻 Developers
      Open Source
      API Integration
      Documentation
      Contributing
    🔒 Security Team
      Hack23 AB
      ISMS Oversight
      Incident Response
      Compliance Audits
```

---

## 8. 📈 Metrics & KPIs Mindmap

```mermaid
mindmap
  root((📈 Metrics<br/>& KPIs))
    🔒 Security Metrics
      Residual Risk: 5.52/10.0
      Risk Reduction: 99.7%
      Vulnerabilities: 0 Critical
      MTTR: <17 Minutes
    ✅ Quality Metrics
      HTML Validation: ✅ Pass
      Link Check: ✅ Pass
      Code Coverage: N/A Static
      Accessibility: WCAG 2.1 AA
    📊 Performance Metrics
      FCP: <1 Second
      TTI: <2 Seconds
      CLS: <0.05
      CDN Uptime: 99.9%
    🔄 CI/CD Metrics
      Workflow Success: >95%
      Deployment Frequency: Daily
      Lead Time: <2 Minutes
      Rollback Time: <17 Minutes
    📋 Compliance Metrics
      ISO 27001: 7 Controls
      NIST CSF 2.0: 6 Functions
      CIS Controls: 6 Active
      Audit Readiness: ✅
```

---

## 9. 🔍 Threat Landscape Mindmap

```mermaid
mindmap
  root((🔍 Threat<br/>Landscape))
    ⚠️ Current Threats
      Low Risk: 8 Threats
      Medium Risk: 3 Threats
      High Risk: 0 Threats
      Overall: LOW
    🎯 STRIDE Analysis
      Spoofing: 2 Threats
      Tampering: 2 Threats
      Repudiation: 1 Threat
      Info Disclosure: 2 Threats
      DoS: 2 Threats
      Elevation: 2 Threats
    🛡️ Mitigations
      Preventive: 7 Controls
      Detective: 4 Controls
      Corrective: 3 Controls
      Total: 14 Controls
    🚀 Future Threats
      Quantum Computing
      AI-Powered Attacks
      Supply Chain Attacks
      Nation-State APTs
```

---

## 10. 🌐 Multi-Language Support Mindmap

```mermaid
mindmap
  root((🌐 Multi-Language<br/>Support))
    🇪🇺 European Languages
      🇬🇧 English Primary
      🇸🇪 Swedish
      🇩🇰 Danish
      🇳🇴 Norwegian
      ��🇮 Finnish
      🇩🇪 German
      🇫🇷 French
      🇪🇸 Spanish
      🇳🇱 Dutch
    🌏 Middle East & Asia
      🇸🇦 Arabic
      🇮🇱 Hebrew
      🇯🇵 Japanese
      🇰🇷 Korean
      🇨🇳 Chinese
    🔧 Technical Implementation
      Hreflang Tags
      SEO Optimization
      Sitemap.xml Entries
      Language Switching
      Content Localization
```

---

## 11. 🔬 Political Intelligence Methods Mindmap

```mermaid
mindmap
  root((🔬 Political Intelligence<br/>Methods · 18))
    📊 Core Analysis
      AI-Driven Analysis Guide
      Synthesis Methodology
      Per-Artifact Methodologies
      Per-Document Methodology
    🎯 Political Domain
      Political Classification Guide
      Political Risk Methodology
      Political SWOT Framework
      Political Threat Framework
      Political Style Guide
    🌍 Data Sources
      IMF Indicator Mapping
      World Bank Indicator Mapping
      OSINT Tradecraft Standards
    📐 Structural
      Structural Metadata Methodology
      Artifact Catalog
      Strategic Extensions
      Electoral Domain Methodology
    🔍 Quality
      Analytical Supplementary
      Reference Quality Thresholds
```

---

## 12. 📋 Analysis Templates Mindmap

```mermaid
mindmap
  root((📋 Analysis<br/>Templates · 39))
    🎯 Core Analysis
      Intelligence Assessment
      Executive Brief
      Synthesis Summary
      Analysis Index
      Significance Scoring
    ⚠️ Risk & Threat
      Risk Assessment
      Threat Analysis
      Political STRIDE Assessment
      Devils Advocate
      Wildcards Black Swans
    📈 Strategic
      SWOT Analysis
      Quantitative SWOT
      PESTLE Analysis
      Scenario Analysis
      Implementation Feasibility
    🗳️ Electoral
      Election 2026 Analysis
      Election Cycle Analysis
      Coalition Mathematics
      Voter Segmentation
    🔭 Forward-Looking
      Forward Indicators
      Horizon PIR Roll-Forward
      Cycle Trajectory
      Month-Ahead / Week-Ahead
    🌍 Comparative
      Comparative International
      Historical Parallels
      Media Framing Analysis
    👥 Stakeholder
      Stakeholder Impact
      Political Classification
      Per-File Political Intel
    🏛️ Parliamentary
      Parliamentary Season
      Session Baseline
      Cross-Session Intelligence
    ✅ Quality
      Methodology Reflection
      Reference Analysis Quality
      MCP Reliability Audit
      Workflow Audit
    🔧 Infrastructure
      Cross-Reference Map
      Cross-Run Diff
      Data Download Manifest
```

---

## 13. 🔭 Horizon Stratification Mindmap

```mermaid
mindmap
  root((🔭 Horizon<br/>Stratification))
    ⏱️ Short-Term
      T+72h Breaking News
      T+7d Week-Ahead Forecast
    📅 Medium-Term
      T+30d Month-Ahead Analysis
      T+90d Quarter Outlook
    📆 Long-Term
      T+365d Annual Projection
      T+1460d Election Cycle
      Election Anchor Date
    🏗️ Structure
      23-Artifact Families A-D
      Family A Core Synthesis (9)
      Family B Structural Metadata (2)
      Family C Strategic Extensions (5)
      Family D Electoral Lenses (7)
    🚦 Analysis Gate
      Checks 1-9b Automated
      AI-FIRST 2-Iteration Model
      Pass 1 Create
      Pass 2 Review and Improve
    📊 Scenario Depth
      Quarter: 4 Scenarios
      Year: 4+5 Wildcards
      Election: 12 Leaves + 5 Wildcards
```

---

## 📝 Using These Mindmaps

### For New Team Members
1. Start with **System Overview** to understand the platform
2. Review **Security Architecture** to grasp defense-in-depth
3. Study **CI/CD Workflows** to understand automation
4. Explore **Data Integration** to see external dependencies

### For Security Auditors
1. Begin with **ISMS Compliance** mindmap
2. Examine **Security Architecture** layers
3. Review **Threat Landscape** analysis
4. Check **Metrics & KPIs** for evidence

### For Stakeholders
1. Use **Stakeholder Interaction** to identify your role
2. Review **System Overview** for capabilities
3. Check **Metrics & KPIs** for performance
4. Explore **Future Evolution** for roadmap

### For Developers
1. Study **CI/CD Workflows** for contribution process
2. Review **Security Architecture** for constraints
3. Check **Data Integration** for external APIs
4. Explore **Technical Implementation** details

---

## 📚 Architecture Documentation Map

| Document | Focus | Description |
|----------|-------|-------------|
| [🏛️ Architecture](ARCHITECTURE.md) | 🏗️ C4 Models | System context, containers, components |
| [📊 Data Model](DATA_MODEL.md) | 📊 Data | Entity relationships and data dictionary |
| [🔄 Flowchart](FLOWCHART.md) | 🔄 Processes | Business and data flow diagrams |
| [📈 State Diagram](STATEDIAGRAM.md) | 📈 States | System state transitions and lifecycles |
| **[🧠 Mindmap](MINDMAP.md)** | **🧠 Concepts** | **System conceptual relationships** |
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

### Hack23 ISMS Policies

- [🛡️ Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) — Architecture documentation requirements
- [🏷️ Classification Framework](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) — CIA triad classification

---

**📋 Document Control:**  
**✅ Approved by:** James Pether Sörling, CEO  
**📤 Distribution:** Public  
**🏷️ Classification:** [![Confidentiality: Public](https://img.shields.io/badge/C-Public-lightgrey?style=flat-square)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md#confidentiality-levels)  
**📅 Effective Date:** 2026-02-20  
**⏰ Next Review:** 2026-05-20  
**🎯 Framework Compliance:** [![ISO 27001](https://img.shields.io/badge/ISO_27001-2022_Aligned-blue?style=flat-square&logo=iso&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) [![NIST CSF 2.0](https://img.shields.io/badge/NIST_CSF-2.0_Aligned-green?style=flat-square&logo=nist&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) [![CIS Controls](https://img.shields.io/badge/CIS_Controls-v8.1_Aligned-orange?style=flat-square&logo=cisecurity&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md)


---

## 🌐 IMF Economic-Data Branch (Current State)

> **Status:** ✅ Implemented and in production. IMF is the **primary economic-data source** today; the mindmap below shows the IMF subtree as currently realised. World Bank is the residue-only branch (governance / environment / social). Hub: [`analysis/imf/`](analysis/imf/).

```mermaid
mindmap
  root((Economic Data Sources — Current))
    IMF [PRIMARY · IMPLEMENTED 2026-04]
      Client
        scripts/imf-client.ts pure TypeScript
        scripts/imf-context.ts high-level
        scripts/imf-fetch.ts CLI
        scripts/imf-codes.ts registry
      Dataflows in production
        WEO NGDP_RPCH PCPIPCH LUR GGXWDG_NGDP BCA_NGDPD
        Fiscal Monitor cyclically-adjusted balance primary balance EDP debt
        IFS monthly CPI policy rates reserves
        BOP current account quarterly
        DOTS bilateral trade monthly
        GFS_COFOG 02 Defence 07 Health 09 Education 10 Social protection
        PCPS commodity benchmarks
        ER SEK FX daily
        MFS_IR MFS_PR monetary survey
      Cache and provenance
        Vintage-tagged in analysis/daily economic-data.json
        SHA-256 payload pin
        economicProvenance block in every article
      Tests
        tests/imf-client.test.ts
        tests/imf-codes.test.ts
        tests/imf-context.test.ts
        tests/imf-inventory.test.ts 13 assertions
        tests/economic-context-multi-provider.test.ts
    World Bank [RESIDUE ONLY governance environment social]
      worldbank-mcp MCP server
      WGI governance CC.EST RL.EST VA.EST GE.EST RQ.EST PV.EST
      Environment CO2 renewables forest water
      Social residue literacy participation gender ratios
      Defence depth MS.MIL historicals
    SCB [SWEDISH GROUND TRUTH]
      scb-mcp MCP server PxWeb v2
      AKU monthly labour
      KPI monthly inflation
      Regional municipal
      Budget execution
```

---

## 🏛️ Statskontoret Integration Branch (Current State)

```mermaid
mindmap
  root((Statskontoret Integration))
    Purpose
      Swedish agency structure
      Government-body headcount
      Central-government budget execution
    Sources
      Myndighetsforteckning
        Annual
        XLSX
        Headcount by department
      Arsutfall
        Annual
        XLSX
        CSV ZIP
      Manadsutfall
        Monthly
        XLSX
        CSV ZIP
      Budget time series
        Long-run state budget context
    Code
      statskontoret-client.ts
        Discovery
        XLSX parser
        CSV ZIP parser
        Typed StatskontoretError
      statskontoret-fetch.ts
        list-sources
        discover
        headcount
    Governance
      Public classification
      No MCP server
      No credentials
      www.statskontoret.se allowlist
      analysis/statskontoret inventory
    Tests
      client tests
      CLI parsing tests
      inventory tests
```


---

## 🔗 Hack23 Ecosystem

<table>
<tr>
  <th width="33%">🌐 Platforms</th>
  <th width="33%">📦 Open-Source Projects</th>
  <th width="33%">🛡️ Governance &amp; Standards</th>
</tr>
<tr>
<td valign="top">
🗳️ <a href="https://riksdagsmonitor.com">Riksdagsmonitor</a> — Swedish Parliament intelligence<br>
🇪🇺 <a href="https://www.euparliamentmonitor.com">EU Parliament Monitor</a> — European coverage<br>
🕵️ <a href="https://www.hack23.com/cia">Citizen Intelligence Agency</a> — political-data engine<br>
🌐 <a href="https://www.hack23.com">Hack23 AB</a> — corporate site<br>
📰 <a href="https://hack23.com/blog.html">Hack23 Blog</a> — engineering &amp; policy<br>
💼 <a href="https://www.linkedin.com/company/hack23/">Hack23 on LinkedIn</a>
</td>
<td valign="top">
🗳️ <a href="https://github.com/Hack23/riksdagsmonitor">Hack23/riksdagsmonitor</a><br>
🕵️ <a href="https://github.com/Hack23/cia">Hack23/cia</a><br>
🇪🇺 <a href="https://github.com/Hack23/euparliamentmonitor">Hack23/euparliamentmonitor</a><br>
🔌 <a href="https://github.com/Hack23/european-parliament-mcp">Hack23/european-parliament-mcp</a><br>
✅ <a href="https://github.com/Hack23/cia-compliance-manager">Hack23/cia-compliance-manager</a><br>
🥋 <a href="https://github.com/Hack23/black-trigram">Hack23/black-trigram</a><br>
🏠 <a href="https://github.com/Hack23/homepage">Hack23/homepage</a>
</td>
<td valign="top">
🛡️ <a href="https://github.com/Hack23/ISMS-PUBLIC">Hack23 ISMS-PUBLIC</a> — public ISMS<br>
🔒 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md">Information Security Policy</a><br>
🤖 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/AI_Policy.md">AI Policy</a><br>
🧪 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md">Secure Development Policy</a><br>
🎯 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md">Threat Modeling Policy</a><br>
⚠️ <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md">Vulnerability Management</a><br>
🏷️ <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md">Classification Framework</a>
</td>
</tr>
</table>

<p align="center">
<a href="https://www.bestpractices.dev/projects/12069"><img src="https://www.bestpractices.dev/projects/12069/badge" alt="OpenSSF Best Practices"/></a>
<a href="https://scorecard.dev/viewer/?uri=github.com/Hack23/riksdagsmonitor"><img src="https://api.securityscorecards.dev/projects/github.com/Hack23/riksdagsmonitor/badge" alt="OpenSSF Scorecard"/></a>
<a href="https://github.com/Hack23/ISMS-PUBLIC"><img src="https://img.shields.io/badge/ISO_27001-2022-blue?style=flat-square&logo=iso&logoColor=white" alt="ISO 27001:2022"/></a>
<a href="https://github.com/Hack23/ISMS-PUBLIC"><img src="https://img.shields.io/badge/NIST_CSF-2.0-green?style=flat-square&logo=nist&logoColor=white" alt="NIST CSF 2.0"/></a>
<a href="https://github.com/Hack23/ISMS-PUBLIC"><img src="https://img.shields.io/badge/CIS_Controls-v8.1-orange?style=flat-square&logo=cisecurity&logoColor=white" alt="CIS Controls v8.1"/></a>
<a href="https://www.apache.org/licenses/LICENSE-2.0"><img src="https://img.shields.io/badge/License-Apache_2.0-blue?style=flat-square" alt="Apache 2.0"/></a>
</p>

<p align="center"><em>🗳️ Empower citizens · 🔍 Strengthen democratic accountability · 🕵️ Illuminate the political process</em></p>

<p align="center"><sub>© 2008–2026 <a href="https://www.hack23.com">Hack23 AB</a> (Org.nr 559534-7807) · Maintainer: <a href="https://www.linkedin.com/in/jamessorling/">James Pether Sörling, CISSP CISM</a></sub></p>
