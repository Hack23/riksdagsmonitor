# Agentic Skills Analysis & Workflow Improvements

**Date:** 2026-02-17  
**Total Skills:** 69  
**Workflows Enhanced:** 3

## Executive Summary

Comprehensive analysis of all 69 agentic skills in `.github/skills/` and enhancement of 3 news generation workflows with proper skill references. All workflows now have organized, category-based skill references that guide agents to the right expertise for each task.

## Skills Inventory by Category

### 🤖 GitHub Agentic Workflows (12 skills)

Critical skills for understanding and using GitHub Agentic Workflows infrastructure:

1. **gh-aw-safe-outputs** - Safe-outputs MCP server, PR creation, container isolation workarounds
2. **gh-aw-mcp-gateway** - MCP gateway routing, configuration, tool discovery
3. **gh-aw-mcp-configuration** - MCP server setup, transport protocols, lifecycle management
4. **gh-aw-workflow-authoring** - Markdown syntax, YAML frontmatter, natural language instructions
5. **gh-aw-security-architecture** - Defense-in-depth, threat modeling, sandboxing
6. **gh-aw-tools-ecosystem** - All available tools (GitHub, file ops, web, bash, playwright)
7. **gh-aw-firewall** - Network egress control, domain whitelisting, Squid proxy
8. **gh-aw-continuous-ai-patterns** - Triage, review, maintenance, monitoring workflows
9. **gh-aw-github-actions-integration** - CI/CD pipeline integration, workflow triggers
10. **gh-aw-logging-monitoring** - Structured logging, metrics, alerting, debugging
11. **gh-aw-authentication-credentials** - Token types, credential storage, least privilege
12. **gh-aw-containerization** - Docker isolation, security hardening, orchestration

**Use When:** Developing or debugging agentic workflows, understanding framework capabilities

### 📰 Journalism & Political Analysis (15 skills)

Core journalism and political analysis skills for high-quality news coverage:

1. **editorial-standards** - OSINT/INTOP-driven political intelligence journalism, fact-checking, editorial guidelines
2. **swedish-political-system** - Parliamentary terminology, committee structures, document types
3. **political-science-analysis** - Comparative politics, institutional analysis, democratic theory
4. **investigative-journalism** - In-depth reporting, source verification, FOI requests
5. **comparative-politics-reporting** - International context, cross-country analysis
6. **prospective-news-coverage** - Future event coverage, agenda analysis, predictive reporting
7. **economic-policy-analysis** - Fiscal policy, budget analysis, economic forecasting
8. **legislative-monitoring** - Voting patterns, bill tracking, committee effectiveness
9. **regulatory-affairs** - Agency rulemaking, compliance monitoring, enforcement
10. **electoral-analysis** - Election forecasting, campaign analysis, coalition prediction
11. **strategic-communication-analysis** - Political messaging, narrative framing, crisis communications
12. **behavioral-analysis** - Political psychology, cognitive biases, leadership analysis
13. **intelligence-analysis-techniques** - ACH, SWOT, Devil's Advocacy, Red Team analysis
14. **risk-assessment-frameworks** - Political risk indicators, corruption detection
15. **data-science-for-intelligence** - Statistical analysis, pattern recognition, data viz

**Use When:** Writing articles, performing analysis, verifying sources, forecasting outcomes

### 🔌 Data & Development (6 skills)

Technical skills for data integration and automated content generation:

1. **riksdag-regering-mcp** - Complete 32-tool MCP server documentation
2. **automated-content-generation** - Template-based generation, quality validation
3. **api-integration** - REST/GraphQL patterns, rate limiting, retry logic
4. **data-pipeline-engineering** - ETL workflows, caching strategies, pipeline orchestration
5. **cia-data-integration** - CIA export consumption, JSON Schema validation
6. **advanced-data-visualization** - Chart.js/D3.js, interactive dashboards

**Use When:** Integrating data sources, generating content, building visualizations

### 🔐 Security & Compliance (15 skills)

ISMS compliance and security best practices:

1. **hack23-isms-compliance** - ISMS framework enforcement (ISO/NIST/CIS)
2. **iso-27001-controls** - ISO 27001:2022 Annex A controls
3. **nist-csf-mapping** - NIST Cybersecurity Framework 2.0
4. **cis-controls** - CIS Controls v8.1
5. **secure-development-lifecycle** - SDL phases, classification-driven controls
6. **secure-development-policy** - Comprehensive SDLC security requirements
7. **threat-modeling** - STRIDE analysis, attack trees, MITRE ATT&CK
8. **security-by-design** - Security integration principles
9. **secure-code-review** - Security review for HTML/CSS/JavaScript
10. **ci-cd-security** - GitHub Actions security, supply chain security
11. **secrets-management** - GitHub secrets, environment variables
12. **gdpr-compliance** - Political data processing, privacy-by-design
13. **osint-methodologies** - OSINT collection, source evaluation, ethics
14. **compliance-checklist** - Unified compliance mapping (ISO/NIST/CIS/NIS2/EU CRA)
15. **security-documentation** - ISMS documentation standards

**Use When:** Security reviews, compliance audits, threat modeling, secure development

### 🎨 UI/UX & Frontend (9 skills)

Static website development and accessibility:

1. **responsive-design** - Mobile-first design, CSS Grid/Flexbox
2. **html-accessibility** - WCAG 2.1 AA compliance
3. **design-system-management** - Cyberpunk theme design system
4. **political-data-visualization** - CSS-only data visualizations
5. **multi-language-localization** - 14-language support, RTL layouts
6. **ui-ux-design** - User experience best practices
7. **playwright-testing** - Browser automation, visual regression testing
8. **code-quality-checks** - HTML/CSS validation, link checking
9. **static-site-security** - XSS prevention, CSP, HTTPS-only

**Use When:** Developing UI, ensuring accessibility, multi-language support, testing

### 🏗️ Infrastructure & Documentation (12 skills)

Infrastructure automation and documentation standards:

1. **github-actions-workflows** - CI/CD workflow patterns
2. **github-agentic-workflows** - Comprehensive agentic automation expertise
3. **documentation-standards** - C4 models, Mermaid diagrams, Hack23 guidelines
4. **c4-architecture-documentation** - C4 architecture model documentation
5. **hack23-future-architecture-standards** - Future state architecture planning
6. **issue-management** - GitHub issue creation, labeling, prioritization
7. **language-expertise** - 14-language linguistic and cultural expertise
8. **business-development** - Stakeholder engagement, partnership strategies
9. **marketing** - Digital marketing, SEO, content marketing
10. **myndigheter-monitoring** - Swedish government agency monitoring
11. **global-government-analysis** - Comparative government systems
12. **performance-optimization** - Core Web Vitals, bundle size reduction

**Use When:** Infrastructure setup, documentation, cross-language content, performance tuning

## Workflow Improvements

### news-article-generator.md

**Before:** 4 basic skill references  
**After:** 16 comprehensive skill references organized in 4 categories

**New Skills Added:**
- Journalism: editorial-standards, political-science-analysis, investigative-journalism, prospective-news-coverage, legislative-monitoring
- Data: riksdag-regering-mcp, automated-content-generation, osint-methodologies, api-integration
- Security: gh-aw-safe-outputs, gh-aw-workflow-authoring, gdpr-compliance

**Impact:**
- Agents have clear guidance for OSINT/INTOP political intelligence writing
- Political analysis frameworks available for deeper insights
- OSINT source verification methodologies documented
- Safe-outputs PR creation patterns explained
- GDPR compliance for political data handling

### news-evening-analysis.md

**Before:** 3 basic references in comment  
**After:** 15 comprehensive skill references organized in 4 categories

**New Skills Added:**
- Political: political-science-analysis (for synthesis and analysis)
- Journalism: editorial-standards, investigative-journalism, legislative-monitoring, comparative-politics-reporting, economic-policy-analysis
- Data: riksdag-regering-mcp, automated-content-generation, data-science-for-intelligence
- Workflow: gh-aw-safe-outputs, gh-aw-workflow-authoring, gdpr-compliance

**Impact:**
- Evening analysis agents have analytical frameworks for synthesis
- International context and comparative analysis skills
- Economic policy analysis for fiscal/budget coverage
- Statistical analysis for data-driven insights
- Better editorial standards compliance

### news-realtime-monitor.md

**Before:** 0 skill references  
**After:** 13 comprehensive skill references organized in 4 categories

**New Skills Added:**
- Core: swedish-political-system, language-expertise, multi-language-localization
- Breaking News: editorial-standards, investigative-journalism, prospective-news-coverage, strategic-communication-analysis
- Data: riksdag-regering-mcp, osint-methodologies, automated-content-generation
- Workflow: gh-aw-safe-outputs, gh-aw-workflow-authoring, gdpr-compliance

**Impact:**
- Breaking news verification protocols available
- Strategic communications analysis (crisis comms, political messaging)
- Real-time OSINT collection methodologies
- Rapid content generation for urgent events
- Event anticipation and calendar monitoring

## Skill Reference Pattern

All workflows now follow this consistent pattern:

```markdown
## Available Skills & Reference Materials

### 📚 Core Language & Political Skills
1. skill-name — Description and use case
2. ...

### 📰 Journalism & Editorial Skills
5. skill-name — Description and use case
6. ...

### 🔌 Data & Technical Skills
10. skill-name — Description and use case
11. ...

### 🔐 Security & Workflow Skills
14. skill-name — Description and use case
15. ...
```

**Benefits:**
- Organized by category (easy scanning)
- Clear descriptions (when to use each skill)
- Consistent across all workflows
- Numbered for easy reference

## Critical Skills Explained

### gh-aw-safe-outputs

**Why Critical:** Documents container isolation bug that caused workflow #22085121440 to fail

**Key Content:**
- Safe-outputs Docker container can't see agent's git commits
- Must push branch to remote BEFORE calling create_pull_request
- Noop vs failure decision-making: noop only for no-data cases
- If articles generated but PR fails → workflow must FAIL (not noop)

**Used By:** All 3 workflows

### editorial-standards

**Why Critical:** Ensures journalism quality meets political intelligence editorial standards

**Key Content:**
- Fact-checking protocols (verify with multiple sources)
- OSINT/INTOP political intelligence editorial standards
- Editorial ethics (conflicts of interest, corrections)
- Source attribution requirements
- Headline writing standards

**Used By:** All 3 workflows

### riksdag-regering-mcp

**Why Critical:** Complete documentation for 32 MCP tools used by all workflows

**Key Content:**
- Tool catalog (ledamöter, dokument, voteringar, anföranden, etc.)
- Calling patterns (direct tool names, no manual routing)
- Cold start handling (30-60s warmup)
- Error recovery strategies
- Data freshness checking

**Used By:** All 3 workflows

### automated-content-generation

**Why Critical:** Template-based generation patterns for consistent output

**Key Content:**
- Template engines (Markdown/HTML)
- Data-to-narrative transformation
- Multi-language rendering
- Quality validation before publication
- SEO optimization patterns

**Used By:** All 3 workflows

### political-science-analysis

**Why Critical:** Analytical frameworks for deeper insights

**Key Content:**
- Comparative politics frameworks
- Political behavior analysis models
- Institutional analysis techniques
- Democratic theory application
- Coalition dynamics analysis

**Used By:** news-article-generator, news-evening-analysis

### strategic-communication-analysis

**Why Critical:** Understanding political messaging and crisis communications

**Key Content:**
- Political messaging analysis
- Narrative framing techniques
- Crisis communications patterns
- Strategic communication assessment
- Media spin detection

**Used By:** news-realtime-monitor (breaking news context)

## Recommendations

### For Future Workflow Development

1. **Always add skills section** - Include relevant skills from day one
2. **Organize by category** - Use the 4-category pattern (Language/Journalism/Data/Security)
3. **Reference gh-aw skills** - Critical for understanding framework capabilities
4. **Include editorial-standards** - Ensures journalism quality
5. **Document MCP integration** - Reference riksdag-regering-mcp or relevant MCP skills

### For Skill Development

1. **Maintain YAML frontmatter** - All skills need proper metadata
2. **Include use cases** - Clear descriptions of when to use each skill
3. **Add code examples** - Practical patterns agents can follow
4. **Cross-reference** - Link related skills
5. **Keep updated** - Skills should reflect current best practices

### For Agents

1. **Read skills before starting work** - Don't reinvent patterns
2. **Follow editorial standards** - Use established journalism practices
3. **Reference technical skills** - gh-aw-safe-outputs, riksdag-regering-mcp
4. **Apply analytical frameworks** - political-science-analysis, data-science-for-intelligence
5. **Ensure compliance** - gdpr-compliance, osint-methodologies

## Validation

All 3 workflows compiled successfully with gh aw compile:

```
✓ news-article-generator.md (57.3 KB)
✓ news-evening-analysis.md (56.6 KB)
✓ news-realtime-monitor.md (56.4 KB)
⚠ Compiled 3 workflow(s): 0 error(s), 1 warning(s)
```

Warning is about schedule timing (not critical).

## Conclusion

All 69 skills analyzed and categorized. Three news workflows enhanced with comprehensive, organized skill references (44 total skill references across all workflows). Agents now have clear guidance on which skills to reference for specific tasks, improving quality, consistency, and reliability.

**Key Improvements:**
- ✅ Organized skill references by category
- ✅ Clear descriptions and use cases
- ✅ Critical skills explained (safe-outputs, editorial-standards, riksdag-regering-mcp)
- ✅ Consistent pattern across all workflows
- ✅ All workflows compile successfully
- ✅ No errors, 1 non-critical warning

---

**Next Steps:**
1. Apply same skill reference pattern to future workflows
2. Keep skills updated with latest best practices
3. Add more skills as new domains emerge
4. Monitor workflow performance with new skill references
