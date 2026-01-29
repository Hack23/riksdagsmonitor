# 🗳️ Riksdagsmonitor

> Swedish Parliament Intelligence Platform - Monitor political activity with systematic transparency

## 🎯 Mission

Riksdagsmonitor is a comprehensive intelligence platform for monitoring political activity in Sweden's Riksdag (Parliament). Built on the [Citizen Intelligence Agency (CIA)](https://github.com/Hack23/cia) platform, we provide systematic transparency through real-time analysis and 50+ years of historical data.

## 📊 Quality Metrics

[![Quality Checks](https://github.com/Hack23/riksdagsmonitor/actions/workflows/quality-checks.yml/badge.svg)](https://github.com/Hack23/riksdagsmonitor/actions/workflows/quality-checks.yml)
[![Dependency Review](https://github.com/Hack23/riksdagsmonitor/actions/workflows/dependency-review.yml/badge.svg)](https://github.com/Hack23/riksdagsmonitor/actions/workflows/dependency-review.yml)
[![License](https://img.shields.io/github/license/Hack23/riksdagsmonitor)](LICENSE)
[![ISMS](https://img.shields.io/badge/ISMS-ISO%2027001-blue)](https://github.com/Hack23/ISMS)

**Security Policy:** Per [Secure Development Policy](https://github.com/Hack23/ISMS/blob/main/Secure_Development_Policy.md), we maintain defense-in-depth architecture with comprehensive security controls and documentation

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
          <li><a href="https://github.com/Hack23/ISMS">ISMS Repository</a></li>
          <li><a href="https://github.com/Hack23/ISMS-PUBLIC">Public ISMS</a></li>
          <li><a href="https://github.com/Hack23/ISMS/blob/main/Secure_Development_Policy.md">Secure Development Policy</a></li>
          <li><a href="https://github.com/Hack23/ISMS/blob/main/Threat_Modeling.md">Threat Modeling</a></li>
          <li><a href="https://github.com/Hack23/ISMS/blob/main/Compliance_Checklist.md">Compliance Checklist</a></li>
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
- [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) - Security architecture and controls
- [THREAT_MODEL.md](THREAT_MODEL.md) - Threat analysis and risk assessment
- [WORKFLOWS.md](WORKFLOWS.md) - CI/CD workflows and automation
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and design
- [FUTURE_SECURITY_ARCHITECTURE.md](FUTURE_SECURITY_ARCHITECTURE.md) - Future security roadmap
- [LICENSE](LICENSE) - Apache License 2.0

### External Documentation
- [CIA Platform Documentation](https://hack23.github.io/cia/)
- [CIA JSON Export Specifications](https://github.com/Hack23/cia/tree/master/json-export-specs/visualizations)
- [Hack23 ISMS](https://github.com/Hack23/ISMS)
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

