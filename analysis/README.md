# Analysis Directory

This directory contains pre-computed political intelligence analysis files, methodologies, and output templates for the Riksdagsmonitor article generation pipeline.

## Directory Structure

```
analysis/
├── README.md                           ← This file
├── methodologies/                      ← Analysis framework documentation
│   ├── political-style-guide.md       ← Political Intelligence Style Guide (v1.0)
│   └── ...                            ← Additional methodology docs
└── daily/                             ← Daily pre-computed analysis output
    └── YYYY-MM-DD/                    ← Date-stamped analysis directories
        ├── classification-results.md  ← Document classification and priority
        ├── risk-assessment.md         ← Risk level analysis and factors
        ├── swot-analysis.md           ← SWOT analysis (pre-computed)
        ├── threat-analysis.md         ← Threat indicators and democratic health
        ├── stakeholder-perspectives.md ← Multi-perspective analysis (6 lenses)
        ├── significance-scoring.md    ← Significance scores and urgency
        └── synthesis-summary.md       ← Overall narrative direction
```

## Usage

The `scripts/analysis-reader.ts` module reads these files and provides a structured TypeScript API for article generators.

```typescript
import { readDailyAnalysis } from '../scripts/analysis-reader.js';

const analysis = await readDailyAnalysis('2026-03-26');
if (analysis) {
  const { classification, riskAssessment, swot, significance } = analysis;
  // Use pre-computed data to enrich article generation
}
```

## Fallback Behavior

When daily analysis files are absent, article generators fall back to inline analysis using:
- `scripts/ai-analysis/` — SWOT and risk analysis modules
- `scripts/analysis-framework/` — Multi-perspective analysis framework

See `scripts/analysis-reader.ts` for the complete API and fallback logic.

## Methodologies

See `analysis/methodologies/political-style-guide.md` for the comprehensive Political Intelligence Style Guide governing:
- Article structure standards per article type
- Writing quality requirements (evidence density, attribution, confidence)
- Icon conventions for classification levels
- Forward indicator requirements
- Multi-language translation standards
