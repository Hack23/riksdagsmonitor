# Political Intelligence Style Guide

<!-- version: 1.0.0 | updated: 2026-03-26 | author: Hack23 AB -->

## Purpose

This style guide establishes standards for political intelligence reporting across all article types published by Riksdagsmonitor. Inspired by the [ISMS Style Guide](https://github.com/Hack23/ISMS-PUBLIC/blob/main/STYLE_GUIDE.md), it adapts documentation and communication standards to the domain of parliamentary intelligence reporting.

**Goal**: Every article must reach the Intelligence level of analysis — not surface-level reporting, not standard reporting, but strategic intelligence that exposes power dynamics, policy trajectories, and democratic risks.

---

## Classification System

### Classification Levels

| Level | Icon | Meaning | Use Case |
|---|---|---|---|
| **CRITICAL** | 🔴 | Constitutional threat / structural democratic risk | Government collapse, fundamental rights violations, major coalition rupture |
| **HIGH** | 🟠 | Major political development with wide impact | Budget decisions, significant legislation, coalition stress |
| **MEDIUM** | 🟡 | Notable policy development | Committee reports, interpellations, motions with clear policy stakes |
| **LOW** | 🟢 | Background / monitoring item | Routine procedural documents, low-stakes motions |

### Priority System

| Priority | Icon | Use Case |
|---|---|---|
| **Breaking** | 🔴 | Same-day publication required |
| **Major** | 🟠 | Publish within 24 hours |
| **Standard** | 🟡 | Normal publication cycle |
| **Background** | 🟢 | Evergreen / reference content |

### Classification Badge Format

Every article header must include a visible classification badge. Priority is captured in workflow metadata/urgency and is not rendered as a separate header badge in the current template:

```html
<span class="classification-badge classification-high" aria-label="Classification: HIGH">
  🟠 HIGH
</span>
```

**RTL Note**: For Arabic (`ar`) and Hebrew (`he`) articles, badges must use `dir="rtl"` and be positioned on the right side of the header.

---

## Article Structure Standards

### Universal Article Structure

Every article must follow this structure regardless of article type:

```
1. Article Metadata Header
   - Classification badge (🔴/🟠/🟡/🟢)
   - Date, author attribution, sources count
   - Confidence level indicator
   - Risk indicator badge when `riskLevel` is present

2. Analytical Lede (NOT a summary)
   - Frames political significance, not events
   - Names actors and stakes immediately
   - 50–80 words maximum

3. Factual Backbone
   - MCP-sourced evidence (minimum 3 data points)
   - Document IDs cited inline (e.g., dok_id: H901FiU1)
   - Vote tallies, speech references, dates

4. Strategic Analysis Body
   - At minimum: Government + Opposition perspectives
   - Evidence-tagged claims with confidence levels
   - Sub-headings required (h2 → h3 → h4 hierarchy)

5. Stakeholder Impact Assessment
   - Who wins / who loses / what changes
   - At minimum 2 parties cited

6. SWOT Section (where applicable)
   - Uses pre-computed analysis when available
   - Each entry: specific, evidence-based, confidence-tagged

7. Forward Indicator (mandatory)
   - "What to Watch Next" based on risk/threat analysis
   - 2–4 specific, time-bound indicators

8. Data Attribution Footer
   - Source methodology note
   - Confidence disclaimer
   - Analysis date and version
```

### Article Type-Specific Requirements

#### Breaking News 🔴

| Requirement | Standard |
|---|---|
| Classification | MUST include classification badge |
| Analysis depth | Quick classification + top risk + significance score |
| Word count | 300–500 words |
| Perspectives | Government + Citizen (minimum) |
| Style | Concise, fact-focused, forward indicator mandatory |
| SWOT | Not required (time constraint) |
| Evidence minimum | 2 MCP data points |
| Confidence labeling | Lead claim must be labeled HIGH/MEDIUM/LOW |
| Forward indicator | 1–2 specific next steps |

#### Daily Analysis 🟠

| Requirement | Standard |
|---|---|
| Classification | Full classification section |
| Analysis depth | Full classification + risk + SWOT + 6 perspectives |
| Word count | 600–900 words |
| Perspectives | All 6 required |
| Style | Balanced depth, evidence-rich |
| SWOT | Required — use pre-computed data when available |
| Evidence minimum | 3 MCP data points per main section |
| Confidence labeling | Every analytical claim labeled |
| Forward indicator | 3–4 specific next steps |

#### Evening / Deep Inspection Analysis 🟠

| Requirement | Standard |
|---|---|
| Classification | Full with trend indicators |
| Analysis depth | Deep SWOT + threat analysis + cross-references |
| Word count | 800–1,200 words |
| Perspectives | All 6 required, full depth |
| Style | Strategic depth, pattern recognition |
| SWOT | Mandatory — pre-computed data preferred |
| Evidence minimum | 4+ MCP data points per section |
| Confidence labeling | All claims labeled with reasoning |
| Forward indicator | 4–5 time-bound indicators + risk trajectory |

#### Weekly Review 🟡

| Requirement | Standard |
|---|---|
| Classification | Weekly classification summary |
| Analysis depth | Aggregated weekly trends + risk evolution + SWOT changes |
| Word count | 800–1,200 words |
| Perspectives | Government + Opposition + Economic (minimum) |
| Style | Trend-focused, strategic |
| SWOT | Comparative SWOT: this week vs. last week |
| Evidence minimum | Summary statistics with document counts |
| Confidence labeling | Trend claims must be labeled |
| Forward indicator | Week-ahead implications |

#### Monthly Review 🟡

| Requirement | Standard |
|---|---|
| Classification | Monthly intelligence classification |
| Analysis depth | Full threat model + strategic SWOT + risk register |
| Word count | 1,000–1,800 words |
| Perspectives | All 6 with historical depth |
| Style | Strategic assessment, long-term patterns |
| SWOT | Full strategic SWOT with evolution tracking |
| Evidence minimum | Monthly aggregate statistics |
| Confidence labeling | All strategic claims labeled |
| Forward indicator | Month-ahead strategic watch + 3-month horizon |

#### Committee Reports 🟡

| Requirement | Standard |
|---|---|
| Classification | Committee-specific classification + policy risk |
| Analysis depth | Domain-specific classification + policy risk |
| Word count | 500–800 words |
| Perspectives | Government + Citizen + Economic |
| Style | Technical depth, policy-focused |
| SWOT | Policy domain SWOT |
| Evidence minimum | Committee document citations |
| Confidence labeling | Technical claims must be labeled |
| Forward indicator | Legislative timeline indicators |

#### Propositions 🟠

| Requirement | Standard |
|---|---|
| Classification | Legislative impact classification + economic risk |
| Analysis depth | Legislative impact classification + economic risk |
| Word count | 600–900 words |
| Perspectives | All 6 |
| Style | Impact analysis, implementation assessment |
| SWOT | Legislative SWOT (coalition support vs. opposition) |
| Evidence minimum | Proposition document + committee response |
| Confidence labeling | All implementation claims labeled |
| Forward indicator | Passage probability + implementation timeline |

---

## Writing Quality Standards

### Analytical Depth Ladder

All articles MUST reach the **Intelligence Level**:

| Level | Description | Example |
|---|---|---|
| **Surface Level** ❌ | Describes events | "The Riksdag voted on proposition H901." |
| **Strategic Level** ⚠️ | Explains motivations | "The coalition voted for H901 to secure SD support." |
| **Intelligence Level** ✅ | Reveals power dynamics | "The 13-vote margin on H901 exposes KD defection risk: if two KD members align with opposition, the coalition loses its majority." |

### Evidence Density Requirements

| Article Type | Minimum Evidence Points per Section |
|---|---|
| Breaking news | 2 |
| Daily analysis | 3 |
| Deep inspection | 4 |
| Weekly/Monthly review | Statistical summaries |
| Committee/Propositions | 3 + document citations |

**Evidence must include**:
- Document ID (dok_id: `H901FiU1`)
- Date of document
- Named politician or party (full name + party abbreviation)
- Specific data point (vote tally, SEK amount, percentage)

### Attribution Standards

| Requirement | Standard |
|---|---|
| Politicians | Full name + party abbreviation: "Ulf Kristersson (M)" |
| Documents | dok_id in parentheses: "proposition 2025/26:1 (H9011)" |
| Vote records | Tally format: "198 Ja / 148 Nej / 3 Avstår" |
| Statistics | Source + date: "SCB Q4 2025 data" |
| Speeches | Speaker + date + chamber reference |

### Confidence Labeling

Every analytical claim (not factual statements) must carry a confidence label:

| Label | Criteria | Format |
|---|---|---|
| **HIGH** | Direct evidence from MCP data | `[HIGH]` or inline tag |
| **MEDIUM** | Reasonable inference from multiple sources | `[MEDIUM]` |
| **LOW** | Informed speculation, limited evidence | `[LOW]` |

**Claim format**:
```
The coalition will likely advance the housing reform proposal 
before the summer recess [MEDIUM — based on coalition 
agreement language in 2026 budget bill, H9011].
```

### Balanced Coverage Requirements

| Requirement | Minimum Standard |
|---|---|
| Parties cited | Minimum 2 (both coalition and opposition) |
| Coalition position | Government/coalition perspective required |
| Opposition position | At least one opposition party perspective required |
| Citizens impact | Required for domestic policy articles |

---

## Icon Conventions

### Classification and Risk Icons

| Icon | Use Case |
|---|---|
| 🔴 | Critical classification / Breaking priority / HIGH RISK |
| 🟠 | High classification / Major priority / ELEVATED RISK |
| 🟡 | Medium classification / Standard priority / MODERATE RISK |
| 🟢 | Low classification / Background priority / LOW RISK |
| ⚠️ | Risk indicator (used inline in text) |
| 🎯 | Threat indicator (used in threat analysis sections) |

### Stakeholder Icons

| Icon | Stakeholder |
|---|---|
| 🏛️ | Government / Coalition |
| ⚖️ | Opposition |
| 👥 | Citizens / Civil society |
| 💰 | Economic actors / Business |
| 🌍 | International / EU |
| 📰 | Media / Public discourse |

### SWOT Icons

| Icon | Quadrant |
|---|---|
| 💪 | Strengths |
| ⚡ | Weaknesses |
| 🚀 | Opportunities |
| ☁️ | Threats |

### Analysis Section Icons

| Icon | Use Case |
|---|---|
| 📊 | Data/Statistics section |
| 🔍 | Deep analysis section |
| 📋 | Document reference |
| 🗳️ | Voting record |
| 📅 | Timeline/Forward indicator |
| 🔗 | Cross-reference to related documents |

---

## Forward Indicator Requirements

Every article must end with a "What to Watch Next" section based on risk and threat analysis. This is mandatory and not optional.

### Forward Indicator Format

```markdown
## 📅 What to Watch Next

**[Timeframe]**: [Specific, measurable indicator]
**[Timeframe]**: [Specific, measurable indicator]
**[Timeframe]**: [Specific, measurable indicator]
```

**Example**:
```markdown
## 📅 What to Watch Next

**This week**: Vote on SoU20 committee report — 
SD's position determines coalition majority (watch 
for SD Riksdag group statement by Thursday)

**Next 2 weeks**: EU Commission review of Swedish 
housing market regulation — may trigger Article 7 
process if H901 is passed unchanged

**3-month horizon**: M leadership elections in April — 
outcome will reshape coalition negotiation dynamics 
on welfare reform timeline
```

### Indicator Quality Standards

- **Specific**: Name the document, party, or institution to watch
- **Time-bound**: Give a concrete timeframe (this week, next 2 weeks, etc.)
- **Actionable**: A reader should know exactly what to monitor
- **Risk-linked**: Connect to pre-computed risk or threat analysis when available

---

## Translation Quality Standards

### Multi-Language Adaptation

All 14 languages must maintain analytical depth. Translations must not:

- ❌ Lose confidence labels (HIGH/MEDIUM/LOW must be translated or retained)
- ❌ Drop attribution (politician names must remain in original Swedish form)
- ❌ Reduce evidence density (all dok_id references must remain)
- ❌ Omit forward indicators

### Language-Specific Rules

| Language | RTL | Special Requirements |
|---|---|---|
| `ar` (Arabic) | Yes | Classification badges right-aligned; numerical direction preserved |
| `he` (Hebrew) | Yes | Classification badges right-aligned; date format adapted |
| `ja` (Japanese) | No | Parliamentary terms explained in Japanese; Western-style dates retained |
| `ko` (Korean) | No | Party names transliterated (M → 보통당); document IDs retained |
| `zh` (Chinese) | No | Party names translated with pinyin; vote tallies in Arabic numerals |
| `sv` (Swedish) | No | Use native parliamentary terminology (interpellation, betänkande, proposition) |

### Translation Context Requirements

When translating, always provide:
1. Pre-computed classification level (so translator AI understands significance)
2. Key political terminology glossary for the target language
3. Analysis context summary (classification, risk level, key actors)

---

## Article Metadata Standards

### Required HTML Meta Tags

```html
<!-- Classification (required when classification is assigned) -->
<meta name="article:classification" content="HIGH|MEDIUM|LOW|CRITICAL">

<!-- Risk (required when risk is assigned) -->
<meta name="article:risk-level" content="high|elevated|moderate|low">

<!-- Confidence (required when confidence is assigned) -->
<meta name="article:confidence" content="HIGH|MEDIUM|LOW">

<!-- Analysis context (optional) -->
<meta name="article:significance" content="[0-100]">
```

### Schema.org Metadata

Articles must include `NewsArticle` structured data with:
- `datePublished` and `dateModified`
- `author` (James Pether Sörling)
- `keywords` from classification analysis
- `articleSection` matching the classification level

---

## Data Source Attribution

### Attribution Footer

Every article must include an attribution footer:

```html
<footer class="article-attribution">
  <p>Analysis based on live data from Swedish Riksdag Open Data API 
     (riksdag.se) via riksdag-regering-mcp server. 
     Pre-computed analysis: <time datetime="[date]">[date]</time>.
     Methodology: <a href="/analysis/methodologies/political-style-guide.md">
     Political Intelligence Style Guide v1.0</a>.
  </p>
  <p class="confidence-disclaimer">
    Confidence levels (HIGH/MEDIUM/LOW) reflect evidence quality and 
    analytical certainty at time of publication. Political situations 
    may evolve rapidly.
  </p>
</footer>
```

---

## Pre-Computed Analysis Integration

When `analysis/daily/YYYY-MM-DD/` files are available, article generators MUST consume them:

| Analysis File | Article Usage |
|---|---|
| `classification-results.md` | Article classification badge + meta tags |
| `risk-assessment.md` | Risk indicators inline + risk badge in header |
| `swot-analysis.md` | SWOT section (pre-computed preferred over inline generation) |
| `threat-analysis.md` | Forward indicator section + threat badges |
| `stakeholder-perspectives.md` | Multi-perspective sections |
| `significance-scoring.md` | Article significance meta tag + prioritization |
| `synthesis-summary.md` | Overall narrative direction for the lede |

When analysis files are absent, article generators must fall back to inline analysis using the existing SWOT and risk analysis modules.

---

## Prohibited Patterns

### Content Anti-Patterns

❌ **Vague attribution**: "Politicians discussed..." → Must name specific politicians
❌ **Unattributed opinions**: "Many believe..." → Must cite a named source
❌ **Circular reasoning**: "This is important because it matters..." → Must explain strategic significance
❌ **Generic SWOT entries**: "Strong leadership" → Must cite specific evidence
❌ **Missing opposition**: An article about government policy without opposition response
❌ **Missing forward indicator**: An article that ends with analysis but no "What to Watch Next"
❌ **Unlabeled analytical claims**: "The coalition will likely..." without confidence label
❌ **Fabricated content**: Any claim not traceable to MCP data or named sources

### Technical Anti-Patterns

❌ Inline JavaScript in article body
❌ Missing language switcher navigation
❌ `data-translate="true"` in non-Swedish articles
❌ Article word count below minimum for the article type
❌ Missing classification badge in article header
❌ Missing `article:classification` meta tag

---

## Document Control

| Field | Value |
|---|---|
| Version | 1.0.0 |
| Status | Active |
| Owner | Hack23 AB |
| Review Cycle | Quarterly |
| Next Review | 2026-06-26 |
| Related | `scripts/prompts/v1/political-analysis.md`, `scripts/analysis-reader.ts` |
| ISMS Reference | Secure_Development_Policy.md §4.2 |
