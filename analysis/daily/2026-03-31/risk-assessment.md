<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">⚠️ Political Risk Assessment</h1>

<p align="center">
  <strong>📊 Multi-Dimensional Risk Analysis — 2026-03-31</strong><br>
  <em>🎯 Coalition · Policy · Legislative · Democratic Process</em>
</p>

**Document Owner**: CEO | **Version**: 2.0 | **Last Updated**: 2026-03-31 | **Org.nr**: 559432-2196 | **Classification**: PUBLIC

---

## 📋 Risk Context

| Field | Value |
|-------|-------|
| **Risk ID** | `RSK-2026-03-31-001` |
| **Analysis Date** | `2026-03-31 06:00 UTC` |
| **Riksmöte** | 2025/26 |
| **Documents Analyzed** | 9 (4 propositions, 1 committee report, 2 written questions, 2 interpellations) |
| **Coalition Configuration** | M-KD-L government with SD supply-and-confidence (176 seats) |
| **Coalition Stability Score** | 83/100 |
| **Overall Risk Level** | 🟢 **LOW** |
| **Produced By** | Copilot Political Intelligence Agent |
| **MCP Sources** | riksdag-regering-mcp |

---

## 🗺️ Risk Heat Map

```mermaid
graph LR
    subgraph "⚠️ Risk Heat Map — 2026-03-31"
        R1["R1: Migration Policy<br/>Backlash<br/>L:2 × I:3 = 6"]
        R2["R2: Opposition<br/>Legislative Blockade<br/>L:1 × I:2 = 2"]
        R3["R3: Coalition Tension<br/>on Migration<br/>L:2 × I:2 = 4"]
        R4["R4: EU Compliance<br/>Gap — UTP Directive<br/>L:1 × I:2 = 2"]
        R5["R5: Infrastructure<br/>Regional Friction<br/>L:1 × I:1 = 1"]
    end
    style R1 fill:#ffc107,stroke:#000,color:#000
    style R2 fill:#28a745,stroke:#000,color:#fff
    style R3 fill:#ffc107,stroke:#000,color:#000
    style R4 fill:#28a745,stroke:#000,color:#fff
    style R5 fill:#28a745,stroke:#000,color:#fff
```

---

## 📊 Risk Register

| Risk ID | Description | Likelihood (1-5) | Impact (1-5) | Risk Score | Tier | Evidence (dok_id) |
|---------|-------------|:-:|:-:|:-:|------|----------------|
| R1 | Migration policy backlash — dual propositions (Prop 2025/26:144 + Prop 2025/26:146) on reception law reform and time-limited housing may trigger public debate | 2 | 3 | 6 | 🟡 MEDIUM | `HD03229`, `HD03215` |
| R2 | Opposition legislative blockade — 96% motion denial rate limits S/V/MP influence, potential frustration escalation | 1 | 2 | 2 | 🟢 LOW | `HD10424`, `HD10425` |
| R3 | Intra-coalition tension on migration — L minister (Mohamsson) handling politically sensitive migration housing while M drives harder line | 2 | 2 | 4 | 🟢 LOW | `HD03215`, `HD03229` |
| R4 | EU regulatory compliance gap — UTP directive implementation update signals earlier transposition issues | 1 | 2 | 2 | 🟢 LOW | `HD01MJU18` |
| R5 | Regional infrastructure friction — Värmland flight routes and defence infrastructure cost allocation create local tension | 1 | 1 | 1 | 🟢 LOW | `HD10424`, `HD10425` |

**Aggregate Risk: LOW** — No risk exceeds MEDIUM tier. Highest risk (R1, score 6) relates to coordinated migration reform.

---

## 🔗 Cascading Risk Chain

```mermaid
flowchart TD
    A["HD03229 — New Reception Law<br/>Prop 2025/26:144"] --> B["Public Debate<br/>on Migration Policy"]
    A --> C["HD03215 — Time-limited Housing<br/>Prop 2025/26:146"]
    B --> D["R1: Migration Backlash<br/>Score: 6/25"]
    C --> D
    C --> E["R3: Coalition Tension<br/>L vs M on Housing<br/>Score: 4/25"]
    E --> F["SD Leverage<br/>on Migration Stance"]
    F --> G["Coalition Pressure<br/>Stability: 83/100"]
    H["HD10424 — Torsby Flight<br/>HD10425 — Defence Infra"] --> I["R5: Regional Friction<br/>Score: 1/25"]
    J["HD01MJU18 — UTP Directive"] --> K["R4: EU Compliance<br/>Score: 2/25"]
    style A fill:#0d6efd,stroke:#000,color:#fff
    style C fill:#0d6efd,stroke:#000,color:#fff
    style D fill:#ffc107,stroke:#000,color:#000
    style E fill:#ffc107,stroke:#000,color:#000
    style G fill:#28a745,stroke:#000,color:#fff
    style I fill:#28a745,stroke:#000,color:#fff
    style K fill:#28a745,stroke:#000,color:#fff
```

---

## 📋 Risk Evidence Table

| # | Risk Factor | dok_id | Source Document | Confidence | Impact | Entry Date |
|:-:|-------------|--------|-----------------|:----------:|:------:|:----------:|
| 1 | Dual migration reform propositions create combined political exposure | `HD03229` | Prop 2025/26:144 — En ny mottagandelag | HIGH | MEDIUM | 2026-03-31 |
| 2 | Time-limited housing policy may face constitutional scrutiny | `HD03215` | Prop 2025/26:146 — Tidsbegränsat boende | MEDIUM | MEDIUM | 2026-03-31 |
| 3 | KU hearing with Justice Minister Strömmer adds accountability pressure | — | KU hearing scheduled 2026-03-31 | HIGH | LOW | 2026-03-31 |
| 4 | Opposition interpellations on infrastructure reveal regional coordination | `HD10424` | Flyglinjen Torsby/Hagfors–Arlanda | MEDIUM | LOW | 2026-03-31 |
| 5 | Written question on Muslim Brotherhood report tests cultural policy boundaries | `HD11670` | Fransk rapport om Muslimska brödraskapet | MEDIUM | LOW | 2026-03-31 |

---

## 🔑 Key Insights

1. **Migration dominates risk landscape** — Two coordinated propositions (HD03229 + HD03215) from different departments (Justitie + Arbetsmarknad) represent the largest single-day policy push, creating the only MEDIUM-tier risk.
2. **Coalition holds firm** — Despite dual migration bills involving both M and L ministers, the 83/100 stability score and 176-seat majority buffer absorb tension.
3. **Opposition limited to symbolic action** — 96% motion denial rate means S interpellations (HD10424, HD10425) are primarily signalling tools rather than legislative threats.
4. **EU compliance is technical, not political** — HD01MJU18 (UTP directive fix) is a low-risk procedural matter.
5. **No cascading risk triggers identified** — Risk chains terminate at manageable scores.

---

## 📎 Document Control

| Field | Value |
|-------|-------|
| **Template** | `analysis/templates/risk-assessment.md` |
| **Version** | 2.0 |
| **Analyst** | Copilot Political Intelligence Agent |
| **Classification** | PUBLIC |
| **Next Review** | 2026-06-30 |
| **MCP Data Sources** | riksdag-regering-mcp (9 documents, 2 interpellations) |

