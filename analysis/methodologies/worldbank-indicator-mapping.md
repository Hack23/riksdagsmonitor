# World Bank Indicator → Article Type Mapping (Riksdagsmonitor)

> ## ⚠️ Scope notice (effective 2026-04-28)
>
> **World Bank is NEVER acceptable for economic context** in Riksdagsmonitor — not as primary, not as secondary, not as fallback, not as historical. All macro / fiscal / monetary / external-sector / trade / commodity / FX / interest-rate context is sourced from **IMF** (WEO + FM + IFS + BOP + GFS_COFOG + DOTS + PCPS + MFS_IR + ER) — see [`imf-indicator-mapping.md`](imf-indicator-mapping.md) and [`analysis/imf/`](../imf/). The deprecation is enforced programmatically in `scripts/world-bank-context.ts` (filters `deprecated: true` from the active set), in `analysis/worldbank/indicators-inventory.json` v3.1 (per-indicator `deprecated: true` + `supersededBy: "imf:..."`), and in `tests/worldbank-deprecation-contract.test.ts` (CI gate).
>
> This document covers the **non-economic residue** World Bank retains as primary:
> - Governance (WGI, `source=75`) — `CC.EST`, `RL.EST`, `VA.EST`, `GE.EST`, `RQ.EST`, `PV.EST`
> - Environment — `EN.ATM.CO2E.PC`, `EG.FEC.RNEW.ZS`, `AG.LND.FRST.ZS`, `ER.H2O.FWTL.ZS`
> - Social / demographics — `SP.POP.TOTL`, `SP.DYN.LE00.IN`, `SP.DYN.CBRT.IN`, `IT.NET.USER.ZS`
> - Health (detail) — `SH.XPD.CHEX.GD.ZS`, `SH.MED.PHYS.ZS`, `SH.MED.BEDS.ZS`, `SH.IMM.MEAS`
> - Education — `SE.XPD.TOTL.GD.ZS`, `SE.PRM.ENRR`, `SE.TER.ENRR`, `SE.PRM.CMPT.ZS`
> - Defence historicals — `MS.MIL.XPND.GD.ZS`, `MS.MIL.TOTL.P1`
> - Agriculture — `AG.PRD.CREL.MT`, `AG.LND.ARBL.ZS`, `NV.AGR.TOTL.ZS`
> - Innovation — `GB.XPD.RSDV.GD.ZS`, `IP.PAT.RESD`
> - Crime / justice — `VC.IHR.PSRC.P5`
>
> ### 🚫 Deprecated economic codes (do NOT use as primary in new articles)
>
> | WB code (deprecated) | IMF replacement (use instead) |
> |----------------------|-------------------------------|
> | `NY.GDP.MKTP.KD.ZG` | `WEO:NGDP_RPCH` |
> | `NY.GDP.MKTP.CD` | `WEO:NGDPD` |
> | `NY.GDP.PCAP.CD` | `WEO:NGDPDPC` |
> | `FP.CPI.TOTL.ZG` | `WEO:PCPIPCH` |
> | `SL.UEM.TOTL.ZS` | `WEO:LUR` (SCB AKU for Swedish-specific) |
> | `GC.DOD.TOTL.GD.ZS` | `WEO:GGXWDG_NGDP` |
> | `GC.XPN.TOTL.GD.ZS` | `WEO:GGX_NGDP` |
> | `GC.REV.XGRT.GD.ZS` | `WEO:GGR_NGDP` |
> | `BN.CAB.XOKA.GD.ZS` | `WEO:BCA_NGDPD` |
> | `NE.EXP.GNFS.ZS` | `WEO:TX_RPCH` |
>
> These codes remain read-only for back-compat with pre-2026-04-20 articles; new articles MUST use the IMF counterpart. See [`analysis/imf/indicators-inventory.json → deprecationPolicy`](../imf/indicators-inventory.json).

---

**Purpose** — canonical reference that maps Riksdagsmonitor news workflow article types to the most-relevant **non-economic** World Bank Open Data indicators used in `comparative-international.md`, `voter-segmentation.md`, `implementation-feasibility.md` and the `session-baseline.md` domain tables.

**Data access** — via the `world-bank` MCP server (local container, `worldbank-mcp@1.0.1`) using `get-social-data`, `get-health-data`, `get-education-data`, and the raw-REST passthrough for environment / defence / agriculture / innovation / governance codes. See [`.github/copilot-mcp.json`](../../.github/copilot-mcp.json) and [`.github/prompts/02-mcp-access.md`](../../.github/prompts/02-mcp-access.md).

**Enforcement** — the gate check in [`.github/prompts/05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md) Check 4 currently verifies primary-source evidence (a `dok_id` or an allowed primary-source URL host — `riksdagen.se`, `regeringen.se`, `scb.se`, `worldbank.org`, `api.imf.org`, `data.imf.org`, `www.imf.org`). It does not yet block WB economic codes in new articles — treat the economic-deprecation list above as **methodology guidance** (advisory), with a follow-up automated lint planned.

---

## 1. Retained WB Domains

| Domain | Primary tool | Example indicator codes | Typical article types |
|--------|--------------|-------------------------|-----------------------|
| Social / demographics | `get-social-data` + raw `SP.POP.*` | `SP.POP.TOTL`, `SP.DYN.LE00.IN`, `SP.DYN.CBRT.IN`, `SP.DYN.CDRT.IN`, `IT.NET.USER.ZS` | committee-reports (SoU), evening-analysis, month-ahead |
| Health | `get-health-data` | `SH.XPD.CHEX.GD.ZS`, `SH.MED.PHYS.ZS`, `SH.MED.BEDS.ZS`, `SH.IMM.MEAS`, `SH.DYN.AIDS.ZS`, `SH.STA.MALN.ZS`, `SH.TBS.INCD` | committee-reports (SoU, Sjukvård), propositions |
| Education | `get-education-data` | `SE.ADT.LITR.ZS`, `SE.PRM.ENRR`, `SE.PRM.CMPT.ZS`, `SE.PRM.TCHR`, `SE.XPD.TOTL.GD.ZS` | committee-reports (UbU), motions on skola |
| Environment | raw `EN.*`, `EG.FEC.RNEW.ZS` | `EN.ATM.CO2E.PC`, `EG.FEC.RNEW.ZS`, `AG.LND.FRST.ZS`, `ER.H2O.FWTL.ZS` | committee-reports (MjU, NU), evening-analysis |
| Defence | raw `MS.MIL.*` | `MS.MIL.XPND.GD.ZS`, `MS.MIL.TOTL.P1` | committee-reports (FöU), propositions on försvar |
| Agriculture | raw `AG.*`, `NV.AGR.TOTL.ZS` | `AG.PRD.CREL.MT`, `AG.LND.ARBL.ZS`, `NV.AGR.TOTL.ZS` | committee-reports (MJU), motions on landsbygd |
| Innovation | raw `GB.XPD.RSDV.GD.ZS`, `IT.NET.USER.ZS` | `GB.XPD.RSDV.GD.ZS`, `IT.NET.USER.ZS`, `IP.PAT.RESD` | committee-reports (UbU, NU), propositions on forskning |
| Governance | raw `SG.*`, `IC.*` | `SG.GEN.PARL.ZS`, `IC.BUS.EASE.XQ`, WGI via [`governance.worldbank.org`](https://governance.worldbank.org) | intelligence-assessment, methodology-reflection |

---

## 2. Sweden Country Code & Regional Aggregates

| Purpose | Code | Notes |
|---------|------|-------|
| Sweden | `SWE` | ISO-3 |
| EU (World Bank aggregate) | `EUU` | accepted by `world-bank` MCP |
| Euro area | `EMU` | accepted by WB (Sweden is non-Euro) |
| Nordic baseline (manual) | `DNK`, `FIN`, `NOR`, `ISL` | fetched in parallel for comparative-international |
| OECD | `OED` | WB aggregate |
| High income | `HIC` | income-level aggregate |

> **Note on IMF aggregates** — use `EU`, `EA`, `G7`, `G20` instead of `EUU`/`EMU` when calling IMF; the two MCPs use incompatible aggregate codes.

---

## 3. Article-Type → Domain Map

| Article type | Required WB domains | Optional |
|--------------|---------------------|----------|
| `propositions` | — (economic → IMF) | health, education, environment per committee |
| `motions` | social, innovation | environment, defence |
| `committee-reports` | domain of the committee (UbU→education, MjU→environment, SoU→health, FöU→defence) | demographics |
| `interpellations` | — | social (when demographic framing present) |
| `evening-analysis` | social, health (if day's theme warrants) | governance |
| `realtime-monitor` | — | whatever the breaking topic demands |
| `week-ahead` / `month-ahead` | — (forward-looking) | social baseline |
| `weekly-review` / `monthly-review` | social, health, education, environment trend lines | innovation |

---

## 4. Citation Pattern

Every WB figure cited in an artifact must appear as:

```text
World Bank, "{indicator name}" ({indicator code}), Sweden, {year}, {URL or "WDI via world-bank MCP"}. Admiralty: B2.
```

Example:

```text
World Bank, "Total health expenditure (% of GDP)" (SH.XPD.CHEX.GD.ZS),
Sweden, 2023, WDI via world-bank MCP. Admiralty: B2.
```

---

## 5. Anti-Patterns (gate failures)

- Citing the raw indicator code without the human-readable name.
- Quoting a single year without trend context (min. 5-year series).
- Using `SWE` alongside a non-matching regional aggregate (e.g. mixing `EUU` with an IMF `EU` figure for the same chart).
- Failing to flag indicators with known data quality issues (Sweden's `SH.DYN.AIDS.ZS` is aggregated to suppress small counts — annotate).

---

## 6. Changelog

- **v1.1 (2026-04-24)** — Scope tightened: WB economic codes explicitly deprecated, IMF replacements listed, scope notice added to header. Full IMF integration across methodologies/templates/prompts.
- **v1.0 (2026-04-23)** — Initial Riksdagsmonitor mapping; adapted from EU Parliament Monitor `worldbank-indicator-mapping.md` Wave-2 scope.

---

## 7. Detailed Indicator Reference — Retained Domains

### 7a. Governance (WGI, source=75)

| Indicator | WB Code | Range | Sweden 2023 | Global percentile | Publication lag | Use in Riksdagsmonitor |
|-----------|---------|:-----:|:-----------:|:-----------------:|:---------------:|------------------------|
| Control of Corruption | `CC.EST` | −2.5–+2.5 | ≈ +2.15 | 98th | 12 months | `pestle-analysis.md §Political`, `risk-assessment.md §Institutional` |
| Rule of Law | `RL.EST` | −2.5–+2.5 | ≈ +1.95 | 97th | 12 months | `pestle-analysis.md §Legal` |
| Voice and Accountability | `VA.EST` | −2.5–+2.5 | ≈ +1.65 | 90th | 12 months | `risk-assessment.md §Democratic accountability` |
| Government Effectiveness | `GE.EST` | −2.5–+2.5 | ≈ +1.90 | 96th | 12 months | `executive-brief.md §Context` |
| Regulatory Quality | `RQ.EST` | −2.5–+2.5 | ≈ +1.75 | 95th | 12 months | `implementation-feasibility.md §Institutional capacity` |
| Political Stability / No Violence | `PV.EST` | −2.5–+2.5 | ≈ +0.85 | 78th | 12 months | Note: NATO accession may improve future scores; hybrid threat context may depress |

**MCP query for governance:**
```python
# Source=75 is mandatory for WGI — otherwise WB API returns WDI economic codes
get-economic-data(countryCode="SWE", indicator="CC.EST", years=10)
# Nordic peer comparison (iterate):
for c in ["SWE", "DNK", "FIN", "NOR"]: get-economic-data(countryCode=c, indicator="CC.EST", years=5)
```

### 7b. Environmental (WDI)

| Indicator | WB Code | Unit | Sweden ≈ | WB data lag | Swedish myndighet (use first for Sweden) |
|-----------|---------|------|:-------:|:-----------:|----------------------------------------|
| CO₂ per capita | `EN.ATM.CO2E.PC` | tonne/capita | 3.5 (2022) | 18–24 mo | Naturvårdsverket (NVV) |
| CO₂ total (kt) | `EN.ATM.CO2E.KT` | kilotonnes | see NVV | 18–24 mo | Naturvårdsverket |
| Renewable energy share | `EG.FEC.RNEW.ZS` | % total energy | ≈ 60 % (2022) | 12–18 mo | Energimyndigheten |
| Forest area | `AG.LND.FRST.ZS` | % land area | ≈ 69 % | 12 mo | Skogsstyrelsen |
| Freshwater withdrawals | `ER.H2O.FWTL.ZS` | % internal resources | < 1 % | 24–36 mo | SGU / SMHI |
| PM2.5 exposure | `EN.ATM.PM25.MC.M3` | µg/m³ | ≈ 8 | 12–18 mo | Naturvårdsverket |

**Limitation**: WB environmental data sourced from national statistical offices with significant lag. For real-time Swedish policy analysis, cite Naturvårdsverket / Energimyndigheten / SMHI as primary and WB as international context layer only.

### 7c. Health & Nutrition (WDI)

| Indicator | WB Code | MCP tool key | Unit | Sweden ≈ | Swedish authority |
|-----------|---------|:------------:|------|:-------:|-------------------|
| Health expenditure % GDP | `SH.XPD.CHEX.GD.ZS` | `HEALTH_EXPENDITURE` | % | 10.9 % (2022) | Socialstyrelsen; SCB NR |
| Physicians per 1,000 | `SH.MED.PHYS.ZS` | `PHYSICIANS` | per 1K | 4.3 (2022) | Socialstyrelsen |
| Hospital beds per 1,000 | `SH.MED.BEDS.ZS` | `HOSPITAL_BEDS` | per 1K | 2.1 (2020) | Socialstyrelsen |
| Measles immunisation | `SH.IMM.MEAS` | `IMMUNIZATION` | % 1-year-olds | 97 % (2022) | Folkhälsomyndigheten |
| HIV prevalence | `SH.DYN.AIDS.ZS` | `HIV_PREVALENCE` | % adults 15–49 | ≈ 0.1 % | Folkhälsomyndigheten |
| Undernourishment | `SN.ITK.DEFC.ZS` | `MALNUTRITION` | % population | < 2.5 % | SCB HEK survey |
| Tuberculosis incidence | `SH.TBS.INCD` | `TUBERCULOSIS` | per 100K | ≈ 4.0 (2022) | Folkhälsomyndigheten |

**MCP query example:**
```python
get-health-data(countryCode="SWE", indicator="HEALTH_EXPENDITURE", years=10)
```

**Limitation**: WB health data aggregated from WHO and national sources; may differ from Socialstyrelsen micro-data by ±0.5–1.0 pp. Always cross-reference Socialstyrelsen for Swedish domestic policy analysis.

### 7d. Education (WDI)

| Indicator | WB Code | MCP tool key | Unit | Sweden ≈ | Swedish authority |
|-----------|---------|:------------:|------|:-------:|-------------------|
| Literacy rate (adult) | `SE.ADT.LITR.ZS` | `LITERACY_RATE` | % | ≈ 99 % | SCB PIAAC |
| Primary enrollment | `SE.PRM.ENRR` | `SCHOOL_ENROLLMENT` | gross % | > 100 % | Skolverket |
| Primary completion | `SE.PRM.CMPT.ZS` | `SCHOOL_COMPLETION` | % | ≈ 99 % | Skolverket |
| Primary teachers | `SE.PRM.TCHR` | `TEACHERS_PRIMARY` | count | ≈ 85,000 | Skolverket |
| Gov. education expenditure % GDP | `SE.XPD.TOTL.GD.ZS` | `EDUCATION_EXPENDITURE` | % | ≈ 6.8 % | SCB `OE0107` |

---

## 8. Limitations Summary

| Limitation type | Affected domains | Mitigation |
|----------------|:----------------:|-----------|
| Publication lag 18–24 months | Environmental, some health | Use Swedish myndigheter as primary; WB for international comparison |
| WGI country coverage gaps | Governance (some years) | Flag in `mcp-reliability-audit.md §7` if year missing |
| Small-count suppression | HIV, TB, undernourishment | Note in article: "WB suppresses counts below threshold; exact value below X" |
| WDI aggregation methodology differs from Eurostat / SCB | Social / health / education | When citing for EU comparison, note "WB WDI methodology; Eurostat may differ by ±X pp" |
| WB economic code still callable but deprecated | All economic domains | Run `WB_ECON_REG` check in `mcp-reliability-audit.md §7`; re-fetch via IMF |
| WGI annual frequency only | Governance | Do not interpolate between years; use "most recent available (YYYY)" |

---

## 9. Cross-Reference Matrix

| Riksdagsmonitor template | Relevant WB domain | Key codes | Also cite |
|--------------------------|-------------------|-----------|-----------|
| `pestle-analysis.md §Social` | Social / demographics | `SP.POP.TOTL`, `SP.DYN.LE00.IN` | SCB `BE0101` (Sweden primary) |
| `pestle-analysis.md §Environmental` | Environmental | `EN.ATM.CO2E.PC`, `EG.FEC.RNEW.ZS` | NVV, Energimyndigheten (Sweden primary) |
| `pestle-analysis.md §Political` | Governance | `CC.EST`, `VA.EST`, `PV.EST` | Statskontoret, JO, KU betänkande |
| `risk-assessment.md §Institutional` | Governance | `RL.EST`, `GE.EST` | KU annual report |
| `comparative-international.md` | All domains | Full Nordic peer comparison | IMF for economic columns; WB for non-economic |
| `voter-segmentation.md §Demographic` | Social | `SP.POP.TOTL`, `IT.NET.USER.ZS` | SCB (Sweden primary) |
| `implementation-feasibility.md §Capacity` | Governance / innovation | `RQ.EST`, `GB.XPD.RSDV.GD.ZS` | Vinnova for Swedish R&D |
