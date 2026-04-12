# SWOT Analysis Generation Template v2

<!-- version: 2.0.0 | updated: 2026-03-26 | author: Hack23 AB -->
<!-- Replaces: v1/swot-generation.md -->
<!-- Enhancement: Integrates pre-computed SWOT from analysis/daily/YYYY-MM-DD/swot-analysis.md -->

## Pre-Computed SWOT Priority

**Always prefer pre-computed SWOT data** from `analysis/daily/YYYY-MM-DD/swot-analysis.md` over inline generation.

> **Note**: The pseudocode below illustrates the **script-side** flow. AI agents do NOT call `generateSwotSection()` directly. Instead, AI agents write SWOT analysis content in markdown — the script reads the analysis and calls this HTML renderer function to produce the article section. `buildSwotFromDocs` is pseudocode representing the fallback path; the actual implementation is in `generators.ts`.

```typescript
// Pseudocode — illustrative only; actual implementation is in generators.ts
import { readDailyAnalysis } from '../../analysis-reader.js';
import { generateSwotSection } from '../../data-transformers/content-generators/swot-section.js';

const analysis = await readDailyAnalysis(today);

// analysis.swot is extracted from AI-written markdown analysis
const swotData = analysis.swot ?? /* fallback: build from docs */ {};
const swotHtml = generateSwotSection({ data: swotData, lang });
```

When pre-computed SWOT is used:
- ✅ Entries already have confidence labels (HIGH/MEDIUM/LOW)
- ✅ Source document IDs are already embedded
- ✅ Impact levels are pre-computed
- Do NOT regenerate entries — enrich with additional narrative context if needed

---

## Classification-Enhanced SWOT Generation

When pre-computed SWOT is unavailable, generate SWOT with classification context:

### Classification-Aware SWOT Framing

| Classification Level | SWOT Focus |
|---|---|
| **CRITICAL** 🔴 | Constitutional risks in Threats; coalition rupture in Weaknesses |
| **HIGH** 🟠 | Policy delivery risks; electoral calculation |
| **MEDIUM** 🟡 | Standard parliamentary balance of forces |
| **LOW** 🟢 | Background monitoring; emerging trend signals |

The `classificationLevel` from `analysis/daily/YYYY-MM-DD/classification-results.md` must inform SWOT framing when available.

---

## SWOT Entry Quality Standards (v2)

Each SWOT entry MUST:
- Be traceable to specific MCP data (document ID, vote record, speech reference)
- Carry a confidence level: `[HIGH]` (direct evidence) / `[MEDIUM]` (inference) / `[LOW]` (speculation)
- Be unique — no generic boilerplate entries
- Be current — use data from the current parliamentary session
- Include impact level: `high` / `medium` / `low`

### SWOT Entry Format (v2)

```
[Quadrant — Subject]:
- Statement: [Specific, evidence-based claim] [HIGH]
- Evidence: [dok_id, vote reference, or speech reference]
- Confidence: HIGH/MEDIUM/LOW
- Impact: HIGH/MEDIUM/LOW
- Risk: [⚠️ marker if this entry intersects with risk assessment]
```

**Example with pre-computed data enrichment**:
```
[Strength — Government coalition (from pre-computed analysis)]:
- Statement: Budget surplus of 15 billion SEK provides room for pre-election social spending [HIGH]
- Evidence: FiU10 committee report, prop. 2025/26:1 (H9011)
- Confidence: HIGH
- Impact: HIGH
```

---

## Prohibited SWOT Entries (v2)

❌ "Strong leadership" (unattributed, unquantified)
❌ "Policy uncertainty" (too generic)
❌ "Public support" without polling data reference
❌ Identical entries across different parties
❌ Historical entries not relevant to current session
❌ **NEW**: Entries without confidence label when classificationLevel is HIGH or CRITICAL
❌ **NEW**: Regenerating entries that are already in pre-computed SWOT

---

## Multi-Stakeholder SWOT

For articles covering multiple parties or stakeholders, generate separate SWOT for:

1. **Government coalition** (M, KD, L with SD support)
2. **Main opposition** (S as largest opposition party)
3. **Policy domain** (the specific area being legislated)

When pre-computed `analysis/daily/YYYY-MM-DD/stakeholder-perspectives.md` is available, use it to seed the SWOT subjects rather than re-analyzing from scratch.

---

## Risk-SWOT Integration

When `analysis/daily/YYYY-MM-DD/risk-assessment.md` is available:

- Add ⚠️ marker to SWOT Threats entries that correspond to identified risk factors
- Add ⚠️ marker to SWOT Weaknesses entries that align with elevated risks
- The risk level (`high`, `elevated`, `moderate`, `low`) should calibrate the number of Threat entries:

| Risk Level | Minimum Threat Entries |
|---|---|
| `high` | 4+ |
| `elevated` | 3 |
| `moderate` | 2 |
| `low` | 1+ |

---

## Integration with Article Template

SWOT sections are rendered by `generateSwotSection()` in:
`scripts/data-transformers/content-generators/swot-section.ts`

The `SwotData` object accepts the same structure as `SwotAnalysisResult` from the analysis reader.

```typescript
import type { SwotAnalysisResult } from '../../analysis-reader.js';
import type { SwotData } from '../../types/article.js';

// Pre-computed SWOT → SwotData conversion
function toSwotData(analysisSwot: SwotAnalysisResult): SwotData {
  return {
    subject: analysisSwot.subject,
    strengths: analysisSwot.strengths.map(e => ({ text: e.text, impact: e.impact })),
    weaknesses: analysisSwot.weaknesses.map(e => ({ text: e.text, impact: e.impact })),
    opportunities: analysisSwot.opportunities.map(e => ({ text: e.text, impact: e.impact })),
    threats: analysisSwot.threats.map(e => ({ text: e.text, impact: e.impact })),
    context: analysisSwot.context,
  };
}
```
