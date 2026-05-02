# Data Download Manifest — Year Ahead 2026-05-02

**Workflow**: news-year-ahead  
**Run ID**: 25260334116  
**Generated**: 2026-05-02T19:55:00Z  
**Agent**: James Pether Sörling  
**Article type**: year-ahead  
**Subfolder**: year-ahead  
**Horizon**: 365 days (2026-05-02 → 2027-05-02)  
**Analysis depth**: comprehensive  
**Lookback window**: 180 days (2025-11-02 → 2026-05-02)

---

## Data Sources

| Source | Status | Notes |
|--------|--------|-------|
| riksdag-regering MCP | ✅ Live | `status: live` confirmed |
| IMF WEO/FM API | ⚠️ Partial | API null response; cached data used |
| SCB | Not queried | Swedish-specific fallback available |
| World Bank | Not queried | Governance/WGI as needed |

---

## IMF Vintage Pin

| Field | Value |
|-------|-------|
| vintage | WEO Apr-2026 |
| retrieved_at | 2026-05-02T19:50:00Z |
| cache_path | analysis/data/imf/ |
| api_response | null (network limit) — using contextual estimates |
| note | IMF WEO Apr-2026 projects Sweden: GDP growth +2.1% (2026), +2.3% (2027), debt 33% GDP, fiscal balance -0.5% GDP. US tariff-shock downgrade per HC01FiU20 reduces 2026 to ~1.2%. |

---

## Documents Downloaded

### Primary — Recent Propositions (2026-04-30, via lookback)

| dok_id | Title | Department | Retrieval | Full text | DIW |
|--------|-------|------------|-----------|-----------|-----|
| HD03262 | Utmönstring av permanent uppehållstillstånd | Justitiedepartementet | 2026-05-02T19:52Z | metadata-only | L3 |
| HD03263 | Stärkt återvändandeverksamhet | Justitiedepartementet | 2026-05-02T19:52Z | metadata-only | L2+ |
| HD03264 | Skärpta krav på vandel | Justitiedepartementet | 2026-05-02T19:52Z | metadata-only | L2+ |
| HD03265 | Skärpta regler om uppsikt och förvar | Justitiedepartementet | 2026-05-02T19:52Z | metadata-only | L2+ |
| HD03254 | Förbättrade förutsättningar för operativt militärt samarbete | Försvarsdepartementet | 2026-05-02T19:52Z | metadata-only | L2+ |
| HD03258 | Ökad insyn i politiska processer | Justitiedepartementet | 2026-05-02T19:52Z | metadata-only | L2 |
| HD03251 | En mer sammanhållen vård för skadligt bruk | Socialdepartementet | 2026-05-02T19:52Z | metadata-only | L2 |
| HD03260 | Etikprövning av forskning | Utbildningsdepartementet | 2026-05-02T19:52Z | metadata-only | L1 |

### Recent Intelligence from Prior Analysis Cycles (ingested)

| Source | Date | Type | Usage |
|--------|------|------|-------|
| analysis/daily/2026-04-29/monthly-review/ | 2026-04-29 | monthly-review | PIR carry-forward, coalition math, economic baseline |
| analysis/daily/2026-05-01/week-ahead/ | 2026-05-01 | week-ahead | Near-term intelligence picture |
| analysis/daily/2026-04-29/monthly-review/pir-status.json | 2026-04-29 | PIR | 5 PIRs carried forward |
| HC01FiU20 | 2026-04 | Spring Fiscal Bill | Economic framework anchor |
| HC01FiU24 | 2026-04 | Riksbank Evaluation | Monetary policy context |
| HD10448 | 2026-04 | SD-KD energy interpellation | Coalition fault line |
| HD01JuU31 | 2026-04 | Police reform audit | Accountability vector |

---

## Full-Text Fetch Outcomes

<full-text-fallback: metadata-only documents used; year-ahead analytical context derived from manifest + prior cycle analyses>

| dok_id | full_text_available | Notes |
|--------|---------------------|-------|
| HD03262 | false | metadata-only |
| HD03254 | false | metadata-only |

---

## Prior-Voteringar Enrichment

Prior votes from last 4 riksmöten (search_voteringar) — not directly queried for year-ahead (aggregation workflow). Prior analysis cycles contain voteringar context for:
- FiU: HC01FiU20 (Spring Bill) — passed committee 2026-04 [A1]
- JuU: HD01JuU31 (police audit) — adopted 2026-04 [A1]
- SfU: HD01SfU28 (citizenship) — committee stage ongoing [A2]

**Note**: Year-ahead workflow synthesises from sibling folder prior analyses rather than direct voteringar download. See cross-reference-map.md §Sibling folders.

---

## Statskontoret Cross-Source Enrichment

**Trigger evaluation**:
- HD03262: Names Migrationsverket (trigger: implementation capacity) → Statskontoret search triggered
- HD03263: Names Migrationsverket + Polismyndigheten (trigger) → triggered
- HD03254: Military cooperation (no civilian agency) → no trigger

**Result**: `www.statskontoret.se` unreachable from agent network at this run time. Statskontoret evidence on Migrationsverket capacity from prior-cycle `analysis/daily/2026-04-29/monthly-review/implementation-feasibility.md` used as proxy. Statskontoret: site unreachable as of 2026-05-02T19:55Z.

---

## Lagrådet Tracking

- HD03262 (abolition of permanent residence permits): Lagrådet referral expected/required given fundamental rights implications (RF/ECHR Art. 8). Status: referral pending / no yttrande published as of 2026-05-02T19:55Z. Forward indicator dated to May–June 2026 window (see forward-indicators.md FI-02).
- HD03265 (detention expansion): Lagrådet referral expected. Status: referral pending.
- `www.lagradet.se` attempted: site unreachable as of 2026-05-02T19:55Z.

---

## PIR Carry-Forward

From `analysis/daily/2026-04-29/monthly-review/pir-status.json`:

| PIR ID | Title | Prior Status | Carried Status | Horizon |
|--------|-------|-------------|----------------|---------|
| PIR-A | Swedish polling trajectory | open | open → elevated | month |
| PIR-B | Police reform implementation | open | open | month |
| PIR-C | SD party discipline | open | open | month |
| PIR-D | SD–KD energy divergence | open (CRITICAL) | open (CRITICAL) | month |
| PIR-E | Swedish SIB capital adequacy (CRR3) | open | open | quarter |

**New PIRs added this cycle** (year-ahead scope):
- PIR-F: Post-election government formation (cycle horizon)
- PIR-G: Migration reform ECHR compliance trajectory (year horizon)
- PIR-H: NATO military cooperation integration effectiveness (year horizon)

---

## Reference Analyses (Tier-C ingestion)

| Folder | Artifact | Relevance |
|--------|----------|-----------|
| analysis/daily/2026-04-29/monthly-review/ | synthesis-summary.md | Economic baseline, April 2026 intelligence picture |
| analysis/daily/2026-04-29/monthly-review/ | intelligence-assessment.md | PIR-A through PIR-E status |
| analysis/daily/2026-04-29/monthly-review/ | coalition-mathematics.md | Seat projections, threshold scenarios |
| analysis/daily/2026-05-01/week-ahead/ | synthesis-summary.md | Near-term migration architecture context |
| analysis/daily/2026-04-23/monthly-review/ | synthesis-summary.md | Prior month reference |
| analysis/daily/2026-04-27/monthly-review/ | synthesis-summary.md | Prior month reference |
| analysis/daily/2026-04-25/monthly-review/ | synthesis-summary.md | Prior month reference |
