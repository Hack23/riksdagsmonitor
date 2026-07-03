# 🎯 `.github/skills/` — Copilot Skill Library

This directory contains **91 skill packages** that teach GitHub Copilot *how* to approach specific domains when working in Riksdagsmonitor. Skills are **strategic**, reusable, rule-based instruction sets — not step-by-step runbooks. They load automatically when a Copilot agent determines a task touches the relevant domain.

> **Canonical long-form skill catalog with detailed mappings:** see [`SKILLS.md`](../../SKILLS.md) at the repository root.
> **Agent → skill recommendations:** see [`AGENTS.md`](../../AGENTS.md) §"Skills Mapping by Agent" and [`.github/agents/README.md`](../agents/README.md).

---

## 🧠 How skills work

Each skill is a directory containing a `SKILL.md` file (and optional supporting assets). When Copilot begins a task, skills are matched against the request. If relevant, they are loaded into the agent's context alongside the persona and repository-wide `copilot-instructions.md`.

| Property | Value |
|----------|-------|
| **Scope** | Repository-local (`.github/skills/`) + implicit project-level skills listed in `copilot-instructions.md` `<available_skills>` |
| **Invocation** | Automatic (when relevant) or explicit via `skill` tool |
| **Governance** | CEO approval for material changes per [Change_Management.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Change_Management.md) |
| **Attribution** | AI-assisted edits require human review + DCO sign-off per [AI_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/AI_Policy.md) |

---

## 📚 Skill catalog (91 skills)

Skills are grouped into **12 functional categories** that mirror the Riksdagsmonitor capability areas. Each row links to the skill's `SKILL.md`.

### 🛡️ Core Infrastructure & Governance (9)

| Skill | Purpose |
|-------|---------|
| [hack23-isms-compliance](hack23-isms-compliance/) | Strategic ISMS compliance enforcement across repositories |
| [security-by-design](security-by-design/) | Security architecture principles from requirement to delivery |
| [static-site-security](static-site-security/) | Hardening static HTML/CSS sites hosted on GitHub Pages |
| [ci-cd-security](ci-cd-security/) | Security for GitHub Actions, supply chain, and pipelines |
| [documentation-standards](documentation-standards/) | Hack23 technical writing standards and Mermaid conventions |
| [documentation-portfolio](documentation-portfolio/) | Required C4 / data / SWOT / threat-model docs for every repo |
| [hack23-future-architecture-standards](hack23-future-architecture-standards/) | Rules for the future-state document portfolio |
| [html-accessibility](html-accessibility/) | WCAG 2.1 AA compliance for static sites |
| [multi-language-localization](multi-language-localization/) | 14-language support with RTL (Arabic, Hebrew) and hreflang |

### 🕵️ Political Intelligence (11)

| Skill | Purpose |
|-------|---------|
| [political-science-analysis](political-science-analysis/) | Comparative politics, policy analysis, frameworks |
| [osint-methodologies](osint-methodologies/) | Open-source intelligence collection and verification |
| [intelligence-analysis-techniques](intelligence-analysis-techniques/) | ACH, SWOT, Devil's Advocate, Red Team, key assumptions check |
| [swedish-political-system](swedish-political-system/) | Riksdag structure, 8 parties, electoral system, coalition dynamics |
| [electoral-analysis](electoral-analysis/) | Election forecasting, coalition prediction, voter behaviour |
| [behavioral-analysis](behavioral-analysis/) | Political psychology, cognitive biases, leadership analysis |
| [strategic-communication-analysis](strategic-communication-analysis/) | Narrative analysis, media monitoring, messaging detection |
| [legislative-monitoring](legislative-monitoring/) | Voting patterns, committee effectiveness, bill tracking |
| [risk-assessment-frameworks](risk-assessment-frameworks/) | Political risk and corruption-indicator taxonomies |
| [data-science-for-intelligence](data-science-for-intelligence/) | Statistics, ML, NLP, time series, network analysis |
| [gdpr-compliance](gdpr-compliance/) | GDPR for political-data processing and public-official data |

### 🔐 ISMS & Security (14)

| Skill | Purpose |
|-------|---------|
| [iso-27001-controls](iso-27001-controls/) | ISO 27001:2022 Annex A controls for static sites |
| [nist-csf-mapping](nist-csf-mapping/) | NIST CSF 2.0 function / category / subcategory mapping |
| [cis-controls](cis-controls/) | CIS Controls v8.1 implementation for static sites |
| [threat-modeling](threat-modeling/) | STRIDE, MITRE ATT&CK, attack-tree methodology |
| [secure-code-review](secure-code-review/) | HTML / CSS / JS / TS security-focused review |
| [security-documentation](security-documentation/) | ISMS documentation standards |
| [incident-response](incident-response/) | NIST + ISO 27001 incident-response lifecycle |
| [input-validation](input-validation/) | XSS/injection prevention, safe output encoding |
| [vulnerability-management](vulnerability-management/) | SLA-driven remediation (Critical 24h / High 7d / Med 30d / Low 90d) |
| [data-protection](data-protection/) | Classification, privacy-by-design, encryption |
| [ai-governance](ai-governance/) | EU AI Act, OWASP LLM security, responsible AI |
| [information-security-strategy](information-security-strategy/) | Program-level security strategy and risk management |
| [compliance-checklist](compliance-checklist/) | Unified mapping across ISO/NIST/CIS/GDPR/NIS2/EU CRA/SOC 2/PCI DSS/HIPAA |
| [secrets-management](secrets-management/) | GitHub secrets, PATs, OIDC, token rotation |

### ⚙️ Development & Operations (14)

| Skill | Purpose |
|-------|---------|
| [c4-architecture-documentation](c4-architecture-documentation/) | C4 (Context/Container/Component) + Mermaid diagrams |
| [github-actions-workflows](github-actions-workflows/) | Workflow patterns, reusable workflows, caching |
| [code-quality-checks](code-quality-checks/) | HTMLHint, linkinator, ESLint, JSON validation |
| [code-review-practices](code-review-practices/) | Review quality gates and constructive feedback |
| [testing-strategy](testing-strategy/) | Unit / integration / E2E strategy (Vitest + Cypress) |
| [performance-optimization](performance-optimization/) | Core Web Vitals, bundle size, caching |
| [api-integration](api-integration/) | REST / GraphQL clients, rate limiting, auth |
| [data-pipeline-engineering](data-pipeline-engineering/) | ETL, scheduling, versioned caching, freshness monitoring |
| [change-management](change-management/) | ITIL-aligned change flow (Normal/Standard/Emergency) |
| [contribution-guidelines](contribution-guidelines/) | PR workflows, DCO/CLA, community engagement |
| [open-source-governance](open-source-governance/) | OSS licensing, SBOM, supply-chain posture |
| [secure-development-policy](secure-development-policy/) | Hack23 Secure Development Policy enforcement |
| [secure-development-lifecycle](secure-development-lifecycle/) | SDL phases from requirement to retirement |
| [product-management-patterns](product-management-patterns/) | Roadmapping, issue hygiene, prioritization |

### 🧪 Testing & Quality Assurance (2)

| Skill | Purpose |
|-------|---------|
| [playwright-testing](playwright-testing/) | Playwright automation, visual regression, a11y audits |
| [issue-management](issue-management/) | GitHub issue creation, labeling, milestones |

### 🎨 UI/UX & Design (8)

| Skill | Purpose |
|-------|---------|
| [responsive-design](responsive-design/) | Mobile-first CSS Grid/Flexbox, 320-1440px breakpoints |
| [design-system-management](design-system-management/) | Cyberpunk theme, CSS custom properties, component library |
| [political-data-visualization](political-data-visualization/) | CSS-only charts, heat maps, dashboards |
| [advanced-data-visualization](advanced-data-visualization/) | Chart.js / D3.js interactive dashboards |
| [data-visualization-principles](data-visualization-principles/) | Chart selection, colour theory, storytelling |
| [ui-ux-design](ui-ux-design/) | UX heuristics, information architecture |
| [seo-optimization](seo-optimization/) | Schema.org, OpenGraph, Twitter Cards, hreflang |
| [seo-best-practices](seo-best-practices/) | Canonical URLs, sitemap, robots.txt |

> *Note: the UI/UX category lists 8 rows; `seo-best-practices` and `seo-optimization` are two distinct skills — one content/strategy-focused, one technical.*

### 📡 Data Integration (6)

| Skill | Purpose |
|-------|---------|
| [riksdag-regering-mcp](riksdag-regering-mcp/) | 32-tool MCP coverage for Riksdag + Regering data |
| [cia-data-integration](cia-data-integration/) | CIA platform JSON export consumption and validation |
| [european-parliament-api](european-parliament-api/) | European Parliament Open Data integration |
| [mcp-server-development](mcp-server-development/) | Building / packaging MCP servers |
| [mcp-gateway-configuration](mcp-gateway-configuration/) | Gateway routing, tool wiring, access control |
| [mcp-gateway-security](mcp-gateway-security/) | Token management, request validation, audit logging |

### 📰 Journalism & Media (5)

| Skill | Purpose |
|-------|---------|
| [editorial-standards](editorial-standards/) | OSINT/INTOP editorial standards, attribution, fact-checking |
| [investigative-journalism](investigative-journalism/) | Source verification, document analysis, FOI requests |
| [prospective-news-coverage](prospective-news-coverage/) | Forward-looking / week-ahead / month-ahead coverage |
| [comparative-politics-reporting](comparative-politics-reporting/) | Cross-country context for Swedish developments |
| [automated-content-generation](automated-content-generation/) | Template-based content rendering in 14 languages |

### 🏛️ Government, Regulatory & Economics (7)

| Skill | Purpose |
|-------|---------|
| [global-government-analysis](global-government-analysis/) | Comparative government systems, cross-country governance |
| [myndigheter-monitoring](myndigheter-monitoring/) | Swedish government-agency monitoring |
| [regulatory-affairs](regulatory-affairs/) | Regulatory change tracking and compliance impact |
| [economic-policy-analysis](economic-policy-analysis/) | Fiscal / monetary / trade policy analysis |
| [business-development](business-development/) | Stakeholder engagement, partnerships, community growth |
| [business-model-canvas](business-model-canvas/) | Business Model Canvas for open-source sustainability |
| [marketing](marketing/) | Digital marketing, SEO, content marketing, analytics |

### 🗣️ Language & Localization (1)

| Skill | Purpose |
|-------|---------|
| [language-expertise](language-expertise/) | Linguistic and cultural expertise for all 14 supported languages (EN, SV, DA, NB, FI, DE, FR, ES, NL, AR, HE, JA, KO, ZH) |

### 🤖 GitHub Agentic Workflows (13)

These skills encode the gh-aw framework's upstream rules. They underpin every `.github/workflows/news-*.md` workflow and the prompt modules in [`.github/prompts/`](../prompts/). The index lives in [`gh-aw-README.md`](gh-aw-README.md).

| Skill | Purpose |
|-------|---------|
| [github-agentic-workflows](github-agentic-workflows/) | Root skill: v0.69.1 overview, five-layer security, safe outputs, MCP |
| [gh-aw-workflow-authoring](gh-aw-workflow-authoring/) | Markdown syntax, YAML frontmatter, compilation to `.lock.yml` |
| [gh-aw-mcp-configuration](gh-aw-mcp-configuration/) | MCP server setup, transport protocols, lifecycle, tool discovery |
| [gh-aw-mcp-gateway](gh-aw-mcp-gateway/) | Expert-level MCP gateway: routing, Docker, security, deployment |
| [gh-aw-safe-outputs](gh-aw-safe-outputs/) | Sanitisation, controlled AI actions, write-operation patterns |
| [gh-aw-security-architecture](gh-aw-security-architecture/) | Defense-in-depth, threat model, sandboxing, attack vectors |
| [gh-aw-firewall](gh-aw-firewall/) | Squid proxy domain allow-listing, iptables, credential management |
| [gh-aw-containerization](gh-aw-containerization/) | Docker isolation, multi-stage builds, image optimisation |
| [gh-aw-github-actions-integration](gh-aw-github-actions-integration/) | Workflow triggers, env config, secrets, matrix, deployment |
| [gh-aw-authentication-credentials](gh-aw-authentication-credentials/) | Token types, rotation, least-privilege, MCP auth, API keys |
| [gh-aw-logging-monitoring](gh-aw-logging-monitoring/) | Structured logging, metrics, alerting, debugging |
| [gh-aw-tools-ecosystem](gh-aw-tools-ecosystem/) | Tool capabilities, limits, integration patterns, custom tools |
| [gh-aw-continuous-ai-patterns](gh-aw-continuous-ai-patterns/) | Continuous-AI triage / review / maintenance patterns |

### 📋 Copilot Patterns (1)

| Skill | Purpose |
|-------|---------|
| [copilot-agent-patterns](copilot-agent-patterns/) | Custom agent design patterns, collaboration workflows, orchestration |

---

## 🗞️ How skills feed the news aggregator

The news-generation pipeline (`scripts/aggregate-analysis.ts` → `scripts/render-articles.ts` → `scripts/render-lib/`) derives every published article from three static inputs: `analysis/methodologies/`, `analysis/templates/`, and the per-day artifacts in `analysis/daily/$DATE/$SUB/`. Skills shape how each of those inputs is authored:

| Skill | Role in the pipeline |
|-------|---------------------|
| **`automated-content-generation`** | Defines the 9-artifact section schema every per-type analysis run must hit (executive-brief → synthesis → significance → stakeholders → SWOT → scenarios → comparative → intel-assessment → classification). An artifact authored with this skill can be dropped into `analysis/daily/$DATE/$SUB/` and the aggregator will process it without modification. |
| **`editorial-standards`** | Governs tone (inverted-pyramid structure, AP/Reuters attribution, balanced reporting), source-citation density, and the rule that every factual claim must link to a specific Riksdag/Regering source. Artifacts that violate these rules will fail the analysis gate in `.github/prompts/05-analysis-gate.md`. |
| **`data-pipeline-engineering`** | Provides the contract for how MCP query results are cached, deduplicated, and inlined into artifacts so the aggregator's SHA-256 manifest remains reproducible: same source data → same `article.md`. |

Because these three skills are **primary** for the aggregator flow, any workflow that produces news artifacts MUST load them. The per-type `.lock.yml` workflows implicitly do so via `tools: ["*"]`; if you author an artifact manually, invoke these skills explicitly.

## 🔢 Count reconciliation

| Category | Count |
|----------|------:|
| Core Infrastructure & Governance | 9 |
| Political Intelligence | 11 |
| ISMS & Security | 14 |
| Development & Operations | 14 |
| Testing & Quality Assurance | 2 |
| UI/UX & Design | 8 |
| Data Integration | 6 |
| Journalism & Media | 5 |
| Government, Regulatory & Economics | 7 |
| Language & Localization | 1 |
| GitHub Agentic Workflows | 13 |
| Copilot Patterns | 1 |
| **Total** | **91** |

Source of truth: `ls .github/skills/ | grep -v '^gh-aw-README\.md$' | wc -l` → `91`.

---

## ✍️ Authoring a new skill

1. Create a directory `<skill-name>/` in this folder (kebab-case).
2. Add a `SKILL.md` describing: *When to use*, *Rules to follow*, *Examples*.
3. Keep it **strategic** — principles and rules, not runbooks.
4. Cross-link to any related skills under "See also".
5. Open a PR; CEO approval required per [Change_Management.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Change_Management.md).
6. Update this README's catalog table and the total in [`SKILLS.md`](../../SKILLS.md).

---

## 📚 Related documentation

- [`SKILLS.md`](../../SKILLS.md) — canonical skill catalog with detailed usage guidance
- [`AGENTS.md`](../../AGENTS.md) — persona agents and their recommended skills
- [`.github/agents/README.md`](../agents/README.md) — persona + workflow-specialist agent catalog
- [`.github/prompts/README.md`](../prompts/README.md) — prompt modules imported by agentic workflows
- [`copilot-instructions.md`](../copilot-instructions.md) — repository-wide Copilot rules
- [`gh-aw-README.md`](gh-aw-README.md) — gh-aw skills index

---

**📋 Document owner:** CEO | **🏷️ Classification:** Public | **🔄 Review cycle:** Quarterly
