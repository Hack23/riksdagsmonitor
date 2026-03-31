<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">✍️ ISMS Style Guide → Political Intelligence Writing Adaptation</h1>

<p align="center">
  <strong>📊 Mapping ISMS Documentation Standards to Political Analysis Writing</strong><br>
  <em>🎯 Document Structure · Icons · Writing Standards · Classification Labeling</em>
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

This reference document maps [Hack23 ISMS STYLE_GUIDE.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/STYLE_GUIDE.md) conventions to Riksdagsmonitor's political intelligence writing standards. It explains how each ISMS writing convention has been adapted, retained, or modified for the political journalism context.

---

## 📄 Document Structure: ISMS → Article Structure

The ISMS mandates a specific document structure for all policy and security documents. The political article structure adapts this for news and analysis formats:

| ISMS Document Section | ISMS Purpose | Political Article Equivalent | Political Purpose |
|:---------------------:|-------------|:----------------------------:|------------------|
| **Header (Logo + Title)** | Brand identity; document identification | **Article Header** | Publication brand + article title; same badge format |
| **Badge row** (Owner/Version/Date) | Document control metadata | **Article metadata** | Publication date + classification + significance score |
| **Executive Summary** | 3–5 sentence overview for executives | **Lead paragraph** | Who/What/When/Where/Why in 2–3 sentences; highest-significance fact first |
| **Purpose & Scope** | Document objective and boundaries | **Context section** | Political background; why this event matters now |
| **Main sections with emoji headers** | Structured content with visual navigation | **Analysis sections** | Classified, Risk-assessed, SWOT-framed content blocks |
| **References** | Citations and related documents | **Evidence section** | All dok_ids, anföranden refs, statistics sources |
| **Document Control footer** | Metadata for ISMS compliance | **Publication footer** | Article metadata; related articles; workflow attribution |

### Structural Adaptation Example

**ISMS Format:**
```markdown
## 🎯 Purpose & Scope
[3 sentences on objective]
```

**Political Article Format:**
```markdown
## 📰 What Happened
[Lead: who/what/when/where in 2 sentences]
[Context: why this matters in 2 sentences]
[Key fact: most significant data point with dok_id]
```

---

## 🎨 ISMS Icon Conventions → Political Analysis Emoji Conventions

The ISMS uses consistent emoji to mark document sections and content types. The political adaptation extends this system:

| ISMS Icon | ISMS Usage | Political Equivalent | Political Usage |
|:---------:|-----------|:--------------------:|----------------|
| 🎯 | Purpose / Target | 🎯 | Article purpose; key finding |
| 🛡️ | Security / Protection | 🛡️ | Defence & Security domain |
| ⚠️ | Warning / Risk | ⚠️ | Risk assessment; coalition warning |
| ✅ | Compliant / Approved | ✅ | SWOT Strength; legislative success |
| ❌ | Non-compliant / Rejected | ❌ | SWOT Weakness; legislative failure |
| 📋 | Document / Process | 📋 | Parliamentary document reference |
| 🔒 | Restricted / Confidential | 🔴 | RESTRICTED sensitivity level |
| 🟢 | Low risk / Public | 🟢 | PUBLIC sensitivity / HIGH confidence |
| 🟡 | Medium risk / Internal | 🟡 | SENSITIVE sensitivity / MEDIUM confidence |
| 🔴 | High risk / Confidential | 🔴 | RESTRICTED sensitivity / LOW confidence |
| 📊 | Metrics / Dashboard | 📊 | Significance scores; risk scores |
| 🏢 | Organisation | 🏛️ | Parliamentary institution |
| 🔄 | Process / Review | 🔄 | Legislative cycle; review cycle |
| 📅 | Date / Schedule | 📅 | Legislative calendar event |
| 🌍 | Global / International | 🌍 | International/EU dimension |

### Political-Specific Emoji (No ISMS Equivalent)

| Emoji | Political Usage |
|:-----:|----------------|
| ⚡ | Breaking news; significance ≥ 9.0 |
| 💰 | Economics & Finance domain |
| ⚖️ | Justice & Law domain |
| 🤝 | Coalition dynamics; civil society |
| 🗳️ | Electoral; opposition |
| 👑 | Power concentration (Power Balance) |
| 🎭 | Disinformation (Narrative Integrity) |
| 📡 | Real-time monitoring |
| 🧭 | Strategic analysis |

---

## 📝 ISMS Writing Standards → Analytical Depth Requirements

The ISMS requires formal, precise, and jargon-minimal language. Political intelligence writing adapts this with journalism-specific standards:

| ISMS Writing Requirement | ISMS Rationale | Political Adaptation | Political Rationale |
|:------------------------:|---------------|:--------------------:|---------------------|
| **Active voice** | Clarity of responsibility | **Active voice** | Clear attribution: "The Riksdag voted..." not "A vote was taken..." |
| **Precise technical terms** | Avoid ambiguity | **Named political terms** | "Statsminister" not "head of government"; specific party abbreviations |
| **No jargon without definition** | Accessibility | **Swedish terms explained** | "Betänkande (committee report)" on first use for non-Swedish readers |
| **Consistent formatting** | Professionalism | **Consistent analytical structure** | All risk scores, confidence levels in same position |
| **Cite sources** | Auditability | **Mandatory dok_id citation** | Every factual claim gets a document reference |
| **Version control** | Change tracking | **Date-stamped analysis** | All analysis artifacts include YYYY-MM-DD HH:MM UTC |
| **Audience-appropriate depth** | Communication effectiveness | **Three depth levels** | Surface / Strategic / Intelligence (see political-style-guide.md) |

---

## 🏷️ ISMS Classification Labeling → Confidence/Impact Labeling

The ISMS uses classification labels (PUBLIC, INTERNAL, CONFIDENTIAL) on all documents. The political adaptation repurposes labeling for analytical confidence and political impact:

| ISMS Label | ISMS Location | Political Equivalent | Political Location |
|:----------:|--------------|:--------------------:|-------------------|
| `Classification: Public` | Document header | `Sensitivity: PUBLIC` | Analysis artifact header |
| `Classification: Internal` | Document header | `Sensitivity: SENSITIVE` | Analysis artifact header; triggers review |
| `Classification: Confidential` | Document header | `Sensitivity: RESTRICTED` | Analysis artifact header; blocks auto-publish |
| `TLP:GREEN` | Security documents | `[MEDIUM confidence]` | Inline claim annotation |
| `TLP:RED` | Sensitive communications | `[LOW confidence]` | Inline claim annotation |
| Impact rating | Risk register | Risk Score: X/25 | Analysis artifact body |
| Control status | Security audit | Publication decision | Significance score → action |

### Inline Labeling Format

**ISMS Format:** No inline labeling standard (document-level only)

**Political Intelligence Format (inline):**
```
"Coalition will [HIGH confidence] pass the defence budget in November 
based on confirmed vote commitments (dok_id: XXXX, 2026-03-15)."

"SD may [LOW confidence] abstain on the immigration amendment — 
based on single unnamed party source."
```

---

## 🤖 LLM Prompt Alignment

The ISMS style guide governs human-authored documentation. The political intelligence style guide extends these standards to **LLM-generated content** via:

| Style Guide Requirement | ISMS Implementation | LLM Implementation |
|:-----------------------:|--------------------|--------------------|
| Document structure | Human author follows template | Prompt template in `scripts/prompts/v2/political-analysis.md` |
| Source citation | Author adds citations | LLM instructed to cite MCP tool outputs as dok_ids |
| Confidence notation | Human judgement | LLM instructed to assign confidence per hierarchy |
| Prohibited patterns | Style guide prohibition | Explicit negative examples in prompt |
| Emoji conventions | Style guide table | Emoji mapping table in system prompt |
| Multi-language | Translation guide | Per-language prompt configuration |

**Reference:** `scripts/prompts/v2/political-analysis.md` implements all style requirements as LLM instructions.

---

## 🔗 Related Documents

- [methodologies/political-style-guide.md](../methodologies/political-style-guide.md) — Full style guide
- [scripts/prompts/v2/political-analysis.md](../../scripts/prompts/v2/political-analysis.md) — LLM prompts
- [TRANSLATION_GUIDE.md](../../TRANSLATION_GUIDE.md) — Multi-language standards

---

**Document Control:**  
- **Path:** `/analysis/reference/isms-style-guide-adaptation.md`  
- **Source ISMS Doc:** [STYLE_GUIDE.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/STYLE_GUIDE.md)  
- **Classification:** Public  
- **Next Review:** 2026-06-26
