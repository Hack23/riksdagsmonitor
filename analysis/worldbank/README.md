<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🌍 World Bank Indicators — Political Intelligence Inventory</h1>

<p align="center">
  <strong>SINGLE SOURCE OF TRUTH for all World Bank indicator mappings</strong><br>
  <em>📊 Economic · 👥 Social · 🎓 Education · 🏥 Health · 🏛️ Governance</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-3.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

---

## 🎯 Purpose

This directory contains the **single source of truth** for all 144 World Bank indicators used in Riksdagsmonitor political intelligence. The JSON inventory (`indicators-inventory.json`) is the canonical machine-readable reference consumed by:

- **AI agents** (agentic workflows) — read via `view analysis/worldbank/indicators-inventory.json`
- **TypeScript modules** — `world-bank-context.ts` loads indicators from this JSON automatically
- **Analysis documents** — reference for economic context in markdown analysis files

Every indicator includes:
- **`id`** — World Bank indicator code (e.g., `NY.GDP.MKTP.KD.ZG`)
- **`name`** — Human-readable name
- **`description`** — Context-rich description for articles
- **`policyAreas`** — Swedish policy areas this indicator relates to
- **`committees`** — Relevant Riksdag committees (utskott)
- **`unit`** — Measurement unit
- **`mcpTool`** / **`mcpParam`** — MCP tool access (19 indicators)

### 🔍 AI Agent Discovery Protocol

> **For agentic workflows**: To find relevant indicators for any article topic:
> 1. `view analysis/worldbank/indicators-inventory.json`
> 2. Search for indicators where `policyAreas` or `committees` match the article's subject
> 3. Use MCP tools for indicators with `mcpTool` field
> 4. Reference other indicators by name/ID — build-time scripts handle REST API fetching

## 📁 Contents

| File | Description |
|------|-------------|
| [README.md](README.md) | This overview |
| [indicators-inventory.json](indicators-inventory.json) | Machine-readable inventory of all indicators |
| [indicator-policy-mapping.md](indicator-policy-mapping.md) | Human-readable mapping to political entities |
| [use-cases.md](use-cases.md) | Best use cases per article type and policy domain |

## 🔗 Integration Points

### JSON Inventory (Single Source of Truth)
```
analysis/worldbank/indicators-inventory.json
```
- **AI agents**: Read with `view` tool to discover indicators on-demand
- **TypeScript modules**: `world-bank-context.ts` loads from this JSON at import time
- **To add indicators**: Edit this JSON file ONLY — TypeScript picks up changes automatically

### MCP Server (Agentic Workflows)
```yaml
world-bank:
  command: npx
  args: ["-y", "worldbank-mcp@1.0.1"]
```

**Available MCP Tools:**
| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `get-economic-data` | GDP, growth, inflation, unemployment, trade, FDI | `countryCode`, `indicator`, `years` |
| `get-social-data` | Population, life expectancy, birth/death rates | `countryCode`, `indicator`, `years` |
| `get-education-data` | School enrollment, education spending, literacy | `countryCode`, `indicator`, `years` |
| `get-health-data` | Health spending, physicians, hospital beds | `countryCode`, `indicator`, `years` |
| `get-country-info` | Region, income level, capital, coordinates | `countryCode` |
| `search-indicators` | Search indicators by keyword (limited coverage) | `keyword` |

> **Note**: `search-indicators` has limited coverage. Always prefer reading `indicators-inventory.json` for comprehensive discovery.

### TypeScript Modules (Build-Time)
| Module | Purpose |
|--------|---------|
| `scripts/world-bank-client.ts` | REST client with `INDICATOR_IDS` and `COUNTRY_CODES` |
| `scripts/world-bank-context.ts` | Loads from JSON inventory, provides localized headings (14 languages) and policy area matching |
| `scripts/data-transformers/content-generators/economic-dashboard-section.ts` | Chart.js dashboard generation |
| `scripts/populate-analysis-data.ts` | Automated data fetch to `analysis/data/worldbank/` |

### Chart.js Integration
Economic indicators are visualized using these canonical chart types:
- `economic-comparison` — Nordic bar chart comparing countries
- `economic-trend` — Sweden time series line chart
- `nordic-radar` — Multi-indicator radar comparison
- `policy-radar` — Policy area impact radar

## 📊 Quick Reference: 144 Indicators Across 17 Domains

| Domain | Count | Key Indicators | Primary Committees | Access |
|--------|-------|---------------|-------------------|--------|
| **National Accounts** | 17 | GDP, GNI, PPP, Consumption, Savings, Capital Formation | FiU | MCP + REST |
| **Government Finance** | 9 | Tax Revenue, Expenditure, Revenue, Cash Balance, Net Lending | SkU, FiU | REST |
| **Trade & Payments** | 11 | Exports, Imports, FDI, Current Account, High-Tech Exports | NU, UU | MCP + REST |
| **Labor Market** | 20 | Unemployment (total/M/F/youth), Participation, Employment, Productivity | AU | MCP + REST |
| **Inflation & Prices** | 3 | CPI Inflation, GDP Deflator, Consumer Price Index | FiU | MCP + REST |
| **Financial Sector** | 4 | Bank Credit, Interest Rates (real/lending/deposit) | FiU | REST |
| **Demographics** | 22 | Population, Life Expectancy, Migration, Fertility, Age Dependency | SoU | MCP + REST |
| **Health** | 14 | Health Exp., Physicians, Beds, Nurses, Suicide, Tobacco, Alcohol, Immunization | SoU | MCP + REST |
| **Education** | 6 | Education Exp., Enrollment (primary/secondary/tertiary) | UbU | MCP + REST |
| **Environment** | 10 | CO₂, Renewable Energy, Forest, PM2.5, Nuclear/Hydro Power | MJU | REST |
| **Infrastructure** | 6 | Broadband, Mobile, Servers, Air Travel, Patents | TU | MCP + REST |
| **Innovation** | 4 | R&D Expenditure, Researchers, Scientific Articles, ICT Exports | UbU | REST |
| **Military** | 5 | Military Exp. (% GDP / USD / % Govt), Armed Forces, Labor Share | FöU | REST |
| **Governance (WGI)** | 6 | Rule of Law, Voice, Effectiveness, Regulatory, Corruption, Stability | KU, JuU | REST source=75 |
| **Inequality** | 5 | GINI, Income Top/Bottom 10%, Income Top/Bottom 20% | SoU, AU | REST |
| **Gender** | 1 | Women in Parliament (%) | KU, AU | REST |
| **Energy** | 1 | Electric Power Consumption | MJU, NU | REST |

> 📝 **Note on WGI Governance Indicators**: The 6 WGI indicators require `source=75` in World Bank REST API calls. The `WorldBankClient` handles this automatically via the `WGI_INDICATOR_IDS` set.

### MCP-Accessible Indicators (19)

| MCP Tool | Indicator | Code | MCP Param |
|----------|-----------|------|-----------|
| `get-economic-data` | GDP Growth | `NY.GDP.MKTP.KD.ZG` | `GDP_GROWTH` |
| `get-economic-data` | GDP per Capita | `NY.GDP.PCAP.CD` | `GDP_PER_CAPITA` |
| `get-economic-data` | Unemployment | `SL.UEM.TOTL.ZS` | `UNEMPLOYMENT` |
| `get-economic-data` | Inflation | `FP.CPI.TOTL.ZG` | `INFLATION` |
| `get-economic-data` | Exports (% GDP) | `NE.EXP.GNFS.ZS` | `EXPORTS_GDP` |
| `get-economic-data` | FDI Net Inflows | `BN.KLT.DINV.CD` | `FDI_NET` |
| `get-economic-data` | GNI | `NY.GNP.MKTP.CD` | `GNI` |
| `get-economic-data` | GNI per Capita | `NY.GNP.PCAP.CD` | `GNI_PER_CAPITA` |
| `get-social-data` | Population | `SP.POP.TOTL` | `POPULATION` |
| `get-social-data` | Life Expectancy | `SP.DYN.LE00.IN` | `LIFE_EXPECTANCY` |
| `get-social-data` | Birth Rate | `SP.DYN.CBRT.IN` | `BIRTH_RATE` |
| `get-social-data` | Death Rate | `SP.DYN.CDRT.IN` | `DEATH_RATE` |
| `get-social-data` | Internet Users | `IT.NET.USER.ZS` | `INTERNET_USERS` |
| `get-education-data` | Education Expenditure | `SE.XPD.TOTL.GD.ZS` | `EDUCATION_EXPENDITURE` |
| `get-education-data` | School Enrollment | `SE.PRM.ENRR` | `SCHOOL_ENROLLMENT` |
| `get-health-data` | Health Expenditure | `SH.XPD.CHEX.GD.ZS` | `HEALTH_EXPENDITURE` |
| `get-health-data` | Physicians | `SH.MED.PHYS.ZS` | `PHYSICIANS` |
| `get-health-data` | Hospital Beds | `SH.MED.BEDS.ZS` | `HOSPITAL_BEDS` |
| `get-health-data` | Immunization (Measles) | `SH.IMM.MEAS` | `IMMUNIZATION` |

---

## 📚 Related Documentation

- [📂 analysis/data/worldbank/](../data/worldbank/) — Cached World Bank data
- [📐 ARCHITECTURE.md](../../ARCHITECTURE.md) — System architecture
- [📊 DATA_MODEL.md](../../DATA_MODEL.md) — Data model documentation
- [🔐 SECURITY_ARCHITECTURE.md](../../SECURITY_ARCHITECTURE.md) — Security controls

---

**Document Control:**
- **Repository:** https://github.com/Hack23/riksdagsmonitor
- **Path:** `/analysis/worldbank/README.md`
- **Format:** Markdown
- **Classification:** Public
