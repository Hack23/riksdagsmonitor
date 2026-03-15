# SWOT Analysis Generation Template v1

<!-- version: 1.0.0 | updated: 2026-03-14 | author: Hack23 AB -->

## SWOT Generation Framework for Parliamentary Analysis

Use this framework to generate SWOT analysis sections for deep-inspection and evening analysis articles.

### What Makes a Good Parliamentary SWOT

A parliamentary SWOT analysis examines political actors (parties, coalitions, individual politicians) or policy areas through:

- **Strengths**: Current advantages, resources, parliamentary position, public support
- **Weaknesses**: Vulnerabilities, internal conflicts, declining support, policy failures
- **Opportunities**: Upcoming legislative windows, alliance possibilities, electoral openings
- **Threats**: Opposition challenges, public backlash, coalition fragility, economic headwinds

### SWOT Entry Quality Standards

Each SWOT entry must:
- Be traceable to specific MCP data (document ID, vote record, speech reference)
- Assign a confidence level: `HIGH` (direct evidence), `MEDIUM` (inference), `LOW` (speculation)
- Be unique — no generic boilerplate entries
- Be current — use data from the current parliamentary session

### Prohibited SWOT Entries

❌ "Strong leadership" (unattributed, unquantified)
❌ "Policy uncertainty" (too generic)
❌ "Public support" without polling data reference
❌ Identical entries across different parties
❌ Historical entries not relevant to current session

### SWOT Entry Format

> **Note**: The format below is a template structure (pseudocode), not executable code. See the concrete example below.

```
[Strength/Weakness/Opportunity/Threat]:
- Statement: [Specific, evidence-based claim]
- Evidence: [dok_id, vote reference, or speech reference]
- Confidence: HIGH/MEDIUM/LOW
- Impact: HIGH/MEDIUM/LOW
```

**Concrete example:**
```
[Strength — Government coalition]:
- Statement: Budget surplus of 15 billion SEK provides room for pre-election social spending
- Evidence: FiU10 committee report, prop. 2025/26:1
- Confidence: HIGH
- Impact: HIGH
```

### Multi-Stakeholder SWOT

For articles covering multiple parties or stakeholders, generate separate SWOT for:

1. **Government coalition** (M, KD, L with SD support)
2. **Main opposition** (S as largest opposition party)
3. **Policy domain stakeholders** (affected ministries, interest groups)

### Swedish Political Context for SWOT

**Government coalition strengths**: Budget majority, ministerial control, agenda-setting
**Government coalition weaknesses**: SD dependency, narrow majority, internal tensions
**Opposition strengths**: Policy alternatives, scrutiny tools, public sympathy
**Opposition weaknesses**: Internal fragmentation (S+V+MP coalition building challenges)

### Integration with Article Template

SWOT sections are rendered by `generateSwotSection()` in:
`scripts/data-transformers/content-generators/swot-section.ts`

Pass SWOT data as `SwotSectionOptions.data` (a `SwotData` object with four quadrants: `strengths`, `weaknesses`, `opportunities`, `threats`) and include impact metadata on each entry. The `SwotEntry` type supports a `text` field and an optional `impact` level (`'high'` | `'medium'` | `'low'`).

```typescript
// Example: generating a SWOT section
const section = generateSwotSection({
  data: {
    subject: 'Socialdemokraterna (S)',
    strengths: [{ text: 'Largest party', impact: 'high' }],
    weaknesses: [{ text: 'Internal divisions', impact: 'medium' }],
    opportunities: [{ text: 'Rising voter concern on welfare', impact: 'high' }],
    threats: [{ text: 'Coalition fragmentation', impact: 'medium' }],
  },
  lang: 'en',
});
```
