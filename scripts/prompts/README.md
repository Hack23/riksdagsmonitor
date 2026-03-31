# Shared Prompt Library

This directory contains reusable prompt templates for the Riksdagsmonitor agentic workflows.

## Directory Structure

```
scripts/prompts/
├── README.md                                ← This file
└── v2/                                      ← Production prompts (current)
    ├── README.md                            ← v2 overview and API reference
    ├── political-analysis.md                ← Core political analysis framework (6 analytical lenses)
    ├── per-file-intelligence-analysis.md    ← Per-file AI analysis protocol
    ├── political-classification-prompt.md   ← Political classification (Temperature Index)
    ├── political-risk-prompt.md             ← Risk assessment methodology
    ├── political-threat-prompt.md           ← Political Threat Taxonomy (replaces STRIDE)
    ├── quality-criteria.md                  ← Quality self-assessment rubric (minimum 7/10)
    ├── stakeholder-perspectives.md          ← Multi-perspective analysis instructions
    └── swot-generation.md                   ← SWOT generation with pre-computed data preference
```

## Usage in Workflows

Workflows reference these templates in their `Required Skills` section:
```markdown
## Required Skills
7. **`scripts/prompts/v2/political-analysis.md`** — Core political analysis framework
8. **`scripts/prompts/v2/stakeholder-perspectives.md`** — Multi-perspective analysis instructions
9. **`scripts/prompts/v2/quality-criteria.md`** — Quality self-assessment rubric (minimum 7/10)
10. **`scripts/prompts/v2/per-file-intelligence-analysis.md`** — Per-file AI analysis protocol
```

Agents load the relevant prompt files at the start of each generation run.

## Quality Tracking

Quality scores from prompt versions are stored in `news/metadata/quality-metrics.json`. This enables:
1. Comparing quality scores across prompt versions
2. Tracking quality improvements over time
3. Identifying regressions requiring prompt refinement

## Prompt Files

| File | Purpose | Used By |
|------|---------|---------|
| `political-analysis.md` | Core analytical framework with pre-computed analysis integration | All workflows |
| `per-file-intelligence-analysis.md` | Per-file AI analysis protocol with 6 analytical lenses | All doc-type workflows |
| `political-classification-prompt.md` | Classification prompt (Political Temperature Index) | Analysis framework |
| `political-risk-prompt.md` | Risk assessment methodology | Analysis framework |
| `political-threat-prompt.md` | Political Threat Taxonomy (Attack Trees, Kill Chain, Diamond Model) | Analysis framework |
| `quality-criteria.md` | Extended quality rubric with classification validation | All workflows (mandatory) |
| `stakeholder-perspectives.md` | Multi-perspective analysis (government, opposition, citizen, economic, international, media) | All analytical workflows |
| `swot-generation.md` | SWOT generation with pre-computed data preference | evening-analysis, article-generator |
