<!-- SPDX-FileCopyrightText: 2026 Hack23 AB -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">📰 Riksdagsmonitor Article Generation</h1>

<p align="center">
  <strong>From public Swedish parliamentary evidence to auditable, multilingual political-intelligence articles</strong><br>
  <em>Agentic workflows · 23-artifact analysis contract · deterministic Markdown aggregation · sanitized HTML rendering · S3/CloudFront deployment</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Integrity-High-orange?style=for-the-badge" alt="Integrity"/></a>
  <a href="#"><img src="https://img.shields.io/badge/AI--FIRST-2%20Passes-ff006e?style=for-the-badge" alt="AI FIRST"/></a>
</p>

**📋 Document Owner:** CEO | **📅 Last Updated:** 2026-04-25 (UTC)  
**🏢 Owner:** Hack23 AB (Org.nr 559534-7807) | **🏷️ Classification:** Public
**Primary example:** [`analysis/daily/2026-04-24/interpellations/article.md`](analysis/daily/2026-04-24/interpellations/article.md) → [`news/2026-04-24-interpellations-en.html`](news/2026-04-24-interpellations-en.html) / [`news/2026-04-24-interpellations-sv.html`](news/2026-04-24-interpellations-sv.html)

---

## 📚 Table of Contents

- [🎯 Executive Summary](#-executive-summary)
- [💼 Purpose, Function, Business Value and Political-Analysis Object](#-purpose-function-business-value-and-political-analysis-object)
- [🧭 End-to-End Generation Map](#-end-to-end-generation-map)
- [🤖 Agentic Workflow Architecture](#-agentic-workflow-architecture)
- [📥 Data Collection and Evidence Foundation](#-data-collection-and-evidence-foundation)
- [🧠 Analysis Methodologies and Templates](#-analysis-methodologies-and-templates)
- [🚦 Analysis Gate](#-analysis-gate)
- [📝 How `article.md` Is Generated](#-how-articlemd-is-generated)
- [🌐 How `article.md` Becomes HTML](#-how-articlemd-becomes-html)
- [🎨 UI/UX, Mermaid, D3 and Chart.js Support](#-uiux-mermaid-d3-and-chartjs-support)
- [🌍 Language Switchers and Translation Model](#-language-switchers-and-translation-model)
- [🚀 Build and S3 Deployment](#-build-and-s3-deployment)
- [🛡️ Security, Privacy and ISMS Controls](#-security-privacy-and-isms-controls)
- [✅ Operational Checklist](#-operational-checklist)
- [🚀 Future Improvements Roadmap](#-future-improvements-roadmap)
- [🔗 Source File Index](#-source-file-index)

---

## 🎯 Executive Summary

Riksdagsmonitor articles are **not hand-written HTML pages**. They are deterministic projections of a deeper political-intelligence product:

1. **Agentic workflows** in [`.github/workflows/news-*.md`](.github/workflows/) run on schedules or manual dispatch.
2. The workflow imports bounded prompt modules from [`.github/prompts/`](.github/prompts/README.md).
3. The AI agent collects public Riksdag/Regering data through the `riksdag-regering` MCP server, Swedish statistics through SCB, agency-capacity and public-management evidence from Statskontoret, supplementary governance/environment/social/education indicators through World Bank, and economic context through the repository IMF TypeScript client.
4. The agent produces a **stable set of 23 core analysis artifacts** plus per-document files under `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/`.
5. The **single blocking gate** in [`.github/prompts/05-analysis-gate.md`](.github/prompts/05-analysis-gate.md) must pass before any article is generated.
6. [`scripts/aggregate-analysis.ts`](scripts/aggregate-analysis.ts) turns the analysis folder into one canonical `article.md`.
7. [`scripts/render-articles.ts`](scripts/render-articles.ts) sanitizes Markdown and wraps it in shared article chrome to create `news/$DATE-$SUBFOLDER-$LANG.html`.
8. Vite builds the static site and [`.github/workflows/deploy-s3.yml`](.github/workflows/deploy-s3.yml) publishes `dist/` to S3 + CloudFront.

The result is a transparent political-intelligence article where every claim remains traceable to source artifacts, every source artifact remains traceable to public evidence, and the HTML page carries machine-readable provenance through JSON-LD `NewsArticle.isBasedOn`.

**Current publication principle:** the AI writes analysis artifacts, not final HTML. Scripts own aggregation, sanitization, chrome, SEO, language alternates, source footers and deployment behavior. This separation is what makes the system auditable.

---

## 💼 Purpose, Function, Business Value and Political-Analysis Object

### Purpose

The article-generation pipeline exists to **turn Swedish public parliamentary events into rigorous, auditable, citizen-facing intelligence**. It supports the Riksdagsmonitor mission from [README.md](README.md): systematic transparency over Swedish Riksdag activity, coalition dynamics, voting patterns, and public accountability.

### Function

| Layer | Function | Primary files |
|---|---|---|
| **Collection** | Fetch public parliamentary, government, statistical and economic evidence | `.github/prompts/03-data-download.md`, `scripts/download-parliamentary-data.ts`, `scripts/imf-fetch.ts` |
| **Analysis** | Produce structured OSINT/INTOP assessments with evidence, uncertainty and color-coded Mermaid | `analysis/methodologies/`, `analysis/templates/`, `.github/prompts/04-analysis-pipeline.md` |
| **Gate** | Enforce artifact presence, evidence quality, Mermaid coverage and Pass-2 improvement | `.github/prompts/05-analysis-gate.md` |
| **Aggregation** | Convert the folder of analysis artifacts into canonical `article.md` | `scripts/aggregate-analysis.ts`, `scripts/render-lib/aggregator.ts` |
| **Rendering** | Sanitize Markdown and build complete article HTML with SEO, language switcher and source footer | `scripts/render-articles.ts`, `scripts/render-lib/markdown.ts`, `article.ts`, `chrome.ts` |
| **Publishing** | Build static assets and deploy with correct MIME types, cache headers and CloudFront invalidation | `package.json`, `vite.config.js`, `.github/workflows/deploy-s3.yml`, `scripts/deploy-s3.sh` |

### Business Value

| Value area | How article generation contributes |
|---|---|
| **Trust enhancement** | Every article is backed by visible source files and primary-source links. |
| **Competitive advantage** | Riksdagsmonitor combines official Swedish political data with structured intelligence techniques (DIW, ACH, SWOT, risk, threat, stakeholder, scenario and forward-indicator analysis). |
| **Operational excellence** | Deterministic scripts (`aggregate-analysis.ts`, `render-articles.ts`) make publication repeatable, testable and auditable. |
| **Reputational protection** | AI-generated political text is gated by evidence standards, source diversity, neutral language and human-reviewable PRs. |
| **Democratic accountability** | Citizens can inspect the same source artifacts used to produce the public article. |

### Political-analysis object

An article is the **dissemination layer** of an analysis object. The primary analytical object is the folder:

```text
analysis/daily/$ARTICLE_DATE/$SUBFOLDER/
```

For the example run:

```text
analysis/daily/2026-04-24/interpellations/
```

This folder contains the full political-intelligence object:

- 23 mandatory core artifacts.
- Per-document analysis files under `documents/`.
- Optional supplementary files.
- The generated canonical `article.md`.
- Supporting JSON chart/economic/provenance files when applicable.

The article is therefore a **rendered view of the intelligence object**, not the source of record.

---

## 🧭 End-to-End Generation Map

```mermaid
%%{init: {"theme":"dark","themeVariables":{"primaryColor":"#1565C0","primaryTextColor":"#ffffff","primaryBorderColor":"#0A3F7F","lineColor":"#90CAF9","secondaryColor":"#2E7D32","secondaryTextColor":"#ffffff","tertiaryColor":"#FF9800","tertiaryTextColor":"#000000","mainBkg":"#1565C0","secondBkg":"#2E7D32","tertiaryBkg":"#FF9800","noteBkgColor":"#FFC107","noteTextColor":"#000000","errorBkgColor":"#D32F2F","fontFamily":"Inter, Helvetica, Arial, sans-serif"}}}%%
flowchart TB
    A["Trigger<br/>news-*.md schedule or workflow_dispatch"] --> B["🧰 Runtime setup<br/>Node 25 · npm ci · MCP pre-warm"]
    B --> C["📥 Public evidence download<br/>Riksdag/Regering · SCB · IMF · WB residue"]
    C --> D["🧠 Analysis Pass 1<br/>23 artifacts + per-document files"]
    D --> E["🔁 Analysis Pass 2<br/>read back and improve every section"]
    E --> F{"🚦 05 Analysis Gate<br/>evidence · Mermaid · Pass-2 · structure"}
    F -- fail --> E
    F -- pass --> G["📝 aggregate-analysis.ts<br/>analysis folder → article.md"]
    G --> H["🌐 render-articles.ts<br/>article.md → news/*-{en,sv}.html"]
    H --> I["🌍 news-translate.md<br/>12 additional languages"]
    H --> J["📦 Vite build<br/>prebuild aggregates/renders/indexes/rss/sitemap"]
    I --> J
    J --> K["🚀 deploy-s3.yml<br/>S3 upload + CloudFront invalidation"]

    style A fill:#1565C0,color:#ffffff
    style C fill:#2E7D32,color:#ffffff
    style D fill:#7B1FA2,color:#ffffff
    style E fill:#4CAF50,color:#ffffff
    style F fill:#D32F2F,color:#ffffff
    style G fill:#FF9800,color:#000000
    style H fill:#FF9800,color:#000000
    style I fill:#00897B,color:#ffffff
    style K fill:#0A66C2,color:#ffffff
```

---

## 🤖 Agentic Workflow Architecture

### Workflow sources

The news workflows are Markdown-based GitHub Agentic Workflows. The interpellation example is:

- [`.github/workflows/news-interpellations.md`](.github/workflows/news-interpellations.md)

It declares:

| Concern | Current configuration |
|---|---|
| **Name** | `News: Interpellation Debates` |
| **Schedule** | Daily around 07:00 on weekdays |
| **Manual inputs** | `article_date`, `force_generation`, `languages`, `analysis_depth` |
| **Runtime** | Node.js `25` |
| **Engine** | Copilot with `claude-opus-4.7` |
| **Permissions** | Read-only content/issues/PR/actions/discussions/security-events for AI job |
| **MCP gateway** | Enabled |
| **Safe outputs** | One PR max, labels `agentic-news`, `analysis-data`, one translation dispatch max |
| **Core output** | `analysis/daily/$ARTICLE_DATE/interpellations/article.md` and `news/$ARTICLE_DATE-interpellations-{en,sv}.html` |

### Imported prompt modules

Every content workflow imports the bounded-context prompt library:

| Import | Responsibility |
|---|---|
| [`00-base-contract.md`](.github/prompts/00-base-contract.md) | Role, ethics, GDPR/ISMS, AI-FIRST, session and PR boundaries |
| [`01-bash-and-shell-safety.md`](.github/prompts/01-bash-and-shell-safety.md) | Safe shell patterns and command discipline |
| [`02-mcp-access.md`](.github/prompts/02-mcp-access.md) | MCP inventory and health gates |
| [`03-data-download.md`](.github/prompts/03-data-download.md) | Data download and manifest rules |
| [`04-analysis-pipeline.md`](.github/prompts/04-analysis-pipeline.md) | 23-artifact production and Pass 1/Pass 2 methodology |
| [`05-analysis-gate.md`](.github/prompts/05-analysis-gate.md) | Single blocking gate before article generation |
| [`06-article-generation.md`](.github/prompts/06-article-generation.md) | Aggregate + render contract |
| [`07-commit-and-pr.md`](.github/prompts/07-commit-and-pr.md) | Stage, commit and exactly one PR |

### Workflow time budget

The interpellation workflow documents a compressed single-run budget:

| Window | Phase |
|---:|---|
| 0–2 min | MCP pre-warm and network diagnostics |
| 2–5 min | Download data and catalogue source documents |
| 5–15 min | Analysis Pass 1, all 23 artifacts plus per-document files |
| 15–21 min | Analysis Pass 2, read back and improve |
| 21–22 min | Analysis gate |
| 22–24 min | Aggregate `article.md` and render EN/SV HTML |
| 24–28 min | Stage, commit and create exactly one PR |

This budget exists because the `safeoutputs` MCP session may expire after approximately 30–35 minutes of idle time. The workflow explicitly prefers **scope compression over skipping Pass 2**.

### Agentic security model

```mermaid
%%{init: {"theme":"dark","themeVariables":{"primaryColor":"#0A66C2","primaryTextColor":"#ffffff","primaryBorderColor":"#003B73","lineColor":"#00D9FF","secondaryColor":"#1A1E3D","tertiaryColor":"#FFBE0B","tertiaryTextColor":"#000000","errorBkgColor":"#D32F2F","fontFamily":"Inter, Helvetica, Arial, sans-serif"}}}%%
flowchart LR
    I["Untrusted public inputs<br/>Riksdag docs · speeches · webpages"] --> S["System prompt + modules<br/>ethical and evidence rules"]
    S --> R["Read-only AI job<br/>limited GitHub permissions"]
    R --> T["Allowed tools<br/>MCP · bash · GitHub read"]
    T --> O["Structured outputs<br/>analysis artifacts + safe PR request"]
    O --> V["Gate + review surface<br/>analysis gate · PR diff · CI"]
    V --> P["Published static site<br/>S3/CloudFront · GitHub Pages DR"]

    style I fill:#D32F2F,color:#ffffff
    style S fill:#1565C0,color:#ffffff
    style R fill:#2E7D32,color:#ffffff
    style T fill:#7B1FA2,color:#ffffff
    style O fill:#FF9800,color:#000000
    style V fill:#FFC107,color:#000000
    style P fill:#0A66C2,color:#ffffff
```

---

## 📥 Data Collection and Evidence Foundation

### Data providers

| Provider | Use in article generation | Interface |
|---|---|---|
| **Riksdag/Regering MCP** | MPs, documents, speeches, votes, interpellations, propositions, motions, committee reports, government documents | `.github/copilot-mcp.json` + workflow `mcp-servers` |
| **SCB** | Swedish-specific statistics and demographic context | `@jarib/pxweb-mcp@2.0.0` |
| **IMF** | Primary economic/fiscal/monetary/external-sector/trade context, with WEO/FM projection vintage discipline and `economic-data.json` provenance | `tsx scripts/imf-fetch.ts` + `scripts/imf-client.ts` |
| **Statskontoret** | Swedish agency governance, administrative capacity, implementation feasibility, regulatory burden and public-sector efficiency evidence | Public web pages / reports (`www.statskontoret.se`) |
| **World Bank** | Non-economic residue only: governance, environment, social/education, defence historicals, crime | `worldbank-mcp@1.0.1` |
| **GitHub** | PR creation and repository metadata | GitHub MCP / safe outputs |

The authoritative IMF-first / World-Bank-residue split is defined in [`.github/aw/ECONOMIC_DATA_CONTRACT.md`](.github/aw/ECONOMIC_DATA_CONTRACT.md). In short: macroeconomic, fiscal, monetary, external-sector and trade claims are IMF-first; World Bank is reserved for governance, environment and other non-economic residue that IMF does not publish.

Statskontoret is not an MCP server. It is a public-source enrichment layer for agency capacity and implementation feasibility. Workflow allowlists include `www.statskontoret.se` / `statskontoret.se`; source use is recorded in `data-download-manifest.md` and cited in the affected analysis artifacts.

### Evidence standard

Every analytical claim must tie to at least one of:

- A real `dok_id` such as `HD10447`.
- A named MP, minister, party, committee or actor.
- Vote counts or voting records.
- A primary-source URL from `riksdagen.se`, `regeringen.se`, `scb.se`, `statskontoret.se`, IMF or World Bank non-economic endpoints.

The sample interpellation article demonstrates this standard:

| Claim type | Example in `2026-04-24/interpellations/article.md` |
|---|---|
| `dok_id` | `HD10447` links to `https://data.riksdagen.se/dokument/HD10447.html` |
| Named actors | Patrik Lundqvist (S), Ebba Busch (KD), Elisabeth Svantesson (M) |
| Count | `12 of 16` interpellations in the HD10428–HD10447 window were S-filed |
| Forward trigger | Ministerial answer window `2026-05-07` |
| Confidence | MEDIUM / HIGH / LOW-MEDIUM labels and Admiralty `A2` markers |

---

## 🧠 Analysis Methodologies and Templates

### Canonical methodology set

Article generation is governed by:

- [`analysis/methodologies/artifact-catalog.md`](analysis/methodologies/artifact-catalog.md)
- [`analysis/methodologies/per-artifact-methodologies.md`](analysis/methodologies/per-artifact-methodologies.md)
- [`analysis/methodologies/ai-driven-analysis-guide.md`](analysis/methodologies/ai-driven-analysis-guide.md)
- [`analysis/methodologies/political-style-guide.md`](analysis/methodologies/political-style-guide.md)
- [`analysis/methodologies/osint-tradecraft-standards.md`](analysis/methodologies/osint-tradecraft-standards.md)
- Supporting methods for classification, SWOT, risk, threat, synthesis, structural metadata, strategic extensions, electoral/domain analysis and per-document analysis.

### AI-FIRST two-pass rule

The pipeline requires at least two complete iterations:

| Pass | Required work | Quality effect |
|---|---|---|
| **Pass 1 — Create** | Produce all 23 core artifacts and all per-document files. | Establishes coverage and first analytical structure. |
| **Snapshot** | Save Pass-1 drafts under `pass1/` for gate evidence. | Provides proof that Pass 2 changed the analysis. |
| **Pass 2 — Improve** | Read every Pass-1 file back completely and strengthen evidence, diagrams, uncertainty, stakeholders and forward indicators. | Converts shallow first drafts into publication-quality intelligence. |

The aggregator deliberately strips trailing `Pass 2` process sections from public articles, so Pass-2 improvements must be integrated into the actual analytical sections.

### Always-produced core artifacts

Every content workflow produces the same 23 artifacts under `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/`.

```mermaid
%%{init: {"theme":"dark","themeVariables":{"primaryColor":"#7B1FA2","primaryTextColor":"#ffffff","primaryBorderColor":"#4A148C","lineColor":"#FFBE0B","secondaryColor":"#1565C0","secondaryTextColor":"#ffffff","tertiaryColor":"#2E7D32","tertiaryTextColor":"#ffffff","fontFamily":"Inter, Helvetica, Arial, sans-serif"}}}%%
flowchart TB
    subgraph A["📘 Family A — Core Synthesis (9)"]
        A1[README.md]
        A2[executive-brief.md]
        A3[synthesis-summary.md]
        A4[significance-scoring.md]
        A5[classification-results.md]
        A6[swot-analysis.md]
        A7[risk-assessment.md]
        A8[threat-analysis.md]
        A9[stakeholder-perspectives.md]
    end
    subgraph B["📗 Family B — Structural Metadata (2)"]
        B1[data-download-manifest.md]
        B2[cross-reference-map.md]
    end
    subgraph C["📙 Family C — Strategic Extensions (5)"]
        C1[scenario-analysis.md]
        C2[comparative-international.md]
        C3[devils-advocate.md]
        C4[intelligence-assessment.md]
        C5[methodology-reflection.md]
    end
    subgraph D["📕 Family D — Electoral & Domain Lenses (7)"]
        D1[election-2026-analysis.md]
        D2[voter-segmentation.md]
        D3[coalition-mathematics.md]
        D4[historical-parallels.md]
        D5[media-framing-analysis.md]
        D6[implementation-feasibility.md]
        D7[forward-indicators.md]
    end
    subgraph E["📒 Family E — Per document"]
        E1[documents/{dok_id}-analysis.md]
    end
    A --> G["🚦 Analysis Gate"]
    B --> G
    C --> G
    D --> G
    E --> G

    style A fill:#7B1FA2,color:#ffffff
    style B fill:#1565C0,color:#ffffff
    style C fill:#FF9800,color:#000000
    style D fill:#2E7D32,color:#ffffff
    style E fill:#00897B,color:#ffffff
    style G fill:#D32F2F,color:#ffffff
```

### Template-to-artifact mapping

| Artifact | Role in eventual article |
|---|---|
| `executive-brief.md` | Supplies article title, meta description, BLUF, supported decisions, top trigger and lead visual. |
| `synthesis-summary.md` | Sets lead story, DIW ranking, narrative frame and article metadata suggestions. |
| `intelligence-assessment.md` | Supplies Key Judgments, PIRs and confidence-bearing intelligence conclusions. |
| `significance-scoring.md` | Provides ranking logic and sensitivity analysis. |
| `stakeholder-perspectives.md` | Names power/interest/position lenses and actor impacts. |
| `swot-analysis.md` | Converts evidence into strategic opportunities, vulnerabilities and TOWS moves. |
| `risk-assessment.md` | Scores electoral, policy, institutional, communication and implementation risks. |
| `threat-analysis.md` | Models political threat vectors, attack trees and manipulation/integrity issues. |
| `documents/{dok_id}-analysis.md` | Gives document-level evidence and detail. |
| `scenario-analysis.md` | Defines possible futures with probabilities and indicators. |
| `forward-indicators.md` | Converts analysis into dated watch items. |
| Family D files | Election, coalition, voter, historical, media and feasibility lenses. |
| `methodology-reflection.md` | Documents uncertainty, limits, neutrality and ICD 203 compliance. |
| `data-download-manifest.md` | Preserves collection transparency and source inventory. |

---

## 🚦 Analysis Gate

The single article-generation gate is [`.github/prompts/05-analysis-gate.md`](.github/prompts/05-analysis-gate.md). If the gate fails, the analysis must be fixed before aggregation.

### Gate checks

| Check | What it protects |
|---|---|
| Artifact existence | Prevents partial articles from incomplete analysis folders. |
| Per-document coverage | Ensures every `dok_id` in the manifest has a corresponding document analysis. |
| No stubs | Blocks `AI_MUST_REPLACE`, `[REQUIRED]`, `TODO:` and placeholder text. |
| Evidence citations | Blocks generic SWOT/ranking claims without `dok_id` or primary URL evidence. |
| Mermaid diagrams | Requires color-coded diagrams in core synthesis and key lens files. |
| Pass-2 evidence | Requires proof that the AI read and improved the first pass. |
| Family C structure | Requires BLUF, decisions, Key Judgments, PIRs, scenarios, ACH hypotheses and ICD 203 audit. |
| Family D structure | Requires dated forward indicators and coalition/seat-count material. |

### Why the gate is before article generation

The HTML article is a pure projection. If the analysis is weak, the article will be weak. The gate therefore enforces quality at the source of truth: the analysis artifacts.

---

## 📝 How `article.md` Is Generated

### Responsible code

| File | Responsibility |
|---|---|
| [`scripts/aggregate-analysis.ts`](scripts/aggregate-analysis.ts) | CLI wrapper for aggregating one folder or all folders. |
| [`scripts/render-lib/aggregator.ts`](scripts/render-lib/aggregator.ts) | Deterministic logic for ordering, reader-guide insertion, cleaning, linking and front matter. |
| [`scripts/render-lib/url-helpers.ts`](scripts/render-lib/url-helpers.ts) | GitHub blob/tree URL construction. |
| [`scripts/render-lib/constants.ts`](scripts/render-lib/constants.ts) | Shared paths, base URLs and language constants. |

### Aggregation command

```bash
npx tsx scripts/aggregate-analysis.ts \
  --date 2026-04-24 \
  --subfolder interpellations
```

For all existing analysis folders:

```bash
npx tsx scripts/aggregate-analysis.ts --all
```

### Aggregator input and output

| Input | Output |
|---|---|
| Canonical analysis `.md` files in `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/` excluding `README.md`, `article.md`, and `article.<lang>.md` | `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/article.md` |
| `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/documents/*.md` | Included under `## Per-document intelligence` |
| Supplementary `.md` files in the subfolder excluding `README.md`, `article.md`, and `article.<lang>.md` | Appended after the canonical sequence |

> **Note:** `README.md` is required for the 23-artifact analysis gate and repository readability, but it is intentionally not aggregated into the published `article.md`. Existing `article.md` and `article.<lang>.md` files are also excluded from aggregation.

### Canonical political-intelligence order

`AGGREGATION_ORDER` in [`scripts/render-lib/aggregator.ts`](scripts/render-lib/aggregator.ts) publishes sections in this order:

0. Generated `Reader Intelligence Guide` — a deterministic navigation layer that surfaces BLUF, Key Judgments, significance, media framing, forward indicators, scenarios, risks and dok_id-level evidence before the technical appendix.
1. `executive-brief.md`
2. `synthesis-summary.md`
3. `intelligence-assessment.md`
4. `significance-scoring.md`
5. `media-framing-analysis.md`
6. `stakeholder-perspectives.md`
7. `forward-indicators.md`
8. `scenario-analysis.md`
9. `risk-assessment.md`
10. `swot-analysis.md`
11. `threat-analysis.md`
12. `documents/*-analysis.md` as `## Per-document intelligence`
13. `election-2026-analysis.md`
14. `coalition-mathematics.md`
15. `voter-segmentation.md`
16. `comparative-international.md`
17. `historical-parallels.md`
18. `implementation-feasibility.md`
19. `devils-advocate.md`
20. `classification-results.md`
21. `cross-reference-map.md`
22. `methodology-reflection.md`
23. `data-download-manifest.md`
24. Remaining supplementary `.md` files, alphabetically.

### Cleaning and transformation rules

The aggregator (see [`scripts/render-lib/aggregator.ts`](scripts/render-lib/aggregator.ts) `cleanArtifactBody`):

- Requires `executive-brief.md`.
- Inserts a `Reader Intelligence Guide` before artifact sections so public readers can find high-value analysis such as media framing and forward indicators without scanning every audit artifact.
- Strips YAML front matter from each artifact.
- Removes the first H1 from each artifact and injects its own consistent `## Section Title` heading.
- **Demotes every internal heading by one level** (`##` → `###`, `###` → `####`, …, capped at H6) before concatenation. Without this, every artifact's own H2s become siblings of the wrapper-injected `## Section Title` and the rendered article ends up with ~170 H2s and a flat outline that violates WCAG 2.4.6 ("Headings and Labels"). Headings inside fenced code blocks are not affected. **Tested by** [`tests/render-lib.test.ts > demoteHeadings`](tests/render-lib.test.ts).
- **Strips legacy `_Source: file.md_` italic preamble lines** that some artifact templates author at the top of their body. Source attribution now lives in the auto-generated [Reader Intelligence Guide](#-reader-intelligence-guide-deterministic-navigation-layer) and the [`## Article Sources` appendix](#-article-sources-appendix-canonical-source-list) — repeating it under every heading reads like a folder listing, not journalism. Inline prose mentions like *"primary source: data.riksdagen.se/…"* are preserved.
- **Normalises heading slugs** to drop leading hyphens emitted by `github-slugger` when a heading starts with a stripped character (e.g. emoji like `🎯` in `## 🎯 BLUF` slug to `-bluf` and would otherwise become `id="rm--bluf"` once the `rm-` prefix is applied). Both [`markdown.ts#rehypeSlugWithPrefix`](scripts/render-lib/markdown.ts) and [`aggregator.ts#anchorForTitle`](scripts/render-lib/aggregator.ts) collapse leading/trailing hyphens to keep heading IDs and Reader Intelligence Guide anchors in lock-step.
- Removes leading admin bylines such as `Author`, `Run ID`, `Classification`, `Confidence`, `Prepared by`, `Methodology` and similar metadata fields.
- Removes trailing `Document control`, `Audit trail`, `Generated by`, template footer and `Pass 2` self-audit sections.
- Rewrites relative Markdown links to absolute GitHub blob URLs.
- Keeps Mermaid fences untouched so the renderer can preserve them.
- Annotates each section heading with an HTML comment of shape `<!-- source: <file> :: <github-blob-url> -->` for offline auditors. The comment is dropped by `rehype-sanitize` so it never reaches rendered HTML.
- Builds front matter with `title`, `description`, `date`, `subfolder`, `slug`, `source_folder`, `generated_at`, `language` and `layout`.

### 📚 Article Sources appendix (canonical source list)

After every artifact section the aggregator emits a single `## Article Sources` H2 at the very end of the article. Each entry is a markdown list link to the artifact on GitHub:

```markdown
## Article Sources

Each section above projects one analysis artifact. The full audited markdown is available on GitHub:

- [`executive-brief.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/.../executive-brief.md)
- [`synthesis-summary.md`](https://github.com/.../synthesis-summary.md)
- …
```

This replaces the legacy per-section `_Source: file.md_` italics. Auditors get one canonical list; readers see clean prose; SEO crawlers see one trustworthy `<ul>` of primary-source links instead of 25+ duplicated italics.

### Title and description extraction

`article.md` metadata comes from `executive-brief.md`:

| Metadata field | Source logic |
|---|---|
| `title` | First H1 in `executive-brief.md`, cleaned of boilerplate/date; fallback to BLUF-derived title; fallback to `$SUBFOLDER — $DATE`. |
| `description` | Prefer the first paragraph after a `BLUF` heading; fallback to first prose paragraph; sentence-aware truncation. |
| `slug` | `$ARTICLE_DATE-$SUBFOLDER`. |
| `source_folder` | `analysis/daily/$ARTICLE_DATE/$SUBFOLDER`. |

### Example output: `2026-04-24/interpellations/article.md`

The sample file begins with:

```yaml
---
title: "Interpellation Debates"
description: "A single new interpellation (HD10447, S) was announced today, forcing Energy- och näringsminister Ebba Busch (KD) to defend the 2024 abolition of the high-sick-pay-cost reimbursement by 2026-05-07."
date: 2026-04-24
subfolder: interpellations
slug: 2026-04-24-interpellations
source_folder: analysis/daily/2026-04-24/interpellations
generated_at: 2026-04-24T18:27:52.276Z
language: en
layout: article
---
```

It then emits deterministic sections such as `## Executive Brief`, `## Synthesis Summary`, `## Intelligence Assessment — Key Judgments`, `## Significance Scoring`, and so on. Source attribution is provided by the auto-generated `## Reader Intelligence Guide` (top of article) and `## Article Sources` appendix (bottom of article); the per-section heading carries an HTML comment for offline auditors:

```markdown
## Executive Brief
<!-- source: executive-brief.md :: https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-04-24/interpellations/executive-brief.md -->

### 🎯 BLUF

…artifact body content, with all internal headings demoted by one level so the outline stays semantically nested…
```

The generated first body section is `## Reader Intelligence Guide`, which is intentionally not sourced to a single artifact because it is a deterministic navigation projection of the artifact set.

### ✅ Article minimum-content validator (`scripts/validate-article.ts`)

Every aggregated `analysis/daily/$DATE/$SUBFOLDER/article.md` is checked by [`scripts/validate-article.ts`](scripts/validate-article.ts) — a hard, scripted CI gate that fails the build on any of the following violations:

| Rule code | What it blocks | Why it matters |
|---|---|---|
| `unresolved-placeholder` | `[REQUIRED:…]`, `AI_MUST_REPLACE`, `<insert …>`, `TBD:`, `FILL IN` strings surviving Pass-2 | Templates carry these markers on disk; if they reach `article.md` the AI agent skipped a substitution. Article is not publishable. |
| `missing-reader-guide` | Article missing `## Reader Intelligence Guide` | Aggregator-generated; if missing, the aggregator broke. |
| `missing-executive-brief` | Article missing `## Executive Brief` H2 | Required artifact malformed. |
| `missing-bluf` | No `BLUF` heading anywhere | Editorial product cannot ship without a Bottom-Line-Up-Front. |
| `missing-sources-appendix` | Article missing `## Article Sources` | Aggregator-generated; if missing, re-aggregate. |
| `bluf-too-short` | BLUF prose < 80 chars | Stub BLUFs (e.g. `TODO`, `pending`) escape Pass-2. A publishable BLUF needs actor + active verb + object + when + so-what. |
| `bluf-too-long` | BLUF prose > 1200 chars | Runaway dumps belong in Synthesis Summary or Intelligence Assessment, not the 60-second read. |
| `empty-heading-slug` | Any heading whose permissive slug is empty (e.g. emoji-only) | Empty `#anchor` would break the Reader Intelligence Guide and SERP deep-links. |
| `per-doc-missing-dok_id` | Any `### HD…`/`### FiU…` per-document subsection lacking at least one dok_id-style code in its body | Every per-document subsection must trace to a primary-source identifier; orphan sections are blocked. |

**Run locally:**

```bash
# Validate every aggregated article in the repo:
npm run validate-article

# Validate a single article:
npx tsx scripts/validate-article.ts analysis/daily/2026-04-24/interpellations/article.md
```

The validator is wired into `npm run validate-all` and runs as a hard CI gate after aggregation. It is **content-only** — structural projections (heading demotion, source-preamble stripping, slug normalisation) are unit-tested in [`tests/render-lib.test.ts`](tests/render-lib.test.ts); this script guards the AI-authored contribution: the artifact contents that the aggregator concatenates.

---

## 🌐 How `article.md` Becomes HTML

### Responsible code

| File | Responsibility |
|---|---|
| [`scripts/render-articles.ts`](scripts/render-articles.ts) | CLI wrapper that locates `article.md`, auto-aggregates if needed, and renders target languages. |
| [`scripts/render-lib/markdown.ts`](scripts/render-lib/markdown.ts) | Markdown → sanitized HTML pipeline. |
| [`scripts/render-lib/article.ts`](scripts/render-lib/article.ts) | Parses front matter, renders body, builds JSON-LD and source footer. |
| [`scripts/render-lib/chrome.ts`](scripts/render-lib/chrome.ts) | Shared HTML head/header/footer, language switcher, SEO and compliance links. |

### Render command

```bash
npx tsx scripts/render-articles.ts \
  --date 2026-04-24 \
  --subfolder interpellations \
  --lang en,sv
```

For all existing articles:

```bash
npx tsx scripts/render-articles.ts --all --lang en,sv
```

### Markdown pipeline

[`scripts/render-lib/markdown.ts`](scripts/render-lib/markdown.ts) processes article Markdown through:

1. `remark-parse`
2. `remark-gfm`
3. `remark-rehype` with controlled raw HTML handling
4. `rehype-raw`
5. `rehype-slug`
6. `rehype-autolink-headings`
7. `rehype-sanitize`
8. `rehype-stringify`

The sanitizer deliberately allows only the extra attributes needed for Mermaid blocks and heading anchors. It does **not** allow inline `<script>`, `javascript:` URLs, `<iframe>` or arbitrary `<style>` tags.

### HTML output

For the example article:

```text
news/2026-04-24-interpellations-en.html
news/2026-04-24-interpellations-sv.html
```

The renderer writes one complete HTML file per requested language.

### HTML page structure

```mermaid
%%{init: {"theme":"dark","themeVariables":{"primaryColor":"#1565C0","primaryTextColor":"#ffffff","primaryBorderColor":"#0A3F7F","lineColor":"#00D9FF","secondaryColor":"#7B1FA2","secondaryTextColor":"#ffffff","tertiaryColor":"#2E7D32","tertiaryTextColor":"#ffffff","fontFamily":"Inter, Helvetica, Arial, sans-serif"}}}%%
flowchart TB
    HTML["<!DOCTYPE html>"] --> HEAD["<head><br/>SEO · Open Graph · Twitter · JSON-LD · hreflang"]
    HTML --> BODY["<body class='rm-article-body'>"]
    BODY --> SKIP["Skip link"]
    BODY --> HEADER["rm-site-header<br/>logo · nav · language switcher"]
    HEADER --> SUBNAV["breadcrumb · published date"]
    BODY --> MAIN["main#main.rm-article-main"]
    MAIN --> ARTICLE["article.rm-article"]
    ARTICLE --> ARTICLEHEAD["article header<br/>h1 · dek · date · language · provenance badges"]
    ARTICLE --> CONTENT["rm-article-body<br/>sanitized Markdown HTML"]
    ARTICLE --> SOURCES["rm-article-sources<br/>links to every artifact"]
    BODY --> FOOTER["rm-site-footer<br/>navigation · trust · footer languages"]
    FOOTER --> SCRIPTS["Mermaid loader · back-to-top"]

    style HEAD fill:#1565C0,color:#ffffff
    style HEADER fill:#1A1E3D,color:#ffffff
    style CONTENT fill:#7B1FA2,color:#ffffff
    style SOURCES fill:#FF9800,color:#000000
    style FOOTER fill:#2E7D32,color:#ffffff
```

### SEO and provenance

The renderer embeds:

| SEO/provenance element | Current implementation |
|---|---|
| `<title>` | Article title plus `— Riksdagsmonitor` unless already branded. |
| Meta description | `article.md` front matter description. |
| Canonical URL | `https://riksdagsmonitor.com/news/$DATE-$SUB-$LANG.html`. |
| Hreflang | All 14 supported language alternates plus `x-default`. |
| Open Graph | `og:type=article`, title, description, URL, locale, image and update timestamp. |
| Twitter card | Summary large image metadata. |
| JSON-LD | `NewsArticle` with `isBasedOn` listing every `.md` / `.json` source artifact. |
| Article dek and provenance badges | Header-level summary and visible public-source / AI-FIRST / traceability badges. |
| Source footer | Visible `Analysis sources` section linking source artifacts to GitHub, excluding generated `article.md`, translated `article.<lang>.md` and temporary `pass1/` snapshots. |

---

## 🎨 UI/UX, Mermaid, D3 and Chart.js Support

### Shared article chrome

Generated article pages use a dedicated `rm-*` CSS namespace to avoid collisions with legacy page components. The main styling is in [`styles.css`](styles.css) under `Article Pipeline — chrome produced by scripts/render-lib/buildChrome`.

| UI element | CSS / HTML support |
|---|---|
| Sticky header | `.rm-site-header`, `.rm-site-header-inner` |
| Brand and tagline | `.rm-logo`, `.rm-logo-text`, `.rm-logo-brand`, `.rm-logo-tagline` |
| Primary navigation | `.rm-site-nav` |
| Header language switcher | `<details class="rm-lang-switcher">` + `.rm-lang-switcher-dropdown` |
| Breadcrumb | `.rm-breadcrumb` inside `.rm-site-subnav` |
| Article container | `.rm-article-main`, `.rm-article`, `.rm-article-header`, `.rm-article-body` |
| Source provenance footer | `.rm-article-sources`, `.rm-article-sources-list` |
| Site footer | `.rm-site-footer`, `.rm-site-footer-inner`, `.rm-footer-*` |
| Footer language row | `.rm-footer-langs`, `.rm-lang-code` |

### Light and dark mode

The repository uses CSS custom properties for light and dark color palettes:

- `:root` defines the default light-mode accessible palette.
- `@media (prefers-color-scheme: dark)` defines dark-mode tokens.
- `html[data-theme="light"]` overrides generated article chrome to keep article pages readable in explicit light mode.
- `html[data-theme="dark"]` is supported by the site-wide theme bootstrap and dashboard pages.

Article chrome uses cyberpunk tokens such as:

| Token | Typical purpose |
|---|---|
| `--primary-cyan` / fallback `#00d9ff` | Article headings, links and borders. |
| `--primary-magenta` / fallback `#ff006e` | Hover state and emphasis. |
| `--primary-yellow` / fallback `#ffbe0b` | Section headings and source blocks. |
| `--dark-bg` / fallback `#0a0e27` | Article page background. |
| `--mid-bg` / fallback `#1a1e3d` | Cards, headers and footer. |
| `--light-text` / fallback `#e0e0e0` | Body text in dark mode. |

### Mermaid support

Mermaid diagrams are authored directly inside analysis artifacts:

````markdown
```mermaid
flowchart TB
  A[Evidence] --> B[Analysis]
  B --> C[Article]
  style A fill:#1565C0,color:#ffffff
  style B fill:#7B1FA2,color:#ffffff
  style C fill:#2E7D32,color:#ffffff
```
````

The rendering path is:

1. Markdown contains ```` ```mermaid ```` fences.
2. [`scripts/render-lib/markdown.ts`](scripts/render-lib/markdown.ts) rewrites them to `<pre class="mermaid">` before Markdown parsing.
3. `rehype-sanitize` allows the `pre.mermaid` class.
4. [`scripts/render-lib/chrome.ts`](scripts/render-lib/chrome.ts) emits an inline imperative bootstrap script that injects a `<script type="module" src="/js/lib/mermaid-init.mjs">` into `<head>` at runtime. The DOM-injection pattern is intentional: it bypasses Vite's HTML/script-tag transformer so the loader and the vendored mermaid runtime are **not** bundled, hashed and re-emitted under `/assets/`. (The previous static `<script type="module" src="…mermaid-init.mjs">` pattern caused production 404s like `/assets/mermaid.esm.min-XXXX.mjs` whenever the pinned `mermaid` devDependency was upgraded between deploys, because Vite would emit a chunk hash that didn't match the file actually deployed to S3.)
5. [`js/lib/mermaid-init.mjs`](js/lib/mermaid-init.mjs) dynamically imports Mermaid from the **same-origin vendored copy under `js/lib/mermaid/`** (resolved against its own `import.meta.url`), initializes a dark theme and renders all Mermaid blocks after page load.

The same inline bootstrap also injects [`/js/back-to-top.js`](js/back-to-top.js) (module) and [`/js/theme-toggle.js`](js/theme-toggle.js) (classic, deferred) so the dark/light theme button in the rm-site-header stays functional without going through Vite's bundler. The matching anti-flash bootstrap (`html[data-theme]` set before first paint) is emitted as an inline `<script>` in `<head>` by [`renderChromeHead`](scripts/render-lib/chrome.ts).

The Mermaid distribution is vendored at build time:

| Step | Location | What it does |
|---|---|---|
| **Pin** | [`package.json`](package.json) `devDependencies` | `mermaid` is pinned (currently `11.4.1`) — supply-chain audited like every other dependency, in the npm SBOM. |
| **Copy** | [`scripts/copy-vendor-mermaid.ts`](scripts/copy-vendor-mermaid.ts) | Run as the first step of `prebuild` (and `predev`). Copies `node_modules/mermaid/dist/mermaid.esm.min.mjs` and its required `chunks/mermaid.esm.min/*.mjs` into `js/lib/mermaid/` (≈2.6 MB, 64 files). Sourcemaps, type declarations, mocks and other ESM variants are excluded. |
| **Gitignore** | [`.gitignore`](.gitignore) | `js/lib/mermaid/` is intentionally ignored — the directory is reproducible from the pinned dependency, so we don't commit duplicates of `node_modules` content. |
| **Bundle** | [`.github/workflows/deploy-s3.yml`](.github/workflows/deploy-s3.yml) | The "Copy JS libraries to build output" step merges the full `js/` tree (including `js/lib/mermaid/`) into `dist/js/` after the Vite build, alongside `chart.umd.4.4.1.js`, `d3.7.9.0.min.js`, etc. |
| **Deploy** | [`scripts/deploy-s3.sh`](scripts/deploy-s3.sh) | `*.mjs` files are uploaded with `Content-Type: application/javascript` and `Cache-Control: public, max-age=31536000, immutable` — same long-cache treatment as every other vendored asset. |
| **Guard** | [`tests/no-external-cdn.test.ts`](tests/no-external-cdn.test.ts) | Vitest test that fails CI if any runtime file under `js/` or any rendered article under `news/` references `cdn.jsdelivr.net`, `cdnjs.cloudflare.com`, `unpkg.com`, `esm.sh`, `cdn.skypack.dev`, or `ajax.googleapis.com`. Riksdagsmonitor serves all JavaScript from its own S3/CloudFront origin — no external CDN allowed. |

CSP impact: scripts can be allowed with `script-src 'self'` only — no third-party host needs to be added to the policy. SRI hashes for every Mermaid `.mjs` chunk are produced by `vite-plugin-sri-gen` because the files now live under the build output.

The analysis gate requires color-coded Mermaid through `style` directives or Mermaid `themeVariables` / `%%{init}` blocks.

### D3 and Chart.js support

Current article Markdown rendering is intentionally static and sanitized. D3 and Chart.js are supported by the broader site and dashboards, not by arbitrary inline article scripts.

| Capability | Current support |
|---|---|
| **Chart.js package** | Listed in `package.json` and optimized in `vite.config.js`. |
| **D3 package** | Listed in `package.json` and split into a Vite `d3` manual chunk. |
| **Dashboard modules** | `scripts/coalition-dashboard/*`, `scripts/committees-dashboard/*` and shared chart utilities support interactive dashboards. |
| **Article chart data** | `04-analysis-pipeline.md` permits JSON files such as `vote-distribution.json`, `risk-heatmap.json`, `coalition-math.json`, `forward-indicators.json`, and economic chart data. |
| **Article HTML safety** | Sanitizer blocks inline scripts. Any future article-level Chart.js/D3 visualization should be implemented as trusted site code that reads artifact JSON, not AI-authored inline JS. |

**Important limitation:** generated news articles today automatically render Mermaid diagrams and static Markdown tables. They do not automatically instantiate arbitrary D3/Chart.js widgets from Markdown because that would require trusting AI-authored script markup. The supported secure pattern is artifact JSON + trusted site module + accessible fallback.

Recommended future pattern for article-level interactive charts:

```mermaid
%%{init: {"theme":"dark","themeVariables":{"primaryColor":"#00897B","primaryTextColor":"#ffffff","lineColor":"#FFBE0B","secondaryColor":"#1565C0","tertiaryColor":"#7B1FA2","fontFamily":"Inter, Helvetica, Arial, sans-serif"}}}%%
flowchart LR
    A["analysis/daily/.../risk-heatmap.json"] --> B["Trusted renderer module<br/>js/article-charts.mjs"]
    B --> C["Chart.js / D3 component"]
    C --> D["Accessible figure<br/>caption · table fallback · keyboard support"]

    style A fill:#1565C0,color:#ffffff
    style B fill:#00897B,color:#ffffff
    style C fill:#7B1FA2,color:#ffffff
    style D fill:#2E7D32,color:#ffffff
```

This preserves CSP and sanitizer discipline while enabling richer visualizations.

---

## 🌍 Language Switchers and Translation Model

### Supported languages

The rendered article chrome supports 14 language alternates:

| Code in URLs | Hreflang | Language |
|---|---|---|
| `en` | `en` | English |
| `sv` | `sv` | Swedish |
| `da` | `da` | Danish |
| `no` | `nb` | Norwegian Bokmål — URLs currently use legacy `no`; hreflang already uses BCP-47 `nb`. |
| `fi` | `fi` | Finnish |
| `de` | `de` | German |
| `fr` | `fr` | French |
| `es` | `es` | Spanish |
| `nl` | `nl` | Dutch |
| `ar` | `ar` | Arabic, RTL |
| `he` | `he` | Hebrew, RTL |
| `ja` | `ja` | Japanese |
| `ko` | `ko` | Korean |
| `zh` | `zh` | Chinese |

Norwegian is in a compatibility migration state, not a permanent language-code design decision: generated HTML uses the BCP-47 `nb` hreflang for Norwegian Bokmål, while existing filenames and URL siblings still use the legacy `_no` / `-no.html` pattern for backwards-compatible site output. New code should keep both surfaces in sync until the wider URL migration is completed.

### Translation workflow

Per-type content workflows render only core languages, normally `en,sv`. The dedicated translation workflow is:

- [`.github/workflows/news-translate.md`](.github/workflows/news-translate.md)

It consumes already-rendered English/Swedish articles and produces the remaining 12 language variants. This separation prevents every content workflow from trying to translate all languages under the same time and safe-output budget.

### Language UI

The article chrome emits two switchers:

1. **Header dropdown** — `<details class="rm-lang-switcher">` with `role="menuitem"` links.
2. **Footer language row** — `.rm-footer-langs`, always visible for discoverability.

The renderer populates hreflang alternates for all languages even when the sibling translated pages are not yet generated. The URLs remain stable and predictable for the translation workflow.

---

## 🚀 Build and S3 Deployment

### Canonical S3 deployment workflow

The canonical repository file is [`.github/workflows/deploy-s3.yml`](.github/workflows/deploy-s3.yml). This is the S3 deployment workflow covered here.

### Build chain

[`package.json`](package.json) defines the build pipeline:

```json
"prebuild": "npx tsx scripts/aggregate-analysis.ts --all --quiet && npx tsx scripts/render-articles.ts --all --lang en,sv --quiet && npx tsx scripts/generate-news-indexes/index.ts && npx tsx scripts/extract-news-metadata.ts && npx tsx scripts/generate-sitemap-html.ts && npx tsx scripts/generate-political-intelligence.ts && npx tsx scripts/generate-rss.ts && npx tsx scripts/generate-sitemap.ts",
"build": "vite build",
"postbuild": "cp rss.xml dist/rss.xml && cp sitemap.xml dist/sitemap.xml && cp -r cia-data dist/cia-data"
```

This means `npm run build` regenerates all aggregate/render/index/metadata outputs before Vite compiles the site.

### Vite article discovery

[`vite.config.js`](vite.config.js) auto-discovers article HTML files under `news/`:

- It scans `news/` recursively.
- It registers every non-index `.html` article as a Rollup input.
- It ensures new articles are included in `dist/news/` and deployed to S3.
- It splits Chart.js, D3 and PapaParse into manual chunks for dashboard optimization.
- It uses `vite-plugin-sri-gen` to generate Subresource Integrity hashes.

### `deploy-s3.yml` jobs

| Job | Trigger | Purpose |
|---|---|---|
| `deploy` | Push to `main` or manual dispatch with `fix_mimetypes=false` | Build and publish the site. |
| `fix-mimetypes` | Manual dispatch with `fix_mimetypes=true` | Repair MIME metadata on existing S3 objects without a full build/deploy. |

### Deployment workflow steps

The `deploy` job performs:

1. `step-security/harden-runner` with egress policy `block` and explicit allowed endpoints.
2. Full checkout with `fetch-depth: 0`.
3. Node.js 25 setup with npm cache.
4. `npm ci`.
5. Guard against broken news article references:
   - No `back-to-top.ts` references in generated article HTML.
   - No `news-article.js` references.
   - No absolute `/js/lib/` script paths in news pages.
6. `npm run build`.
7. Build artifact verification:
   - `dist/`
   - `dist/index.html`
   - `dist/rss.xml`
   - `dist/sitemap.xml`
   - `dist/sitemap.html`
   - representative localized sitemaps (`sitemap_sv.html`, `sitemap_ar.html`)
   - political-intelligence pages in EN/SV/AR representative set
   - `dist/news/`
8. Copy `docs/` to `dist/docs/` if present.
9. Merge `js/` into `dist/js/` so article dependencies such as Mermaid init and back-to-top are present.
10. Configure AWS credentials through OIDC (`aws-actions/configure-aws-credentials`).
11. Run [`scripts/deploy-s3.sh`](scripts/deploy-s3.sh) against `dist` and the S3 bucket.
12. Invalidate CloudFront with `/*`.

### Files generated or used during build/deploy

| File or directory | Generated by | Deployed? | Notes |
|---|---|---:|---|
| `analysis/daily/*/*/article.md` | `scripts/aggregate-analysis.ts` | No, unless copied separately; source remains in repo | Canonical Markdown article source. |
| `news/$DATE-$SUB-$LANG.html` | `scripts/render-articles.ts` and `news-translate.md` | ✅ | User-facing articles. |
| `news/index*.html` | `scripts/generate-news-indexes/index.ts` | ✅ | News listing pages. |
| `political-intelligence*.html` | `scripts/generate-political-intelligence.ts` | ✅ | Political intelligence landing pages. |
| `rss*.xml` | `scripts/generate-rss.ts` | ✅ | Copied to `dist/` in `postbuild`. |
| `sitemap.xml` | `scripts/generate-sitemap.ts` | ✅ | Copied to `dist/` in `postbuild`. |
| `sitemap*.html` | `scripts/generate-sitemap-html.ts` | ✅ | Vite inputs. |
| `dist/` | `vite build` | ✅ | Primary deployment directory. |
| `dist/js/` | Vite + deploy workflow merge from `js/` | ✅ | Includes `js/lib/mermaid-init.mjs`. |
| `dist/docs/` | deploy workflow copy from `docs/` | ✅ | Documentation output when present. |
| `dist/cia-data/` | `postbuild` | ✅ | CIA data copied into build output. |

The rendered HTML source footer and JSON-LD `isBasedOn` block enumerate source `.md` and `.json` files found in the analysis folder. Generated `article.md`, translated `article.<lang>.md`, and temporary `pass1/` snapshots are excluded so the provenance list stays reader-relevant.

### S3 upload and cache strategy

[`scripts/deploy-s3.sh`](scripts/deploy-s3.sh) uploads by extension with explicit MIME types and cache headers. It uses `aws s3 cp --recursive` for type-specific passes so metadata is corrected even if content is unchanged, then runs a final `sync --delete --size-only` to remove orphaned objects.

| Extension/type | Content-Type | Cache-Control |
|---|---|---|
| `.html` | `text/html; charset=utf-8` | `public, max-age=3600, must-revalidate` |
| `.css` | `text/css` | `public, max-age=31536000, immutable` |
| `.js`, `.mjs` | `application/javascript` | `public, max-age=31536000, immutable` |
| Images (`.webp`, `.png`, `.jpg`, `.gif`, `.svg`, `.ico`) | Explicit image MIME | `public, max-age=31536000, immutable` |
| Fonts | Explicit font MIME | `public, max-age=31536000, immutable` |
| `.xml`, `.json`, `.txt`, `.csv`, `.webmanifest`, `.md` | Explicit metadata/data MIME | Usually `public, max-age=86400` |
| `.map`, `.wasm` | `application/json`, `application/wasm` | Long immutable for maps/wasm |
| `docs/` | Explicit per-extension MIME | Mostly `public, max-age=86400` |

### Deployment flow

```mermaid
%%{init: {"theme":"dark","themeVariables":{"primaryColor":"#0A66C2","primaryTextColor":"#ffffff","lineColor":"#90CAF9","secondaryColor":"#2E7D32","secondaryTextColor":"#ffffff","tertiaryColor":"#FF9800","tertiaryTextColor":"#000000","errorBkgColor":"#D32F2F","fontFamily":"Inter, Helvetica, Arial, sans-serif"}}}%%
flowchart TB
    A["Push to main / manual dispatch"] --> B["Harden runner<br/>egress block allowlist"]
    B --> C["npm ci"]
    C --> D["Guard news HTML references"]
    D --> E["npm run build<br/>prebuild + Vite + postbuild"]
    E --> F["Verify dist artifacts"]
    F --> G["Copy docs and js libraries"]
    G --> H["AWS OIDC credentials"]
    H --> I["scripts/deploy-s3.sh<br/>explicit MIME + cache headers"]
    I --> J["CloudFront invalidation /*"]

    style B fill:#D32F2F,color:#ffffff
    style E fill:#1565C0,color:#ffffff
    style F fill:#FF9800,color:#000000
    style I fill:#2E7D32,color:#ffffff
    style J fill:#0A66C2,color:#ffffff
```

---

## 🛡️ Security, Privacy and ISMS Controls

### Classification and privacy

Per [README.md](README.md), [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) and [THREAT_MODEL.md](THREAT_MODEL.md):

| Dimension | Classification |
|---|---|
| Confidentiality | Public |
| Integrity | High |
| Availability | High |
| Privacy | Public-official personal data only, processed for transparency and democratic accountability |

Political opinions are sensitive under GDPR Article 9, but this platform uses public political data about public officials in their official capacity, with public-interest and legitimate-interest grounds. Article generation must remain neutral, proportionate and evidence-based.

### Trust boundaries

| Boundary | Control |
|---|---|
| Public political data → AI context | Prompt hardening, source-integrity rules, evidence standard, no non-public/leaked data. |
| AI analysis → article | Analysis gate, no stubs, Mermaid/evidence/Pass-2 checks, deterministic aggregation. |
| Markdown → HTML | `rehype-sanitize`, no AI-written HTML scripts, controlled Mermaid handling. |
| Workflow → repository write | Safe outputs and one PR max; AI job has read-only permissions. |
| Build runner → internet | `step-security/harden-runner` egress allowlist in deploy workflow. |
| GitHub → AWS | OIDC federation, no long-lived AWS keys. |
| S3 → users | CloudFront, TLS, cache headers, invalidation, S3 metadata controls. |

### Threat-model alignment

The article pipeline specifically mitigates threats called out in [THREAT_MODEL.md](THREAT_MODEL.md):

| Threat | Mitigation in article generation |
|---|---|
| Prompt injection from source content | Prompt modules, no direct tool write, gate before publication. |
| LLM hallucination | Every claim must cite primary evidence; `methodology-reflection.md` audits evidence sufficiency and ICD 203. |
| Model-generated misinformation | AI-FIRST Pass 2, source diversity, confidence labels and PR review. |
| Data poisoning | Manifest, source URLs, Git-tracked diffs and source footer provenance. |
| XSS / HTML injection | Sanitized Markdown pipeline and no inline AI-authored scripts. |
| Supply-chain risk | Pinned GitHub Actions, npm SBOM, Dependabot, CodeQL, SRI generation. |

---

## ✅ Operational Checklist

### For a normal article-generation run

- [ ] Confirm the workflow (`news-*.md`) imports all required prompt modules.
- [ ] Confirm MCP pre-warm and external endpoint diagnostics completed.
- [ ] Confirm public data was downloaded and manifest written.
- [ ] Confirm all 23 core artifacts exist.
- [ ] Confirm every manifest `dok_id` has a `documents/{dok_id}-analysis.md` file or documented cluster handling.
- [ ] Confirm Pass 2 happened and `methodology-reflection.md` records audit findings.
- [ ] Run or verify the `05-analysis-gate.md` inline checks.
- [ ] Run `aggregate-analysis.ts` for the date/subfolder.
- [ ] Inspect `article.md` for title, BLUF, source links and section order.
- [ ] Run `render-articles.ts --lang en,sv`.
- [ ] Confirm `news/$DATE-$SUB-en.html` and `news/$DATE-$SUB-sv.html` exist and contain `<article class="rm-article">` and `rm-article-sources`.
- [ ] Let `news-translate.md` produce the remaining 12 languages.
- [ ] Let CI run `validate-news`, HTMLHint, build and deployment checks.

### For local reproduction of the example

```bash
ARTICLE_DATE=2026-04-24
SUBFOLDER=interpellations
CORE_LANGUAGES=en,sv

npx tsx scripts/aggregate-analysis.ts \
  --date "$ARTICLE_DATE" \
  --subfolder "$SUBFOLDER"

npx tsx scripts/render-articles.ts \
  --date "$ARTICLE_DATE" \
  --subfolder "$SUBFOLDER" \
  --lang "$CORE_LANGUAGES"
```

Expected outputs:

```text
analysis/daily/2026-04-24/interpellations/article.md
news/2026-04-24-interpellations-en.html
news/2026-04-24-interpellations-sv.html
```

---

## 🚀 Future Improvements Roadmap

This section documents the highest-leverage improvements identified for producing publication-quality political-intelligence articles from the analysis artifact pipeline. Items are organized into three domains: political-intelligence quality, UI/UX of the rendered product, and code quality/architecture.

---

### 🧠 Political Intelligence Quality

The current system produces a correct, auditable article. The following improvements would raise its political-intelligence value significantly.

#### 1. Integrated narrative articles (not artifact collages)

**Problem:** Generated articles currently expose artifact structure directly to the reader: `## Executive Brief`, `## Synthesis Summary`, `## Intelligence Assessment — Key Judgments`, and so on. Each section is the content of a corresponding source file, pasted in sequence. The reader experiences the article as an annotated folder listing, not a coherent intelligence narrative.

**Improvement:** Introduce a narrative synthesis step between aggregation and rendering. A trusted synthesis pass should produce a **unified article body** structured as:

- **Lead** (lede): one or two punchy sentences naming the most democratically significant finding (DIW-ranked), the principal actor, and the forward trigger.
- **Context block**: 2–3 sentences of baseline context (coalition status, committee history, relevant legislation).
- **Main development**: the story, drawing on Key Judgments and per-document analysis.
- **Stakes and alternatives**: scenario probabilities, SWOT, coalition math, risk scores — woven into the narrative.
- **Forward view**: dated watch items from `forward-indicators.md` and scenarios.
- **Technical appendix** (optional reader-expand): the full artifact stack for researchers.

This would require the aggregator to emit a clean `article-narrative.md` (authored in this later synthesis step) that renders in place of the current artifact collage, with the artifact stack demoted to a collapsible appendix.

#### 2. Article-type-specific ordering

**Problem:** `AGGREGATION_ORDER` is a single static list applied identically to all article types: interpellations, propositions, committee reports, evening analyses, motions, weekly reviews, monthly reviews and forecasting runs.

**Improvement:** Define a map from article type to a specialized order:

| Article type | Priority lenses |
|---|---|
| `interpellations` | `executive-brief` → `intelligence-assessment` → `forward-indicators` (ministerial deadline) → `stakeholder-perspectives` → … |
| `propositions` | `executive-brief` → `synthesis-summary` → `implementation-feasibility` → `coalition-mathematics` → `scenario-analysis` → … |
| `committee-reports` | `executive-brief` → `synthesis-summary` → `significance-scoring` → `stakeholder-perspectives` → `swot-analysis` → … |
| `evening-analysis` | `executive-brief` → `intelligence-assessment` → `media-framing-analysis` → `forward-indicators` → … |
| `motions` | `executive-brief` → `coalition-mathematics` → `voter-segmentation` → `scenario-analysis` → … |
| `forecasting` | `executive-brief` → `scenario-analysis` → `coalition-mathematics` → `election-2026-analysis` → `forward-indicators` → … |

The `aggregateAnalysis` function should accept an optional `articleType` parameter and select the appropriate order from a type map.

#### 3. Proper journalistic lede extraction

**Problem:** The article `description` and article header dek are extracted from the first prose paragraph of `executive-brief.md` (after stripping admin bylines). This is often a summary sentence, not a proper lede.

**Improvement:** Introduce a dedicated `lede` field contract for `executive-brief.md`: the file should contain a `## 🎯 BLUF` section whose first sentence is a single tight lede in the form **"Who did what to whom, and by when?"** The aggregator should prefer this sentence for description and dek, and the analysis gate should enforce that it is present, names at least one real actor with their title, and includes one dok_id or date trigger.

#### 4. Confidence and Admiralty code visualization

**Problem:** Confidence labels (`HIGH`, `MEDIUM`, `LOW`) and Admiralty source codes (`A2`, `B3`, etc.) appear as plain inline text throughout the articles. Readers must know what these mean.

**Improvement:**

- Render `CONFIDENCE: HIGH/MEDIUM/LOW` spans as styled `<mark class="confidence-high|medium|low">` chips via a post-processing pass in `markdown.ts`.
- Render Admiralty codes `A1`–`F6` as `<abbr title="Source reliability A — Completely reliable; Information credibility 1 — Confirmed by other sources">A1</abbr>`.
- Add a once-per-page methodology note in the article footer explaining the confidence and Admiralty schema.
- The styled chips should work in both light and dark mode.

#### 5. Media framing as inline callouts

**Problem:** `media-framing-analysis.md` is currently appended as section 5. Its value is highest when readers encounter framing alerts near the finding they apply to, not as a separate section they may never reach.

**Improvement:** Allow `media-framing-analysis.md` to emit a `## 🔎 Framing Alerts` subsection per key story that can be referenced inline. The aggregator could inject "framing callout" anchors into the main narrative at matching dok_id boundaries. This is a step toward the integrated narrative article model above.

#### 6. Forward-indicator timelines

**Problem:** `forward-indicators.md` is a Markdown table. Tables work, but for a time-ordered set of dated watch items, a visual timeline communicates urgency more effectively.

**Improvement:** The analysis agent should emit a `forward-indicators.json` alongside `forward-indicators.md` with structured events (`{"date": "2026-05-07", "title": "...", "type": "deadline|vote|publication", "probability": 0.75, "dok_id": "HD10447"}`). A trusted site module (`js/article-forward-indicators.mjs`) would render this as a responsive horizontal timeline using the existing Chart.js build chunk. The Markdown table remains as the accessible fallback.

#### 7. Historical parallels integration

**Problem:** `historical-parallels.md` appears late (position 17) in the current order and tends to be read by researchers only, despite containing high-value context for general readers.

**Improvement:** The synthesis narrative (improvement #1) should weave the single most relevant historical parallel into the context block of the article lead. The full `historical-parallels.md` section would remain in the technical appendix.

#### 8. Cross-article series navigation

**Problem:** There is no editorial continuity between articles on the same topic. An interpellation today has no link to the committee hearing next week or the vote result the month after.

**Improvement:** Introduce a `related_articles` field in `article.md` front matter listing prior/subsequent articles in the same legislative sequence. The article chrome renderer should emit a `<nav class="rm-article-series">` block. Population could initially be manual or auto-populated by a script that scans `analysis/daily/` for shared dok_ids.

---

### 🎨 UI/UX of the Rendered HTML Product

#### 9. Progressive disclosure for long-form articles

**Problem:** Long-form articles (committee reports, monthly reviews) may produce 8,000–15,000-word HTML pages. Readers on mobile cannot quickly reach the section they need.

**Improvement:** Generate a sticky in-article table of contents from the aggregated H2/H3 heading structure. This should be:

- Implemented as a `<nav class="rm-article-toc" aria-label="Article sections">` block injected by `article.ts` before the article body.
- Collapsed on mobile (max-width 768px) with an accessible expand toggle.
- Sticky on desktop, highlighting the current section via `IntersectionObserver` in a trusted site script.

#### 10. Article type badges and visual identity

**Problem:** All article types (`interpellations`, `propositions`, `evening-analysis`, `weekly-review`, etc.) render identically. A reader cannot distinguish a fast realtime monitor from a deep monthly review at a glance.

**Improvement:**

- Add an `article_type` field to `article.md` front matter.
- Render a prominent `<span class="rm-article-type-badge rm-badge--${type}">` in the article header.
- Define per-type accent colors in `styles/themes/article-types.css`: e.g. cyan for interpellations, yellow for committee reports, magenta for evening-analysis.
- Add a matching type-icon via the existing cyberpunk design token set.

#### 11. Sticky article header with reading progress

**Problem:** The article site header (logo, nav) takes up vertical space when scrolled. There is no reading-progress indicator.

**Improvement:**

- Add a `position: sticky; top: 0` article header band that collapses to show only the article title and type badge after scrolling past the full header.
- Add a thin reading-progress bar (`<div class="rm-reading-progress">`) at the very top of the viewport, driven by a minimal trusted `js/reading-progress.mjs`.

#### 12. Accessible confidence and risk heat map panels

**Problem:** `risk-assessment.md` and `significance-scoring.md` produce Markdown tables. For high-dimensional data (risk score × risk type × party), a heat-map panel communicates at a glance.

**Improvement:** The analysis pipeline should emit `risk-heatmap.json` alongside `risk-assessment.md`. A trusted `js/article-risk-heatmap.mjs` renders a CSS-grid-based heat map with keyboard navigation and WCAG 2.1 AA contrast. The Markdown table remains as the accessible fallback.

#### 13. Citation copy helper

**Problem:** Political science researchers and journalists need to cite specific claims from Riksdagsmonitor articles.

**Improvement:** Add a copy-citation button (`<button class="rm-cite-btn" aria-label="Copy citation">`) to each article section heading. On click, it copies a formatted citation to the clipboard:

```
Riksdagsmonitor. (2026-04-24). Interpellation Debates: HD10447 – Sjuklönekostnad.
https://riksdagsmonitor.com/news/2026-04-24-interpellations-en.html#intelligence-assessment-key-judgments
Retrieved: 2026-04-25.
```

This should be implemented as a minimal trusted site script, not inline AI-authored JS.

#### 14. Full light-mode article polish

**Problem:** Light mode for article pages applies `html[data-theme="light"]` overrides but the default `:root` palette and the cyberpunk token fallbacks are tuned for dark backgrounds. Key elements (article header gradient, source footer) remain dark in light mode.

**Improvement:** Audit every `rm-*` CSS rule for contrast and background in light mode. Introduce a fully specified light-mode palette in the `:root` block so light-mode article pages are as polished as dark ones. Target 4.5:1 contrast ratio for all text throughout.

#### 15. Share and annotation support

**Problem:** No built-in mechanism for sharing a specific finding or annotating a specific paragraph.

**Improvement:**
- Add per-heading deep-link buttons already surfaced by `rehype-autolink-headings`; make them visible on hover.
- Add a minimal share API call (`navigator.share`) with clipboard fallback for mobile.
- Integrate with a future annotation layer (out of scope for current sprint, but reserve the `rm-annotation-*` CSS namespace).

---

### 🏗️ Code Quality, Architecture and Test Coverage

#### 16. Article-type-aware aggregation module

**Problem:** `aggregateAnalysis()` accepts only `date` and `subfolder`. The article type (interpellations, propositions, etc.) is inferred from the subfolder name informally.

**Improvement:**

- Introduce an `ArticleType` enum in `render-lib/constants.ts`.
- Add an `articleType` parameter to `aggregateAnalysis()` (optional, defaults to heuristic inference from subfolder name).
- Add a `AGGREGATION_ORDER_BY_TYPE: Record<ArticleType, readonly string[]>` map.
- Test coverage: one test per article type verifying that the correct order is applied and that `media-framing-analysis.md` and `forward-indicators.md` precede `swot-analysis.md` in all types.

#### 17. Stale JSDoc module comment in `aggregator.ts`

**Status: Fixed in 2026-04-25 commit.** The `@module` JSDoc now correctly documents the reader-intelligence-first narrative order with all five rounds.

#### 18. E2E Playwright tests for rendered article HTML

**Problem:** Current render-lib tests are unit and integration tests. There are no visual regression or accessibility tests for the full rendered article page.

**Improvement:** Add Playwright test specs covering:

- Article page loads without JS console errors.
- `<article class="rm-article">` is present and has accessible heading structure (`h1` > `h2` > `h3`).
- Language switcher dropdown opens and lists correct language codes.
- Mermaid blocks receive the `mermaid` class and are non-empty.
- `rm-article-sources` section exists and at least one GitHub link is present.
- WCAG 2.1 AA axe-core scan passes (no critical violations).
- Light mode and dark mode color contrast requirements (via `@axe-core/playwright`).

#### 19. Render pipeline multi-language test coverage

**Problem:** `tests/render-lib.test.ts` primarily tests EN articles. There is no direct test for RTL article rendering (Arabic `ar`, Hebrew `he`).

**Improvement:** Add test cases verifying:

- `dir="rtl"` is set on `<html>` for Arabic and Hebrew.
- RTL articles have `<link rel="alternate" hreflang="ar">` and `<link rel="alternate" hreflang="he">`.
- The language switcher dropdown does not contain `ar`/`he` when the current language is AR/HE.

#### 20. Article quality metrics CI gate

**Problem:** The analysis gate (`05-analysis-gate.md`) is enforced by the AI agent at runtime. There is no static CI gate that checks rendered article quality after `npm run build`.

**Improvement:** Add a `validate-articles` npm script and corresponding GitHub Actions job that checks every file in `news/`:

```bash
# Minimum article quality checks
for f in news/*.html; do
  grep -q '<meta name="description"' "$f" || echo "FAIL: no description in $f"
  grep -q '"NewsArticle"' "$f"         || echo "FAIL: no JSON-LD in $f"
  grep -q 'rm-article-sources'  "$f"  || echo "FAIL: no sources section in $f"
  grep -q 'hreflang="x-default"' "$f" || echo "FAIL: no x-default hreflang in $f"
done
```

This should be a failing CI gate, not just a warning.

#### 21. Render-lib barrel architecture enforcement

**Problem:** `tests/render-lib-architecture.test.ts` verifies that every exported symbol in each leaf module is re-exported from the barrel. But if a developer adds a new leaf module without adding it to the barrel, the test does not catch the omission.

**Improvement:** Add a test that scans `scripts/render-lib/*.ts` for all public `export` symbols and asserts that `scripts/render-lib/index.ts` re-exports every file in the directory (except `index.ts` itself).

#### 22. SEO contract regression tests for description length

**Problem:** `truncateToSentenceBoundary` is tested, but there is no test asserting that the actual generated `article.md` descriptions for every analysis subfolder fall within the 140–200 character window.

**Improvement:** Add a test that runs `aggregateAnalysis` on every folder under `analysis/daily/` and asserts that the resulting `description` in front matter is between 50 and 200 characters and contains no raw Markdown syntax (`[`, `*`, `` ` ``).

#### 23. Aggregate-analysis CLI error handling

**Problem:** `scripts/aggregate-analysis.ts --all` silently skips subfolders that are missing `executive-brief.md`. This means a run can complete with exit code 0 while some analysis subfolders produced no article.

**Improvement:** The `--all` flag should:
- Print a summary of successful and failed subfolders.
- Exit non-zero if any subfolder fails.
- Accept a `--strict` flag that makes even missing-optional-artifact subfolders fail.

---

### 📋 Improvement Priority Matrix

| # | Improvement | Intelligence value | User-facing impact | Effort | Priority |
|---|---|:---:|:---:|:---:|:---:|
| 1 | Integrated narrative article | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | High | P1 |
| 6 | Forward-indicator timelines (JSON+chart) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Medium | P1 |
| 4 | Confidence/Admiralty code chips | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Low | P1 |
| 9 | Sticky in-article ToC | ⭐⭐ | ⭐⭐⭐⭐⭐ | Low | P1 |
| 3 | Proper journalistic lede extraction | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Medium | P2 |
| 2 | Article-type-specific ordering | ⭐⭐⭐⭐ | ⭐⭐⭐ | Medium | P2 |
| 10 | Article type badges | ⭐⭐ | ⭐⭐⭐⭐ | Low | P2 |
| 14 | Full light-mode polish | ⭐⭐ | ⭐⭐⭐⭐ | Medium | P2 |
| 20 | Article quality CI gate | ⭐⭐⭐ | ⭐ | Low | P2 |
| 18 | Playwright E2E accessibility tests | ⭐⭐ | ⭐⭐ | Medium | P2 |
| 5 | Media framing inline callouts | ⭐⭐⭐⭐ | ⭐⭐⭐ | High | P3 |
| 8 | Cross-article series navigation | ⭐⭐⭐ | ⭐⭐⭐ | Medium | P3 |
| 12 | Risk heat map panels | ⭐⭐⭐ | ⭐⭐⭐ | Medium | P3 |
| 7 | Historical parallels integration | ⭐⭐⭐ | ⭐⭐ | Medium | P3 |
| 11 | Reading-progress bar | ⭐ | ⭐⭐⭐ | Low | P3 |
| 13 | Citation copy helper | ⭐⭐ | ⭐⭐⭐ | Low | P3 |
| 16 | Article-type-aware aggregation module | ⭐⭐⭐ | ⭐ | Medium | P3 |
| 22 | SEO contract regression tests | ⭐⭐ | ⭐ | Low | P3 |
| 23 | Aggregate-analysis CLI error handling | ⭐⭐ | ⭐ | Low | P3 |
| 15 | Share and annotation | ⭐ | ⭐⭐ | Medium | P4 |
| 19 | RTL render test coverage | ⭐⭐ | ⭐ | Low | P4 |
| 21 | Barrel architecture enforcement | ⭐ | ⭐ | Low | P4 |

---

### 🔗 Improvement Dependencies

```mermaid
%%{init: {"theme":"dark","themeVariables":{"primaryColor":"#1565C0","primaryTextColor":"#ffffff","lineColor":"#90CAF9","secondaryColor":"#7B1FA2","tertiaryColor":"#2E7D32","tertiaryTextColor":"#ffffff","fontFamily":"Inter, Helvetica, Arial, sans-serif"}}}%%
flowchart TB
    N1["#1 Integrated narrative"] --> N5["#5 Media framing inline"]
    N1 --> N7["#7 Historical parallels integration"]
    N1 --> N8["#8 Series navigation"]
    N3["#3 Journalistic lede"] --> N1
    N2["#2 Article-type ordering"] --> N1
    N2 --> N16["#16 Type-aware aggregation module"]
    N6["#6 Forward-indicator JSON+chart"] --> N18["#18 Playwright E2E tests"]
    N4["#4 Confidence chips"] --> N18
    N12["#12 Risk heat map"] --> N18
    N9["#9 Sticky ToC"] --> N11["#11 Reading-progress bar"]
    N20["#20 CI article quality gate"] --> N22["#22 SEO regression tests"]
    N20 --> N23["#23 CLI error handling"]

    style N1 fill:#D32F2F,color:#ffffff
    style N2 fill:#1565C0,color:#ffffff
    style N3 fill:#1565C0,color:#ffffff
    style N6 fill:#7B1FA2,color:#ffffff
    style N20 fill:#2E7D32,color:#ffffff
```

---



### Agentic workflow contract

- [`.github/workflows/news-interpellations.md`](.github/workflows/news-interpellations.md)
- [`.github/workflows/news-translate.md`](.github/workflows/news-translate.md)
- [`.github/prompts/README.md`](.github/prompts/README.md)
- [`.github/prompts/04-analysis-pipeline.md`](.github/prompts/04-analysis-pipeline.md)
- [`.github/prompts/05-analysis-gate.md`](.github/prompts/05-analysis-gate.md)
- [`.github/prompts/06-article-generation.md`](.github/prompts/06-article-generation.md)

### Analysis methodology and templates

- [`analysis/methodologies/artifact-catalog.md`](analysis/methodologies/artifact-catalog.md)
- [`analysis/methodologies/ai-driven-analysis-guide.md`](analysis/methodologies/ai-driven-analysis-guide.md)
- [`analysis/templates/README.md`](analysis/templates/README.md)
- [`analysis/templates/`](analysis/templates/)

### Aggregation and rendering code

- [`scripts/aggregate-analysis.ts`](scripts/aggregate-analysis.ts)
- [`scripts/render-articles.ts`](scripts/render-articles.ts)
- [`scripts/render-lib/aggregator.ts`](scripts/render-lib/aggregator.ts)
- [`scripts/render-lib/markdown.ts`](scripts/render-lib/markdown.ts)
- [`scripts/render-lib/article.ts`](scripts/render-lib/article.ts)
- [`scripts/render-lib/chrome.ts`](scripts/render-lib/chrome.ts)
- [`scripts/render-lib/constants.ts`](scripts/render-lib/constants.ts)
- [`scripts/render-lib/url-helpers.ts`](scripts/render-lib/url-helpers.ts)

### UI, visualisation and build/deploy

- [`styles.css`](styles.css)
- [`styles/themes/article-types.css`](styles/themes/article-types.css)
- [`js/lib/mermaid-init.mjs`](js/lib/mermaid-init.mjs)
- [`vite.config.js`](vite.config.js)
- [`package.json`](package.json)
- [`.github/workflows/deploy-s3.yml`](.github/workflows/deploy-s3.yml)
- [`scripts/deploy-s3.sh`](scripts/deploy-s3.sh)
- [`scripts/fix-s3-mimetypes.sh`](scripts/fix-s3-mimetypes.sh)

### Worked example

- [`analysis/daily/2026-04-24/interpellations/`](analysis/daily/2026-04-24/interpellations/)
- [`analysis/daily/2026-04-24/interpellations/article.md`](analysis/daily/2026-04-24/interpellations/article.md)
- [`news/2026-04-24-interpellations-en.html`](news/2026-04-24-interpellations-en.html)
- [`news/2026-04-24-interpellations-sv.html`](news/2026-04-24-interpellations-sv.html)

---

## 📝 Key Takeaways

1. **Analysis is the product; article HTML is the projection.**
2. **No article is generated before the 23-artifact analysis gate passes.**
3. **`article.md` is deterministic and auditable.** It is built from source artifacts, not free-written by the AI.
4. **HTML is sanitized and chrome-wrapped.** The renderer owns SEO, provenance, header, footer, language switchers and Mermaid loading.
5. **Interactive visualization belongs in trusted site code.** Mermaid is safely supported now; Chart.js and D3 are available through dashboard modules and future trusted article modules that consume JSON artifacts.
6. **Deployment preserves integrity.** Vite discovers news articles, SRI is generated, S3 objects get explicit MIME/cache metadata, and CloudFront is invalidated after deploy.
7. **Political intelligence remains ethical and neutral.** Evidence, uncertainty, source diversity, GDPR/ISMS alignment and AI-FIRST Pass 2 are non-negotiable.

---

## 🔗 Hack23 Ecosystem

<table>
<tr>
  <th width="33%">🌐 Platforms</th>
  <th width="33%">📦 Open-Source Projects</th>
  <th width="33%">🛡️ Governance &amp; Standards</th>
</tr>
<tr>
<td valign="top">
🗳️ <a href="https://riksdagsmonitor.com">Riksdagsmonitor</a> — Swedish Parliament intelligence<br>
🇪🇺 <a href="https://www.euparliamentmonitor.com">EU Parliament Monitor</a> — European coverage<br>
🕵️ <a href="https://www.hack23.com/cia">Citizen Intelligence Agency</a> — political-data engine<br>
🌐 <a href="https://www.hack23.com">Hack23 AB</a> — corporate site<br>
📰 <a href="https://hack23.com/blog.html">Hack23 Blog</a> — engineering &amp; policy<br>
💼 <a href="https://www.linkedin.com/company/hack23/">Hack23 on LinkedIn</a>
</td>
<td valign="top">
🗳️ <a href="https://github.com/Hack23/riksdagsmonitor">Hack23/riksdagsmonitor</a><br>
🕵️ <a href="https://github.com/Hack23/cia">Hack23/cia</a><br>
🇪🇺 <a href="https://github.com/Hack23/euparliamentmonitor">Hack23/euparliamentmonitor</a><br>
🔌 <a href="https://github.com/Hack23/european-parliament-mcp">Hack23/european-parliament-mcp</a><br>
✅ <a href="https://github.com/Hack23/cia-compliance-manager">Hack23/cia-compliance-manager</a><br>
🥋 <a href="https://github.com/Hack23/black-trigram">Hack23/black-trigram</a><br>
🏠 <a href="https://github.com/Hack23/homepage">Hack23/homepage</a>
</td>
<td valign="top">
🛡️ <a href="https://github.com/Hack23/ISMS-PUBLIC">Hack23 ISMS-PUBLIC</a> — public ISMS<br>
🔒 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md">Information Security Policy</a><br>
🤖 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/AI_Policy.md">AI Policy</a><br>
🧪 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md">Secure Development Policy</a><br>
🎯 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md">Threat Modeling Policy</a><br>
⚠️ <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md">Vulnerability Management</a><br>
🏷️ <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md">Classification Framework</a>
</td>
</tr>
</table>

<p align="center">
<a href="https://www.bestpractices.dev/projects/12069"><img src="https://www.bestpractices.dev/projects/12069/badge" alt="OpenSSF Best Practices"/></a>
<a href="https://scorecard.dev/viewer/?uri=github.com/Hack23/riksdagsmonitor"><img src="https://api.securityscorecards.dev/projects/github.com/Hack23/riksdagsmonitor/badge" alt="OpenSSF Scorecard"/></a>
<a href="https://github.com/Hack23/ISMS-PUBLIC"><img src="https://img.shields.io/badge/ISO_27001-2022-blue?style=flat-square&logo=iso&logoColor=white" alt="ISO 27001:2022"/></a>
<a href="https://github.com/Hack23/ISMS-PUBLIC"><img src="https://img.shields.io/badge/NIST_CSF-2.0-green?style=flat-square&logo=nist&logoColor=white" alt="NIST CSF 2.0"/></a>
<a href="https://github.com/Hack23/ISMS-PUBLIC"><img src="https://img.shields.io/badge/CIS_Controls-v8.1-orange?style=flat-square&logo=cisecurity&logoColor=white" alt="CIS Controls v8.1"/></a>
<a href="https://www.apache.org/licenses/LICENSE-2.0"><img src="https://img.shields.io/badge/License-Apache_2.0-blue?style=flat-square" alt="Apache 2.0"/></a>
</p>

<p align="center"><em>🗳️ Empower citizens · 🔍 Strengthen democratic accountability · 🕵️ Illuminate the political process</em></p>

<p align="center"><sub>© 2008–2026 <a href="https://www.hack23.com">Hack23 AB</a> (Org.nr 559534-7807) · Maintainer: <a href="https://www.linkedin.com/in/jamessorling/">James Pether Sörling, CISSP CISM</a></sub></p>
