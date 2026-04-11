# 🏛️ World Bank Indicator → Swedish Political Entity Mapping

> **Purpose**: Maps every World Bank indicator to the Riksdag committees, policy areas, and article types where it provides relevant context for political intelligence.

---

## 📋 Committee-Centric Mapping

### FiU — Finansutskottet (Finance Committee)

The Finance Committee oversees Sweden's fiscal framework, budget, monetary policy coordination, and overall economic governance.

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **GDP Growth** | `NY.GDP.MKTP.KD.ZG` | % annual | Core economic performance — budget revenue forecasting |
| **GDP per Capita** | `NY.GDP.PCAP.CD` | USD | Living standard context for budget debates |
| **GDP per Capita (PPP)** | `NY.GDP.PCAP.PP.CD` | Int'l $ | Cross-country welfare comparison |
| **Inflation** | `FP.CPI.TOTL.ZG` | % annual | Cost-of-living impact, Riksbank coordination |
| **Gov Expenditure** | `GC.XPN.TOTL.GD.ZS` | % of GDP | Public sector size, spending debates |
| **Tax Revenue** | `GC.TAX.TOTL.GD.ZS` | % of GDP | Fiscal capacity, tax reform context |
| **Current Account** | `BN.CAB.XOKA.GD.ZS` | % of GDP | External balance and competitiveness |
| **Gov Effectiveness** | `GE.EST` | index | Institutional quality assessment |

**Chart recommendation**: Nordic comparison bar chart + Sweden trend line for GDP Growth and Inflation.

---

### AU — Arbetsmarknadsutskottet (Labor Market Committee)

Oversees employment policy, labor law, integration, and social insurance related to employment.

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **Unemployment** | `SL.UEM.TOTL.ZS` | % of labor force | Primary indicator for labor policy debates |
| **GINI Index** | `SI.POV.GINI` | index (0-100) | Income inequality and redistribution |
| **GDP per Capita** | `NY.GDP.PCAP.CD` | USD | Economic context for employment |
| **Population** | `SP.POP.TOTL` | persons | Labor force size context |

**Chart recommendation**: Unemployment trend (10 years) + Nordic comparison bar chart.

---

### SkU — Skatteutskottet (Taxation Committee)

Oversees all taxation legislation, tax reform, and fiscal revenue policy.

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **Tax Revenue** | `GC.TAX.TOTL.GD.ZS` | % of GDP | Core indicator — tax burden comparison |

**Chart recommendation**: Nordic tax revenue comparison bar chart showing Sweden's position vs. peers.

---

### NU — Näringsutskottet (Industry Committee)

Oversees trade policy, enterprise development, competition, and industrial policy.

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **Trade (% GDP)** | `NE.TRD.GNFS.ZS` | % of GDP | Trade openness and dependency |
| **Exports (% GDP)** | `NE.EXP.GNFS.ZS` | % of GDP | Export competitiveness |
| **FDI Net Inflows** | `BN.KLT.DINV.CD` | USD | Foreign investment attractiveness |
| **Current Account** | `BN.CAB.XOKA.GD.ZS` | % of GDP | Trade balance context |

**Chart recommendation**: Trade openness Nordic comparison + FDI trend line.

---

### UU — Utrikesutskottet (Foreign Affairs Committee)

Oversees foreign policy, international cooperation, EU affairs, and development aid.

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **Trade (% GDP)** | `NE.TRD.GNFS.ZS` | % of GDP | Economic integration context |
| **Exports (% GDP)** | `NE.EXP.GNFS.ZS` | % of GDP | Trade relationship analysis |

**Chart recommendation**: Trade openness comparison to contextualize EU and trade agreements.

---

### FöU — Försvarsutskottet (Defense Committee)

Oversees defense policy, military spending, NATO integration, and national security.

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **Military Expenditure** | `MS.MIL.XPND.GD.ZS` | % of GDP | **Critical** — NATO 2% target, defense spending debates |

**Chart recommendation**: Nordic + NATO comparison bar chart showing distance to 2% target. Sweden trend line showing spending trajectory.

---

### SoU — Socialutskottet (Social Affairs Committee)

Oversees health policy, social services, elder care, and welfare system.

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **Life Expectancy** | `SP.DYN.LE00.IN` | years | Health system performance |
| **Birth Rate** | `SP.DYN.CBRT.IN` | per 1,000 | Demographic trend, family policy |
| **Death Rate** | `SP.DYN.CDRT.IN` | per 1,000 | Health outcomes |
| **Health Expenditure** | `SH.XPD.CHEX.GD.ZS` | % of GDP | Healthcare investment level |
| **Physicians** | `SH.MED.PHYS.ZS` | per 1,000 | Healthcare staffing |
| **Hospital Beds** | `SH.MED.BEDS.ZS` | per 1,000 | Healthcare infrastructure |
| **GINI Index** | `SI.POV.GINI` | index | Social inequality |
| **Population** | `SP.POP.TOTL` | persons | Demographic planning |

**Chart recommendation**: Nordic health radar (life expectancy, health spend, physicians, beds) + demographic trend lines.

---

### UbU — Utbildningsutskottet (Education Committee)

Oversees education policy at all levels, research policy, and innovation.

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **Education Expenditure** | `SE.XPD.TOTL.GD.ZS` | % of GDP | Education investment level |
| **School Enrollment** | `SE.PRM.ENRR` | % gross | Education access |
| **R&D Expenditure** | `GB.XPD.RSDV.GD.ZS` | % of GDP | Innovation and research investment |

**Chart recommendation**: Nordic education + R&D spending comparison bar chart.

---

### MJU — Miljö- och jordbruksutskottet (Environment Committee)

Oversees environmental policy, climate legislation, agriculture, and food safety.

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **CO₂ Emissions** | `EN.ATM.CO2E.PC` | metric tons/cap | Climate policy effectiveness |

**Chart recommendation**: Nordic CO₂ comparison + Sweden trend showing emissions trajectory.

---

### KU — Konstitutionsutskottet (Constitution Committee)

Oversees constitutional affairs, government oversight, press freedom, and democratic governance.

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **Rule of Law** | `RL.EST` | index (-2.5 to 2.5) | Judicial independence, constitutional order |
| **Voice & Accountability** | `VA.EST` | index (-2.5 to 2.5) | Democratic participation, press freedom |
| **Gov Effectiveness** | `GE.EST` | index (-2.5 to 2.5) | Public service quality |

**Chart recommendation**: Governance radar chart (rule of law, voice, effectiveness) comparing Nordic countries.

---

### JuU — Justitieutskottet (Justice Committee)

Oversees criminal justice, police, courts, migration law, and rule of law.

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **Rule of Law** | `RL.EST` | index (-2.5 to 2.5) | Justice system quality |

---

### TU — Trafikutskottet (Transport Committee)

Oversees transport, telecommunications, digital infrastructure, and postal services.

| Indicator | Code | Unit | Relevance |
|-----------|------|------|-----------|
| **Internet Users** | `IT.NET.USER.ZS` | % of population | Digital infrastructure readiness |

---

## 📊 Article Type → Indicator Priority Matrix

| Article Type | Primary Indicators | Secondary Indicators |
|-------------|-------------------|---------------------|
| **propositions** | GDP Growth, Unemployment, Inflation, Tax Revenue, Military Exp. | Gov Expenditure, Health Exp., Education Exp., CO₂ |
| **committee-reports** | All committee-specific indicators | Related cross-cutting indicators |
| **motions** | Unemployment, Tax Revenue, Military Exp. | GINI, CO₂, Health Exp. |
| **interpellations** | Rule of Law, Voice & Accountability | Military Exp., Unemployment |
| **week-ahead** | GDP Growth, Unemployment, Inflation | Gov Effectiveness, Rule of Law |
| **month-ahead** | All trend indicators (10-year) | Nordic comparisons |
| **weekly-review** | GDP Growth, Unemployment, Inflation, Gov Effectiveness | All governance indicators |
| **monthly-review** | **All 28 indicators** — comprehensive country profile | Full Nordic comparison |
| **evening-analysis** | Top 3 most relevant to day's events | Related indicators |
| **deep-inspection** | All indicators matching document policy area | Full Nordic comparison |

---

**Document Control:**
- **Repository:** https://github.com/Hack23/riksdagsmonitor
- **Path:** `/analysis/worldbank/indicator-policy-mapping.md`
- **Classification:** Public
