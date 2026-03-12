#!/usr/bin/env bash
# @module mcp-setup
# @description Sourceable shell script that configures MCP environment variables
# for agentic workflow scripts. Replaces inline python3 JSON parsing with node -e.
#
# Usage (in workflow .md bash blocks):
#   source scripts/mcp-setup.sh
#   npx tsx scripts/generate-news-enhanced.ts --types=committee-reports ...
#
# Sets: MCP_SERVER_URL, MCP_AUTH_TOKEN, MCP_CLIENT_TIMEOUT_MS
#
# Token extraction priority:
#   1. gateway.apiKey (legacy)
#   2. mcpServers['riksdag-regering'].headers.Authorization (raw API key)
#
# @author Hack23 AB
# @license Apache-2.0

# Route through MCP gateway (direct HTTPS fails in AWF sandbox)
export MCP_SERVER_URL="http://host.docker.internal:80/mcp/riksdag-regering"

# Extract auth token using node (repo runtime — no python3 dependency)
_MCP_CONFIG_PATH="${GH_AW_MCP_CONFIG:-/home/runner/.copilot/mcp-config.json}"
if [ -f "$_MCP_CONFIG_PATH" ]; then
  GW_KEY=$(node -e "
    try {
      const c = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
      // Priority 1: gateway.apiKey (legacy path)
      const gwKey = (c.gateway || {}).apiKey || '';
      if (gwKey) { process.stdout.write(gwKey); process.exit(0); }
      // Priority 2: mcpServers['riksdag-regering'].headers.Authorization
      const rr = ((c.mcpServers || {})['riksdag-regering']) || {};
      const auth = (rr.headers || {})['Authorization'] || '';
      process.stdout.write(auth);
    } catch(e) { process.stderr.write('MCP config parse error: ' + e.message + '\n'); process.stdout.write(''); }
  " -- "$_MCP_CONFIG_PATH" 2>/dev/null || echo "")
  if [ -z "$GW_KEY" ]; then
    echo "⚠️  WARNING: MCP config file exists but MCP auth token is missing or invalid"
  else
    # Use the key as-is — the MCP gateway expects the raw API key
    export MCP_AUTH_TOKEN="$GW_KEY"
  fi
fi

# Cold-start-tolerant timeout (90 s)
export MCP_CLIENT_TIMEOUT_MS=90000
