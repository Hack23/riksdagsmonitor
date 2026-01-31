# 🤖 Riksdagsmonitor Custom Agents Guide

## Overview

This repository includes custom GitHub Copilot agents specialized for different aspects of the riksdagsmonitor project. Each agent has deep expertise in its domain and can be invoked to assist with specific tasks.

## Available Agents

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

Each agent file contains only:
```yaml
---
name: agent-name
description: Brief description of agent's expertise
tools: ["view", "edit", "create", "search", "bash", "grep", "glob"]
---
```

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
    }
  }
}
```

This configuration provides all agents with access to the GitHub MCP server with Insiders API for experimental features.

## Best Practices

### 1. Choose the Right Agent
Select the agent that best matches your task:
- **Security tasks** → Security Architect
- **Documentation** → Documentation Architect
- **Quality/Testing** → Quality Engineer
- **UI/Frontend** → Frontend Specialist
- **Compliance** → ISMS Compliance Manager
- **CI/CD** → Deployment Specialist

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
Agents automatically load relevant skills from `.github/skills/`:
- `hack23-isms-compliance` - ISMS requirements
- `security-by-design` - Security principles
- `static-site-security` - Static site security
- `ci-cd-security` - GitHub Actions security
- `documentation-standards` - Documentation guidelines
- `html-accessibility` - WCAG 2.1 AA standards
- `multi-language-localization` - i18n/l10n best practices

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

**Last Updated**: 2026-01-31  
**Maintained by**: Hack23 AB
