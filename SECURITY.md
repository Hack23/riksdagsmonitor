<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🔐 Security Policy — Riksdagsmonitor</h1>

<p align="center">
  <strong>🛡️ Security Through Transparency and Vulnerability Management</strong><br>
  <em>🎯 Defense-in-Depth Architecture for Democratic Intelligence</em>
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

## 🎯 **Purpose Statement**

This security policy establishes vulnerability disclosure and incident response procedures for Riksdagsmonitor, implementing [Vulnerability Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md) and [Incident Response Plan](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Incident_Response_Plan.md) from Hack23 AB's ISMS framework.

Our security approach demonstrates our commitment to **transparency** and **operational excellence**, ensuring that vulnerabilities are managed systematically with documented response times and coordinated disclosure processes.

*— James Pether Sörling, CEO/Founder*

---

## Supported Versions

This project is under active development, and we provide security updates for the latest version only.

| Version | Supported          | ISMS Policy |
| ------- | ------------------ | ----------- |
| latest  | :white_check_mark: | [Vulnerability Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md) |

## Security Posture

Riksdagsmonitor maintains strong security practices as documented in our [Security Architecture](SECURITY_ARCHITECTURE.md):

### Current Security Controls

- ✅ **Static Site Architecture** — No server-side code execution, no database vulnerabilities
- ✅ **HTTPS-Only** — TLS 1.3 via AWS CloudFront and GitHub Pages
- ✅ **Automated Security Scanning** — CodeQL, Dependabot, Secret Scanning
- ✅ **Supply Chain Security** — SHA-pinned GitHub Actions, step-security/harden-runner
- ✅ **Multi-Region Availability** — AWS CloudFront (us-east-1 primary, eu-west-1 replica) with GitHub Pages DR
- ✅ **SLSA Build Provenance** — Attestation for build integrity
- ✅ **Content Integrity** — Subresource Integrity (SRI) for CDN assets
- ✅ **Security Headers** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options

**Evidence:**
- [![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/Hack23/riksdagsmonitor/badge)](https://scorecard.dev/viewer/?uri=github.com/Hack23/riksdagsmonitor)
- [Security Overview](https://github.com/Hack23/riksdagsmonitor/security)

---

## Reporting a Vulnerability

We take the security of Riksdagsmonitor seriously. If you have found a potential security vulnerability, we kindly ask you to report it privately, so that we can assess and address the issue before it becomes publicly known.

### What Constitutes a Vulnerability

A vulnerability is a weakness or flaw in the project that can be exploited to compromise the security, integrity, or availability of the system or its data. Examples include, but are not limited to:

- Cross-site scripting (XSS) in generated content
- Insecure external resource loading
- Exposed secrets or credentials
- Supply chain vulnerabilities in dependencies
- Content injection through data pipelines

### How to Privately Report a Vulnerability using GitHub

1. On GitHub.com, navigate to the main page of the [riksdagsmonitor repository](https://github.com/Hack23/riksdagsmonitor).
2. Under the repository name, click **Security**.
3. In the left sidebar, under "Reporting", click **Advisories**.
4. Click **Report a vulnerability** to open the advisory form.
5. Fill in the advisory details form with as much information as possible.
6. At the bottom of the form, click **Submit report**.

### Disclosure Timeline

Upon receipt of a vulnerability report, our team will:

1. Acknowledge the report within **48 hours**
2. Validate the vulnerability within **7 days**
3. Develop and release a patch or mitigation within **30 days** (depending on complexity and severity)
4. Publish a security advisory with a detailed description of the vulnerability and the fix

### Recognition and Anonymity

We appreciate your effort in helping us maintain a secure project. If your report results in a confirmed security fix, we will recognize your contribution in the release notes, unless you request to remain anonymous.

---

## 🔐 ISMS Framework Integration

Riksdagsmonitor's security practices are part of Hack23 AB's comprehensive Information Security Management System (ISMS):

### 📋 Related ISMS Policies

| 🛡️ **Policy** | 📊 **Application to Riksdagsmonitor** |
|--------------|--------------------------------------|
| [Vulnerability Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md) | 48h response SLA, coordinated disclosure process |
| [Incident Response Plan](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Incident_Response_Plan.md) | P1-P4 incident classification, escalation procedures |
| [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) | Security testing requirements, code review standards |
| [Information Security Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md) | Overall security governance framework |
| [Network Security Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Network_Security_Policy.md) | HTTPS-only, TLS 1.3, CDN security |
| [Cryptography Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Cryptography_Policy.md) | TLS configuration, SRI hashes |

### 🔍 Comprehensive Security Documentation

- **🛡️ Security Architecture:** [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) — Defense-in-depth controls
- **🎯 Threat Model:** [THREAT_MODEL.md](THREAT_MODEL.md) — STRIDE analysis, MITRE ATT&CK mapping
- **🔮 Future Security:** [FUTURE_SECURITY_ARCHITECTURE.md](FUTURE_SECURITY_ARCHITECTURE.md) — Security roadmap
- **🔧 CI/CD Security:** [WORKFLOWS.md](WORKFLOWS.md) — Pipeline security controls

---

## 📚 Related Documents

### 🔐 Security & Architecture
- [🛡️ Security Architecture](SECURITY_ARCHITECTURE.md) — System security design
- [🎯 Threat Model](THREAT_MODEL.md) — Comprehensive threat analysis
- [🔮 Future Security Architecture](FUTURE_SECURITY_ARCHITECTURE.md) — Security roadmap
- [🏗️ Architecture](ARCHITECTURE.md) — System architecture (C4 models)
- [🔧 Workflows](WORKFLOWS.md) — CI/CD pipeline documentation

### 📋 Project Governance
- [🤝 Contributing Guidelines](CONTRIBUTING.md) — Secure contribution process
- [📜 Code of Conduct](CODE_OF_CONDUCT.md) — Community standards
- [📋 README](README.md) — Project overview and classification

### 🛡️ ISMS Policies (Hack23 AB)
- [🔐 Information Security Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md)
- [🔍 Vulnerability Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md)
- [🚨 Incident Response Plan](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Incident_Response_Plan.md)
- [🛠️ Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md)

---

**📋 Document Control:**  
**✅ Approved by:** James Pether Sörling, CEO  
**📤 Distribution:** Public  
**🏷️ Classification:** [![Confidentiality: Public](https://img.shields.io/badge/C-Public-lightgrey?style=flat-square)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md#confidentiality-levels)  
**📅 Effective Date:** 2026-02-20  
**⏰ Next Review:** 2026-05-20  
**🎯 Framework Compliance:** [![ISO 27001](https://img.shields.io/badge/ISO_27001-2022_Aligned-blue?style=flat-square&logo=iso&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) [![NIST CSF 2.0](https://img.shields.io/badge/NIST_CSF-2.0_Aligned-green?style=flat-square&logo=nist&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) [![CIS Controls](https://img.shields.io/badge/CIS_Controls-v8.1_Aligned-orange?style=flat-square&logo=cisecurity&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md)
