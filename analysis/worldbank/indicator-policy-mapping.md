# 🏛️ World Bank Indicator → Swedish Political Entity Mapping (v3.0)

> **Purpose**: Maps all 144 World Bank indicators to Riksdag committees, policy areas, and article types for political intelligence enrichment.
> **Source**: Canonical inventory in `analysis/worldbank/indicators-inventory.json`; consumed by `scripts/world-bank-client.ts` (INDICATOR_IDS) and `scripts/world-bank-context.ts` (ECONOMIC_INDICATORS)

---

## 📋 Committee-Centric Mapping

### FiU — Finansutskottet (Finance Committee) — 30+ indicators

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **GDP (current US$)** | `NY.GDP.MKTP.CD` | USD | Headline economic output |
| **GDP Growth** | `NY.GDP.MKTP.KD.ZG` | % annual | Core performance — budget revenue forecasting |
| **GDP (constant LCU)** | `NY.GDP.MKTP.KN` | SEK | Real growth excluding price effects |
| **GDP, PPP** | `NY.GDP.MKTP.PP.CD` | Int'l $ | Cross-country economic size |
| **GDP per Capita** | `NY.GDP.PCAP.CD` | USD | Living standard context |
| **GDP per Capita Growth** | `NY.GDP.PCAP.KD.ZG` | % annual | Individual prosperity trends |
| **GDP per Capita (PPP)** | `NY.GDP.PCAP.PP.CD` | Int'l $ | Welfare comparison |
| **Govt Consumption** | `NE.CON.GOVT.ZS` | % of GDP | Public sector size |
| **Household Consumption** | `NE.CON.PRVT.ZS` | % of GDP | Demand strength |
| **Gross Capital Formation** | `NE.GDI.TOTL.ZS` | % of GDP | Investment level |
| **Gross Fixed Capital** | `NE.GDI.FTOT.ZS` | % of GDP | Infrastructure spending |
| **Gross Savings** | `NY.GNS.ICTR.ZS` | % of GDP | Fiscal sustainability |
| **GNI** | `NY.GNP.MKTP.CD` | USD | National income |
| **GNI per Capita** | `NY.GNP.PCAP.CD` | USD | Income classification |
| **Inflation** | `FP.CPI.TOTL.ZG` | % annual | Cost-of-living, Riksbank coordination |
| **GDP Deflator** | `NY.GDP.DEFL.KD.ZG` | % annual | Broad price pressure |
| **CPI** | `FP.CPI.TOTL` | index | Price level tracking |
| **Tax Revenue** | `GC.TAX.TOTL.GD.ZS` | % of GDP | Fiscal capacity |
| **Govt Expenditure** | `GC.XPN.TOTL.GD.ZS` | % of GDP | Spending level |
| **Govt Revenue** | `GC.REV.XGRT.GD.ZS` | % of GDP | Revenue capacity |
| **Cash Surplus/Deficit** | `GC.BAL.CASH.GD.ZS` | % of GDP | Fiscal balance |
| **Net Lending** | `GC.NLD.TOTL.GD.ZS` | % of GDP | Fiscal position |
| **Current Account** | `BN.CAB.XOKA.GD.ZS` | % of GDP | External position |
| **Domestic Credit** | `FS.AST.PRVT.GD.ZS` | % of GDP | Financial depth |
| **Real Interest Rate** | `FR.INR.RINR` | % | Monetary conditions |
| **Lending Rate** | `FR.INR.LEND` | % | Credit cost |
| **Deposit Rate** | `FR.INR.DPST` | % | Savings return |
| **Govt Effectiveness** | `GE.EST` | index | Institutional quality [source=75] |
| **Labor Productivity** | `SL.GDP.PCAP.EM.KD` | PPP $ | Competitiveness |

**Chart**: Nordic comparison bar + Sweden trend line for GDP Growth and Inflation.

---

### AU — Arbetsmarknadsutskottet (Labor Market Committee) — 22+ indicators

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **Unemployment** | `SL.UEM.TOTL.ZS` | % of labor force | Primary labor policy indicator |
| **Unemployment, Female** | `SL.UEM.TOTL.FE.ZS` | % | Gender labor gap |
| **Unemployment, Male** | `SL.UEM.TOTL.MA.ZS` | % | Gender comparison |
| **Youth Unemployment** | `SL.UEM.1524.ZS` | % ages 15-24 | Education-to-work transition |
| **Youth Unempl., Female** | `SL.UEM.1524.FE.ZS` | % ages 15-24 | Gender gap early career |
| **Youth Unempl., Male** | `SL.UEM.1524.MA.ZS` | % ages 15-24 | Gender comparison |
| **Long-term Unemployment** | `SL.UEM.LTRM.ZS` | % of total | Structural challenges |
| **Long-term Unempl., Female** | `SL.UEM.LTRM.FE.ZS` | % | Gender dimension |
| **Long-term Unempl., Male** | `SL.UEM.LTRM.MA.ZS` | % | Gender comparison |
| **Labor Participation** | `SL.TLF.CACT.ZS` | % ages 15+ | Workforce share |
| **Labor Participation, Female** | `SL.TLF.CACT.FE.ZS` | % | Gender equality benchmark |
| **Labor Participation, Male** | `SL.TLF.CACT.MA.ZS` | % | Baseline |
| **Labor Force Total** | `SL.TLF.TOTL.IN` | persons | Workforce size |
| **Employment Ratio** | `SL.EMP.TOTL.SP.ZS` | % ages 15+ | Actual employment rate |
| **Employment Ratio, Female** | `SL.EMP.TOTL.SP.FE.ZS` | % | Gender employment gap |
| **Employment Ratio, Male** | `SL.EMP.TOTL.SP.MA.ZS` | % | Baseline |
| **Vulnerable Employment** | `SL.EMP.VULN.ZS` | % | Precarious work |
| **Self-Employment** | `SL.EMP.SELF.ZS` | % | Gig economy |
| **Wage Workers** | `SL.EMP.WORK.ZS` | % | Formal employment |
| **GINI Index** | `SI.POV.GINI` | 0-100 | Income inequality |
| **Women in Parliament** | `SG.GEN.PARL.ZS` | % | Political gender equality |
| **Net Migration** | `SM.POP.NETM` | persons | Immigration impact |

**Chart**: Unemployment trend (10 years) + Nordic comparison, Youth vs Total unemployment.

---

### SkU — Skatteutskottet (Taxation Committee) — 6 indicators

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **Tax Revenue** | `GC.TAX.TOTL.GD.ZS` | % of GDP | Core — tax burden comparison |
| **Tax on Goods & Services** | `GC.TAX.GSRV.RV.ZS` | % of revenue | VAT/excise structure |
| **Tax on Income & Profits** | `GC.TAX.YPKG.RV.ZS` | % of revenue | Direct tax burden |
| **Tax on Int'l Trade** | `GC.TAX.INTT.RV.ZS` | % of revenue | Trade tariff policy |
| **Income Top 10%** | `SI.DST.10TH.10` | % | Tax base concentration |
| **Income Top 20%** | `SI.DST.05TH.20` | % | Wealth distribution |

**Chart**: Tax structure pie chart + Nordic tax burden comparison.

---

### NU — Näringsutskottet (Industry Committee) — 12+ indicators

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **Trade Openness** | `NE.TRD.GNFS.ZS` | % of GDP | Economic integration |
| **Exports (% GDP)** | `NE.EXP.GNFS.ZS` | % of GDP | Trade competitiveness |
| **Imports (% GDP)** | `NE.IMP.GNFS.ZS` | % of GDP | Import dependence |
| **FDI Inflows** | `BN.KLT.DINV.CD` | USD | Foreign investment |
| **FDI Inflows (% GDP)** | `BX.KLT.DINV.WD.GD.ZS` | % | Investment openness |
| **FDI Outflows (% GDP)** | `BM.KLT.DINV.WD.GD.ZS` | % | Outward expansion |
| **High-Tech Exports** | `TX.VAL.TECH.MF.ZS` | % | Innovation competitiveness |
| **Regulatory Quality** | `RQ.EST` | index | Business climate [source=75] |
| **Self-Employment** | `SL.EMP.SELF.ZS` | % | Entrepreneurship |
| **Renewable Energy** | `EG.FEC.RNEW.ZS` | % | Green industry |

**Chart**: Trade flow diagram + FDI trend + High-tech exports comparison.

---

### FöU — Försvarsutskottet (Defense Committee) — 6 indicators

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **Military Exp. (% GDP)** | `MS.MIL.XPND.GD.ZS` | % of GDP | **NATO 2% target** — core metric |
| **Military Exp. (USD)** | `MS.MIL.XPND.CD` | USD | Absolute capability |
| **Military (% Govt)** | `MS.MIL.XPND.ZS` | % of govt exp. | Budget priority |
| **Armed Forces Personnel** | `MS.MIL.TOTL.P1` | persons | Force size |
| **Armed Forces (% Labor)** | `MS.MIL.TOTL.TF.ZS` | % | Societal commitment |
| **Political Stability** | `PV.EST` | index | Security environment [source=75] |

**Chart**: Military spending trend toward 2% + Nordic comparison bar.

---

### SoU — Socialutskottet (Social Affairs Committee) — 35+ indicators

Covers health, demographics, welfare, and social protection.

| Domain | Key Indicators | Count |
|--------|---------------|-------|
| **Health** | Health Exp., Govt Health Exp., Physicians, Hospital Beds, Nurses, Suicide Rate, Tobacco, Alcohol, Immunization | 14 |
| **Demographics** | Population, Growth, 65+, 0-14, Working-age, Urban/Rural, Age Dependency, Migration, Refugees | 12 |
| **Vital Statistics** | Life Expectancy (M/F), Birth/Death Rate, Fertility, Infant/Under-5 Mortality | 9 |
| **Inequality** | GINI, Income Top/Bottom 10%, Income Top/Bottom 20% | 5 |

**Chart**: Life expectancy trend + Age pyramid + Health spending comparison.

---

### UbU — Utbildningsutskottet (Education Committee) — 10 indicators

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **Education Exp. (% GDP)** | `SE.XPD.TOTL.GD.ZS` | % of GDP | Investment level |
| **Education (% Govt)** | `SE.XPD.TOTL.GB.ZS` | % of govt exp. | Policy priority |
| **Primary Enrollment** | `SE.PRM.ENRR` | % gross | Access |
| **Secondary Enrollment** | `SE.SEC.ENRR` | % gross | Progression |
| **Tertiary Enrollment** | `SE.TER.ENRR` | % gross | Higher education access |
| **Primary Completion** | `SE.PRM.CMPT.ZS` | % | System effectiveness |
| **R&D Expenditure** | `GB.XPD.RSDV.GD.ZS` | % of GDP | Innovation capacity |
| **Researchers/million** | `SP.POP.SCIE.RD.P6` | per million | Knowledge economy |
| **Scientific Articles** | `IP.JRN.ARTC.SC` | articles | Research output |
| **Youth Unemployment** | `SL.UEM.1524.ZS` | % | Education outcomes |

**Chart**: Education spending + enrollment funnel + R&D comparison.

---

### MJU — Miljö- och jordbruksutskottet (Environment Committee) — 11 indicators

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **CO₂ per Capita** | `EN.ATM.CO2E.PC` | metric tons | Climate target tracking |
| **CO₂ Total (kt)** | `EN.ATM.CO2E.KT` | kilotons | National carbon footprint |
| **Energy Use** | `EG.USE.PCAP.KG.OE` | kg oil eq. | Energy efficiency |
| **Renewable Energy** | `EG.FEC.RNEW.ZS` | % of total | Green transition |
| **Renewable Electricity** | `EG.ELC.RNEW.ZS` | % | Power decarbonization |
| **Forest Area** | `AG.LND.FRST.ZS` | % of land | Natural resources |
| **Air Pollution (PM2.5)** | `EN.ATM.PM25.MC.M3` | µg/m³ | Environmental health |
| **Nuclear Electricity** | `EG.ELC.NUCL.ZS` | % | Energy mix debates |
| **Hydroelectric** | `EG.ELC.HYRO.ZS` | % | Renewable baseload |
| **Renewable excl. Hydro** | `EG.ELC.RNWX.ZS` | % | Wind/solar growth |
| **Electric Power** | `EG.USE.ELEC.KH.PC` | kWh/capita | Energy demand |

**Chart**: Energy mix pie + CO₂ trend + Renewable trajectory.

---

### KU — Konstitutionsutskottet (Constitution Committee) — 7 indicators

| Indicator | Code | Unit | Notes |
|-----------|------|------|-------|
| **Rule of Law** | `RL.EST` | index | Judicial independence [source=75] |
| **Voice & Accountability** | `VA.EST` | index | Press freedom, citizen participation [source=75] |
| **Govt Effectiveness** | `GE.EST` | index | Public service quality [source=75] |
| **Regulatory Quality** | `RQ.EST` | index | Regulation effectiveness [source=75] |
| **Corruption Control** | `CC.EST` | index | Anti-corruption [source=75] |
| **Political Stability** | `PV.EST` | index | Governance stability [source=75] |
| **Women in Parliament** | `SG.GEN.PARL.ZS` | % | Democratic representation |

**Chart**: Governance radar + Nordic governance comparison.

---

### TU — Trafikutskottet (Transport Committee) — 5 indicators

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **Internet Users** | `IT.NET.USER.ZS` | % of pop. | Digital infrastructure |
| **Broadband** | `IT.NET.BBND.P2` | per 100 | Infrastructure quality |
| **Mobile Subscriptions** | `IT.CEL.SETS.P2` | per 100 | Telecom maturity |
| **Secure Servers** | `IT.NET.SECR.P6` | per million | Cybersecurity |
| **Air Passengers** | `IS.AIR.PSGR` | persons | Transport usage |

---

### UU — Utrikesutskottet (Foreign Affairs Committee) — 5 indicators

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **Trade Openness** | `NE.TRD.GNFS.ZS` | % of GDP | Integration level |
| **Exports (% GDP)** | `NE.EXP.GNFS.ZS` | % of GDP | Trade position |
| **GDP, PPP** | `NY.GDP.MKTP.PP.CD` | Int'l $ | Economic weight |
| **FDI Outflows** | `BM.KLT.DINV.WD.GD.ZS` | % of GDP | Swedish global reach |
| **ICT Exports** | `BX.GSR.CCIS.ZS` | % | Digital economy strength |

---

### JuU — Justitieutskottet (Justice Committee) — 2 indicators

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **Rule of Law** | `RL.EST` | index | Judicial system quality [source=75] |
| **Corruption Control** | `CC.EST` | index | Institutional integrity [source=75] |

---

## 📊 Domain Summary

| Domain | Indicators | Primary Committees | Access |
|--------|-----------|-------------------|--------|
| National Accounts & GDP | 17 | FiU | MCP + REST |
| Government Finance | 9 | SkU, FiU | REST |
| Trade & Payments | 11 | NU, UU | MCP + REST |
| Labor Market | 20 | AU | MCP + REST |
| Inflation & Prices | 3 | FiU | MCP + REST |
| Financial Sector | 4 | FiU | REST |
| Demographics | 22 | SoU | MCP + REST |
| Health | 14 | SoU | MCP + REST |
| Education | 6 | UbU | MCP + REST |
| Environment | 10 | MJU | REST |
| Infrastructure | 6 | TU | MCP + REST |
| Innovation | 4 | UbU | REST |
| Military | 5 | FöU | REST |
| Governance (WGI) | 6 | KU, JuU | REST source=75 |
| Inequality | 5 | SoU, AU | REST |
| Gender | 1 | KU, AU | REST |
| Energy | 1 | MJU, NU | REST |
| **TOTAL** | **144** | **12 committees** | |

---

**Last Updated**: 2026-04-12
**Version**: 3.0
