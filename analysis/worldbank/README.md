<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🌍 World Bank Indicators — Political Intelligence Inventory</h1>

<p align="center">
  <strong>Complete reference mapping World Bank economic indicators to Swedish political entities</strong><br>
  <em>📊 Economic · 👥 Social · 🎓 Education · 🏥 Health · 🏛️ Governance</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-2.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

---

## 🎯 Purpose

This directory contains the **comprehensive inventory** of 144 World Bank indicators available for enriching Riksdagsmonitor political intelligence articles. Every indicator is mapped to:

- **17 policy domains** covering all aspects of Swedish governance
- **12 Riksdag committees** (utskott) that oversee relevant policy areas
- **Article types** where each indicator should be included
- **Chart types** — Chart.js (HTML articles) and Mermaid (analysis markdown files)
- **Access method** — MCP tools (19 indicators) or REST API client (125 indicators)

## 📁 Contents

| File | Description |
|------|-------------|
| [README.md](README.md) | This overview |
| [indicators-inventory.json](indicators-inventory.json) | Machine-readable inventory of all indicators |
| [indicator-policy-mapping.md](indicator-policy-mapping.md) | Human-readable mapping to political entities |
| [use-cases.md](use-cases.md) | Best use cases per article type and policy domain |

## 🔗 Integration Points

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
| `search-indicators` | Search indicators by keyword | `keyword` |

### TypeScript Modules (Build-Time)
| Module | Purpose |
|--------|---------|
| `scripts/world-bank-client.ts` | REST client with `INDICATOR_IDS` and `COUNTRY_CODES` |
| `scripts/world-bank-context.ts` | Policy area mapping and localized headings (14 languages) |
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
| **Infrastructure** | 7 | Internet, Broadband, Mobile, Servers, Air Travel, Patents | TU | MCP + REST |
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
