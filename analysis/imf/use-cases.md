# IMF Integration — Use Cases

> Canonical examples of how IMF data enriches Riksdagsmonitor articles.
> Each case shows (1) the political event, (2) the IMF query, (3) the
> commentary snippet, and (4) the `economic-data.json` excerpt.

---

## 1. SkU tax-reform proposition (FiU + SkU)

**Event**: Regeringen submits SoU-2025/26:12 proposing corporate-tax
changes. FiU must weigh fiscal space.

**Query** (via `tsx scripts/imf-fetch.ts`):

```bash
tsx scripts/imf-fetch.ts compare \
  --indicator GGXWDG_NGDP --countries SWE,DNK,NOR,FIN,DEU --persist
tsx scripts/imf-fetch.ts compare \
  --indicator GGR_NGDP    --countries SWE,DNK,NOR,FIN,DEU --persist
tsx scripts/imf-fetch.ts weo \
  --country SWE --indicator NGDP_RPCH --years 12 --persist
```

**Commentary** (for a `propositions` article):

> IMF projects Sweden's general government gross debt at **32.4 %** of
> GDP in **2027** (WEO Apr-2026, `GGXWDG_NGDP`), down from the 2022
> peak of 38 %. With revenue holding at **49.1 %** of GDP (`GGR_NGDP`),
> the SkU proposal SoU-2025/26:12 lands with fiscal headroom that
> absent in the 2022 debate over TAB-03/22.

**Artefact** (`analysis/daily/2026-04-20/propositions/economic-data.json`,
excerpt):

```json
{
  "version": "2.0",
  "source": { "worldBank": [], "scb": [], "imf": ["WEO:GGXWDG_NGDP", "WEO:GGR_NGDP"] },
  "dataPoints": [
    { "countryCode": "SWE", "indicatorId": "GGXWDG_NGDP", "date": "2022", "value": 38.0, "provider": "imf", "projection": false },
    { "countryCode": "SWE", "indicatorId": "GGXWDG_NGDP", "date": "2027", "value": 32.4, "provider": "imf", "projection": true,  "projectionVintage": "WEO-2026-04" },
    { "countryCode": "SWE", "indicatorId": "GGR_NGDP",    "date": "2025", "value": 49.1, "provider": "imf", "projection": false }
  ]
}
```

---

## 2. Week-ahead macro forecast (week-ahead)

**Event**: Next week's Riksdag calendar includes a FiU monetary-policy
hearing with Riksbanken.

**Query**:

```bash
tsx scripts/imf-fetch.ts weo --country SWE --indicator PCPIPCH --years 12 --persist
tsx scripts/imf-fetch.ts weo --country SWE --indicator LUR       --years 12 --persist
tsx scripts/imf-fetch.ts weo --country SWE --indicator NGDP_RPCH --years 12 --persist
```

**Commentary** (week-ahead, projections permitted):

> The IMF's April 2026 WEO pegs Sweden's 2026 CPI inflation at
> **2.1 %** and unemployment at **7.9 %** (`PCPIPCH`, `LUR`) — numbers
> the Riksbank governor is all but certain to be asked about in
> Wednesday's FiU hearing. Growth is projected at **1.9 %** for 2026
> rising to **2.3 %** in 2027 (`NGDP_RPCH`).

---

## 3. Monthly-review Nordic peer check (monthly-review)

**Event**: End-of-month roll-up comparing Swedish fiscal stance to
Nordic peers.

**Query**:

```bash
tsx scripts/imf-fetch.ts compare \
  --indicator GGXCNL_NGDP --countries SWE,DNK,NOR,FIN,DEU --persist
tsx scripts/imf-fetch.ts compare \
  --indicator GGXWDG_NGDP --countries SWE,DNK,NOR,FIN,DEU --persist
```

**Commentary**:

> On the WEO Apr-2026 vintage, Sweden's 2025 fiscal balance
> (**-0.8 %** of GDP, `GGXCNL_NGDP`) sits between Denmark (**+1.2 %**)
> and Finland (**-3.1 %**). Projections to 2028 show Sweden
> consolidating to a small surplus (**+0.4 %**), while Finland's
> projected trajectory remains in deficit.

---

## 4. Committee-reports placeholder for FöU (defence)

**Event**: FöU report on defence-procurement programme.

**Decision**: FöU's headline indicator (`MS.MIL.XPND.GD.ZS`) lives in
World Bank, **not IMF**. Use the legacy WB path; do not force an IMF
call. A mixed-source article is valid:

```json
{
  "source": {
    "worldBank": ["MS.MIL.XPND.GD.ZS", "MS.MIL.XPND.CD"],
    "scb": [],
    "imf": ["WEO:NGDP_RPCH"]
  }
}
```

---

## 5. Constitutional / KU article (no IMF usage)

WGI governance (`CC.EST`, `RL.EST`, `VA.EST`) is a World Bank
exclusive. Keep the existing WB path. `source.imf` stays empty.

---

## 6. Monetary-policy decision (FiU + Riksbank hearing, IFS monthly)

**Event**: Riksbanken signals a possible rate cut ahead of FiU's next monetary-policy hearing. A `propositions` article covers the context.

**Query**:

```bash
# Monthly CPI level — feed the inflation chart
tsx scripts/imf-fetch.ts sdmx \
  --path "/data/IMF.STA,CPI,4.0.0/M.SE.PCPI_IX?startPeriod=2022-01" \
  --indicator PCPI_IX --country SWE --persist
sleep 1

# Policy rate (Riksbankens styrränta)
tsx scripts/imf-fetch.ts sdmx \
  --path "/data/IMF.STA,IR,4.0.0/M.SE.FPOLM_PA?startPeriod=2022-01" \
  --indicator FPOLM_PA --country SWE --persist
sleep 1

# Annual projection overlay
tsx scripts/imf-fetch.ts weo --country SWE --indicator PCPIPCH --years 12 --persist
```

**Commentary**:

> The March 2026 HICP reading (`IFS:PCPI_IX`) lifted to 109.4, implying year-on-year inflation near **2.3 %** — within hailing distance of the Riksbank's 2 % target. The IMF's April 2026 WEO projects annual CPI inflation to settle at **2.0 %** for 2027 (`WEO Apr-2026, PCPIPCH`). The policy rate stood at **3.25 %** at month-end (`MFS_IR:FPOLM_PA`), giving the Riksbank **125 bps** of cumulative room below the 2023 peak.

---

## 7. Bilateral trade / sanctions impact (NU + UU, DOTS)

**Event**: UU debate on the effectiveness of EU sanctions against Russia triggers a `propositions` article.

**Query**:

```bash
# Swedish goods exports to Russia (monthly, post-invasion)
tsx scripts/imf-fetch.ts sdmx \
  --path "/data/IMF.STA,DOTS,4.0.0/M.SWE.RUS.TXG_FOB_USD?startPeriod=2021-01" \
  --indicator TXG_FOB_USD --country SWE --persist
sleep 1

# Compare to Nordic peers
tsx scripts/imf-fetch.ts sdmx \
  --path "/data/IMF.STA,DOTS,4.0.0/M.DNK.RUS.TXG_FOB_USD?startPeriod=2021-01" \
  --indicator TXG_FOB_USD --country DNK --persist
```

**Commentary**:

> Swedish goods exports to Russia collapsed **92 %** between Q4-2021 and Q4-2023 (`DOTS:TXG_FOB_USD`, monthly), from USD 320 m to USD 25 m. The Danish trajectory ran broadly parallel (-89 %), suggesting coordinated Nordic policy transmission rather than Sweden-specific legal posture.

---

## 8. Commodity shock pass-through (MJU + FiU, PCPS)

**Event**: Oil-price spike drives an MJU energy-policy motion and a FiU inflation-expectations commentary.

**Query**:

```bash
tsx scripts/imf-fetch.ts sdmx \
  --path "/data/IMF.RES,PCPS,4.0.0/M..POILAPSP?startPeriod=2021-01" \
  --indicator POILAPSP --country WORLD --persist
sleep 1

tsx scripts/imf-fetch.ts sdmx \
  --path "/data/IMF.STA,CPI,4.0.0/M.SE.PCPI_IX?startPeriod=2021-01" \
  --indicator PCPI_IX --country SWE --persist
```

**Commentary**:

> Brent crude averaged **USD 82/bbl** in March 2026 (`PCPS:POILAPSP`), up 11 % from January. Swedish headline CPI (`IFS:PCPI_IX`) moved from 108.1 to 109.4 across the same window — a commodity pass-through coefficient broadly consistent with the IMF's April 2026 WEO assumption of **PCPIPCH at 2.1 %** for 2026 (`WEO Apr-2026, PCPIPCH`).

---

## 9. Tier-C weekly review — full Nordic macro+fiscal snapshot

**Event**: End-of-week `weekly-review` article rolls up macro, fiscal, and external indicators for Sweden vs Nordic peers.

**Query** (all batched `compare` — ~6 calls total):

```bash
for IND in NGDP_RPCH PCPIPCH LUR GGXWDG_NGDP GGXCNL_NGDP BCA_NGDPD; do
  tsx scripts/imf-fetch.ts compare --indicator "$IND" \
    --countries SWE,DNK,NOR,FIN,DEU,EU,EURO --persist
  sleep 1
done
```

**Commentary** (excerpt):

> On the WEO Apr-2026 vintage, Sweden's 2025 fiscal balance (**-0.8 %** of GDP, `GGXCNL_NGDP`) sat between Denmark (**+1.2 %**) and Finland (**-3.1 %**). The Euro Area aggregate is -2.9 % (`WEO:EURO:GGXCNL_NGDP`). Projections to 2028 show Sweden consolidating to a small surplus (**+0.4 %**), while Finland's projected trajectory remains in deficit.

`source.imf` for this article lists 6 WEO codes across 7 geographies — 42 data points from 6 compare calls.

---

## 10. Committee-aligned COFOG spending (SoU + UbU + FöU)

**Event**: Budget-cycle `month-ahead` article previews committee-level spending patterns for the upcoming fiscal year.

**Query**:

```bash
# COFOG 02 — Defence (FöU)
tsx scripts/imf-fetch.ts sdmx \
  --path "/data/IMF.STA,GFS_COFOG,4.0.0/A.144.G.G02._Z._Z._Z._Z.XDC_R_B1GQ?startPeriod=2015" \
  --indicator G02 --country SWE --persist
sleep 1

# COFOG 07 — Health (SoU)
tsx scripts/imf-fetch.ts sdmx \
  --path "/data/IMF.STA,GFS_COFOG,4.0.0/A.144.G.G07._Z._Z._Z._Z.XDC_R_B1GQ?startPeriod=2015" \
  --indicator G07 --country SWE --persist
sleep 1

# COFOG 09 — Education (UbU)
tsx scripts/imf-fetch.ts sdmx \
  --path "/data/IMF.STA,GFS_COFOG,4.0.0/A.144.G.G09._Z._Z._Z._Z.XDC_R_B1GQ?startPeriod=2015" \
  --indicator G09 --country SWE --persist
```

**Commentary**:

> On the IMF GFS COFOG vintage for 2024 (T+1), Sweden's general-government spending by function allocated **1.6 %** of GDP to defence (function 02, `GFS_COFOG:G02`), **7.2 %** to health (function 07, `G07`), and **6.8 %** to education (function 09, `G09`). The defence ratio has climbed from 1.1 % in 2019 — consistent with the FöU-driven NATO-readiness ramp. Health tracks close to the OECD median; education retains Sweden's historical above-median position.

This article's `source.imf` field: `["GFS_COFOG:G02", "GFS_COFOG:G07", "GFS_COFOG:G09"]`.
