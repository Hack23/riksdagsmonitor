<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">💼 Political SWOT Analysis Template</h1>

<p align="center">
  <strong>📊 Evidence-Based Strategic Analysis with TOWS Matrix & Scenario Generation</strong><br>
  <em>🎯 Government Coalition · Opposition · Cross-SWOT Interference · Strategic Options</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-2.1-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--03--30-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 2.1 | **📅 Last Updated:** 2026-03-30 (UTC)  
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

> **📌 Template Instructions:** Copy to `analysis/daily/YYYY-MM-DD/{articleType}/`. Save as `swot-analysis.md` in the workflow's own folder (never overwrite another workflow's files). Each SWOT entry requires a dok_id or named evidence source — opinion-only entries are prohibited. See [methodologies/political-swot-framework.md](../methodologies/political-swot-framework.md).

> **🚨 Anti-Pattern Warning:** Plain prose SWOT analysis with bullet points but NO evidence tables, NO Mermaid diagrams, NO TOWS matrix, and NO cross-SWOT interference analysis is REJECTED. Every SWOT analysis MUST include:
> 1. **SWOT Context table** (metadata header with SWOT ID, date, scope, MCP sources)
> 2. **Structured evidence tables** with columns: `#`, `Statement`, `Evidence (dok_id)`, `Confidence`, `Impact`, `Entry Date`
> 3. **Color-coded Mermaid SWOT Quadrant Mapping** with `style` directives
> 4. **TOWS Strategic Options** — at least 2 strategic options derived from SWOT combinations
> 5. **Cross-SWOT Interference** — how elements from different actors amplify each other
> 6. **Strategic Implications** section with Key Watch Items and forward indicators
> 7. **Document Control** footer
>
> **Good example:** [SWOT.md](../../SWOT.md) — this is the formatting quality standard.

---

## 📋 SWOT Context

| Field | Value |
|-------|-------|
| **SWOT ID** | `[REQUIRED: SWT-YYYY-MM-DD-NNN]` |
| **Analysis Date** | `[REQUIRED: YYYY-MM-DD HH:MM UTC]` |
| **Analysis Scope** | `[REQUIRED: e.g. "Government coalition", "SD", "Climate policy domain"]` |
| **Reference Period** | `[REQUIRED: e.g. "2026-Q1" or "2026-W13"]` |
| **Produced By** | `[REQUIRED: workflow name or analyst]` |
| **Primary MCP Sources** | `[REQUIRED: list of riksdag-regering-mcp tools used]` |
| **Validity Window** | `[REQUIRED: entries valid until YYYY-MM-DD — see temporal decay guide]` |

---

## 🏛️ Section 1: Government Coalition SWOT

> *Analyse the governing coalition as a unit. Individual party SWOTs in Section 2.*

### ✅ Strengths — Government Coalition

Each entry requires: Statement + Evidence (dok_id) + Confidence + Impact + Entry Date (for temporal decay tracking).

| # | Strength Statement | Evidence (dok_id) | Confidence | Impact | Entry Date |
|---|-------------------|-------------------|:----------:|:------:|:----------:|
| S1 | `[REQUIRED: specific, verifiable strength — e.g. "Coalition maintains working Riksdag majority of 176 seats through SD support agreement"]` | `[REQUIRED: dok_id or vote record]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |
| S2 | `[REQUIRED]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |
| S3 | `[OPTIONAL]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |
| S4 | `[OPTIONAL]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |

**Coalition Strength Summary:** `[REQUIRED: 1–2 sentences]`

---

### ⚠️ Weaknesses — Government Coalition

| # | Weakness Statement | Evidence (dok_id) | Confidence | Impact | Entry Date |
|---|-------------------|-------------------|:----------:|:------:|:----------:|
| W1 | `[REQUIRED: e.g. "Internal disagreement on migration targets between M and L weakens policy coherence"]` | `[REQUIRED: dok_id or debate reference]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |
| W2 | `[REQUIRED]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |
| W3 | `[OPTIONAL]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |

**Coalition Weakness Summary:** `[REQUIRED: 1–2 sentences]`

---

### 🚀 Opportunities — Government Coalition

| # | Opportunity Statement | Evidence (dok_id) | Confidence | Impact | Entry Date |
|---|----------------------|-------------------|:----------:|:------:|:----------:|
| O1 | `[REQUIRED: e.g. "Improving macroeconomic indicators provide window for tax reform legislation"]` | `[REQUIRED: SCB data or budget dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |
| O2 | `[REQUIRED]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |
| O3 | `[OPTIONAL]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |

**Coalition Opportunity Summary:** `[REQUIRED: 1–2 sentences]`

---

### 🔴 Threats — Government Coalition

| # | Threat Statement | Evidence (dok_id) | Confidence | Impact | Entry Date |
|---|-----------------|-------------------|:----------:|:------:|:----------:|
| T1 | `[REQUIRED: e.g. "No-confidence motion risk if SD withdraws budget support over crime legislation stall"]` | `[REQUIRED: interpellation or debate ref]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |
| T2 | `[REQUIRED]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |
| T3 | `[OPTIONAL]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |

**Coalition Threat Summary:** `[REQUIRED: 1–2 sentences]`

---

## 🏛️ Section 2: Main Opposition SWOT

> *Focus on the largest opposition bloc or party. Specify which.*

**Opposition Subject:** `[REQUIRED: e.g. "Social Democrats (S) + V + MP bloc"]`

### ✅ Strengths — Opposition

| # | Strength Statement | Evidence (dok_id) | Confidence | Impact | Entry Date |
|---|-------------------|-------------------|:----------:|:------:|:----------:|
| S1 | `[REQUIRED]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |
| S2 | `[OPTIONAL]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |

### ⚠️ Weaknesses — Opposition

| # | Weakness Statement | Evidence (dok_id) | Confidence | Impact | Entry Date |
|---|-------------------|-------------------|:----------:|:------:|:----------:|
| W1 | `[REQUIRED]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |
| W2 | `[OPTIONAL]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |

### 🚀 Opportunities — Opposition

| # | Opportunity Statement | Evidence (dok_id) | Confidence | Impact | Entry Date |
|---|----------------------|-------------------|:----------:|:------:|:----------:|
| O1 | `[REQUIRED]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |

### 🔴 Threats — Opposition

| # | Threat Statement | Evidence (dok_id) | Confidence | Impact | Entry Date |
|---|-----------------|-------------------|:----------:|:------:|:----------:|
| T1 | `[REQUIRED]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |

---

## 🏛️ Section 3: Policy Domain SWOT

**Policy Domain:** `[REQUIRED: select from classification taxonomy — e.g. "Climate & Environment (ENV)"]`

### ✅ Strengths in Domain

| # | Strength Statement | Evidence (dok_id) | Confidence | Impact | Entry Date |
|---|-------------------|-------------------|:----------:|:------:|:----------:|
| S1 | `[REQUIRED: e.g. "Sweden meets 2025 renewable energy target; supporting legislation fully enacted (prop 2024/25:XX)"]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |
| S2 | `[OPTIONAL]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |

### ⚠️ Weaknesses in Domain

| # | Weakness Statement | Evidence (dok_id) | Confidence | Impact | Entry Date |
|---|-------------------|-------------------|:----------:|:------:|:----------:|
| W1 | `[REQUIRED]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |

### 🚀 Opportunities in Domain

| # | Opportunity Statement | Evidence (dok_id) | Confidence | Impact | Entry Date |
|---|----------------------|-------------------|:----------:|:------:|:----------:|
| O1 | `[REQUIRED]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |

### 🔴 Threats to Domain

| # | Threat Statement | Evidence (dok_id) | Confidence | Impact | Entry Date |
|---|-----------------|-------------------|:----------:|:------:|:----------:|
| T1 | `[REQUIRED]` | `[dok_id]` | `H/M/L` | `H/M/L` | `YYYY-MM-DD` |

---

## 📊 SWOT Quadrant Mapping

### Visual SWOT Impact Diagram

> **AI Instructions:** Replace placeholder text below with actual SWOT findings from the tables above. Each node label should reference the corresponding S/W/O/T entry number.

```mermaid
graph TD
    subgraph "📊 Political SWOT Landscape"
        direction TB
        subgraph "✅ Strengths (Internal Positive)"
            S1N["💪 S1: [Coalition majority]"]
            S2N["💪 S2: [Policy delivery]"]
        end
        subgraph "⚠️ Weaknesses (Internal Negative)"
            W1N["⚡ W1: [Internal disagreements]"]
            W2N["⚡ W2: [Policy coherence gap]"]
        end
        subgraph "🚀 Opportunities (External Positive)"
            O1N["🌟 O1: [Economic tailwinds]"]
            O2N["🌟 O2: [EU alignment]"]
        end
        subgraph "🔴 Threats (External Negative)"
            T1N["☁️ T1: [No-confidence risk]"]
            T2N["☁️ T2: [Electoral pressure]"]
        end
    end

    S1N -.->|"exploits"| O1N
    W1N -.->|"amplifies"| T1N
    O2N -.->|"mitigates"| W2N
    T2N -.->|"targets"| W1N

    style S1N fill:#28a745,color:#fff
    style S2N fill:#28a745,color:#fff
    style W1N fill:#fd7e14,color:#fff
    style W2N fill:#fd7e14,color:#fff
    style O1N fill:#0d6efd,color:#fff
    style O2N fill:#0d6efd,color:#fff
    style T1N fill:#dc3545,color:#fff
    style T2N fill:#dc3545,color:#fff
```

### SWOT Interaction Matrix

|                              | Internal (Actor / Organisation)         | External (Environment / System)       |
|------------------------------|-----------------------------------------|---------------------------------------|
| **Positive impact**          | **Strengths** — internal advantages     | **Opportunities** — external enablers |
| **Negative impact**          | **Weaknesses** — internal limitations   | **Threats** — external risks          |

> For each item (S/W/O/T), briefly note **why** it is internal/external and negative/positive, and reference supporting evidence (for example `dok_id`) in the tables above.

---

## 🔑 Strategic Implications

`[REQUIRED: 3–5 sentences summarising the most critical SWOT interactions — e.g. how a coalition weakness intersects with an opposition opportunity to create a specific political risk over the next 30–60 days. Be specific and evidence-based.]`

**Key Watch Items:**
1. `[REQUIRED: specific event or indicator to monitor]`
2. `[REQUIRED]`
3. `[OPTIONAL]`

---

## 🔄 Section 5: Cross-SWOT Interference Analysis

> *How do SWOT elements from different actors (government, opposition, SD) amplify or counteract each other?*

| Gov/Opp SWOT Element | Interfering Element | Effect | Net Political Impact |
|:--------------------:|:------------------:|:------:|---------------------|
| `[e.g. Gov W1: Coalition tension]` | `[e.g. Opp S1: United front]` | Amplifies vulnerability | `[REQUIRED: Specific implication]` |
| `[e.g. Gov S1: Legislative majority]` | `[e.g. SD W1: Policy delivery failure]` | Fragile dependency | `[REQUIRED: Specific implication]` |
| `[REQUIRED: At least 2 interference pairs]` | `[...]` | `[...]` | `[...]` |

---

## 📊 Section 6: TOWS Strategic Options

> *Convert SWOT findings into strategic options — answering "So what?"*

| TOWS Cell | Strategy | Specific Action | Evidence |
|:---------:|---------|-----------------|---------|
| **SO** (Strength × Opportunity) | `[REQUIRED: How to use a strength to exploit an opportunity]` | `[Specific action with timeline]` | `[dok_id]` |
| **WO** (Weakness × Opportunity) | `[REQUIRED: How to use an opportunity to address a weakness]` | `[Specific action]` | `[dok_id]` |
| **ST** (Strength × Threat) | `[OPTIONAL: How to use a strength to counter a threat]` | `[Specific action]` | `[dok_id]` |
| **WT** (Weakness × Threat) | `[OPTIONAL: How to minimise vulnerability]` | `[Specific action]` | `[dok_id]` |

---

## 🔮 Section 7: Forward Indicators & Scenario Outlook

**30-Day Scenario Outlook:**

| Scenario | Probability | Key Trigger | SWOT Elements Driving It |
|----------|:----------:|------------|-------------------------|
| `[REQUIRED: Most likely scenario]` | `[%]` | `[Specific trigger event]` | `[S1+O2, T1+W1, etc.]` |
| `[REQUIRED: Alternative scenario]` | `[%]` | `[Specific trigger event]` | `[SWOT elements]` |
| `[OPTIONAL: Worst case]` | `[%]` | `[Trigger]` | `[SWOT elements]` |

---

## 📂 MCP Data Files Used

> *Record all MCP tool calls and data files consulted during this SWOT analysis for reproducibility and audit traceability.*

`[REQUIRED: List all analysis/daily/YYYY-MM-DD/{articleType}/data/ files consulted]`

| # | Data Source | File / Tool Path | Data Type | Retrieved |
|:-:|-----------|-----------------|-----------|-----------|
| 1 | `[e.g. riksdag-regering-mcp]` | `[e.g. search_voteringar(rm="2025/26")]` | `[e.g. Voting records]` | `[YYYY-MM-DD HH:MM UTC]` |
| 2 | `[e.g. riksdag-regering-mcp]` | `[e.g. search_dokument(doktyp="mot", rm="2025/26")]` | `[e.g. Motions]` | `[YYYY-MM-DD HH:MM UTC]` |
| 3 | `[e.g. CIA export]` | `[e.g. cia-data/exports/party-analysis.json]` | `[e.g. Party metrics]` | `[YYYY-MM-DD HH:MM UTC]` |
| 4 | `[OPTIONAL]` | `[path or tool call]` | `[type]` | `[timestamp]` |

### SWOT Quadrant Data Provenance

> **AI Instructions:** Map which MCP data sources provided evidence for each SWOT quadrant. This ensures every SWOT entry has traceable data backing, in line with the evidence hierarchy requirements from [political-swot-framework.md](../methodologies/political-swot-framework.md).

| SWOT Quadrant | Primary MCP Tools | Evidence Items | Confidence |
|:-------------:|------------------|:--------------:|:----------:|
| **Strengths** | `[e.g. search_voteringar, get_betankanden]` | `[#]` | `[H/M/L]` |
| **Weaknesses** | `[e.g. search_anforanden, search_dokument]` | `[#]` | `[H/M/L]` |
| **Opportunities** | `[e.g. search_regering, get_calendar_events]` | `[#]` | `[H/M/L]` |
| **Threats** | `[e.g. search_voteringar, search_dokument_fulltext]` | `[#]` | `[H/M/L]` |

> **📌 Note:** Confidence follows the temporal decay rule from [political-swot-framework.md](../methodologies/political-swot-framework.md): HIGH (0–30d, remains HIGH at 30d)→MEDIUM (90d)→LOW (180d)→EXPIRED. All files listed MUST exist at the stated paths; mark transient data as `(transient — not cached)`.

---

**Document Control:**  
- **Template Path:** `/analysis/templates/swot-analysis.md`  
- **Framework Reference:** [SWOT.md](../../SWOT.md), [methodologies/political-swot-framework.md](../methodologies/political-swot-framework.md)  
- **Version:** 2.1  
- **Advanced Sections:** Cross-SWOT Interference, TOWS Matrix, Forward Indicators & Scenario Outlook, MCP Data Provenance  
- **Classification:** Public  
- **Next Review:** 2026-06-30
