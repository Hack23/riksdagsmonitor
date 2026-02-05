---
name: threat-modeling
description: STRIDE threat modeling for static HTML/CSS websites on GitHub Pages
license: Apache-2.0
---

# STRIDE Threat Modeling (Static Site)

## Purpose

Apply STRIDE framework to identify threats for static HTML/CSS websites.

## STRIDE Categories

### S - Spoofing
**Threats:**
- Domain hijacking
- DNS spoofing
- Certificate spoofing

**Mitigations:**
- HTTPS enforced
- DNSSEC enabled
- Certificate Transparency monitoring

### T - Tampering
**Threats:**
- Repository compromise
- Unauthorized commits
- Content injection

**Mitigations:**
- Branch protection
- Required PR reviews
- GPG signed commits
- GitHub audit logs

### R - Repudiation
**Threats:**
- Unauthorized changes without attribution

**Mitigations:**
- Git commit history (immutable)
- GitHub audit logs
- Signed commits required

### I - Information Disclosure
**Threats:**
- Accidental secret commits
- Source code exposure

**Mitigations:**
- Secret scanning enabled
- .gitignore for sensitive files
- Public repository (intentional)

### D - Denial of Service
**Threats:**
- DDoS attacks
- Resource exhaustion

**Mitigations:**
- GitHub Pages CDN (DDoS protection)
- Rate limiting by GitHub
- Global distribution

### E - Elevation of Privilege
**Threats:**
- Unauthorized admin access
- Workflow manipulation

**Mitigations:**
- Minimal workflow permissions
- Protected branches
- Required reviews

## Threat Model Document

Create **THREAT_MODEL.md** with:
1. Asset inventory
2. Threat analysis (STRIDE)
3. Risk ratings
4. Mitigation controls
5. Residual risks

## References

- **THREAT_MODEL.md**: Threat analysis
- **SECURITY_ARCHITECTURE.md**: Security controls
