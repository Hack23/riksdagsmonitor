# README — Prompt Library v2

<!-- version: 2.1.0 | updated: 2026-03-30 | author: Hack23 AB -->

## Overview

The `v2/` prompt directory contains the production prompt templates for Riksdagsmonitor agentic workflows. All prompts integrate pre-computed analysis from `analysis/daily/YYYY-MM-DD/` into article generation.

## Files

| File | Purpose |
|---|---|
| `political-analysis.md` | Core framework with pre-computed analysis integration |
| `per-file-intelligence-analysis.md` | Per-file AI analysis protocol with 6 analytical lenses |
| `political-classification-prompt.md` | Political classification (Temperature Index) |
| `political-risk-prompt.md` | Risk assessment methodology |
| `political-threat-prompt.md` | Political Threat Taxonomy (Attack Trees, Kill Chain, Diamond Model) |
| `quality-criteria.md` | Extended quality rubric with classification validation |
| `stakeholder-perspectives.md` | Multi-perspective analysis (6 perspectives) |
| `swot-generation.md` | SWOT generation with pre-computed data preference |

## Usage

All agentic workflows reference v2 prompts. Key integration points:

1. `analysis/daily/YYYY-MM-DD/` files provide pre-computed analysis
2. Classification badges required for HIGH/CRITICAL articles
3. Confidence labels mandatory for all analytical claims
4. Forward indicators mandatory for all article types
5. Risk indicators (⚠️ inline tags) when riskLevel high/elevated

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

All articles must comply with:
`analysis/methodologies/political-style-guide.md`
