# 📊 Document Significance Scoring — 2026-04-06

## 📋 Assessment Context

| Field | Value |
|-------|-------|
| **Assessment ID** | SIG-2026-04-06-1029 |
| **Analysis Date** | 2026-04-06 10:44 UTC |
| **Documents Analyzed** | 9 |
| **Produced By** | news-realtime-monitor (realtime-1029) |

---

## 📊 Significance Distribution

```mermaid
graph TD
    subgraph "📊 Significance Distribution — 9 Documents"
        HIGH["🟠 MEDIUM<br/>(Score 4–6)<br/>2 documents"]
        MED["🟡 LOW-MEDIUM<br/>(Score 3–4)<br/>4 documents"]
        LOW["🟢 LOW<br/>(Score 1–2)<br/>3 documents"]
    end

    HIGH --> H1["HD01FöU12 — Civilian protection (5/10)"]
    HIGH --> H2["HD01JuU15 — Criminal care (5/10)"]
    MED --> M1["HD11681 — Norra Kärr mining (4/10)"]
    MED --> M2["HD11680 — Israel death penalty (4/10)"]
    MED --> M3["HD11679 — Stockholm Initiative (3/10)"]
    MED --> M4["HD11683 — Syria minorities (3/10)"]
    LOW --> L1["HD10428 — Emergency airport (3/10)"]
    LOW --> L2["HD11678 — Noise cameras (2/10)"]
    LOW --> L3["HD11682 — Environmental commission (2/10)"]

    style HIGH fill:#fd7e14,color:#fff
    style MED fill:#ffc107,color:#000
    style LOW fill:#28a745,color:#fff
```

---

## 📋 Scoring Methodology

Each document is scored across **6 dimensions** (max 10 total):

| Dimension | Weight | Description |
|-----------|:------:|-------------|
| Document Type Tier | 2 | Betänkande (2) > Interpellation (1.5) > Fråga (1) |
| Committee Tier | 1.5 | Tier-1 committees (FiU, FöU, JuU) score higher |
| Policy Domain Breadth | 1 | Cross-domain documents score higher |
| Coalition Relevance | 2 | Direct impact on Tidö coalition dynamics |
| Public Impact | 2 | Breadth and depth of citizen effect |
| Timeliness | 1.5 | Breaking vs routine; holiday activity premium |

---

## 📋 Detailed Scoring Table

| dok_id | Title | Type | Doc Tier | Committee | Domain | Coalition | Public | Timeliness | **Total** |
|--------|-------|------|:--------:|:---------:|:------:|:---------:|:------:|:----------:|:---------:|
| `HD01FöU12` | Civilbefolkningsskydd | Bet | 2.0 | 1.5 | 0.5 | 0.5 | 1.5 | 0 | **5/10** |
| `HD01JuU15` | Kriminalvårdsfrågor | Bet | 2.0 | 1.5 | 0.5 | 0.5 | 1.5 | 0 | **5/10** |
| `HD11681` | Norra Kärr | Fråga | 1.0 | 0.5 | 1.0 | 0.5 | 1.5 | 0 | **4/10** |
| `HD11680` | Israels dödsstraffslag | Fråga | 1.0 | 0.5 | 0.5 | 1.0 | 0.5 | 0.5 | **4/10** |
| `HD11679` | Stockholmsinitiativet | Fråga | 1.0 | 0.5 | 0.5 | 0.5 | 0.5 | 0 | **3/10** |
| `HD11683` | Minoriteter i Syrien | Fråga | 1.0 | 0.5 | 0.5 | 0 | 1.0 | 0 | **3/10** |
| `HD10428` | Beredskapsflygplats | IP | 1.5 | 0.5 | 0 | 0.5 | 0.5 | 0 | **3/10** |
| `HD11678` | Bullerkameror | Fråga | 1.0 | 0 | 0 | 0 | 0.5 | 0.5 | **2/10** |
| `HD11682` | Miljömålsberedningen | Fråga | 1.0 | 0.5 | 0 | 0 | 0.5 | 0 | **2/10** |

---

## 📋 Key Findings

1. **0** documents rated Critical (score ≥ 8) — no breaking news threshold met
2. **0** documents rated High (score 6–7) — no article generation triggered
3. **2** documents rated Medium (score 4–6) — `HD01FöU12` and `HD01JuU15` are both committee reports already covered by other workflows
4. **Dominant themes:** Defense/security and justice/criminal care are highest priority; foreign policy questions form the largest cluster but individually score low

---

## 📂 MCP Data Files Used

| # | Data Source | Tool / Query | Retrieved |
|---|-----------|-------------|-----------|
| 1 | riksdag-regering-mcp | `search_dokument(rm="2025/26")` | 2026-04-06 10:29 UTC |
| 2 | riksdag-regering-mcp | `get_betankanden(rm="2025/26")` | 2026-04-06 10:29 UTC |