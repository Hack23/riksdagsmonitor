# GitHub Agentic Workflows - Compilation Guide

## Overview

This repository uses **GitHub Agentic Workflows** for certain automation tasks. These are AI-powered workflows written in markdown that compile to traditional GitHub Actions YAML files.

## File Structure

```
.github/workflows/
├── news-article-generator.md        # Source (human-editable markdown)
└── news-article-generator.lock.yml  # Compiled (auto-generated YAML)
```

## When to Recompile

Lock files need recompilation when:
- ✅ The markdown source file (`.md`) is modified
- ✅ Workflow frontmatter (configuration) changes
- ✅ You see a "Lock file is outdated" error in workflow runs

## How to Compile

### Automatic Compilation (Recommended)

A GitHub Actions workflow (`.github/workflows/compile-agentic-workflows.yml`) automatically compiles lock files when markdown sources change:

1. Edit the `.md` file
2. Commit and push changes
3. The compilation workflow runs automatically
4. Lock file is updated and committed

### Manual Compilation

If automatic compilation fails or you prefer manual control:

```bash
# Download gh-aw binary (one-time setup)
curl -L -o /usr/local/bin/gh-aw "https://github.com/github/gh-aw/releases/download/v0.43.5/linux-amd64"
chmod +x /usr/local/bin/gh-aw

# Compile a specific workflow
gh-aw compile .github/workflows/news-article-generator.md

# Verify changes
git diff .github/workflows/news-article-generator.lock.yml

# Commit
git add .github/workflows/*.lock.yml
git commit -m "chore: recompile agentic workflow lock files"
git push
```

### Using GitHub CLI Extension

If you have GitHub CLI installed:

```bash
# Install gh-aw extension (one-time)
gh extension install github/gh-aw

# Compile workflow
gh aw compile .github/workflows/news-article-generator.md
```

## Workflow Structure

### Markdown Source (.md)

```markdown
---
name: News Article Generator
description: Automatically generates news articles
on:
  schedule: daily
  workflow_dispatch:
    inputs:
      article_types:
        description: Article types to generate
        default: week-ahead
permissions:
  contents: read
timeout-minutes: 30
engine: copilot
---

# Agent Instructions

Natural language instructions for the AI agent...
```

### Compiled Lock File (.lock.yml)

The lock file is a complete GitHub Actions workflow with:
- Standard GitHub Actions YAML structure
- Metadata header with hash verification
- Activation and agent execution jobs
- MCP server configuration
- Safe output handling

**⚠️ Never edit lock files directly!** Always edit the markdown source and recompile.

## Hash Verification

Lock files include a SHA256 hash of the markdown frontmatter:

```yaml
# frontmatter-hash: ca7bc476d1e4efffbe6fb04856291738b204d5bb21b7edccbe4dda3c8e20bdfb
```

This ensures:
- Lock files stay in sync with sources
- Accidental modifications are detected
- Compilation is deterministic

## Troubleshooting

### "Lock file is outdated" Error

**Cause**: Markdown source was updated but lock file wasn't recompiled.

**Solution**: Recompile the lock file (see "How to Compile" above).

### Compilation Fails

**Possible causes**:
1. Invalid YAML in frontmatter
2. Missing required fields
3. gh-aw tool not available

**Solution**:
1. Validate frontmatter YAML syntax
2. Check required fields: `name`, `engine`, permissions
3. Install gh-aw tool (see "Manual Compilation")

### Automatic Compilation Not Working

**Check**:
1. Workflow permissions (needs `contents: write`)
2. Branch protection rules
3. GitHub Actions enabled
4. View workflow run logs for errors

## Best Practices

### Editing Workflows

1. ✅ **DO**: Edit the `.md` file
2. ✅ **DO**: Test locally with `gh aw compile`
3. ✅ **DO**: Commit both `.md` and `.lock.yml` files
4. ❌ **DON'T**: Edit `.lock.yml` directly
5. ❌ **DON'T**: Commit `.md` without recompiling `.lock.yml`

### Version Control

```bash
# Good commit
git add .github/workflows/news-article-generator.md
git add .github/workflows/news-article-generator.lock.yml
git commit -m "feat: add article type filtering"

# Bad commit (missing lock file)
git add .github/workflows/news-article-generator.md
git commit -m "feat: add article type filtering"  # ❌ Lock file not updated!
```

### CI/CD Integration

The compilation workflow integrates with your CI/CD:
- Runs on PR creation/update
- Blocks merge if lock files are out of sync
- Auto-commits compiled files to PR branch

## Security Considerations

### Permissions

Compilation workflow requires:
```yaml
permissions:
  contents: write      # To commit lock files
  pull-requests: write # To update PR descriptions
```

### Supply Chain

- gh-aw binary is downloaded from official GitHub releases
- Release verification via SHA256 checksums
- Pin to specific version (v0.43.5)

### Secret Management

- Never include secrets in markdown files
- Use GitHub Secrets for sensitive data
- Lock files inherit security from markdown sources

## References

- [GitHub Agentic Workflows](https://github.com/github/gh-aw)
- [gh-aw Documentation](https://github.com/github/gh-aw/blob/main/.github/aw/github-agentic-workflows.md)
- [MCP (Model Context Protocol)](https://modelcontextprotocol.io/)
- [DevOps Engineer Agent](.github/agents/devops-engineer.md)
- [GitHub Agentic Workflows Skill](.github/skills/github-agentic-workflows/SKILL.md)

## Examples

### News Article Generator

Our primary agentic workflow generates news articles from Swedish political data:

- **Source**: `.github/workflows/news-article-generator.md`
- **Purpose**: Automated political journalism
- **Trigger**: Daily schedule (02:00 CET) + manual dispatch
- **MCP Server**: riksdag-regering-mcp (32 political data tools)
- **Output**: Multi-language news articles (EN/SV)

See the markdown source for detailed agent instructions.

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-11  
**Maintained by**: Hack23 AB DevOps Team
