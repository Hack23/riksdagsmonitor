---
name: threat-modeling
description: Systematic threat analysis using STRIDE, MITRE ATT&CK, attack trees, and risk-based security control validation
license: Apache-2.0
---

# Threat Modeling Skill

## Purpose

This skill provides comprehensive threat modeling methodologies for proactive security threat identification, risk analysis, and control validation across all system types. Integrates STRIDE framework, MITRE ATT&CK, attack trees, and quantitative risk assessment.

## Core Principles

### 1. Security by Design Through Threat Analysis
- **Classification-Driven**: Align threat analysis with business impact classification
- **STRIDE Framework**: Systematic threat categorization
- **Defense-in-Depth**: Multi-layer security control verification

### 2. Transparency Through Structured Analysis
- **MITRE ATT&CK Integration**: Industry-standard threat intelligence
- **Public Security Architecture**: Open threat model documentation
- **Continuous Assessment**: Regular threat landscape evaluation

### 3. Multi-Strategy Approach
- **Attacker-Centric**: MITRE ATT&CK, attack trees, red team perspective
- **Asset-Centric**: Critical asset protection, data flow mapping
- **Architecture-Centric**: STRIDE per element, DFDs, trust boundaries
- **Scenario-Centric**: Use case abuse, misuse cases
- **Risk-Centric**: Quantitative risk, threat intelligence

## Security Foundations

### CIA Triad
| Principle | Definition | Key Controls | Threat Categories |
|-----------|------------|--------------|------------------|
| **Confidentiality** | Information accessible only to authorized entities | Encryption, access control, authentication | Information disclosure, credential theft |
| **Integrity** | Data protection from unauthorized modification | Checksums, digital signatures, version control | Tampering, data corruption |
| **Availability** | Reliable and timely access to systems | Redundancy, DR, DDoS mitigation | DoS, outages, resource exhaustion |

### AAA Framework
| Component | Definition | Integration |
|-----------|------------|-------------|
| **Authentication** | Identity verification | Access Control Policy |
| **Authorization** | Permitted actions | RBAC, ABAC implementation |
| **Accounting** | Activity tracking | Security monitoring, audit logs |

## STRIDE Threat Modeling Framework

### STRIDE Categories

**S - Spoofing Identity**
- **Definition**: Attacker gains access using false identity
- **Controls**: Multi-factor authentication, certificate pinning, identity verification
- **Static Site Threats**: Domain hijacking, DNS spoofing, certificate spoofing
- **Mitigations**: HTTPS enforced, DNSSEC, Certificate Transparency monitoring

**T - Tampering with Data**
- **Definition**: Data modification during application flow
- **Controls**: Digital signatures, checksums, integrity monitoring
- **Static Site Threats**: Repository compromise, unauthorized commits, content injection
- **Mitigations**: Branch protection, required PR reviews, GPG signed commits, GitHub audit logs

**R - Repudiation**
- **Definition**: Attacker denies actions without proof capability
- **Controls**: Audit logging, digital signatures, non-repudiation mechanisms
- **Static Site Threats**: Unauthorized changes without attribution
- **Mitigations**: Git commit history (immutable), GitHub audit logs, signed commits required

**I - Information Disclosure**
- **Definition**: Unauthorized access to private or sensitive data
- **Controls**: Encryption, access controls, data classification
- **Static Site Threats**: Accidental secret commits, source code exposure
- **Mitigations**: Secret scanning enabled, .gitignore for sensitive files, public repository classification

**D - Denial of Service**
- **Definition**: System availability reduction or service crash
- **Controls**: Rate limiting, DDoS protection, redundancy
- **Static Site Threats**: DDoS attacks, resource exhaustion
- **Mitigations**: GitHub Pages CDN, rate limiting, global distribution

**E - Elevation of Privilege**
- **Definition**: Attacker assumes privileged user identity
- **Controls**: Least privilege, RBAC, privilege separation
- **Static Site Threats**: Unauthorized admin access, workflow manipulation
- **Mitigations**: Minimal workflow permissions, protected branches, required reviews

## MITRE ATT&CK Integration

### Tactics & Techniques

| Tactic | Description | Common Techniques |
|--------|-------------|-------------------|
| **Reconnaissance** | Information gathering | Active scanning, OSINT |
| **Resource Development** | Establishing resources | Compromise accounts, infrastructure setup |
| **Initial Access** | Network entry | Phishing, drive-by compromise, supply chain |
| **Execution** | Malicious code execution | Command interpreters, malicious input |
| **Persistence** | Foothold maintenance | Account manipulation, backdoors |
| **Privilege Escalation** | Higher permissions | Exploitation, process injection |
| **Defense Evasion** | Detection avoidance | Obfuscation, bypass controls |
| **Credential Access** | Credential theft | Brute force, token stealing |
| **Discovery** | Environment reconnaissance | Cloud discovery, network mapping |
| **Lateral Movement** | Environment traversal | Remote services, credential reuse |
| **Collection** | Data gathering | Local data, cloud storage |
| **Command & Control** | System communication | Application layer protocols |
| **Exfiltration** | Data theft | C2 channel, cloud storage |
| **Impact** | System destruction | Data destruction, resource hijacking |

## Threat Agent Classification

| Threat Agent | Category | Risk Level | MITRE Tactics |
|--------------|----------|------------|---------------|
| **Accidental Insiders** | Internal | Medium | Execution, Privilege Escalation |
| **Malicious Insiders** | Internal | High | Initial Access, Impact |
| **Cybercriminals** | External | High | Reconnaissance, Collection |
| **Nation-State APTs** | External | Critical | Persistence, Defense Evasion |
| **Hacktivists** | External | Medium | Impact, Privilege Escalation |
| **Service Providers** | External | Medium | Initial Access, Defense Evasion |
| **Cyber Vandals** | External | Low | Impact, Execution |

## Current Threat Landscape (ENISA 2024)

| Priority | Threat Category | Business Impact | Mitigation Priority |
|----------|----------------|-----------------|-------------------|
| **1** | Threats Against Availability | Revenue protection | Critical |
| **2** | Ransomware | Business continuity | Critical |
| **3** | Threats Against Data | Risk reduction | High |
| **4** | Malware | Operational excellence | High |
| **5** | Social Engineering | Trust enhancement | High |
| **6** | Information Manipulation | Competitive advantage | Medium |
| **7** | Supply Chain Attacks | Partnership value | High |

## Attack Tree Analysis

### Purpose
Graphical decomposition of attack paths showing AND/OR relationships between attack steps.

### Attack Tree Elements
- **Root Node**: Attack goal
- **AND Nodes**: All child attacks must succeed
- **OR Nodes**: Any child attack can succeed
- **Leaf Nodes**: Individual attack steps with success likelihood

### Example: Web Application Compromise
```
Root: Compromise Web Application
├── OR: Exploit Application Vulnerability
│   ├── AND: SQL Injection
│   │   ├── Find SQL injection point
│   │   └── Bypass input validation
│   └── AND: XSS Attack
│       ├── Inject malicious script
│       └── Trick user into clicking
└── OR: Compromise Credentials
    ├── Phishing attack
    └── Brute force login
```

## Data Flow Diagrams (DFD)

### DFD Elements
- **External Entity**: Sources/sinks of data (users, external systems)
- **Process**: Data transformation or computation
- **Data Store**: Persistent storage
- **Data Flow**: Movement between elements
- **Trust Boundary**: Security domain separation

### STRIDE per DFD Element
| Element | Applicable STRIDE Threats |
|---------|--------------------------|
| **External Entity** | Spoofing, Repudiation |
| **Process** | All 6 STRIDE categories |
| **Data Store** | Tampering, Information Disclosure, DoS |
| **Data Flow** | Tampering, Information Disclosure, DoS |
| **Trust Boundary** | Elevation of Privilege |

## Quantitative Risk Assessment

### Risk Calculation
```
Risk = Likelihood × Impact
```

### Likelihood Scoring
- **Critical (5)**: Near certain (>90%)
- **High (4)**: Likely (60-90%)
- **Medium (3)**: Possible (30-60%)
- **Low (2)**: Unlikely (10-30%)
- **Negligible (1)**: Rare (<10%)

### Impact Scoring (per Classification Framework)
- **Critical (5)**: >$10K daily, complete outage, criminal charges
- **High (4)**: $5K-10K daily, major degradation, significant fines
- **Medium (3)**: $1K-5K daily, moderate impact, compliance violations
- **Low (2)**: $500-1K daily, minor impact, warnings
- **Negligible (1)**: <$500 daily, minimal impact, no regulatory

### Risk Matrix
| Likelihood → Impact | Negligible (1) | Low (2) | Medium (3) | High (4) | Critical (5) |
|--------------------|----------------|---------|------------|----------|--------------|
| **Critical (5)** | Medium | High | High | Critical | Critical |
| **High (4)** | Medium | Medium | High | High | Critical |
| **Medium (3)** | Low | Medium | Medium | High | High |
| **Low (2)** | Low | Low | Medium | Medium | High |
| **Negligible (1)** | Low | Low | Low | Medium | Medium |

## Threat Model Document Structure

Every repository **MUST** maintain **THREAT_MODEL.md** with:

### 1. System Overview
- Architecture description
- Key components and dependencies
- Trust boundaries
- Data flows

### 2. Asset Inventory
- Critical assets from Asset Register
- Data classification (per Classification Framework)
- Crown jewel identification

### 3. STRIDE Analysis
- Threat per component
- Likelihood and impact ratings
- Attack vectors
- Existing controls

### 4. MITRE ATT&CK Mapping
- Applicable tactics and techniques
- Attack scenarios
- Detection opportunities

### 5. Attack Trees
- Visual attack path decomposition
- Success probabilities
- Critical attack steps

### 6. Risk Assessment
- Quantitative risk scores
- Risk matrix visualization
- Risk treatment decisions

### 7. Security Controls
- Current control implementation
- Control effectiveness
- Control gaps

### 8. Residual Risk
- Accepted risks with justification
- Risk owners
- Monitoring requirements

### 9. Recommendations
- Short-term improvements (0-3 months)
- Medium-term enhancements (3-12 months)
- Long-term roadmap (12+ months)

## Threat Modeling Workflow

### 1. Planning Phase
- [ ] Define scope and objectives
- [ ] Identify stakeholders
- [ ] Select modeling strategies
- [ ] Schedule threat modeling session

### 2. Data Collection
- [ ] Review architecture documentation
- [ ] Create/update Data Flow Diagrams
- [ ] Identify assets and classifications
- [ ] Map trust boundaries

### 3. Threat Identification
- [ ] Apply STRIDE per element
- [ ] Map MITRE ATT&CK tactics
- [ ] Develop attack trees
- [ ] Brainstorm attack scenarios

### 4. Risk Assessment
- [ ] Calculate likelihood and impact
- [ ] Assign risk scores
- [ ] Prioritize threats
- [ ] Identify critical paths

### 5. Mitigation Planning
- [ ] Review existing controls
- [ ] Identify control gaps
- [ ] Recommend new controls
- [ ] Document risk treatment

### 6. Documentation
- [ ] Update THREAT_MODEL.md
- [ ] Update SECURITY_ARCHITECTURE.md
- [ ] Update Risk Register
- [ ] Create action items

### 7. Review & Update
- [ ] Quarterly threat landscape review
- [ ] Post-incident threat model update
- [ ] Architecture change triggers
- [ ] Annual comprehensive review

## Integration with ISMS

### Access Control Policy
- Authentication threats → MFA implementation
- Authorization threats → RBAC design
- Credential threats → Password policies

### Secure Development Policy
- Application threats → SAST/DAST requirements
- Supply chain threats → Dependency scanning
- Code injection threats → Secure coding standards

### Incident Response Plan
- Detection requirements → SIEM configuration
- Response procedures → Playbook development
- Recovery objectives → RTO/RPO alignment

### Business Continuity Plan
- Availability threats → Redundancy design
- Disaster scenarios → DR procedures
- Service criticality → Priority ranking

## Example Implementations

### Static Website (Riksdagsmonitor)
- [THREAT_MODEL.md](https://github.com/Hack23/riksdagsmonitor/blob/main/THREAT_MODEL.md) - Static site threat analysis
- [SECURITY_ARCHITECTURE.md](https://github.com/Hack23/riksdagsmonitor/blob/main/SECURITY_ARCHITECTURE.md) - Controls implementation

### Web Application (CIA)
- [THREAT_MODEL.md](https://github.com/Hack23/cia/blob/master/THREAT_MODEL.md) - Full application threat model
- [SECURITY_ARCHITECTURE.md](https://github.com/Hack23/cia/blob/master/SECURITY_ARCHITECTURE.md) - Defense-in-depth architecture

### Gaming Application (Black Trigram)
- [THREAT_MODEL.md](https://github.com/Hack23/blacktrigram/blob/main/THREAT_MODEL.md) - Gaming-specific threats
- [SECURITY_ARCHITECTURE.md](https://github.com/Hack23/blacktrigram/blob/main/SECURITY_ARCHITECTURE.md) - Frontend security

## References

### Hack23 ISMS Documentation
- [Threat Modeling Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md) - Comprehensive methodology
- [Classification Framework](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) - Business impact analysis
- [Risk Register](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Risk_Register.md) - Enterprise risk management
- [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) - SDLC integration

### External Frameworks
- [STRIDE (Wikipedia)](https://en.wikipedia.org/wiki/STRIDE_(security)) - Threat categorization
- [MITRE ATT&CK](https://attack.mitre.org/) - Adversary tactics and techniques
- [ENISA Threat Landscape 2024](https://www.enisa.europa.eu/publications/enisa-threat-landscape-2024) - Current threats
- [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling) - Best practices

## Remember

- **Proactive Not Reactive**: Identify threats before they materialize
- **Defense in Depth**: Multiple security layers
- **Risk-Based Prioritization**: Focus on high-impact threats
- **Continuous Process**: Threat landscape evolves
- **Documentation Essential**: THREAT_MODEL.md is mandatory
- **Integration Critical**: Align with ISMS policies
- **Transparency Advantage**: Public threat models demonstrate expertise
- **Quantitative Assessment**: Numbers drive decisions
