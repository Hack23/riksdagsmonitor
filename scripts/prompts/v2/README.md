# README — Prompt Library v2

<!-- version: 2.0.0 | updated: 2026-03-26 | author: Hack23 AB -->

## Overview

The `v2/` prompt directory contains enhanced prompt templates that integrate pre-computed analysis from `analysis/daily/YYYY-MM-DD/` into article generation.

## Key Differences from v1

| Feature | v1 | v2 |
|---|---|---|
| Analysis source | Inline (from raw MCP data) | Pre-computed first, inline fallback |
| Classification badges | Not required | Required for HIGH/CRITICAL articles |
| Confidence labels | Recommended | Mandatory for analytical claims |
| SWOT generation | Always inline | Pre-computed preferred |
| Forward indicators | Recommended | Mandatory for all article types |
| Risk indicators | Not specified | ⚠️ inline tags when riskLevel high/elevated |
| Translation context | Article text only | Article text + analysis classification context |

## Files

| File | Purpose |
|---|---|
| `political-analysis.md` | Core framework with pre-computed analysis integration |
| `quality-criteria.md` | Extended quality rubric with classification validation |
| `swot-generation.md` | SWOT generation with pre-computed data preference |

## Usage

Workflows should reference v2 prompts instead of v1 when:
1. `analysis/daily/YYYY-MM-DD/` files exist for the target date
2. Article type is `deep-inspection`, `weekly-review`, `monthly-review`, or `propositions`
3. Classification level is HIGH or CRITICAL

For other cases, v1 prompts remain valid.

## Analysis Reader API

See `scripts/analysis-reader.ts` for the TypeScript API:

```typescript
import { readDailyAnalysis, readLatestAnalysis, deriveArticleClassificationMeta } from '../../analysis-reader.js';

// Read analysis for a specific date
const analysis = await readDailyAnalysis('2026-03-26');

// Read most recent available analysis (up to 7 days back)
const latest = await readLatestAnalysis();

// Derive metadata for ArticleData
const meta = deriveArticleClassificationMeta(analysis);
// meta: { classificationLevel, riskLevel, confidenceLabel, significanceScore, urgency }
```

## Style Guide

All v2 articles must comply with:
`analysis/methodologies/political-style-guide.md`
