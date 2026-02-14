# News Metadata Directory

This directory contains metadata files used for news generation workflow coordination and error tracking.

## Files

### `last-generation.json`
Tracks the last successful news generation run.

**Schema:**
```json
{
  "timestamp": "2026-02-14T12:00:00Z",
  "generated": 5,
  "errors": 0,
  "types": "week-ahead,committee-reports",
  "status": "success"
}
```

**Purpose:**
- Prevents duplicate generation runs (5-hour threshold)
- Tracks generation success/failure metrics
- Used by workflow to determine if generation should run

### `errors.json`
Structured error logging for workflow failures.

**Schema:**
```json
{
  "lastError": {
    "timestamp": "2026-02-14T12:00:00Z",
    "workflow": "news-generation.yml",
    "errorType": "script_missing",
    "message": "scripts/generate-news-enhanced.js not found",
    "severity": "critical",
    "retryable": false
  },
  "errorHistory": [
    {
      "timestamp": "2026-02-13T18:00:00Z",
      "errorType": "mcp_unavailable",
      "message": "riksdag-regering-mcp server timeout",
      "severity": "warning",
      "retryable": true
    }
  ]
}
```

**Error Types:**
- `script_missing` (severity: critical, retryable: false)
  - Critical script files not found
  - Requires immediate maintainer attention
- `mcp_unavailable` (severity: warning, retryable: true)
  - riksdag-regering-mcp server timeout or unavailable
  - Transient network/service issues
- `script_failure` (severity: error, retryable: true)
  - Script execution failed with exit code
  - May be data quality or logic issues
- `unknown` (severity: error, retryable: true)
  - Unclassified errors

**Purpose:**
- Structured error tracking for diagnostics
- Critical error notification triggers
- Error pattern analysis for workflow improvements

### `workflow-state.json`
Coordination between agentic and traditional workflows.

**Schema:**
```json
{
  "lastUpdate": "2026-02-14T12:00:00Z",
  "recentArticles": [
    {
      "id": "2026-02-14-week-ahead-en",
      "timestamp": "2026-02-14T12:00:00Z",
      "type": "week-ahead",
      "languages": ["en", "sv"]
    }
  ],
  "mcpQueryCache": {
    "calendar_events_2026-02-14": {
      "timestamp": "2026-02-14T11:30:00Z",
      "ttl": 7200,
      "data": []
    }
  },
  "note": "This file is used for coordination between agentic and traditional workflows"
}
```

**Purpose:**
- Prevents duplicate work between agentic and traditional workflows
- MCP query caching (2-hour TTL) to reduce API calls
- Recent article tracking for similarity-based deduplication
- Traditional workflow skips if agentic activity recent (<2 hours)

### `generation-result.json`
Output from news generation script.

**Schema:**
```json
{
  "timestamp": "2026-02-14T12:00:00Z",
  "generated": 5,
  "errors": 0,
  "articles": [
    {
      "id": "2026-02-14-week-ahead-en",
      "type": "week-ahead",
      "language": "en",
      "path": "news/2026-02-14-week-ahead-en.html",
      "qualityScore": 0.85
    }
  ]
}
```

**Purpose:**
- Output from generate-news-enhanced.js
- Used by workflow to determine PR creation
- Tracks article metadata for quality analysis

## Workflow Integration

### Traditional Workflow (news-generation.yml)
```yaml
# 1. Check last generation time (last-generation.json)
# 2. Check agentic workflow activity (workflow-state.json)
# 3. Generate articles if needed
# 4. Log errors to errors.json on failure
# 5. Update last-generation.json on success/failure
# 6. Commit timestamp if 0 articles generated
# 7. Create PR if articles > 0
```

### Agentic Workflows
- `news-realtime-monitor.md` - Real-time breaking news
- `news-evening-analysis.md` - Evening comprehensive analysis
- `news-article-generator.md` - Batch article generation

**Coordination:**
- Agentic workflows update workflow-state.json with lastUpdate
- Traditional workflow checks lastUpdate and skips if < 2 hours
- Prevents duplicate articles when both workflows active

## Error Notification

Critical errors (severity=critical) trigger GitHub issue comments:

```yaml
- name: Notify on critical failure
  if: failure() && steps.generate.outcome == 'failure'
  uses: actions/github-script@v7
  # Reads errors.json and comments on open bug issues
```

## Maintenance

**Cleanup:**
- `errorHistory` should be pruned to last 10 errors
- `mcpQueryCache` entries older than TTL should be removed
- `recentArticles` should be pruned to last 6 hours

**Monitoring:**
- Track error rates by errorType
- Monitor workflow success rate
- Analyze zero-article run frequency

## References

- Workflow: `.github/workflows/news-generation.yml`
- Tests: `tests/workflows/news-generation.test.js`
- Issue: #161
