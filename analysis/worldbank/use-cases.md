# 📊 World Bank Indicators — Use Cases for Political Intelligence (v3.0)

> **Purpose**: Defines when and how 144 World Bank indicators should be used in Riksdagsmonitor article generation and analysis documents under the v3.0 World Bank protocol/inventory schema. Includes both Chart.js templates (for HTML articles) and Mermaid templates (for `.md` analysis files).

---

## 🎯 Decision Framework: When to Include World Bank Data

### Always Include (every article)
- **GDP Growth** and **Unemployment** — universal economic context
- Any indicator matching the article's detected committee (see `indicator-policy-mapping.md`)
- Gender dimension when available (e.g., male/female unemployment split)

### Include When Relevant (policy-matched)
- Match indicators to the article's policy domains (detected from proposition text, motion subject, committee assignment)
- Use `findRelevantIndicators(policyArea)` from `scripts/world-bank-context.ts`
- For labor topics: include youth unemployment, labor participation by gender
- For defense topics: include NATO 2% trajectory and armed forces data
- For governance topics: include all 6 WGI indicators (source=75)

### Include for Comprehensive Context (monthly/weekly reviews)
- Full Nordic comparison with all 144 indicators
- Trend analysis showing 10-year trajectories
- All 6 governance indicators for democratic health assessment
- Demographic aging and migration trends

---

## 📋 Use Cases by Indicator Category

### 1. Economic Indicators — Fiscal Policy & Budget Debates

**When to use**: Any proposition involving budget allocation, fiscal policy, economic reform, tax changes.

**Key scenarios**:
| Scenario | Indicators | Chart Type |
|----------|-----------|------------|
| Budget proposition (FiU) | GDP Growth, Inflation, Gov Expenditure, Tax Revenue | Bar comparison + trend |
| Economic crisis debate | GDP Growth, Unemployment, Inflation, Current Account | Multi-line trend |
| EU trade agreement | Trade %, Exports %, FDI | Nordic comparison |
| Currency/monetary policy | Inflation, GDP Growth, Current Account | Trend + comparison |

**Example Chart.js config for budget debate**:
```json
{
  "chartType": "economic-comparison",
  "type": "bar",
  "data": {
    "labels": ["Sweden", "Denmark", "Norway", "Finland", "Germany"],
    "datasets": [{
      "label": "GDP Growth 2024 (%)",
      "data": [0.82, 1.5, 0.7, 0.3, -0.1],
      "backgroundColor": ["#00d9ff", "#ff006e", "#ffbe0b", "#83cf39", "#9d4edd"]
    }]
  },
  "options": {
    "responsive": true,
    "plugins": { "legend": { "labels": { "color": "#e0e0e0" } } },
    "scales": {
      "y": { "ticks": { "color": "#b0b0b0" }, "grid": { "color": "rgba(255,255,255,0.06)" } },
      "x": { "ticks": { "color": "#b0b0b0" }, "grid": { "color": "rgba(255,255,255,0.06)" } }
    }
  }
}
```

---

### 2. Tax Revenue — Taxation Policy (SkU)

**When to use**: Tax reform proposals, fiscal capacity debates, income redistribution discussions.

**Key insight**: Sweden historically has one of the highest tax-to-GDP ratios among OECD countries. This context is critical when analyzing:
- Tax reduction proposals (context: what % of GDP is at stake)
- Revenue impact of proposed changes
- Nordic comparison (is Sweden converging or diverging?)

**Chart recommendation**: Stacked bar showing tax revenue % vs. GDP growth across Nordic countries.

---

### 3. Military Expenditure — Defense Policy (FöU)

**When to use**: **Any defense-related article**. This is one of the most politically significant indicators given:
- NATO accession (2024) and the 2% of GDP spending target
- Sweden's historical low military spending vs. post-2022 security environment
- Cross-party consensus on increased defense spending

**Key scenarios**:
| Scenario | Chart Type | Data Points |
|----------|-----------|-------------|
| NATO target tracking | Trend line + 2% target annotation | 10-year Sweden trend |
| Nordic defense comparison | Bar chart | SE, DK, NO, FI military % |
| Defense budget proposition | Combined: trend + comparison | 5-year trend + Nordic |

**Example trend with target annotation** (uses `chartjs-plugin-annotation@3.1.0`, already included in project dependencies):
```json
{
  "chartType": "economic-trend",
  "type": "line",
  "data": {
    "labels": ["2019", "2020", "2021", "2022", "2023", "2024"],
    "datasets": [{
      "label": "Sweden Military Expenditure (% GDP)",
      "data": [1.1, 1.2, 1.3, 1.3, 1.5, 1.7],
      "borderColor": "#00d9ff",
      "backgroundColor": "rgba(0,217,255,0.2)",
      "borderWidth": 2
    }]
  },
  "options": {
    "responsive": true,
    "plugins": {
      "annotation": {
        "annotations": {
          "natoTarget": {
            "type": "line",
            "yMin": 2.0, "yMax": 2.0,
            "borderColor": "#ff006e",
            "borderDash": [6, 6],
            "label": { "display": true, "content": "NATO 2% target", "color": "#ff006e" }
          }
        }
      },
      "legend": { "labels": { "color": "#e0e0e0" } }
    },
    "scales": {
      "y": { "title": { "display": true, "text": "% of GDP", "color": "#e0e0e0" }, "ticks": { "color": "#b0b0b0" }, "grid": { "color": "rgba(255,255,255,0.06)" } },
      "x": { "ticks": { "color": "#b0b0b0" }, "grid": { "color": "rgba(255,255,255,0.06)" } }
    }
  }
}
```

---

### 4. Health & Social Indicators — Welfare Policy (SoU)

**When to use**: Healthcare reform proposals, eldercare debates, pandemic response, demographic policy.

**Key insight**: Sweden's relatively low hospital beds per capita (1.9/1000) vs. Germany (~7.8/1000) is a recurring political issue. Combined with high health expenditure (11.2% GDP), this creates a "spending efficiency" debate.

**Chart recommendation**: Nordic health system radar chart (expenditure, physicians, beds, life expectancy).

---

### 5. Education & R&D — Human Capital (UbU)

**When to use**: Education reform, research funding, university governance, innovation policy.

**Key insight**: Sweden's R&D expenditure (~3.4% GDP) is among the highest globally. Education expenditure (~7.3% GDP) is also high. These indicators contextualize debates about whether spending translates to outcomes.

**Chart recommendation**: Education + R&D spending Nordic comparison with school enrollment overlay.

---

### 6. Governance Indicators — Democratic Health (KU)

**When to use**: Constitutional oversight debates, government scrutiny, press freedom, judicial independence.

**Key insight**: Sweden consistently ranks near the top on Rule of Law, Voice & Accountability, and Government Effectiveness. Any decline is politically significant and newsworthy.

**Chart recommendation**: Governance radar chart comparing Sweden to Nordic peers.

---

### 7. Environment — Climate Policy (MJU)

**When to use**: Climate legislation, emissions targets, green transition, energy policy.

**Key insight**: Sweden has relatively low CO₂ per capita among developed nations but faces debates about nuclear energy, fossil fuel phase-out, and green industrial policy.

**Chart recommendation**: CO₂ emissions trend line + Nordic comparison.

---

## 🔧 MCP Tool Integration for AI Agents

### How AI agents should fetch World Bank data:

1. **Detect policy domains** from the article's source documents (propositions, motions, etc.)
2. **Map domains to indicators** using the committee mapping above
3. **Fetch data** using World Bank MCP tools:

```
# Economic indicators (8 available via MCP)
get-economic-data(countryCode="SE", indicator="GDP_GROWTH", years=10)
get-economic-data(countryCode="SE", indicator="UNEMPLOYMENT", years=10)
get-economic-data(countryCode="SE", indicator="INFLATION", years=10)
get-economic-data(countryCode="SE", indicator="GDP_PER_CAPITA", years=10)
get-economic-data(countryCode="SE", indicator="EXPORTS_GDP", years=10)
get-economic-data(countryCode="SE", indicator="FDI_NET", years=10)
get-economic-data(countryCode="SE", indicator="GNI", years=10)
get-economic-data(countryCode="SE", indicator="GNI_PER_CAPITA", years=10)

# Social indicators (5 available via MCP)
get-social-data(countryCode="SE", indicator="POPULATION", years=10)
get-social-data(countryCode="SE", indicator="LIFE_EXPECTANCY", years=10)
get-social-data(countryCode="SE", indicator="BIRTH_RATE", years=10)
get-social-data(countryCode="SE", indicator="DEATH_RATE", years=10)
get-social-data(countryCode="SE", indicator="INTERNET_USERS", years=10)

# Education indicators (2 available via MCP)
get-education-data(countryCode="SE", indicator="EDUCATION_EXPENDITURE", years=10)
get-education-data(countryCode="SE", indicator="SCHOOL_ENROLLMENT", years=10)

# Health indicators (3 available via MCP)
get-health-data(countryCode="SE", indicator="HEALTH_EXPENDITURE", years=10)
get-health-data(countryCode="SE", indicator="PHYSICIANS", years=10)
get-health-data(countryCode="SE", indicator="HOSPITAL_BEDS", years=10)
```

4. **Also fetch Nordic comparison** for the most relevant indicators:
```
# For each relevant indicator, also fetch:
get-economic-data(countryCode="DK", indicator="...", years=5)
get-economic-data(countryCode="NO", indicator="...", years=5)
get-economic-data(countryCode="FI", indicator="...", years=5)
get-economic-data(countryCode="DE", indicator="...", years=5)
```

5. **Generate Chart.js config** using canonical chart types: `economic-comparison`, `economic-trend`, `nordic-radar`
6. **Embed in article** using `data-chart-config` attribute on `<canvas>` elements

---

## 📊 Country Codes Reference

| Country | ISO Alpha-2 (MCP) | ISO Alpha-3 (REST) | Color |
|---------|-------------------|---------------------|-------|
| Sweden | SE | SWE | `#00d9ff` (cyan) |
| Denmark | DK | DNK | `#ff006e` (magenta) |
| Norway | NO | NOR | `#ffbe0b` (yellow) |
| Finland | FI | FIN | `#83cf39` (green) |
| Germany | DE | DEU | `#9d4edd` (purple) |

---

**Document Control:**
- **Repository:** https://github.com/Hack23/riksdagsmonitor
- **Path:** `/analysis/worldbank/use-cases.md`
- **Classification:** Public
