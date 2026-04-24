# Economic Data Contract — Agentic Workflows (v2.1)

> **Single source of truth** for live IMF / World Bank / SCB data, Chart.js
> visualisations, and AI commentary in every news article.
> Consumed by `scripts/validate-economic-context.ts` and referenced
> (by link) from every `news-*.md` agentic workflow.

> **Schema v2.1 (2026-04-24)** — IMF-first. World Bank economic codes are
> explicitly **deprecated** for new articles (kept as read-only reference for
> back-compat). Banned-phrasings list extended to catch WB-GDP regressions.
> Vintage-staleness rule added (6-month threshold). Footer attribution
> prefers `Data by IMF / SCB` when no WB non-economic data is cited.
>
> **Schema v2.0 (2026-04-20)** — additive. Added IMF (accessed via the
> repo's pure-TypeScript `scripts/imf-client.ts` + `scripts/imf-fetch.ts`
> CLI, no Python MCP) as a first-class primary source for macro, fiscal,
> monetary, and external-sector indicators. World Bank remains
> authoritative for governance (WGI), environment, and long-horizon
> social/education residue. SCB remains the Swedish primary source.
> v1 artefacts remain valid; the validator accepts both shapes during
> the 2026-04-20 → 2026-05-31 grace window.

---

## Why this contract exists

The April 17 2026 committee-reports article shipped a bullet-list
"Economic Context" placeholder because the rendering pipeline had no
supplied `dataPoints` and the bullet-only fallback was emitted. This
contract closes the gap so that:

1. Every `<section id="economic-dashboard">` renders **real** Chart.js
   canvases backed by live World Bank / SCB values.
2. Every article carries a 2–4 sentence **AI commentary** paragraph
   that cites concrete numbers.
3. A deterministic quality gate fails the PR if any of **data**,
   **chart**, or **commentary** is missing.

---

## Artefact: `economic-data.json`

Every agentic workflow MUST write:

```
analysis/daily/YYYY-MM-DD/{analysisSubfolder}/economic-data.json
```

where `{analysisSubfolder}` maps from the kebab article-type slug via
`scripts/analysis-references.ts` → `ARTICLE_TYPE_TO_ANALYSIS_SUBFOLDER`:

| Article type slug     | analysisSubfolder   |
|-----------------------|---------------------|
| `committee-reports`   | `committeeReports`  |
| `propositions`        | `propositions`      |
| `motions`             | `motions`           |
| `interpellations`     | `interpellations`   |
| `evening-analysis`    | `evening-analysis`  |
| `realtime-monitor`    | `realtime-monitor`  |
| `breaking`            | `breaking`          |
| `week-ahead`          | `week-ahead`        |
| `month-ahead`         | `month-ahead`       |
| `weekly-review`       | `weekly-review`     |
| `monthly-review`      | `monthly-review`    |
| `deep-inspection`     | `deep-inspection`   |

**Schema**: `analysis/schemas/economic-data.schema.json`.

**Shape** (v2.0 — additive over v1):

```jsonc
{
  "version": "2.0",
  "articleType": "committee-reports",
  "date": "2026-04-20",
  "policyDomains": ["fiscal policy", "labor market"],
  "dataPoints": [
    // IMF (WEO projections permitted for look-ahead article types)
    { "countryCode": "SWE", "countryName": "Sweden",  "indicatorId": "NGDP_RPCH",    "date": "2025", "value": 1.9,  "provider": "imf", "projection": false },
    { "countryCode": "SWE", "countryName": "Sweden",  "indicatorId": "GGXWDG_NGDP",  "date": "2027", "value": 32.4, "provider": "imf", "projection": true,  "projectionVintage": "WEO-2026-04" },
    // World Bank (governance / environment / social residue)
    { "countryCode": "SWE", "countryName": "Sweden",  "indicatorId": "CC.EST",       "date": "2023", "value": 2.1,  "provider": "worldBank", "projection": false },
    // SCB (Swedish primary source)
    { "countryCode": "SWE", "countryName": "Sweden",  "indicatorId": "TAB1291",      "date": "2025-02", "value": 405.2, "provider": "scb", "projection": false }
  ],
  "commentary": "IMF projects Sweden's general government gross debt at 32.4 % of GDP in 2027 (WEO Apr-2026, GGXWDG_NGDP), giving SkU-2025/26:12 fiscal headroom absent in 2022 (38 %). Control-of-corruption remains strong at 2.1 (WGI 2023).",
  "source": {
    "worldBank": ["CC.EST"],
    "scb": ["TAB1291"],
    "imf": ["WEO:NGDP_RPCH", "WEO:GGXWDG_NGDP"]
  }
}
```

**Hard rules**:

- `dataPoints` MUST be non-empty unless `skip: true` (and the article
  type is on the allow-list).
- `commentary` MUST cite 2–3 concrete numeric values that appear in
  `dataPoints` (the validator enforces only a word count; the human
  review + multi-dim quality score enforces the citation).
- At least one of `source.worldBank` / `source.scb` / `source.imf` MUST
  be non-empty (previously only `worldBank`/`scb` counted).
- When any `dataPoint.projection === true`, it MUST carry a
  `projectionVintage` tag (e.g. `"WEO-2026-04"`, `"FM-2026-04"`).
  Projection values MAY only be cited in article commentary for the
  **look-ahead allow-list**: `week-ahead`, `month-ahead`,
  `weekly-review`, `monthly-review`. Daily types (`committee-reports`,
  `propositions`, `motions`, `interpellations`, `evening-analysis`)
  MAY include projection values in `dataPoints` for context but MUST
  NOT quote them as definitive forward-looking claims in commentary.
- File MUST validate against
  `analysis/schemas/economic-data.schema.json`.

### v1 back-compat

A v1 artefact (no `source.imf[]`, no `provider`/`projection` on data
points) is still accepted. The loader fills defaults
(`provider: "worldBank"`, `projection: false`). New workflows SHOULD
emit v2.

---

## MCP tool contract

Step 2.6 of every `news-*.md` workflow MUST perform these MCP calls
**before** writing `economic-data.json`. The order of provider
preference is:

1. **IMF** — macro (GDP, inflation, unemployment), fiscal (debt, deficit,
   revenue, expenditure), monetary, external sector. WEO projections
   extend to T+5 and MUST be used for look-ahead article types.
2. **SCB** — Swedish-specific ground truth that IMF does not carry
   (household consumption patterns, regional data, high-frequency
   monthly tables).
3. **World Bank** — governance (WGI: CC.EST, RL.EST, VA.EST, GE.EST,
   RQ.EST, PV.EST), environment (CO2, forest area, renewables), and
   long-horizon social/education indicators IMF does not cover.

### 1. Map documents → policy domains → indicators

```
view analysis/economic-indicators-inventory.json
```

Each indicator entry carries a `provider` field (`imf` | `worldBank` |
`scb`), plus IMF-specific fields (`imfDatabase`, `imfIndicatorCode`,
`imfDimensionFilters`, `projectionHorizon`) when the primary provider
is IMF. Select every indicator whose `committees` / `policyAreas`
match the day's source documents. The legacy inventory at
`analysis/worldbank/indicators-inventory.json` is retained as an
append-only reference during the migration window.

### 2. Query IMF (Sweden + Nordic peers) — PRIMARY for macro/fiscal/monetary

Via the repository's pure-TypeScript client `scripts/imf-client.ts`,
exposed to agentic workflows through the thin `scripts/imf-fetch.ts`
CLI. No Python MCP / `uvx` runtime is involved; all IMF traffic goes
directly to `data.imf.org`, `api.imf.org`, and `www.imf.org` on the
firewall allowlist.

```bash
# 1. WEO time series for one country (default 10 years; --persist caches
#    the JSON under analysis/data/imf/{indicator}/{country}.json with
#    projectionVintage provenance).
tsx scripts/imf-fetch.ts weo \
  --country SWE --indicator NGDP_RPCH --years 15 --persist

# 2. Compare the latest WEO value across Sweden + Nordic peers in one call.
tsx scripts/imf-fetch.ts compare \
  --indicator GGXWDG_NGDP \
  --countries SWE,DNK,NOR,FIN,DEU --persist

# 3. SDMX 3.0 passthrough for IFS / BOP / FM / GFS / DOTS.
tsx scripts/imf-fetch.ts sdmx \
  --path "/data/IMF.STA,CPI,4.0.0/M.SE.PCPI_IX?startPeriod=2024-01" \
  --indicator PCPI_IX --country SWE --persist

# 4. Inspect the built-in WEO + FM indicator catalog (no network call).
tsx scripts/imf-fetch.ts list-indicators
```

**Rate-limit discipline** (IMF ~10 req / 5 s): prefer the `compare`
subcommand (one batched call across countries), insert a 1 s sleep
between separate `imf-fetch.ts` invocations, and rely on the client's
built-in 3× retry with exponential back-off (1 s → 2 s → 4 s) for 429 /
5xx. Pre-warm 1 request at workflow start.

### 3. Query World Bank (governance / env / social residue ONLY)

> ⚠️ **v2.1 deprecation** — World Bank is **no longer** a primary source for economic data. Do **not** call `get-economic-data` for `NY.GDP.*`, `FP.CPI.TOTL.ZG`, `SL.UEM.TOTL.ZS`, `GC.DOD.*`, `GC.XPN.*`, `GC.REV.*`, `BN.CAB.*`, `NE.EXP.*` in new articles. These are deprecated in favour of the IMF counterpart listed in `analysis/imf/indicators-inventory.json → deprecationPolicy`. The validator currently accepts WB economic codes during the grace window (2026-04-20 → 2026-05-31); after the grace window, `source.worldBank[]` containing any of these codes will be flagged as a stale citation.

```
# Governance / WGI (source=75)
get-economic-data(countryCode="SE", indicator="CC.EST", years=5)        # Control of Corruption
get-economic-data(countryCode="SE", indicator="RL.EST", years=5)        # Rule of Law
get-economic-data(countryCode="SE", indicator="VA.EST", years=5)        # Voice & Accountability

# Environment
get-economic-data(countryCode="SE", indicator="EN.ATM.CO2E.PC", years=10)  # CO2 emissions per capita
get-economic-data(countryCode="SE", indicator="EG.FEC.RNEW.ZS", years=10)  # Renewables share
get-economic-data(countryCode="SE", indicator="AG.LND.FRST.ZS", years=10)  # Forest cover

# Defence historicals (use instead of COFOG 02 when 5+ year trend needed)
get-economic-data(countryCode="SE", indicator="MS.MIL.XPND.GD.ZS", years=15)

# Education participation
get-education-data(countryCode="SE", indicator="SCHOOL_ENROLLMENT", years=10)

# Social / demographic context (WB preferred for long-horizon > 15 years)
get-social-data(countryCode="SE",   indicator="POPULATION",  years=10)
```

### 4. Query SCB (Statistics Sweden)

```
# CRITICAL: language MUST be "sv" or "en". NEVER "no" — SCB returns
# HTTP 400 "Unsupported language" for "no".
search_tables(query="<committee-topic>", language="en")

# Then fetch specific tables from the committee→TAB mapping
# (scripts/scb-context.ts):
#   FiU → TAB1291   AU → TAB5765   JuU → TAB1172
#   MJU → TAB5404   SoU → health tables   UbU → education tables
query_table(table_id="<TAB>", value_codes={"Tid": "top(10)", ...})
```

### Committee → primary provider & indicator matrix (v2)

| Committee | Primary provider(s) | MUST query (provider:code)                                                                    |
|-----------|---------------------|-----------------------------------------------------------------------------------------------|
| FiU       | IMF + WB            | `imf:WEO:NGDP_RPCH`, `imf:WEO:PCPIPCH`, `imf:WEO:NGDPDPC`, `imf:WEO:GGXWDG_NGDP`              |
| SkU       | IMF + WB            | `imf:WEO:GGR_NGDP`, `imf:WEO:GGX_NGDP`, `imf:WEO:GGXCNL_NGDP`, `imf:FM:GGXONLB_NGDP`          |
| AU        | IMF + WB            | `imf:WEO:LUR`, `wb:SL.UEM.1524.ZS`, `wb:SL.TLF.CACT.ZS`                                       |
| NU / UU   | IMF                 | `imf:WEO:BCA_NGDPD`, `imf:WEO:TX_RPCH`                                                        |
| SoU       | WB                  | `wb:SH.XPD.CHEX.GD.ZS`, `wb:SH.MED.PHYS.ZS`, `wb:SH.MED.BEDS.ZS`, `wb:SP.DYN.LE00.IN`         |
| UbU       | WB                  | `wb:SE.XPD.TOTL.GD.ZS`, `wb:SE.ADT.LITR.ZS`, `wb:SE.PRM.ENRR`                                 |
| FöU       | WB                  | `wb:MS.MIL.XPND.GD.ZS`, `wb:MS.MIL.XPND.CD`                                                   |
| MJU       | WB                  | `wb:EN.ATM.CO2E.PC`, `wb:EG.FEC.RNEW.ZS`, `wb:AG.LND.FRST.ZS`                                 |
| KU        | WB                  | `wb:CC.EST`, `wb:RL.EST`, `wb:VA.EST` (WGI, source=75)                                        |
| JuU       | WB                  | `wb:VC.IHR.PSRC.P5`, `wb:CC.EST`                                                              |

### 5. (High-level reviews only) D3 coalition-flow dataset

Article types: `week-ahead`, `month-ahead`, `weekly-review`,
`monthly-review`. In addition to `economic-data.json`, produce a
`coalition-flow.json` with `nodes[]`/`flows[]` consumed by
`generateSankeySection`. Minimum 2 non-trivial flows.

---

## Coverage matrix (enforced by the validator)

`scripts/validate-economic-context.ts` reads this matrix. Changes here
must be mirrored in the validator's `COVERAGE_MATRIX`.

| Article type       | Min Chart.js canvases | Min commentary words | D3 required | May skip |
|--------------------|-----------------------|----------------------|-------------|----------|
| committee-reports  | 2                     | 60                   | No          | No       |
| propositions       | 2                     | 60                   | No          | No       |
| motions            | 1                     | 40                   | No          | No       |
| interpellations    | 1                     | 40                   | No          | No       |
| evening-analysis   | 1                     | 40                   | No          | No       |
| realtime-monitor   | 1                     | 30                   | No          | Yes      |
| breaking           | 1                     | 30                   | No          | Yes      |
| week-ahead         | 2                     | 80                   | Optional    | No       |
| month-ahead        | 3                     | 100                  | Recommended | No       |
| weekly-review      | 3                     | 150                  | Required    | No       |
| monthly-review     | 4                     | 200                  | Required    | No       |
| deep-inspection    | 1                     | 40                   | No          | Yes      |
| article-generator  | 1                     | 40                   | No          | Yes      |

"May skip" = `economic-data.json` may be written with `skip: true` and
`skipReason` when the article is a pure-process piece (e.g. "Riksdag
voting schedule changed"). The validator enforces the allow-list;
workflows MUST NOT use skip as a shortcut to avoid fetching data.

---

## Client-side rendering — what the agent does NOT need to write

The article template (`scripts/article-template/template.ts`) now
**auto-injects** the Chart.js runtime and a generic initializer
whenever the assembled article HTML contains at least one
`data-chart-config=` canvas:

- `<script src="../js/lib/chart.umd.4.4.1.js"></script>` — Chart.js 4
- `<script src="../js/lib/chartjs-plugin-annotation.3.0.1.min.js">` — injected when any config uses `"annotations"` / `"annotation"`
- `<script src="../js/chart-init.js"></script>` — scans `[data-chart-config]` canvases on DOMContentLoaded and calls `new Chart(ctx, cfg)` for each
- `<script src="../js/lib/d3.7.9.0.min.js"></script>` — injected when any section uses `data-d3-sankey=`

Consequences for the AI agent writing article prose:

- **DO** append dashboard sections via `generateEconomicDashboardSection()` / `generateDashboardSection()` — the emitted `<canvas data-chart-config="…">` nodes are enough; scripts are added automatically.
- **DO NOT** hand-roll inline `<script src="/js/lib/chart.umd.*.js">` followed by `<script>new Chart(…)</script>` — the bespoke pattern still works but duplicates the runtime and can double-render the same canvas.
- **DO NOT** reference `chart-init.js` manually; template.ts will include it when (and only when) a canvas requires it.

All five vendor libraries (`chart.umd.4.4.1.js`, the annotation plugin,
`d3.7.9.0.min.js`, `papaparse.5.5.3.min.js`,
`chartjs-adapter-date-fns.3.0.0.bundle.min.js`) ship from
`js/lib/` → `dist/js/lib/` → S3 via `.github/workflows/deploy-s3.yml`
step "Copy JS libraries to build output" — no deployment change is
required per article.

---

## Writing `economic-data.json` — workflow Step 2.6

```bash
# In every news-*.md, immediately after Step 2.5 pre-article analysis:
ANALYSIS_DIR="analysis/daily/$ARTICLE_DATE/$ANALYSIS_SUBFOLDER"
mkdir -p "$ANALYSIS_DIR"

# Agent runs the MCP calls above, accumulates dataPoints, drafts
# commentary (Step 3d), and writes:
cat > "$ANALYSIS_DIR/economic-data.json" <<EOF
{
  "version": "1.0",
  "articleType": "committee-reports",
  "date": "$ARTICLE_DATE",
  "policyDomains": [...],
  "dataPoints": [...],
  "commentary": "...",
  "source": { "worldBank": [...], "scb": [...] }
}
EOF
```

Cache raw MCP responses alongside the legacy WB path:
- IMF:        `analysis/data/imf/$(date +%Y)/$indicator-$country.json`
- World Bank: `analysis/data/worldbank/$(date +%Y)/$indicator-$country.json`
- SCB:        `analysis/data/scb/$(date +%Y)/$table.json`

Reuse across article types in the same daily run (rate-limit
mitigation).

---

## Writing the AI commentary — workflow Step 3d

After writing `economic-data.json`, re-open it and replace `commentary`
with a 2–4 sentence paragraph that:

- cites 2–3 concrete numeric values from `dataPoints`,
- ties the numbers to the day's political developments,
- is written in plain English (translated to other languages by the
  existing translation post-process — never hand-write translations).

Banned phrasings (all detected by `multi-dim quality score`):

- "The political landscape remains fluid…"
- "Touches on X policy…"
- "Analysis of N documents…"
- Pure definitions of indicators (e.g. "GDP is the total output of…").
- Un-sourced forecasts — phrases like "Sweden will…" / "The economy is
  expected to…" / "growth is forecast to…" / "analysts expect…" without a
  cited IMF WEO or Fiscal Monitor value from `dataPoints` where
  `projection: true`. Use the explicit form "IMF projects Sweden's
  debt/GDP at 32.4 % in 2027 (WEO Apr-2026, GGXWDG_NGDP)" instead.
- **v2.1 — World Bank economic regressions** — any of the following as a
  primary economic citation in new articles:
  "World Bank GDP", "WB GDP growth", "World Bank inflation",
  "World Bank unemployment", "NY.GDP.MKTP.KD.ZG for Sweden" (as primary),
  "FP.CPI.TOTL.ZG" (as primary), "SL.UEM.TOTL.ZS" (as primary),
  "GC.DOD.TOTL.GD.ZS" (as primary). These codes MUST be replaced by
  the IMF counterpart — see
  [`analysis/imf/indicators-inventory.json → deprecationPolicy`](../../analysis/imf/indicators-inventory.json).
  Non-economic WB codes (WGI, `EN.*`, `EG.*`, `AG.LND.FRST.ZS`,
  `MS.MIL.*`, `VC.IHR.PSRC.P5`, `SE.*`, `SH.*`, `SP.*`) remain
  authoritative and are NOT banned.

### Projections — allowed usage

From schema v2 onwards, `dataPoint.projection === true` values may be
cited in commentary **only** for these article types:

- `week-ahead`, `month-ahead` — explicit forward-looking narrative
- `weekly-review`, `monthly-review` — retrospective + 6-12 month outlook

Any projection citation MUST include the `projectionVintage` tag
(e.g. `(WEO-2026-04)`) to make stale vintages visible to the audit.

### Vintage staleness rule (v2.1)

A projection citation whose `projectionVintage` is **more than 6 months
older** than the article's publication date is flagged as a stale
vintage in `methodology-reflection.md` with a `[STALE-VINTAGE]` tag:

- Article date 2026-04-24 · vintage `WEO-2026-04` → OK (same cycle).
- Article date 2026-04-24 · vintage `WEO-2025-10` → OK (< 6 months).
- Article date 2026-04-24 · vintage `WEO-2025-04` → **[STALE-VINTAGE]** — re-fetch.

On each IMF flagship release (April / October), update `DEFAULT_WEO_VINTAGE`
in `scripts/imf-client.ts`, `vintageDiscipline.current` in
`analysis/imf/indicators-inventory.json`, and the banner in
`analysis/imf/README.md` in the same PR.

---

## Quality gate (Phase 3)

`scripts/validate-economic-context.ts` is invoked from
`scripts/validate-news-generation.sh` (Check 21) and runs
non-interactively in CI. It fails **non-zero** when any article
commits violations:

1. `class="economic-dashboard-placeholder"` in HTML.
2. Fewer than `minCharts` `data-chart-config=` canvases.
3. Missing / empty / malformed `economic-data.json`.
4. `dataPoints` empty (without a valid `skip: true`).
5. Commentary below `minCommentaryWords`.
6. Missing footer attribution "Data by IMF / World Bank / SCB"
   (historical variants "Data by World Bank / SCB" still accepted
   during the v1→v2 grace window).

### Contract effective date

The validator only enforces the contract on articles published **on or
after `CONTRACT_EFFECTIVE_DATE`** (`2026-04-18`, the first full day the
v1.0 contract + loader + validator were authoritative). Articles dated
earlier are skipped — they legitimately predate the schema and cannot
be retroactively populated with real World Bank / SCB data without
re-running MCP queries against a historical snapshot.

The cut-off also prevents the daily audit
(`.github/workflows/economic-context-audit.yml`) from re-surfacing the
same pre-contract articles every day for the 7-day lookback window
after a rollout. To bump the cut-off, update
`CONTRACT_EFFECTIVE_DATE` in `scripts/validate-economic-context.ts` and
mirror the change in the version history below.

---

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| MCP cold-start latency on Render.com | 6× pre-warm in `mcp-setup.sh` + 3× retry inside Step 2.6 |
| World Bank rate-limiting | Cache raw responses under `analysis/data/worldbank/$year/` for re-use across article types in the same day |
| SCB `no`-language 400 | `language` param MUST be `"sv"` or `"en"`. Workflows lint against `language: "no"` calls. |
| Placeholder silently shipping | `generateEconomicDashboardSection({ dataPoints: [] })` now returns `null`; validator enforces on HTML and JSON sides. |

---

## Version history

- **1.0 (2026-04-17)** — Initial contract following the April 17
  committee-reports placeholder incident.
- **1.0.1 (2026-04-18)** — Added `CONTRACT_EFFECTIVE_DATE = 2026-04-18`
  exemption to the validator so the daily audit stops re-reporting
  pre-contract articles for 7 days after every rollout. No change to
  the schema or enforcement for new articles.
- **2.0 (2026-04-20)** — Add IMF as a first-class primary source via
  the repository's pure-TypeScript `scripts/imf-client.ts` +
  `scripts/imf-fetch.ts` CLI (Datamapper JSON for WEO, SDMX 3.0
  passthrough for IFS / BOP / FM / GFS / DOTS). **No Python MCP /
  `uvx`** — IMF access is under the same npm / SBOM governance as
  `world-bank-client.ts` and `scb-client.ts`. Additive schema changes:
  - `source.imf: string[]` (optional in v1, recommended in v2)
  - `dataPoints[].provider` (`imf` | `worldBank` | `scb`)
  - `dataPoints[].projection` (boolean)
  - `dataPoints[].projectionVintage` (string; required when
    `projection: true`)
  Validator now accepts IMF in the footer attribution and treats any
  non-empty `source.{imf,worldBank,scb}` as satisfying citation.
  Projections are allowed in commentary for look-ahead article types
  (`week-ahead`, `month-ahead`, `weekly-review`, `monthly-review`)
  only, and MUST carry the `projectionVintage` tag. Un-sourced
  forecast phrasing added to the banned list. World Bank remains
  authoritative for WGI governance, environment, and long-horizon
  social/education residue; SCB unchanged. v1 artefacts remain valid
  through the 2026-04-20 → 2026-05-31 grace window.
- **2.1 (2026-04-24)** — IMF promoted to PRIMARY across **all** economic
  domains; World Bank economic codes explicitly **deprecated** for new
  articles. Extensions:
  - Banned-phrasings list expanded to catch WB economic regressions
    ("World Bank GDP", "WB GDP growth", "NY.GDP.MKTP.KD.ZG" as primary,
    "FP.CPI.TOTL.ZG" as primary, "SL.UEM.TOTL.ZS" as primary,
    "GC.DOD.TOTL.GD.ZS" as primary, "growth is forecast to…",
    "analysts expect…" without citation).
  - **Vintage-staleness rule** — projection citations whose vintage is
    > 6 months older than the article date are flagged `[STALE-VINTAGE]`.
  - Step 3 renamed to "Query World Bank (governance / env / social
    residue ONLY)" with explicit deprecation box.
  - Full catalogue moved to [`analysis/imf/indicators-inventory.json`](../../analysis/imf/indicators-inventory.json)
    (24 indicators × 10 dataflows × 10 domains, `deprecationPolicy`
    with per-code `supersedes` mapping, `committeeMatrix` for
    FiU/SkU/AU/NU/UU/SoU/SfU/FöU/MJU/UbU/KU/JuU/KrU/TU/CU).
  - Companion docs: [`analysis/imf/README.md`](../../analysis/imf/README.md) ·
    [`analysis/imf/data-dictionary.md`](../../analysis/imf/data-dictionary.md) (dataflow reference) ·
    [`analysis/imf/agentic-integration.md`](../../analysis/imf/agentic-integration.md) (7-step playbook) ·
    [`analysis/imf/indicator-policy-mapping.md`](../../analysis/imf/indicator-policy-mapping.md) (committee matrix).
  - Footer attribution prefers `Data by IMF / SCB` for IMF-primary
    articles (add `/ World Bank` only when non-economic WB data is
    cited). The `World Bank / SCB` legacy form remains accepted during
    grace window.
