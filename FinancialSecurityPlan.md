<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">💰 Riksdagsmonitor — Financial & Security Plan</h1>

<p align="center">
  <strong>📊 Infrastructure Cost Analysis & Security Investment</strong><br>
  <em>🔗 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md">Secure Development Policy</a> · <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md">Classification Framework</a></em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--03--12-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Review-Annual-orange?style=for-the-badge" alt="Review Cycle"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.0 | **📅 Last Updated:** 2026-03-12 (UTC)  
**🔄 Review Cycle:** Annual | **⏰ Next Review:** 2027-03-12

---

## 📋 Purpose

This document outlines the financial and security implementation plan for the **Riksdagsmonitor** platform — a static HTML5/CSS3 website providing Swedish Parliament transparency across 14 languages.

Riksdagsmonitor uses a **dual-deployment architecture** with AWS CloudFront + S3 as the primary delivery mechanism and GitHub Pages as the disaster recovery standby, as detailed in the [Business Continuity Plan](BCPPlan.md). For architectural context, see the [Architecture Documentation](ARCHITECTURE.md) and [End-of-Life Strategy](End-of-Life-Strategy.md).

---

## 💵 Cost Summary — Dual Deployment Architecture

### Cash Flow Overview

| **Time Frame** | **Monthly (USD)** | **Annual (USD)** |
|----------------|-------------------|------------------|
| **Primary Infrastructure (AWS)** | **$7.50** | **$90.00** |
| **DR Infrastructure (GitHub Pages)** | **$0.00** | **$0.00** |
| **Domain Registration** | **$1.00** | **$12.00** |
| **Security Tooling** | **$0.00** | **$0.00** |
| **Development CI/CD** | **$0.00** | **$0.00** |
| **Grand Total** | **$8.50** | **$102.00** |

> **Note:** Riksdagsmonitor leverages free-tier and open-source services extensively. The primary recurring costs are AWS S3/CloudFront hosting (including Route 53 DNS) and domain registration. All security tooling is free for open-source projects.

---

## 🏗️ Infrastructure Cost Breakdown

### Primary Deployment: AWS CloudFront + S3

| **Component** | **AWS Service** | **Monthly (USD)** | **Annual (USD)** | **Notes** |
|---------------|-----------------|-------------------|------------------|-----------|
| **Static Hosting** | S3 Standard | $0.50 | $6.00 | ~5 GB storage, static HTML/CSS/JS/data |
| **CDN** | CloudFront | $5.00 | $60.00 | Global edge caching, ~50 GB/month transfer |
| **SSL/TLS** | ACM (Certificate Manager) | $0.00 | $0.00 | Free public certificates |
| **DNS** | Route 53 | $1.00 | $12.00 | Hosted zone + health checks |
| **Monitoring** | CloudWatch (basic) | $0.00 | $0.00 | Basic metrics included |
| **Failover** | Route 53 Health Checks | $1.00 | $12.00 | 2 health checks for failover |
| **Subtotal (AWS)** | | **$7.50** | **$90.00** | |

### Disaster Recovery: GitHub Pages (Standby)

| **Component** | **Service** | **Monthly (USD)** | **Annual (USD)** | **Notes** |
|---------------|-------------|-------------------|------------------|-----------|
| **Hosting** | GitHub Pages | $0.00 | $0.00 | Free for public repos |
| **CDN** | GitHub Pages CDN (Fastly) | $0.00 | $0.00 | Included with GitHub Pages |
| **SSL/TLS** | Let's Encrypt (via GitHub) | $0.00 | $0.00 | Automatic HTTPS |
| **Subtotal (DR)** | | **$0.00** | **$0.00** | |

### Domain & Registration

| **Component** | **Service** | **Monthly (USD)** | **Annual (USD)** | **Notes** |
|---------------|-------------|-------------------|------------------|-----------|
| **Domain** | riksdagsmonitor.com | $1.00 | $12.00 | Annual domain renewal |
| **DNS** | Route 53 Hosted Zone | $0.00 | $0.00 | Included in AWS section above (Route 53 line) |
| **SSL Certificate** | ACM | $0.00 | $0.00 | Free for AWS services |
| **Subtotal (Domain)** | | **$1.00** | **$12.00** | Domain registration only; DNS cost in AWS section |

---

## 🔐 Security Investment Analysis

### Current Security Services (All Free Tier / Open Source)

| **Security Service** | **Provider** | **Annual Cost** | **ISMS Policy Alignment** |
|----------------------|-------------|-----------------|---------------------------|
| **SAST Scanning** | [CodeQL](https://codeql.github.com/) | $0.00 | [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) |
| **Dependency Scanning** | [Dependabot](https://docs.github.com/en/code-security/dependabot) + npm audit | $0.00 | [Vulnerability Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md) |
| **Secret Scanning** | [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning) | $0.00 | [Cryptography Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Cryptography_Policy.md) |
| **Supply Chain Security** | [SLSA Build Provenance](https://slsa.dev/) + [OpenSSF Scorecard](https://scorecard.dev/) | $0.00 | [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) |
| **SBOM Generation** | GitHub SBOM (SPDX format) | $0.00 | [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) |
| **CI/CD Hardening** | [step-security/harden-runner](https://github.com/step-security/harden-runner) | $0.00 | [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) |
| **HTML Validation** | [HTMLHint](https://htmlhint.com/) | $0.00 | [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) |
| **Dead Code Detection** | [knip](https://knip.dev/) | $0.00 | [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) |
| **SRI Hash Generation** | [vite-plugin-sri-gen](https://www.npmjs.com/package/vite-plugin-sri-gen) | $0.00 | [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) |
| **Unit Testing** | [Vitest](https://vitest.dev/) | $0.00 | [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) |
| **E2E Testing** | [Cypress](https://www.cypress.io/) (OSS) | $0.00 | [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) |
| **Performance Monitoring** | [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) | $0.00 | Quality gates |
| **Total Security Tooling** | | **$0.00** | |

### Security ROI Metrics

| **Metric** | **Value** | **Source** |
|------------|-----------|-----------|
| **Total Annual Security Investment** | $0/year | Free OSS tooling |
| **Total Annual Infrastructure** | $102/year | AWS + domain costs |
| **Security-to-Infrastructure Ratio** | Included | Security is built-in, not bolt-on |
| **Vulnerability Detection Rate** | >95% | Automated scanning pipeline (CodeQL + Dependabot + npm audit) |
| **Mean Time to Detect (MTTD)** | <24 hours | Automated CI/CD scanning on every push |
| **Mean Time to Remediate (MTTR)** | <48 hours critical, <7 days high | Dependabot auto-merge + manual review |
| **Supply Chain Score** | OpenSSF Scorecard | Automated weekly assessment |
| **Build Attestation** | SLSA Level 3 | Provenance attached to every release |

---

## 🛡️ ISMS Policy Alignment

### Security Investment by ISMS Policy

| 🛡️ ISMS Policy | 💰 Annual Investment | 🔧 Services | 📊 Business Value |
|----------------|---------------------|-------------|-------------------|
| [**Incident Response Plan**](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Incident_Response_Plan.md) | $12.00 | Route 53 Health Checks | Automated failover detection<br>DR activation capability |
| [**Vulnerability Management**](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md) | $0.00 | Dependabot + CodeQL + npm audit | Continuous vulnerability scanning<br>Automated patch PRs |
| [**Cryptography Policy**](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Cryptography_Policy.md) | $0.00 | ACM + SRI + GitHub Secret Scanning | TLS 1.3 certificates<br>Subresource integrity<br>Secret leak prevention |
| [**Network Security Policy**](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Network_Security_Policy.md) | $60.00 | CloudFront | DDoS protection (AWS Shield Standard)<br>Edge caching reduces origin exposure |
| [**Information Security Policy**](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md) | $0.00 | CloudWatch (basic) + GitHub Audit Log | Infrastructure monitoring<br>Repository access auditing |
| [**Business Continuity Plan**](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Business_Continuity_Plan.md) | $30.00 | S3 ($6) + Route 53 DNS ($12) + Domain ($12) | Dual-deployment resilience<br>GitHub Pages DR at $0 additional |
| [**Secure Development Policy**](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) | $0.00 | SLSA + SBOM + harden-runner | Supply chain security<br>Build provenance attestation |
| **Total** | **$102.00** | | |

### Cost Efficiency Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│                    Annual Cost Distribution                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CloudFront CDN      █████████████████████████████████  $60 (59%)│
│  Route 53 DNS        ██████                            $12 (12%) │
│  Route 53 Health     ██████                            $12 (12%) │
│  Domain Registration ██████                            $12 (12%) │
│  S3 Storage          ███                               $6  (6%)  │
│  Security Tooling    (included in free tier)            $0  (0%) │
│                                                                  │
│  Total: $102/year ($8.50/month)                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Insight**: By leveraging open-source security tooling and GitHub's free tier for public repositories, Riksdagsmonitor achieves **enterprise-grade security posture at near-zero security cost**. The entire annual budget of $102 is spent on infrastructure availability, not security tooling.

---

## 💡 Included Security Features (Zero Additional Cost)

### AWS Shield Standard (Included with CloudFront)
- **DDoS Protection**: Automatic layer 3/4 DDoS mitigation
- **Always-On Detection**: Network flow monitoring for volumetric attacks
- **No Additional Cost**: Included with every CloudFront distribution

### GitHub Advanced Security (Free for Public Repos)
- **CodeQL Analysis**: Semantic code analysis for JavaScript/TypeScript vulnerabilities
- **Dependabot Alerts**: Real-time vulnerability notifications for all dependencies
- **Secret Scanning**: Detection of leaked credentials in commits
- **Security Advisories**: Coordinated vulnerability disclosure workflow

### Build Integrity (Free)
- **SLSA Build Provenance**: Cryptographic attestation of build process
- **SBOM (SPDX)**: Software Bill of Materials for supply chain transparency
- **SRI Hashes**: Subresource Integrity for all CDN-loaded assets
- **SHA-Pinned Actions**: Supply chain protection for CI/CD pipeline

---

## 📈 Future Cost Projection

### Potential Cost Increases

| **Scenario** | **Trigger** | **Additional Monthly Cost** | **Additional Annual Cost** |
|--------------|-------------|----------------------------|---------------------------|
| **Traffic Growth (10x)** | Viral content / election period | +$20.00 | +$240.00 |
| **AWS WAF Addition** | Targeted attack mitigation | +$10.00 | +$120.00 |
| **CloudFront Functions** | Edge-side language routing | +$2.00 | +$24.00 |
| **AWS GuardDuty** | Enhanced threat detection | +$15.00 | +$180.00 |
| **Worst-Case Total** | All scenarios combined | **$59.00** | **$708.00** |

### Cost Optimisation Opportunities

| **Opportunity** | **Potential Savings** | **Implementation** |
|-----------------|----------------------|-------------------|
| CloudFront Reserved Capacity | 10–20% on data transfer | Commit to 12-month pricing |
| S3 Intelligent Tiering | 5–10% on storage | Enable for data archives |
| Consolidated billing | Shared across Hack23 repos | AWS Organizations |

---

## 📚 Related Documents

### 🏗️ Architecture & Planning
- [🏛️ Architecture](./ARCHITECTURE.md) — System architecture overview
- [🚀 Future Architecture](./FUTURE_ARCHITECTURE.md) — Long-term architectural vision
- [📅 End-of-Life Strategy](./End-of-Life-Strategy.md) — Technology lifecycle management
- [📋 README](./README.md) — Project overview and quick links

### 🛡️ Security & Compliance
- [🛡️ Security Architecture](./SECURITY_ARCHITECTURE.md) — Security model details
- [🎯 Threat Model](./THREAT_MODEL.md) — Risk-driven justification for security services
- [📋 CRA Assessment](./CRA-ASSESSMENT.md) — EU Cyber Resilience Act compliance
- [🔒 Security Policy](./SECURITY.md) — Vulnerability disclosure and management

### 🔄 Operations & Lifecycle
- [📋 BCP Plan](./BCPPlan.md) — Business continuity and disaster recovery
- [🚀 Release Process](./RELEASE_PROCESS.md) — Release procedures with attestations
- [🔄 CI/CD Workflows](./WORKFLOWS.md) — Security-hardened CI/CD pipelines
- [🔮 Future Workflows](./FUTURE_WORKFLOWS.md) — Enhanced CI/CD roadmap

### 🔐 ISMS Policies
- [🔐 Information Security Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md) — Overall security governance
- [🔍 Vulnerability Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md) — Security testing and remediation
- [🚨 Incident Response Plan](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Incident_Response_Plan.md) — Security incident management
- [🏷️ Classification Framework](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) — Business impact and risk assessment

---

**📋 Document Control:**  
**✅ Approved by:** James Pether Sörling, CEO  
**📤 Distribution:** Public  
**🏷️ Classification:** [![Confidentiality: Public](https://img.shields.io/badge/C-Public-lightgrey?style=flat-square&logo=shield&logoColor=black)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md#confidentiality-levels) [![Integrity: Moderate](https://img.shields.io/badge/I-Moderate-yellow?style=flat-square&logo=check-circle&logoColor=black)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md#integrity-levels) [![Availability: Standard](https://img.shields.io/badge/A-Standard-lightgreen?style=flat-square&logo=server&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md#availability-levels)  
**📅 Effective Date:** 2026-03-12  
**⏰ Next Review:** 2027-03-12  
**🎯 Framework Compliance:** [![ISO 27001](https://img.shields.io/badge/ISO_27001-2022_Aligned-blue?style=flat-square&logo=iso&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) [![NIST CSF 2.0](https://img.shields.io/badge/NIST_CSF-2.0_Aligned-green?style=flat-square&logo=nist&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) [![CIS Controls](https://img.shields.io/badge/CIS_Controls-v8.1_Aligned-orange?style=flat-square&logo=cisecurity&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md)
