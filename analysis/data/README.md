<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">📂 Riksdagsmonitor — MCP Data Repository</h1>

<p align="center">
  <strong>🗄️ Persistent Storage for All MCP-Sourced Political Intelligence Data</strong><br>
  <em>📋 Documents · 🗳️ Votes · 🎤 Speeches · 📅 Events · 👤 MPs · 🏛️ Government</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

---

## 🎯 Purpose

The `analysis/data/` directory provides **persistent, version-controlled storage** for all raw data fetched from MCP servers (riksdag-regering-mcp and other sources). Every document, vote, event, or data item accessed via MCP tools is committed here for:

- ✅ **Verification**: All source data is auditable and traceable
- 🔄 **Reuse**: Cached data avoids redundant MCP calls across workflows
- 📊 **Historical tracking**: Time-series data preserved for trend analysis
- 🔍 **Reproducibility**: Analysis can be re-run against stored data
- 📐 **Consistency**: Standardised filenames using official Riksdag IDs

---

## 📁 Directory Structure

```
analysis/data/
├── README.md                              ← This file
├── documents/                             ← Parliamentary documents by type
│   ├── propositions/                      ← Government propositions (prop)
│   │   └── {dok_id}.json                  ← e.g., h901fiu1.json
│   ├── motions/                           ← Parliamentary motions (mot)
│   │   └── {dok_id}.json
│   ├── committeeReports/                  ← Committee reports (bet)
│   │   └── {dok_id}.json
│   ├── votes/                             ← Voting records (votering)
│   │   └── {dok_id}.json
│   ├── speeches/                          ← Parliamentary speeches (anföranden)
│   │   └── {dok_id}.json
│   ├── questions/                         ← Written questions (fr)
│   │   └── {dok_id}.json
│   ├── interpellations/                   ← Interpellations (ip)
│   │   └── {dok_id}.json
│   └── government/                        ← Government documents (SOU, Ds, etc.)
│       └── {dok_id}.json
├── votes/                                 ← Voting ballots (date-stamped)
│   └── {YYYY-MM-DD}/                      ← Vote date directory
│       └── {bet}-punkt-{N}.json           ← e.g., 2026-03-26/fiu1-punkt-1.json
├── events/                                ← Calendar events (date-stamped)
│   └── {YYYY-MM-DD}/                      ← Event date directory
│       └── {event-id}.json                ← Individual event records
└── mps/                                   ← Member of Parliament profiles
    └── {intressent_id}.json               ← e.g., 0123456789.json
```

---

## 📛 Filename Conventions

All filenames are derived from official Riksdag identifiers to ensure consistency:

| Data Type | ID Source | Filename Pattern | Example |
|-----------|-----------|-----------------|---------|
| Documents | `dok_id` | `{sanitized_dok_id}.json` | `h901fiu1.json` |
| Votes | `bet` + `punkt` | `{bet}-punkt-{N}.json` | `fiu1-punkt-1.json` |
| Events | Calendar event ID | `{event-id}.json` | `utsk-2026-03-26-fiu.json` |
| MPs | `intressent_id` | `{intressent_id}.json` | `0123456789.json` |
| Government | Document path/ID | `{sanitized_id}.json` | `sou-2025-42.json` |

**Sanitization rules** (from `sanitizeDokId()`):
- Lowercase all characters
- Replace non-alphanumeric characters (except `åäö-`) with hyphens
- Collapse consecutive hyphens
- Strip leading/trailing hyphens
- Truncate to 100 characters

---

## 🔄 Update Strategy

Data files support **upsert** semantics — new data overwrites existing files:

1. **Immutable data** (votes, speeches on a specific date): Written once, never updated
2. **Mutable data** (MP profiles, ongoing documents): Updated on each pipeline run
3. **Date-stamped data** (vote ballots, events): Stored under date directories, immutable once created

Each JSON file includes a `_metadata` field tracking provenance:

```json
{
  "_metadata": {
    "fetchedAt": "2026-03-28T10:00:00Z",
    "mcpTool": "get_propositioner",
    "riksmote": "2025/26",
    "documentType": "propositions"
  },
  "dok_id": "H901FiU1",
  "titel": "...",
  ...
}
```

---

## 📄 Binary Document Handling

Some parliamentary documents are available only as PDF. The pipeline:

1. Downloads the PDF binary
2. Converts to text using `pdftotext` (poppler-utils) or equivalent
3. Stores the text/markdown version alongside the JSON metadata
4. Filename convention: `{dok_id}.txt` or `{dok_id}.md` for converted content

---

## 🔗 Integration with Analysis Pipeline

The data persistence layer is invoked by `scripts/pre-article-analysis.ts`:

```
MCP Server → data-downloader.ts → data-persistence.ts → analysis/data/
                                         ↓
                                   analysis/daily/YYYY-MM-DD/documents/  (per-run copies)
```

- **`data-persistence.ts`**: Saves raw data to `analysis/data/` with consistent IDs
- **`data-downloader.ts`**: Downloads from MCP, returns typed collections
- **`pre-article-analysis.ts`**: Orchestrates download → persist → analyse → serialize

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
