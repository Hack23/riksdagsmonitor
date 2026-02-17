# GitHub Agentic Workflows MCP Gateway Skill

Comprehensive skill documentation for the GitHub Agentic Workflows MCP Gateway.

## 📄 Contents

- **SKILL.md** (2298 lines) - Complete MCP Gateway reference covering:
  - MCP Gateway core concepts and architecture
  - Configuration formats (TOML and JSON stdin)
  - Docker integration and container management
  - Routing modes (routed vs unified)
  - Logging and monitoring
  - Security and authentication (MCP 7.1)
  - Production deployment patterns
  - Comprehensive examples
  - Troubleshooting guide
  - Best practices and patterns

## 🎯 Skill Coverage

### 1. MCP Gateway Core Concepts
- Model Context Protocol (MCP) overview
- Gateway purpose and architecture
- Stdio vs HTTP transports
- Routed vs Unified modes
- JSON-RPC 2.0 protocol

### 2. Configuration
- TOML format (command + args)
- JSON stdin format (container-based)
- Server configuration fields (type, container, entrypoint, mounts, env)
- Gateway configuration fields (port, apiKey, domain, timeouts)
- Environment variable expansion (${VAR_NAME})
- Validation rules and error handling

### 3. Docker Support
- Container launching and lifecycle
- Volume mounts (ro/rw)
- Environment variable passthrough
- Docker socket requirements
- Security considerations

### 4. Routing Modes
- Routed mode: `/mcp/{serverID}`
- Unified mode: `/mcp`
- When to use each mode
- Multi-server configuration

### 5. Logging & Monitoring
- Log file types (mcp-gateway.log, {serverID}.log, gateway.md, rpc-messages.jsonl, tools.json)
- Log directory configuration
- Per-server logs for troubleshooting
- Debug logging patterns

### 6. Security
- MCP 7.1 authentication
- API key configuration
- Containerized validation
- Path validation
- Schema normalization
- GitHub Agentic Workflows security model (Layer 1/2/3 trust)

### 7. Practical Examples
- GitHub MCP server configuration
- Serena MCP server setup
- Multi-server configuration
- Production deployment patterns
- GitHub Actions workflows
- Custom MCP servers
- HTTP backends

### 8. Troubleshooting
- Gateway startup failures
- Backend container issues
- Authentication failures
- Tools not discovered
- Volume mount errors
- Environment variable expansion
- Docker socket permissions
- Performance issues

### 9. Best Practices
- Configuration management
- Security hardening
- Logging and monitoring
- Performance optimization
- Docker best practices

## 📚 Quick Reference

**Format**: Markdown with YAML frontmatter  
**Lines**: 2,298  
**Size**: 65KB  
**Sections**: 13 major sections  
**Examples**: 6 comprehensive examples  
**Troubleshooting**: 8 common issues with solutions  

## 🔗 References

- [MCP Gateway Configuration Reference](https://github.com/github/gh-aw/blob/main/docs/src/content/docs/reference/mcp-gateway.md)
- [GitHub Agentic Workflows](https://github.com/github/gh-aw)
- [Model Context Protocol Specification](https://github.com/modelcontextprotocol/specification)
- [MCP Gateway Repository](https://github.com/github/gh-aw-mcpg)

## 📖 Related Skills

- **gh-aw-safe-outputs** - Safe outputs pattern for controlled AI writes
- **gh-aw-firewall** - Network firewall for Agentic Workflows
- **github-agentic-workflows** - Complete GitHub Agentic Workflows guide

---

**Last Updated**: 2026-02-16  
**Version**: 1.0.0  
**Maintained by**: Hack23 AB
