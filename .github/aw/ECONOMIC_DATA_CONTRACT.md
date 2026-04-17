# Economic Data Contract — Agentic Workflows (v1.0)

> **Single source of truth** for live World Bank / SCB data, Chart.js
> visualisations, and AI commentary in every news article.
> Consumed by `scripts/validate-economic-context.ts` and referenced
> (by link) from every `news-*.md` agentic workflow.

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

**Shape**:

```jsonc
{
  "version": "1.0",
  "articleType": "committee-reports",
  "date": "2026-04-17",
  "policyDomains": ["fiscal policy", "labor market"],
  "dataPoints": [
    { "countryCode": "SWE", "countryName": "Sweden",  "indicatorId": "NY.GDP.MKTP.KD.ZG", "date": "2024", "value": 0.82 },
    { "countryCode": "DNK", "countryName": "Denmark", "indicatorId": "NY.GDP.MKTP.KD.ZG", "date": "2024", "value": 1.75 }
  ],
  "commentary": "Sweden's 0.82% 2024 GDP growth lags Denmark (1.75%) and Norway (1.1%), framing the committee's fiscal debate against a prolonged slowdown. Health expenditure at 11.2% of GDP (2022, top 3 Nordic) keeps SoU-2024/25:1 in focus.",
  "source": {
    "worldBank": ["NY.GDP.MKTP.KD.ZG", "FP.CPI.TOTL.ZG", "SL.UEM.TOTL.ZS"],
    "scb": ["TAB1291"]
  }
}
```

**Hard rules**:

- `dataPoints` MUST be non-empty unless `skip: true` (and the article
  type is on the allow-list).
- `commentary` MUST cite 2–3 concrete numeric values that appear in
  `dataPoints` (the validator enforces only a word count; the human
  review + multi-dim quality score enforces the citation).
- `source.worldBank` / `source.scb` MUST list the IDs actually queried.
- File MUST validate against
  `analysis/schemas/economic-data.schema.json`.

---

## MCP tool contract

Step 2.6 of every `news-*.md` workflow MUST perform these MCP calls
**before** writing `economic-data.json`:

### 1. Map documents → policy domains → indicators

```
view analysis/worldbank/indicators-inventory.json
```

Select every indicator that has a `mcpTool` field and whose
`committees`/`policyAreas` match the day's source documents. Prioritise
the committee-specific matrix in `SHARED_PROMPT_PATTERNS.md` §"World
Bank Indicator Reference".

### 2. Query World Bank (Sweden + Nordic peers)

Required calls, retried 3× on failure (see Risks):

```
# Sweden — full 10-year series for the primary domains
get-economic-data(countryCode="SE", indicator="GDP_GROWTH",       years=10)
get-economic-data(countryCode="SE", indicator="INFLATION",        years=10)
get-economic-data(countryCode="SE", indicator="UNEMPLOYMENT",     years=10)

# Nordic + Germany comparison — top 3 domain indicators, 5-year series
for country in [DK, NO, FI, DE]:
  get-economic-data(countryCode=country, indicator=<top-3>, years=5)

# Domain-specific extras (only when article touches the domain)
get-health-data(countryCode="SE",     indicator="HEALTH_EXPENDITURE", years=5)
get-education-data(countryCode="SE",  indicator="EDUCATION_EXPENDITURE", years=5)
get-social-data(countryCode="SE",     indicator="POPULATION",        years=10)
```

Committee → minimum indicator mapping (shortened — full matrix in the
inventory JSON):

| Committee | MUST query                                                      |
|-----------|-----------------------------------------------------------------|
| FiU       | GDP_GROWTH, INFLATION, GDP_PER_CAPITA, GOVERNMENT_DEBT          |
| AU        | UNEMPLOYMENT, LABOR_FORCE, YOUTH_UNEMPLOYMENT                   |
| SkU       | TAX_REVENUE, GDP_GROWTH                                         |
| SoU       | HEALTH_EXPENDITURE, PHYSICIANS, HOSPITAL_BEDS, LIFE_EXPECTANCY  |
| UbU       | EDUCATION_EXPENDITURE, LITERACY_RATE, SCHOOL_ENROLLMENT         |
| FöU       | MILITARY_EXPENDITURE, MILITARY_EXPENDITURE_GDP                  |
| MJU       | CO2_EMISSIONS, RENEWABLE_ENERGY, FOREST_AREA                    |
| JuU       | HOMICIDE_RATE, PRISON_POPULATION                                |
| CU        | HOUSING_EXPENDITURE, MORTGAGE_RATE                              |
| TU        | TRANSPORT_INFRASTRUCTURE_SPENDING                               |

### 3. Query SCB (Statistics Sweden)

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

### 4. (High-level reviews only) D3 coalition-flow dataset

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

Cache raw MCP responses under
`analysis/data/worldbank/$(date +%Y)/$indicator-$country.json` so
subsequent article types in the same daily run reuse data (rate-limit
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
6. Missing footer attribution "Data by World Bank / SCB".

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
