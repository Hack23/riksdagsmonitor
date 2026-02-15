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
    "workflow": "news-article-generator.lock.yml",
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
Coordination between agentic workflows.

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
  "note": "This file is used for coordination between agentic workflows"
}
```

**Purpose:**
- Prevents duplicate work between agentic workflows
- MCP query caching (2-hour TTL) to reduce API calls
- Recent article tracking for similarity-based deduplication

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

### Agentic Workflows
- `news-article-generator.md` → `.lock.yml` — General article generation (daily ~05:51 UTC)
- `news-realtime-monitor.md` → `.lock.yml` — Breaking news (10:00 + 14:00 UTC Mon-Fri)
- `news-evening-analysis.md` → `.lock.yml` — Evening analysis (18:00 UTC Mon-Fri)

**Coordination:**
- Agentic workflows update workflow-state.json with lastUpdate
- Prevents duplicate articles across the three workflows

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

- Agentic workflows: `.github/workflows/news-*.md` (source) → `.lock.yml` (compiled)
- Tests: `tests/news-*.test.js`
