# Riksdagsmonitor Copilot Instructions

## 📋 Repository Context

**Project**: Riksdagsmonitor — Swedish Parliament (Riksdag) monitoring platform
**Stack**: HTML5, CSS3, TypeScript 6.0.3, Vite 8.0.10, Vitest 4.1.5, Cypress 15.14.1
**Runtime**: Node.js 26, ES2025 target, ESNext modules
**Deploy**: GitHub Pages + AWS S3 dual deployment
**Languages**: 14-language support (EN, SV, DA, NB, FI, DE, FR, ES, NL, AR, HE, JA, KO, ZH)
**Security**: ISO 27001:2022, NIST CSF 2.0, CIS Controls v8.1 compliant
**Organization**: Hack23 AB
**ISMS**: [Hack23 ISMS-PUBLIC](https://github.com/Hack23/ISMS-PUBLIC)
**Version**: 0.8.56
**Agents**: 24 agent files (14 persona + 9 workflow-specialist + 1 developer-instructions) in `.github/agents/`
**Skills**: 91 skills in `.github/skills/` (including 13 gh-aw skills)
**Workflows**: 50 workflow files (22 standard `.yml` + 14 agentic `.md` sources + 14 compiled `.lock.yml`)
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
- 91 skills auto-load from `.github/skills/`

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

### 🔐 Applicable Hack23 ISMS Policies (always consult)

Authority flows from the **master** [Information_Security_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md) which defines ISMS scope, roles (CEO/CISO/DPO/Security Champions), risk management, continuous improvement, and accountability. All other policies derive authority from it:

| Lifecycle Stage | Primary Policies |
|-----------------|------------------|
| Planning & classification | [CLASSIFICATION.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md), [Threat_Modeling.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md), [AI_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/AI_Policy.md) |
| Secure SDLC | [Secure_Development_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md), [Open_Source_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Open_Source_Policy.md) |
| Operational controls | [Access_Control_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Access_Control_Policy.md), [Cryptography_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Cryptography_Policy.md), [Change_Management.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Change_Management.md) |
| Vulnerability & incidents | [Vulnerability_Management.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md) (SLAs: Crit 24h / High 7d / Med 30d / Low 90d), [Incident_Response_Plan.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Incident_Response_Plan.md) |
| Measurement | [Security_Metrics.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Security_Metrics.md), [STYLE_GUIDE.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/STYLE_GUIDE.md) |

**Mandatory checks before committing code:**
- Classification impact — does this change the CIA triad / RTO / RPO rating? Update `CLASSIFICATION.md` if yes.
- Threat surface — new inputs, dependencies, or trust boundaries? Update `THREAT_MODEL.md` per `Threat_Modeling.md`.
- Open-source compliance — new dependency licences approved per `Open_Source_Policy.md`? SBOM updated?
- Vulnerabilities — CodeQL and Dependabot clean? Critical/High must be remediated within SLA.
- Change type — Normal / Standard / Emergency per `Change_Management.md`; CEO approval required for Normal changes to `.github/agents/*`, `.github/copilot-mcp*.json`, and `copilot-setup-steps.yml`.
- AI attribution — AI-assisted code requires human review and DCO sign-off per `AI_Policy.md`.

Map every security-relevant control to **ISO 27001:2022 Annex A**, **NIST CSF 2.0**, **CIS Controls v8.1**, **GDPR**, **NIS2**, **EU CRA**.

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

This repo uses [GitHub Agentic Workflows](https://github.github.com/gh-aw/) (gh-aw **v0.74.3**, pinned via `github/gh-aw-actions/setup@v0.74.3`; MCP Gateway image `ghcr.io/github/gh-aw-mcpg:v0.3.9`) for AI-powered news generation. 14 agentic workflows in `.github/workflows/` produce daily political intelligence articles with five-layer security:

1. **Read-only tokens** — Agent gets only read permissions
2. **Zero secrets in agent** — Write tokens isolated in separate jobs
3. **Containerized + firewall** — Squid proxy domain allowlists, iptables
4. **Safe outputs** — Structured artifacts with hard limits and validation
5. **Threat detection** — AI scan blocks prompt injection and malicious code

### Authoritative contract & analysis-artifact product

The full workflow contract is split into bounded-context prompt modules under [`.github/prompts/`](prompts/) — see [`.github/prompts/README.md`](prompts/README.md) for the module catalogue. Every agent, skill, and workflow author must treat that directory as the **single source of truth** for how news workflows run.

- **Analysis product** (the "deep political analysis" that must precede every article): authored per [`analysis/methodologies/ai-driven-analysis-guide.md`](../analysis/methodologies/ai-driven-analysis-guide.md) using the templates in [`analysis/templates/`](../analysis/templates/).
- **Hard rule**: every news workflow MUST produce all **23 always-on artifacts** (Family A Core Synthesis 9 + Family B Structural Metadata 2 + Family C Strategic Extensions 5 + Family D Electoral & Domain Lenses 7) plus Family E per-document `documents/{dok_id}-analysis.md`, in `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/`, before any article sentence is written. Tier-C aggregation workflows produce the **same 23 artifacts** with period-scope multipliers and cross-type sibling-folder citations — no extra files (see [`ext/tier-c-aggregation.md`](prompts/ext/tier-c-aggregation.md)). [`.github/prompts/05-analysis-gate.md`](prompts/05-analysis-gate.md) is the single blocking gate; see [`.github/prompts/04-analysis-pipeline.md`](prompts/04-analysis-pipeline.md) for the full artifact catalogue.
- **AI-FIRST**: minimum 2 complete iterations (Pass 1 creates, Pass 2 reads back and improves) — see §"5. 🔴 AI FIRST Quality Principle" above.
- **Upstream gh-aw documentation**: [abridged (llms-small.txt)](https://github.github.com/gh-aw/llms-small.txt) · [complete (llms-full.txt)](https://github.github.com/gh-aw/llms-full.txt) · [agentic-workflows blog series](https://github.github.com/gh-aw/_llms-txt/agentic-workflows.txt) · [source repo](https://github.com/github/gh-aw) · [v0.74.3 release notes](https://github.com/github/gh-aw/releases/tag/v0.74.3) · [GitHub CLI manual](https://cli.github.com/manual/).

### Agentic Workflow Schedule
- **Morning**: Propositions, committee reports, motions, interpellations
- **Midday**: Month-ahead, week-ahead forecasting
- **Evening**: Evening analysis, realtime monitoring
- **Weekly/Monthly**: Reviews, translations across 14 languages
- **Job budget**: All news workflows declare `timeout-minutes: 60`. Target completing all agent-phase work by **agent minute 40** (AI-FIRST iteration), call `safeoutputs___create_pull_request` by **agent minute 42** (hard deadline **45**) to reserve job-level headroom for setup and safe outputs.

### Runtime Configuration (All Workflows)
All agentic workflows MUST include the `runtimes:` field to enforce Node.js 26:
```yaml
runtimes:
  node:
    version: "26"
```

### Engine Configuration (All Workflows)
The 13 analysis/article-generating news workflows declare the Opus-class reasoning model; the high-volume `news-translate` fan-out keeps the faster Sonnet-class model:
```yaml
engine:
  id: copilot
  model: claude-opus-4.8          # Content/analysis workflows — strongest reasoning for the 23-artifact pipeline
  # news-translate.md keeps:  model: claude-sonnet-4.6  — faster throughput for high-volume translation fan-out
  # Note: engine.mcp.session-timeout was removed in the v0.71.3 era due to MCP Gateway v0.3.1 rejecting it; the v0.74.3 lock files now run MCP Gateway v0.3.9 — re-test before re-enabling.
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
    container: "node:26-alpine"
    entrypoint: "npx"
    entrypointArgs: ["-y", "@jarib/pxweb-mcp@2.0.0", "--url", "https://api.scb.se/OV0104/v2beta"]
    allowed: ["*"]
  world-bank:              # World Bank data (container)
    container: "node:26-alpine"
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
    - api.imf.org                      # IMF SDMX 3.0 REST (PRIMARY economic — IFS/BOP/DOTS/GFS/PCPS/ER/MFS)
    - data.imf.org                     # IMF data portal
    - www.imf.org                      # IMF Datamapper REST (PRIMARY economic — WEO/FM)
    - api.worldbank.org                # World Bank API (governance/environment residue ONLY — never economic; use IMF)
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
- **Economic data: IMF** — Macro/fiscal/monetary/external/trade/commodity/FX context uses IMF (WEO, FM, IFS, BOP, DOTS, GFS_COFOG, PCPS, ER, MFS_IR). SCB is Swedish-specific ground truth. World Bank is reserved for non-economic residue (WGI governance `source=75`, environment, social/education participation, defence historicals, crime). Hub: [`analysis/imf/`](../analysis/imf/) · contract: [`.github/aw/ECONOMIC_DATA_CONTRACT.md`](aw/ECONOMIC_DATA_CONTRACT.md) v3.0. Vintage discipline (>6 mo → annotation) enforced.

## 🌐 IMF Quick Reference (Economic Data Canonical Pattern)

**When to call IMF (always, before WB):**

```bash
# Macro / fiscal / monetary / external — canonical subcommands
tsx scripts/imf-fetch.ts weo --country SWE --indicator NGDP_RPCH --years 5
tsx scripts/imf-fetch.ts compare --indicator GGXWDG_NGDP --countries SWE,DNK,NOR,FIN,DEU
tsx scripts/imf-fetch.ts sdmx --path "/data/IMF.STA,CPI,5.0.0/SWE.CPI._T.IX.M?startPeriod=2024-01" --indicator _T.IX --country SWE
tsx scripts/imf-fetch.ts sdmx --path "/data/IMF.STA,IMTS,1.0.0/SWE.XG_FOB_USD.USA.A?startPeriod=2023" --indicator XG_FOB_USD --country SWE
tsx scripts/imf-fetch.ts sdmx --path "/data/IMF.STA,GFS_COFOG,11.0.0/SWE.S13.G2MF.GF02_T.POGDP_PT.A?startPeriod=2020" --indicator GF02_T --country SWE  # COFOG 02 Defence (FöU); use canonical GF02_T / GF07_T / GF09_T / GF10_T (the legacy G02 / G07 / G09 / G10 codes were retired in the 2026-05 refactor)
tsx scripts/imf-fetch.ts list-indicators
```

**Provider decision (memorise this):**

| Need | Use |
|---|---|
| GDP, growth, unemployment, inflation, fiscal balance, debt, current account, trade flows, commodity prices, exchange rates, gov spending by function | **IMF** |
| Governance (CC.EST, RL.EST, VA.EST, GE.EST, RQ.EST, PV.EST), environment, social/education residue, defence depth | **World Bank** |
| Swedish monthly labour, regional, budget execution | **SCB** |
| Parliamentary docs, votes, MPs, speeches | **Riksdag MCP** |

**Output discipline:** every economic claim in an article emits an `economicProvenance` block (provider, dataflow, indicator, vintage, retrieved_at). The provenance `provider` field for economic context is `imf` (or `scb` for Swedish-specific ground truth).

**Authentication (SDMX only):** every `sdmx` subcommand (IFS / BOP / DOTS / GFS_COFOG / MFS_IR / PCPS / ER) requires the `IMF_SDMX_SUBSCRIPTION_KEY` env var (Azure APIM `Ocp-Apim-Subscription-Key` header). All 14 `news-*.md` workflows forward `secrets.IMF_SDMX_SUBSCRIPTION_KEY` (primary, required) to the `news-prewarm` composite action, which exports it to `$GITHUB_ENV` so the agent's `bash:` tool inherits it via `awf --env-all`. `IMF_SDMX_SUBSCRIPTION_KEY_SECONDARY` is the optional rotation key — stored only, not consumed by code (see [`analysis/imf/agentic-integration.md`](../analysis/imf/agentic-integration.md) §"Pre-warm gate" → "Key rotation"). The `weo` and `compare` subcommands target the unauthenticated Datamapper transport and need no key.

---

**Last Updated**: 2026-05-10
**Version**: 3.9 — IMF SDMX subscription key wired through every `news-*.md` workflow (`IMF_SDMX_SUBSCRIPTION_KEY` primary required, `IMF_SDMX_SUBSCRIPTION_KEY_SECONDARY` rotation hot spare). ECONOMIC_DATA_CONTRACT bumped to v3.1.
