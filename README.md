# 🗳️ Riksdagsmonitor

> Swedish Parliament Intelligence Platform - Monitor political activity with systematic transparency

## 🎯 Mission

Riksdagsmonitor is a comprehensive intelligence platform for monitoring political activity in Sweden's Riksdag (Parliament). Built on the [Citizen Intelligence Agency (CIA)](https://github.com/Hack23/cia) platform, we provide systematic transparency through real-time analysis and 50+ years of historical data.

## 📊 Quality Metrics

[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/Hack23/riksdagsmonitor/badge)](https://scorecard.dev/viewer/?uri=github.com/Hack23/riksdagsmonitor)
[![Quality Checks](https://github.com/Hack23/riksdagsmonitor/actions/workflows/quality-checks.yml/badge.svg)](https://github.com/Hack23/riksdagsmonitor/actions/workflows/quality-checks.yml)
[![Dependency Review](https://github.com/Hack23/riksdagsmonitor/actions/workflows/dependency-review.yml/badge.svg)](https://github.com/Hack23/riksdagsmonitor/actions/workflows/dependency-review.yml)
[![License](https://img.shields.io/github/license/Hack23/riksdagsmonitor)](LICENSE)
[![ISMS](https://img.shields.io/badge/Hack23-ISMS-blue)](https://github.com/Hack23/ISMS-PUBLIC)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Hack23/riksdagsmonitor)

**Security Policy:** Per [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md), we maintain defense-in-depth architecture with comprehensive security controls and documentation

## ✨ Features

- **349 Members of Parliament** - Individual MP tracking and performance metrics
- **8 Political Parties** - Party performance, coalition dynamics, voting patterns
- **45 Risk Rules** - Systematic transparency through behavioral analysis
- **50+ Years of Data** - Historical trends and longitudinal analysis (1971-2024)

## 🌐 Live Platform

**Website:** [riksdagsmonitor.com](https://riksdagsmonitor.com)

**Available in 14 Languages:**
- English, Swedish, Danish, Norwegian, Finnish
- German, French, Spanish, Dutch
- Arabic, Hebrew, Japanese, Korean, Chinese

## 📊 CIA Data Products Integration

Riksdagsmonitor integrates with the CIA platform through automated schema validation and data quality assurance.

### Schema Integration
- **Automated Validation** - All CIA exports validated against JSON schemas
- **Type Safety** - TypeScript type definitions for development
- **CI/CD Integration** - Daily validation checks in GitHub Actions
- **Update Detection** - Weekly checks for schema updates

See [CIA Schema Integration Documentation](docs/CIA_SCHEMA_INTEGRATION.md) for details.

### Data Products

Riksdagsmonitor leverages 19 comprehensive visualization products from the CIA platform:

### Intelligence Dashboards
- **Overview Dashboard** - Complete Riksdag intelligence snapshot
- **Party Performance** - Longitudinal party analysis and effectiveness metrics
- **Government Cabinet** - Ministry-level performance scorecards
- **Election Cycle Analysis** - Historical patterns and trend forecasting

### Top 10 Rankings
- Most Influential MPs (network analysis)
- Most Productive MPs (legislative output)
- Most Controversial MPs (voting patterns)
- Most Absent MPs (attendance tracking)
- Party Rebels (cross-party voting)
- Coalition Brokers (collaboration patterns)
- Rising Stars (emerging political figures)
- Electoral Risk (MPs at risk)
- Ethics Concerns (transparency issues)
- Media Presence (public visibility)

### Advanced Analytics
- **Committee Network Analysis** - Influence mapping and assignments
- **Politician Career Analysis** - Career trajectories and milestones
- **Party Longitudinal Analysis** - 50+ years of party evolution
- **Anomaly Detection & Early Warning** ✨ **NEW** - Statistical outlier identification (2002-2025)

### Anomaly Detection Dashboard

The Anomaly Detection & Early Warning System provides real-time identification of unusual parliamentary activity using Z-score statistical analysis:

**Features:**
- **Real-time Anomaly Feed** - Most recent anomalies displayed first
- **Statistical Analysis** - Z-score threshold detection (|Z| ≥ 2.0 for anomalies)
- **Severity Classification** - CRITICAL (≥2.5), HIGH (≥2.0), MODERATE (≥1.5), LOW (<1.5)
- **Anomaly Types** - Ballot, Document, and Attendance anomalies
- **Historical Timeline** - 23 years of anomaly data (2002-2025)
- **Interactive Visualizations** - 6 Chart.js/D3.js charts with filtering

**Data Coverage:**
- **Total Records**: 32 quarters analyzed (2002-2025)
- **Anomalies Detected**: 12 out of 32 quarters (37.5% anomaly rate)
- **Severity Breakdown**: 5 CRITICAL, 1 HIGH, 6 MODERATE
- **Type Breakdown**: 4 ballot anomalies, 8 document anomalies, 0 attendance anomalies
- **Direction**: 11 unusually high, 1 unusually low

**Key Visualizations:**
1. **Anomaly Timeline** - Scatter plot showing all anomalies across 23 years
2. **Z-Score Distribution** - Histogram with normal curve overlay
3. **Anomaly Type Breakdown** - Doughnut chart (33% ballot, 67% document)
4. **Severity Heat Map** - D3.js heat map (year × quarter grid)
5. **Quarterly Frequency** - Stacked bar chart by severity
6. **Recent Anomalies Feed** - Last 5 anomalies with full details

**Alert System:**
- Automatic alerts for CRITICAL or HIGH anomalies in last 2 quarters
- Dismissible banner with 24-hour cooldown
- Color-coded severity indicators (🔴 Critical, 🟠 High, 🟡 Moderate, 🟢 Low)

**Data Source:** [CIA Seasonal Anomaly Detection](https://github.com/Hack23/cia/blob/master/service.data.impl/sample-data/view_riksdagen_seasonal_anomaly_detection_sample.csv)

## 📁 CIA Data Directory

The `cia-data/` directory contains 25 CSV files (656KB) from the CIA platform, organized by category:

### Directory Structure
```
cia-data/
├── seasonal/          # Seasonal activity patterns & anomaly detection
├── voting/            # Voting anomalies & patterns
├── election-cycle/    # Election proximity & predictive intelligence
├── party/             # Party performance & longitudinal data (50+ years)
├── committee/         # Committee productivity metrics
├── ministry/          # Ministry risk & effectiveness
├── politician/        # Politician risk & influence
└── distribution/      # Statistical distributions & trends
```

### Data Loading Strategy
Dashboards use a **local-first approach** with graceful fallback:
1. Try local file: `cia-data/[category]/[filename].csv`
2. Fallback to remote: `https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/[filename].csv`

**Benefits:**
- ⚡ Faster load times (local files)
- 🔒 Works offline (with cache)
- 📉 Reduced API usage
- 🛡️ Graceful degradation

### Updating Data
To download the latest CSV files from the CIA platform:
```bash
cd cia-data
bash download-csv.sh
```

**Update Frequency:**
- Anomaly Detection: Quarterly (after each parliamentary quarter)
- Party/Politician Data: Annually
- Committee/Ministry: Monthly
- Election Cycle: During election years

See [`cia-data/README.md`](cia-data/README.md) for detailed documentation of all data files.

## 🔗 Data Sources

Riksdagsmonitor integrates multiple authoritative Swedish open data sources:

- **[Swedish Parliament (Riksdagen)](http://data.riksdagen.se/)** - Votes, documents, committee work, MP information
- **[Swedish Election Authority](http://www.val.se/)** - Election results, voter turnout, electoral statistics
- **[Swedish Financial Management Authority](https://www.esv.se/psidata/)** - Government budget and spending data
- **[World Bank Open Data](http://data.worldbank.org/)** - Country-level indicators for comparative analysis

## 🏗️ Technical Architecture

### Stack
- **Frontend:** Static HTML/CSS (no JavaScript frameworks)
- **Styling:** Custom CSS with cyberpunk theme, responsive design
- **Hosting:** GitHub Pages with global CDN
- **CI/CD:** GitHub Actions for automated deployment
- **Data Platform:** CIA OSINT platform (Java/Spring Boot backend)

### Security
- **HTTPS-Only:** TLS 1.3 encryption enforced
- **Security Headers:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **Access Control:** GitHub MFA, SSH keys, GPG commit signing
- **Monitoring:** Dependabot, CodeQL, Secret Scanning
- **Documentation:** [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md), [THREAT_MODEL.md](THREAT_MODEL.md)

## 🔐 Commitment to Transparency and Security

At Hack23 AB, we believe that true security comes through transparency and demonstrable practices. Our Information Security Management System (ISMS) is publicly available, showcasing our commitment to security excellence and organizational transparency.

<table>
  <tr>
    <td width="50%">
      <div align="center">
        <h3>📋 ISMS Compliance</h3>
        <p><strong>ISO 27001:2022 Aligned</strong></p>
        <ul align="left">
          <li><a href="https://github.com/Hack23/ISMS-PUBLIC">ISMS Repository</a></li>
          <li><a href="https://github.com/Hack23/ISMS-PUBLIC">Public ISMS</a></li>
          <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md">Secure Development Policy</a></li>
          <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md">Threat Modeling</a></li>
          <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Compliance_Checklist.md">Compliance Checklist</a></li>
        </ul>
      </div>
    </td>
    <td width="50%">
      <div align="center">
        <h3>🛡️ Security Documentation</h3>
        <p><strong>Defense-in-Depth Architecture</strong></p>
        <ul align="left">
          <li><a href="SECURITY_ARCHITECTURE.md">Security Architecture</a></li>
          <li><a href="THREAT_MODEL.md">Threat Model</a></li>
          <li><a href="WORKFLOWS.md">CI/CD Workflows</a></li>
          <li><a href="ARCHITECTURE.md">System Architecture</a></li>
          <li><a href="FUTURE_SECURITY_ARCHITECTURE.md">Future Security</a></li>
        </ul>
      </div>
    </td>
  </tr>
</table>

### Compliance Frameworks
- **ISO 27001:2022** - Information security management controls (7 controls implemented)
- **NIST CSF 2.0** - Cybersecurity framework (6 functions aligned)
- **CIS Controls v8.1** - Security best practices (6 controls implemented)

### Security Metrics

| Metric | Status | Details |
|--------|--------|---------|
| **Risk Level** | 🟢 LOW | 5.52/10.0 (99.7% risk reduction) |
| **HTML Validation** | ✅ PASSED | 0 errors (HTMLHint) |
| **Dependencies** | ✅ CLEAN | Dependabot monitoring |
| **Secrets** | ✅ SECURE | Secret scanning enabled |
| **Code Scanning** | ✅ ACTIVE | CodeQL analysis |

## 🚀 Development

### Prerequisites
- Git with GPG signing configured
- GitHub account with MFA enabled
- SSH keys for GitHub authentication

### Local Development

```bash
# Clone repository
git clone git@github.com:Hack23/riksdagsmonitor.git
cd riksdagsmonitor

# Serve locally
python3 -m http.server 8080
# or
npx http-server -p 8080

# Open in browser
open http://localhost:8080
```

### Quality Checks

```bash
# HTML validation
npm install -g htmlhint
htmlhint *.html

# Link checking
npm install -g linkinator@6
python3 -m http.server 8080 &
linkinator http://localhost:8080/ --recurse
```

### CI/CD Pipeline

**Automated Checks:**
- HTML validation (HTMLHint)
- Link checking (linkinator)
- Dependency review (Dependabot)
- Security scanning (CodeQL, Secret Scanning)

**Workflows:**
- `.github/workflows/quality-checks.yml` - HTML/link validation
- `.github/workflows/dependency-review.yml` - Dependency security
- `.github/workflows/copilot-setup-steps.yml` - Copilot agent setup

## 📖 Documentation

### Project Documentation
- [README.md](README.md) - This file
- [TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md) - Multi-language translation standards and glossary
- [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) - Security architecture and controls
- [THREAT_MODEL.md](THREAT_MODEL.md) - Threat analysis and risk assessment
- [WORKFLOWS.md](WORKFLOWS.md) - CI/CD workflows and automation
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and design
- [FUTURE_SECURITY_ARCHITECTURE.md](FUTURE_SECURITY_ARCHITECTURE.md) - Future security roadmap
- [LICENSE](LICENSE) - Apache License 2.0

### GitHub Copilot Integration
- [AGENTS.md](AGENTS.md) - Custom Copilot agents for specialized tasks (13 agents)
- [SKILLS.md](SKILLS.md) - Agent skills for strategic guidance (40 skills)
- [`.github/agents/`](.github/agents/) - Agent configuration files
- [`.github/skills/`](.github/skills/) - Skill libraries

**Available Agents (13)** ⬆️ **UPDATED**:
- **security-architect** - Security architecture and ISMS compliance
- **documentation-architect** - C4 models and technical documentation
- **quality-engineer** - HTML/CSS validation and accessibility
- **frontend-specialist** - Static site development and responsive design
- **isms-compliance-manager** - ISO 27001/NIST CSF/CIS Controls compliance
- **deployment-specialist** - GitHub Actions and CI/CD automation
- **intelligence-operative** - Political intelligence analysis, OSINT, Swedish politics expertise, riksdag-regering-mcp (32 tools)
- **task-agent** ✨ - Product excellence, quality assurance, Playwright testing, issue management
- **ui-enhancement-specialist** ✨ - Static HTML/CSS, responsive design, 14-language support, WCAG 2.1 AA
- **data-pipeline-specialist** ✨ - CIA data consumption, ETL workflows, caching strategies, data validation
- **data-visualization-specialist** ✨ - Chart.js/D3.js, interactive dashboards, CIA intelligence visualizations
- **content-generator** ✨ **NEW** - Automated news generation, intelligence reports, multi-language content
- **devops-engineer** ✨ **NEW** - CI/CD pipelines, GitHub Actions security, infrastructure automation, monitoring

**Available Skills (40)** ⬆️ **UPDATED**:

*Core Infrastructure (7):*
- **hack23-isms-compliance** - ISMS framework requirements
- **security-by-design** - Security best practices
- **static-site-security** - Static website security
- **ci-cd-security** - GitHub Actions security hardening
- **documentation-standards** - Documentation guidelines
- **html-accessibility** - WCAG 2.1 AA compliance
- **multi-language-localization** - Internationalization best practices

*Political Intelligence (11):*
- **political-science-analysis** - Comparative politics and policy analysis frameworks
- **osint-methodologies** - Open-source intelligence collection and verification
- **intelligence-analysis-techniques** - Structured analytic techniques (ACH, SWOT)
- **swedish-political-system** - Riksdag structure, 8 parties, electoral system
- **electoral-analysis** - Election forecasting and coalition prediction
- **behavioral-analysis** - Political psychology and leadership analysis
- **strategic-communication-analysis** - Narrative analysis and media monitoring
- **legislative-monitoring** - Voting patterns and parliamentary oversight
- **risk-assessment-frameworks** - Political risk and corruption indicators
- **data-science-for-intelligence** - Statistical analysis and visualization
- **gdpr-compliance** - GDPR compliance for political data processing

*ISMS & Security (6):*
- **cis-controls** - CIS Controls v8.1 for static sites
- **iso-27001-controls** - ISO 27001:2022 Annex A controls
- **nist-csf-mapping** - NIST CSF 2.0 framework mapping
- **threat-modeling** - STRIDE threat analysis
- **secure-code-review** - HTML/CSS/JS security review
- **security-documentation** - ISMS documentation standards

*Development & Operations (10):* ⬆️ **EXPANDED**
- **c4-architecture-documentation** - C4 model and Mermaid diagrams
- **github-actions-workflows** - CI/CD patterns and security
- **code-quality-checks** - HTMLHint, CSSLint, linkinator, axe-core
- **secrets-management** - GitHub secrets and PAT management
- **data-pipeline-engineering** ✨ **NEW** - ETL workflows, automated data fetching
- **automated-content-generation** ✨ **NEW** - News generation, intelligence reports
- **performance-optimization** ✨ **NEW** - Core Web Vitals, bundle size, caching
- **api-integration** ✨ **NEW** - REST/GraphQL clients, rate limiting

*UI/UX & Design (4):* ⬆️ **EXPANDED**
- **responsive-design** - Mobile-first, CSS Grid/Flexbox, breakpoints (320px-1440px+)
- **design-system-management** - Cyberpunk theme, CSS variables, component library
- **political-data-visualization** - CSS-only charts, heat maps, dashboards
- **advanced-data-visualization** ✨ **NEW** - Chart.js/D3.js, interactive dashboards

*Testing & Quality Assurance (2):* ✨ **NEW**
- **playwright-testing** - Browser automation, visual regression, accessibility audits
- **issue-management** - GitHub issue creation, labeling, agent assignment

*Data Integration (2):* ⬆️ **EXPANDED**
- **riksdag-regering-mcp** - 32 political data tools (Parliament, Government, MPs, votes)
- **cia-data-integration** ✨ **NEW** - CIA export consumption, validation, caching strategies

### External Documentation
- [CIA Platform Documentation](https://hack23.github.io/cia/)
- [CIA JSON Export Specifications](https://github.com/Hack23/cia/tree/master/json-export-specs/visualizations)
- [Hack23 ISMS](https://github.com/Hack23/ISMS)
- [Hack23 Public ISMS](https://github.com/Hack23/ISMS-PUBLIC)
- [Hack23 Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md)
- [Hack23 Blog](https://hack23.com/blog.html)

## 🏢 About Hack23

**Hack23 AB (Org.nr 5595347807)** - Swedish cybersecurity and open-source intelligence consultancy

- 🌐 **Website**: [www.hack23.com](https://www.hack23.com)
- 💼 **LinkedIn**: [Company Profile](https://www.linkedin.com/company/hack23/)
- 👨‍💻 **Founder**: [James Pether Sörling, CISSP, CISM](https://www.linkedin.com/in/jamessorling/)
- 🔒 **ISMS**: [Public ISMS Repository](https://github.com/Hack23/ISMS-PUBLIC)

## 🤝 Contributing

Contributions welcome! Please follow Hack23's secure development standards:

1. **Fork** the repository
2. **Create** a feature branch with descriptive name
3. **Sign** commits with GPG key
4. **Test** changes locally (HTML validation, link checking)
5. **Submit** pull request with comprehensive description
6. **Address** code review feedback

**Requirements:**
- GitHub account with MFA enabled
- GPG-signed commits
- HTML validation passing
- No security vulnerabilities introduced

## 📜 License

Copyright © 2008-2026 Hack23 AB (Org.nr 5595347807)

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website:** [riksdagsmonitor.com](https://riksdagsmonitor.com)
- **CIA Platform:** [www.hack23.com/cia](https://www.hack23.com/cia)
- **GitHub:** [github.com/Hack23/riksdagsmonitor](https://github.com/Hack23/riksdagsmonitor)
- **Hack23:** [www.hack23.com](https://www.hack23.com)
- **ISMS:** [github.com/Hack23/ISMS](https://github.com/Hack23/ISMS)
- **LinkedIn:** [James Pether Sörling](https://www.linkedin.com/in/jamessorling/)

## 👨‍💻 Maintainer

**James Pether Sörling**  
CISSP, CISM  
CEO, Hack23 AB  
[LinkedIn](https://www.linkedin.com/in/jamessorling/) | [GitHub](https://github.com/pethers)

---

*Monitor political activity in Sweden with systematic transparency*

