---
name: information-security-strategy
description: Information security strategy, risk management, security program governance, and compliance framework integration
license: Apache-2.0
---

# Information Security Strategy Skill


## 🔴 AI FIRST Quality Principle

> **Apply the AI FIRST principle: never accept first-pass quality. Minimum 2 iterations. Read all output, improve every section. No shortcuts.**

## Purpose
Defines the information security strategy framework for Hack23 projects, integrating risk management with compliance requirements.

## Security Strategy Pillars
1. **Governance** — Policies, procedures, roles
2. **Risk Management** — Identify, assess, treat risks
3. **Compliance** — ISO 27001, NIST CSF, CIS Controls
4. **Operations** — Monitoring, incident response
5. **Assurance** — Audits, testing, continuous improvement

## Risk Management Process
1. **Context** — Scope, stakeholders, criteria
2. **Assessment** — Identify, analyze, evaluate risks
3. **Treatment** — Accept, mitigate, transfer, avoid
4. **Monitoring** — Continuous risk review
5. **Communication** — Stakeholder reporting

## Compliance Framework Integration
| Framework | Focus | Key Controls |
|-----------|-------|-------------|
| ISO 27001:2022 | ISMS | 93 controls in 4 themes |
| NIST CSF 2.0 | Cybersecurity | Govern, Identify, Protect, Detect, Respond, Recover |
| CIS Controls v8.1 | Implementation | 18 control groups |
| GDPR | Privacy | Data protection, rights |
| NIS2 | Critical infra | Supply chain, incident reporting |

## Security Metrics
- Mean Time to Detect (MTTD)
- Mean Time to Respond (MTTR)
- Vulnerability remediation SLA compliance
- Security training completion rate
- Audit finding closure rate

## Continuous Improvement
- Regular policy reviews (annual minimum)
- Lessons learned from incidents
- Benchmark against industry standards
- Security awareness program updates
- Technology evolution tracking

## Related Hack23 ISMS Policies

Strategy execution requires cross-policy alignment across the [ISMS-PUBLIC](https://github.com/Hack23/ISMS-PUBLIC) suite:

### Governance & Classification
- [Information_Security_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md) — **master policy**: scope, roles, risk management, continuous improvement (master strategy document)
- [CLASSIFICATION.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) — CIA triad ratings + RTO/RPO drive control selection
- [AI_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/AI_Policy.md) — AI governance, human-in-the-loop, agent-activity logging

### Operational
- [Secure_Development_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) — SDLC security
- [Open_Source_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Open_Source_Policy.md) — supply chain, SBOM, licence approvals
- [Access_Control_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Access_Control_Policy.md) · [Cryptography_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Cryptography_Policy.md) · [Change_Management.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Change_Management.md)
- [Threat_Modeling.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md) · [Vulnerability_Management.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md)
- [Incident_Response_Plan.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Incident_Response_Plan.md) · [Security_Metrics.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Security_Metrics.md)

### Strategic Alignment Principle
Every strategic initiative MUST map to: (a) one or more ISMS policies, (b) measurable KPI in `Security_Metrics.md`, (c) at least one compliance framework (ISO 27001 / NIST CSF 2.0 / CIS Controls v8.1 / GDPR / NIS2 / EU CRA), and (d) risk-treatment action in the risk register.
