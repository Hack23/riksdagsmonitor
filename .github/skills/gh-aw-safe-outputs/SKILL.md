---
name: gh-aw-safe-outputs
description: Expert knowledge in GitHub Agentic Workflows safe outputs - security architecture, sanitization, controlled AI actions, and write operation patterns
license: Apache-2.0
version: 1.0.0
last_updated: 2026-02-16
tags: [github-agentic-workflows, safe-outputs, security, ai-safety, sanitization]
---

# 🛡️ GitHub Agentic Workflows - Safe Outputs Skill

## 📋 Purpose

Master the **safe outputs** pattern in GitHub Agentic Workflows - the foundational security mechanism that enables AI agents to perform write operations safely through explicit, human-approved outputs. This skill provides comprehensive expertise in designing, implementing, and operating safe output patterns for controlled AI automation.

## 🎯 Core Concept

### What Are Safe Outputs?

**Safe outputs** are the **only way** AI agents can perform write operations (create/update files, issues, PRs) in GitHub Agentic Workflows. Unlike direct tool access, safe outputs require explicit approval and sanitization before execution.

**Key Principles:**
- 🔒 **Write Isolation**: All write operations go through safe outputs
- ✅ **Explicit Approval**: Outputs must be explicitly declared in workflow
- �� **Automatic Sanitization**: All outputs sanitized before execution
- 📊 **Auditable**: All actions logged and traceable
- 🚫 **No Direct Writes**: AI cannot write files/issues/PRs directly

**Security Model:**

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│             │      │              │      │                 │
│  AI Agent   │─────▶│ Safe Outputs │─────▶│  Sanitization  │
│ (Read-Only) │      │   (Declare)  │      │   & Execution  │
│             │      │              │      │                 │
└─────────────┘      └──────────────┘      └─────────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Workflow   │
                     │ Configuration│
                     │ (Allowlist)  │
                     └──────────────┘
```

## 🏗️ Safe Output Types

### 1. `safeoutputs___issue`

Create or update GitHub issues with AI-generated content.

**Configuration:**
```yaml
tools:
  safeoutputs___issue:
    # No additional config required
```

**Usage Pattern:**
```markdown
# Workflow markdown body
Analyze this codebase and create issues for improvement opportunities.

For each issue, use safeoutputs___issue:
- title: Brief description
- body: Detailed explanation with code examples
- labels: ["enhancement", "ai-generated"]
```

**AI Output Format:**
```json
{
  "tool": "safeoutputs___issue",
  "title": "Improve error handling in authentication module",
  "body": "## Problem\n\nThe authentication module lacks comprehensive error handling...\n\n## Proposed Solution\n\n1. Add try-catch blocks\n2. Implement error logging\n3. Return user-friendly messages",
  "labels": ["enhancement", "security"]
}
```

**Sanitization Applied:**
- ✅ Title limited to 256 characters
- ✅ Body sanitized for XSS (HTML tags stripped)
- ✅ Labels validated against repository labels
- ✅ Malicious URLs removed
- ✅ Code injection patterns blocked

**Execution:**
- Creates new issue if none exists
- Updates existing issue if specified
- Returns issue URL
- Logs all actions

### 2. `safeoutputs___pull_request`

Create pull requests with AI-generated code changes.

**Configuration:**
```yaml
tools:
  safeoutputs___pull_request:
    base_branch: main  # Optional: default branch
    auto_merge: false  # Optional: enable auto-merge
```

**Usage Pattern:**
```markdown
Review this codebase and propose improvements.

Create a pull request using safeoutputs___pull_request:
- branch: "ai/improve-error-handling"
- title: "Improve error handling"
- body: Description of changes
- files: List of file changes
```

**AI Output Format:**
```json
{
  "tool": "safeoutputs___pull_request",
  "branch": "ai/improve-error-handling",
  "title": "Improve error handling in authentication module",
  "body": "## Changes\n\n- Added try-catch blocks\n- Implemented error logging\n- Added tests",
  "files": [
    {
      "path": "src/auth.ts",
      "content": "// New content...",
      "encoding": "utf-8"
    }
  ]
}
```

**Sanitization Applied:**
- ✅ Branch name validated (alphanumeric, hyphens, slashes only)
- ✅ File paths validated (no directory traversal)
- ✅ File content scanned for secrets
- ✅ File size limits enforced (max 1MB per file)
- ✅ Binary files rejected
- ✅ Suspicious patterns blocked

**Execution:**
- Creates new branch from base
- Commits files with AI signature
- Creates pull request
- Returns PR URL
- Triggers CI/CD

### 3. `safeoutputs___comment`

Add comments to issues or pull requests.

**Configuration:**
```yaml
tools:
  safeoutputs___comment:
    # No additional config required
```

**Usage Pattern:**
```markdown
Provide helpful feedback on this pull request.

Add a comment using safeoutputs___comment:
- issue_number: 123  # or pr_number
- body: Your feedback
```

**AI Output Format:**
```json
{
  "tool": "safeoutputs___comment",
  "issue_number": 123,
  "body": "## Code Review\n\nI noticed a few areas for improvement:\n\n1. **Error Handling**: Consider adding...\n2. **Performance**: The loop in line 45 could be optimized..."
}
```

**Sanitization Applied:**
- ✅ Body sanitized for XSS
- ✅ Malicious URLs removed
- ✅ Code injection blocked
- ✅ Length limits enforced

### 4. `safeoutputs___file`

Create or update files in the repository.

**Configuration:**
```yaml
tools:
  safeoutputs___file:
    allowed_paths:
      - "docs/**"
      - "*.md"
      - "src/**/*.ts"
    max_file_size: 1048576  # 1MB
```

**Usage Pattern:**
```markdown
Update documentation to reflect recent changes.

Create/update files using safeoutputs___file:
- path: docs/api.md
- content: Updated documentation
- commit_message: Update API documentation
```

**AI Output Format:**
```json
{
  "tool": "safeoutputs___file",
  "path": "docs/api.md",
  "content": "# API Documentation\n\n## Authentication\n\n...",
  "commit_message": "Update API documentation with new endpoints",
  "encoding": "utf-8"
}
```

**Sanitization Applied:**
- ✅ Path validated against allowed_paths
- ✅ No directory traversal (../)
- ✅ File size limits enforced
- ✅ Secret scanning
- ✅ Binary file detection
- ✅ Malicious content removed

### 5. `safeoutputs___label`

Add or remove labels from issues or pull requests.

**Configuration:**
```yaml
tools:
  safeoutputs___label:
    # No additional config required
```

**Usage Pattern:**
```markdown
Triage this issue and apply appropriate labels.

Use safeoutputs___label:
- issue_number: 123
- add: ["bug", "high-priority"]
- remove: ["needs-triage"]
```

**AI Output Format:**
```json
{
  "tool": "safeoutputs___label",
  "issue_number": 123,
  "add": ["bug", "high-priority"],
  "remove": ["needs-triage"]
}
```

**Sanitization Applied:**
- ✅ Labels validated against repository labels
- ✅ Label names sanitized
- ✅ Protected labels blocked (e.g., "security-approved")

### 6. `safeoutputs___noop`

No operation - AI provides information without taking action.

**Configuration:**
```yaml
tools:
  safeoutputs___noop:
    # Always available, no config
```

**Usage Pattern:**
```markdown
Analyze this issue and provide recommendations without taking action.

Use safeoutputs___noop to report findings.
```

**AI Output Format:**
```json
{
  "tool": "safeoutputs___noop",
  "message": "## Analysis\n\nThis issue appears to be a duplicate of #456.\n\n## Recommendation\n\nClose this issue and direct the reporter to #456."
}
```

**Use Cases:**
- ✅ Read-only analysis
- ✅ Recommendations without action
- ✅ Dry-run scenarios
- ✅ Human-in-the-loop workflows

## 🔐 Security Architecture

### Defense-in-Depth Layers

**Layer 1: Compile-Time Validation**
```yaml
# Workflow declares allowed tools
tools:
  safeoutputs___issue:
  safeoutputs___file:
    allowed_paths: ["docs/**"]
```

- Tool allowlist validated at compile time
- Configuration schema validated
- Path patterns validated

**Layer 2: Runtime Isolation**
```
AI Agent Environment:
- Read-only filesystem
- No network access (except MCP)
- Limited memory/CPU
- Sandboxed container
```

**Layer 3: Output Sanitization**
```typescript
// Sanitization pipeline
function sanitize(output: SafeOutput): SanitizedOutput {
  // 1. Schema validation
  validateSchema(output);
  
  // 2. Content sanitization
  sanitizeHTML(output.body);
  sanitizeURLs(output.body);
  
  // 3. Secret scanning
  detectSecrets(output);
  
  // 4. Path validation
  validatePaths(output.files);
  
  // 5. Size limits
  enforceSize(output);
  
  return sanitized;
}
```

**Layer 4: Execution Control**
```
Approved outputs only:
- Tool in workflow allowlist? ✅
- Path in allowed_paths? ✅
- Size under limit? ✅
- No secrets detected? ✅
- Sanitization passed? ✅

→ Execute action
→ Log to audit trail
```

### Threat Model

**Threats Mitigated:**

| Threat | Mitigation | Layer |
|--------|-----------|-------|
| **Path Traversal** | Path validation, allowlist | Layer 3 |
| **Secret Leakage** | Secret scanning | Layer 3 |
| **XSS Injection** | HTML sanitization | Layer 3 |
| **Code Injection** | Pattern blocking | Layer 3 |
| **Unauthorized Files** | allowed_paths | Layer 1 |
| **Excessive Size** | Size limits | Layer 3 |
| **Binary Uploads** | Binary detection | Layer 3 |
| **Protected Labels** | Label validation | Layer 3 |
| **Branch Hijacking** | Branch validation | Layer 3 |

## 📊 Configuration Patterns

### Minimal (High Security)
```yaml
on: issues
permissions: read-all

tools:
  github:
    toolsets: [issues]
  safeoutputs___comment:  # Comment only
```

**Use Case:** Issue triage, read-only analysis

### Standard (Balanced)
```yaml
on: issues
permissions: read-all

tools:
  github:
    toolsets: [issues, repos]
  safeoutputs___issue:
  safeoutputs___comment:
  safeoutputs___label:
  safeoutputs___file:
    allowed_paths:
      - "docs/**/*.md"
```

**Use Case:** Documentation updates, issue management

### Advanced (Controlled Automation)
```yaml
on: pull_request
permissions: read-all

tools:
  github:
    toolsets: [issues, repos, pull_requests]
  bash:
    allowed-commands: [npm, git]
  safeoutputs___pull_request:
    base_branch: main
  safeoutputs___comment:
  safeoutputs___file:
    allowed_paths:
      - "src/**/*.ts"
      - "tests/**/*.test.ts"
      - "docs/**"
    max_file_size: 1048576
```

**Use Case:** Code generation, automated PRs

## 🎯 Best Practices

### 1. Principle of Least Privilege
```yaml
# ❌ DON'T: Grant all tools
tools:
  safeoutputs___*:

# ✅ DO: Grant only needed tools
tools:
  safeoutputs___issue:
  safeoutputs___comment:
```

### 2. Restrict File Paths
```yaml
# ❌ DON'T: Allow all paths
tools:
  safeoutputs___file:
    allowed_paths: ["**"]

# ✅ DO: Whitelist specific paths
tools:
  safeoutputs___file:
    allowed_paths:
      - "docs/**/*.md"
      - "README.md"
```

### 3. Use Human-in-the-Loop for Critical Operations
```yaml
# For critical operations, use noop + manual approval
tools:
  safeoutputs___noop:  # AI provides recommendation
  # Human reviews recommendation
  # Human manually executes if appropriate
```

### 4. Audit Trail
```yaml
# Always enable audit logging (automatic)
# Review logs regularly:
# - /tmp/gh-aw/audit.log
# - GitHub Actions logs
```

### 5. Test in Sandbox First
```bash
# Test workflow with noop only
tools:
  safeoutputs___noop:

# Review AI outputs
# Enable actual tools gradually
```

## 🔄 Workflow Examples

### Example 1: Issue Triage
```markdown
---
on: issues
tools:
  github:
    toolsets: [issues]
  safeoutputs___label:
  safeoutputs___comment:
---

Analyze this issue and provide triage:

1. Determine if it's a bug, feature, or question
2. Apply appropriate labels using safeoutputs___label
3. Add helpful comment using safeoutputs___comment
4. Suggest assignee if applicable
```

### Example 2: Documentation Updates
```markdown
---
on: push
tools:
  github:
    toolsets: [repos]
  bash:
    allowed-commands: [git]
  safeoutputs___file:
    allowed_paths: ["docs/**"]
---

Review recent code changes and update documentation:

1. Identify changed files
2. Review related documentation
3. Update docs using safeoutputs___file
4. Ensure examples are current
```

### Example 3: Code Review
```markdown
---
on: pull_request
tools:
  github:
    toolsets: [pull_requests]
  safeoutputs___comment:
---

Review this pull request and provide feedback:

1. Check code quality
2. Identify potential issues
3. Add review comment using safeoutputs___comment
4. Suggest improvements
```

## 🚨 Common Pitfalls

### Pitfall 1: Overly Permissive Paths
```yaml
# ❌ BAD
allowed_paths: ["**"]  # Allows all files

# ✅ GOOD
allowed_paths: ["docs/**/*.md"]  # Specific patterns
```

### Pitfall 2: Assuming Direct Write Access
```markdown
# ❌ BAD: Trying to write files directly
Write to src/config.ts

# ✅ GOOD: Using safe outputs
Use safeoutputs___file to update src/config.ts
```

### Pitfall 3: Not Testing Sanitization
```bash
# Test with malicious inputs:
# - Path traversal: ../../../etc/passwd
# - XSS: <script>alert('xss')</script>
# - Secrets: API_KEY=abc123def456
```

### Pitfall 4: Ignoring Size Limits
```yaml
# Configure appropriate limits
max_file_size: 1048576  # 1MB for code
max_file_size: 10485760  # 10MB for docs
```

## 📊 Monitoring & Observability

### Log Analysis
```bash
# Review safe outputs logs
tail -f /tmp/gh-aw/safe-outputs.log

# Filter by tool
grep "safeoutputs___file" /tmp/gh-aw/safe-outputs.log

# Count usage
grep -c "safeoutputs___" /tmp/gh-aw/safe-outputs.log
```

### Metrics to Track
- ✅ Total safe outputs executed
- ✅ Outputs by type
- ✅ Sanitization blocks
- ✅ Execution failures
- ✅ Average output size
- ✅ Most used tools

### Security Alerts
```yaml
# Alert on suspicious patterns
alerts:
  - pattern: "Path traversal blocked"
    severity: high
  - pattern: "Secret detected"
    severity: critical
  - pattern: "XSS blocked"
    severity: high
```

## 🔗 Related Skills

- **gh-aw-security-architecture** - Overall security model
- **gh-aw-mcp-gateway** - MCP protocol integration
- **gh-aw-workflow-authoring** - Workflow creation
- **gh-aw-logging-monitoring** - Observability

## 📚 References

- [GitHub Agentic Workflows Documentation](https://github.github.com/gh-aw/)
- [Safe Outputs Specification](https://github.com/github/gh-aw/blob/main/docs/safe-outputs.md)
- [Security Architecture](https://github.github.com/gh-aw/introduction/architecture/)
- [Guardrails Overview](https://github.com/github/gh-aw#guardrails)

## ✅ Remember

- ✅ Safe outputs are the ONLY way AI writes
- ✅ All outputs are sanitized automatically
- ✅ Use least privilege (minimal tools)
- ✅ Restrict paths with allowed_paths
- ✅ Test with malicious inputs
- ✅ Monitor audit logs regularly
- ✅ Use noop for recommendations
- ✅ Human approval for critical operations
- ✅ Size limits prevent resource exhaustion
- ✅ Secret scanning prevents leaks

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-16  
**Maintained by**: Hack23 AB
