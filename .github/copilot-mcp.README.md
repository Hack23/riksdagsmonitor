# `copilot-mcp.json` — MCP Server Configuration Notes

> **Sibling explainer for [`copilot-mcp.json`](copilot-mcp.json).** JSON does not support comments; this file documents the conscious architectural decisions behind the configured (and *intentionally not configured*) MCP servers.

## Configured servers

| Server | Purpose | Status |
|---|---|---|
| `riksdag-regering` | Swedish parliamentary primary source (Riksdag + Regering documents, motions, votes, MPs, speeches) | ✅ Active (HTTP) |
| `scb` | Statistics Sweden national-statistics ground truth (PxWeb v2) | ✅ Active (container) |
| `world-bank` | Governance (WGI), environment, social residue **only** — never economic context (use IMF) | ✅ Active (container) |
| `github`, `filesystem`, `memory`, `sequential-thinking`, `playwright` | Standard tooling | ✅ Active |

## 🌐 Why IMF is **not** an MCP server (and never should be)

The IMF integration is delivered as a **TypeScript CLI** at `scripts/imf-fetch.ts` (with `scripts/imf-context.ts`, `scripts/imf-client.ts`, `scripts/imf-codes.ts`), not as an MCP server. This is a deliberate architectural decision:

1. **No upstream MCP server exists for IMF data** — as of 2026-04-24, no community or official MCP server publishes IMF Datamapper or SDMX data
2. **Two endpoints to unify** — IMF exposes both Datamapper REST (`www.imf.org/external/datamapper/api/v1`) and SDMX 3.0 (`api.imf.org`); the CLI normalises both behind a single `getImfContext({domain, country, vintage})` interface
3. **Vintage discipline is logic-heavy** — vintage labelling (`2026-04`, `2026-10`), supersedes-chain, SHA-256 payload pinning, and >6-month staleness annotation are easier and safer to express in TypeScript than in MCP tool descriptors
4. **Cache is filesystem-native** — `analysis/imf/` (canonical hub) and `analysis/daily/*/economic-data.json` (per-article cache) are git-tracked artefacts; an MCP server would add an indirection layer between agents and the cache, weakening provenance traceability
5. **Network egress is already audited** — agentic workflows declare `www.imf.org` and `api.imf.org` in their `network:` allowlist; an MCP server would relocate this surface without removing it
6. **Direct CLI invocation is simpler in workflow contexts** — agents call `tsx scripts/imf-fetch.ts ...` via the `bash` tool which is already enabled

**Future contributors:** if you are tempted to "fix the omission" by creating a `riksdagsmonitor-imf-mcp` server, please first read [`analysis/imf/agentic-integration.md`](../analysis/imf/agentic-integration.md) and discuss in an issue. The CLI pattern is the deliberate target architecture, not a workaround.

## Authority chain

- **Economic data canon** — [`.github/aw/ECONOMIC_DATA_CONTRACT.md`](aw/ECONOMIC_DATA_CONTRACT.md) v2.1
- **IMF integration playbook** — [`analysis/imf/agentic-integration.md`](../analysis/imf/agentic-integration.md)
- **IMF inventory** — [`analysis/imf/indicators-inventory.json`](../analysis/imf/indicators-inventory.json) (24 indicators, 10 dataflows)
- **IMF data dictionary** — [`analysis/imf/data-dictionary.md`](../analysis/imf/data-dictionary.md)
- **Provider decision matrix** — [`.github/copilot-instructions.md`](copilot-instructions.md) §IMF Quick Reference

## Related skills and agents

- Skill: [`.github/skills/gh-aw-mcp-configuration/SKILL.md`](skills/gh-aw-mcp-configuration/SKILL.md) §"IMF Integration is Intentionally Non-MCP"
- Agents: `data-pipeline-specialist`, `intelligence-operative`, `news-journalist`, `content-generator`, `security-architect`, `devops-engineer`

---

**Last Updated:** 2026-04-24
**Maintained by:** Hack23 AB
