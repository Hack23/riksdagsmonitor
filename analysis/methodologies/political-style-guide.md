<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">✍️ Political Intelligence Style Guide</h1>

<p align="center">
  <strong>📊 Writing Standards for Swedish Political Analysis</strong><br>
  <em>🎯 Depth · Attribution · Confidence · Prohibition · Emoji · Multi-language</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--03--26-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.0 | **📅 Last Updated:** 2026-03-26 (UTC)  
**🔄 Review Cycle:** Quarterly | **⏰ Next Review:** 2026-06-26  
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

---

## 🎯 Purpose

This style guide establishes writing standards for all political intelligence produced by Riksdagsmonitor's agentic workflows and human editors. It adapts [Hack23 ISMS STYLE_GUIDE.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/STYLE_GUIDE.md) for political journalism contexts. All content — analysis artifacts, news articles, and dashboard labels — must conform to these standards.

See [reference/isms-style-guide-adaptation.md](../reference/isms-style-guide-adaptation.md) for the full ISMS mapping.

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

**Reference:** `scripts/prompts/v1/political-analysis.md` for LLM translation prompts.

---

## 🔗 Related Documents

- [reference/isms-style-guide-adaptation.md](../reference/isms-style-guide-adaptation.md) — ISMS mapping
- [scripts/prompts/v1/political-analysis.md](../../scripts/prompts/v1/political-analysis.md) — LLM prompts
- [political-classification-guide.md](political-classification-guide.md) — Classification (determines depth level)
- [TRANSLATION_GUIDE.md](../../TRANSLATION_GUIDE.md) — Multi-language translation guide

---

**Document Control:**  
- **Path:** `/analysis/methodologies/political-style-guide.md`  
- **ISMS Reference:** [STYLE_GUIDE.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/STYLE_GUIDE.md)  
- **Classification:** Public  
- **Next Review:** 2026-06-26
