---
name: mcp-server-development
description: Model Context Protocol server development patterns, tool design, transport protocols, and MCP best practices
license: Apache-2.0
---

# MCP Server Development Skill

## Purpose
Provides patterns for developing and integrating Model Context Protocol (MCP) servers for AI-assisted workflows.

## MCP Architecture
- **Transport**: stdio, HTTP+SSE, Streamable HTTP
- **Protocol**: JSON-RPC 2.0 over transport
- **Tools**: Functions exposed to AI agents
- **Resources**: Data accessible by AI agents

## Tool Design Patterns
- Clear, descriptive tool names
- Comprehensive parameter descriptions
- Input validation on all parameters
- Structured error responses
- Rate limiting for external API calls

## Security Requirements
- Authentication via tokens (never hard-coded)
- Use environment variables for credentials
- Validate all tool inputs
- Sanitize outputs to prevent injection
- Log tool usage for audit trails
- Least privilege access to external APIs

## GitHub MCP Configuration

This example shows the `.github/copilot-mcp.json` format (GitHub Actions secret expansion):
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github@latest", "--toolsets", "all"],
      "env": {
        "GITHUB_TOKEN": "${{ secrets.COPILOT_MCP_GITHUB_PERSONAL_ACCESS_TOKEN }}",
        "GITHUB_API_URL": "https://api.githubcopilot.com/mcp/insiders"
      }
    }
  }
}
```

> **Supply Chain Security**: In production, pin packages to exact versions (e.g., `@modelcontextprotocol/server-github@0.1.0`) and verify integrity. Use `@latest` only in examples. The `${{ secrets.* }}` syntax is specific to GitHub Copilot MCP configuration files — for standalone use, set `GITHUB_TOKEN` via environment variables.

## Testing MCP Tools
- Unit test each tool independently
- Integration test with mock transports
- Validate JSON-RPC request/response format
- Test error handling and edge cases
- Performance test with realistic payloads

## Related Policies
- [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md)
