# IMF Integration — Use Cases

> Canonical examples of how IMF data enriches Riksdagsmonitor articles.
> Each case shows (1) the political event, (2) the IMF query, (3) the
> commentary snippet, and (4) the `economic-data.json` excerpt.

---

## 1. SkU tax-reform proposition (FiU + SkU)

**Event**: Regeringen submits SoU-2025/26:12 proposing corporate-tax
changes. FiU must weigh fiscal space.

**Query** (via `imf-data-mcp`):

```
imf_fetch_data(
  database_id="WEO",
  parameters={
    "COUNTRY": "SE,DK,NO,FI,DE",
    "INDICATOR": "GGXWDG_NGDP,GGR_NGDP,NGDP_RPCH",
    "FREQ": "A"
  },
  start_period="2020", end_period="2031"
)
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

```
imf_fetch_data(database_id="WEO",
               parameters={"COUNTRY":"SE","INDICATOR":"PCPIPCH,LUR,NGDP_RPCH","FREQ":"A"},
               start_period="2020", end_period="2031")
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

```
imf_fetch_data(database_id="WEO",
               parameters={"COUNTRY":"SE,DK,NO,FI,DE",
                           "INDICATOR":"GGXCNL_NGDP,GGXWDG_NGDP",
                           "FREQ":"A"},
               start_period="2023", end_period="2028")
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
