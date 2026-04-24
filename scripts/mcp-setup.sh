#!/usr/bin/env bash
# @module mcp-setup
# @description Sourceable shell script that configures MCP environment variables
# for agentic workflow scripts. Replaces inline python3 JSON parsing with node -e.
#
# Usage (in workflow .md bash blocks):
#   source scripts/mcp-setup.sh
#   npx tsx scripts/aggregate-analysis.ts --date 2026-04-23 --subfolder committee-reports ...
#
# Sets: MCP_SERVER_URL, MCP_AUTH_TOKEN, MCP_CLIENT_TIMEOUT_MS,
#       MCP_GATEWAY_PORT, MCP_GATEWAY_DOMAIN,
#       SCB_MCP_SERVER_URL, WORLD_BANK_MCP_SERVER_URL
#
# Gateway port resolution priority (matches scripts/mcp-client/client.ts):
#   1. MCP_GATEWAY_PORT env var (set by gh-aw lock file at gateway start)
#   2. gateway.port in mcp-config.json (written by gh-aw mcp-gateway bootstrap)
#   3. Default 8080 (current gh-aw mcp-gateway default; was 80 in <0.69)
#
# Gateway domain resolution priority:
#   1. MCP_GATEWAY_DOMAIN env var
#   2. gateway.domain in mcp-config.json
#   3. Default host.docker.internal
#
# Token extraction priority:
#   1. MCP_GATEWAY_API_KEY env var (set by gh-aw lock file)
#   2. gateway.apiKey in mcp-config.json (legacy)
#   3. mcpServers['riksdag-regering'].headers.Authorization (raw API key)
#
# @author Hack23 AB
# @license Apache-2.0

# Locate the agent's MCP config file (best-effort — absence is not fatal)
_MCP_CONFIG_PATH="${GH_AW_MCP_CONFIG:-/home/runner/.copilot/mcp-config.json}"

# Resolve gateway port + domain dynamically from the runtime config so we
# stay compatible across gh-aw versions (port 80 in <0.69, port 8080 in >=0.69).
if [ -f "$_MCP_CONFIG_PATH" ]; then
  _GW_INFO=$(node -e "
    try {
      const c = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
      const gw = c.gateway || {};
      const port = gw.port || '';
      const domain = gw.domain || '';
      process.stdout.write(String(port) + '|' + String(domain));
    } catch(e) { process.stdout.write('|'); }
  " -- "$_MCP_CONFIG_PATH" 2>/dev/null || echo "|")
  _GW_PORT_FROM_CFG="${_GW_INFO%%|*}"
  _GW_DOMAIN_FROM_CFG="${_GW_INFO##*|}"
else
  _GW_PORT_FROM_CFG=""
  _GW_DOMAIN_FROM_CFG=""
fi

# Final values: env > config > default
if [ -z "${MCP_GATEWAY_PORT:-}" ]; then
  if [ -n "$_GW_PORT_FROM_CFG" ]; then
    export MCP_GATEWAY_PORT="$_GW_PORT_FROM_CFG"
  else
    export MCP_GATEWAY_PORT="8080"
  fi
fi
if [ -z "${MCP_GATEWAY_DOMAIN:-}" ]; then
  if [ -n "$_GW_DOMAIN_FROM_CFG" ]; then
    export MCP_GATEWAY_DOMAIN="$_GW_DOMAIN_FROM_CFG"
  else
    export MCP_GATEWAY_DOMAIN="host.docker.internal"
  fi
fi

# Route through MCP gateway (direct HTTPS fails in AWF sandbox because the
# api-proxy MITMs TLS — see scripts/mcp-client/client.ts for details).
export MCP_SERVER_URL="http://${MCP_GATEWAY_DOMAIN}:${MCP_GATEWAY_PORT}/mcp/riksdag-regering"

# SCB and World Bank MCP servers also available through gateway
export SCB_MCP_SERVER_URL="http://${MCP_GATEWAY_DOMAIN}:${MCP_GATEWAY_PORT}/mcp/scb"
export WORLD_BANK_MCP_SERVER_URL="http://${MCP_GATEWAY_DOMAIN}:${MCP_GATEWAY_PORT}/mcp/world-bank"

# Extract auth token using node (repo runtime — no python3 dependency)
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
  if [ -z "$GW_KEY" ] && [ -z "${MCP_GATEWAY_API_KEY:-}" ]; then
    echo "⚠️  WARNING: MCP config file exists but MCP auth token is missing or invalid"
  elif [ -n "$GW_KEY" ]; then
    # Strip legacy "Bearer " prefix (case-insensitive) — gateway expects raw API key
    export MCP_AUTH_TOKEN="$(printf '%s' "$GW_KEY" | sed 's/^[Bb][Ee][Aa][Rr][Ee][Rr][[:space:]]*//')"
  fi
fi

# Fall back to MCP_GATEWAY_API_KEY env var if no token was found in the config
if [ -z "${MCP_AUTH_TOKEN:-}" ] && [ -n "${MCP_GATEWAY_API_KEY:-}" ]; then
  export MCP_AUTH_TOKEN="$MCP_GATEWAY_API_KEY"
fi

# Cold-start-tolerant timeout (90 s)
export MCP_CLIENT_TIMEOUT_MS=90000
