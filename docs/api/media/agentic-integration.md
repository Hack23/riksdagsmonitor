# IMF Agentic Integration Playbook

> **Purpose**: Step-by-step integration pattern for agentic workflows that produce Riksdagsmonitor articles. IMF is the **primary economic-data source**; World Bank and SCB fill governance / environment / social-residue and Swedish-specific gaps respectively.
>
> **Audience**: Agentic workflow authors (`.github/workflows/news-*.md`), agent personas (`.github/agents/*.md`), and skill files (`.github/skills/*/SKILL.md`).

---

## 1 · Provider decision matrix

Use this table to decide which provider owns which indicator class **before** writing a single MCP call or CLI invocation.

| Class | Primary provider | Secondary | Rationale |
|-------|------------------|-----------|-----------|
| Macro (GDP, growth) | **IMF WEO** | — | Freshness + T+5 projections |
| Inflation (annual) | **IMF WEO** | SCB (monthly) | Freshness + projections |
| Inflation (monthly) | **IMF IFS CPI** | SCB | High frequency |
| Unemployment (annual) | **IMF WEO** | SCB AKU | Freshness + projections; SCB for Swedish-specific |
| Fiscal — debt, revenue, expenditure, balance | **IMF WEO + FM** | — | GFSM 2014, projections |
| Fiscal — cyclically-adjusted, primary balance | **IMF FM** | — | Debt-sustainability methodology |
| External sector — current account, trade volumes | **IMF WEO** | — | Projections |
| Bilateral trade flows | **IMF DOTS** | — | Partner-country dimension |
| Monetary — policy rate, interbank | **IMF MFS_IR / IFS** | Riksbank | Standardised cross-country |
| Exchange rates | **IMF ER** | Riksbank | Historical depth |
| Commodity prices | **IMF PCPS** | — | Canonical price benchmarks |
| Government spending by function | **IMF GFS_COFOG** | — | Committee-aligned (02/07/09/10) |
| Population, demographics | **IMF WEO** | SCB | Projections |
| Governance (WGI: CC.EST, RL.EST, VA.EST, GE.EST, RQ.EST, PV.EST) | **World Bank** | — | IMF has no equivalent — `source=75` |
| Environment (CO2, renewables, forest) | **World Bank** | PCPS (prices) | IMF has no equivalent |
| Education (residue) | **World Bank** | GFS_COFOG 09 | WB for participation rates |
| Defence spending | **World Bank MS.MIL.*** | GFS_COFOG 02 | WB has deeper historical |
| Rule of law, crime | **World Bank** | — | IMF has no equivalent |
| Swedish-specific ground truth (monthly labour, regional, budget execution) | **SCB** | — | Primary source for national statistics |

---

## 2 · Seven-step integration contract

Every agentic news workflow MUST perform these steps in order at **Step 2.6** (`04-analysis-pipeline.md` phase).

### Step 1 — Identify the policy domain & committee

From the source documents (motions, propositions, betänkanden), extract the committee codes (FiU, SkU, AU, NU, UU, SoU, SfU, FöU, MJU, UbU, KU, JuU, KrU) and policy areas.

### Step 2 — Map committee → indicators via the inventory

```bash
# View the authoritative inventory (JSON is machine-readable; also human-reviewable)
cat analysis/imf/indicators-inventory.json | jq '.committeeMatrix.FiU'
# → { "provider": "IMF (primary)", "mustQuery": ["WEO:NGDP_RPCH", ...] }
```

Alternative programmatic lookup:
```typescript
import { findImfIndicatorsForCommittee } from './scripts/imf-context.js';
const ind = findImfIndicatorsForCommittee('FiU'); // returns IMF indicator set
```

### Step 3 — Pre-warm IMF endpoint (cold-start protection)

```bash
# One throwaway call to wake the upstream; ignore output.
tsx scripts/imf-fetch.ts weo --country SWE --indicator NGDP_RPCH --years 1 >/dev/null 2>&1 || true
sleep 1
```

> 🔴 **Pre-warm gate** — the throwaway call above is the *manual* cold-start
> probe. The full pre-warm gate is invoked automatically by the
> `.github/actions/news-prewarm` composite action (and therefore by every
> one of the 14 `.github/workflows/news-*.md` workflows) via
> `scripts/check-imf-connectivity.ts`:
>
> - **What it probes** — three IMF transports: WEO + FM via Datamapper,
>   IFS monthly CPI via SDMX 3.0.
> - **Authentication** — every SDMX 3.0 `/data/...` endpoint requires
>   the `Ocp-Apim-Subscription-Key` Azure APIM header (since ~2026-05).
>   Each news workflow forwards
>   `secrets.IMF_SDMX_SUBSCRIPTION_KEY` (primary, required) to the
>   composite action via `with: imf-sdmx-subscription-key:`. The action
>   then exports the key to `$GITHUB_ENV` so both the connectivity probe
>   AND the agent's `bash:` tool (which runs `awf --env-all`) inherit it.
>   `IMF_SDMX_SUBSCRIPTION_KEY_SECONDARY` is the rotation key — it is
>   **not consumed by code**, only stored in repository secrets so
>   operators can swap primary↔secondary without downtime when the IMF
>   issues new credentials. See "Key rotation" below.
>   The unauthenticated WEO + FM Datamapper transport is unaffected.
> - **Vintage discipline** — parses `ImfClient.weoVintage`
>   (`WEO-2026-04` at the time of writing) into a calendar age. Anything
>   older than `STALE_VINTAGE_MAX_MONTHS` (6) flips the report to
>   `status: "stale-vintage"` and emits an `ℹ️` annotation block per
>   `.github/aw/ECONOMIC_DATA_CONTRACT.md` v3.1 §"Vintage discipline".
> - **Outputs** — always writes `data/imf-context.json`
>   (`{status, vintage, vintageAgeMonths, stale, probes, checkedAt,
>   warningBlock}`); on connectivity failure additionally writes
>   `data/imf-unavailable.flag` containing the structured payload.
> - **Failure handling** — non-blocking by default (exit 0 + flag file
>   so the workflow continues). On connectivity failure every workflow
>   MUST inject the `⚠️ IMF context unavailable` block into
>   `executive-brief.md`, `comparative-international.md`, and
>   `synthesis-summary.md` — the exact wording is provided in
>   `report.warningBlock` so the agent can paste it verbatim. When only
>   the SDMX probe fails the report carries `status: "degraded"` (WEO/FM
>   still healthy) and a lighter `ℹ️ IMF auxiliary transport degraded`
>   annotation. A missing/invalid SDMX key surfaces as the deterministic
>   reason `sdmx-subscription-key-not-configured` instead of the raw
>   HTTP code so operators can distinguish "secret never set" from
>   "IMF outage" or "key revoked".
> - **Manual invocation** — `tsx scripts/check-imf-connectivity.ts
>   [--strict] [--output-dir data]`. `--strict` flips to fail-fast for
>   operator debugging.
>
> #### Key rotation (primary ↔ secondary)
>
> The IMF Data SDMX API subscription product issues two keys per
> subscription. We mirror this in repository secrets:
>
> 1. `IMF_SDMX_SUBSCRIPTION_KEY` — **primary**, **required**, consumed
>    by every workflow run via `secrets.IMF_SDMX_SUBSCRIPTION_KEY`.
> 2. `IMF_SDMX_SUBSCRIPTION_KEY_SECONDARY` — **secondary**, **optional**,
>    stored only so the next rotation can be performed without an outage:
>      a. Confirm the secondary key works (curl + `Ocp-Apim-Subscription-Key`).
>      b. Promote: copy `IMF_SDMX_SUBSCRIPTION_KEY_SECONDARY` over
>         `IMF_SDMX_SUBSCRIPTION_KEY` in repository / org secrets.
>      c. Re-issue a new key on the IMF portal and store it as the new
>         `IMF_SDMX_SUBSCRIPTION_KEY_SECONDARY`.
>      d. Revoke the old primary on the portal.
>
> No workflow or script reads `IMF_SDMX_SUBSCRIPTION_KEY_SECONDARY`
> directly — it exists purely as a hot spare. This matches the IMF Azure
> APIM "regenerate primary key" / "regenerate secondary key" semantics.
>
> #### Copilot coding-agent sessions
>
> Interactive Copilot coding-agent runners do **not** automatically
> inherit repository secrets — GitHub's secret store is write-only by
> design (no PAT, including the agent's own token, can read secret
> values via the REST API). The top-level workflow `env:` block in
> [`.github/workflows/copilot-setup-steps.yml`](../../.github/workflows/copilot-setup-steps.yml)
> is **only scoped to the setup-job's own steps** — it is NOT inherited
> by the agent's interactive `bash:` runtime.
>
> The mechanism that DOES propagate to the agent runtime is writing the
> secret to `$GITHUB_ENV` from within a setup step. The dedicated
> "Export IMF SDMX subscription keys to agent env" step in
> `copilot-setup-steps.yml` does exactly that:
>
> ```yaml
> - name: Export IMF SDMX subscription keys to agent env
>   env:
>     IMF_SDMX_SUBSCRIPTION_KEY: ${{ secrets.IMF_SDMX_SUBSCRIPTION_KEY }}
>     IMF_SDMX_SUBSCRIPTION_KEY_SECONDARY: ${{ secrets.IMF_SDMX_SUBSCRIPTION_KEY_SECONDARY }}
>   run: |
>     echo "IMF_SDMX_SUBSCRIPTION_KEY=${IMF_SDMX_SUBSCRIPTION_KEY}" >> "$GITHUB_ENV"
>     echo "::add-mask::${IMF_SDMX_SUBSCRIPTION_KEY}"
>     # …secondary key handled identically
> ```
>
> After this wiring, `tsx scripts/imf-fetch.ts sdmx ...` and
> `curl -H "Ocp-Apim-Subscription-Key: $IMF_SDMX_SUBSCRIPTION_KEY" ...`
> both succeed in the agent shell. Sessions that were launched *before*
> this wiring existed will not see the env var retroactively — only
> sessions started after the wiring change inherit it. WEO + FM via the
> unauthenticated `www.imf.org` Datamapper transport works in every
> session regardless of whether the SDMX key is wired.
>
> **Diagnostic:** the env var `COPILOT_AGENT_INJECTED_SECRET_NAMES` in
> the agent shell lists which secrets the Copilot runtime injected. If
> `IMF_SDMX_SUBSCRIPTION_KEY` is missing from that list AND missing from
> `$GITHUB_ENV`, the wiring above failed (most often because the repo
> secret itself is unset). Repository secrets must exist at
> `Settings → Secrets and variables → Actions` for `${{ secrets.* }}`
> resolution to succeed.

### Step 4 — Batched `compare` call for peer-set

Always prefer `compare` (single batched Datamapper call across countries) over parallel `weo` calls — one call vs five gets you 80 % off the rate-limit budget.

```bash
tsx scripts/imf-fetch.ts compare \
  --indicator GGXWDG_NGDP \
  --countries SWE,DNK,NOR,FIN,DEU \
  --persist
sleep 1

tsx scripts/imf-fetch.ts compare \
  --indicator NGDP_RPCH \
  --countries SWE,DNK,NOR,FIN,DEU \
  --persist
sleep 1
```

### Step 5 — Historical + projection time series (Sweden only)

```bash
# 15-year window captures both the 2009/2020 historical extremes and the T+5 projection.
tsx scripts/imf-fetch.ts weo --country SWE --indicator PCPIPCH  --years 15 --persist
sleep 1
tsx scripts/imf-fetch.ts weo --country SWE --indicator LUR      --years 15 --persist
sleep 1
```

### Step 6 — SDMX 3.0 for non-WEO coverage

For IFS monthly CPI, policy rates, GFS COFOG, DOTS bilateral trade, PCPS commodities:

```bash
tsx scripts/imf-fetch.ts sdmx \
  --path "/data/IMF.STA,CPI,5.0.0/SWE.CPI._T.IX.M?startPeriod=2024-01" \
  --indicator _T.IX --country SWE --persist
sleep 1
```

### Step 7 — Write `economic-data.json`

Assemble the collected `dataPoints[]` into the v2.0 schema (see `ECONOMIC_DATA_CONTRACT.md`). Every projection row MUST carry `projectionVintage`.

```json
{
  "version": "2.0",
  "articleType": "committee-reports",
  "date": "2026-04-24",
  "dataPoints": [
    { "countryCode": "SWE", "indicatorId": "GGXWDG_NGDP", "date": "2027", "value": 32.4, "provider": "imf", "projection": true, "projectionVintage": "WEO-2026-04" }
  ],
  "commentary": "IMF projects Sweden's general government gross debt at 32.4 % of GDP in 2027 (WEO Apr-2026, GGXWDG_NGDP)…",
  "source": { "imf": ["WEO:GGXWDG_NGDP"], "worldBank": [], "scb": [] }
}
```

---

## 3 · Rate-limit discipline

IMF advertises ~10 requests / 5 s. Exceed this and you get `HTTP 429`. Treat 429 as a test of discipline, not a normal state.

| Pattern | Effect |
|---------|--------|
| `compare --countries A,B,C,D,E` | **1 call**, 5 countries (batched at Datamapper) |
| 5 parallel `weo --country X` | **5 calls**, same data. Avoid. |
| `sleep 1` between CLI invocations | Keeps cumulative rate below limit |
| `--persist` + re-use within the same day | Zero calls for repeat indicators |
| Client retry on 429 | Built-in 3× with 1s→2s→4s back-off |

**Rule**: Per article, target ≤ 10 IMF calls total. Any workflow emitting > 15 IMF calls in a single run is mis-designed.

---

## 4 · Vintage discipline

### 4.1 Current vintage

```
WEO-2026-04   (published late April 2026, valid until WEO Oct-2026 ships)
FM-2026-04    (published late April 2026, aligned with WEO)
```

### 4.2 Cut-over checklist

When the IMF publishes a new flagship (April or October):

1. Update `DEFAULT_WEO_VINTAGE` in `scripts/imf-client.ts`.
2. Update `vintageDiscipline.current` in `analysis/imf/indicators-inventory.json`.
3. Update the banner in `analysis/imf/README.md`.
4. Add a row to the release calendar in `analysis/imf/data-dictionary.md` § Release calendar.
5. Ship all four changes in **one PR** titled `chore(imf): cut over to WEO-YYYY-MM vintage`.

### 4.3 Stale-vintage audit

A projection citation with a vintage tag older than **6 months** is flagged in `methodology-reflection.md` as a stale-vintage warning. Example:

> ⚠️ Stale vintage — commentary cites `(WEO Oct-2025, GGXWDG_NGDP)` but current vintage is WEO-2026-04. Re-fetch and re-cite.

---

## 5 · Parallel IMF + World Bank split rules

Some article types naturally need both providers. Follow these rules to avoid overlap.

| Article scenario | IMF role | WB role |
|------------------|----------|---------|
| FiU budget commentary | Macro + fiscal headline | — |
| SoU health-policy piece | COFOG 07, population | `SH.XPD.CHEX.GD.ZS`, `SH.MED.PHYS.ZS` |
| FöU defence | COFOG 02 (if monthly) | `MS.MIL.XPND.GD.ZS` (historical) |
| MJU climate-policy | PCPS oil benchmark | `EN.ATM.CO2E.PC`, `EG.FEC.RNEW.ZS`, `AG.LND.FRST.ZS` |
| KU constitutional | — | WGI (`CC.EST`, `RL.EST`, `VA.EST`, `GE.EST`) |
| JuU justice | — | `VC.IHR.PSRC.P5`, `CC.EST` |
| UbU education | COFOG 09 | `SE.XPD.TOTL.GD.ZS`, `SE.PRM.ENRR` |
| Weekly / monthly review | Full macro + fiscal + external | Governance overlay + environment |

**Forbidden combinations**:
- Do NOT cite `WB:NY.GDP.MKTP.KD.ZG` alongside `WEO:NGDP_RPCH` as if they were independent confirmations. They measure the same thing; the newer IMF value supersedes.
- Do NOT rely on WB for fiscal when IMF has an EDP-consistent answer.
- Do NOT use WB environment proxies for IMF-style fiscal work.

---

## 6 · Fallback strategies

### 6.1 IMF upstream down

If all three `data.imf.org`, `api.imf.org`, `www.imf.org` return 5xx after the client's 3× retry:

1. Log the failure to `analysis/data/imf/_outages/{date}.log`.
2. Fall back to cached `analysis/data/imf/{indicator}/{country}.json`.
3. Add a stale-cache flag `"sourceIsStale": true` to `economic-data.json`.
4. Add to `mcp-reliability-audit.md` with severity `HIGH`.
5. Do NOT silently fall back to WB — that defeats the audit.

### 6.2 Country code unknown

`scripts/imf-codes.ts → toImfAreaCode(iso3)` throws on unknown codes. This is intentional (fail-loud). If the article needs a country not in `ISO3_TO_IMF_AREA`:

1. Verify the SDMX code via `GET /structure/codelist/IMF,CL_AREA_{dataset},...`.
2. Add the mapping to `ISO3_TO_IMF_AREA` in `scripts/imf-codes.ts`.
3. Re-run the workflow.

### 6.3 Divergence with SCB

When IMF and SCB disagree on a Swedish figure (typical for unemployment, inflation) by more than the tolerance:

- Unemployment: > 0.3 pp difference
- Inflation: > 0.2 pp difference

…annotate BOTH values in commentary with the methodology difference:

> "The IMF WEO Apr-2026 vintage pegs 2025 CPI inflation at 2.1 % (`PCPIPCH`) versus SCB's 2.3 % (KPIF, December-on-December). The gap reflects WEO's harmonised HICP-leaning basket."

---

## 7 · Workflow-specific patterns

### 7.1 `news-committee-reports`

Dominant committee → run committeeMatrix lookup → `compare` across Nordic peers for the committee's `mustQuery` codes → `weo` time series for Sweden on 2 headline codes → write `economic-data.json` v2.0.

### 7.2 `news-propositions`

Same as committee-reports plus: if the proposition proposes tax changes, include `WEO:GGR_NGDP`; if spending changes, include `WEO:GGX_NGDP`; if debt refinancing, include `WEO:GGXWDG_NGDP`.

### 7.3 `news-motions`

Lower Chart.js minimum (1 canvas). Use `compare` for 1 headline indicator mapping to the dominant committee; skip time-series.

### 7.4 `news-week-ahead` / `news-month-ahead`

Projections allowed in commentary. Include **at least 2 projection-bearing indicators** (`WEO:NGDP_RPCH`, `WEO:GGXWDG_NGDP`, `WEO:PCPIPCH`). Every projection cited MUST include the vintage tag.

### 7.5 `news-weekly-review` / `news-monthly-review`

Full provider stack. IMF for macro/fiscal/monetary/external + WB for governance/environment overlay + SCB for monthly Swedish detail. Coalition-flow Sankey (D3) required — see `ECONOMIC_DATA_CONTRACT.md`.

### 7.6 `news-evening-analysis` / `news-realtime-monitor`

Minimum IMF footprint (1 call). `weo --country SWE --indicator NGDP_RPCH` or `PCPIPCH` depending on day's news pulse.

### 7.7 `news-translate`

Translation-only workflow — no original economic research. Translates commentary text verbatim; preserves numeric values and vintage tags untouched.

---

## 8 · Canonical CLI recipes

```bash
# Recipe A — Nordic fiscal snapshot (FiU, SkU articles)
tsx scripts/imf-fetch.ts compare --indicator GGXWDG_NGDP --countries SWE,DNK,NOR,FIN,DEU --persist
tsx scripts/imf-fetch.ts compare --indicator GGXCNL_NGDP --countries SWE,DNK,NOR,FIN,DEU --persist
tsx scripts/imf-fetch.ts compare --indicator GGR_NGDP     --countries SWE,DNK,NOR,FIN,DEU --persist

# Recipe B — Sweden macro time series (commentary + chart)
tsx scripts/imf-fetch.ts weo --country SWE --indicator NGDP_RPCH --years 15 --persist
tsx scripts/imf-fetch.ts weo --country SWE --indicator PCPIPCH    --years 15 --persist
tsx scripts/imf-fetch.ts weo --country SWE --indicator LUR        --years 15 --persist

# Recipe C — High-frequency inflation (monthly, CPI)
tsx scripts/imf-fetch.ts sdmx \
  --path "/data/IMF.STA,CPI,5.0.0/SWE.CPI._T.IX.M?startPeriod=2023-01" \
  --indicator _T.IX --country SWE --persist

# Recipe D — Trade partner analysis (NU / UU articles, IMTS)
tsx scripts/imf-fetch.ts sdmx \
  --path "/data/IMF.STA,IMTS,1.0.0/SWE.XG_FOB_USD.RUS.M?startPeriod=2022-01" \
  --indicator XG_FOB_USD --country SWE --persist

# Recipe E — Commodity pass-through (MJU, FiU inflation drivers)
tsx scripts/imf-fetch.ts sdmx \
  --path "/data/IMF.RES,PCPS,9.0.0/G001.POILBRE.USD.M?startPeriod=2022-01" \
  --indicator POILBRE --country WORLD --persist

# Recipe F — COFOG spending decomposition (SoU, UbU, FöU, SfU)
tsx scripts/imf-fetch.ts sdmx \
  --path "/data/IMF.STA,GFS_COFOG,11.0.0/SWE.S13.G2MF.GF07_T.POGDP_PT.A?startPeriod=2018" \
  --indicator GF07_T --country SWE --persist

# Recipe G — Discovery: list all built-in indicator codes (no network call)
tsx scripts/imf-fetch.ts list-indicators
```

---

## 9 · Integration checklist (per workflow)

- [ ] Workflow `network.allowed` includes `data.imf.org`, `api.imf.org`, `www.imf.org`.
- [ ] Step 2.6 is **IMF-first** — WEO / FM calls precede any WB economic call.
- [ ] Peer-set calls use `compare` not parallel `weo`.
- [ ] Every projection citation has `projectionVintage`.
- [ ] `source.imf[]` is non-empty for articles with economic context.
- [ ] `economic-data.json` validates against `analysis/schemas/economic-data.schema.json`.
- [ ] Footer attribution reads `Data by IMF / SCB` (or `IMF / World Bank / SCB` if WB-sourced governance / environment data is also cited).
- [ ] Cached raw responses written to `analysis/data/imf/{indicator}/{country}.json` via `--persist`.
- [ ] Article commentary cites 2–3 concrete numeric values with vintage tags.

---

## 10 · Anti-patterns (hard-stop)

| Anti-pattern | Fix |
|--------------|-----|
| Parallel `weo` calls for the Nordic peer set | Use `compare --countries SWE,DNK,NOR,FIN,DEU` |
| Projection citation without vintage tag | Add `(WEO Apr-2026, INDICATOR_CODE)` |
| Quoting WB `NY.GDP.MKTP.KD.ZG` as primary macro | Use `WEO:NGDP_RPCH` |
| Forecast phrasing ("Sweden is expected to…") without cited IMF value | Rewrite as "IMF projects Sweden's X at Y…" |
| Skipping Step 2.6 because "no economic angle" | Still run 1 `weo` call for context; write `skip: true` only for pure-process articles |
| Running IMF on `.github/copilot-mcp.json` as MCP | **Never**. IMF is CLI-via-`bash` only. No Python, no uvx. |
| Mixing WEO and FM values for the same code without disambiguation | Cite each with its vintage tag |

---

## 11 · See also

- `analysis/imf/README.md` — overview
- `analysis/imf/indicators-inventory.json` — machine-readable catalogue
- `analysis/imf/data-dictionary.md` — dataflow reference
- `analysis/imf/indicator-policy-mapping.md` — committee matrix
- `analysis/imf/use-cases.md` — canonical article examples
- `analysis/methodologies/imf-indicator-mapping.md` — authoritative methodology
- `.github/aw/ECONOMIC_DATA_CONTRACT.md` — validator contract
- `.github/prompts/02-mcp-access.md` — shared prompt MCP/CLI reference
- `.github/prompts/04-analysis-pipeline.md` — analysis phase integration
- `scripts/imf-client.ts`, `scripts/imf-fetch.ts`, `scripts/imf-codes.ts`, `scripts/imf-context.ts` — code surface
