<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">✍️ Political Intelligence Style Guide</h1>

<p align="center">
  <strong>📊 Intelligence Writing Standards for Deep Political Analysis</strong><br>
  <em>🎯 Evidence Density · Attribution · Analytical Depth · Multi-Framework Consistency</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-2.1-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--04--06-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 2.1 | **📅 Last Updated:** 2026-04-06 (UTC)  
**🔄 Review Cycle:** Quarterly | **⏰ Next Review:** 2026-06-30  
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

---

## 🎯 Purpose

This style guide establishes **intelligence-grade writing standards** for all political analysis produced by Riksdagsmonitor's agentic workflows. Every piece of analysis must demonstrate genuine analytical depth — not surface-level summaries or script-generated content. The quality standard is [SWOT.md](../../SWOT.md) and [THREAT_MODEL.md](../../THREAT_MODEL.md).

This adapts [Hack23 ISMS STYLE_GUIDE.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/STYLE_GUIDE.md) for political intelligence contexts. See [reference/isms-style-guide-adaptation.md](../reference/isms-style-guide-adaptation.md) for the full ISMS mapping.

---

## 🚨 Intelligence Depth Standards (New in v2.0)

### What Distinguishes Intelligence from Summary

| ✅ Intelligence Analysis | 🚫 Summary/Shallow Content |
|-------------------------|---------------------------|
| Explains **why** something matters, not just what happened | Restates what happened without interpretation |
| Identifies **who benefits and who loses** (cui bono) | Names no specific actors or interests |
| Cross-references with **other documents, votes, and trends** | Treats each document in isolation |
| Provides **forward-looking assessment** (what happens next?) | Only describes current state |
| Explicitly states **confidence level** and cites evidence | Makes claims without attribution |
| Identifies **tensions, contradictions, and hidden dynamics** | Only reports the official narrative |
| Uses **multiple analytical frameworks** (SWOT, Risk, Attack Tree) | Uses no framework or only one |

### Minimum Evidence Density Requirements

| Analysis Type | Min. Evidence Points | Min. dok_id Citations | Min. Named Actors |
|-------------|:--------------------:|:--------------------:|:-----------------:|
| Per-file analysis | 3 | 2 | 2 |
| Daily SWOT | 8 (≥2 per quadrant) | 4 | 4 |
| Risk assessment | 5 | 3 | 3 |
| Threat analysis | 6 | 3 | 3 |
| Synthesis summary | 10 | 5 | 5 |

### Analytical Depth Indicators

Every analysis file should demonstrate at least 3 of these 5 depth indicators:

1. **Cui Bono Analysis** — Who benefits from this development? Who is harmed?
2. **Second-Order Effects** — What cascading consequences follow from this event?
3. **Historical Parallels** — Has something similar happened before? What was the outcome?
4. **Counter-Factual Reasoning** — What would happen if the opposite occurred?
5. **Tension Identification** — What contradictions or competing interests does this reveal?

---

## 📊 Analytical Depth Standards

Three permitted depth levels define what analysis is appropriate for each content type:

### Level 1: Surface Analysis

**Definition:** Factual reporting of what happened, who was involved, and when. No inference, no interpretation, no prediction.

**When to use:** Breaking news, routine parliamentary reporting, event summaries.

**Example (Surface ✅):**  
> "The Riksdag voted 176–173 on 2026-03-25 to pass Budget Proposition 2025/26:1 (punkt 5.3 — defence appropriation). SD, M, KD, and L voted in favour; S, V, and MP voted against."

**Prohibited at Surface level:** Statements like "this signals..." or "experts believe..." or any forward-looking claim.

---

### Level 2: Strategic Analysis

**Definition:** Interpretation of what the event means in its political context. Identifies patterns, explains motivations with evidence, and draws connections to related events.

**When to use:** Daily news articles, weekly briefings, stakeholder assessments.

**Example (Strategic ✅):**  
> "The 176–173 margin on the defence appropriation — the smallest possible majority — reveals that the Tidökoalition's parliamentary base has thinned since the September 2022 election. SD's conditional support, documented in Tidöavtalet (dok_id: XXXX), remains the single binding constraint on M's ability to govern. A three-seat shift would collapse the government's budget majority."

**Prohibited at Strategic level:** Unsourced claims about motivations ("SD secretly wants to..."), predictions without probability notation.

---

### Level 3: Intelligence Analysis

**Definition:** Forward-looking assessment with explicit probability notation, scenario modelling, and risk quantification. Requires the full analytical framework (classification + risk + SWOT + threat).

**When to use:** Weekly strategic briefings, monthly intelligence reports, breaking analysis of crisis events.

**Example (Intelligence ✅):**  
> "Based on the 176–173 defence vote margin (dok_id: XXXX) and the L party leader's parliamentary statement (anförande 2026-03-25), we assess **MEDIUM probability (25–40%)** that L will abstain rather than vote Nej on the immigration regulation amendment scheduled for April 2026. This would reduce the effective coalition majority to 172, creating a governance crisis scenario with **HIGH impact** (score 12/25) per political-risk-methodology.md calibration."

---

## 👤 Attribution Standards

### Politician Attribution Rules

| Context | Format | Example |
|---------|--------|---------|
| First mention | Full name + role | "Statsminister Ulf Kristersson (M)" |
| Subsequent mentions | Last name or role | "Kristersson" or "Statsministern" |
| Formal documents | Full name + party | "Ulf Kristersson (M)" |
| Group reference | Party abbreviation | "M-ledningen", "SD-gruppen" |

### Document Attribution Rules

All factual claims about parliamentary actions **must** cite a `dok_id`:

| Claim Type | Required Citation |
|-----------|------------------|
| Legislation passed/failed | `dok_id` of proposition + vote date |
| Committee recommendation | `dok_id` of betänkande |
| Minister's statement | Anförande reference (date + debate) |
| Government policy | `dok_id` of proposition or `skr` |
| Budget figure | `dok_id` of budget proposition + paragraph |

**Format:** `(dok_id: H9012345)` or `(prop 2025/26:123, p. 45)`

### What Must Never Be Attributed Without Evidence

- Party "plans" or "intends" (unless from official document)
- Politician "believes" or "feels" (unless from direct quote in anförande)
- Coalition "will" do X (unless from Tidöavtal or formal agreement)
- Poll-based claims without pollster name + date

---

## 🎯 Confidence Level Notation

Confidence levels must be explicitly stated when making analytical claims:

| Level | Notation | When to Use |
|-------|----------|-------------|
| **HIGH** | `[HIGH confidence]` or 🟢 | Multiple corroborating primary sources; official documents |
| **MEDIUM** | `[MEDIUM confidence]` or 🟡 | Single primary source or multiple secondary sources |
| **LOW** | `[LOW confidence]` or 🔴 | Single unverified source or inference from indirect evidence |

**Example:**  
> "SD is likely [MEDIUM confidence] to oppose the proposed healthcare reform if the final text retains the family reunification provisions, based on SD's stated position in anförande 2026-02-14 (single source)."

---

## 🚫 Prohibited Patterns

The following writing patterns are prohibited in all Riksdagsmonitor content:

| ❌ Prohibited | ✅ Required Alternative |
|-------------|------------------------|
| "Sources say..." | Name the source or cite dok_id |
| "Experts believe..." | Quote named expert with affiliation |
| "It is believed that..." | "According to [source]..." |
| "The public is concerned..." | "Polls show X% concern about Y [pollster, date]" |
| "This is a disaster for..." | Analytical scoring: "Risk score: 15/25 (Critical)" |
| "Obviously..." | State the evidence without editorialising |
| "Surprisingly..." | Report the deviation from expectation with data |
| Unnamed party members | Always name or use "anonymous source" with explicit LOW confidence |
| Future certainty ("will") without evidence | "is likely to" + confidence level |
| Hyperbolic adjectives | Specific measurable descriptions |

---

## 🎨 Icon & Emoji Conventions

Consistent emoji usage matches the repository's existing documentation pattern:

### Policy Domain Icons

| Domain | Icon | Usage |
|--------|------|-------|
| Economics & Finance | 💰 | Budget, taxes, economic indicators |
| Defence & Security | 🛡️ | Military, SÄPO, NATO |
| Justice & Law | ⚖️ | Courts, police, criminal law |
| Social Policy | 🤝 | Welfare, pensions, disability |
| Health | 🏥 | Healthcare funding, public health |
| Education | 📚 | Schools, universities, research |
| Environment | 🌿 | Climate, biodiversity, water |
| Agriculture | 🌾 | Farming, food security |
| Infrastructure | 🏗️ | Transport, housing, digital |
| Energy | ⚡ | Nuclear, renewable, grid |
| Foreign Affairs | 🌍 | EU, NATO, bilateral |
| Migration | 🔀 | Asylum, integration, border |
| Constitution | 🏛️ | Democracy, elections, procedure |

### Status & Assessment Icons

| Concept | Icon | Usage |
|---------|------|-------|
| Strength | ✅ | SWOT strengths |
| Weakness | ⚠️ | SWOT weaknesses |
| Opportunity | 🚀 | SWOT opportunities |
| Threat | 🔴 | SWOT threats |
| Breaking news | ⚡ | Significance ≥ 9.0 |
| Monitor | 📋 | Watch-only, no publish |
| Archive | 🗄️ | Low significance |
| High confidence | 🟢 | Evidence quality |
| Medium confidence | 🟡 | Evidence quality |
| Low confidence | 🔴 | Evidence quality |
| Coalition | 🤝 | Coalition dynamics |
| Opposition | 🗳️ | Opposition analysis |

---

## 🌐 Multi-Language Consistency (14 Languages)

All 14 supported languages (SV, EN, DA, NO, FI, DE, FR, ES, NL, AR, HE, JA, KO, ZH) must maintain:

### Consistency Requirements

1. **Proper nouns stay in Swedish** (source language) for official names:
   - Party names: "Moderaterna", "Sverigedemokraterna" — **not** "The Moderates"
   - Institutions: "Riksdag", "Finansutskottet" — **not** "the Finance Committee"
   - Roles: "Statsminister" — translate to "Prime Minister" in English only when needed for clarity

2. **dok_ids are universal** — never translated; always cited in original format

3. **Confidence levels** are translated but must convey equivalent epistemic weight:
   - HIGH → Hög (SV) / High (EN) / Hoch (DE) / Alto (ES/FR)
   - MEDIUM → Medel / Medium / Mittel / Moyen
   - LOW → Låg / Low / Niedrig / Bas

4. **Date formats** use ISO 8601 (YYYY-MM-DD) universally — never localised

5. **Numerical values** use the language's natural decimal separator:
   - Swedish/German/French: comma (176,5 miljoner)
   - English: period (176.5 million)

### Translation Quality Bar

Translations must preserve:
- Analytical confidence level (not soften or harden the claim)
- All dok_id citations
- Party names in Swedish with translation in parentheses on first use
- Numerical precision

**Reference:** `scripts/prompts/v2/political-analysis.md` for LLM translation prompts.

---

## 🔗 Related Documents

- [reference/isms-style-guide-adaptation.md](../reference/isms-style-guide-adaptation.md) — ISMS mapping
- [scripts/prompts/v2/political-analysis.md](../../scripts/prompts/v2/political-analysis.md) — LLM prompts
- [political-classification-guide.md](political-classification-guide.md) — Classification (determines depth level)
- [TRANSLATION_GUIDE.md](../../TRANSLATION_GUIDE.md) — Multi-language translation guide

---

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

Every article header must include a visible classification badge when `classificationLevel` is assigned. Priority is captured in workflow metadata/urgency and is not rendered as a separate header badge in the current template:

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
   - Confidence level metadata (`<meta name="article:confidence">`) in the current template
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

## 📏 Evidence Density Requirements

All analysis must meet minimum evidence thresholds scaled by content scope. These requirements ensure every published piece is traceable to verifiable Riksdag data.

| Analysis Type | Min. Citations | Min. dok_id References | Min. MCP Data Points |
|---|:---:|:---:|:---:|
| Per-file analysis | 3 | 1 (the file itself) | 2 cross-references |
| Daily synthesis | 8 | 5 | 5 |
| Weekly brief | 15 | 10 | 10 |
| Monthly strategic brief | 30 | 20 | 20 |
| Coalition dynamics | 20 | 15 | 15 |
| Party scorecard | 10 | 5 | 8 |

**Enforcement:** Analysis files that fall below the minimum thresholds for their type must be flagged for revision before publication. Editors and reviewers must manually verify citation counts and evidence density during review; existing tooling (including `scripts/analysis-reader.ts`) supports parsing and inspection of citations but does not yet enforce these thresholds automatically.

---

## 📎 Citation Format

All citations must be machine-parseable and human-readable. Use the following three formats consistently across all analysis types.

### Inline Citation

Use when referencing MCP query results or computed metrics within running text:

> "M-KD-L coalition voting cohesion dropped to 72% in March 2026 (riksdag-regering-mcp search_voteringar, rm=2025/26)."

### Riksdag Document Reference

Use when citing a specific betänkande, proposition, motion, or interpellation by its dok_id:

> "Betänkande 2025/26:JuU15, voted 2026-03-15 with 176 Ja, 173 Nej."

Format: `[riksmöte]:[utskott][nummer]` followed by votering outcome (Ja/Nej/Avstår/Frånvarande counts).

### MCP Data Reference

Use in data source attribution sections and methodology footnotes:

> "Data source: riksdag-regering-mcp get_betankanden, rm=2025/26, organ=JuU"

Always include the MCP tool name, the query parameters used, and the riksmöte scope.

---

## 🌍 Multi-Language Writing Standards

Riksdagsmonitor publishes in 14 languages (SV, EN, DA, NO, FI, DE, FR, ES, NL, AR, HE, JA, KO, ZH). To ensure translation quality and consistency, all source analysis must follow these rules:

### Rule 1: Avoid Idioms and Figurative Language

Idiomatic expressions do not translate reliably and obscure meaning for non-native speakers.

| ❌ Idiomatic | ✅ Plain Language |
|---|---|
| "The bill sailed through committee" | "The committee approved the bill by a large margin" |
| "The opposition dug in their heels" | "The opposition maintained its position" |
| "A political hot potato" | "A politically sensitive issue" |

### Rule 2: Full Titles on First Reference

Always spell out the full Swedish name with abbreviation in parentheses on first use:

- "Sverigedemokraterna (SD) voted against the proposition."
- "Socialdemokraterna (S) proposed an alternative motion."

### Rule 3: Spell Out Abbreviations

Utskott and other institutional abbreviations must be expanded on first reference:

- "Justitieutskottet (JuU) published its betänkande on 2026-03-15."
- "Finansutskottet (FiU) rejected the motion in its preliminary review."

### Rule 4: Consistent Terminology Within a Document

Never alternate between Swedish and English terms for the same concept within a single document.

| ✅ Consistent | ❌ Inconsistent |
|---|---|
| "utskottet" used throughout | Switching between "utskottet" and "the committee" |
| "betänkande" used throughout | Switching between "betänkande" and "committee report" |

### Rule 5: Active Voice

Prefer active voice for clarity and directness:

| ❌ Passive | ✅ Active |
|---|---|
| "The proposition was rejected by the Riksdag" | "The Riksdag rejected the proposition" |
| "A reservation was filed by V" | "V filed a reservation" |

### Rule 6: Swedish Parliamentary Terms in Analytical Context

When writing analysis (as opposed to translated news articles), always use the canonical Swedish parliamentary terms:

| ✅ Analytical Context | ❌ Avoid in Analysis |
|---|---|
| betänkande | committee report |
| reservation | dissenting opinion |
| votering | vote |
| anförande | speech / debate contribution |
| utskott | committee |
| proposition | government bill |
| motion | parliamentary motion |
| interpellation | interpellation (no translation needed) |

English-language equivalents may appear in parentheses on first use for non-Swedish audiences but must not replace the Swedish term in analytical text.

---

## ✅ Good vs Bad Examples

### ❌ BAD: Generic, No Evidence

The following fails every quality standard — no citations, no dok_ids, no quantified metrics, no named actors:

> "The political situation is complex. There are various risks including coalition instability and policy challenges. The overall risk level is medium."

**Why this fails:**
- Zero dok_id references
- No named actors (which parties? which ledamöter?)
- "Various risks" — unspecified and unquantified
- "Medium" risk level — no scoring framework applied
- No confidence level stated
- No forward-looking assessment

### ✅ GOOD: Evidence-Based, Structured, Quantified

The following demonstrates proper intelligence-grade writing:

> **Coalition Stability Risk Assessment — March 2026**
>
> | Risk Factor | L (1–5) | I (1–5) | Score | Trend | Key Evidence |
> |---|:---:|:---:|:---:|:---:|---|
> | Budget disagreement (defence spending) | 4 | 5 | 20 | ↑ | Betänkande 2025/26:FöU5, reservation by L (dok_id: HC01FöU5) |
> | SD–M migration policy tension | 3 | 4 | 12 | → | Interpellation 2025/26:412, anförande by Jimmie Åkesson 2026-03-10 |
> | L threshold risk (4% barrier) | 4 | 5 | 20 | ↑ | SCB partisympatiundersökning 2026-03, L at 4.2% (±1.1%) |
>
> **Assessment [HIGH confidence]:** The Tidö coalition faces critical stress on two axes — defence spending (Score: 20/25) and L's proximity to the parliamentary threshold (Score: 20/25). If L falls below 4% in the September 2026 election, the coalition loses its Riksdag majority regardless of other party performance (riksdag-regering-mcp get_voting_group, rm=2025/26).
>
> **What to Watch Next:** FöU scheduled votering on 2026-04-02 for betänkande 2025/26:FöU8; L's position on the final text will signal coalition cohesion.

**Why this succeeds:**
- 3 dok_id references with specific betänkande and interpellation citations
- Named actors (L, SD, M, Jimmie Åkesson)
- Quantified risk scores using L×I framework
- Explicit confidence level `[HIGH confidence]`
- Trend indicators (↑ →)
- Forward-looking "What to Watch Next" with specific date and event
- MCP data source attribution

---

## 🔄 Bad→Good Rewrite Examples (v2.1)

For each prohibited pattern, this section shows a concrete rewrite demonstrating how to transform banned content into intelligence-grade analysis with specific evidence, named actors, and MCP data references.

### Example 1: Vague Attribution → Named Actor with Evidence

❌ **BANNED:**
> "Politicians discussed the new migration policy during the session, with various parties expressing different views."

✅ **REWRITE:**
> Justitieminister Gunnar Strömmer (M) presented prop. 2025/26:117 on mandatory detention during the JuU committee hearing on 2026-03-12. Socialdemokraternas rättspolitiska talesperson Ardalan Shekarabi responded that S "cannot support a measure that violates ECHR Article 5(1)" (anförande 2026-03-12, search_anforanden). Vänsterpartiet (V) and Miljöpartiet (MP) filed joint reservations in the committee report (dok_id: HC01JuU15).

**What changed:** Named 3 parties and 2 individuals, cited a specific proposition, dok_id, and MCP source.

---

### Example 2: Unattributed Opinions → Sourced Claims

❌ **BANNED:**
> "Many believe the coalition may face difficulties in the coming months as various risks emerge."

✅ **REWRITE:**
> Coalition stability risk scores L=3, I=5, Score=15 [HIGH confidence], driven by SD's formal demand for stricter migration enforcement via interpellation 2025/26:412 (dok_id: HD04567). Novus polling (2026-03-28) shows M+KD+L+SD combined support at 48.3% (±2.1%), below the 50% threshold for the first time since the 2022 election.

**What changed:** Replaced "many believe" with quantified risk scores, specific MCP-traced evidence, and named polling data with margin of error.

---

### Example 3: Circular Reasoning → Strategic Significance

❌ **BANNED:**
> "This is an important development because it matters for Swedish politics and could have significant implications."

✅ **REWRITE:**
> FöU's adoption of bet. 2025/26:FöU8 on defence spending (191 Ja, 158 Nej; search_voteringar rm=2025/26) establishes Sweden's first NATO-era defence budget at 2.1% of GDP. The vote margin (33 seats) conceals a coalition fracture: Liberalerna (L) filed a reservation opposing the cyber defence allocation (dok_id: HC01FöU8, reservation §4), signaling policy divergence that could cascade into the autumn budget negotiation if FiU attempts to reallocate the funds.

**What changed:** Replaced circular "important because it matters" with specific vote counts, budget figures, a named committee fracture, and a forward-looking cascading risk assessment.

---

### Example 4: Generic SWOT Entries → Evidence-Based Assessment

❌ **BANNED:**
> **Strength:** "Strong leadership" | **Threat:** "Various risks"

✅ **REWRITE:**
> | Quadrant | Entry | Confidence | Evidence |
> |:---|:---|:---:|:---|
> | **Strength** | Ulf Kristersson (M) maintained coalition discipline through 14 consecutive contested votes (Jan–Mar 2026), losing only 1 (FöU8 L defection) | HIGH | search_voteringar rm=2025/26, party=M; 93% voting cohesion rate |
> | **Threat** | SD interpellation 2025/26:412 explicitly threatens to withdraw budget support unless migration enforcement benchmarks are met by 2026-06-01 | HIGH | dok_id: HD04567; Jimmie Åkesson plenary speech 2026-03-15 |

**What changed:** "Strong leadership" became a quantified voting cohesion claim with 14 specific votes and 93% rate. "Various risks" became a specific, dated, dok_id-backed threat with a named deadline.

---

### Example 5: Missing Opposition → Balanced Coverage

❌ **BANNED:**
> "The government's new education reform will modernize Swedish schools and improve learning outcomes for students across the country."

✅ **REWRITE:**
> The government's education reform (prop. 2025/26:89, dok_id: HD02345) restructures the gymnasieskola curriculum with emphasis on STEM pathways. UbU approved the proposition 9-6 (get_betankanden organ=UbU, rm=2025/26). **Opposition response:** Socialdemokraternas utbildningspolitiska talesperson Lina Axelsson Kihlblom called the reform "a step backwards for equity" (anförande 2026-03-20), while Centerpartiet (C) filed a reservation proposing a parallel vocational training track (HC01UbU12, reservation §2). [ASSESSMENT: Reform likely passes plenary but faces implementation resistance from kommuner — MEDIUM confidence]

**What changed:** Added opposition voices (S spokesperson by name, C reservation with dok_id), balanced government framing with critique, and added confidence-labeled assessment.

---

### Example 6: Missing Forward Indicator → Actionable Watch List

❌ **BANNED:**
> "The situation will continue to develop and may change in the future."

✅ **REWRITE:**
> **What to Watch Next:**
> - 📅 **[YYYY-MM-DD]:** Plenary votering on bet. 2025/26:JuU15 — L's plenary vote will signal coalition cohesion on justice policy
> - 📅 **[YYYY-MM-DD]:** FiU spring amending budget deadline — SD budget demands must be resolved before this date
> - 📅 **[YYYY-MM-DD]:** SCB partisympatiundersökning Q1 release — L's polling position relative to 4% threshold
> - **Trigger:** If Liberalerna (L) votes against JuU15 in plenary AND SCB shows Liberalerna below 4%, Coalition Risk escalates from Likelihood=3, Impact=5, Score=15 to Likelihood=4, Impact=5, Score=20

**What changed:** Replaced a vague future reference with placeholder-dated events, specific MCP-observable triggers, and a quantified escalation pathway.

---

### Example 7: Unlabeled Analytical Claims → Confidence-Labeled Assessment

❌ **BANNED:**
> "The coalition will likely survive until the next election, although there are some challenges ahead."

✅ **REWRITE:**
> The Tidö coalition's survival probability through September 2026 is assessed at **65%** [MEDIUM confidence]. Supporting evidence: 14 consecutive votes sustained (search_voteringar rm=2025/26), Tidöavtal renegotiation scheduled Q2 2026 (government press release 2026-03-01). Countervailing evidence: SD interpellation ultimatum (dok_id: HD04567) creates a binary trigger event by 2026-06-01. If SD migration benchmarks are unmet, survival probability drops to **35%** [LOW confidence — contingent on SD leadership decision]. Calibrated against "SD conditionally supports government" scenario (risk-methodology §Calibration Examples, Scenario 4).

**What changed:** "Likely survive" became a 65% probability with confidence label, dual evidence chains (supporting and countervailing), a named contingency, and calibration anchor.

---

### Example 8: Fabricated Content → MCP-Traceable Claims

❌ **BANNED:**
> "According to recent reports, several members of parliament have raised concerns about the government's handling of the energy crisis."

✅ **REWRITE:**
> Three interpellationer filed in March 2026 target the government's energy policy:
> 1. **2025/26:398** by Kajsa Fredholm (V) — questioning Vattenfall restructuring timeline (dok_id: HD04234)
> 2. **2025/26:403** by Per Bolund (MP) — demanding disclosure of fossil fuel subsidy figures (dok_id: HD04289)
> 3. **2025/26:411** by Lars Hjälmered (M, backbench) — unusual government-party dissent on nuclear energy procurement (dok_id: HD04456)
>
> **Data source:** riksdag-regering-mcp get_interpellationer(rm="2025/26"), filtered by energy-related keywords. The M backbench interpellation (#411) is particularly noteworthy as intra-coalition dissent [MEDIUM confidence — single data point, monitor for pattern].

**What changed:** "Recent reports" and "several members" became 3 specific, numbered interpellationer with dok_ids, named MPs with party affiliations, and an analytical observation about intra-coalition dissent with confidence label.

---

## Document Control

| Field | Value |
|---|---|
| Version | 2.1.0 |
| Status | Active |
| Owner | Hack23 AB |
| Review Cycle | Quarterly |
| Next Review | 2026-06-30 |
| Key Changes v2.1 | Bad→Good Rewrite Examples (8 worked examples covering all prohibited pattern categories) |
| Key Changes v2.0 | Intelligence depth standards, evidence density requirements, analytical depth indicators |
| Related | `scripts/prompts/v2/political-analysis.md`, `scripts/analysis-reader.ts` |
| ISMS Reference | Secure_Development_Policy.md §4.2 |
