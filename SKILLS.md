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

## Available Skills (40 Total) ✨ Updated

### Core Infrastructure (7 skills)
1. hack23-isms-compliance
2. security-by-design
3. static-site-security
4. ci-cd-security
5. documentation-standards
6. html-accessibility
7. multi-language-localization

### Political Intelligence (11 skills)
8. political-science-analysis
9. osint-methodologies
10. intelligence-analysis-techniques
11. swedish-political-system
12. electoral-analysis
13. behavioral-analysis
14. strategic-communication-analysis
15. legislative-monitoring
16. risk-assessment-frameworks
17. data-science-for-intelligence
18. gdpr-compliance

### ISMS & Security (6 skills)
19. cis-controls
20. iso-27001-controls
21. nist-csf-mapping
22. threat-modeling
23. secure-code-review
24. security-documentation

### Development & Operations (10 skills) ⬆️ **EXPANDED**
25. c4-architecture-documentation
26. github-actions-workflows
27. code-quality-checks
28. secrets-management
29. **data-pipeline-engineering** ✨ NEW
30. **automated-content-generation** ✨ NEW
31. **performance-optimization** ✨ NEW
32. **api-integration** ✨ NEW

### UI/UX & Design (4 skills) ⬆️ **EXPANDED**
33. responsive-design
34. design-system-management
35. political-data-visualization
36. **advanced-data-visualization** ✨ NEW

### Testing & Quality Assurance (2 skills)
37. playwright-testing
38. issue-management

### Data Integration (2 skills) ⬆️ **EXPANDED**
39. riksdag-regering-mcp
40. **cia-data-integration** ✨ NEW

---

## Detailed Skill Descriptions

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

### 8. political-science-analysis
**Purpose**: Apply comparative politics, political behavior, public policy analysis frameworks to Swedish political data

**Key Principles**:
- Objectivity and Non-Partisanship
- Evidence-Based Analysis
- Multi-Source Verification
- Democratic Theory Application
- Swedish Political System Context

**Enforces**:
- Balanced coverage of all parties
- Comparative political frameworks
- Democratic quality indicators
- Policy cycle analysis
- Voting behavior analysis

**When to Use**:
- Political dashboard design
- Voting pattern analysis
- Coalition stability assessment
- Policy impact evaluation
- Democratic accountability metrics

### 9. osint-methodologies
**Purpose**: OSINT collection, source evaluation, data integration for Swedish political intelligence

**Key Principles**:
- Public Sources Only
- Source Reliability Assessment (NATO Admiralty Code)
- Data Quality Metrics
- Source Triangulation
- GDPR Compliance

**Enforces**:
- riksdag-regering-mcp as primary data source
- Multi-source verification
- Completeness/accuracy/timeliness tracking
- Ethical OSINT collection
- Privacy-by-design

**When to Use**:
- Data source integration
- Data quality validation
- Source credibility assessment
- OSINT collection strategies

### 10. intelligence-analysis-techniques
**Purpose**: Structured analytic techniques (ACH, SWOT, Devil's Advocacy) for political intelligence

**Key Principles**:
- Analysis of Competing Hypotheses
- SWOT Analysis
- Red Team Thinking
- Key Assumptions Check
- Confidence Level Assessment

**Enforces**:
- Multiple hypothesis consideration
- Structured reasoning
- Bias mitigation
- Diagnostic evidence focus
- Uncertainty communication

**When to Use**:
- Election forecasting
- Coalition prediction
- Policy outcome assessment
- Crisis analysis

### 11. swedish-political-system
**Purpose**: Swedish Riksdag structure, 8 parties, electoral system, government formation

**Key Principles**:
- Parliamentary Democracy
- Negative Parliamentarism
- Proportional Representation
- Consensus-Seeking Culture
- Public Access Principle (Offentlighetsprincipen)

**Enforces**:
- 349 MPs, 15 committees
- 8 parliamentary parties
- 4% electoral threshold
- Coalition formation patterns
- Parliamentary procedures

**When to Use**:
- Political data interpretation
- Coalition analysis
- Electoral analysis
- Government formation

### 12. electoral-analysis
**Purpose**: Election forecasting, campaign analysis, coalition prediction

**Key Principles**:
- Historical Trend Analysis
- Polling Aggregation
- Seat Projection Modeling
- Coalition Viability Assessment
- Confidence Intervals

**Enforces**:
- Historical data (1970-present)
- Uncertainty quantification
- Methodology transparency
- Scenario modeling

**When to Use**:
- Election forecasts
- Campaign tracking
- Coalition predictions
- Voter behavior modeling

### 13. behavioral-analysis
**Purpose**: Political psychology, cognitive biases, leadership analysis

**Key Principles**:
- Cognitive Bias Recognition
- Leadership Styles
- Group Dynamics
- Political Psychology
- Behavioral Profiling

**Enforces**:
- Evidence-based psychological analysis
- MP behavioral profiles
- Influence network analysis
- Coalition psychology

**When to Use**:
- MP profiling
- Leadership assessment
- Coalition dynamics
- Decision-making analysis

### 14. strategic-communication-analysis
**Purpose**: Narrative analysis, media bias detection, information operations

**Key Principles**:
- Narrative Identification
- Media Analysis
- Discourse Analysis
- Counter-Disinformation
- Fact-Checking

**Enforces**:
- Objective communication analysis
- Source credibility assessment
- Disinformation detection
- Transparent methodologies

**When to Use**:
- Media monitoring
- Narrative tracking
- Disinformation detection
- Communication strategy assessment

### 15. legislative-monitoring
**Purpose**: Voting patterns, bill tracking, committee effectiveness, parliamentary oversight

**Key Principles**:
- Voting Record Analysis
- Legislative Pipeline Tracking
- Committee Productivity
- Parliamentary Oversight
- Accountability Mechanisms

**Enforces**:
- Comprehensive vote tracking
- Bill lifecycle monitoring
- Committee effectiveness metrics
- Government oversight assessment

**When to Use**:
- Voting pattern analysis
- Bill tracking
- Committee analysis
- Oversight effectiveness

### 16. risk-assessment-frameworks
**Purpose**: Political risk indicators, corruption detection, early warning systems

**Key Principles**:
- Electoral Risk
- Policy Risk
- Institutional Risk
- Corruption Risk
- External Risk

**Enforces**:
- 45 risk rules framework
- Severity classification
- Risk scoring methodology
- Early warning indicators

**When to Use**:
- Risk assessment
- Corruption indicators
- Democratic stability
- Accountability gaps

### 17. data-science-for-intelligence
**Purpose**: Statistical analysis, data visualization, pattern recognition for political intelligence

**Key Principles**:
- Statistical Rigor
- CSS-Only Visualization
- Pattern Recognition
- Network Analysis
- WCAG 2.1 AA Accessibility

**Enforces**:
- Responsive HTML/CSS dashboards
- No JavaScript frameworks
- Accessible visualizations
- Data quality validation

**When to Use**:
- Dashboard design
- Data visualization
- Pattern analysis
- Statistical modeling

### 18. gdpr-compliance
**Purpose**: GDPR compliance for political data processing, privacy-by-design

**Key Principles**:
- Public Interest Basis (Article 6(1)(e))
- Special Category Data (Article 9)
- Data Subject Rights
- Privacy-by-Design
- Data Minimization

**Enforces**:
- GDPR Article 6(1)(e) compliance
- No personal data beyond official capacity
- No tracking/cookies
- HTTPS-only
- Transparent data usage

**When to Use**:
- Political data processing
- Privacy assessments
- Data collection strategies
- Compliance verification

### 19. cis-controls ✨ NEW
**Purpose**: CIS Controls v8.1 critical security controls for static HTML/CSS websites on GitHub Pages

**Key Principles**:
- Asset Inventory (repositories, domains, CDN)
- Secure Configuration (GitHub Pages, security headers)
- Access Control (branch protection, MFA)
- Audit Logging (GitHub audit logs)
- Application Security (HTML/CSS validation, dependency scanning)

**Enforces**:
- Control 1: Asset management (GitHub repo, domain, DNS)
- Control 4: Secure configuration (CSP, HSTS, X-Frame-Options)
- Control 6: Access control management (GitHub permissions)
- Control 8: Audit log management
- Control 16: Application software security (validation, scanning)

**When to Use**:
- Security hardening
- Compliance assessments
- GitHub Pages configuration
- Security baseline establishment

### 20. iso-27001-controls ✨ NEW
**Purpose**: ISO 27001:2022 Annex A controls for static HTML/CSS websites

**Key Principles**:
- Organizational Controls (A.5)
- Technical Controls (A.8)
- Development Controls (A.14)
- Incident Management (A.16)

**Enforces**:
- A.8.3: Access restrictions via GitHub permissions
- A.8.23: Web filtering (CSP, security headers)
- A.8.24: Cryptography (TLS 1.3, HTTPS-only)
- A.8.28: Secure coding (HTML5/CSS3 validation)
- A.14.2.8: Security testing (validation, scanning)

**When to Use**:
- ISMS audits
- Security architecture changes
- ISO 27001 certification prep
- Control implementation verification

### 21. nist-csf-mapping ✨ NEW
**Purpose**: NIST Cybersecurity Framework 2.0 mapping for static sites

**Key Principles**:
- IDENTIFY: Asset management, risk assessment
- PROTECT: Access control, data security
- DETECT: Continuous monitoring, adverse events
- RESPOND: Incident analysis, mitigation
- RECOVER: Recovery planning, communications

**Enforces**:
- ID.AM: Repository and domain inventory
- PR.AC: GitHub MFA, branch protection
- PR.DS: HTTPS-only, no cookies
- DE.CM: GitHub audit logs, Dependabot
- RC.RP: Git history backups, rollback procedures

**When to Use**:
- Security architecture reviews
- Compliance assessments
- Risk management
- Control mapping

### 22. threat-modeling ✨ NEW
**Purpose**: STRIDE threat modeling for static HTML/CSS websites on GitHub Pages

**Key Principles**:
- Spoofing (domain hijacking, DNS attacks)
- Tampering (repository compromise)
- Repudiation (audit trail integrity)
- Information Disclosure (secret leaks)
- Denial of Service (DDoS protection)
- Elevation of Privilege (access control)

**Enforces**:
- HTTPS and DNSSEC
- Branch protection and GPG signing
- GitHub audit logs
- Secret scanning
- GitHub Pages CDN protection
- Minimal workflow permissions

**When to Use**:
- Security design
- Threat analysis
- Risk assessments
- ISMS compliance (ISO A.12.6)

### 23. secure-code-review ✨ NEW
**Purpose**: Security code review for HTML/CSS/JavaScript in static websites

**Key Principles**:
- HTML Security (no inline scripts, CSP compliance)
- CSS Security (no external imports, no user-controlled CSS)
- Link Security (HTTPS-only, link integrity)
- Configuration Security (no secrets, minimal permissions)

**Enforces**:
- No inline JavaScript (CSP compliance)
- External links use rel="noopener noreferrer"
- All links HTTPS
- Secret scanning
- Workflow permissions minimal

**When to Use**:
- PR reviews
- Security audits
- Code contributions
- XSS prevention

### 24. security-documentation ✨ NEW
**Purpose**: ISMS security documentation standards for Hack23 projects

**Key Principles**:
- Current State (SECURITY_ARCHITECTURE.md)
- Future State (FUTURE_SECURITY_ARCHITECTURE.md)
- Threat Analysis (THREAT_MODEL.md)
- System Design (ARCHITECTURE.md)
- Security Policy (SECURITY.md)

**Enforces**:
- C4 diagrams (Context, Container, Component)
- Mermaid workflows
- Compliance mapping (ISO/NIST/CIS)
- Document control metadata
- Classification marking

**When to Use**:
- Architecture changes
- Security control updates
- ISMS audits
- Compliance documentation

### 25. c4-architecture-documentation ✨ NEW
**Purpose**: C4 architecture model for documenting static sites with MCP integrations

**Key Principles**:
- Context Diagram (system and users)
- Container Diagram (technology choices)
- Component Diagram (internal structure)
- Code Diagram (class/interface level)

**Enforces**:
- Mermaid C4 diagrams
- Technology stack documentation
- MCP server integration diagrams
- Deployment pipeline documentation

**When to Use**:
- ARCHITECTURE.md updates
- System design documentation
- MCP server integration
- Technology decisions

### 26. github-actions-workflows ✨ NEW
**Purpose**: GitHub Actions workflow patterns for static site CI/CD

**Key Principles**:
- Quality Checks (HTML/CSS validation, link checking)
- Security Scanning (CodeQL, Dependabot, secret scanning)
- Deployment (GitHub Pages publishing)
- Minimal Permissions (least privilege)

**Enforces**:
- HTMLHint validation
- linkinator link checking
- CodeQL security analysis
- Dependency scanning
- Least privilege permissions
- SHA-pinned actions

**When to Use**:
- CI/CD pipeline design
- Workflow optimization
- Security hardening
- Quality gate implementation

### 27. code-quality-checks ✨ NEW
**Purpose**: Quality gates for static HTML/CSS websites

**Key Principles**:
- HTML Validation (HTMLHint, 0 errors)
- CSS Validation (CSSLint, warnings only)
- Link Integrity (linkinator, 0 broken links)
- Accessibility (axe-core, WCAG 2.1 AA)
- Performance (Core Web Vitals, PageSpeed Insights)

**Enforces**:
- 0 HTML validation errors
- 0 broken links
- 0 WCAG 2.1 AA violations
- 4.5:1 color contrast minimum
- 90+ PageSpeed score

**When to Use**:
- PR reviews
- Quality assurance
- Pre-deployment checks
- Continuous monitoring

### 28. secrets-management ✨ NEW
**Purpose**: GitHub secrets and environment variables for MCP servers and CI/CD

**Key Principles**:
- GitHub Secrets (Actions, Environment)
- Secret Scanning (automatic detection)
- Secret Rotation (90-day cycle)
- Least Privilege (minimal scopes)
- Audit Logging (secret access tracking)

**Enforces**:
- COPILOT_MCP_GITHUB_PERSONAL_ACCESS_TOKEN configuration
- Environment-specific secrets (copilot environment)
- .gitignore for sensitive files
- Secret scanning enabled
- 90-day rotation policy

**When to Use**:
- MCP server configuration
- CI/CD workflow setup
- Secret rotation
- Security audits

### 29. responsive-design ✨ NEW
**Purpose**: Mobile-first responsive web design with CSS Grid/Flexbox, breakpoints (320px-1440px+)

**Key Principles**:
- Mobile-First Design
- Fluid Typography (clamp())
- Flexible Layouts (Grid/Flexbox)
- Touch-Friendly (44x44px targets)
- Performance Optimized
- Content Priority

**Enforces**:
- Standard breakpoints (320px, 768px, 1024px, 1440px+)
- Fluid typography with clamp()
- CSS Grid for layouts
- 44x44px minimum touch targets
- Viewport meta tag required
- Max-width constraint for ultra-wide

**When to Use**:
- All HTML/CSS development
- New feature implementation
- Dashboard design
- Navigation redesign
- Mobile optimization
- Cross-device testing

### 30. design-system-management ✨ NEW
**Purpose**: Cyberpunk theme design system with CSS custom properties and component library

**Key Principles**:
- Single Source of Truth (CSS variables)
- Component-Based Architecture
- Theme Consistency
- Accessibility Built-In
- Responsive Scaling
- Performance Focused

**Enforces**:
- CSS custom properties for all design tokens
- Cyberpunk color palette (cyan, magenta, yellow on dark)
- Fluid typography and spacing scales
- Reusable component patterns
- 4.5:1 color contrast minimum
- Neon glow effects

**When to Use**:
- New page creation
- Component development
- UI refactoring
- Theme updates
- Accessibility enhancements
- Style standardization

### 31. political-data-visualization ✨ NEW
**Purpose**: CSS-only data visualization (charts, heat maps, progress bars) for political metrics

**Key Principles**:
- CSS-Only (no JavaScript)
- Accessibility First (WCAG 2.1 AA)
- Semantic Markup
- Progressive Disclosure
- Color-Blind Safe
- Responsive Design

**Enforces**:
- Progress bars for voting discipline
- Bar charts for MP/party distribution
- Heat maps for voting patterns
- Donut charts for coalitions
- Timeline visualizations
- Swedish party color palette
- Screen reader support

**When to Use**:
- Dashboard design
- Party analysis visualizations
- Voting record displays
- Committee activity metrics
- MP profile timelines
- Risk assessment indicators

### 32. playwright-testing ✨ NEW
**Purpose**: Browser automation, visual regression testing, screenshot capture for static websites

**Key Principles**:
- Headless First
- Visual Evidence
- Accessibility Integration (axe-core)
- Cross-Browser Coverage
- Responsive Testing
- Performance Monitoring

**Enforces**:
- Xvfb display for headless rendering
- Screenshot capture on all tests
- WCAG 2.1 AA audits with axe-playwright
- Multi-language testing (14 languages)
- Responsive viewport testing
- Core Web Vitals measurement

**When to Use**:
- Quality assurance automation
- Visual regression detection
- Accessibility audits
- Cross-browser testing
- Issue validation with evidence
- Performance monitoring

### 33. issue-management ✨ NEW
**Purpose**: GitHub issue creation, labeling, milestones, agent assignment for product management

**Key Principles**:
- Clarity First
- Actionable Items
- Properly Labeled
- Traceable
- Evidence-Based
- Agent-Optimized

**Enforces**:
- Structured issue templates
- Clear acceptance criteria
- Type/priority/area/agent labels
- Screenshot/log evidence
- Related issue linking
- Copilot agent assignment format

**When to Use**:
- Bug reports
- Feature requests
- Security issues
- Accessibility issues
- Technical debt tracking
- Agent task delegation

### 34. riksdag-regering-mcp ✨ NEW
**Purpose**: 32 specialized tools for Swedish political data via riksdag-regering-mcp MCP server

**Key Principles**:
- Authoritative Data Source
- Comprehensive Coverage (50+ years)
- Structured API
- Real-Time Access
- GDPR Compliance
- Multi-Source Integration

**Available Tools**:
- Search & Discovery (6 tools): MPs, documents, speeches, votes
- Detailed Information (6 tools): Document content, MP profiles
- Parliamentary Documents (6 tools): Motions, propositions, reports
- Government Documents (4 tools): SOU, Dir, propositions
- Analytics & Aggregation (5 tools): Voting groups, reports
- Advanced Queries (5 tools): Pagination, batch fetching

**When to Use**:
- Political intelligence analysis
- Legislative monitoring
- MP profiling and analysis
- Coalition behavior assessment
- Policy research and tracking
- Voting pattern analysis
- Government oversight
- Electoral research

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

**Last Updated**: 2026-02-06  
**Maintained by**: Hack23 AB

### 35. data-pipeline-engineering ✨ NEW - 2026-02-06
**Purpose**: Expert knowledge in designing robust ETL (Extract, Transform, Load) pipelines for automated data processing

**Key Principles**:
- Idempotency (pipeline runs produce same results)
- Observability (full visibility into pipeline health)
- Error Recovery (graceful handling of failures)
- Version Tracking (track all data changes)
- Monitoring (real-time pipeline health checks)

**Enforces**:
- ETL workflow patterns (Extract → Transform → Load)
- Automated scheduling (cron, GitHub Actions)
- Data versioning and archival
- Pipeline health monitoring
- Error recovery strategies
- Audit logging

**When to Use**:
- Building automated data pipelines
- Scheduling data fetching workflows
- Implementing data versioning
- Monitoring pipeline health
- Designing error recovery

### 36. automated-content-generation ✨ NEW - 2026-02-06
**Purpose**: Template-based content generation, intelligence reports, and multi-language automated content

**Key Principles**:
- Template-Based (reusable content templates)
- Multi-Language (14 languages support)
- Data-Driven (content from structured data)
- Quality Assured (validation before publication)
- SEO Optimized (search engine friendly)

**Enforces**:
- Markdown/HTML template engines
- Multi-language content generation
- Scheduled content generation (daily/weekly)
- Content validation and quality checks
- SEO meta tags and structured data
- RSS feed generation

**When to Use**:
- Automated news generation
- Intelligence report creation
- Multi-language content
- Scheduled content updates
- RSS feed generation

### 37. performance-optimization ✨ NEW - 2026-02-06
**Purpose**: Core Web Vitals optimization, bundle size reduction, caching strategies, and performance tuning

**Key Principles**:
- Measure First (Lighthouse/PageSpeed Insights)
- Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- Progressive Enhancement
- Lazy Loading
- Caching Strategy

**Enforces**:
- Core Web Vitals targets
- Bundle size optimization (< 100KB initial)
- Image optimization (WebP, lazy loading)
- HTTP caching headers
- CDN optimization
- Code splitting and tree shaking

**When to Use**:
- Performance tuning
- Bundle size reduction
- Load time optimization
- Core Web Vitals improvement
- Caching strategy design

### 38. api-integration ✨ NEW - 2026-02-06
**Purpose**: REST/GraphQL API client design, rate limiting, error handling, and authentication best practices

**Key Principles**:
- Resilience (handle failures gracefully)
- Rate Limiting (respect API limits)
- Retry Logic (exponential backoff)
- Circuit Breaker (fail fast when needed)
- Security (secure credential storage)

**Enforces**:
- REST/GraphQL client patterns
- Rate limiting and throttling
- Retry logic with exponential backoff
- Circuit breaker pattern
- Error handling and recovery
- Authentication (OAuth, API keys, JWT)
- Request/response logging
- Timeout configuration

**When to Use**:
- Building API clients
- Integrating external services
- Handling API failures
- Rate limit management
- Authentication implementation

### 39. advanced-data-visualization ✨ NEW - 2026-02-06
**Purpose**: Chart.js/D3.js expertise for interactive dashboards, complex charts, and political data visualization

**Key Principles**:
- Accessibility First (WCAG 2.1 AA compliant)
- Responsive Always (mobile-first design)
- Performance Critical (optimize for large datasets)
- Clarity Over Complexity (clear data storytelling)
- Interactive Insight (enable user exploration)

**Enforces**:
- Chart.js bar/line/scatter/pie charts
- D3.js network/force/geo diagrams
- Interactive tooltips and legends
- Responsive chart design
- Screen reader compatibility
- Performance optimization (lazy loading, canvas vs SVG)

**Chart Types**:
- Election Forecasting (confidence intervals, seat predictions)
- Risk Heat Maps (multi-dimensional risk scoring)
- Network Diagrams (influence and power structures)
- Time Series (historical trends, 50+ years)
- Scatter Plots (correlation and clustering)
- Sankey Diagrams (coalition flows)

**When to Use**:
- Creating interactive dashboards
- Visualizing complex datasets
- Building political intelligence displays
- Network/influence mapping
- Time series analysis

### 40. cia-data-integration ✨ NEW - 2026-02-06
**Purpose**: Expert knowledge in consuming CIA platform JSON exports, validation, caching strategies, and data pipeline integration

**Key Principles**:
- CIA is Source of Truth (never modify CIA's pre-computed data)
- Validate Before Cache (always validate against CIA-provided JSON schemas)
- Version Tracking (track all CIA data updates with timestamps)
- Graceful Degradation (fall back to cached data if CIA unavailable)
- Data Freshness (monitor and alert on stale data > 24 hours)
- Audit Logging (log all data operations for traceability)

**Enforces**:
- Fetch 19 visualization products from CIA platform
- Handle rate limiting and connection failures
- Implement retry logic with exponential backoff
- Circuit breaker pattern for API failures
- JSON Schema validation using Ajv
- Versioned caching structure (current + archive)
- Data freshness monitoring
- Automatic fallback to cached data

**Data Products (19 Total)**:
- Overview Dashboard
- Party Performance
- Government Cabinet Scorecard
- Election Cycle Analysis
- Top 10 Rankings (10 products)
- Committee Network Analysis
- Politician Career Analysis
- Party Longitudinal Analysis

**When to Use**:
- Implementing CIA export fetch workflows
- Validating CIA JSON data
- Designing caching strategies
- Building data consumption pipelines
- Monitoring data freshness
- Handling API failures gracefully

---

**Skills Total**: 40 (34 original + 6 new)  
**Last Major Update**: 2026-02-06  
**New Skills Added**: data-pipeline-engineering, automated-content-generation, performance-optimization, api-integration, advanced-data-visualization, cia-data-integration
