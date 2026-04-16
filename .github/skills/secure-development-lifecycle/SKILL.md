---
name: secure-development-lifecycle
description: Comprehensive SDLC security covering planning, development, testing, deployment, and maintenance with classification-driven controls and AI governance
license: Apache-2.0
---

# 🛡️ Secure Development Lifecycle (SDLC) Skill


## 🔴 AI FIRST Quality Principle

> **Apply the AI FIRST principle: never accept first-pass quality. Minimum 2 iterations. Read all output, improve every section. No shortcuts.**

## 🎯 Purpose

Comprehensive security practices for the entire Software Development Lifecycle (SDLC), ensuring security is built in from inception through maintenance. Integrates classification-driven requirements, AI-augmented development controls, and systematic testing frameworks aligned with Hack23 Secure Development Policy.

## 🔐 Core Security Principles

### 🔐 Security by Design
- **🏷️ Project Classification**: CIA triad, RTO/RPO, business impact analysis
- **🛡️ Secure Coding Standards**: OWASP Top 10 alignment with classification controls
- **🏗️ Architecture Documentation**: SECURITY_ARCHITECTURE.md + FUTURE_SECURITY_ARCHITECTURE.md

### 🌟 Transparency Through Documentation
- **📋 Living Security Architecture**: Real-time documentation with classification controls
- **🎖️ Public Security Badges**: OpenSSF Scorecard, SLSA, Quality Gate validation
- **🔓 Open Development**: Demonstrating expertise while maintaining classification

### 🔄 Continuous Security Improvement
- **🏷️ Classification-Driven Testing**: SAST/SCA/DAST per classification levels
- **📈 Performance Monitoring**: Security metrics with availability SLAs
- **🔍 Regular Reviews**: Classification-based risk management and ROI

## 🔄 5-Phase SDLC Security Framework

### 📋 Phase 1: Planning & Design

#### 🏷️ Project Classification (REQUIRED)
Apply [Classification Framework](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md):
- [ ] CIA Triad Analysis (Confidentiality, Integrity, Availability)
- [ ] Business Impact Classification (Revenue, Trust, Compliance)
- [ ] RTO/RPO Definition (Recovery Time/Point Objectives)
- [ ] Risk Assessment Integration with [Risk Register](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Risk_Register.md)
- [ ] Cost-Benefit Analysis (Security ROI)

**Classification Levels:**

| Level | Confidentiality | Integrity | Availability | Security Investment |
|-------|----------------|-----------|--------------|-------------------|
| **Critical** | State secrets | Financial | <1 hour RTO | Maximum controls |
| **High** | Proprietary | Legal | 4 hour RTO | Strong controls |
| **Medium** | Internal | Operational | 24 hour RTO | Standard controls |
| **Low** | Public | Informational | 72 hour RTO | Baseline controls |

#### 🏗️ Security Architecture Design (REQUIRED)
Maintain comprehensive architecture documentation:
- [ ] **SECURITY_ARCHITECTURE.md**: Current implemented security design
- [ ] **FUTURE_SECURITY_ARCHITECTURE.md**: Planned security improvements
- [ ] **ARCHITECTURE.md**: Complete C4 models (Context, Container, Component, Code)
- [ ] **DATA_MODEL.md**: Data structures and classifications
- [ ] **FLOWCHART.md**: Business process flows with security controls

#### 🎯 Threat Modeling (MANDATORY)
Per [Threat Modeling Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md):
- [ ] **STRIDE Framework**: Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege
- [ ] **MITRE ATT&CK Integration**: 14 tactics mapped with techniques
- [ ] **Attack Tree Analysis**: Graphical attack path decomposition
- [ ] **Threat Agent Classification**: 7 categories (Accidental Insiders → Nation-State APTs)
- [ ] **THREAT_MODEL.md**: Comprehensive 9-section threat documentation

### 💻 Phase 2: Development

#### 🛡️ Secure Coding Guidelines
**OWASP Top 10 (2021) Alignment:**
1. **A01 - Broken Access Control**: Proper authentication/authorization
2. **A02 - Cryptographic Failures**: TLS 1.3, AES-256 encryption
3. **A03 - Injection**: Parameterized queries, input validation
4. **A04 - Insecure Design**: Apply threat modeling, secure patterns
5. **A05 - Security Misconfiguration**: Secure defaults, hardened configs
6. **A06 - Vulnerable Components**: SCA scanning, SBOM generation
7. **A07 - Authentication Failures**: MFA, secure session management
8. **A08 - Software/Data Integrity**: Code signing, integrity checks
9. **A09 - Logging Failures**: Comprehensive security event logging
10. **A10 - SSRF**: Validate external resource requests

#### 🔍 Code Review Requirements
**Classification-Based Review:**

| Classification | Review Type | Required Approvals | Security Focus |
|----------------|-------------|-------------------|----------------|
| **Critical** | Formal security review | 2+ reviewers + security architect | All OWASP Top 10 |
| **High** | Security-focused PR review | 2+ reviewers | Critical vulnerabilities |
| **Medium** | Standard PR review | 1+ reviewer | Input validation, auth |
| **Low** | Standard PR review | 1 reviewer | Basic security checks |

#### 🔐 Secret Management (MANDATORY)
- [ ] **Zero Hard-Coded Credentials**: No secrets in source code
- [ ] **GitHub Secrets**: All credentials in encrypted secrets
- [ ] **Rotation Policy**: Critical: 90 days, High: 180 days, Medium/Low: 365 days
- [ ] **Access Logging**: All secret access logged and monitored
- [ ] **Least Privilege**: Secrets scoped to minimum required access

### 🧪 Phase 3: Security Testing

#### 🔬 Static Application Security Testing (SAST)
**Implementation:**
- **Tool**: SonarCloud integration on every commit
- **Quality Gates**: Classification-based failure thresholds
- **Coverage**: All code analyzed for security vulnerabilities
- **Reporting**: Public quality/security dashboards

**Classification-Based Quality Gates:**

| Classification | Security Hotspots | Code Coverage | Duplications | Maintainability |
|----------------|------------------|---------------|--------------|-----------------|
| **Critical** | 0 (block) | ≥90% | <3% | A rating |
| **High** | ≤2 (review) | ≥80% | <5% | A or B rating |
| **Medium** | ≤5 (track) | ≥70% | <10% | B or C rating |
| **Low** | ≤10 (monitor) | ≥60% | <15% | C rating |

#### 📦 Software Composition Analysis (SCA)
**Dependency Security:**
- [ ] **Automated Scanning**: Dependabot, Snyk, or equivalent
- [ ] **SBOM Generation**: Software Bill of Materials for all releases
- [ ] **Vulnerability Database**: CVE, NVD, GitHub Advisory integration
- [ ] **Update Policy**: Classification-based patching SLAs
- [ ] **License Compliance**: OSS license validation

**Remediation SLAs:**

| Severity | Critical Project | High Project | Medium Project | Low Project |
|----------|-----------------|-------------|----------------|-------------|
| **Critical** | 24 hours | 72 hours | 1 week | 2 weeks |
| **High** | 1 week | 2 weeks | 1 month | 2 months |
| **Medium** | 1 month | 2 months | 3 months | 6 months |
| **Low** | Next release | Next release | Next release | Next release |

#### ⚡ Dynamic Application Security Testing (DAST)
**Runtime Security Testing:**
- **Tool**: OWASP ZAP, Burp Suite, or equivalent
- **Scope**: Staging environments (classification-appropriate)
- **Frequency**: Per sprint (Critical/High), quarterly (Medium/Low)
- **Coverage**: All authentication, authorization, input handling paths

#### 🔍 Secret Scanning (CONTINUOUS)
- [ ] **GitHub Secret Scanning**: Enabled on all repositories
- [ ] **Pre-commit Hooks**: Detect secrets before commit
- [ ] **Historical Scanning**: Scan entire git history
- [ ] **Alert Integration**: Immediate notifications to security team
- [ ] **Remediation SLA**: Critical secrets rotated within 1 hour

#### 📋 Test Data Protection (MANDATORY)
- [ ] **Zero Production Data**: Never use real data in dev/test
- [ ] **Data Anonymization**: Pseudonymize test data
- [ ] **Secure Deletion**: Wipe test data after use
- [ ] **Access Control**: Least privilege for test environments

### 🎯 Unit Test Coverage & Quality

#### 📊 Testing Standards
**Minimum Thresholds:**
- **Line Coverage**: ≥80% (Critical/High), ≥70% (Medium/Low)
- **Branch Coverage**: ≥70% (Critical/High), ≥60% (Medium/Low)
- **Mutation Testing**: ≥60% mutation score (Critical only)
- **Test Execution**: Every commit and PR
- **Trend Analysis**: Historical tracking, regression prevention

#### 📚 Required Documentation
**Every repository MUST have:**
- [ ] **UnitTestPlan.md**: Comprehensive unit test strategy
- [ ] **Test Results**: Public HTML reports (GitHub Pages)
- [ ] **Coverage Dashboards**: Accessible coverage metrics
- [ ] **Quality Badges**: Status badges in README.md

#### 📊 Reference Implementation Examples

**🏛️ Citizen Intelligence Agency (Java/Spring):**
[![Unit Test Coverage](https://img.shields.io/badge/Unit%20Test%20Coverage-JaCoCo%20Results-brightgreen?style=flat-square&logo=java)](https://hack23.github.io/cia/jacoco/)
[![Unit Tests](https://img.shields.io/badge/Unit%20Tests-Live%20Results-success?style=flat-square&logo=junit5&logoColor=white)](https://hack23.github.io/cia/surefire.html)
[![Test Plan](https://img.shields.io/badge/Test%20Plan-Documentation-blue?style=flat-square&logo=markdown&logoColor=white)](https://github.com/Hack23/cia/blob/master/UnitTestPlan.md)

**🎮 Black Trigram (TypeScript/Phaser):**
[![Coverage](https://img.shields.io/badge/Coverage-Live%20Results-success?style=flat-square&logo=jest&logoColor=white)](https://blacktrigram.com/coverage/)
[![Unit Tests](https://img.shields.io/badge/Unit%20Tests-Live%20Results-success?style=flat-square&logo=jest&logoColor=white)](https://blacktrigram.com/test-results/)
[![Test Plan](https://img.shields.io/badge/Test%20Plan-Documentation-blue?style=flat-square&logo=markdown&logoColor=white)](https://github.com/Hack23/blacktrigram/blob/main/UnitTestPlan.md)

**📊 CIA Compliance Manager (TypeScript/Vite):**
[![Coverage](https://img.shields.io/badge/Coverage-Live%20Results-success?style=flat-square&logo=vitest&logoColor=white)](https://ciacompliancemanager.com/coverage/)
[![Unit Tests](https://img.shields.io/badge/Unit%20Tests-Live%20Results-success?style=flat-square&logo=vitest&logoColor=white)](https://ciacompliancemanager.com/test-results/)
[![Test Plan](https://img.shields.io/badge/Test%20Plan-Documentation-blue?style=flat-square&logo=markdown&logoColor=white)](https://github.com/Hack23/cia-compliance-manager/blob/main/docs/UnitTestPlan.md)

### 🌐 End-to-End Testing Strategy

#### 🎯 E2E Testing Requirements
**Coverage Areas:**
- [ ] **Critical User Journeys**: All primary workflows tested
- [ ] **Authentication Flows**: Login, logout, session management
- [ ] **Authorization Checks**: Role-based access validation
- [ ] **Data Integrity**: CRUD operations validation
- [ ] **Performance**: Response time within SLA thresholds

#### 📚 Required Documentation
**Every repository MUST have:**
- [ ] **E2ETestPlan.md**: Comprehensive E2E test strategy
- [ ] **Mochawesome Reports**: Public HTML test results
- [ ] **Browser Matrix**: Cross-browser validation (Chrome, Firefox, Safari, Edge)
- [ ] **Performance Assertions**: Response time validation

#### 📊 Reference Implementation Examples

**🏛️ Citizen Intelligence Agency:**
[![E2E Tests](https://img.shields.io/badge/E2E%20Tests-JaCoCo%20Coverage-brightgreen?style=flat-square&logo=java)](https://hack23.github.io/cia/jacoco/)
[![E2E Plan](https://img.shields.io/badge/E2E%20Plan-Documentation-blue?style=flat-square&logo=markdown&logoColor=white)](https://github.com/Hack23/cia/blob/master/E2ETestPlan.md)

**🎮 Black Trigram:**
[![E2E Tests](https://img.shields.io/badge/E2E%20Tests-Cypress%20Results-brightgreen?style=flat-square&logo=cypress)](https://blacktrigram.com/cypress/mochawesome/)
[![E2E Plan](https://img.shields.io/badge/E2E%20Plan-Documentation-blue?style=flat-square&logo=markdown&logoColor=white)](https://github.com/Hack23/blacktrigram/blob/main/E2ETestPlan.md)

**📊 CIA Compliance Manager:**
[![E2E Tests](https://img.shields.io/badge/E2E%20Tests-Cypress%20Results-brightgreen?style=flat-square&logo=cypress)](https://ciacompliancemanager.com/cypress/mochawesome/)
[![E2E Plan](https://img.shields.io/badge/E2E%20Plan-Documentation-blue?style=flat-square&logo=markdown&logoColor=white)](https://github.com/Hack23/cia-compliance-manager/blob/main/docs/E2ETestPlan.md)

### 🤖 AI-Augmented Development Controls

#### 🔐 AI as Proposal Generator, Not Authority
**Core Principles:**
- [ ] **All AI outputs are proposals**: Require human review and approval
- [ ] **No autonomous deployment**: AI cannot bypass CI/CD pipelines or security gates
- [ ] **Human accountability**: Responsibility remains with human developers
- [ ] **Transparent attribution**: Document AI assistance in PR descriptions

#### 📋 PR Review Requirements
**Mandatory Controls:**
- [ ] **Human Review**: All AI-assisted changes pass through standard PR workflows
- [ ] **Security Gate Enforcement**: CI pipelines unchanged or only tightened
- [ ] **Change Attribution**: PR descriptions MUST document AI tools used
- [ ] **Code Ownership**: Human developers remain code owners

#### 🔧 Curator-Agent Configuration Management
**Change Control:**
- **Scope**: `.github/agents/*.md`, `.github/copilot-mcp*.json`, `.github/workflows/copilot-setup-steps.yml`
- **Classification**: Normal Change per [Change Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Change_Management.md)
- **Approval**: CEO or designated security owner required
- **Risk Assessment**: Documented evaluation for capability expansion

#### 🛡️ Security Requirements
**Tool Governance:**
- [ ] **Least Privilege**: Agents operate with minimal required tool access
- [ ] **MCP Configuration Control**: Model Context Protocol changes require security review
- [ ] **Audit Trail**: All agent activities logged for compliance analysis
- [ ] **Capability Expansion**: New integrations require documented risk assessment

### 🚀 Phase 4: Deployment

#### 🤖 Automated CI/CD Pipelines
**Security Gates:**
- [ ] **SAST Scanning**: Code quality gates (classification-based thresholds)
- [ ] **SCA Scanning**: Dependency vulnerability checks with auto-block
- [ ] **Secret Scanning**: Zero tolerance for exposed credentials
- [ ] **Container Scanning**: Image vulnerability assessment (if applicable)
- [ ] **Infrastructure as Code**: Terraform/CloudFormation security validation

#### ✅ Manual Approval Gates
**Classification-Based Approvals:**

| Classification | Approval Required | Approvers | Change Window |
|----------------|------------------|-----------|---------------|
| **Critical** | Production deploy | CEO + Security Architect | Scheduled only |
| **High** | Production deploy | Tech Lead + Reviewer | Standard window |
| **Medium** | Production deploy | Automated + monitoring | Anytime |
| **Low** | Production deploy | Automated | Anytime |

#### 📋 Deployment Checklists
**Pre-Deployment Verification:**
- [ ] All security tests passing
- [ ] Classification-appropriate controls validated
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] Incident response procedures ready

#### 📊 Security Metrics
**Real-Time Monitoring:**
- [ ] **OpenSSF Scorecard**: Public security posture metrics
- [ ] **SLSA Level**: Supply chain security attestation
- [ ] **Quality Gates**: SonarCloud quality/security dashboards
- [ ] **Uptime Metrics**: Availability aligned with classification SLAs

### 🔧 Phase 5: Maintenance & Operations

#### 🆘 Vulnerability Management
**Classification-Based Remediation:**
Per [Vulnerability Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md):

| Severity | Critical Project | High Project | Medium Project | Low Project |
|----------|-----------------|-------------|----------------|-------------|
| **Critical** | 24 hours | 72 hours | 1 week | 2 weeks |
| **High** | 1 week | 2 weeks | 1 month | 2 months |
| **Medium** | 1 month | 2 months | 3 months | 6 months |
| **Low** | Next release | Next release | Next release | Next release |

#### 📈 Performance Monitoring
**Security Metrics Integration:**
Per [Security Metrics](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Security_Metrics.md):
- [ ] **Availability Tracking**: Uptime per classification requirements
- [ ] **Response Time**: Performance within SLA thresholds
- [ ] **Error Rates**: Security-relevant errors logged and analyzed
- [ ] **Incident Metrics**: MTTR, MTTD aligned with classification

#### 🔄 Regular Updates
**Patch Management:**
- [ ] **Security Patches**: Classification-based deployment schedules
- [ ] **Dependency Updates**: Automated PRs with security review
- [ ] **Framework Updates**: Major version upgrades with testing
- [ ] **Business Continuity**: Updates aligned with [BCP](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Business_Continuity_Plan.md)

#### 📋 Incident Response
**Integration:**
Per [Incident Response Plan](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Incident_Response_Plan.md):
- [ ] **Classification-Driven Escalation**: Incident severity based on project classification
- [ ] **Communication Procedures**: Stakeholder notifications per classification
- [ ] **Recovery Objectives**: RTO/RPO aligned with classification
- [ ] **Post-Incident Review**: Lessons learned and improvement actions

## 📊 SDLC Security Maturity Levels

### Level 1: Basic (Minimum Viable Security)
- ✅ Basic security controls implemented
- ✅ Dependabot enabled
- ✅ Secret scanning active
- ✅ Basic threat model documented

### Level 2: Intermediate (Standard Security)
- ✅ Level 1 + Classification implemented
- ✅ SAST/SCA integrated in CI/CD
- ✅ Unit test coverage ≥70%
- ✅ SECURITY_ARCHITECTURE.md maintained
- ✅ Regular vulnerability scanning

### Level 3: Advanced (Enhanced Security)
- ✅ Level 2 + DAST implementation
- ✅ Comprehensive threat modeling (STRIDE + MITRE ATT&CK)
- ✅ Unit test coverage ≥80%
- ✅ E2E testing framework
- ✅ Public security dashboards

### Level 4: Mature (Security Excellence)
- ✅ Level 3 + AI-augmented development controls
- ✅ Mutation testing (≥60% score)
- ✅ Full C4 architecture documentation
- ✅ Continuous security monitoring
- ✅ Evidence-based compliance (badges, reports)
- ✅ External security validation (pentesting, audits)

## ✅ SDLC Security Checklist

### Planning & Design Phase
- [ ] Project classification completed (CIA triad, RTO/RPO, business impact)
- [ ] Threat model documented (STRIDE + MITRE ATT&CK)
- [ ] Security architecture designed (C4 models, data flows)
- [ ] Risk assessment integrated with Risk Register
- [ ] Cost-benefit analysis for security investments

### Development Phase
- [ ] Secure coding standards applied (OWASP Top 10)
- [ ] Code review requirements met (classification-based)
- [ ] Asset classification implemented
- [ ] Secret management controls enforced
- [ ] AI-augmented development controls active

### Testing Phase
- [ ] SAST scanning integrated (SonarCloud)
- [ ] SCA scanning enabled (Dependabot)
- [ ] DAST testing implemented (OWASP ZAP)
- [ ] Secret scanning active (GitHub)
- [ ] Unit test coverage thresholds met (≥80% line, ≥70% branch)
- [ ] E2E testing framework operational
- [ ] Test data protection controls enforced

### Deployment Phase
- [ ] CI/CD security gates configured
- [ ] Manual approval gates per classification
- [ ] Deployment checklists completed
- [ ] Security metrics monitoring active
- [ ] Rollback procedures documented

### Maintenance Phase
- [ ] Vulnerability management process active
- [ ] Performance monitoring with security metrics
- [ ] Regular update schedule defined
- [ ] Incident response procedures integrated
- [ ] Continuous improvement process operational

## 📚 References

### Hack23 ISMS Core Policies
- [🛠️ Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) - Comprehensive SDLC framework
- [🏷️ Classification Framework](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) - Business impact analysis
- [🎯 Threat Modeling Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md) - Systematic threat analysis
- [📉 Risk Register](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Risk_Register.md) - Enterprise risk management
- [🔍 Vulnerability Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md) - Remediation procedures
- [📊 Security Metrics](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Security_Metrics.md) - KPI tracking
- [🚨 Incident Response Plan](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Incident_Response_Plan.md) - Security incident procedures
- [🔄 Business Continuity Plan](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Business_Continuity_Plan.md) - BCP/DR processes
- [📝 Change Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Change_Management.md) - Change control procedures
- [🏷️ Data Classification Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Data_Classification_Policy.md) - Data handling requirements

### Example Implementations
- [🏛️ CIA Security Architecture](https://github.com/Hack23/cia/blob/master/SECURITY_ARCHITECTURE.md) - Full authentication stack (Java/Spring)
- [🏛️ CIA Threat Model](https://github.com/Hack23/cia/blob/master/THREAT_MODEL.md) - Comprehensive threat analysis
- [📊 CIA Compliance Manager Security](https://github.com/Hack23/cia-compliance-manager/blob/main/docs/architecture/SECURITY_ARCHITECTURE.md) - Frontend security (TypeScript/Vite)
- [🎮 Black Trigram Security](https://github.com/Hack23/blacktrigram/blob/main/SECURITY_ARCHITECTURE.md) - Gaming security (TypeScript/Phaser)
- [🗳️ Riksdagsmonitor Security](https://github.com/Hack23/riksdagsmonitor/blob/main/SECURITY_ARCHITECTURE.md) - Static site security (HTML/CSS)

### External Frameworks
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Critical web application security risks
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) - Application security verification
- [NIST SP 800-218](https://csrc.nist.gov/publications/detail/sp/800-218/final) - Secure Software Development Framework
- [Microsoft SDL](https://www.microsoft.com/en-us/securityengineering/sdl) - Security Development Lifecycle
- [MITRE ATT&CK](https://attack.mitre.org/) - Adversary tactics and techniques

## 🎯 Remember

- **Classification Drives Security**: All requirements aligned with business impact
- **Transparency is Competitive Advantage**: Public security demonstrates expertise
- **AI Augments, Humans Decide**: AI proposals require human approval
- **Evidence-Based Security**: Badges, dashboards, reports validate claims
- **Continuous Improvement**: Measure, analyze, improve security posture
- **Documentation is Mandatory**: SECURITY_ARCHITECTURE.md, THREAT_MODEL.md required
- **Testing is Not Optional**: Unit + E2E coverage proves quality
- **Security is Everyone's Responsibility**: DevSecOps culture required

---

**Last Updated**: 2026-02-10 (Continuous)  
**Version**: Based on Hack23 Secure Development Policy v2.1 & STYLE_GUIDE v2.3
