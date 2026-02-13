# Integration Tests for MCP Client

This directory contains integration tests for the riksdag-regering-mcp server client. These tests validate actual API calls against the live MCP server.

## Overview

**Test File**: `mcp-client.integration.test.js`

**Coverage**: All 9 MCP client methods
- `fetchCalendarEvents` - Calendar/upcoming parliamentary events
- `fetchCommitteeReports` - Committee reports (betänkanden)
- `fetchPropositions` - Government propositions
- `fetchMotions` - Opposition motions  
- `searchDocuments` - Document search
- `searchSpeeches` - Parliamentary speeches
- `fetchMPs` - Members of Parliament
- `fetchVotingRecords` - Voting records
- `fetchGovernmentDocuments` - Government documents

## Running Integration Tests

### Local Development

```bash
# Run integration tests (connects to live MCP server)
npm run test:integration

# Skip integration tests (useful when server unavailable)
npm run test:integration:skip

# Run all tests (unit + integration with skip)
npm run test:all
```

### Environment Variables

```bash
# Override MCP server URL
export MCP_SERVER_URL=https://custom-mcp-server.example.com/mcp
npm run test:integration

# Skip integration tests
export SKIP_INTEGRATION_TESTS=true
npm test
```

## Test Behavior

### Auto-Skip on Server Unavailable

Integration tests automatically skip if the MCP server is unavailable:

```
⚠️ MCP server unavailable: Connection refused
⚠️ Integration tests will be skipped
```

This prevents test failures due to network issues or server downtime.

### Success Output Example

```
🔍 Testing MCP server availability...
📡 Server URL: https://riksdag-regering-ai.onrender.com/mcp
✅ MCP server is available

✓ should connect to MCP server (234ms)
✓ should fetch calendar events for next 7 days (1289ms)
   ✓ Fetched 12 calendar events
   ✓ Sample event: "Försvarsutskottets sammanträde kl. 09:00..."
✓ should filter calendar events by organ (892ms)
   ✓ Fetched 8 kammaren events
...

📊 MCP Client Statistics:
   Requests: 23
   Errors: 0
   Success Rate: 100%
```

## Test Categories

### 1. Server Availability
Verifies MCP server is reachable before running tests.

### 2. Method Tests
Each of the 9 MCP client methods has dedicated tests:
- Basic functionality
- Parameter validation
- Response structure
- Data quality

### 3. Error Handling
Tests for graceful handling of:
- Invalid parameters
- Network timeouts
- Server errors

### 4. Performance
Tests for:
- Request completion within timeout
- Concurrent request handling

### 5. Data Quality
Validates:
- Consistent response structures
- Array return types
- Non-empty responses (when applicable)

## CI/CD Integration

### GitHub Actions

Integration tests can be optionally run in CI/CD:

```yaml
- name: Run integration tests
  if: github.event_name == 'schedule' # Only on scheduled runs
  run: npm run test:integration
  continue-on-error: true # Don't fail build if server unavailable
```

### Recommended Workflow

1. **Pull Requests**: Skip integration tests (use unit tests only)
2. **Main Branch**: Run with `SKIP_INTEGRATION_TESTS=true`
3. **Scheduled Runs**: Run full integration tests daily
4. **Manual Trigger**: Allow manual integration test runs

## Writing New Integration Tests

### Template

```javascript
describe('newMethod', () => {
  it.skipIf(!serverAvailable)('should perform expected behavior', async () => {
    const result = await client.newMethod(params);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    console.log(`   ✓ Fetched ${result.length} items`);
    
    if (result.length > 0) {
      const firstItem = result[0];
      expect(firstItem).toHaveProperty('expectedField');
      console.log(`   ✓ Sample item: ${JSON.stringify(firstItem).substring(0, 100)}...`);
    }
  }, TEST_TIMEOUT);
});
```

### Best Practices

1. **Always check serverAvailable**: Skip tests when server is down
2. **Use TEST_TIMEOUT**: Network calls need longer timeouts (60s)
3. **Log useful info**: Help developers understand what's happening
4. **Validate structure**: Check response types and required fields
5. **Handle empty results**: Not all queries return data
6. **Test edge cases**: Invalid params, timeouts, etc.

## Debugging

### Enable Verbose Logging

Temporarily add to mcp-client.js:

```javascript
console.log('📤 Request:', tool, params);
console.log('📥 Response:', data);
```

### Test Single Method

```bash
# Run specific test
npx vitest run tests/integration/mcp-client.integration.test.js -t "fetchCalendarEvents"
```

### Check Server Status

```bash
# Test server availability
curl -X POST https://riksdag-regering-ai.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Troubleshooting

### Server Unavailable

If integration tests consistently fail:

1. **Check server status**: Visit https://riksdag-regering-ai.onrender.com/
2. **Verify network**: Test from different network/location
3. **Check timeout**: Increase timeout if server is slow
4. **Review logs**: Check for error patterns

### Unexpected Responses

If tests pass but responses seem wrong:

1. **Validate API**: Check MCP server documentation
2. **Verify parameters**: Ensure correct parameter format
3. **Check data**: Inspect actual response data
4. **Update tests**: Tests may need updates if API changed

### Performance Issues

If tests are slow:

1. **Reduce test scope**: Fetch fewer items (limit parameter)
2. **Increase timeout**: Adjust TEST_TIMEOUT
3. **Check network**: Test from different location
4. **Monitor server**: Check server response times

## Related Documentation

- **MCP Client**: `scripts/mcp-client.js`
- **Unit Tests**: `tests/mcp-client.test.js`
- **Troubleshooting**: `docs/MCP_SERVER_TROUBLESHOOTING.md`
- **MCP Server**: https://riksdag-regering-ai.onrender.com/

---

**Last Updated**: 2026-02-13  
**Maintained by**: Hack23 AB
