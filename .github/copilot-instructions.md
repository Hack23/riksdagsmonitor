# Riksdagsmonitor Copilot Instructions

## 📋 Repository Context

**Project**: Riksdagsmonitor — Swedish Parliament (Riksdag) monitoring platform
**Stack**: HTML5, CSS3, TypeScript 6.0.2, Vite 8.0.3, Vitest 4.1.2, Cypress 15.13.0
**Runtime**: Node.js 25, ES2025 target, ESNext modules
**Deploy**: GitHub Pages + AWS S3 dual deployment
**Languages**: 14-language support (EN, SV, DA, NB, FI, DE, FR, ES, NL, AR, HE, JA, KO, ZH)
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
- Update and extend existing Markdown documentation instead of adding new `.md` files.
- Only create a new Markdown file when the user explicitly requests it.

### 3. Run Checks Before Committing
- **MUST**: Validate HTML (`htmlhint`), check links (`linkinator`), validate JSON
- **MUST**: Verify WCAG 2.1 AA accessibility compliance
- **SHOULD**: Test responsive design, check cross-browser compatibility

### 4. Use Available Agents and Skills
- 24 agents covering security, docs, quality, frontend, ISMS, deployment, devops, intelligence, news, content, data pipeline, data visualization, task management, UI enhancement, and gh-aw workflows
- 87+ skills auto-load from `.github/skills/`

### 5. 🔴 AI FIRST Quality Principle — Iterative Improvement Required
> **ALL analysis and content generation MUST follow the AI FIRST principle: never accept first-pass quality.**

- **Minimum 2 complete iterations** for ALL analysis and article content
- **Pass 1**: Create initial analysis/content following templates and standards
- **Pass 2**: Read ALL output back completely, critically evaluate, and improve every section
- **NEVER complete a phase early** — use ALL allocated time for iteration and improvement
- **NO SHORTCUTS** — every improvement checklist item must be addressed for every file
- **Quality over speed** — it is ALWAYS better to spend more time improving than to commit early
- Single-pass output is consistently shallow — first drafts lack specific evidence, use generic language, and produce boilerplate content
- The improvement pass transforms shallow content into publication-quality political intelligence
- If allocated 15 minutes for analysis, spend 15 minutes doing real analysis work — do not produce poor quality in a few minutes and move on
- **Enforcement**: Workflow runs completing under 45 minutes of their 60-minute allocation indicate insufficient iteration

## 🏗️ Architecture & Design

### HTML: Semantic HTML5, ARIA, mobile-first, no div soup, no inline styles
### CSS: Custom properties, Grid/Flexbox, cyberpunk theme, 4.5:1 contrast, no frameworks
### TypeScript: ES2025 target, strict mode, ESLint with es2025 globals
### Multi-Language: 14 files per page, RTL for AR/HE, hreflang SEO, Norwegian uses BCP-47 `nb` (preferred) though some existing content still uses legacy `no`; keep instructions and site output in sync during migration

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
:root {
  /* Colors */
  --primary-cyan: #00d9ff;  --primary-magenta: #ff006e;  --primary-yellow: #ffbe0b;
  --dark-bg: #0a0e27;  --mid-bg: #1a1e3d;  --light-text: #e0e0e0;
  /* Typography */
  --font-primary: 'Inter', sans-serif;  --font-heading: 'Orbitron', sans-serif;
  /* Breakpoints: 320px (default) → 768px (tablet) → 1024px (desktop) → 1440px (large) */
}
```

## 🤖 GitHub Agentic Workflows

This repo uses [GitHub Agentic Workflows](https://github.github.com/gh-aw/) (gh-aw v0.68.1) for AI-powered news generation. 12 agentic workflows in `.github/workflows/` produce daily political intelligence articles with five-layer security:

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

### Runtime Configuration (All Workflows)
All agentic workflows MUST include the `runtimes:` field to enforce Node.js 25:
```yaml
runtimes:
  node:
    version: "25"
```

### Tool Configuration (All Workflows)
All agentic workflows include these tools for full access:
```yaml
tools:
  startup-timeout: 180
  timeout: 120
  github:
    toolsets: [all]       # Full GitHub API access
  agentic-workflows: true # Workflow introspection (status, compile, logs, audit, checks)
  bash: true              # Shell commands
  playwright:             # Browser automation (where needed)
  repo-memory:            # Persistent memory across runs
    branch-name: memory/news-generation
```

### MCP Server Configuration (All Workflows)
All agentic workflows configure 3 custom MCP servers:
```yaml
mcp-servers:
  riksdag-regering:        # Swedish Parliament data (HTTP)
    url: https://riksdag-regering-ai.onrender.com/mcp
    allowed: ["*"]
  scb:                     # Statistics Sweden (container)
    container: "node:lts-alpine"
    entrypoint: "npx"
    entrypointArgs: ["-y", "@jarib/pxweb-mcp@2.0.0", "--url", "https://api.scb.se/OV0104/v2beta"]
    allowed: ["*"]
  world-bank:              # World Bank data (container)
    container: "node:lts-alpine"
    entrypoint: "npx"
    entrypointArgs: ["-y", "worldbank-mcp@1.0.1"]
    allowed: ["*"]
```

### MCP Server Inspection
Use the `gh aw mcp inspect` command to analyze and debug MCP servers:
```bash
gh aw mcp inspect                                        # List all workflows with MCP configs
gh aw mcp inspect workflow-name                           # Inspect MCP servers in a workflow
gh aw mcp inspect workflow-name --server server-name      # Filter to specific server
gh aw mcp inspect workflow-name --server name --tool tool # Show tool details
```

### Network Permissions
All workflows use a curated allowlist plus custom domains:
```yaml
network:
  allowed:
    - node                             # npm registry ecosystem
    - github                           # GitHub API
    - defaults                         # Curated dev domains
    - riksdag-regering-ai.onrender.com # Riksdag MCP server
    - api.scb.se                       # Statistics Sweden API
    - api.worldbank.org                # World Bank API
    - data.riksdagen.se                # Riksdag open data
    - riksdagen.se                     # Riksdag website
    - www.riksdagen.se                 # Riksdag website
    - regeringen.se                    # Government website
    - www.regeringen.se                # Government website
    - hack23.com                       # Hack23 platform
    - www.hack23.com                   # Hack23 platform
    - riksdagsmonitor.com              # This platform
    - raw.githubusercontent.com        # GitHub raw content
    - hack23.github.io                 # GitHub Pages
```

## 🔄 CI/CD

```yaml
# Partial example — key security patterns for every workflow job:
permissions:
  contents: read  # Least privilege
jobs:
  build:
    runs-on: ubuntu-latest
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

- **AI FIRST** — Never accept first-pass quality; always iterate and improve
- **Complete, don't ask** — Make informed decisions
- **Security first** — Never compromise security
- **Quality mandatory** — All checks must pass
- **Iterate always** — Minimum 2 passes for analysis and content; spend ALL allocated time
- **Mobile-first** — Design for smallest screen up
- **Accessibility** — WCAG 2.1 AA required
- **Follow patterns** — Look at existing code
- **Use agents/skills** — Leverage specialized expertise
- **BCP-47** — Norwegian uses `nb` not `no`
- **No shortcuts** — Real AI work for all phases, never produce shallow output

---

**Last Updated**: 2026-04-16
**Version**: 3.2
