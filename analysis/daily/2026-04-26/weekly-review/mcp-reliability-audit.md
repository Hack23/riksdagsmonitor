# MCP Reliability Audit — Weekly Review 2026-04-26

**Type**: Supplementary artifact S3
**Purpose**: Track MCP tool performance this session

## riksdag-regering MCP

| Tool | Calls | Successes | Failures | Latency | Notes |
|------|-------|----------|---------|---------|-------|
| get_sync_status | 1 | 1 | 0 | <2s | LIVE status confirmed |
| get_propositioner | 2 | 2 | 0 | <3s | HC03205, HC03206 etc. |
| search_dokument | 4 | 4 | 0 | <3s | Various searches |
| get_betankanden | 1 | 1 | 0 | <3s | FiU committee reports |
| get_interpellationer | 1 | 1 | 0 | <3s | HC10744-HC10752 |
| search_anforanden | 2 | 2 | 0 | <3s | Debate speeches |

**Overall MCP reliability this session**: 100% (0 failures)

**Known limitations**:
- Riksdag API returns zero results for post-September 2025 dates; documented in data-download-manifest.md
- No timeout errors encountered
- HTTP MCP endpoint: riksdag-regering-ai.onrender.com — operational throughout session

## IMF Pre-warm

| Action | Status |
|--------|--------|
| IMF CLI smoke check | ✅ Passed |
| scripts/imf-fetch.ts list-indicators | ✅ Available |
| IMF economic data required this run | ❌ Not needed (civil defence focus) |

## World Bank MCP

Not used this session (no governance/environment queries needed).

## SCB MCP

Not used this session (no Swedish monthly statistics queries needed).
