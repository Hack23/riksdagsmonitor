# Per-File Intelligence Analysis Prompt v2

<!-- version: 2.0.0 | updated: 2026-03-28 | author: Hack23 AB -->
<!-- Purpose: Instructs AI agents to perform deep per-file analysis of downloaded MCP data -->
<!-- Output: {id}.analysis.md alongside each data file in analysis/data/ -->

## Overview

You are performing **per-file political intelligence analysis** for Riksdagsmonitor. For each downloaded MCP data file, you will produce a comprehensive analysis markdown file stored alongside the data. This replaces the old batch daily analysis with deeper, evidence-based, per-document intelligence.

**Quality Standard:** Every analysis file must match the formatting quality of [SWOT.md](../../SWOT.md) and [THREAT_MODEL.md](../../THREAT_MODEL.md) — rich headers, color-coded Mermaid diagrams, evidence tables, and confidence labels.

---

## Required Reading (Before Analyzing ANY File)

Before starting analysis, you MUST read and internalize these methodology documents:

1. **`analysis/methodologies/ai-driven-analysis-guide.md`** — This is the master guide for per-file analysis
2. **`analysis/methodologies/political-swot-framework.md`** — Evidence hierarchy, confidence levels
3. **`analysis/methodologies/political-risk-methodology.md`** — 5×5 risk matrix
4. **`analysis/methodologies/political-threat-framework.md`** — STRIDE political adaptation
5. **`analysis/methodologies/political-classification-guide.md`** — Sensitivity and domain taxonomy
6. **`analysis/methodologies/political-style-guide.md`** — Writing standards
7. **`analysis/templates/per-file-political-intelligence.md`** — Output template

---

## Step-by-Step Protocol

### Step 1: Get the Catalog

```bash
npx tsx scripts/catalog-downloaded-data.ts --pending-only
```

This returns a JSON list of files that need analysis. Each entry has:
- `id` — file identifier
- `type` — document type (propositions, motions, votes, etc.)
- `path` — path to the JSON data file
- `analysisPath` — where to write the analysis markdown
- `meta` — sidecar metadata (fetch timestamp, source tool)

### Step 2: For Each Pending File

Read the JSON data file and apply the full analysis framework:

#### 2a. Extract Key Information

| Document Type | Key Fields to Extract |
|--------------|----------------------|
| **Propositions** | `dok_id`, `titel`, `rm`, `organ`, `datum`, `undertitel`, `summary` |
| **Motions** | `dok_id`, `titel`, `parti`, `rm`, `undertitel` |
| **Committee Reports** | `dok_id`, `titel`, `organ`, `rm`, `reservationer` |
| **Votes** | `votering_id`, `datum`, `ja`, `nej`, `avstar`, `franvarande`, `punkt` |
| **Speeches** | `anforande_id`, `talare`, `parti`, `debattnamn`, `anforandetext` |
| **Questions** | `dok_id`, `titel`, `parti`, `mottagare`, `svar` |
| **Interpellations** | `dok_id`, `titel`, `parti`, `mottagare`, `status` |
| **Government Docs** | `title`, `type`, `department`, `date`, `url` |
| **World Bank** | `indicator`, `country`, `date`, `value` |
| **SCB** | `table_id`, `variables`, `values` |

#### 2b. Apply Political Classification

Determine:
- **Sensitivity Level**: CRITICAL / HIGH / MEDIUM / LOW
- **Primary Domain**: MIG, DEF, ECO, ENV, JUS, HEA, EDU, FOR, etc.
- **Urgency**: IMMEDIATE / SHORT-TERM / MEDIUM-TERM / LONG-TERM
- **Significance Score**: 0–10

Use the classification decision tree from `political-classification-guide.md`.

#### 2c. Generate SWOT Impact

For each document, assess impact on:
1. **Government coalition** (M + KD + L + SD support)
2. **Opposition** (S, V, MP, C)

Each SWOT entry MUST have:
- Evidence (dok_id or statistical reference)
- Confidence level (HIGH / MEDIUM / LOW)
- Impact level (HIGH / MEDIUM / LOW)

**No opinion-based entries.** If you cannot find evidence, note "Insufficient evidence" rather than speculating.

#### 2d. Risk Assessment

Apply the 5×5 Likelihood × Impact matrix:
- **Coalition Stability Risk** — does this threaten SD support agreement?
- **Policy Implementation Risk** — can the government deliver on this?
- **Electoral Risk** — how does this affect 2026 election positioning?
- **Democratic Process Risk** — any institutional or procedural concerns?

#### 2e. STRIDE Threat Analysis

Map to political STRIDE categories (only where applicable — not every document has threats):
- 🎭 **Spoofing** → Misrepresentation of political positions
- 🔧 **Tampering** → Process manipulation, rule bending
- 📝 **Repudiation** → Accountability evasion, position reversal
- 🔓 **Info Disclosure** → Premature intelligence leaks
- 🚫 **Denial of Service** → Parliamentary obstruction
- ⬆️ **Elevation** → Executive overreach

#### 2f. Stakeholder Impact Matrix

Apply all 6 analytical lenses:
1. 🏛️ Government — coalition stability, policy agenda
2. ⚖️ Opposition — scrutiny opportunities, policy alternatives
3. 👥 Citizens — service impact, rights, daily life
4. 💰 Economic — fiscal, business, labour market
5. 🌍 International — EU, Nordic, foreign policy
6. 📰 Media — newsworthiness, narrative potential

#### 2g. Forward Indicators

List 1–3 specific things to monitor as consequences of this document. Be specific:
- ❌ Bad: "Monitor the situation"
- ✅ Good: "Watch for SD floor vote on budget motion FiU10 (expected week 14)"

### Step 3: Write Analysis File

Write the completed analysis to `{analysisPath}` using the per-file-political-intelligence template. Ensure:

- All `[REQUIRED]` placeholders are replaced with actual analysis
- At least 1 Mermaid diagram uses document-specific data (not just template placeholders)
- Color-coded Mermaid styles follow the convention:
  ```
  style X fill:#dc3545,color:#fff   /* Red — critical */
  style X fill:#fd7e14,color:#fff   /* Orange — high */
  style X fill:#ffc107,color:#000   /* Yellow — medium */
  style X fill:#28a745,color:#fff   /* Green — low/good */
  style X fill:#0d6efd,color:#fff   /* Blue — info */
  style X fill:#6f42c1,color:#fff   /* Purple — special */
  ```

### Step 4: Compose Synthesis

After analyzing all pending files, compose the daily synthesis:

1. Read all `.analysis.md` files from the analysis period
2. Rank documents by significance score
3. Aggregate SWOT entries per the aggregation rules in `political-swot-framework.md`
4. Compute overall risk landscape
5. Write to `analysis/daily/YYYY-MM-DD/synthesis-summary.md`

---

## Quality Checklist (Self-Assessment)

Before finalizing each analysis file, verify:

| # | Check | Pass? |
|---|-------|:-----:|
| 1 | Executive summary is intelligence-level (not surface) | ☐ |
| 2 | ≥ 3 evidence points with dok_id or source | ☐ |
| 3 | Every analytical claim has confidence label | ☐ |
| 4 | At least 1 Mermaid diagram with document-specific data | ☐ |
| 5 | SWOT has at least 2 filled quadrants | ☐ |
| 6 | Risk matrix has numeric scores | ☐ |
| 7 | Forward indicators are specific and actionable | ☐ |
| 8 | All `[REQUIRED]` placeholders are replaced | ☐ |
| 9 | Politicians named with party abbreviation | ☐ |
| 10 | No boilerplate or generic text | ☐ |

**Minimum passing score: 8/10**

---

## Prohibited Patterns

❌ Empty tables with `[REQUIRED]` placeholders still present
❌ Generic text like "This is significant because..." without evidence
❌ SWOT entries without dok_id or source reference
❌ Missing confidence labels on analytical claims
❌ Batch summaries that don't reference individual documents
❌ Re-running analysis on files that already have `.analysis.md`
❌ Template-only Mermaid diagrams (must contain real data)
❌ Unattributed political claims ("many believe...")

---

## Integration Notes

- **Catalog script**: `scripts/catalog-downloaded-data.ts`
- **Data download**: `scripts/populate-analysis-data.ts` (unchanged — scripts for downloading OK)
- **Template**: `analysis/templates/per-file-political-intelligence.md`
- **Methodology**: `analysis/methodologies/ai-driven-analysis-guide.md`
- **Output location**: `analysis/data/{type}/{id}.analysis.md` (next to `{id}.json`)
- **Daily synthesis**: `analysis/daily/YYYY-MM-DD/synthesis-summary.md` (composed from per-file analyses)
