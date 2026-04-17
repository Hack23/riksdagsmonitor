---
name: open-source-governance
description: Open source policy, license compliance, contribution guidelines, dependency management, and supply chain security
license: Apache-2.0
---

# Open Source Governance Skill


## 🔴 AI FIRST Quality Principle

> **Apply the AI FIRST principle: never accept first-pass quality. Minimum 2 iterations. Read all output, improve every section. No shortcuts.**

## Purpose
Defines governance for open source software use, contribution, and publication ensuring license compliance and supply chain security.

## License Compliance
### Approved Licenses
- MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause
- ISC, CC-BY-4.0, Unlicense, 0BSD

### Restricted Licenses (Require Review)
- GPL-2.0, GPL-3.0, LGPL, AGPL
- SSPL, BSL, Commons Clause

### Prohibited
- No license specified (proprietary by default)
- Licenses incompatible with project license

## Dependency Management
- Pin dependencies to specific versions
- Use lock files (package-lock.json)
- Regular dependency updates via Dependabot
- Security scanning for known vulnerabilities
- SBOM generation for supply chain transparency

## Contribution Guidelines
- CONTRIBUTING.md required in all repos
- Code of Conduct (Contributor Covenant)
- Developer Certificate of Origin (DCO)
- PR review requirements
- CLA not required for Hack23 projects

## Supply Chain Security
- Pin GitHub Actions to SHA (not tags)
- Use step-security/harden-runner
- Enable Dependabot security updates
- Secret scanning with push protection
- SLSA provenance for releases

## ISO 27001:2022 Mapping
- **A.5.5** — Contact with authorities (CVE, disclosure)
- **A.5.19–A.5.21** — Supplier/ICT supply-chain security (SBOM, approved licences)
- **A.5.23** — Information security for use of cloud services (GitHub, hosted services)
- **A.8.8** — Management of technical vulnerabilities (Dependabot, CodeQL)
- **A.8.25** — Secure development lifecycle
- **A.8.28** — Secure coding
- **A.8.30** — Outsourced development (OSS maintainers, third-party libraries)

## NIST CSF 2.0 Mapping
- **GV.SC** — Cybersecurity Supply Chain Risk Management
- **ID.SC** — Supply chain inventory (SBOM, licence inventory)
- **PR.IP-12** — Vulnerability management plan
- **PR.DS-6** — Integrity checking (signed commits, SLSA attestations)

## CIS Controls v8.1 Mapping
- **2.1–2.7** — Inventory and control of software assets
- **3.4** — Encrypt data on end-user devices
- **7.5–7.7** — Continuous vulnerability management
- **16.4** — Establish and manage authoritative software libraries
- **16.11** — Leverage vetted modules or services for software components

## Related Hack23 ISMS Policies
- [Information_Security_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md) — governance umbrella
- [Secure_Development_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) — SDLC security requirements
- [Open_Source_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Open_Source_Policy.md) — approved/restricted/prohibited licences, contribution rules
- [Vulnerability_Management.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md) — remediation SLAs (Crit 24h / High 7d / Med 30d / Low 90d)
- [Change_Management.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Change_Management.md) — dependency-update approval flows
- [AI_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/AI_Policy.md) — AI-assisted contributions require human review
- [Incident_Response_Plan.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Incident_Response_Plan.md) — OSS CVE / supply-chain incident handling
