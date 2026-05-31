# Data Download Manifest — Tidö Mandate Cycle (current anchor) — 2026-05-31

**Anchor**: `current` · **Horizon**: [horizon:cycle] · Source root: https://data.riksdagen.se/

## Corpus

The cycle analysis reuses the same-date download of 25 documents persisted at `analysis/daily/2026-05-31/documents/` and `analysis/daily/2026-05-31/full-text/` (10 full-text). The curated evidence spine (10 dok_ids) is:

| dok_id | Domain | Full text |
|---|---|---|
| HD01SfU35 | Migration reception law | Yes |
| HD024194 | Citizenship transition | Yes |
| HD01JuU37 | Young offenders | Yes |
| HD01JuU33 | E-evidence / EU | Yes |
| HD10526 | Equalisation | Yes |
| HD10524 | A-kassa / labour | Yes |
| HD03130 | AP-funds / pensions | Yes |
| HD01SoU32 | Municipal health | Yes |
| HD01UbU25 | Education | Yes |
| HD01UU10 | EU annual | Yes |

## Retrieval

- Tool: `scripts/download-parliamentary-data.ts --date 2026-05-31 --lookback 365 --limit 30`.
- Result: 25 documents, 10 with full text, manifest at `analysis/daily/2026-05-31/data-download-manifest.md`.
- MCP: `riksdag-regering` HTTP server (see `mcp-reliability-audit.md`).

## IMF vintage pin

- **Vintage**: WEO Apr-2026 (`data/imf-context.json`).
- **Retrieved_at**: pinned snapshot, vintage age ~1 month (within 6-month freshness window — no staleness annotation required).
- **Payload integrity**: snapshot hash recorded in `data/imf-context.json`; live IMF fetch degraded during run, pinned vintage authoritative.
- **Indicators used**: real GDP growth ~2.1% [T+1], ~1.9% [T+2]; general government gross debt ~34% of GDP [T+1]; inflation converging to target [T+1]. All article/analysis macro claims stamped `T+N` against this vintage.

Source: https://data.riksdagen.se/ · IMF WEO Apr-2026.
