# Data Download Manifest — 2026-04-19 (Month-Ahead)

**Generated**: 2026-04-19 11:20 UTC · **Pipeline mode**: aggregation (live MCP + upstream synthesis)
**Produced By**: `news-month-ahead` agentic workflow, consolidated by News Journalist agent

## Ingestion mode

This month-ahead package is an **aggregation product**: it does not re-download raw documents via the
`download-parliamentary-data` script (which still reports `0 / 0` in the header block below because the
data-download helper was not invoked for this run). Instead, evidence was gathered through two live channels
performed by the AI agent while authoring the 14 artefacts:

1. **Live `riksdag-regering-mcp` queries** against `search_dokument`, `get_dokument`, `search_anforanden`,
   `get_calendar_events`, and `get_voting_group` for the 2026-04-09 → 2026-04-19 submission window.
2. **Upstream knowledge-base ingestion** per `SHARED_PROMPT_PATTERNS.md` §"RECENT DAILY KNOWLEDGE-BASE SYNTHESIS"
   (14-day lookback for `month-ahead`) — 7 sibling daily runs re-read end-to-end and reconciled in
   [`methodology-reflection.md`](methodology-reflection.md).

See [`methodology-reflection.md`](methodology-reflection.md) §"Upstream Watchpoint Reconciliation" for the
audit of **16 forward indicators carried forward from 2026-04-14 → 2026-04-18 (0 silent drops)**.

## Live MCP evidence base (cited across the 14 artefacts)

| Category | Unique `dok_id`s cited | Examples |
|----------|------------------------|----------|
| **Government propositions** | 24 | HD03100, HD0399, HD03236, HD03220, HD03229, HD03231, HD03232, HD03235, HD03237, HD03239, HD03240, HD03242, HD03244, HD03245, HD03246, HD03238, HD03241, HD03101, HD0398 |
| **Opposition motions** | 15 | HD024079, HD024082, HD024087, HD024088, HD024089, HD024091, HD024092, HD024097, HD024098 |
| **Committee reports / vilande grundlag** | 9 | HD01UFöU3, HD01KU32, HD01KU33, HD01SfU20, HD01SfU22, HD01SkU23, HD01CU27, HD01CU28, HD01TU21 |
| **Parliamentary questions / interpellations** | 13 | HD10420, HD10430, HD10438, HD10427, HD10429, HD10431–HD10434 |
| **JuU15 145–142 chamber vote** | 1 | JuU15 (2026-04-16) — working-majority discipline signature |

Total unique `dok_id` citations across the 14-artefact package: **≥ 62**. Complete list is machine-extractable via
`grep -rhoE 'HD[0-9A-Za-zÖöÄäÅå]+' analysis/daily/2026-04-19/month-ahead/*.md | sort -u`.

## Upstream sibling runs ingested

| Source | Scope | Reconciled indicators |
|--------|-------|-----------------------|
| [`2026-04-18/weekly-review/`](../../2026-04-18/weekly-review/) | Full 14-artefact Tier-C exemplar | Scenario bands + 16 upstream watchpoints |
| [`2026-04-18/evening-analysis/`](../../2026-04-18/evening-analysis/) | Evening analysis | Working-day indicators |
| [`2026-04-18/realtime-1705/`](../../2026-04-18/realtime-1705/) | Late-day realtime | End-of-day chamber state |
| [`2026-04-17/week-ahead/`](../../2026-04-17/week-ahead/) | Week-ahead forecast | Carries week-ahead vote calendar |
| [`2026-04-17/realtime-1434/`](../../2026-04-17/realtime-1434/) | Afternoon realtime | Intraday committee signals |
| [`2026-04-16/evening-analysis/`](../../2026-04-16/evening-analysis/) | JuU15 145–142 vote | Vote-discipline signature baseline |
| [`2026-04-15/evening-analysis/`](../../2026-04-15/evening-analysis/) | Evening analysis | Pre-vote committee positioning |

## External public-data sources

| Source | File | Scope |
|--------|------|-------|
| World Bank Open Data API | [`economic-data.json`](economic-data.json) | Nordic GDP (NY.GDP.MKTP.KD.ZG), unemployment (SL.UEM.TOTL.ZS), inflation (FP.CPI.TOTL.ZG) 2021–2025 |
| `data.riksdagen.se` calendar feeds | Live queries | Europe Day (9 May), FöU/EUN committee schedules, Open-House weekend (14–15 May) |

## Raw document download (data-only helper — not invoked for this aggregation run)

The fields below are from the `download-parliamentary-data` helper. They are `0` because the aggregation
workflow does not invoke that helper. This is **not** a data-quality issue — all cited evidence is sourced
through the live MCP channel above and cross-referenced to the upstream sibling runs.

- **propositions**: 0 documents (helper not invoked)
- **motions**: 0 documents (helper not invoked)
- **committeeReports**: 0 documents (helper not invoked)
- **votes**: 0 documents (helper not invoked)
- **speeches**: 0 documents (helper not invoked)
- **questions**: 0 documents (helper not invoked)
- **interpellations**: 0 documents (helper not invoked)

> ℹ️ **Data-Only Pipeline**: The raw-document helper downloads and persists documents when invoked; this
> aggregation run intentionally uses live MCP queries + upstream synthesis (per
> `SHARED_PROMPT_PATTERNS.md`). All political intelligence analysis (classification, risk assessment, SWOT,
> threat analysis, stakeholder perspectives, significance scoring, cross-references, and synthesis) is
> performed by the AI agent following `analysis/methodologies/ai-driven-analysis-guide.md` and using
> templates from `analysis/templates/`.

## Data Quality Notes

- All `HD*` documents cited are sourced from the official `riksdag-regering-mcp` API.
- Upstream synthesis follows the 14-day lookback policy for `month-ahead` per
  `SHARED_PROMPT_PATTERNS.md` §"RECENT DAILY KNOWLEDGE-BASE SYNTHESIS".
- Upstream watchpoint reconciliation is auditable: **16 indicators in → 16 indicators reconciled →
  0 silent drops** (see `methodology-reflection.md` §"Upstream Watchpoint Reconciliation").
