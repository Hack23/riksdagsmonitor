# 🛡️ Riksdagsmonitor - Security Architecture

**Document Owner:** CEO | **Version:** 1.2 | **Last Updated:** 2026-02-08 (UTC)  
**🔄 Review Cycle:** Quarterly | **⏰ Next Review:** 2026-05-08

**Classification:** Public  
**Owner:** Hack23 AB (Org.nr 5595347807)

## Executive Summary

Static website providing Swedish Parliament intelligence. Dual-deployment architecture: AWS CloudFront/S3 (primary, multi-region us-east-1/eu-west-1) + GitHub Pages (disaster recovery). HTTPS-only, 99.998% availability.

**Key Controls:** TLS 1.3, Static HTML/CSS only, AWS Shield DDoS protection, Multi-region replication, GitHub MFA/GPG, OIDC authentication, S3 versioning, Dependabot/CodeQL scanning.

## Infrastructure

**Primary: AWS**
- CloudFront CDN (600+ global PoPs)
- S3 us-east-1 (primary) → S3 eu-west-1 (replica, automatic failover on 500+ errors)
- Route 53 DNS with health checks

**Disaster Recovery: GitHub Pages**
- Automatic deployment from main branch
- Failover via Route 53 (15 min RTO)

## Security Controls

### 2.1 Access Control
- **AWS:** OIDC role-based (no static credentials), MFA for admin accounts
- **GitHub:** MFA required, SSH keys, GPG commit signing, branch protection
- **Principle:** Least privilege, time-limited sessions

### 2.2 Data Protection
- **In Transit:** TLS 1.3, HTTPS-only, HSTS headers, perfect forward secrecy
- **At Rest:** S3 encryption (AWS-managed keys), versioning enabled (30-day recovery)
- **Replication:** Real-time us-east-1 → eu-west-1
- **Backup:** Git history (immutable), S3 versioning, dual deployment

### 2.3 Network Security
- **DDoS:** AWS Shield Standard (automatic)
- **CDN:** CloudFront with origin failover (<30s on errors)
- **DNS:** Route 53 health checks, automatic failover
- **Headers:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options

### 2.4 Monitoring & Logging
- **Code Security:** Dependabot alerts, CodeQL scanning, secret scanning
- **Infrastructure:** CloudTrail (90-day retention), CloudWatch metrics
- **Audit:** Git commit history, GitHub Actions logs, S3 access logs (optional)

### 2.5 Incident Response
- **Detection:** Automated alerts (GitHub Security, CloudWatch)
- **Response:** Git rollback, S3 versioning restore, CloudFront cache invalidation, DNS failover
- **RTO:** <30 seconds (origin failover) or 15 minutes (DNS failover)
- **RPO:** 0 minutes (Git source of truth)

## Compliance

### ISO 27001:2022
- A.9.2/9.4: Access control (MFA, OIDC, least privilege)
- A.10.1: Cryptography (TLS 1.3, S3 encryption)
- A.12.3/12.4: Backup, logging
- A.13.1: Network security (CloudFront, Shield)
- A.14.2: Secure development (static site, CI/CD)
- A.16.1: Incident response
- A.17.1/17.2: Business continuity, redundancy

### NIST CSF 2.0
- **IDENTIFY:** Asset inventory, risk assessment
- **PROTECT:** Access control, data security, secure development
- **DETECT:** Security monitoring, anomaly detection
- **RESPOND:** Incident response procedures
- **RECOVER:** Recovery planning, backup restoration
- **GOVERN:** ISMS policies, compliance

### CIS Controls v8.1
- 3.10: Encrypt data in transit (TLS 1.3)
- 5.1/5.4: Account management, privilege restriction
- 6.8: Role-based access control
- 8.2: Audit log collection
- 11.1/11.4: Data recovery, isolated backup (multi-region)
- 13.1: Security event alerting
- 16.1: Secure development process

## Risk Assessment

**Overall Risk Score:** 2.8/10.0 (Very Low)

**Key Risks:**
- AWS CloudFront outage → Route 53 failover to GitHub Pages (Mitigated)
- S3 region failure → Automatic origin failover to eu-west-1 (Mitigated)
- GitHub outage → AWS primary unaffected (Mitigated)
- Account compromise → OIDC (no credentials), MFA, audit logs (Mitigated)

**Attack Surface:** Minimal (static HTML/CSS only, no server-side code, no database, no user input)

---

**Related Documentation:**
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [THREAT_MODEL.md](THREAT_MODEL.md) - Threat analysis  
- [BCPPlan.md](BCPPlan.md) - Business continuity
- [WORKFLOWS.md](WORKFLOWS.md) - CI/CD workflows
- [Hack23 ISMS](https://github.com/Hack23/ISMS-PUBLIC)
