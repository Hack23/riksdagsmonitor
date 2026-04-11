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
  <a href="#"><img src="https://img.shields.io/badge/Version-1.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

---

## 🎯 Purpose

This directory contains the **comprehensive inventory** of World Bank indicators available for enriching Riksdagsmonitor political intelligence articles. Every indicator is mapped to:

- **Swedish Riksdag committees** (utskott) that oversee the relevant policy area
- **Policy domains** where the indicator provides context
- **Article types** where the indicator should be included
- **Chart types** (Chart.js configurations) for visual presentation

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

## 📊 Quick Reference: All Available Indicators

### Economic (9 indicators)
| Code | Name | Unit | MCP Tool |
|------|------|------|----------|
| `NY.GDP.MKTP.KD.ZG` | GDP Growth | % annual | `get-economic-data(indicator=GDP_GROWTH)` |
| `NY.GDP.PCAP.CD` | GDP per Capita | USD | `get-economic-data(indicator=GDP_PER_CAPITA)` |
| `NY.GDP.PCAP.PP.CD` | GDP per Capita (PPP) | Int'l $ | `get-economic-data(indicator=GDP_PER_CAPITA)` |
| `SL.UEM.TOTL.ZS` | Unemployment | % labor force | `get-economic-data(indicator=UNEMPLOYMENT)` |
| `FP.CPI.TOTL.ZG` | Inflation (CPI) | % annual | `get-economic-data(indicator=INFLATION)` |
| `NE.TRD.GNFS.ZS` | Trade (% GDP) | % of GDP | — |
| `NE.EXP.GNFS.ZS` | Exports (% GDP) | % of GDP | `get-economic-data(indicator=EXPORTS_GDP)` |
| `BN.KLT.DINV.CD` | FDI Net Inflows | USD | `get-economic-data(indicator=FDI_NET)` |
| `BN.CAB.XOKA.GD.ZS` | Current Account Balance | % of GDP | — |

### Fiscal & Governance (5 indicators)
| Code | Name | Unit | MCP Tool |
|------|------|------|----------|
| `GC.XPN.TOTL.GD.ZS` | Government Expenditure | % of GDP | — |
| `GC.TAX.TOTL.GD.ZS` | Tax Revenue | % of GDP | — |
| `GE.EST` | Government Effectiveness | index (-2.5 to 2.5) | — |
| `RL.EST` | Rule of Law | index (-2.5 to 2.5) | — |
| `VA.EST` | Voice and Accountability | index (-2.5 to 2.5) | — |

### Defense & Security (1 indicator)
| Code | Name | Unit | MCP Tool |
|------|------|------|----------|
| `MS.MIL.XPND.GD.ZS` | Military Expenditure | % of GDP | — |

### Social (5 indicators)
| Code | Name | Unit | MCP Tool |
|------|------|------|----------|
| `SP.POP.TOTL` | Population | persons | `get-social-data(indicator=POPULATION)` |
| `SP.DYN.LE00.IN` | Life Expectancy | years | `get-social-data(indicator=LIFE_EXPECTANCY)` |
| `SP.DYN.CBRT.IN` | Birth Rate | per 1,000 | `get-social-data(indicator=BIRTH_RATE)` |
| `SP.DYN.CDRT.IN` | Death Rate | per 1,000 | `get-social-data(indicator=DEATH_RATE)` |
| `IT.NET.USER.ZS` | Internet Users | % population | `get-social-data(indicator=INTERNET_USERS)` |

### Education (2 indicators)
| Code | Name | Unit | MCP Tool |
|------|------|------|----------|
| `SE.XPD.TOTL.GD.ZS` | Education Expenditure | % of GDP | `get-education-data(indicator=EDUCATION_EXPENDITURE)` |
| `SE.PRM.ENRR` | School Enrollment (Primary) | % gross | `get-education-data(indicator=SCHOOL_ENROLLMENT)` |

### Health (3 indicators)
| Code | Name | Unit | MCP Tool |
|------|------|------|----------|
| `SH.XPD.CHEX.GD.ZS` | Health Expenditure | % of GDP | `get-health-data(indicator=HEALTH_EXPENDITURE)` |
| `SH.MED.PHYS.ZS` | Physicians | per 1,000 people | `get-health-data(indicator=PHYSICIANS)` |
| `SH.MED.BEDS.ZS` | Hospital Beds | per 1,000 people | `get-health-data(indicator=HOSPITAL_BEDS)` |

### Environment & Innovation (3 indicators)
| Code | Name | Unit | MCP Tool |
|------|------|------|----------|
| `EN.ATM.CO2E.PC` | CO₂ Emissions per Capita | metric tons | — |
| `GB.XPD.RSDV.GD.ZS` | R&D Expenditure | % of GDP | — |
| `SI.POV.GINI` | GINI Index | index (0-100) | — |

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
