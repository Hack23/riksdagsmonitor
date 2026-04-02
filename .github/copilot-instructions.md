# Riksdagsmonitor Copilot Instructions

## 📋 Repository Context

**Project**: Riksdagsmonitor — Swedish Parliament (Riksdag) monitoring platform
**Stack**: HTML5, CSS3, TypeScript 6.0.2, Vite 8.0.3, Vitest 4.1.2, Cypress 15.13.0
**Runtime**: Node.js 25, ES2025 target, ESNext modules
**Deploy**: GitHub Pages + AWS S3 dual deployment
**Languages**: 14-language support (EN, SV, DA, NO, FI, DE, FR, ES, NL, AR, HE, JA, KO, ZH)
**Security**: ISO 27001:2022, NIST CSF 2.0, CIS Controls v8.1 compliant
**Organization**: Hack23 AB
**ISMS**: [Hack23 ISMS-PUBLIC](https://github.com/Hack23/ISMS-PUBLIC)
**Version**: 0.8.17
**Agents**: 24 custom agents in `.github/agents/`
**Skills**: 87+ skills in `.github/skills/` (including 12 gh-aw skills)
**Workflows**: 35 GitHub Actions (23 standard + 12 agentic `.lock.yml`)
**MCP Servers**: 8 configured (riksdag-regering, scb, world-bank, github, filesystem, memory, sequential-thinking, playwright)

## 🎯 Core Rules

### 1. Complete Work, Don't Ask Questions
- Make informed decisions based on existing codebase patterns
- Use available agents and skills for specialized tasks
- Run checks and validations before committing

### 2. Never Create New Markdown Files (Unless Explicitly Requested)

### 3. Run Checks Before Committing
- **MUST**: Validate HTML (`htmlhint`), check links (`linkinator`), validate JSON
- **MUST**: Verify WCAG 2.1 AA accessibility compliance
- **SHOULD**: Test responsive design, check cross-browser compatibility

### 4. Use Available Agents and Skills
- 24 agents covering security, docs, quality, frontend, ISMS, deployment, devops, intelligence, news, content, data pipeline, data visualization, task management, UI enhancement, and gh-aw workflows
- 87+ skills auto-load from `.github/skills/`

## 🏗️ Architecture & Design

### HTML: Semantic HTML5, ARIA, mobile-first, no div soup, no inline styles
### CSS: Custom properties, Grid/Flexbox, cyberpunk theme, 4.5:1 contrast, no frameworks
### TypeScript: ES2025 target, strict mode, ESLint with es2025 globals
### Multi-Language: 14 files per page, RTL for AR/HE, hreflang SEO, BCP-47 `nb` for Norwegian

## 🔒 Security Rules

### Required Files (never delete)
- `SECURITY_ARCHITECTURE.md`, `THREAT_MODEL.md`, `FUTURE_SECURITY_ARCHITECTURE.md`, `ARCHITECTURE.md`
- Full portfolio: 6 current-state + 6 future-state + 3 security docs

### DevSecOps
- step-security/harden-runner in workflows, pin Actions to SHA
- Least privilege permissions, CodeQL + Dependabot + secret scanning
- HTTPS-only, CSP/HSTS headers, SRI for CDN assets

## 📐 Quality Standards

- HTML: Zero HTMLHint errors
- Links: All internal links working (linkinator)
- Accessibility: WCAG 2.1 AA (keyboard nav, screen reader, 4.5:1 contrast)
- Performance: FCP < 1.5s, LCP < 2.5s, TTI < 3s, CLS < 0.1

## 🎨 Design System

```css
/* Colors */
--primary-cyan: #00d9ff;  --primary-magenta: #ff006e;  --primary-yellow: #ffbe0b;
--dark-bg: #0a0e27;  --mid-bg: #1a1e3d;  --light-text: #e0e0e0;
/* Typography */
--font-primary: 'Inter', sans-serif;  --font-heading: 'Orbitron', sans-serif;
/* Breakpoints: 320px (default) → 768px (tablet) → 1024px (desktop) → 1440px (large) */
```

## 🤖 GitHub Agentic Workflows

This repo uses [GitHub Agentic Workflows](https://github.github.com/gh-aw/) (gh-aw v0.45.5) for AI-powered news generation. 12 agentic workflows in `.github/workflows/` produce daily political intelligence articles with five-layer security:

1. **Read-only tokens** — Agent gets only read permissions
2. **Zero secrets in agent** — Write tokens isolated in separate jobs
3. **Containerized + firewall** — Squid proxy domain allowlists, iptables
4. **Safe outputs** — Structured artifacts with hard limits and validation
5. **Threat detection** — AI scan blocks prompt injection and malicious code

### Agentic Workflow Schedule
- **Morning**: Propositions, committee reports, motions, interpellations
- **Midday**: Month-ahead, week-ahead forecasting
- **Evening**: Evening analysis, realtime monitoring
- **Weekly/Monthly**: Reviews, translations across 14 languages

## 🔄 CI/CD

```yaml
permissions:
  contents: read  # Least privilege
steps:
  - uses: step-security/harden-runner@SHA
  - uses: actions/checkout@SHA
```

Quality gates: HTMLHint + linkinator + Dependabot + CodeQL + secret scanning

## 🎯 Agent Quick Reference

| Agent | Use For |
|-------|---------|
| `security-architect` | Security architecture, STRIDE, compliance mapping |
| `documentation-architect` | C4 models, Mermaid diagrams, technical docs |
| `quality-engineer` | HTML/CSS validation, accessibility, quality gates |
| `frontend-specialist` | UI/UX, responsive design, multi-language |
| `isms-compliance-manager` | Compliance verification, gap analysis, audits |
| `deployment-specialist` | CI/CD, GitHub Actions, workflow optimization |
| `devops-engineer` | Infrastructure, performance, build optimization |
| `intelligence-operative` | Political analysis, OSINT, voting patterns |
| `news-journalist` | Political news, editorial standards, SEO |
| `content-generator` | Automated content, multi-language articles |
| `data-pipeline-specialist` | CIA data, ETL workflows, data validation |
| `data-visualization-specialist` | Chart.js/D3.js, interactive dashboards |
| `task-agent` | Product analysis, issue creation, agent coordination |
| `ui-enhancement-specialist` | CSS visualizations, design system, cyberpunk theme |
| `agentic-workflows` | gh-aw workflow creation, debugging, upgrades |

## 💡 Remember

- **Complete, don't ask** — Make informed decisions
- **Security first** — Never compromise security
- **Quality mandatory** — All checks must pass
- **Mobile-first** — Design for smallest screen up
- **Accessibility** — WCAG 2.1 AA required
- **Follow patterns** — Look at existing code
- **Use agents/skills** — Leverage specialized expertise
- **BCP-47** — Norwegian uses `nb` not `no`

---

**Last Updated**: 2026-04-02
**Version**: 3.0
