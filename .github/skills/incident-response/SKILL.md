---
name: incident-response
description: Security incident detection, classification, response procedures, and post-incident review following NIST and ISO 27001
license: Apache-2.0
---

# Incident Response Skill

## Purpose
Defines security incident response procedures following NIST SP 800-61 and ISO 27001 Annex A.16.

## Incident Classification
| Severity | Description | Response Time |
|----------|-------------|---------------|
| Critical | Data breach, system compromise | Immediate (< 1 hour) |
| High | Active exploitation, service outage | < 4 hours |
| Medium | Vulnerability detected, policy violation | < 24 hours |
| Low | Minor security event, informational | < 72 hours |

## Response Phases (NIST)
1. **Preparation** — Tools, procedures, team readiness
2. **Detection & Analysis** — Identify, classify, document
3. **Containment** — Short-term and long-term containment
4. **Eradication** — Remove threat, patch vulnerabilities
5. **Recovery** — Restore systems, verify functionality
6. **Post-Incident** — Lessons learned, process improvement

## For Static Sites (GitHub Pages)
- Monitor Dependabot alerts
- Respond to CodeQL findings
- Review secret scanning alerts
- Patch vulnerable dependencies
- Update security headers

## Communication Requirements
- Notify stakeholders per severity level
- Document timeline and actions taken
- Preserve evidence for analysis
- Update SECURITY.md if needed

## ISO 27001 Mapping
- A.5.24 — Information security incident management planning
- A.5.25 — Assessment and decision on events
- A.5.26 — Response to incidents
- A.5.27 — Learning from incidents

## Related Policies
- [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md)
