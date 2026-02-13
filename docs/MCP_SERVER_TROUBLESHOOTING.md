# MCP Server Troubleshooting Guide

## Overview

This document provides troubleshooting guidance for issues with the riksdag-regering-mcp server integration used in the news generation workflow.

## Server Information

- **Server URL**: https://riksdag-regering-ai.onrender.com/mcp
- **Protocol**: JSON-RPC 2.0
- **Tools**: 32 specialized tools for Swedish political data
- **Documentation**: https://riksdag-regering-ai.onrender.com/

## Common Issues

### 404 Not Found Error

**Symptoms**:
```
❌ Error generating Week Ahead: MCP request failed: MCP server error: 404 Not Found
```

**Root Cause**: Incorrect API endpoint or protocol usage

**Solution**: The MCP server uses JSON-RPC 2.0 protocol, not REST-style endpoints.

**Correct Usage**:
```javascript
// ✅ CORRECT - JSON-RPC 2.0
const jsonRpcRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'riksdag-regering--get_calendar_events',
    arguments: { from: '2026-02-14', tom: '2026-02-21' }
  }
};

await fetch('https://riksdag-regering-ai.onrender.com/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(jsonRpcRequest)
});
```

**Incorrect Usage**:
```javascript
// ❌ INCORRECT - REST-style (causes 404)
await fetch('https://riksdag-regering-ai.onrender.com/mcp/tools/get_calendar_events', {
  method: 'POST',
  body: JSON.stringify({ from: '2026-02-14', tom: '2026-02-21' })
});
```

### Network Timeout

**Symptoms**:
```
❌ Error: MCP request failed: AbortError
```

**Root Causes**:
- MCP server is down or slow
- Network connectivity issues
- Request timeout too short (default: 30 seconds)

**Solutions**:
1. Check MCP server status: `curl https://riksdag-regering-ai.onrender.com/`
2. Increase timeout in client config:
   ```javascript
   const client = new MCPClient({ timeout: 60000 }); // 60 seconds
   ```
3. Implement retry logic (already included in MCPClient with 3 retries)

### Tool Not Found

**Symptoms**:
```
❌ Error: MCP tool error: Tool riksdag-regering--get_calendar_events not found
```

**Root Causes**:
- Tool name prefix mismatch
- Tool doesn't exist on server
- Server version mismatch

**Solutions**:
1. Verify tool exists: List available tools
   ```bash
   curl -X POST https://riksdag-regering-ai.onrender.com/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
   ```

2. Try without prefix (client automatically falls back):
   - First try: `riksdag-regering--get_calendar_events`
   - Fallback: `get_calendar_events`

3. Update tool name in code if server changed naming

### JSON-RPC Error Response

**Symptoms**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found"
  }
}
```

**Root Causes**:
- Invalid method name
- Missing required parameters
- Server-side validation error

**Solutions**:
1. Verify method syntax: `tools/call` not `tool/call` or `tools.call`
2. Check required parameters for the tool
3. Validate parameter types match tool schema

## Testing the MCP Client

### Unit Testing

Run MCP client unit tests (mocked responses):
```bash
npm test tests/mcp-client.test.js
```

These tests use mocked responses and don't require network access. All 93 unit tests validate:
- JSON-RPC 2.0 protocol implementation
- Request structure and parameters
- Response parsing
- Error handling
- Retry logic

### Manual Testing

```bash
# Test list tools
curl -X POST https://riksdag-regering-ai.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Test calendar events
curl -X POST https://riksdag-regering-ai.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"tools/call",
    "params":{
      "name":"riksdag-regering--get_calendar_events",
      "arguments":{"from":"2026-02-14","tom":"2026-02-21"}
    }
  }'
```

### Integration Testing with News Generation

Test news generation locally:
```bash
node scripts/generate-news-enhanced.js --types=week-ahead --languages=en,sv
```

## Health Checks

### Pre-Flight Health Check

Before running news generation, verify MCP server is accessible:

```javascript
async function checkMCPHealth() {
  try {
    const response = await fetch('https://riksdag-regering-ai.onrender.com/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ MCP server error:', data.error.message);
      return false;
    }
    
    console.log('✅ MCP server healthy, available tools:', data.result?.tools?.length || 0);
    return true;
  } catch (error) {
    console.error('❌ MCP server unreachable:', error.message);
    return false;
  }
}
```

## Configuration

### Environment Variables

```bash
# Override default MCP server URL
export MCP_SERVER_URL=https://custom-mcp-server.example.com/mcp

# Use in client
const client = new MCPClient();
// Automatically uses MCP_SERVER_URL if set
```

### Client Configuration

```javascript
const client = new MCPClient({
  baseURL: 'https://riksdag-regering-ai.onrender.com/mcp',
  timeout: 30000,  // 30 seconds
  maxRetries: 3    // Retry 3 times on network errors
});
```

## Monitoring

### Key Metrics

- **Request Count**: Track via `client.getStats().requests`
- **Error Rate**: Track via `client.getStats().errors`
- **Success Rate**: Track via `client.getStats().successRate`
- **Response Time**: Monitor average latency
- **Availability**: Monitor uptime of MCP server

### Logging

Enable verbose logging:

```javascript
// Add to mcp-client.js temporarily
console.log('📤 Request:', tool, params);
console.log('📥 Response:', data);
```

## Support

### MCP Server Status

Check server status page: https://riksdag-regering-ai.onrender.com/

### GitHub Issues

Report issues: https://github.com/Hack23/riksdagsmonitor/issues

### Documentation

- MCP Protocol: https://www.jsonrpc.org/specification
- Riksdag-Regering MCP: https://riksdag-regering-ai.onrender.com/
- Client Code: `scripts/mcp-client.js`
- Tests: `tests/mcp-client.test.js`

---

**Last Updated**: 2026-02-13  
**Version**: 1.0  
**Maintainer**: Hack23 AB
