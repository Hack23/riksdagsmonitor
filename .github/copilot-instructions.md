# Riksdagsmonitor Copilot Instructions

## 📋 Repository Context

**Project**: Static HTML/CSS website for Swedish Parliament (Riksdag) monitoring
**Stack**: HTML5, CSS3, Vite, Vitest, Cypress, GitHub Pages, GitHub Actions
**Languages**: 14-language support (EN, SV, DA, NO, FI, DE, FR, ES, NL, AR, HE, JA, KO, ZH)
**Security**: ISO 27001, NIST CSF 2.0, CIS Controls v8.1 compliant
**Organization**: Hack23 AB (21 repositories)
**ISMS**: [Hack23 ISMS-PUBLIC](https://github.com/Hack23/ISMS-PUBLIC)
**Skills**: 87 skills in `.github/skills/` covering security, compliance, development, testing, visualization, intelligence, and more

## 🎯 Core Rules (ALWAYS Follow)

### 1. Complete Work, Don't Ask Questions
- **DO**: Make informed decisions based on existing patterns in the codebase
- **DO**: Use available agents and skills for specialized tasks
- **DO**: Run checks and validations before committing
- **DON'T**: Ask permission for standard changes that follow established patterns
- **DON'T**: Request clarification for well-documented requirements

### 2. Never Create New Markdown Files (Unless Explicitly Requested)
- **DO**: Update existing documentation files
- **DO**: Add sections to existing files
- **DON'T**: Create new `.md` files without explicit user request
- **DON'T**: Generate planning documents, notes, or tracking files

### 3. Run Comprehensive Checks Before Committing
- **MUST**: Validate HTML with HTMLHint before commit
- **MUST**: Check links with linkinator before commit
- **MUST**: Validate JSON syntax (copilot-mcp.json, package.json)
- **MUST**: Test responsive design on key breakpoints
- **MUST**: Verify WCAG 2.1 AA accessibility compliance
- **SHOULD**: Check cross-browser compatibility
- **SHOULD**: Validate security headers

### 4. Use Available Agents and Skills
- Leverage 14 specialized agents (security-architect, documentation-architect, quality-engineer, frontend-specialist, isms-compliance-manager, deployment-specialist, devops-engineer, intelligence-operative, news-journalist, content-generator, data-pipeline-specialist, data-visualization-specialist, task-agent, ui-enhancement-specialist)
- 87 skills automatically load based on context from `.github/skills/`
- Reference AGENTS.md and SKILLS.md for capabilities

## 🏗️ Architecture & Design Rules

### HTML Development
```
✅ DO:
- Use semantic HTML5 (header, nav, main, article, section, footer)
- Include comprehensive alt text for images
- Maintain proper heading hierarchy (h1 → h2 → h3)
- Use ARIA attributes for accessibility
- Follow mobile-first responsive design

❌ DON'T:
- Use div soup (non-semantic markup)
- Skip alt attributes
- Use tables for layout
- Inline styles (use styles.css)
- Add JavaScript dependencies
```

### CSS Development
```
✅ DO:
- Use CSS custom properties (variables)
- Implement CSS Grid and Flexbox for layouts
- Mobile-first media queries
- Follow existing cyberpunk theme
- Maintain 4.5:1 color contrast ratio

❌ DON'T:
- Use !important unless absolutely necessary
- Add CSS frameworks (Bootstrap, Tailwind)
- Remove focus indicators
- Use fixed pixel values for fonts (use clamp)
```

### Multi-Language Support
```
✅ DO:
- Maintain all 14 language files (index.html, index_sv.html, etc.)
- Use proper lang attribute on <html> tag
- Support RTL for Arabic and Hebrew (dir="rtl")
- Include hreflang tags for SEO
- Respect cultural formatting (dates, numbers)

❌ DON'T:
- Break language-specific files
- Ignore RTL layout requirements
- Remove language switcher
```

## 🔒 Security Rules (Mandatory)

### ISMS Compliance
```
MUST have these files (never delete):
- SECURITY_ARCHITECTURE.md - Current security controls
- THREAT_MODEL.md - STRIDE analysis
- FUTURE_SECURITY_ARCHITECTURE.md - Security roadmap
- ARCHITECTURE.md - C4 models
```

### Architecture Documentation Portfolio (Hack23 Standard)
Every Hack23 repository MUST maintain comprehensive architectural documentation:

#### Current State Documentation
```
REQUIRED:
- ARCHITECTURE.md — Complete C4 models (Context, Container, Component)
- DATA_MODEL.md — Data structures, entities, relationships
- FLOWCHART.md — Business process and data flows
- STATEDIAGRAM.md — System state transitions and lifecycles
- MINDMAP.md — System conceptual relationships
- SWOT.md — Strategic analysis and positioning
```

#### Future State Planning
```
REQUIRED:
- FUTURE_ARCHITECTURE.md — Architectural evolution roadmap
- FUTURE_DATA_MODEL.md — Enhanced data architecture plans
- FUTURE_FLOWCHART.md — Improved process workflows
- FUTURE_STATEDIAGRAM.md — Advanced state management
- FUTURE_MINDMAP.md — Capability expansion plans
- FUTURE_SWOT.md — Future strategic opportunities
```

#### Security Documentation
```
REQUIRED:
- SECURITY_ARCHITECTURE.md — Current security controls and architecture
- FUTURE_SECURITY_ARCHITECTURE.md — Planned security improvements
- THREAT_MODEL.md — STRIDE threat analysis and mitigations
```

#### Reference: [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md)

### DevSecOps
```
✅ DO:
- Use step-security/harden-runner in workflows
- Pin GitHub Actions to SHA (not tags)
- Implement least privilege permissions
- Run security scanning (CodeQL, Dependabot)
- Enable secret scanning

❌ DON'T:
- Hard-code credentials
- Disable security checks
- Skip vulnerability scanning
- Use deprecated crypto
```

### Static Site Security
```
✅ ENFORCE:
- HTTPS-only (TLS 1.3)
- Security headers (CSP, HSTS, X-Frame-Options)
- Subresource Integrity (SRI) for CDN assets
- No server-side code execution
- Minimal JavaScript dependencies
```

## 📐 Quality Standards

### HTML Validation
```bash
# MUST pass before commit
htmlhint *.html

# Zero errors required
```

### Link Checking
```bash
# MUST pass before commit
python3 -m http.server 8080 &
linkinator http://localhost:8080/ --recurse

# Fix all broken internal links
```

### Accessibility (WCAG 2.1 AA)
```
REQUIRED:
✅ Keyboard navigation works
✅ Screen reader compatible
✅ Color contrast ≥ 4.5:1 (normal text)
✅ Color contrast ≥ 3:1 (large text)
✅ Focus indicators visible
✅ ARIA labels for interactive elements
```

### Performance
```
TARGETS:
✅ First Contentful Paint < 1.5s
✅ Largest Contentful Paint < 2.5s
✅ Time to Interactive < 3s
✅ Cumulative Layout Shift < 0.1
```

## 🔄 CI/CD Rules

### GitHub Actions Workflows
```yaml
# ALWAYS use this pattern:
permissions:
  contents: read  # Least privilege

steps:
  - name: Harden Runner
    uses: step-security/harden-runner@SHA  # Pin to SHA
    with:
      egress-policy: audit
      
  - uses: actions/checkout@SHA  # Pin to SHA
```

### Quality Gates
```
BEFORE merge, ALL must pass:
✅ HTML validation (HTMLHint)
✅ Link checking (linkinator)
✅ Dependency scanning (Dependabot)
✅ Security scanning (CodeQL)
✅ Secret scanning
```

## 📚 Documentation Rules

### When to Update Documentation
```
UPDATE when:
✅ Adding new features
✅ Changing architecture
✅ Modifying security controls
✅ Updating CI/CD workflows
✅ Adding/removing dependencies

DON'T UPDATE when:
❌ Fixing typos in HTML
❌ Minor CSS adjustments
❌ Renaming variables
```

### Documentation Standards
```
✅ Use C4 model for architecture diagrams
✅ Create Mermaid diagrams for complex flows
✅ Include document control metadata
✅ Map to ISO 27001/NIST CSF/CIS Controls
✅ Maintain both current and future state docs
✅ Follow documentation-portfolio skill requirements
✅ Keep all 12 architecture documents up to date
```

## 🎨 Design System

### Cyberpunk Theme Colors
```css
--primary-cyan: #00d9ff;
--primary-magenta: #ff006e;
--primary-yellow: #ffbe0b;
--dark-bg: #0a0e27;
--mid-bg: #1a1e3d;
--light-text: #e0e0e0;
```

### Typography
```css
--font-primary: 'Inter', sans-serif;
--font-heading: 'Orbitron', sans-serif;
```

### Breakpoints (Mobile-First)
```css
/* Default: 320px - 767px */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1440px) { /* Large */ }
```

## 🚀 Workflow

### Standard Task Flow
```
1. Analyze requirement
2. Check existing patterns in codebase
3. Use appropriate agent/skill if needed
4. Make minimal changes
5. Run all validation checks
6. Verify changes manually
7. Commit with descriptive message
```

### Pre-Commit Checklist
```
- [ ] HTML validation passed
- [ ] Links checked and working
- [ ] Accessibility verified
- [ ] Responsive design tested
- [ ] Security headers validated
- [ ] No secrets committed
- [ ] JSON files valid
- [ ] Documentation updated (if needed)
```

## 🎯 Agent Usage

### When to Use Agents
```
security-architect:
  - Security architecture changes
  - STRIDE threat modeling
  - Compliance mapping

documentation-architect:
  - Architecture diagrams
  - Technical documentation
  - C4 models

quality-engineer:
  - HTML/CSS validation
  - Accessibility testing
  - Quality gate issues

frontend-specialist:
  - UI/UX changes
  - Responsive design
  - Multi-language support

isms-compliance-manager:
  - Compliance verification
  - Gap analysis
  - Audit preparation

deployment-specialist:
  - CI/CD improvements
  - GitHub Actions
  - Workflow optimization

devops-engineer:
  - Infrastructure automation
  - Performance monitoring
  - Build optimization

intelligence-operative:
  - Political data analysis
  - OSINT collection
  - Voting pattern analysis

news-journalist:
  - Political news coverage
  - Article generation
  - Editorial standards

content-generator:
  - Automated content generation
  - Multi-language articles
  - Template-based rendering

data-pipeline-specialist:
  - CIA data consumption
  - ETL workflows
  - Data validation

data-visualization-specialist:
  - Chart.js/D3.js dashboards
  - Interactive visualizations
  - Political metrics charts

task-agent:
  - Product analysis
  - Issue creation/management
  - Agent coordination

ui-enhancement-specialist:
  - CSS-only visualizations
  - Design system management
  - Cyberpunk theme implementation
```

## 🔗 References

- **Agents**: See [AGENTS.md](../AGENTS.md) — 14 specialized agents
- **Skills**: See [SKILLS.md](../SKILLS.md) — 87 skills across security, compliance, development, testing, intelligence, and more
- **ISMS**: [Hack23 ISMS-PUBLIC](https://github.com/Hack23/ISMS-PUBLIC)
- **Security Policy**: [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md)
- **Hack23 Repositories**: 21 repos including [cia](https://github.com/Hack23/cia), [homepage](https://github.com/Hack23/homepage), [blacktrigram](https://github.com/Hack23/blacktrigram), [cia-compliance-manager](https://github.com/Hack23/cia-compliance-manager), [European-Parliament-MCP-Server](https://github.com/Hack23/European-Parliament-MCP-Server), [euparliamentmonitor](https://github.com/Hack23/euparliamentmonitor), [game](https://github.com/Hack23/game), [lambda-in-private-vpc](https://github.com/Hack23/lambda-in-private-vpc)

## 💡 Remember

- **Complete, don't ask**: Make informed decisions
- **No new MD files**: Update existing documentation
- **Check before commit**: Run all validation
- **Use agents/skills**: Leverage specialized expertise
- **Follow patterns**: Look at existing code
- **Security first**: Never compromise security
- **Quality mandatory**: All checks must pass
- **Mobile-first**: Design for smallest screen up
- **Accessibility**: WCAG 2.1 AA required
- **Performance**: Fast is a feature

---

**Last Updated**: 2026-02-20
**Version**: 2.0
