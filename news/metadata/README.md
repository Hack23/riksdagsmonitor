# News Metadata Directory

This directory contains shared state and quality metrics for news generation workflows.

## Files

### workflow-state.json
**Purpose:** Shared state across news workflows for coordination and deduplication

**Schema:** `workflow-state.schema.json`

**Structure:**
```json
{
  "lastUpdated": "ISO 8601 timestamp",
  "lastEveningAnalysis": "ISO 8601 timestamp",
  "lastRealtimeMonitor": "ISO 8601 timestamp",
  "lastArticleGenerator": "ISO 8601 timestamp",
  "realtimeArticlesSinceEvening": [
    {
      "slug": "article-slug",
      "timestamp": "ISO 8601 timestamp",
      "topics": ["topic1", "topic2"],
      "synthesizedInEvening": true|false,
      "languages": ["en", "sv", ...]
    }
  ],
  "mcpQueryCache": {
    "query-key": {
      "query": "MCP query string",
      "result": { },
      "timestamp": "ISO 8601 timestamp",
      "ttl": 7200
    }
  },
  "eveningAnalysisMetrics": {
    "date": "YYYY-MM-DD",
    "languagesGenerated": 14,
    "avgQualityScore": 0.82,
    "avgAnalyticalDepth": 0.75,
    "historicalContextPresent": 14,
    "internationalComparisons": 8
  }
}
```

**Usage:**
- Read by workflows before generation to avoid duplication
- Updated after generation with new articles and metrics
- MCP query cache has 2-hour TTL to prevent redundant API calls

### quality-metrics.json
**Purpose:** Track quality scores for all generated articles

**Schema:** `quality-metrics.schema.json`

**Structure:**
```json
{
  "YYYY-MM-DD-article-type": {
    "date": "YYYY-MM-DD",
    "workflow": "evening-analysis|realtime-monitor|article-generator",
    "languages": 14,
    "metrics": {
      "en": {
        "qualityScore": 0.82,
        "analyticalDepth": 0.75,
        "historicalContext": 2,
        "internationalComparisons": 1,
        "partyPerspectives": 7,
        "sources": 15,
        "wordCount": 2850,
        "hasAllPillars": true
      },
      "sv": { ... }
    },
    "aggregateMetrics": {
      "avgQualityScore": 0.82,
      "avgAnalyticalDepth": 0.75,
      "historicalContextPresent": 14,
      "internationalComparisons": 8
    }
  }
}
```

**Validation:**
- Automatically updated by `scripts/validate-evening-analysis.js`
- Used for quality tracking and trend analysis
- Aggregate metrics calculated across all language versions

## Workflow Integration

### Evening Analysis Workflow
1. Read `workflow-state.json` to check recent articles
2. Generate article with deduplication
3. Validate with `scripts/validate-evening-analysis.js`
4. Update `quality-metrics.json` with scores
5. Update `workflow-state.json` with completion timestamp

### Realtime Monitor Workflow
1. Read `workflow-state.json` to check last evening analysis
2. Generate breaking news articles
3. Add to `realtimeArticlesSinceEvening` array
4. Update `workflow-state.json`

### Deduplication Logic
- Calculate text similarity between new article and recent articles
- If similarity > 70%, synthesize but don't repeat verbatim
- Reference earlier coverage, add deeper analysis
- Mark as `synthesizedInEvening: true` in workflow state

## Quality Thresholds

### Evening Analysis
- Overall quality score ≥ 0.75 (good)
- Analytical depth ≥ 0.6 (acceptable)
- Historical context ≥ 1.0 (present)
- Party perspectives ≥ 6 (balanced)
- Source citations ≥ 5 (documented)
- International comparison in 60%+ articles

### Validation
Run validation script:
```bash
node scripts/validate-evening-analysis.js news/YYYY-MM-DD-evening-analysis-en.html
```

## Data Retention
- `workflow-state.json`: Rolling state (keep latest)
- `quality-metrics.json`: Historical data (retain indefinitely)
- `realtimeArticlesSinceEvening`: Cleared after evening analysis
- `mcpQueryCache`: 2-hour TTL, auto-expire

## Schema Validation
Schemas are defined using JSON Schema Draft 7:
- `workflow-state.schema.json`
- `quality-metrics.schema.json`

Validate with:
```bash
ajv validate -s workflow-state.schema.json -d workflow-state.json
ajv validate -s quality-metrics.schema.json -d quality-metrics.json
```
