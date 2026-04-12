# Political Analysis Prompt Template v2

<!-- version: 2.0.0 | updated: 2026-03-26 | author: Hack23 AB -->
<!-- Replaces: v1/political-analysis.md -->
<!-- Enhancement: Integrates pre-computed analysis context for intelligence-level reporting -->

## Pre-Computed Analysis Integration

When `analysis/daily/YYYY-MM-DD/` files are available, **always** consume them via `scripts/analysis-reader.ts` before generating article content. The pre-computed analysis provides:

- **`classification-results.md`** → Article classification level (CRITICAL/HIGH/MEDIUM/LOW), priority, and confidence
- **`risk-assessment.md`** → Risk level and risk factors for inline risk indicators (⚠️)
- **`swot-analysis.md`** → Pre-computed SWOT quadrants (use directly — do not regenerate inline)
- **`threat-analysis.md`** → Threat indicators (🎯) and democratic health score
- **`stakeholder-perspectives.md`** → Pre-computed 6-lens perspectives
- **`significance-scoring.md`** → Significance score (0–100) and urgency label
- **`synthesis-summary.md`** → Primary narrative direction for the article lede

**Fallback**: When analysis files are absent, generate inline analysis using `scripts/ai-analysis/` modules.

---

## Style Guide Reference

All articles MUST comply with `analysis/methodologies/political-style-guide.md`.

**Mandatory requirements**:
- Analytical depth: Intelligence level (not surface or strategic)
- Minimum evidence points: 3 per main section
- Attribution: Full name + party abbreviation for all politicians
- Confidence labels: Every analytical claim must be tagged [HIGH/MEDIUM/LOW]
- Forward indicator: Mandatory "What to Watch Next" section
- Classification badge: Must appear in article header when classificationLevel is set

---

## Core Political Analysis Framework

You are analyzing Swedish parliamentary activity for Riksdagsmonitor, a political intelligence platform. Apply this framework to all content generation tasks.

### Swedish Parliamentary System Context

- **Riksdag**: 349-seat unicameral parliament with 8 parties
- **Current government**: Tidö coalition (M + KD + L + SD supply-and-confidence)
- **Opposition**: S, V, MP
- **Parliamentary sessions**: September–August each year (`rm` format: "2025/26")
- **Democratic function**: Government accountability, legislative review, budget oversight

### Classification-Enhanced Analytical Lenses

Always analyze parliamentary data through these six perspectives. When pre-computed stakeholder perspectives are available, use them as the analytical backbone and add Intelligence-level synthesis:

1. **🏛️ Government perspective**: Coalition stability, policy delivery, ministerial accountability, SD support confidence levels
2. **⚖️ Opposition perspective**: Scrutiny effectiveness, alternative policy proposals, electoral positioning
3. **👥 Citizen perspective**: Policy impact on daily life, democratic access, public interest
4. **💰 Economic perspective**: Fiscal implications, business impact, labor market effects  
5. **🌍 International perspective**: EU compliance, Nordic cooperation, global positioning
6. **📰 Media perspective**: Newsworthiness, public attention, narrative framing

### Analytical Depth Ladder (All Articles MUST reach Intelligence Level)

| Level | Description | Pattern |
|---|---|---|
| ❌ Surface | Describes events | "The Riksdag voted on X" |
| ⚠️ Strategic | Explains motivations | "The coalition voted for X to secure SD support" |
| ✅ Intelligence | Reveals power dynamics | "The 13-vote margin exposes KD defection risk..." |

---

## Article Generation Protocol

### Step 1: Read Pre-Computed Analysis

```typescript
import { readDailyAnalysis, deriveArticleClassificationMeta } from '../../analysis-reader.js';

const analysis = await readDailyAnalysis(today);
const meta = deriveArticleClassificationMeta(analysis);
// meta.classificationLevel, meta.riskLevel, meta.confidenceLabel, meta.significanceScore
```

### Step 2: Apply Classification to Article Header

Set `classificationLevel`, `riskLevel`, and `confidenceLabel` on `ArticleData`:

```typescript
const html = generateArticleHTML({
  // ... other fields
  classificationLevel: meta.classificationLevel,  // 'HIGH'
  riskLevel: meta.riskLevel,                      // 'elevated'
  confidenceLabel: meta.confidenceLabel,           // 'HIGH'
  significance: meta.significanceScore,
  urgency: meta.urgency,
});
```

### Step 3: Use Pre-Computed SWOT

> **Note**: The `generateSwotSection()` function is an HTML renderer used by the article generation script. AI agents do NOT call this function directly. Instead, AI agents write SWOT analysis in markdown files — the script reads the analysis and calls this function to render HTML. `buildSwotFromDocs` below is pseudocode representing the fallback path.

When `analysis.swot` is available, the script passes it directly to `generateSwotSection()`:

```typescript
// Pseudocode — illustrative only; actual implementation is in generators.ts
import { generateSwotSection } from '../../data-transformers/content-generators/swot-section.js';

const swotHtml = analysis.swot
  ? generateSwotSection({ data: analysis.swot, lang })
  : generateSwotSection({ data: /* fallback: build from docs */ {}, lang });
```

### Step 4: Build Forward Indicators from Threat Analysis

When `analysis.threatAnalysis` is available, incorporate threat indicators into the "What to Watch Next" section:

```typescript
const forwardIndicators = analysis.synthesis?.forwardIndicators
  ?? analysis.threatAnalysis?.indicators.slice(0, 3)
  ?? buildDefaultForwardIndicators(docs);
```

---

## Political Intelligence Reporting Standards

### Accuracy Requirements
- All claims must be traceable to specific MCP data sources (document IDs, dates)
- Party positions must be attributed to named politicians or official party documents
- Statistical claims require source citation (SCB, World Bank, Riksdag database)
- Analytical claims must include confidence levels: [HIGH] (direct evidence) / [MEDIUM] (inference) / [LOW] (speculation)

### Attribution Standards
- Politicians: Full name + party: `"Ulf Kristersson (M)"`
- Documents: dok_id in parentheses: `"proposition 2025/26:1 (H9011)"`
- Vote records: Tally format: `"198 Ja / 148 Nej / 3 Avstår"`
- Statistics: Source + date: `"SCB Q4 2025"`

### Risk Indicator Usage
When `riskLevel` is 'high' or 'elevated', include inline ⚠️ risk indicators in the article body at relevant claims. Format:

```html
<span class="risk-indicator" aria-label="Risk indicator">⚠️</span>
```

### Threat Indicator Usage
When `analysis.threatAnalysis.indicators` contains items, tag relevant sections with 🎯 and link to the threat analysis context.

---

## Prohibited Patterns

❌ "Politicians discussed..." (vague, non-attributable)
❌ "Many believe..." (unattributed opinions)
❌ "This is important because..." (circular reasoning)
❌ Generic SWOT entries without evidence
❌ Missing confidence labels on analytical claims
❌ Analytical claims without risk/confidence tagging when classificationLevel is CRITICAL or HIGH
❌ Missing forward indicator section
❌ Regenerating SWOT inline when pre-computed SWOT is available

---

## Required Analytical Elements

✅ Named politicians with party affiliations
✅ Specific document references (dok_id, dates)
✅ Policy domain classification (from pre-computed analysis when available)
✅ Coalition/opposition dynamic context
✅ Historical precedent or trend comparison when available
✅ Forward-looking implication — from threat/risk analysis when available
✅ Confidence labels on all non-factual claims
✅ Risk indicators (⚠️) on high-risk claims
✅ Classification badge metadata in article HTML

---

## Article Type Depth Requirements

| Article Type | Classification | SWOT | Perspectives | Evidence Min |
|---|---|---|---|---|
| `breaking` | Badge required | Optional | Gov + Citizen | 2 points |
| `week-ahead` | Badge required | Optional | Gov + Opp + Economic | 3 points |
| `deep-inspection` | Full section | Pre-computed preferred | All 6 | 4+ points |
| `weekly-review` | Weekly summary | Comparative | Gov + Opp + Economic | Stats |
| `monthly-review` | Full threat model | Full strategic | All 6 | Stats + docs |
| `committee-reports` | Domain-specific | Policy domain | Gov + Citizen + Economic | 3+ docs |
| `propositions` | Legislative impact | Legislative | All 6 | Prop + committee |
| `motions` | Quick classification | Optional | Opp + Gov response | 2+ docs |
| `interpellations` | Accountability focus | Optional | Gov + Opp | Minister + interp |

---

## Language-Specific Notes

- **Swedish (sv)**: Use Riksdag terminology (interpellation, betänkande, proposition, motion)
- **English (en)**: Translate parliamentary terms with brief explanations
- **Arabic (ar)**: RTL layout — classification badges must be right-aligned
- **Hebrew (he)**: RTL layout — classification badges must be right-aligned
- **CJK (ja, ko, zh)**: Maintain evidence count; translate confidence labels

### Translation Context Requirements

When translating, always include in the translation prompt:
1. `classificationLevel` — "This is a [HIGH] classification article"
2. `riskLevel` — "Risk level: [elevated]"
3. Key political terminology glossary for the target language
4. All confidence labels must be translated (HIGH → 高, HOHE, HAUTE, etc.)

---

## Data Source Hierarchy

1. **Primary**: Pre-computed analysis files (`analysis/daily/YYYY-MM-DD/`)
2. **Secondary**: Live MCP data from riksdag-regering-mcp server
3. **Tertiary**: SCB statistics for economic context
4. **Quaternary**: World Bank indicators for international comparison
5. **Prohibited**: Existing news articles, cached stale data, AI-fabricated content

**NEVER generate content without MCP data confirmation.**
**ALWAYS use pre-computed analysis when available.**
