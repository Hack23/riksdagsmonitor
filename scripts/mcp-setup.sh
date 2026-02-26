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
# @author Hack23 AB
# @license Apache-2.0

# Route through MCP gateway (direct HTTPS fails in AWF sandbox)
export MCP_SERVER_URL="http://host.docker.internal:80/mcp/riksdag-regering"

# Extract gateway API key using node (repo runtime — no python3 dependency)
_MCP_CONFIG_PATH="${GH_AW_MCP_CONFIG:-/home/runner/.copilot/mcp-config.json}"
if [ -f "$_MCP_CONFIG_PATH" ]; then
  GW_KEY=$(node -e "
    try {
      const c = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
      const k = (c.gateway || {}).apiKey || '';
      process.stdout.write(k);
    } catch(e) { process.stderr.write(''); process.stdout.write(''); }
  " "$_MCP_CONFIG_PATH" 2>/dev/null || echo "")
  if [ -z "$GW_KEY" ]; then
    echo "⚠️  WARNING: MCP config file exists but gateway API key is missing or invalid"
  else
    export MCP_AUTH_TOKEN="Bearer $GW_KEY"
  fi
fi

# Cold-start-tolerant timeout (90 s)
export MCP_CLIENT_TIMEOUT_MS=90000
