# 🎯 Riksdagsmonitor Agent Skills Guide

## Overview

Agent skills are strategic, high-level principles and best practices that guide Copilot agents in performing their tasks. Skills are automatically loaded when relevant to the current context, providing agents with specialized knowledge without cluttering the main prompt.

## What Are Skills?

Skills are structured instruction sets stored in `.github/skills/` that teach agents:
- **How** to approach specific types of tasks
- **What** principles and standards to follow
- **Why** certain practices are important
- **When** to apply specific patterns

Skills are:
- ✅ **Strategic**: High-level principles, not step-by-step instructions
- ✅ **Rule-Based**: Clear rules and standards
- ✅ **Reusable**: Apply across multiple tasks
- ✅ **Context-Aware**: Load only when relevant

## Available Skills

### 1. hack23-isms-compliance
**Purpose**: Ensure all work complies with Hack23's ISMS requirements (ISO 27001:2022, NIST CSF 2.0, CIS Controls v8.1)

**Key Principles**:
- Security by Design
- Compliance as Code
- Transparency First
- Risk-Based Approach

**Enforces**:
- Required documentation portfolio (SECURITY_ARCHITECTURE.md, THREAT_MODEL.md, etc.)
- Compliance framework mapping (ISO 27001 Annex A, NIST CSF functions, CIS Controls)
- DevSecOps requirements (CI/CD security, scanning, access control)
- STRIDE threat modeling
- Audit evidence collection

**When to Use**:
- Any security-related task
- Documentation updates
- Architecture changes
- Compliance reviews
- Audit preparation

### 2. security-by-design
**Purpose**: Apply security-by-design principles from project inception

**Key Principles**:
- Secure by Default
- Defense in Depth
- Least Privilege
- Fail Securely
- Don't Trust User Input
- Keep Security Simple
- Separation of Duties
- Economy of Mechanism

**Enforces**:
- Security considered in all design decisions
- Multiple layers of security controls
- Minimal necessary permissions
- Secure failure modes
- Input validation everywhere
- Simple, auditable security mechanisms

**When to Use**:
- Designing new features
- Architecture reviews
- Security enhancements
- Code reviews
- Threat modeling

### 3. static-site-security
**Purpose**: Security best practices specific to static HTML/CSS websites on GitHub Pages

**Key Principles**:
- Leverage eliminated server-side attack vectors (no server-side SQL injection/CSRF and greatly reduced XSS surface)
- Minimize attack surface
- Secure transport layer (TLS 1.3, HTTPS-only)
- Implement security headers
- Content security and integrity

**Enforces**:
- HTTPS-only with TLS 1.3
- Comprehensive security headers (CSP, HSTS, X-Frame-Options, etc.)
- Subresource Integrity (SRI) for CDN resources
- Minimal dependencies
- Access control for repository
- Security monitoring and alerting

**When to Use**:
- Static site development
- Security configuration
- Deployment setup
- Security reviews
- Incident response

### 4. ci-cd-security
**Purpose**: Security-hardened CI/CD pipelines using GitHub Actions

**Key Principles**:
- Least Privilege Permissions
- Pin Actions to SHA
- Harden Runner (egress auditing)
- Secrets Management
- Supply Chain Security

**Enforces**:
- Minimal workflow permissions
- SHA-pinned action versions (never tags)
- step-security/harden-runner on all jobs
- Proper secrets handling (never echo)
- Dependency scanning (Dependabot, CodeQL)
- Quality gates that fail on security issues

**When to Use**:
- Creating workflows
- Workflow security reviews
- CI/CD optimization
- Supply chain hardening
- Security scanning setup

### 5. documentation-standards
**Purpose**: Consistent, high-quality technical documentation following C4 model and Hack23 standards

**Key Principles**:
- Clarity First
- Consistency
- Visual Communication
- Completeness
- Maintenance

**Enforces**:
- Standard document structure (version, classification, owner, review date)
- C4 architecture model (Context, Container, Component levels)
- Professional Mermaid diagrams
- Document control metadata
- Cross-references to related docs

**When to Use**:
- Creating documentation
- Architecture diagrams
- Documentation reviews
- Knowledge transfer
- Onboarding materials

### 6. html-accessibility
**Purpose**: Ensure websites meet WCAG 2.1 Level AA accessibility standards

**Key Principles (POUR)**:
- **Perceivable**: Content must be presentable to all users
- **Operable**: Interface must be operable by all
- **Understandable**: Information must be understandable
- **Robust**: Content must work with assistive technologies

**Enforces**:
- Semantic HTML5 markup
- Alt text for all images
- Sufficient color contrast (4.5:1 for normal text, 3:1 for large)
- Keyboard navigation support
- ARIA attributes where appropriate
- Visible focus indicators

**When to Use**:
- HTML development
- UI/UX design
- Accessibility audits
- Quality reviews
- User testing

### 7. multi-language-localization
**Purpose**: Proper internationalization (i18n) and localization (l10n) for multi-language sites

**Key Principles**:
- Language Declaration
- Proper File Structure
- Language Switcher
- RTL Support
- Cultural Considerations

**Enforces**:
- Correct `lang` attribute on all pages
- Separate HTML files per language (index_sv.html, etc.)
- Proper hreflang tags for SEO
- RTL layout support (Arabic, Hebrew)
- Cultural formatting (dates, numbers, currency)

**When to Use**:
- Multi-language implementation
- Translation management
- RTL language support
- SEO optimization
- Cultural adaptation

## How Skills Work

### Automatic Loading
Skills are automatically loaded by Copilot when relevant to the task. You don't need to explicitly reference them.

### Skill Discovery
Copilot determines skill relevance based on:
- Task description
- File paths being modified
- Agent being used
- Keywords in instructions

### Skill Structure
Each skill follows this structure:

```markdown
---
name: skill-name
description: Brief description of skill purpose
license: Apache-2.0
---

# Skill Title

## Purpose
[Why this skill exists]

## Core Principles
[High-level guiding principles]

## Enforces
[Specific rules and standards]

## When to Use
[Scenarios where skill applies]

## Examples
[Concrete examples]

## Remember
[Key takeaways]

## References
[External resources]
```

## Skill Hierarchy

Skills follow a hierarchy from strategic to tactical:

```
Level 1 (Strategic): hack23-isms-compliance
  ├─ Level 2 (Architectural): security-by-design
  │   ├─ Level 3 (Technical): static-site-security
  │   └─ Level 3 (Technical): ci-cd-security
  │
  └─ Level 2 (Standards): documentation-standards
      ├─ Level 3 (Technical): html-accessibility
      └─ Level 3 (Technical): multi-language-localization
```

## Best Practices

### For Users

1. **Trust the Skills**: Agents automatically apply skills - you don't need to reference them
2. **Be Specific**: Provide clear task descriptions to help skill discovery
3. **Review Results**: Verify agents followed skill guidelines
4. **Provide Feedback**: Improve skills based on agent outcomes

### For Skill Authors

1. **Strategic, Not Tactical**: Focus on principles, not step-by-step instructions
2. **Rule-Based**: Clear, enforceable rules
3. **Examples Matter**: Show good and bad patterns
4. **Keep Updated**: Evolve skills as standards change
5. **Cross-Reference**: Link to relevant ISMS policies and standards

## Skill Development

### Creating a New Skill

1. **Identify Need**: What knowledge gap exists?
2. **Define Scope**: What should this skill cover?
3. **Write Principles**: What are the high-level rules?
4. **Add Examples**: Show concrete applications
5. **Document Use Cases**: When should this apply?
6. **Test**: Verify agents use the skill correctly

### Skill Template

```markdown
---
name: your-skill-name
description: Brief description (max 200 chars)
license: Apache-2.0
---

# Skill Title

## Purpose
Why this skill exists and what problem it solves.

## Core Principles
1-5 high-level guiding principles

## Enforces
Specific rules, standards, and requirements

## When to Use
Scenarios and contexts where skill applies

## Examples
### Good Pattern
[Example]

### Anti-Pattern
[Counter-example]

## Remember
Key takeaways (3-5 bullet points)

## References
External resources and standards
```

## Quality Standards for Skills

All skills must:
- ✅ Have valid YAML frontmatter
- ✅ Include clear purpose statement
- ✅ Define strategic principles (not step-by-step instructions)
- ✅ Provide concrete examples
- ✅ Specify when to apply
- ✅ Reference authoritative sources
- ✅ Follow Hack23 ISMS requirements
- ✅ Use inclusive, accessible language

## Integration with Agents

Agents are configured to automatically discover and use skills:

```yaml
# Agent configuration includes skill discovery
tools: ["view", "edit", "create", "search", "bash", "grep", "glob"]

# Agents have access to .github/skills/ directory
# Skills load automatically based on context
```

## Relationship to Hack23 ISMS

All skills align with Hack23's public ISMS:
- [Information Security Management System (ISMS)](https://github.com/Hack23/ISMS-PUBLIC)
- [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md)

Skills operationalize ISMS policies into practical, actionable guidance for agents.

## Compliance Framework Mapping

Skills enforce compliance with:
- **ISO 27001:2022**: Annex A controls
- **NIST CSF 2.0**: Six functions (GOVERN, IDENTIFY, PROTECT, DETECT, RESPOND, RECOVER)
- **CIS Controls v8.1**: Implementation Groups 1-3
- **WCAG 2.1**: Level AA accessibility
- **W3C Standards**: HTML5, CSS3, i18n/l10n

## Troubleshooting

### Skill Not Being Applied
- Verify skill file exists in `.github/skills/`
- Check YAML frontmatter is valid
- Ensure `SKILL.md` filename is correct
- Review skill description for keyword matching

### Conflicting Skills
- Skills are applied in hierarchy order (strategic → tactical)
- More specific skills override general ones
- Document exceptions in custom instructions

### Updating Skills
- Update skill file in `.github/skills/`
- Changes take effect on next agent invocation
- Test with sample task to verify changes
- Document changes in commit message

## Related Documentation

- [AGENTS.md](AGENTS.md) - Custom agents reference
- [README.md](README.md) - Project overview
- [Hack23 ISMS-PUBLIC](https://github.com/Hack23/ISMS-PUBLIC) - ISMS policies
- [GitHub Copilot Skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills) - Official docs
- [Anthropic Skills](https://github.com/anthropics/skills) - Community skills
- [Awesome Copilot](https://github.com/github/awesome-copilot) - Best practices

---

**Last Updated**: 2026-01-31  
**Maintained by**: Hack23 AB
