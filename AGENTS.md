<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🤖 Riksdagsmonitor — Custom Agents Guide</h1>

<p align="center">
  <strong>🎯 24 Specialised GitHub Copilot Agents Powering Democratic Transparency</strong><br>
  <em>🕵️ 14 Persona Agents · ⚙️ 9 Workflow-Specialist Agents · 📚 1 Shared Developer Instructions</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/>
  <img src="https://img.shields.io/badge/Agents-24-success?style=for-the-badge" alt="24 Agents"/>
  <img src="https://img.shields.io/badge/Skills-91-purple?style=for-the-badge" alt="91 Skills"/>
  <img src="https://img.shields.io/badge/MCP_Servers-8-orange?style=for-the-badge" alt="8 MCP Servers"/>
</p>

**📋 Document Owner:** CEO | **🏢 Owner:** Hack23 AB (Org.nr 559534-7807) | **🏷️ Classification:** 🟢 Public

---

## Overview

This repository includes custom GitHub Copilot agents specialized for different aspects of the riksdagsmonitor project. Each agent has deep expertise in its domain and can be invoked to assist with specific tasks.

> **Directory-level catalog:** [`.github/agents/README.md`](.github/agents/README.md) — summarises all **24 agent files** (14 persona agents + 9 workflow-specialist `.agent.md` + shared `developer.instructions.md`). This document is the long-form reference with invocation examples and per-agent skill mappings.
> **Companion docs:** [`SKILLS.md`](SKILLS.md) · [`.github/skills/README.md`](.github/skills/README.md) · [`.github/prompts/README.md`](.github/prompts/README.md) · [`.github/workflows/README.md`](.github/workflows/README.md)

## Available Agents (14 Personas)

### 1. Security Architect (`security-architect`)
**Expertise**: Security architecture, ISMS compliance, threat modeling, ISO 27001/NIST CSF/CIS Controls

**Use for**:
- Security architecture design and review
- STRIDE threat modeling
- Compliance framework mapping
- Security control implementation
- Incident response planning
- Security documentation (SECURITY_ARCHITECTURE.md, THREAT_MODEL.md)

**Example invocation**:
```javascript
assign_copilot_to_issue({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  issue_number: 123,
  custom_agent: "security-architect",
  custom_instructions: "Review and update SECURITY_ARCHITECTURE.md with new controls"
})
```

### 2. Documentation Architect (`documentation-architect`)
**Expertise**: C4 architecture models, Mermaid diagrams, technical documentation, knowledge management

**Use for**:
- Creating C4 architecture diagrams (Context, Container, Component)
- Designing Mermaid flowcharts, sequence diagrams, state diagrams
- Writing comprehensive technical documentation
- Maintaining documentation portfolio (ARCHITECTURE.md, DATA_MODEL.md, etc.)
- Documentation standards enforcement

**Example invocation**:
```javascript
assign_copilot_to_issue({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  issue_number: 124,
  custom_agent: "documentation-architect",
  custom_instructions: "Create comprehensive ARCHITECTURE.md with C4 models"
})
```

### 3. Quality Engineer (`quality-engineer`)
**Expertise**: HTML/CSS validation, accessibility testing, link checking, CI/CD quality gates

**Use for**:
- HTML5 validation with HTMLHint
- CSS3 validation and optimization
- Link integrity checking with linkinator
- WCAG 2.1 AA accessibility compliance
- Quality workflow configuration
- Performance optimization

**Example invocation**:
```javascript
assign_copilot_to_issue({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  issue_number: 125,
  custom_agent: "quality-engineer",
  custom_instructions: "Fix all HTML validation errors and ensure WCAG 2.1 AA compliance"
})
```

### 4. Frontend Specialist (`frontend-specialist`)
**Expertise**: Static HTML/CSS, responsive design, multi-language localization, modern frontend

**Use for**:
- Semantic HTML5 development
- Responsive CSS (Grid, Flexbox)
- Multi-language website implementation (14 languages)
- Cyberpunk theme design system
- Cross-browser compatibility
- Progressive enhancement

**Example invocation**:
```javascript
assign_copilot_to_issue({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  issue_number: 126,
  custom_agent: "frontend-specialist",
  custom_instructions: "Implement responsive navigation with support for all 14 languages"
})
```

### 5. ISMS Compliance Manager (`isms-compliance-manager`)
**Expertise**: ISMS policy enforcement, ISO 27001, NIST CSF 2.0, CIS Controls, audit preparation

**Use for**:
- Compliance verification
- Gap analysis
- Documentation completeness checking
- Audit evidence collection
- Control effectiveness assessment
- Compliance reporting

**Example invocation**:
```javascript
assign_copilot_to_issue({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  issue_number: 127,
  custom_agent: "isms-compliance-manager",
  custom_instructions: "Perform compliance gap analysis and verify all required documentation exists"
})
```

### 6. Deployment Specialist (`deployment-specialist`)
**Expertise**: GitHub Pages deployment, GitHub Actions, CI/CD security, workflow optimization

**Use for**:
- GitHub Actions workflow design
- Workflow security hardening
- GitHub Pages configuration
- Deployment automation
- Performance optimization
- Monitoring and alerting

**Example invocation**:
```javascript
assign_copilot_to_issue({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  issue_number: 128,
  custom_agent: "deployment-specialist",
  custom_instructions: "Optimize CI/CD pipeline and add security hardening"
})
```

### 7. Intelligence Operative (`intelligence-operative`)
**Expertise**: Political intelligence analysis, OSINT methodologies, Swedish politics, behavioral analysis

**Use for**:
- Political data analysis and visualization dashboards
- OSINT collection from Swedish government sources
- Swedish political system analysis (Riksdag, 8 parties, electoral system)
- Voting pattern analysis and legislative monitoring
- Coalition behavior and stability assessment
- Policy impact assessment
- Risk assessment frameworks for democratic accountability
- GDPR-compliant political data processing
- Multi-language political content (14 languages)

**Data Sources via riksdag-regering-mcp**:
- **32 specialized tools** for accessing Swedish political data
- **Ledamöter (MPs)**: Information, activities, assignments
- **Riksdagsdokument (Documents)**: Motions, questions, bills
- **Anföranden (Speeches)**: Chamber debates, statements
- **Voteringar (Votes)**: Voting records, patterns
- **Regeringsdokument (Government)**: SOU reports, propositions

**Example invocation**:
```javascript
assign_copilot_to_issue({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  issue_number: 129,
  custom_agent: "intelligence-operative",
  custom_instructions: "Create voting discipline dashboard showing party cohesion metrics for 2024"
})
```

### 8. Task Agent (`task-agent`) ✨ NEW
**Expertise**: Product excellence, quality assurance, ISMS compliance, Playwright testing, issue management

**Use for**:
- Continuous product analysis (quality, UI/UX, security)
- GitHub issue creation for bugs, features, improvements
- HTML/CSS validation and link checking
- Accessibility compliance auditing (WCAG 2.1 AA)
- Security header verification
- ISMS compliance tracking (ISO/NIST/CIS)
- Playwright browser testing and visual regression
- Agent coordination and task delegation

**Key Capabilities**:
- **Quality Assessment**: HTML/CSS validation, link integrity, build health
- **UI/UX Evaluation**: WCAG 2.1 AA audits, responsive design testing, 14-language support
- **Security & ISMS**: ISO 27001 control verification, NIST CSF mapping, CIS Controls
- **Browser Testing**: Playwright automation, screenshot capture, cross-browser testing
- **Issue Management**: Well-structured GitHub issues with labels, priorities, agent assignments

**Example invocation**:
```javascript
assign_copilot_to_issue({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  issue_number: 130,
  custom_agent: "task-agent",
  custom_instructions: `
    Audit accessibility compliance for all 14 language versions.
    Create issues for any WCAG 2.1 AA violations found.
    Include Playwright screenshots as evidence.
  `
})
```

### 9. UI Enhancement Specialist (`ui-enhancement-specialist`) ✨
**Expertise**: Static HTML5/CSS3, responsive design, multi-language localization, WCAG 2.1 AA accessibility

**Use for**:
- Static HTML5/CSS3 development and optimization
- Cyberpunk theme design system implementation
- CSS-only data visualizations (charts, heat maps, progress bars)
- 14-language support with RTL layouts (Arabic, Hebrew)
- WCAG 2.1 AA accessibility compliance
- Core Web Vitals optimization (LCP, FID, CLS)
- XSS prevention and CSP enforcement
- Mobile-first responsive design (320px-1440px+)

**Key Capabilities**:
- **Design System**: Cyberpunk color palette, fluid typography with clamp(), CSS custom properties
- **Data Visualization**: CSS-only progress bars, heat maps, bar charts for political metrics
- **Accessibility**: Keyboard navigation, screen reader support, ARIA labels, color contrast 4.5:1
- **Multi-Language**: Separate HTML files for 14 languages, hreflang SEO, RTL support
- **Performance**: Lazy loading, CSS optimization, image optimization, Core Web Vitals
- **Security**: No inline scripts, CSP headers, safe external links

**Example invocation**:
```javascript
assign_copilot_to_issue({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  issue_number: 131,
  custom_agent: "ui-enhancement-specialist",
  custom_instructions: `
    Implement voting discipline dashboard using CSS-only visualizations.
    Ensure WCAG 2.1 AA compliance and responsive design.
    Support all 14 languages including RTL for Arabic and Hebrew.
  `
})
```

### 10. Data Pipeline Specialist (`data-pipeline-specialist`) ✨
**Expertise**: CIA data consumption, ETL workflows, data validation, caching strategies, pipeline automation

**Use for**:
- CIA export client design (19 visualization products)
- JSON Schema validation against CIA schemas
- Versioned caching with archival
- Automated nightly data fetch workflows (02:00 CET)
- Data freshness monitoring and alerting
- Graceful fallback to cached data
- Pipeline orchestration with GitHub Actions

**Key Capabilities**:
- **CIA Integration**: Consume 19 CIA visualization product exports (election forecasts, risk assessments, OSINT)
- **Validation**: JSON Schema validation, data quality checks, freshness monitoring
- **Caching**: Versioned cache (current + archive), fallback strategies, data integrity
- **Automation**: Scheduled GitHub Actions workflows, error recovery, monitoring

**Addresses**: Issues #18 (foundation), #19, #20 (CIA data pipeline)

**Example invocation**:
```javascript
assign_copilot_to_issue({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  issue_number: 18,
  custom_agent: "data-pipeline-specialist",
  custom_instructions: `
    Implement automated CIA data consumption pipeline:
    - Fetch 19 CIA visualization products nightly at 02:00 CET
    - Validate against CIA JSON schemas
    - Cache with version tracking and archival
    - Monitor data freshness (< 24 hours)
    - Implement graceful fallback to cached data
  `
})
```

### 11. Data Visualization Specialist (`data-visualization-specialist`) ✨
**Expertise**: Chart.js/D3.js, interactive dashboards, political data visualization, CIA intelligence displays

**Use for**:
- Chart.js patterns (bar, line, scatter charts with error bars)
- D3.js network diagrams (influence mapping, coalition networks)
- Interactive election forecasting dashboards
- Risk heat maps (45 rules × 349 MPs)
- Time series visualization (50+ years historical data)
- Performance optimization for large datasets
- Responsive, accessible chart design

**Key Capabilities**:
- **Chart.js**: Bar, line, scatter, radar charts with confidence intervals
- **D3.js**: Force-directed graphs, network diagrams, geographic maps
- **Dashboards**: Multi-panel CIA intelligence visualization (19 products)
- **Interactivity**: Tooltips, zoom, pan, drill-down, real-time updates
- **Accessibility**: WCAG 2.1 AA, keyboard navigation, screen reader support

**Addresses**: Issues #15, #16, #19, #20 (CIA visualization)

**Example invocation**:
```javascript
assign_copilot_to_issue({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  issue_number: 20,
  custom_agent: "data-visualization-specialist",
  custom_instructions: `
    Visualize CIA Election 2026 Forecasting Model:
    - Seat prediction bar charts with confidence intervals (±5 seats)
    - Coalition scenario probability charts (stacked bar)
    - Historical trend lines (50 years)
    - Interactive tooltips with methodology
    - Responsive design (320px-1440px+)
    - WCAG 2.1 AA accessibility
  `
})
```

### 12. Content Generator (`content-generator`) ✨ **NEW**
**Expertise**: Automated news generation, intelligence reports, multi-language content, template-based rendering

**Use for**:
- Automated daily news articles from CIA exports
- Weekly intelligence summaries
- Monthly risk assessment reports
- Multi-language content generation (14 languages)
- Template-based markdown/HTML rendering
- Scheduled content workflows
- SEO optimization and front matter generation

**Key Capabilities**:
- **News Generation**: Data-to-narrative transformation, inverted pyramid structure
- **Intelligence Reports**: Executive summaries, risk assessments, coalition analyses
- **Multi-Language**: 14-language support with RTL layouts (Arabic, Hebrew)
- **Automation**: GitHub Actions scheduled workflows (daily 02:00 CET)
- **Quality**: Content validation, tone consistency, factual accuracy checks

**Addresses**: Issue #17 (nightly news generation)

**Example invocation**:
```javascript
assign_copilot_to_issue({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  issue_number: 17,
  custom_agent: "content-generator",
  custom_instructions: `
    Implement nightly news generation from CIA intelligence exports:
    - Generate daily articles from 19 CIA products
    - Create election forecast updates with seat predictions
    - Generate risk assessment summaries
    - Support all 14 languages
    - Include proper YAML front matter
    - Validate content quality and factual accuracy
    - Commit to content/ directory via automated PR
  `
})
```

### 13. DevOps Engineer (`devops-engineer`) ✨ **NEW**
**Expertise**: CI/CD pipelines, GitHub Actions security, infrastructure automation, monitoring, performance optimization

**Use for**:
- GitHub Actions workflow design and optimization
- Workflow security hardening (step-security/harden-runner, SHA pinning)
- GitHub Pages configuration and optimization
- Automated data pipeline workflows
- Performance monitoring (Core Web Vitals, Lighthouse CI)
- Uptime monitoring and alerting
- Build optimization (< 2 min target)
- Secret management and environment configuration

**Key Capabilities**:
- **CI/CD**: Multi-stage pipelines, parallel jobs, caching, artifact management
- **Security**: Action SHA pinning, least privilege, egress auditing, secret scanning
- **Automation**: Scheduled workflows (cron), event-driven triggers, cross-repo coordination
- **Monitoring**: Uptime checks, build success rates, performance tracking, alerting
- **Optimization**: Build time reduction, asset optimization, CDN configuration

**Addresses**: Infrastructure automation for all agents

**Example invocation**:
```javascript
assign_copilot_to_issue({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  issue_number: 200,
  custom_agent: "devops-engineer",
  custom_instructions: `
    Optimize CI/CD pipeline for riksdagsmonitor:
    - Reduce build time from 5 min to < 2 min
    - Implement GitHub Actions caching (dependencies, build)
    - Add Lighthouse CI for performance monitoring
    - Harden all workflows (SHA pinning, step-security/harden-runner)
    - Add uptime monitoring for all 14 language versions
    - Implement automated data pipeline (nightly 02:00 CET)
  `
})
```

### 14. News Journalist (`news-journalist`) ✨ **NEW**
**Expertise**: Political journalism, editorial standards, OSINT/INTOP data-driven AI-generated political intelligence, Swedish and global politics

**Use for**:
- Political news article generation (Riksdagen, Regeringen, Myndigheter)
- Editorial quality control (OSINT/INTOP-driven editorial standards)
- Multi-language news coverage (14 languages)
- Fact-checking and source verification
- Intelligence-driven narrative reporting
- SEO-optimized Schema.org structured articles

**Key Capabilities**:
- **News Generation**: Data-driven articles from Riksdag/Regering MCP data
- **Editorial Standards**: Inverted pyramid structure, balanced reporting, attribution
- **Multi-Language**: Full translation workflow for 14 languages with RTL support
- **Quality**: Schema.org NewsArticle, FAQPage, speakable structured data
- **SEO**: Meta tags, Open Graph, Twitter Cards, hreflang tags

**Example invocation**:
```javascript
assign_copilot_to_issue({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  issue_number: 201,
  custom_agent: "news-journalist",
  custom_instructions: `
    Generate daily political news article covering:
    - Latest government propositions
    - Opposition motions
    - Committee reports
    - Support all 14 languages
    - Include Schema.org structured data
  `
})
```

## GitHub Copilot Coding Agent Features

All agents support modern GitHub Copilot coding agent features:

### Basic Assignment (Legacy)
```javascript
github-update_issue({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  issue_number: 123,
  assignees: ["copilot-swe-agent[bot]"]
})
```

### Advanced Assignment with Custom Instructions
```javascript
assign_copilot_to_issue({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  issue_number: 123,
  base_ref: "main",  // Optional: specify base branch
  custom_instructions: `
    - Follow Hack23 ISMS policies
    - Use security-by-design principles
    - Update all relevant documentation
    - Ensure WCAG 2.1 AA compliance
  `
})
```

### Direct PR Creation
```javascript
create_pull_request_with_copilot({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  title: "Security Enhancement",
  body: "Implement additional security controls",
  base_ref: "main",
  custom_agent: "security-architect"
})
```

### Job Status Tracking
```javascript
const status = get_copilot_job_status({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  job_id: "abc123-def456"
});
```

### Stacked PRs Workflow
```javascript
// PR 1: Foundation
const pr1 = create_pull_request_with_copilot({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  title: "Foundation: Security documentation",
  body: "Create security architecture docs",
  base_ref: "main"
});

// PR 2: Build on PR 1
const pr2 = create_pull_request_with_copilot({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  title: "Enhancement: Security controls",
  body: "Implement security controls from documentation",
  base_ref: pr1.branch,
  custom_agent: "security-architect"
});
```

## Agent Configuration

### Repository-Level MCP Configuration

**Important**: Repository-level agents in `.github/agents/` cannot have MCP servers configured in their YAML frontmatter. MCP servers are configured at the repository level in `.github/copilot-mcp.json` and are automatically available to all agents.

Each agent file's **YAML frontmatter** contains only:
```yaml
---
name: agent-name
description: Brief description of agent's expertise
tools: ["*"]
---
```

All 14 primary Copilot agents in this repo use `tools: ["*"]` and omit `mcp-servers:` entirely. The agent body after the frontmatter contains detailed instructions, capabilities, examples, **a standardised "Available MCP Servers" reference**, **standardised Copilot coding-agent tool snippets** (`assign_copilot_to_issue`, `create_pull_request_with_copilot`, `get_copilot_job_status`, including `base_ref` and `custom_agent`), and **a standardised "Related Hack23 ISMS Policies" block** pointing at the governance chain rooted in `Information_Security_Policy.md`. Each agent file MUST remain below the 16 KB GitHub Copilot agent size limit.

### MCP Server Configuration (Repository-Level Only)

MCP servers are configured in `.github/copilot-mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github", "--toolsets", "all", "--tools", "*"],
      "env": {
        "GITHUB_TOKEN": "${{ secrets.COPILOT_MCP_GITHUB_PERSONAL_ACCESS_TOKEN }}",
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${{ secrets.COPILOT_MCP_GITHUB_PERSONAL_ACCESS_TOKEN }}",
        "GITHUB_OWNER": "Hack23",
        "GITHUB_API_URL": "https://api.githubcopilot.com/mcp/insiders"
      },
      "tools": ["*"]
    },
    "filesystem": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/runner/work/riksdagsmonitor/riksdagsmonitor"],
      "tools": ["*"]
    },
    "git": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "/home/runner/work/riksdagsmonitor/riksdagsmonitor"],
      "tools": ["*"]
    }
  }
}
```

**Notes**:
- This configuration provides all agents with access to MCP servers
- Filesystem and git paths are environment-specific (GitHub Actions runner layout)
- ⚠️ **Security**: MCP packages are not version-pinned. Consider pinning to specific versions for supply chain security

## Skills Mapping by Agent

All agents automatically load relevant skills from `.github/skills/` based on their expertise. Here's the recommended skill mapping for each agent:

### Security Architect
**Primary Skills** (Core expertise):
- `hack23-isms-compliance` - ISMS framework enforcement
- `security-by-design` - Security architecture principles
- `static-site-security` - Static website security
- `threat-modeling` - STRIDE threat analysis
- `iso-27001-controls` - ISO 27001:2022 controls
- `nist-csf-mapping` - NIST CSF 2.0 functions
- `cis-controls` - CIS Controls v8.1
- `secure-code-review` - Security code review
- `security-documentation` - ISMS documentation

**Supporting Skills**:
- `ci-cd-security` - GitHub Actions security
- `secrets-management` - Secrets and PAT management

### Documentation Architect
**Primary Skills**:
- `documentation-standards` - Documentation guidelines
- `c4-architecture-documentation` - C4 model and Mermaid diagrams
- `security-documentation` - ISMS documentation standards

**Supporting Skills**:
- `hack23-isms-compliance` - Compliance requirements
- `threat-modeling` - Threat model documentation

### Quality Engineer
**Primary Skills**:
- `code-quality-checks` - HTML/CSS validation, link checking
- `html-accessibility` - WCAG 2.1 AA compliance
- `playwright-testing` - Browser automation and testing
- `multi-language-localization` - i18n/l10n testing

**Supporting Skills**:
- `responsive-design` - Cross-device testing
- `static-site-security` - Security validation
- `issue-management` - Bug reporting and tracking

### Frontend Specialist
**Primary Skills**:
- `responsive-design` - Mobile-first responsive design
- `html-accessibility` - WCAG 2.1 AA accessibility
- `multi-language-localization` - 14-language support
- `design-system-management` - Cyberpunk theme design system

**Supporting Skills**:
- `static-site-security` - XSS prevention, CSP
- `code-quality-checks` - HTML/CSS validation
- `political-data-visualization` - CSS-only visualizations

### ISMS Compliance Manager
**Primary Skills**:
- `hack23-isms-compliance` - ISMS framework
- `iso-27001-controls` - ISO 27001:2022 Annex A
- `nist-csf-mapping` - NIST CSF 2.0
- `cis-controls` - CIS Controls v8.1
- `security-documentation` - Documentation standards

**Supporting Skills**:
- `security-by-design` - Security principles
- `threat-modeling` - Risk assessment
- `gdpr-compliance` - Data protection

### Deployment Specialist
**Primary Skills**:
- `github-actions-workflows` - CI/CD workflow patterns
- `ci-cd-security` - Workflow security hardening
- `secrets-management` - GitHub secrets management

**Supporting Skills**:
- `static-site-security` - Deployment security
- `code-quality-checks` - Quality gates
- `hack23-isms-compliance` - Compliance requirements

### Intelligence Operative
**Primary Skills**:
- `riksdag-regering-mcp` - 32 political data tools
- `political-science-analysis` - Political frameworks
- `osint-methodologies` - OSINT collection
- `intelligence-analysis-techniques` - ACH, SWOT, Red Team
- `swedish-political-system` - Riksdag structure
- `electoral-analysis` - Election forecasting
- `behavioral-analysis` - Political psychology
- `legislative-monitoring` - Voting patterns
- `strategic-communication-analysis` - Narrative analysis
- `risk-assessment-frameworks` - Risk indicators
- `data-science-for-intelligence` - Statistical analysis

**Supporting Skills**:
- `gdpr-compliance` - Political data GDPR
- `political-data-visualization` - CSS-only dashboards
- `multi-language-localization` - 14-language content

### Task Agent
**Primary Skills**:
- `issue-management` - GitHub issue creation
- `playwright-testing` - Browser automation and testing
- `code-quality-checks` - HTML/CSS/link validation
- `html-accessibility` - WCAG 2.1 AA audits
- `hack23-isms-compliance` - ISMS verification

**Supporting Skills**:
- All skills (task agent coordinates across domains)

### UI Enhancement Specialist
**Primary Skills**:
- `responsive-design` - Mobile-first design
- `design-system-management` - Cyberpunk theme
- `political-data-visualization` - CSS-only charts
- `html-accessibility` - WCAG 2.1 AA
- `multi-language-localization` - 14-language support

**Supporting Skills**:
- `static-site-security` - XSS, CSP enforcement
- `code-quality-checks` - Validation and testing
- `playwright-testing` - Visual regression

### Data Pipeline Specialist ✨ **NEW**
**Primary Skills**:
- `cia-data-integration` - CIA export consumption, JSON Schema validation
- `data-pipeline-engineering` - ETL workflows, automated scheduling
- `api-integration` - REST/GraphQL clients, rate limiting
- `github-actions-workflows` - Automated pipeline workflows

**Supporting Skills**:
- `performance-optimization` - Data processing optimization
- `code-quality-checks` - Data validation checks
- `secrets-management` - API keys and credentials

### Data Visualization Specialist ✨ **NEW**
**Primary Skills**:
- `advanced-data-visualization` - Chart.js/D3.js, interactive dashboards
- `political-data-visualization` - Political metrics visualization
- `responsive-design` - Responsive chart layouts
- `html-accessibility` - WCAG 2.1 AA chart accessibility
- `performance-optimization` - Large dataset optimization

**Supporting Skills**:
- `cia-data-integration` - CIA data consumption
- `multi-language-localization` - 14-language chart labels
- `code-quality-checks` - Chart validation

### Content Generator ✨ **NEW**
**Primary Skills**:
- `automated-content-generation` - Template-based content generation
- `multi-language-localization` - 14-language content
- `html-accessibility` - Accessible article structure
- `github-actions-workflows` - Scheduled content generation

**Supporting Skills**:
- `cia-data-integration` - CIA data consumption for articles
- `political-science-analysis` - Content validation
- `responsive-design` - Article layout
- `static-site-security` - Content security

### DevOps Engineer ✨ **NEW**
**Primary Skills**:
- `github-actions-workflows` - CI/CD pipeline design
- `ci-cd-security` - Workflow security hardening
- `secrets-management` - GitHub secrets, PATs
- `performance-optimization` - Build and runtime optimization

**Supporting Skills**:
- `static-site-security` - Infrastructure security
- `code-quality-checks` - Automated quality gates
- `hack23-isms-compliance` - Compliance requirements
- `threat-modeling` - Security architecture

### News Journalist ✨ **NEW**
**Primary Skills**:
- `editorial-standards` - Journalism quality standards
- `automated-content-generation` - Template-based article generation
- `multi-language-localization` - 14-language content
- `seo-optimization` - Schema.org, meta tags, structured data
- `riksdag-regering-mcp` - Swedish political data tools

**Supporting Skills**:
- `political-science-analysis` - Political context
- `html-accessibility` - Accessible article structure
- `responsive-design` - Article layout
- `language-expertise` - Translation quality

---

## Best Practices

### 1. Choose the Right Agent
Select the agent that best matches your task:
- **Security tasks** → Security Architect
- **Documentation** → Documentation Architect
- **Quality/Testing** → Quality Engineer
- **UI/Frontend** → Frontend Specialist
- **Compliance** → ISMS Compliance Manager
- **CI/CD** → Deployment Specialist
- **Political news** → News Journalist

### 2. Provide Clear Instructions
Use `custom_instructions` to give specific guidance:
```javascript
custom_instructions: `
  - Follow existing patterns in src/
  - Include unit tests with 80%+ coverage
  - Update relevant documentation
  - Ensure security best practices
`
```

### 3. Leverage Skills
Agents automatically load relevant skills from `.github/skills/` (91 total skills across 12 categories):

**Core Infrastructure (9)**:
- `hack23-isms-compliance`, `security-by-design`, `static-site-security`
- `ci-cd-security`, `documentation-standards`, `html-accessibility`
- `multi-language-localization`, `hack23-future-architecture-standards`, `documentation-portfolio`

**Political Intelligence (11)**:
- `political-science-analysis`, `osint-methodologies`, `intelligence-analysis-techniques`
- `swedish-political-system`, `electoral-analysis`, `behavioral-analysis`
- `strategic-communication-analysis`, `legislative-monitoring`
- `risk-assessment-frameworks`, `data-science-for-intelligence`, `gdpr-compliance`

**ISMS & Security (12)**:
- `cis-controls`, `iso-27001-controls`, `nist-csf-mapping`
- `threat-modeling`, `secure-code-review`, `security-documentation`
- `incident-response`, `input-validation`, `vulnerability-management`
- `data-protection`, `ai-governance`, `information-security-strategy`

**Development & Operations (16)**:
- `c4-architecture-documentation`, `github-actions-workflows`, `code-quality-checks`, `secrets-management`
- `data-pipeline-engineering`, `automated-content-generation`, `performance-optimization`, `api-integration`
- `github-agentic-workflows`, `code-review-practices`, `testing-strategy`, `contribution-guidelines`
- `change-management`, `open-source-governance`, `copilot-agent-patterns`, `product-management-patterns`

**UI/UX & Design (7)**:
- `responsive-design`, `design-system-management`, `political-data-visualization`
- `advanced-data-visualization`, `ui-ux-design`, `seo-optimization`, `data-visualization-principles`

**Testing & Quality Assurance (2)**:
- `playwright-testing`, `issue-management`

**Data Integration (4)**:
- `riksdag-regering-mcp`, `cia-data-integration`, `mcp-server-development`, `european-parliament-api`

**Business & Marketing (2)**:
- `marketing`, `business-development`

**Language & Localization (1)**:
- `language-expertise`

**GitHub Agentic Workflows (12)**:
- `gh-aw-authentication-credentials`, `gh-aw-containerization`, `gh-aw-continuous-ai-patterns`
- `gh-aw-firewall`, `gh-aw-github-actions-integration`, `gh-aw-logging-monitoring`
- `gh-aw-mcp-configuration`, `gh-aw-mcp-gateway`, `gh-aw-safe-outputs`
- `gh-aw-security-architecture`, `gh-aw-tools-ecosystem`, `gh-aw-workflow-authoring`

**Journalism & Media (4)**:
- `editorial-standards`, `investigative-journalism`, `prospective-news-coverage`, `comparative-politics-reporting`

**Government & Regulatory (7)**:
- `global-government-analysis`, `myndigheter-monitoring`, `regulatory-affairs`
- `economic-policy-analysis`, `secure-development-lifecycle`, `secure-development-policy`, `compliance-checklist`

See [SKILLS.md](SKILLS.md) for comprehensive skill documentation and [Skills Mapping](#skills-mapping-by-agent) above for agent-specific recommendations.

### 4. Use Feature Branches
Specify `base_ref` for feature branch workflows:
```javascript
base_ref: "feature/security-enhancements"
```

### 5. Monitor Progress
Track job status for long-running tasks:
```javascript
get_copilot_job_status({
  owner: "Hack23",
  repo: "riksdagsmonitor",
  job_id: "job-id-from-assignment"
})
```

## Agent Standards

All agents follow these standards:

### Security
- ✅ Follow Hack23 Secure Development Policy
- ✅ Implement security-by-design principles
- ✅ Update security documentation when making changes
- ✅ Never introduce security vulnerabilities
- ✅ Use least privilege access controls

### Documentation
- ✅ Update relevant documentation
- ✅ Use C4 model for architecture diagrams
- ✅ Create Mermaid diagrams for complex concepts
- ✅ Follow Hack23 documentation standards
- ✅ Include document control metadata

### Quality
- ✅ Validate HTML with HTMLHint
- ✅ Check links with linkinator
- ✅ Ensure WCAG 2.1 AA accessibility
- ✅ Test responsive design
- ✅ Verify cross-browser compatibility

### Compliance
- ✅ Map to ISO 27001/NIST CSF/CIS Controls
- ✅ Ensure all required docs exist
- ✅ Follow ISMS policies
- ✅ Maintain audit evidence
- ✅ Document compliance gaps

## Troubleshooting

### Agent Not Available
- Verify agent file exists in `.github/agents/`
- Check YAML frontmatter is valid
- Ensure agent name matches file name

### Task Not Completing
- Check job status with `get_copilot_job_status`
- Review workflow logs
- Verify custom instructions are clear
- Check if blocked by required reviews

### Unexpected Results
- Refine `custom_instructions`
- Specify `base_ref` if working on feature branch
- Try different agent if task doesn't match expertise
- Provide more context in issue description

## Related Documentation

- [SKILLS.md](SKILLS.md) - Agent skills reference
- [README.md](README.md) - Project overview
- [Hack23 ISMS-PUBLIC](https://github.com/Hack23/ISMS-PUBLIC) - ISMS policies
- [GitHub Copilot Agents](https://docs.github.com/en/copilot/concepts/agents) - Official docs

---

**Last Updated**: 2026-02-20  
**Maintained by**: Hack23 AB


---

## 🌐 IMF as Primary Economic-Data Canon (Cross-Agent Rule)

> **Effective:** 2026-04-24 · **Owner:** CEO · **Authority:** [`.github/aw/ECONOMIC_DATA_CONTRACT.md`](.github/aw/ECONOMIC_DATA_CONTRACT.md) v2.1

**Every persona agent that produces, validates, or visualises economic data MUST default to IMF as the primary economic-data source.** This rule supersedes any earlier WB-centric guidance in individual agent files.

### Authoritative IMF hub for agents

[`analysis/imf/README.md`](analysis/imf/README.md) · [`analysis/imf/agentic-integration.md`](analysis/imf/agentic-integration.md) · [`analysis/imf/indicators-inventory.json`](analysis/imf/indicators-inventory.json) · [`analysis/imf/data-dictionary.md`](analysis/imf/data-dictionary.md) · [`.github/aw/ECONOMIC_DATA_CONTRACT.md`](.github/aw/ECONOMIC_DATA_CONTRACT.md)

### Agent-by-agent IMF responsibility

| Agent | IMF responsibility | Primary IMF dataflow |
|---|---|---|
| `intelligence-operative` | Cite IMF projections in scenario analysis (T+5); cross-validate IMF SWE vs SCB | WEO + FM + GFS_COFOG |
| `news-journalist` | Lead every economic claim with IMF citation; emit `economicProvenance.provider: imf` | WEO + FM + IFS + DOTS |
| `content-generator` | Render IMF dashboards in automated daily articles; vintage-aware | WEO + FM + IFS |
| `data-pipeline-specialist` | Own `scripts/imf-context.ts`, `imf-fetch.ts`, `imf-client.ts`, `imf-codes.ts`; vintage cache | All IMF dataflows |
| `data-visualization-specialist` | IMF dataflow registry as single source of truth for chart axes; vintage badge (yellow >3mo, red >6mo) | WEO + FM + ER + PCPS |
| `security-architect` | IMF egress allow-list (`www.imf.org`, `sdmxcentral.imf.org`); SHA-256 payload pin; vintage discipline | (security control surface) |
| `isms-compliance-manager` | IMF data classification: PUBLIC / no PII / GDPR DPIA short-circuit | (compliance evidence) |
| `documentation-architect` | IMF as first-class C4 container in ARCHITECTURE.md; mirror IMF sequence diagram from `agentic-integration.md` | (architectural surface) |
| `quality-engineer` | `tests/imf-context.test.ts`, `tests/imf-inventory.test.ts`, `tests/imf-precedence-contract.test.ts` | (test surface) |
| `devops-engineer` | IMF CLI smoke check in `mcp-setup.sh`; IMF host in `copilot-setup-steps.yml` allow-list | (operational surface) |
| `deployment-specialist` | IMF egress allow-list in CDN / WAF config | (deployment surface) |
| `frontend-specialist` | IMF data renders in dashboard HTML/CSS with vintage badge | (UI surface) |
| `ui-enhancement-specialist` | CSS-only IMF data visualisations (forecast cones for WEO projections) | (UI surface) |
| `task-agent` | IMF coverage in product analysis matrix; create issues for IMF gaps | (PM surface) |

**Canonical rule.** Every economic claim in a Riksdagsmonitor article cites an IMF dataflow first; World Bank citations are reserved for governance, environment and social residue (the classes IMF does not publish). SCB is the Swedish-specific ground truth layer. See `ECONOMIC_DATA_CONTRACT.md` v2.1 for the banned-phrase list and vintage discipline (>6 mo → annotation).

---

## 🔗 Hack23 Ecosystem

<table>
<tr>
  <th width="33%">🌐 Platforms</th>
  <th width="33%">📦 Open-Source Projects</th>
  <th width="33%">🛡️ Governance &amp; Standards</th>
</tr>
<tr>
<td valign="top">
🗳️ <a href="https://riksdagsmonitor.com">Riksdagsmonitor</a> — Swedish Parliament intelligence<br>
🇪🇺 <a href="https://www.euparliamentmonitor.com">EU Parliament Monitor</a> — European coverage<br>
🕵️ <a href="https://www.hack23.com/cia">Citizen Intelligence Agency</a> — political-data engine<br>
🌐 <a href="https://www.hack23.com">Hack23 AB</a> — corporate site<br>
📰 <a href="https://hack23.com/blog.html">Hack23 Blog</a> — engineering &amp; policy<br>
💼 <a href="https://www.linkedin.com/company/hack23/">Hack23 on LinkedIn</a>
</td>
<td valign="top">
🗳️ <a href="https://github.com/Hack23/riksdagsmonitor">Hack23/riksdagsmonitor</a><br>
🕵️ <a href="https://github.com/Hack23/cia">Hack23/cia</a><br>
🇪🇺 <a href="https://github.com/Hack23/euparliamentmonitor">Hack23/euparliamentmonitor</a><br>
🔌 <a href="https://github.com/Hack23/european-parliament-mcp">Hack23/european-parliament-mcp</a><br>
✅ <a href="https://github.com/Hack23/cia-compliance-manager">Hack23/cia-compliance-manager</a><br>
🥋 <a href="https://github.com/Hack23/black-trigram">Hack23/black-trigram</a><br>
🏠 <a href="https://github.com/Hack23/homepage">Hack23/homepage</a>
</td>
<td valign="top">
🛡️ <a href="https://github.com/Hack23/ISMS-PUBLIC">Hack23 ISMS-PUBLIC</a> — public ISMS<br>
🔒 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md">Information Security Policy</a><br>
🤖 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/AI_Policy.md">AI Policy</a><br>
🧪 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md">Secure Development Policy</a><br>
🎯 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md">Threat Modeling Policy</a><br>
⚠️ <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md">Vulnerability Management</a><br>
🏷️ <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md">Classification Framework</a>
</td>
</tr>
</table>

<p align="center">
<a href="https://www.bestpractices.dev/projects/12069"><img src="https://www.bestpractices.dev/projects/12069/badge" alt="OpenSSF Best Practices"/></a>
<a href="https://scorecard.dev/viewer/?uri=github.com/Hack23/riksdagsmonitor"><img src="https://api.securityscorecards.dev/projects/github.com/Hack23/riksdagsmonitor/badge" alt="OpenSSF Scorecard"/></a>
<a href="https://github.com/Hack23/ISMS-PUBLIC"><img src="https://img.shields.io/badge/ISO_27001-2022-blue?style=flat-square&logo=iso&logoColor=white" alt="ISO 27001:2022"/></a>
<a href="https://github.com/Hack23/ISMS-PUBLIC"><img src="https://img.shields.io/badge/NIST_CSF-2.0-green?style=flat-square&logo=nist&logoColor=white" alt="NIST CSF 2.0"/></a>
<a href="https://github.com/Hack23/ISMS-PUBLIC"><img src="https://img.shields.io/badge/CIS_Controls-v8.1-orange?style=flat-square&logo=cisecurity&logoColor=white" alt="CIS Controls v8.1"/></a>
<a href="https://www.apache.org/licenses/LICENSE-2.0"><img src="https://img.shields.io/badge/License-Apache_2.0-blue?style=flat-square" alt="Apache 2.0"/></a>
</p>

<p align="center"><em>🗳️ Empower citizens · 🔍 Strengthen democratic accountability · 🕵️ Illuminate the political process</em></p>

<p align="center"><sub>© 2008–2026 <a href="https://www.hack23.com">Hack23 AB</a> (Org.nr 559534-7807) · Maintainer: <a href="https://www.linkedin.com/in/jamessorling/">James Pether Sörling, CISSP CISM</a></sub></p>
