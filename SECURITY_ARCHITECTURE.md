# 🛡️ Riksdagsmonitor - Security Architecture

**Document Version:** 1.3  
**Last Updated:** 2026-02-10  
**Classification:** Public  
**Owner:** Hack23 AB (Org.nr 5595347807)

## 🎯 Executive Summary

Riksdagsmonitor is a web platform providing Swedish Parliament intelligence and election monitoring capabilities. This document outlines the security architecture aligned with Hack23 AB's Information Security Management System (ISMS), [Classification Framework](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md), and compliance frameworks (ISO 27001, NIST CSF 2.0, CIS Controls v8.1).

**Security Posture:** Defense-in-depth architecture with dual-deployment (AWS CloudFront/S3 multi-region primary, GitHub Pages disaster recovery), HTTPS-only access, and comprehensive CI/CD security controls.

## 1. 🏗️ System Overview

### 1.1 🎯 Purpose and Scope

**Purpose:**
- Monitor Swedish Riksdag political activity
- Provide real-time intelligence on 349 MPs
- Track coalition stability and election predictions
- Deliver 9 dashboard sections with CIA platform data (4 functional: committee, coalition, election-cycle, risk/anomaly; 5 placeholders: party, seasonal, pre-election, ministry, anomaly detection)
- OSINT-powered political transparency

**Scope:**
- Web application with HTML/CSS/JavaScript (Chart.js, D3.js)
- 9 dashboard sections (4 functional with 150KB+ JavaScript, 5 placeholders with HTML structure only)
- Multi-language support (14 languages)
- CIA data integration with local CSV caching
- AWS CloudFront + S3 hosting infrastructure (Primary)
- GitHub Pages hosting infrastructure (Disaster Recovery)
- AWS Route 53 DNS with health checks and automatic failover

### 1.2 🔐 AWS Security Controls

**AWS Infrastructure Security (Primary Deployment):**

- **🔑 Authentication & Access Control:**
  - GitHub Actions OIDC integration for AWS authentication (ephemeral credentials)
  - No long-lived AWS access keys or IAM user credentials stored
  - Least-privilege IAM roles with time-limited session tokens
  - S3 bucket policies restrict access to CloudFront Origin Access Identity only

- **📊 Audit Logging & Monitoring:**
  - AWS CloudTrail enabled for all API activity logging
  - 90-day log retention in dedicated S3 audit bucket
  - CloudWatch metrics for S3, CloudFront, and Route 53
  - Real-time alerting on security events and anomalies

- **🔒 Data Protection:**
  - S3 server-side encryption at rest (AES-256)
  - S3 bucket versioning enabled for rollback capability
  - Cross-region replication (typically within minutes) (us-east-1 → eu-west-1)
  - TLS 1.3 encryption in transit via CloudFront

- **🛡️ DDoS & Threat Protection:**
  - AWS Shield Standard (automatic DDoS protection)
  - CloudFront geographic restrictions capability
  - Planned request rate limiting via AWS WAF rate-based rules associated with CloudFront
  - AWS Web Application Firewall (WAF) planned for advanced application-layer threat protection and rate limiting

### 1.3 Architecture Diagram

```mermaid
graph TB
    User[User Browser]
    Route53[AWS Route 53<br/>DNS + Health Checks]
    
    subgraph "Primary: AWS Infrastructure"
        CF[CloudFront CDN<br/>600+ Edge Locations]
        S3US[S3 Bucket us-east-1<br/>Primary Storage + Versioning]
        S3EU[S3 Bucket eu-west-1<br/>Cross-region Replica<br/>Active Failover Origin]
    end
    
    subgraph "Disaster Recovery: GitHub"
        GHCDN[GitHub Pages CDN<br/>Standby Deployment]
    end
    
    subgraph "GitHub Infrastructure"
        GitHubRepo[GitHub Repository<br/>main branch]
        Actions[GitHub Actions<br/>CI/CD Dual Deploy]
        Security[Security Scanning<br/>Dependabot, CodeQL, Secrets]
    end
    
    CIA[CIA Platform<br/>www.hack23.com/cia]
    
    User -->|DNS Query| Route53
    Route53 -->|DNS Response: CloudFront Primary| User
    Route53 -.->|DNS Response: GitHub Pages on Failover| User
    User -->|HTTPS Only TLS 1.3| CF
    User -.->|HTTPS Only TLS 1.3 (DR)| GHCDN
    
    CF -->|Cache Miss| S3US
    CF -.->|Origin Failover on 5xx errors| S3EU
    S3US -->|Async Cross-Region Replication (&lt;15 min RPO)| S3EU
    
    User -->|External Links| CIA
    
    GHCDN --> GitHubRepo
    Actions -->|Deploy| S3US
    Actions -->|Deploy| GitHubRepo
    Security -->|Monitor| GitHubRepo
    
    style User fill:#e1f5ff
    style Route53 fill:#ff9800
    style CF fill:#4caf50
    style S3US fill:#2196f3
    style GHCDN fill:#90caf9
    style Actions fill:#ff9800
    style Security fill:#f44336
    style CIA fill:#9c27b0
```

## 2. 🔐 Security Architecture Components

### 2.1 Authentication & Access Control

**Public Access Model:**
- **No Authentication Required:** Static public website accessible to all
- **Content Management:** GitHub repository access controlled via GitHub authentication
  - MFA required for all contributors
  - SSH keys with passphrase protection
  - GPG signing required for commits
  - Branch protection rules enforced

**Control Mapping:**
- ISO 27001: A.9.2 User Access Management
- NIST CSF 2.0: PR.AC-1 (Identities and credentials managed)
- CIS Controls v8.1: 5.1 (Establish and Maintain an Inventory of Accounts)

### 2.2 Authorization Model

**GitHub Repository Permissions:**
- **Admin:** Repository owners (Hack23 organization owners)
- **Write:** Approved contributors with MFA
- **Read:** Public access (website viewing)

**CI/CD Pipeline Permissions:**
- Least privilege GitHub Actions permissions
- Scoped GITHUB_TOKEN for workflow operations
- Secrets management via GitHub Secrets

**Control Mapping:**
- ISO 27001: A.9.4 System and Application Access Control
- NIST CSF 2.0: PR.AC-4 (Access permissions managed)
- CIS Controls v8.1: 6.8 (Define and Maintain Role-Based Access Control)

### 2.3 Data Security

**Information Classification:**

Following Hack23 AB ISMS information classification policy:

| Classification | Data Types | Handling Requirements | Storage / Access Method |
|----------------|-----------|----------------------|------------------------|
| 🟢 **Public** | Website content, Swedish Riksdag open data, documentation | No restrictions, TLS 1.3 in transit | GitHub repository, AWS S3, GitHub Pages (CDN) |
| 🟡 **Internal** | GitHub Actions secrets, AWS credentials, deployment configs | Encrypted at rest, MFA access, least privilege | GitHub Secrets, AWS IAM (ephemeral STS/OIDC) |
| 🟠 **Confidential** | Not applicable | N/A | N/A |
| 🔴 **Restricted** | Not applicable | N/A | N/A |

**Data Inventory:**
- **Public Data:** 
  - 14-language website (HTML/CSS)
  - Swedish Parliament data (349 MPs, 50+ years)
  - Election statistics, voting records
  - Government budget data
  - All source code and documentation
- **Internal Data:**
  - GitHub repository and Actions access tokens (if used, e.g., optional PATs for local tooling)
  - AWS IAM credentials (ephemeral via OIDC)
  - GitHub Actions workflow secrets
- **No Sensitive End-User Data:**
  - ❌ No end-user accounts or authentication features
  - ❌ No collection of non-public personal data from site users
  - ⚠️ Public personal data about Swedish public officials (e.g., names, person identifiers, roles) from Riksdag open data and cia-data datasets
    - **Information classification:** 🟢 Public (openly available data)
    - **Privacy classification:** Personal data – public-official (GDPR/PII handling still applies despite public availability)

**Data Protection Controls:**

**In Transit:**
- TLS 1.3 encryption (AWS CloudFront + GitHub Pages)
- HTTPS-only access enforced
- HSTS headers configured (max-age=31536000)
- Certificate transparency monitoring

**At Rest:**
- AWS S3 server-side encryption (AES-256)
- GitHub repository encryption at rest
- GitHub Secrets encryption (Libsodium sealed boxes)
- Immutable Git history for audit trail
- S3 versioning enabled for rollback capability

**Access Controls:**
- Public data: No authentication (intentionally public)
- Internal data: GitHub MFA, SSH keys, GPG signing
- AWS credentials: Ephemeral OIDC tokens only (no long-lived keys)
- Least privilege IAM roles

**Data Lifecycle:**
- **Creation:** Git commits with GPG signing
- **Storage:** GitHub + AWS S3 with versioning
- **Access:** TLS 1.3 encrypted channels only
- **Retention:** Indefinite (public data), 90 days (AWS CloudTrail logs)
- **Deletion:** Git history retained, S3 versioning for recovery

**Control Mapping:**
- ISO 27001: A.5.10 (Acceptable use - data classification), A.10.1 (Cryptographic controls)
- NIST CSF 2.0: PR.DS-1 (Data-at-rest protected), PR.DS-2 (Data-in-transit protected)
- CIS Controls v8.1: 3.1 (Establish data management), 3.10 (Encrypt data in transit)

### 2.4 Network Security

**AWS CloudFront Infrastructure (Primary):**
- **DDoS Protection:** AWS Shield Standard (automatic protection)
- **CDN:** 600+ global edge locations
- **WAF:** Available for application-layer protection (roadmap: 2027 Q2)
- **TLS:** CloudFront managed certificates with TLS 1.3
- **Firewall:** AWS infrastructure-level protection

**GitHub Pages Infrastructure (Disaster Recovery):**
- **DDoS Protection:** GitHub infrastructure-level protection
- **CDN:** GitHub Pages CDN for global distribution
- **Firewall:** GitHub-managed infrastructure firewall

**Security Headers (Target Configuration - AWS CloudFront Response Headers Policy):**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://raw.githubusercontent.com
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Note:** CSP includes `'unsafe-inline'` for Chart.js/D3.js inline styles and large inline dashboard script (946 lines). The `connect-src` directive includes `https://raw.githubusercontent.com` to allow fetching CIA CSV data from the cia repository. Security headers are configured via AWS CloudFront Response Headers Policy for the primary deployment. GitHub Pages disaster recovery inherits default GitHub Pages security headers. Future enhancement: nonce-based CSP for stricter inline script control (roadmap: 2027). Chart.js, D3.js, and chartjs-plugin-annotation are hosted locally on CloudFront (js/lib/) rather than via external CDN, eliminating external script dependencies.

**Control Mapping:**
- ISO 27001: A.13.1 Network Security Management
- NIST CSF 2.0: PR.AC-5 (Network integrity protected)
- CIS Controls v8.1: 13.1 (Centralize Security Event Alerting)

### 2.5 Application Security

**Web Application Security:**
- **Client-Side JavaScript:** Chart.js and D3.js for interactive dashboards
  - 3 external JS files loaded: `scripts/coalition-dashboard.js` (33KB), `scripts/committees-dashboard.js` (39KB), `js/election-cycle-dashboard.js` (46KB) ≈118KB
  - 1 large inline script (946 lines, ~32KB) handling risk dashboard only (includes one anomaly chart within risk dashboard)
  - 5 placeholder dashboard sections with HTML structure but no JavaScript initialization (future implementation):
    - Party Performance Dashboard
    - Seasonal Patterns Dashboard
    - Pre-Election Monitoring Dashboard
    - Ministry Dashboard
    - Anomaly Detection Dashboard (standalone section with timeline/heatmap/distribution charts - distinct from single anomaly chart in risk dashboard)
  - Total: ~150KB active JavaScript code (118KB external + 32KB inline; source size, transfer size smaller when compressed)
- **XSS Mitigation:** Content Security Policy (CSP) headers with script-src restrictions
- **Input Sanitization:** CIA CSV data is subjected to best-effort, non-blocking schema validation during CI/data-integration workflows (e.g., `.github/workflows/validate-cia-data.yml`); validation failures currently surface as warnings rather than blocking publication, and client-side code then parses this CSV (D3 CSV utilities/custom parsers) and applies basic sanity checks prior to rendering via Chart.js/D3.js
- **External Dependencies:**
  - Chart.js v4.4.1 (hosted locally on CloudFront/S3 at js/lib/chart.umd.js)
  - chartjs-plugin-annotation v3.0.1 (hosted locally on CloudFront/S3 at js/lib/chartjs-plugin-annotation.min.js)
  - D3.js v7.9.0 (hosted locally on CloudFront/S3 at js/lib/d3.min.js)
  - Google Fonts (Inter, Orbitron, Share Tech Mono - via fonts.googleapis.com and fonts.gstatic.com CDN)
- **CIA Data Integration:** Fetches CSV data from `https://raw.githubusercontent.com/Hack23/cia/` that is subject to non-blocking CI schema validation checks in pre-processing (e.g., `.github/workflows/validate-cia-data.yml`), with local caching for performance; the browser consumes this dataset which may contain validation warnings
- **No User Input Processing:** Dashboards do not accept or process arbitrary user input; they display pre-processed CIA data generated upstream in CI/data pipelines that has passed non-blocking schema validation checks where configured
- **No Server-Side Code:** Static hosting eliminates injection vulnerabilities

**Dashboard Security:**
- **9 Dashboard Sections (4 functional, 5 placeholders):**

**Functional Dashboards (4):**
1. **Committee Dashboard** (`scripts/committees-dashboard.js` 39KB) ✅
2. **Coalition Dashboard** (`scripts/coalition-dashboard.js` 33KB) ✅
3. **Election Cycle Dashboard** (`js/election-cycle-dashboard.js` 46KB) ✅
4. **Risk Dashboard** (inline script ~32KB, includes one anomaly detection chart) ✅

**Placeholder Dashboard Sections (5 - HTML structure only, no JavaScript):**
5. **Party Performance Dashboard** - Canvas elements present, awaiting JS implementation
6. **Seasonal Patterns Dashboard** - Canvas elements present, awaiting JS implementation
7. **Pre-Election Monitoring Dashboard** - Canvas elements present, awaiting JS implementation
8. **Ministry Dashboard** - Canvas elements present, awaiting JS implementation
9. **Anomaly Detection Dashboard** - Standalone section with multiple canvas elements (anomaly-timeline-chart, zscore-distribution-chart, anomaly-type-chart, quarterly-frequency-chart), distinct from the single anomaly chart within risk dashboard, awaiting JS implementation

**Dependency Management:**
- Chart.js, D3.js, and chartjs-plugin-annotation hosted locally on CloudFront/S3 (js/lib/); versions reviewed manually at least quarterly and after critical CVE disclosures
- Library file integrity can be verified via SHA-256 hashes if needed for deployment validation (not required for runtime as served from same origin)
- Dependabot configured for GitHub Actions workflows (`.github/dependabot.yml`) and automated dependency risk assessment for repository-managed components via GitHub dependency-review and Dependabot alerts
- Supply chain security scanning via CodeQL and OpenSSF Scorecards

**Control Mapping:**
- ISO 27001: A.14.2 Security in Development and Support
- NIST CSF 2.0: PR.IP-12 (A vulnerability management plan developed)
- CIS Controls v8.1: 16.1 (Establish and Maintain a Secure Application Development Process)

### 2.6 Monitoring & Logging

**Security Monitoring:**
- **GitHub Security Features:**
  - Dependabot alerts for dependency vulnerabilities
  - Secret scanning for exposed credentials
  - Code scanning (CodeQL) for security issues
  - Security advisories tracking

**Audit Logging:**
- **Git Commit History:** Immutable audit trail of all changes
- **GitHub Actions Logs:** CI/CD pipeline execution logs
- **GitHub Audit Log:** Organization-level access and change logs

**Alert Mechanisms:**
- GitHub Security Advisories
- Email notifications for security events
- Pull request checks for quality gates

**Control Mapping:**
- ISO 27001: A.12.4 Logging and Monitoring
- NIST CSF 2.0: DE.CM-1 (The network is monitored)
- CIS Controls v8.1: 8.2 (Collect Audit Logs)

### 2.7 Incident Response

**Security Incident Procedures:**
1. **Detection:** GitHub security alerts, Dependabot, manual reporting
2. **Containment:** Disable GitHub Pages, revert commits if needed
3. **Investigation:** Review Git history, GitHub Actions logs
4. **Remediation:** Apply security patches, update dependencies
5. **Recovery:** Re-deploy verified secure version
6. **Lessons Learned:** Update SECURITY_ARCHITECTURE.md and THREAT_MODEL.md

**Incident Response Team:**
- **Security Lead:** James Pether Sörling (CISSP, CISM)
- **Repository Owners:** Hack23 organization admins
- **Escalation:** Follow Hack23 ISMS Incident Response Plan

**Control Mapping:**
- ISO 27001: A.16.1 Management of Information Security Incidents
- NIST CSF 2.0: RS.CO-1 (Personnel know their roles and order of operations)
- CIS Controls v8.1: 17.1 (Designate Personnel to Manage Incident Handling)

## 3. 📋 Compliance Mapping

### 3.1 ISO 27001:2022 Controls

| Control | Implementation | Status |
|---------|----------------|--------|
| A.8.2 | Information classification scheme, data inventory, handling controls | ✅ Implemented |
| A.9.2 | GitHub MFA, SSH keys, GPG signing | ✅ Implemented |
| A.9.4 | Repository permissions, least privilege | ✅ Implemented |
| A.10.1 | TLS 1.3, HTTPS-only, encryption at rest | ✅ Implemented |
| A.12.4 | Git history, GitHub audit logs, AWS CloudTrail | ✅ Implemented |
| A.13.1 | AWS infrastructure, security headers | ✅ Implemented |
| A.14.2 | Dependabot, CodeQL scanning | ✅ Implemented |
| A.16.1 | Incident response procedures | ✅ Implemented |

### 3.2 NIST CSF 2.0 Categories

| Function | Category | Implementation |
|----------|----------|----------------|
| GOVERN | Asset Management | Information classification scheme, data inventory |
| IDENTIFY | Asset Management | GitHub repository, static assets, data sources |
| PROTECT | Access Control | GitHub authentication, MFA, AWS OIDC |
| PROTECT | Data Security | TLS 1.3, HTTPS-only, encryption at rest |
| DETECT | Security Monitoring | Dependabot, CodeQL, secret scanning |
| RESPOND | Incident Response | Documented procedures, escalation paths |
| RECOVER | Recovery Planning | Git rollback, S3 versioning, multi-region replication |

### 3.3 CIS Controls v8.1

| IG | Control | Implementation |
|----|---------|----------------|
| IG1 | 3.1 Establish Data Management | Information classification policy, data inventory |
| IG1 | 3.10 Encrypt Data in Transit | TLS 1.3, HTTPS-only |
| IG1 | 5.1 Account Inventory | GitHub organization audit |
| IG1 | 8.2 Collect Audit Logs | Git history, GitHub Actions logs, AWS CloudTrail |
| IG2 | 6.8 Role-Based Access Control | GitHub repository permissions, AWS IAM |
| IG2 | 13.1 Security Event Alerting | GitHub security alerts, AWS CloudWatch |
| IG2 | 16.1 Secure Development | Static site with reduced injection surface; mitigated via CSP/SRI/safe DOM handling; secure CI/CD |

## 4. 🛡️ Security Controls Summary

### 4.1 Preventive Controls

1. **Access Control:**
   - GitHub MFA requirement
   - SSH key authentication with passphrase
   - GPG commit signing
   - Branch protection rules
   - AWS OIDC authentication (no long-lived credentials)

2. **Network Security:**
   - HTTPS-only access (TLS 1.3)
   - Security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy)
   - AWS CloudFront DDoS protection (AWS Shield Standard)
   - Route 53 health checks and automatic failover
   - GitHub infrastructure DDoS protection (DR)

3. **Development Security:**
   - HTML/CSS/JavaScript with Chart.js and D3.js
   - CSP headers with SRI for CDN resources
   - No user input processing (display CIA data only)
   - Dependency scanning via GitHub Dependabot alerts
   - Code quality checks in CI/CD (HTMLHint, linkinator)
   - CIA data validation against JSON schemas

### 4.2 Detective Controls

1. **Security Monitoring:**
   - Dependabot vulnerability alerts
   - Secret scanning
   - CodeQL static analysis
   - GitHub audit logs

2. **Quality Checks:**
   - HTML validation (HTMLHint)
   - Link checking (linkinator)
   - Automated CI/CD pipeline checks

### 4.3 Corrective Controls

1. **Incident Response:**
   - Documented procedures
   - Git rollback capability
   - Rapid re-deployment via GitHub Actions

2. **Patch Management:**
   - Dependabot automatic updates
   - Rapid deployment via GitHub Actions
   - Version control for rollback

## 5. 📝 Security Assumptions and Constraints

### 5.1 Assumptions

1. **AWS Infrastructure:** Trusted cloud provider with robust security
2. **GitHub Infrastructure:** Trusted cloud provider with robust security (DR)
3. **Client-Side Security:** Chart.js/D3.js libraries are secure, maintained, and hosted locally on CloudFront
4. **CloudFront Security:** AWS CloudFront is trusted for static asset delivery with 99.9% SLA
5. **Public Data:** All content is public information (Swedish Riksdag open data)
6. **External Dependencies:** CIA platform (www.hack23.com/cia) maintains its own security
7. **Browser Security:** Users have modern browsers with JavaScript enabled

### 5.2 Constraints

1. **AWS Infrastructure Limitations:**
   - S3 static website limitations (no server-side code execution)
   - CloudFront caching behavior (potential stale content)
   - Cost constraints for high traffic scenarios

2. **GitHub Pages Limitations (DR):**
   - No server-side code execution
   - No database access
   - Limited customization of HTTP headers
   - Fixed infrastructure (cannot modify underlying OS)

3. **Client-Side JavaScript Limitations:**
   - Requires JavaScript enabled in browser
   - CSP `'unsafe-inline'` needed for Chart.js/D3.js
   - Browser compatibility requirements (ES6+)
   - Limited control over client execution environment

## 6. ⚠️ Risk Assessment

### 6.1 Residual Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AWS CloudFront/S3 Outage | Low | Medium | GitHub Pages DR, documented failover |
| GitHub Platform Outage (DR) | Low | Low | AWS primary handles traffic |
| DDoS Attack on AWS | Low | Low | AWS Shield Standard, CloudFront protection |
| XSS via Chart.js/D3.js | Low | Medium | CSP headers, locally-hosted libraries (no external CDN), quarterly version reviews |
| Compromised GitHub Account | Low | High | MFA, SSH keys, GPG signing |
| Chart.js/D3.js Vulnerability | Medium | Medium | Manual quarterly/CVE review, SRI validation, rapid version pin updates |
| CIA Data Injection | Low | Medium | Schema validation, local CSV caching |
| Content Defacement | Low | Medium | Git rollback, branch protection, dual deployment |
| DNS Hijacking via Route 53 | Very Low | High | DNSSEC (planned), IAM least privilege |

### 6.2 Accepted Risks

1. **Client-Side JavaScript:** Acceptable for interactive dashboards with CSP and SRI
2. **AWS Platform Dependency:** Acceptable given AWS's security posture and GitHub Pages DR
3. **GitHub Platform Dependency (DR):** Acceptable with AWS as primary
4. **External CIA Platform Dependency:** Acceptable with documented availability in THREAT_MODEL.md
5. **CSP 'unsafe-inline':** Acceptable for Chart.js/D3.js dashboard rendering (future: nonce-based CSP)

## 7. 🏛️ Security Governance

### 7.1 Roles and Responsibilities

| Role | Responsibility |
|------|----------------|
| Security Architect | Overall security architecture and compliance |
| Repository Owners | Access control, security monitoring |
| Contributors | Secure coding practices, MFA compliance |
| CISO (James Pether Sörling) | ISMS oversight, incident escalation |

### 7.2 Review and Update Schedule

- **Security Architecture Review:** Annual or after major changes
- **Threat Model Update:** Quarterly or after incidents
- **Dependency Updates:** Automated via Dependabot (weekly)
- **Access Control Review:** Quarterly

### 7.3 Related Documentation

- [Hack23 ISMS](https://github.com/Hack23/ISMS)
- [Secure Development Policy](https://github.com/Hack23/ISMS/blob/main/Secure_Development_Policy.md)
- [THREAT_MODEL.md](./THREAT_MODEL.md) - Riksdags Monitor threat analysis
- [Information Security Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md)

## 8. ✅ Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Security Architect | James Pether Sörling, CISSP, CISM | 2026-02-10 | [Digital Signature] |
| Repository Owner | Hack23 AB | 2026-02-10 | [Approved via Git Commit] |

---

**Document Control:**
- **Repository:** https://github.com/Hack23/riksdagsmonitor
- **Path:** /SECURITY_ARCHITECTURE.md
- **Format:** Markdown
- **Classification:** Public
- **Version:** 1.3
- **Last Updated:** 2026-02-10
- **Next Review:** 2027-02-10
- **Classification Framework:** [Hack23 ISMS-PUBLIC](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md)
