# World Bank Indicator → Article Type Mapping (Riksdagsmonitor)

> ## ⚠️ Scope notice (effective 2026-04-24)
>
> **World Bank is NOT the primary source for economic data** in Riksdagsmonitor articles. All macro / fiscal / monetary / external-sector / trade context is sourced from **IMF** — see [`imf-indicator-mapping.md`](imf-indicator-mapping.md) and [`analysis/imf/`](../imf/).
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
