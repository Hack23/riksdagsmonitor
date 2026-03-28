<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">📂 Riksdagsmonitor — MCP Data Repository</h1>

<p align="center">
  <strong>🗄️ Persistent Storage for All MCP-Sourced Political Intelligence Data</strong><br>
  <em>📋 Documents · 🗳️ Votes · 🎤 Speeches · 📅 Events · 👤 MPs · 🏛️ Government · 📊 SCB · 🌍 World Bank</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-2.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

---

## 🎯 Purpose

The `analysis/data/` directory provides **persistent, version-controlled storage** for all raw data fetched from MCP servers (riksdag-regering-mcp, SCB, World Bank, and other sources). Every document, vote, event, or data item accessed via MCP tools is committed here for:

- ✅ **Verification**: All source data is auditable and traceable
- 🔄 **Reuse**: Cached data avoids redundant MCP calls across workflows
- 📊 **Historical tracking**: Time-series data preserved for trend analysis
- 🔍 **Reproducibility**: Analysis can be re-run against stored data
- 📐 **Consistency**: Standardised filenames using official IDs
- 🔀 **Collision-free**: Parallel workflows produce identical output (no merge conflicts)

---

## 🔀 Collision-Free Design (v2)

**Problem**: Parallel agentic workflows (propositions, motions, committee-reports, etc.) run simultaneously and may fetch the same document. If metadata (timestamps) is embedded in the data file, different workflows produce different JSON for the same document, causing git merge conflicts.

**Solution**: Data files and metadata are strictly separated:

| File | Contains | Collision behaviour |
|------|----------|-------------------|
| `{id}.json` | Raw source data ONLY | ✅ Identical across parallel runs |
| `{id}.meta.json` | Provenance (timestamp, tool, riksmöte) | ⚠️ Safely overwritten (last-write-wins) |

This ensures that two workflows writing the same `h901fiu1.json` produce byte-identical output, eliminating git merge conflicts.

---

## 📁 Directory Structure

```
analysis/data/
├── README.md                              ← This file
├── documents/                             ← Parliamentary documents by type
│   ├── propositions/                      ← Government propositions (prop)
│   │   ├── {dok_id}.json                  ← Raw data only
│   │   └── {dok_id}.meta.json             ← Provenance sidecar
│   ├── motions/                           ← Parliamentary motions (mot)
│   ├── committeeReports/                  ← Committee reports (bet)
│   ├── votes/                             ← Voting records (votering)
│   ├── speeches/                          ← Parliamentary speeches (anföranden)
│   ├── questions/                         ← Written questions (fr)
│   ├── interpellations/                   ← Interpellations (ip)
│   └── government/                        ← Government documents (SOU, Ds, etc.)
├── votes/                                 ← Date-stamped vote ballots
│   └── {YYYY-MM-DD}/                      ← Vote date directory
│       ├── {dok_id}.json                  ← Raw data
│       └── {dok_id}.meta.json             ← Provenance
├── events/                                ← Calendar events (date-stamped)
│   └── {YYYY-MM-DD}/
│       ├── {event-id}.json
│       └── {event-id}.meta.json
├── mps/                                   ← Member of Parliament profiles
│   ├── {intressent_id}.json
│   └── {intressent_id}.meta.json
├── worldbank/                             ← World Bank economic indicators
│   └── {indicator-id}/                    ← e.g., ny-gdp-mktp-cd/
│       ├── {country}.json                 ← Raw API response
│       └── {country}.meta.json            ← Provenance
├── scb/                                   ← Statistics Sweden (SCB) table data
│   ├── {table-id}.json                    ← Raw table data
│   └── {table-id}.meta.json               ← Provenance
└── mcp-responses/                         ← Generic MCP tool responses
    └── {server}/                          ← MCP server identifier
        └── {tool}/                        ← Tool name
            ├── {id}.json                  ← Raw response
            └── {id}.meta.json             ← Provenance + params
```

---

## 📛 Filename Conventions

All filenames are derived from official identifiers to ensure consistency:

| Data Type | ID Source | Filename Pattern | Example |
|-----------|-----------|-----------------|---------|
| Documents | `dok_id` | `{sanitized_dok_id}.json` | `h901fiu1.json` |
| Votes | `dok_id` | `{dok_id}.json` under `votes/{date}/` | `votes/2026-03-26/h901fiu1.json` |
| Events | Calendar event ID | `{event-id}.json` | `utsk-2026-03-26-fiu.json` |
| MPs | `intressent_id` | `{intressent_id}.json` | `0123456789.json` |
| World Bank | indicator + country | `{indicator}/{country}.json` | `ny-gdp-mktp-cd/swe.json` |
| SCB | table ID | `{table-id}.json` | `be0101a.json` |
| MCP generic | server/tool/id | `{server}/{tool}/{id}.json` | `riksdag-regering/get_propositioner/h901fiu1.json` |

**Sanitization rules** (from `sanitizeDokId()`):
- Lowercase all characters
- Replace non-alphanumeric characters (except `åäö-`) with hyphens
- Collapse consecutive hyphens
- Strip leading/trailing hyphens
- Truncate to 100 characters

---

## 🔄 Update Strategy

Data files support **upsert** semantics — new data overwrites existing files:

1. **Immutable data** (votes, speeches on a specific date): Written once, deterministic
2. **Mutable data** (MP profiles, ongoing documents): Updated on each pipeline run
3. **Date-stamped data** (vote ballots, events): Stored under date directories

Provenance is tracked in separate `.meta.json` sidecar files:

```json
{
  "fetchedAt": "2026-03-28T10:00:00Z",
  "mcpTool": "get_propositioner",
  "riksmote": "2025/26",
  "documentType": "propositions"
}
```

---

## 🔗 Integration with Analysis Pipeline

The data persistence layer is invoked by two entry points:

### `scripts/pre-article-analysis.ts` (Analysis Pipeline)

```
MCP Server → data-downloader.ts → data-persistence.ts → analysis/data/
                                         ↓
                                   analysis/daily/YYYY-MM-DD/documents/  (per-run copies)
```

### `scripts/populate-analysis-data.ts` (Standalone Data Fetcher)

Fetches **all** data types from **all** MCP sources and populates `analysis/data/` with recent data:

```bash
# Fetch all data types with defaults (20 per type, today's date)
npx tsx scripts/populate-analysis-data.ts

# Custom limit and date
npx tsx scripts/populate-analysis-data.ts --limit 50 --date 2026-03-28
```

**Data types fetched (7 steps):**
1. 📄 **Documents** (7 types): propositions, motions, committeeReports, votes, speeches, questions, interpellations → `documents/{type}/`
2. 📅 **Calendar events**: upcoming 14-day parliamentary schedule → `events/{date}/`
3. 👤 **MP profiles**: current member data → `mps/`
4. 🏛️ **Government documents**: recent publications from regeringen.se → `mcp-responses/riksdag-regering/search_regering/`
5. 🗳️ **Voting groups**: party-level voting patterns → `mcp-responses/riksdag-regering/get_voting_group/`
6. 🌍 **World Bank indicators**: 16 economic indicators for Sweden (GDP, unemployment, inflation, etc.) → `worldbank/{indicator}/`
7. 📊 **SCB statistics**: key Swedish statistics across 15 policy domains (labour, fiscal, education, etc.) → `scb/`

### Key Modules

- **`data-persistence.ts`**: Saves raw data to `analysis/data/` with consistent IDs (no metadata in data files)
- **`data-downloader.ts`**: Downloads from MCP, returns typed collections
- **`pre-article-analysis.ts`**: Orchestrates download → persist → analyse → serialize
- **`populate-analysis-data.ts`**: Standalone script to populate all data types

---

## 📚 Related Documentation

- [📂 analysis/README.md](../README.md) — Analysis directory overview
- [📐 ARCHITECTURE.md](../../ARCHITECTURE.md) — System architecture
- [📊 DATA_MODEL.md](../../DATA_MODEL.md) — Data model documentation
- [🔐 SECURITY_ARCHITECTURE.md](../../SECURITY_ARCHITECTURE.md) — Security controls

---

**Document Control:**
- **Repository:** https://github.com/Hack23/riksdagsmonitor
- **Path:** `/analysis/data/README.md`
- **Format:** Markdown
- **Classification:** Public


