# Shared Prompt Library

This directory contains reusable prompt templates for the Riksdagsmonitor agentic workflows. Templates are versioned under subdirectories (`v1/`, `v2/`, etc.) to support gradual rollout and A/B testing.

## Directory Structure

```
scripts/prompts/
├── README.md                       ← This file
└── v1/                             ← Current production prompts
    ├── political-analysis.md       ← Core political analysis instructions
    ├── swot-generation.md          ← SWOT analysis prompt templates
    ├── dashboard-generation.md     ← Dashboard interpretation prompts
    ├── stakeholder-perspectives.md ← Multi-perspective analysis instructions
    └── quality-criteria.md         ← Output quality self-assessment rubric
```

## Usage in Workflows

Workflows reference these templates in their `Required Skills` section:
```markdown
## Required Skills
4. **`scripts/prompts/v1/quality-criteria.md`** — Quality self-assessment rubric
```

Agents load the relevant prompt files at the start of each generation run.

## Version Management

- **v1/** — Stable production prompts (current default)
- **v2/** — Experimental prompts under A/B testing (when active)

Each prompt file contains a version header with:
- Version number
- Date of last update
- Change summary

## Quality Tracking

Quality scores from prompt versions are stored in `news/metadata/quality-metrics.json`. This enables:
1. Comparing quality scores across prompt versions
2. Rolling back to previous versions if quality degrades
3. Gradual rollout: 10% → 50% → 100% of runs

## Prompt Files

| File | Purpose | Used By |
|------|---------|---------|
| `political-analysis.md` | Core analytical framework for Swedish parliamentary reporting | All workflows |
| `swot-generation.md` | SWOT analysis generation for deep-inspection articles | evening-analysis, article-generator |
| `dashboard-generation.md` | Dashboard data interpretation and visualization context | committee-reports, propositions |
| `stakeholder-perspectives.md` | Multi-perspective analysis (government, opposition, civil society) | All analytical workflows |
| `quality-criteria.md` | Self-assessment rubric for article quality validation | All workflows (mandatory) |
